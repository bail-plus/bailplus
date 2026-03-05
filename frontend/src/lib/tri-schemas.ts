import { z } from "zod";

// Schéma de validation pour les inputs du simulateur TRI
export const triFormSchema = z.object({
  // Coût d'achat
  acquisitionPrice: z.number().min(0, "Le prix d'acquisition doit être positif"),
  furniturePrice: z.number().min(0, "Le prix du mobilier doit être positif"),
  notaryFees: z.number().min(0, "Les frais de notaire doivent être positifs"),
  agencyFees: z.number().min(0, "Les frais d'agence doivent être positifs"),
  worksCost: z.number().min(0, "Le coût des travaux doit être positif"),
  worksDeductible: z.boolean(),

  // Revenus & charges
  rents: z.number().min(0, "Les loyers doivent être positifs"),
  rentsFrequency: z.enum(['monthly', 'annual']),
  charges: z.number().min(0, "Les charges doivent être positives"),
  chargesFrequency: z.enum(['monthly', 'annual']),
  rentsGrowthRate: z.number().min(-50).max(50, "L'évolution des loyers doit être entre -50% et 50%"),
  chargesGrowthRate: z.number().min(-50).max(50, "L'évolution des charges doit être entre -50% et 50%"),
  vacancyRate: z.number().min(0).max(100, "La vacance doit être entre 0% et 100%"),

  // Financement
  downPayment: z.number().min(0, "L'apport doit être positif"),
  loanAmount: z.number().optional(),
  loanDurationMonths: z.number().min(1).max(600, "La durée doit être entre 1 et 600 mois"),
  loanRate: z.number().min(0).max(50, "Le taux doit être entre 0% et 50%"),
  insuranceRate: z.number().min(0).max(10, "L'assurance doit être entre 0% et 10%"),
  deferredType: z.enum(['none', 'interest-only', 'total']),
  deferredMonths: z.number().min(0).max(24, "Le différé doit être entre 0 et 24 mois"),

  // Fiscalité
  fiscalRegime: z.enum(['micro-foncier', 'foncier-reel', 'lmnp-micro', 'lmnp-reel']),
  marginalTaxRate: z.number().min(0).max(75, "Le TMI doit être entre 0% et 75%"),
  socialTaxRate: z.number().min(0).max(50, "Les PS doivent être entre 0% et 50%"),

  // Cession
  holdingPeriodYears: z.number().min(1).max(50, "La durée doit être entre 1 et 50 ans"),
  resaleValue: z.number().min(0, "La valeur de revente doit être positive"),
  capitalGainsTaxRate: z.number().min(0).max(100, "L'impôt sur PV doit être entre 0% et 100%"),

  // Actualisation
  discountRate: z.number().min(0).max(50, "Le taux d'actualisation doit être entre 0% et 50%")
});

export type TriFormData = z.infer<typeof triFormSchema>;

// Valeurs par défaut pour le formulaire
export const defaultTriInputs: TriFormData = {
  // Coût d'achat
  acquisitionPrice: 150000,
  furniturePrice: 0,
  notaryFees: 12000,
  agencyFees: 0,
  worksCost: 0,
  worksDeductible: false,

  // Revenus & charges
  rents: 800,
  rentsFrequency: 'monthly' as const,
  charges: 200,
  chargesFrequency: 'monthly' as const,
  rentsGrowthRate: 2,
  chargesGrowthRate: 2,
  vacancyRate: 3,

  // Financement
  downPayment: 30000,
  loanAmount: undefined,
  loanDurationMonths: 240,
  loanRate: 3.5,
  insuranceRate: 0.4,
  deferredType: 'none' as const,
  deferredMonths: 0,

  // Fiscalité
  fiscalRegime: 'micro-foncier' as const,
  marginalTaxRate: 30,
  socialTaxRate: 17.2,

  // Cession
  holdingPeriodYears: 20,
  resaleValue: 300000,
  capitalGainsTaxRate: 36.2,

  // Actualisation
  discountRate: 4
};

// Types pour le stockage local des simulations
export interface SavedSimulation {
  id: string;
  name: string;
  data: TriFormData;
  createdAt: Date;
  updatedAt: Date;
}

// Labels des options pour les sélecteurs
export const fiscalRegimeOptions = [
  { value: 'micro-foncier', label: 'Micro-foncier (-30%)' },
  { value: 'foncier-reel', label: 'Foncier réel' },
  { value: 'lmnp-micro', label: 'LMNP micro-BIC (-50%)' },
  { value: 'lmnp-reel', label: 'LMNP réel (amortissements)' }
] as const;

export const deferredTypeOptions = [
  { value: 'none', label: 'Aucun différé' },
  { value: 'interest-only', label: 'Intérêts seuls' },
  { value: 'total', label: 'Différé total' }
] as const;

export const frequencyOptions = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'annual', label: 'Annuel' }
] as const;