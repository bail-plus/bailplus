import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PropertyWithUnits } from '@/hooks/properties/useProperties';
import { calculateTax, calculateMonthlyPayment, type TaxInputs } from '@/lib/taxCalculator';

export interface PropertyProfitability {
  propertyId: string;
  propertyName: string;
  annualRentalIncome: number;
  totalIncome: number; // Loyers + autres revenus
  totalInvestment: number;
  annualCharges: number;
  annualNetCashFlow: number;
  grossYield: number;
  netYield: number;
  // Données après impôts
  totalTax: number;
  annualNetCashFlowAfterTax: number;
  netYieldAfterTax: number;
  hasTaxData: boolean;
}

export interface GlobalProfitability {
  totalInvestment: number;
  totalAnnualIncome: number;
  totalAnnualCharges: number;
  totalNetCashFlow: number;
  averageGrossYield: number;
  averageNetYield: number;
  // Données après impôts
  totalTax: number;
  totalNetCashFlowAfterTax: number;
  averageNetYieldAfterTax: number;
  properties: PropertyProfitability[];
}

/**
 * Calcule la rentabilité d'une propriété
 */
function calculatePropertyProfitability(
  property: PropertyWithUnits,
  annualRentalIncome: number
): PropertyProfitability {
  // Investissement total
  const totalInvestment =
    (property.purchase_price ?? 0) +
    (property.notary_fees ?? 0) +
    (property.agency_fees ?? 0) +
    (property.renovation_costs ?? 0) +
    (property.other_acquisition_costs ?? 0);

  // Revenus totaux
  const totalIncome = annualRentalIncome + (property.other_income ?? 0);

  // Mensualités crédit immobilier (annuelles)
  let annualLoanPayments = 0;
  if (property.has_loan && property.loan_amount && property.loan_rate && property.loan_duration_months) {
    const monthlyPayment = calculateMonthlyPayment(
      property.loan_amount,
      property.loan_rate,
      property.loan_duration_months
    );
    annualLoanPayments = monthlyPayment * 12;
  }

  // Charges annuelles (sans les mensualités pour le calcul fiscal)
  const annualChargesWithoutLoan =
    (property.property_tax ?? 0) +
    (property.housing_tax ?? 0) +
    (property.condo_fees_annual ?? 0) +
    (property.insurance_annual ?? 0) +
    annualRentalIncome * ((property.management_fees_percentage ?? 0) / 100);

  // Charges totales incluant mensualités (pour le cash-flow)
  const annualCharges = annualChargesWithoutLoan + annualLoanPayments;

  // Cash-flow net (avant impôts)
  const annualNetCashFlow = totalIncome - annualCharges;

  // Rentabilités (avant impôts)
  const grossYield = totalInvestment > 0 ? (totalIncome / totalInvestment) * 100 : 0;
  const netYield = totalInvestment > 0 ? (annualNetCashFlow / totalInvestment) * 100 : 0;

  // Calcul fiscal (sans les mensualités car le calculateur gère les intérêts séparément)
  const taxInputs: TaxInputs = {
    taxStructure: property.tax_structure || null,
    taxRegime: property.tax_regime || null,
    annualRentalIncome: totalIncome,
    annualCharges: annualChargesWithoutLoan,
    marginalTaxRate: property.marginal_tax_rate || null,
    socialContributionsRate: property.social_contributions_rate || 17.2,
    corporateTaxRate: property.corporate_tax_rate || null,
    dividendDistributionPercentage: property.dividend_distribution_percentage || null,
    propertyAmortizationDuration: property.property_amortization_duration || null,
    furnitureAmortizationDuration: property.furniture_amortization_duration || null,
    furnitureValue: property.furniture_value || null,
    propertyValue: property.purchase_price || null,
    hasLoan: property.has_loan || false,
    loanAmount: property.loan_amount || null,
    loanRate: property.loan_rate || null,
    loanDurationMonths: property.loan_duration_months || null,
    loanStartDate: property.loan_start_date || null,
  };

  const taxResults = calculateTax(taxInputs);
  const hasTaxData = !!(property.tax_structure && property.tax_regime);

  // Cash-flow après impôts
  const annualNetCashFlowAfterTax = annualNetCashFlow - taxResults.totalTax;
  const netYieldAfterTax = totalInvestment > 0 ? (annualNetCashFlowAfterTax / totalInvestment) * 100 : 0;

  return {
    propertyId: property.id,
    propertyName: property.name,
    annualRentalIncome,
    totalIncome,
    totalInvestment,
    annualCharges,
    annualNetCashFlow,
    grossYield,
    netYield,
    totalTax: taxResults.totalTax,
    annualNetCashFlowAfterTax,
    netYieldAfterTax,
    hasTaxData,
  };
}

/**
 * Récupère les loyers annuels pour une propriété en se basant sur les baux actifs
 */
async function fetchPropertyRentalIncome(propertyId: string): Promise<number> {
  try {
    // 1. Récupérer tous les units de la propriété
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id')
      .eq('property_id', propertyId);

    if (unitsError) throw unitsError;
    if (!units || units.length === 0) return 0;

    const unitIds = units.map((u) => u.id);

    // 2. Récupérer tous les baux actifs pour ces units
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select('rent_amount')
      .in('unit_id', unitIds)
      .eq('status', 'active');

    if (leasesError) throw leasesError;
    if (!leases || leases.length === 0) return 0;

    // 3. Calculer le total annuel (loyer mensuel × 12)
    const annualIncome = leases.reduce((sum, lease) => {
      return sum + (lease.rent_amount ?? 0) * 12;
    }, 0);

    return annualIncome;
  } catch (error) {
    console.error('Erreur calcul revenus locatifs:', error);
    return 0;
  }
}

/**
 * Hook pour récupérer la rentabilité globale de toutes les propriétés
 */
export function useGlobalProfitability(properties: PropertyWithUnits[]) {
  return useQuery({
    queryKey: ['globalProfitability', properties.map((p) => `${p.id}-${p.updated_at || Date.now()}`)],
    queryFn: async (): Promise<GlobalProfitability> => {
      // Calculer les revenus locatifs pour chaque propriété
      const profitabilityPromises = properties.map(async (property) => {
        const annualRentalIncome = await fetchPropertyRentalIncome(property.id);
        return calculatePropertyProfitability(property, annualRentalIncome);
      });

      const propertiesProfitability = await Promise.all(profitabilityPromises);

      // Filtrer uniquement les propriétés avec des données d'investissement
      const propertiesWithData = propertiesProfitability.filter(p => p.totalInvestment > 0);

      // Calculer les totaux (uniquement pour les propriétés avec investissement)
      const totalInvestment = propertiesWithData.reduce(
        (sum, p) => sum + p.totalInvestment,
        0
      );
      const totalAnnualIncome = propertiesWithData.reduce(
        (sum, p) => sum + p.totalIncome,
        0
      );
      const totalAnnualCharges = propertiesWithData.reduce(
        (sum, p) => sum + p.annualCharges,
        0
      );
      const totalNetCashFlow = propertiesWithData.reduce(
        (sum, p) => sum + p.annualNetCashFlow,
        0
      );
      const totalTax = propertiesWithData.reduce(
        (sum, p) => sum + p.totalTax,
        0
      );
      const totalNetCashFlowAfterTax = propertiesWithData.reduce(
        (sum, p) => sum + p.annualNetCashFlowAfterTax,
        0
      );

      // Rentabilités moyennes
      const averageGrossYield =
        totalInvestment > 0 ? (totalAnnualIncome / totalInvestment) * 100 : 0;
      const averageNetYield =
        totalInvestment > 0 ? (totalNetCashFlow / totalInvestment) * 100 : 0;
      const averageNetYieldAfterTax =
        totalInvestment > 0 ? (totalNetCashFlowAfterTax / totalInvestment) * 100 : 0;

      return {
        totalInvestment,
        totalAnnualIncome,
        totalAnnualCharges,
        totalNetCashFlow,
        averageGrossYield,
        averageNetYield,
        totalTax,
        totalNetCashFlowAfterTax,
        averageNetYieldAfterTax,
        properties: propertiesProfitability,
      };
    },
    enabled: properties.length > 0,
    staleTime: 0, // Always refetch to get latest data
    gcTime: 0, // Don't keep in cache
    refetchOnWindowFocus: true, // Refetch when user returns to window
    refetchOnMount: true, // Refetch on component mount
  });
}

/**
 * Hook pour récupérer la rentabilité d'une seule propriété
 */
export function usePropertyProfitability(property: PropertyWithUnits | null) {
  return useQuery({
    queryKey: ['propertyProfitability', property?.id],
    queryFn: async (): Promise<PropertyProfitability | null> => {
      if (!property) return null;
      const annualRentalIncome = await fetchPropertyRentalIncome(property.id);
      return calculatePropertyProfitability(property, annualRentalIncome);
    },
    enabled: !!property?.id,
    staleTime: 0, // Always refetch to get latest data
    gcTime: 0, // Don't keep in cache
    refetchOnWindowFocus: true, // Refetch when user returns to window
    refetchOnMount: true, // Refetch on component mount
  });
}
