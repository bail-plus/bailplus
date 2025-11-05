import type { PropertyWithUnits } from '@/hooks/properties/useProperties';
import { calculateTax, calculateMonthlyPayment, type TaxInputs } from '@/lib/taxCalculator';

export interface YearlyProjection {
  year: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  remainingDebt: number;
  netWorth: number;
  annualRevenue: number;
  annualExpenses: number;
  interestPaid: number;
  principalPaid: number;
}

export interface ProjectionData {
  yearlyProjections: YearlyProjection[];
  roiYear: number | null; // Année où le cash-flow cumulé devient positif
  totalCashFlowGenerated: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  finalNetWorth: number;
}

/**
 * Calcule le capital restant dû après N années
 */
function calculateRemainingDebt(
  loanAmount: number,
  annualRate: number,
  totalMonths: number,
  monthsPassed: number
): number {
  if (monthsPassed >= totalMonths) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, totalMonths);

  let remainingDebt = loanAmount;

  for (let i = 0; i < monthsPassed; i++) {
    const interestPayment = remainingDebt * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingDebt -= principalPayment;
  }

  return Math.max(0, remainingDebt);
}

/**
 * Calcule les intérêts et le capital remboursé sur une année
 */
function calculateYearlyLoanPayments(
  loanAmount: number,
  annualRate: number,
  totalMonths: number,
  startMonth: number
): { interestPaid: number; principalPaid: number; totalPaid: number } {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, totalMonths);

  let interestPaid = 0;
  let principalPaid = 0;
  let remainingDebt = calculateRemainingDebt(loanAmount, annualRate, totalMonths, startMonth);

  // Calculer les 12 mois de l'année (ou moins si le prêt se termine)
  const monthsToCalculate = Math.min(12, totalMonths - startMonth);

  for (let i = 0; i < monthsToCalculate; i++) {
    const interestPayment = remainingDebt * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;

    interestPaid += interestPayment;
    principalPaid += principalPayment;
    remainingDebt -= principalPayment;
  }

  return {
    interestPaid,
    principalPaid,
    totalPaid: interestPaid + principalPaid,
  };
}

/**
 * Calcule la projection financière d'une propriété sur N années
 */
export function calculatePropertyProjection(
  property: PropertyWithUnits,
  annualRentalIncome: number,
  projectionYears: number = 25,
  inflationRate: number = 2.0 // Taux d'inflation annuel en %
): ProjectionData {
  const currentYear = new Date().getFullYear();
  const yearlyProjections: YearlyProjection[] = [];

  // Investissement total
  const totalInvestment =
    (property.purchase_price ?? 0) +
    (property.notary_fees ?? 0) +
    (property.agency_fees ?? 0) +
    (property.renovation_costs ?? 0) +
    (property.other_acquisition_costs ?? 0);

  // Valeur du bien (pour le calcul du patrimoine net)
  const propertyValue = property.purchase_price ?? 0;

  // Données du prêt
  const hasLoan = property.has_loan ?? false;
  const loanAmount = property.loan_amount ?? 0;
  const loanRate = property.loan_rate ?? 0;
  const loanDurationMonths = property.loan_duration_months ?? 0;

  let cumulativeCashFlow = -totalInvestment; // On commence avec l'investissement initial négatif
  let roiYear: number | null = null;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  // Simulation année par année
  for (let year = 0; year < projectionYears; year++) {
    const yearNumber = currentYear + year;
    const monthsPassed = year * 12;

    // Revenus avec inflation
    const inflationMultiplier = Math.pow(1 + inflationRate / 100, year);
    const annualRevenue = (annualRentalIncome + (property.other_income ?? 0)) * inflationMultiplier;

    // Charges fixes avec inflation
    const annualChargesWithoutLoan = (
      (property.property_tax ?? 0) +
      (property.housing_tax ?? 0) +
      (property.condo_fees_annual ?? 0) +
      (property.insurance_annual ?? 0) +
      annualRentalIncome * ((property.management_fees_percentage ?? 0) / 100)
    ) * inflationMultiplier;

    // Calcul des mensualités de prêt (intérêts + capital)
    let loanPayments = { interestPaid: 0, principalPaid: 0, totalPaid: 0 };
    if (hasLoan && loanAmount > 0 && monthsPassed < loanDurationMonths) {
      loanPayments = calculateYearlyLoanPayments(loanAmount, loanRate, loanDurationMonths, monthsPassed);
      totalInterestPaid += loanPayments.interestPaid;
      totalPrincipalPaid += loanPayments.principalPaid;
    }

    // Charges totales
    const annualExpenses = annualChargesWithoutLoan + loanPayments.totalPaid;

    // Calcul fiscal
    const taxInputs: TaxInputs = {
      taxStructure: property.tax_structure || null,
      taxRegime: property.tax_regime || null,
      annualRentalIncome: annualRevenue,
      annualCharges: annualChargesWithoutLoan,
      marginalTaxRate: property.marginal_tax_rate || null,
      socialContributionsRate: property.social_contributions_rate || 17.2,
      corporateTaxRate: property.corporate_tax_rate || null,
      dividendDistributionPercentage: property.dividend_distribution_percentage || null,
      propertyAmortizationDuration: property.property_amortization_duration || null,
      furnitureAmortizationDuration: property.furniture_amortization_duration || null,
      furnitureValue: property.furniture_value || null,
      propertyValue: property.purchase_price || null,
      hasLoan: hasLoan,
      loanAmount: loanAmount,
      loanRate: loanRate,
      loanDurationMonths: loanDurationMonths,
      loanStartDate: property.loan_start_date || null,
      currentYear: year, // Pour le calcul des amortissements
    };

    const taxResults = calculateTax(taxInputs);

    // Cash-flow annuel (après impôts)
    const annualCashFlow = annualRevenue - annualExpenses - taxResults.totalTax;

    // Cash-flow cumulé
    cumulativeCashFlow += annualCashFlow;

    // Détection du ROI (première année où le cumulatif devient positif)
    if (roiYear === null && cumulativeCashFlow >= 0) {
      roiYear = year + 1;
    }

    // Dette restante
    const remainingDebt = hasLoan && loanAmount > 0
      ? calculateRemainingDebt(loanAmount, loanRate, loanDurationMonths, (year + 1) * 12)
      : 0;

    // Patrimoine net = Valeur du bien - Dette restante
    // On peut aussi appliquer une appréciation du bien avec l'inflation
    const appreciatedPropertyValue = propertyValue * inflationMultiplier;
    const netWorth = appreciatedPropertyValue - remainingDebt;

    yearlyProjections.push({
      year: yearNumber,
      annualCashFlow,
      cumulativeCashFlow,
      remainingDebt,
      netWorth,
      annualRevenue,
      annualExpenses,
      interestPaid: loanPayments.interestPaid,
      principalPaid: loanPayments.principalPaid,
    });
  }

  const lastYear = yearlyProjections[yearlyProjections.length - 1];

  return {
    yearlyProjections,
    roiYear,
    totalCashFlowGenerated: lastYear?.cumulativeCashFlow ?? 0,
    totalInterestPaid,
    totalPrincipalPaid,
    finalNetWorth: lastYear?.netWorth ?? 0,
  };
}

/**
 * Calcule la projection globale pour toutes les propriétés
 */
export function calculateGlobalProjection(
  propertiesData: Array<{ property: PropertyWithUnits; annualRentalIncome: number }>,
  projectionYears: number = 25,
  inflationRate: number = 2.0
): ProjectionData {
  if (propertiesData.length === 0) {
    return {
      yearlyProjections: [],
      roiYear: null,
      totalCashFlowGenerated: 0,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      finalNetWorth: 0,
    };
  }

  // Calculer la projection pour chaque propriété
  const allProjections = propertiesData.map(({ property, annualRentalIncome }) =>
    calculatePropertyProjection(property, annualRentalIncome, projectionYears, inflationRate)
  );

  // Agréger les résultats année par année
  const yearlyProjections: YearlyProjection[] = [];
  const currentYear = new Date().getFullYear();

  for (let year = 0; year < projectionYears; year++) {
    const yearNumber = currentYear + year;

    let annualCashFlow = 0;
    let cumulativeCashFlow = 0;
    let remainingDebt = 0;
    let netWorth = 0;
    let annualRevenue = 0;
    let annualExpenses = 0;
    let interestPaid = 0;
    let principalPaid = 0;

    allProjections.forEach((projection) => {
      const yearData = projection.yearlyProjections[year];
      if (yearData) {
        annualCashFlow += yearData.annualCashFlow;
        cumulativeCashFlow += yearData.cumulativeCashFlow;
        remainingDebt += yearData.remainingDebt;
        netWorth += yearData.netWorth;
        annualRevenue += yearData.annualRevenue;
        annualExpenses += yearData.annualExpenses;
        interestPaid += yearData.interestPaid;
        principalPaid += yearData.principalPaid;
      }
    });

    yearlyProjections.push({
      year: yearNumber,
      annualCashFlow,
      cumulativeCashFlow,
      remainingDebt,
      netWorth,
      annualRevenue,
      annualExpenses,
      interestPaid,
      principalPaid,
    });
  }

  // Trouver l'année du ROI global
  let roiYear: number | null = null;
  for (let i = 0; i < yearlyProjections.length; i++) {
    if (yearlyProjections[i].cumulativeCashFlow >= 0) {
      roiYear = i + 1;
      break;
    }
  }

  const lastYear = yearlyProjections[yearlyProjections.length - 1];
  const totalInterestPaid = allProjections.reduce((sum, p) => sum + p.totalInterestPaid, 0);
  const totalPrincipalPaid = allProjections.reduce((sum, p) => sum + p.totalPrincipalPaid, 0);

  return {
    yearlyProjections,
    roiYear,
    totalCashFlowGenerated: lastYear?.cumulativeCashFlow ?? 0,
    totalInterestPaid,
    totalPrincipalPaid,
    finalNetWorth: lastYear?.netWorth ?? 0,
  };
}
