/**
 * Calculateur fiscal pour l'immobilier locatif
 * Gère tous les régimes fiscaux français
 */

export type TaxStructure =
  | 'PHYSICAL_PERSON'  // Personne physique
  | 'SCI_IR'           // SCI à l'IR
  | 'SCI_IS'           // SCI à l'IS
  | 'LMNP'             // Loueur Meublé Non Professionnel
  | 'LMP'              // Loueur Meublé Professionnel

export type TaxRegime =
  | 'REEL'             // Régime réel (foncier ou BIC)
  | 'MICRO_FONCIER'    // Micro-foncier (abattement 30%)
  | 'MICRO_BIC'        // Micro-BIC (abattement 50%)
  | 'REEL_SIMPLIFIE'   // Réel simplifié BIC
  | 'REEL_NORMAL'      // Réel normal BIC

export interface TaxInputs {
  // Structure et régime
  taxStructure: TaxStructure | null
  taxRegime: TaxRegime | null

  // Revenus et charges
  annualRentalIncome: number
  annualCharges: number

  // Taux d'imposition
  marginalTaxRate: number | null        // TMI: 0, 11, 30, 41, 45
  socialContributionsRate: number       // Prélèvements sociaux: 17.2%
  corporateTaxRate: number | null       // Taux IS pour SCI IS
  dividendDistributionPercentage: number | null

  // Amortissement (LMNP/LMP)
  propertyAmortizationDuration: number | null
  furnitureAmortizationDuration: number | null
  furnitureValue: number | null
  propertyValue: number | null // Valeur du bien pour calcul amortissement

  // Crédit immobilier
  hasLoan: boolean
  loanAmount: number | null
  loanRate: number | null
  loanDurationMonths: number | null
  loanStartDate: string | null
}

export interface TaxResults {
  // Résultats avant impôts
  grossIncome: number
  deductibleCharges: number
  taxableIncome: number

  // Impôts
  incomeTax: number
  socialContributions: number
  corporateTax: number
  totalTax: number

  // Résultats après impôts
  netIncomeAfterTax: number
  effectiveTaxRate: number

  // Détails
  details: {
    regime: string
    abatement?: number
    amortization?: number
    interestDeduction?: number
    explanation: string
  }
}

/**
 * Calcule la mensualité d'un prêt (formule standard)
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  loanRate: number,
  loanDurationMonths: number
): number {
  if (loanRate === 0) {
    return loanAmount / loanDurationMonths
  }

  const monthlyRate = loanRate / 100 / 12
  const monthlyPayment = loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, loanDurationMonths)) /
    (Math.pow(1 + monthlyRate, loanDurationMonths) - 1)

  return monthlyPayment
}

/**
 * Calcule les intérêts annuels d'un prêt
 */
function calculateAnnualInterest(
  loanAmount: number,
  loanRate: number,
  loanDurationMonths: number,
  loanStartDate: string
): number {
  // Calcul simplifié : on prend une moyenne sur la première année
  // Pour être précis, il faudrait calculer mois par mois
  const monthlyPayment = calculateMonthlyPayment(loanAmount, loanRate, loanDurationMonths)

  // En première année, environ 80-90% de la mensualité est constituée d'intérêts
  // Calcul simplifié : on prend 85% de 12 mensualités
  const annualInterest = monthlyPayment * 12 * 0.85

  return annualInterest
}

/**
 * Calcule l'amortissement annuel pour LMNP/LMP
 */
function calculateAmortization(
  propertyValue: number,
  propertyDuration: number,
  furnitureValue: number,
  furnitureDuration: number
): number {
  const propertyAmortization = propertyValue / propertyDuration
  const furnitureAmortization = furnitureValue / furnitureDuration
  return propertyAmortization + furnitureAmortization
}

/**
 * Calculateur principal
 */
export function calculateTax(inputs: TaxInputs): TaxResults {
  const {
    taxStructure,
    taxRegime,
    annualRentalIncome,
    annualCharges,
    marginalTaxRate,
    socialContributionsRate,
    corporateTaxRate,
    dividendDistributionPercentage,
    propertyAmortizationDuration,
    furnitureAmortizationDuration,
    furnitureValue,
    propertyValue,
    hasLoan,
    loanAmount,
    loanRate,
    loanDurationMonths,
    loanStartDate,
  } = inputs

  // Par défaut, pas d'impôts
  let result: TaxResults = {
    grossIncome: annualRentalIncome,
    deductibleCharges: annualCharges,
    taxableIncome: 0,
    incomeTax: 0,
    socialContributions: 0,
    corporateTax: 0,
    totalTax: 0,
    netIncomeAfterTax: annualRentalIncome - annualCharges,
    effectiveTaxRate: 0,
    details: {
      regime: 'Non défini',
      explanation: 'Structure fiscale non renseignée',
    },
  }

  // Si pas de structure fiscale, on retourne le résultat par défaut
  if (!taxStructure || !taxRegime) {
    return result
  }

  // Calcul des intérêts déductibles
  let interestDeduction = 0
  if (hasLoan && loanAmount && loanRate && loanDurationMonths && loanStartDate) {
    interestDeduction = calculateAnnualInterest(loanAmount, loanRate, loanDurationMonths, loanStartDate)
  }

  // === PERSONNE PHYSIQUE ou SCI à l'IR ===
  if (taxStructure === 'PHYSICAL_PERSON' || taxStructure === 'SCI_IR') {
    if (taxRegime === 'MICRO_FONCIER') {
      // Micro-foncier : abattement de 30%
      const abatement = annualRentalIncome * 0.30
      const taxableIncome = annualRentalIncome - abatement
      const incomeTax = taxableIncome * ((marginalTaxRate || 0) / 100)
      const socialContributions = taxableIncome * (socialContributionsRate / 100)
      const totalTax = incomeTax + socialContributions

      result = {
        grossIncome: annualRentalIncome,
        deductibleCharges: abatement,
        taxableIncome,
        incomeTax,
        socialContributions,
        corporateTax: 0,
        totalTax,
        netIncomeAfterTax: annualRentalIncome - totalTax,
        effectiveTaxRate: (totalTax / annualRentalIncome) * 100,
        details: {
          regime: 'Micro-foncier',
          abatement,
          explanation: `Abattement forfaitaire de 30% (${abatement.toFixed(0)}€). TMI: ${marginalTaxRate}%, Prélèvements sociaux: ${socialContributionsRate}%`,
        },
      }
    } else if (taxRegime === 'REEL') {
      // Régime réel : déduction des charges réelles + intérêts d'emprunt
      const totalDeductible = annualCharges + interestDeduction
      const taxableIncome = Math.max(0, annualRentalIncome - totalDeductible)
      const incomeTax = taxableIncome * ((marginalTaxRate || 0) / 100)
      const socialContributions = taxableIncome * (socialContributionsRate / 100)
      const totalTax = incomeTax + socialContributions

      result = {
        grossIncome: annualRentalIncome,
        deductibleCharges: totalDeductible,
        taxableIncome,
        incomeTax,
        socialContributions,
        corporateTax: 0,
        totalTax,
        netIncomeAfterTax: annualRentalIncome - annualCharges - totalTax,
        effectiveTaxRate: annualRentalIncome > 0 ? (totalTax / annualRentalIncome) * 100 : 0,
        details: {
          regime: 'Régime réel',
          interestDeduction,
          explanation: `Charges déductibles: ${totalDeductible.toFixed(0)}€ (dont intérêts d'emprunt: ${interestDeduction.toFixed(0)}€). TMI: ${marginalTaxRate}%`,
        },
      }
    }
  }

  // === SCI à l'IS ===
  else if (taxStructure === 'SCI_IS') {
    const totalDeductible = annualCharges + interestDeduction
    const taxableIncome = Math.max(0, annualRentalIncome - totalDeductible)

    // IS: 15% jusqu'à 42 500€, 25% au-delà
    let corporateTax = 0
    if (taxableIncome <= 42500) {
      corporateTax = taxableIncome * 0.15
    } else {
      corporateTax = 42500 * 0.15 + (taxableIncome - 42500) * 0.25
    }

    // Distribution de dividendes
    const netProfit = taxableIncome - corporateTax
    const dividends = netProfit * ((dividendDistributionPercentage || 0) / 100)
    const dividendTax = dividends * 0.30 // Flat tax 30%

    const totalTax = corporateTax + dividendTax

    result = {
      grossIncome: annualRentalIncome,
      deductibleCharges: totalDeductible,
      taxableIncome,
      incomeTax: dividendTax,
      socialContributions: 0,
      corporateTax,
      totalTax,
      netIncomeAfterTax: annualRentalIncome - annualCharges - totalTax,
      effectiveTaxRate: annualRentalIncome > 0 ? (totalTax / annualRentalIncome) * 100 : 0,
      details: {
        regime: 'SCI à l\'IS',
        interestDeduction,
        explanation: `IS: ${corporateTax.toFixed(0)}€ (15% puis 25%). Dividendes distribués: ${dividends.toFixed(0)}€, taxés à 30% (flat tax)`,
      },
    }
  }

  // === LMNP / LMP ===
  else if (taxStructure === 'LMNP' || taxStructure === 'LMP') {
    if (taxRegime === 'MICRO_BIC') {
      // Micro-BIC : abattement de 50%
      const abatement = annualRentalIncome * 0.50
      const taxableIncome = annualRentalIncome - abatement
      const incomeTax = taxableIncome * ((marginalTaxRate || 0) / 100)
      const socialContributions = taxableIncome * (socialContributionsRate / 100)
      const totalTax = incomeTax + socialContributions

      result = {
        grossIncome: annualRentalIncome,
        deductibleCharges: abatement,
        taxableIncome,
        incomeTax,
        socialContributions,
        corporateTax: 0,
        totalTax,
        netIncomeAfterTax: annualRentalIncome - totalTax,
        effectiveTaxRate: (totalTax / annualRentalIncome) * 100,
        details: {
          regime: 'Micro-BIC',
          abatement,
          explanation: `Abattement forfaitaire de 50% (${abatement.toFixed(0)}€). TMI: ${marginalTaxRate}%`,
        },
      }
    } else if (taxRegime === 'REEL_SIMPLIFIE' || taxRegime === 'REEL_NORMAL') {
      // Régime réel : charges + intérêts + amortissement
      let amortization = 0
      if (
        propertyValue &&
        propertyAmortizationDuration &&
        furnitureValue &&
        furnitureAmortizationDuration
      ) {
        amortization = calculateAmortization(
          propertyValue,
          propertyAmortizationDuration,
          furnitureValue,
          furnitureAmortizationDuration
        )
      }

      const totalDeductible = annualCharges + interestDeduction + amortization
      const taxableIncome = Math.max(0, annualRentalIncome - totalDeductible)
      const incomeTax = taxableIncome * ((marginalTaxRate || 0) / 100)
      const socialContributions = taxableIncome * (socialContributionsRate / 100)
      const totalTax = incomeTax + socialContributions

      result = {
        grossIncome: annualRentalIncome,
        deductibleCharges: totalDeductible,
        taxableIncome,
        incomeTax,
        socialContributions,
        corporateTax: 0,
        totalTax,
        netIncomeAfterTax: annualRentalIncome - annualCharges - totalTax,
        effectiveTaxRate: annualRentalIncome > 0 ? (totalTax / annualRentalIncome) * 100 : 0,
        details: {
          regime: taxRegime === 'REEL_SIMPLIFIE' ? 'Réel simplifié' : 'Réel normal',
          amortization,
          interestDeduction,
          explanation: `Charges: ${annualCharges.toFixed(0)}€, Intérêts: ${interestDeduction.toFixed(0)}€, Amortissement: ${amortization.toFixed(0)}€`,
        },
      }
    }
  }

  return result
}

/**
 * Libellés pour l'affichage
 */
export const TAX_STRUCTURE_LABELS: Record<TaxStructure, string> = {
  PHYSICAL_PERSON: 'Personne physique',
  SCI_IR: 'SCI à l\'IR',
  SCI_IS: 'SCI à l\'IS',
  LMNP: 'LMNP (Loueur Meublé Non Pro)',
  LMP: 'LMP (Loueur Meublé Pro)',
}

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  REEL: 'Régime réel',
  MICRO_FONCIER: 'Micro-foncier',
  MICRO_BIC: 'Micro-BIC',
  REEL_SIMPLIFIE: 'Réel simplifié',
  REEL_NORMAL: 'Réel normal',
}

/**
 * Régimes disponibles selon la structure
 */
export const AVAILABLE_REGIMES: Record<TaxStructure, TaxRegime[]> = {
  PHYSICAL_PERSON: ['MICRO_FONCIER', 'REEL'],
  SCI_IR: ['REEL'],
  SCI_IS: ['REEL'],
  LMNP: ['MICRO_BIC', 'REEL_SIMPLIFIE', 'REEL_NORMAL'],
  LMP: ['REEL_SIMPLIFIE', 'REEL_NORMAL'],
}
