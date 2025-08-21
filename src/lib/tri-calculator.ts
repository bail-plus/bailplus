// TRI (Taux de Rendement Interne) Calculator
// Moteur de calcul pur TypeScript pour simulation d'investissement immobilier

export type FiscalRegime = 'micro-foncier' | 'foncier-reel' | 'lmnp-micro' | 'lmnp-reel';
export type PaymentFrequency = 'monthly' | 'annual';
export type DeferredType = 'none' | 'interest-only' | 'total';

export interface TriInputs {
  // Coût d'achat
  acquisitionPrice: number;
  furniturePrice: number;
  notaryFees: number;
  agencyFees: number;
  worksCost: number;
  worksDeductible: boolean;

  // Revenus & charges
  rents: number;
  rentsFrequency: PaymentFrequency;
  charges: number;
  chargesFrequency: PaymentFrequency;
  rentsGrowthRate: number; // %
  chargesGrowthRate: number; // %
  vacancyRate: number; // %

  // Financement
  downPayment: number;
  loanAmount?: number; // auto-calculé si non fourni
  loanDurationMonths: number;
  loanRate: number; // % annuel
  insuranceRate: number; // % annuel sur capital initial
  deferredType: DeferredType;
  deferredMonths: number;

  // Fiscalité
  fiscalRegime: FiscalRegime;
  marginalTaxRate: number; // %
  socialTaxRate: number; // %

  // Cession
  holdingPeriodYears: number;
  resaleValue: number;
  capitalGainsTaxRate: number; // %

  // Actualisation
  discountRate: number; // % pour VAN
}

export interface TriYearRow {
  year: number;
  rents: number;
  charges: number;
  interests: number;
  works: number;
  amortizations: number;
  incomeTax: number;
  socialTax: number;
  totalTax: number;
  cashflow: number;
  cumulative: number;
}

export interface TriResult {
  irrAnnual: number;
  npv: number;
  paybackYear?: number;
  cashflowYear1Monthly: number;
  cashflowYear1Annual: number;
  cashflowsMonthly: number[];
  rows: TriYearRow[];
  interpretation: string;
  totalInvestment: number;
}

// Échéancier de prêt
interface LoanScheduleItem {
  month: number;
  interest: number;
  principal: number;
  insurance: number;
  remainingCapital: number;
  totalPayment: number;
}

function calculateLoanSchedule(
  amount: number,
  annualRate: number,
  durationMonths: number,
  annualInsuranceRate: number,
  deferredType: DeferredType,
  deferredMonths: number
): LoanScheduleItem[] {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyInsurance = (annualInsuranceRate / 100 * amount) / 12;
  
  let remainingCapital = amount;
  const schedule: LoanScheduleItem[] = [];
  
  // Calculer la mensualité (hors assurance) après différé
  const effectiveDuration = durationMonths - (deferredType === 'total' ? deferredMonths : 0);
  const monthlyPayment = monthlyRate > 0 
    ? (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -effectiveDuration))
    : amount / effectiveDuration;

  for (let month = 1; month <= durationMonths; month++) {
    let interest = remainingCapital * monthlyRate;
    let principal = 0;
    let totalPayment = monthlyInsurance;

    if (month <= deferredMonths) {
      if (deferredType === 'interest-only') {
        totalPayment += interest;
      } else if (deferredType === 'total') {
        // Accumulation des intérêts
        remainingCapital += interest;
        interest = 0;
      }
    } else {
      if (deferredType === 'total' && month === deferredMonths + 1) {
        // Recalculer la mensualité après différé total
        const newDuration = durationMonths - deferredMonths;
        const newMonthlyPayment = monthlyRate > 0
          ? (remainingCapital * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -newDuration))
          : remainingCapital / newDuration;
        principal = Math.min(newMonthlyPayment - interest, remainingCapital);
      } else {
        principal = Math.min(monthlyPayment - interest, remainingCapital);
      }
      totalPayment += interest + principal;
      remainingCapital -= principal;
    }

    schedule.push({
      month,
      interest,
      principal,
      insurance: monthlyInsurance,
      remainingCapital: Math.max(0, remainingCapital),
      totalPayment
    });
  }

  return schedule;
}

// Calcul des amortissements LMNP réel
function calculateAmortizations(
  inputs: TriInputs,
  year: number
): number {
  if (inputs.fiscalRegime !== 'lmnp-reel') return 0;

  let totalAmortization = 0;

  // Amortissement immobilier (80% du coût, 25 ans)
  const buildingCost = 0.8 * (inputs.acquisitionPrice + inputs.notaryFees + (inputs.worksDeductible ? inputs.worksCost : 0));
  const buildingAmortization = buildingCost / 25;
  
  // Amortissement mobilier (7 ans)
  const furnitureAmortization = inputs.furniturePrice / 7;

  if (year <= 25) totalAmortization += buildingAmortization;
  if (year <= 7) totalAmortization += furnitureAmortization;

  return totalAmortization;
}

// Calcul de la base fiscale
function calculateTaxableIncome(
  inputs: TriInputs,
  annualRents: number,
  annualCharges: number,
  annualInterests: number,
  annualWorks: number,
  amortizations: number
): { taxableIncome: number; incomeTax: number; socialTax: number } {
  let taxableBase = 0;

  switch (inputs.fiscalRegime) {
    case 'micro-foncier':
      taxableBase = annualRents * 0.7; // -30%
      break;
    
    case 'foncier-reel':
      taxableBase = annualRents - annualCharges - annualInterests - annualWorks;
      break;
    
    case 'lmnp-micro':
      taxableBase = annualRents * 0.5; // -50%
      break;
    
    case 'lmnp-reel':
      taxableBase = annualRents - annualCharges - annualInterests - annualWorks - amortizations;
      break;
  }

  // Les déficits ne génèrent pas d'économie d'impôt dans cette simulation simplifiée
  const positiveBase = Math.max(taxableBase, 0);
  
  const incomeTax = positiveBase * (inputs.marginalTaxRate / 100);
  const socialTax = positiveBase * (inputs.socialTaxRate / 100);

  return {
    taxableIncome: taxableBase,
    incomeTax,
    socialTax
  };
}

// Implémentation robuste de l'IRR
function calculateIRR(cashflows: number[], tolerance = 1e-7, maxIterations = 100): number {
  // Vérifier s'il y a au moins un flux positif et un négatif
  const hasPositive = cashflows.some(cf => cf > 0);
  const hasNegative = cashflows.some(cf => cf < 0);
  
  if (!hasPositive || !hasNegative) return NaN;

  // Newton-Raphson
  let rate = 0.1; // Taux initial 10%
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let t = 0; t < cashflows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += cashflows[t] / factor;
      dnpv -= t * cashflows[t] / Math.pow(1 + rate, t + 1);
    }
    
    if (Math.abs(npv) < tolerance) return rate;
    if (Math.abs(dnpv) < tolerance) break;
    
    const newRate = rate - npv / dnpv;
    
    // Éviter les taux négatifs extrêmes
    if (newRate < -0.99) {
      rate = -0.5;
    } else if (newRate > 10) {
      rate = 1;
    } else {
      rate = newRate;
    }
  }
  
  // Si Newton-Raphson n'a pas convergé, utiliser la bissection
  let low = -0.99;
  let high = 10;
  
  for (let i = 0; i < maxIterations; i++) {
    rate = (low + high) / 2;
    
    let npv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + rate, t);
    }
    
    if (Math.abs(npv) < tolerance) return rate;
    
    if (npv > 0) {
      low = rate;
    } else {
      high = rate;
    }
  }
  
  return rate;
}

// Calcul de la VAN
function calculateNPV(cashflows: number[], discountRate: number): number {
  const monthlyDiscountRate = discountRate / 100 / 12;
  let npv = 0;
  
  for (let t = 0; t < cashflows.length; t++) {
    npv += cashflows[t] / Math.pow(1 + monthlyDiscountRate, t);
  }
  
  return npv;
}

// Fonction principale de calcul
export function computeTri(inputs: TriInputs): TriResult {
  // Validation des inputs
  const totalCost = inputs.acquisitionPrice + inputs.furniturePrice + inputs.notaryFees + inputs.agencyFees + inputs.worksCost;
  const loanAmount = inputs.loanAmount || (totalCost - inputs.downPayment);
  const totalInvestment = inputs.downPayment + (inputs.worksCost * (inputs.worksDeductible ? 0 : 1));

  // Conversion en valeurs mensuelles
  const monthlyRents = inputs.rentsFrequency === 'monthly' ? inputs.rents : inputs.rents / 12;
  const monthlyCharges = inputs.chargesFrequency === 'monthly' ? inputs.charges : inputs.charges / 12;

  // Échéancier de prêt
  const loanSchedule = calculateLoanSchedule(
    loanAmount,
    inputs.loanRate,
    inputs.loanDurationMonths,
    inputs.insuranceRate,
    inputs.deferredType,
    inputs.deferredMonths
  );

  // Calcul des flux mensuels
  const cashflowsMonthly: number[] = [];
  const rows: TriYearRow[] = [];
  
  // Flux initial (investissement)
  cashflowsMonthly.push(-totalInvestment);

  let cumulativeCashflow = -totalInvestment;
  let paybackYear: number | undefined;

  // Calcul par année
  for (let year = 1; year <= inputs.holdingPeriodYears; year++) {
    const yearStartMonth = (year - 1) * 12 + 1;
    const yearEndMonth = Math.min(year * 12, inputs.loanDurationMonths);

    // Revenus et charges annuels avec croissance
    const growthFactor = Math.pow(1 + inputs.rentsGrowthRate / 100, year - 1);
    const chargesGrowthFactor = Math.pow(1 + inputs.chargesGrowthRate / 100, year - 1);
    
    const annualRentsGross = monthlyRents * 12 * growthFactor;
    const annualRentsNet = annualRentsGross * (1 - inputs.vacancyRate / 100);
    const annualCharges = monthlyCharges * 12 * chargesGrowthFactor;

    // Intérêts et remboursements de l'année
    let annualInterests = 0;
    let annualPrincipal = 0;
    let annualInsurance = 0;

    for (let month = yearStartMonth; month <= yearEndMonth; month++) {
      if (month <= loanSchedule.length) {
        const payment = loanSchedule[month - 1];
        annualInterests += payment.interest;
        annualPrincipal += payment.principal;
        annualInsurance += payment.insurance;
      }
    }

    // Travaux (appliqués en année 1)
    const annualWorks = year === 1 && inputs.worksDeductible ? inputs.worksCost : 0;

    // Amortissements
    const amortizations = calculateAmortizations(inputs, year);

    // Calcul fiscal
    const { incomeTax, socialTax } = calculateTaxableIncome(
      inputs,
      annualRentsNet,
      annualCharges,
      annualInterests,
      annualWorks,
      amortizations
    );

    const totalTax = incomeTax + socialTax;

    // Flux de trésorerie annuel
    let annualCashflow = annualRentsNet - annualCharges - (annualInterests + annualPrincipal + annualInsurance) - totalTax;

    // Si c'est la dernière année, ajouter la revente
    if (year === inputs.holdingPeriodYears) {
      const remainingDebt = yearEndMonth < loanSchedule.length ? loanSchedule[yearEndMonth - 1]?.remainingCapital || 0 : 0;
      const capitalGains = Math.max(0, inputs.resaleValue - totalCost);
      const capitalGainsTax = capitalGains * (inputs.capitalGainsTaxRate / 100);
      annualCashflow += inputs.resaleValue - remainingDebt - capitalGainsTax;
    }

    // Répartir le flux annuel sur 12 mois
    const monthlyCashflow = annualCashflow / 12;
    for (let month = 0; month < 12; month++) {
      cashflowsMonthly.push(monthlyCashflow);
    }

    cumulativeCashflow += annualCashflow;
    
    // Déterminer l'année de payback
    if (!paybackYear && cumulativeCashflow > 0) {
      paybackYear = year;
    }

    rows.push({
      year,
      rents: annualRentsNet,
      charges: annualCharges,
      interests: annualInterests,
      works: annualWorks,
      amortizations,
      incomeTax,
      socialTax,
      totalTax,
      cashflow: annualCashflow,
      cumulative: cumulativeCashflow
    });
  }

  // Calcul du TRI
  const irrMonthly = calculateIRR(cashflowsMonthly);
  const irrAnnual = isNaN(irrMonthly) ? NaN : Math.pow(1 + irrMonthly, 12) - 1;

  // Calcul de la VAN
  const npv = calculateNPV(cashflowsMonthly, inputs.discountRate);

  // Interprétation
  let interpretation = "Simulation en cours d'analyse...";
  if (!isNaN(irrAnnual)) {
    if (irrAnnual > inputs.discountRate / 100) {
      interpretation = `Projet acceptable : TRI (${(irrAnnual * 100).toFixed(2)}%) > taux d'actualisation (${inputs.discountRate}%). Rentabilité supérieure au coût d'opportunité.`;
    } else {
      interpretation = `Projet à reconsidérer : TRI (${(irrAnnual * 100).toFixed(2)}%) < taux d'actualisation (${inputs.discountRate}%). Rentabilité insuffisante.`;
    }
  } else {
    interpretation = "TRI non calculable : vérifiez que le projet génère des flux positifs suffisants.";
  }

  return {
    irrAnnual: irrAnnual * 100, // Retourner en %
    npv,
    paybackYear,
    cashflowYear1Monthly: rows[0]?.cashflow / 12 || 0,
    cashflowYear1Annual: rows[0]?.cashflow || 0,
    cashflowsMonthly,
    rows,
    interpretation,
    totalInvestment
  };
}