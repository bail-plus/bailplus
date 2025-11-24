import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Euro, Percent } from "lucide-react"
import type { PropertyWithUnits } from "@/hooks/properties/useProperties"
import { calculateTax, calculateMonthlyPayment, type TaxInputs } from "@/lib/taxCalculator"

interface ProfitabilityCardProps {
  property: PropertyWithUnits
  annualRentalIncome?: number // Loyers annuels calculés depuis les baux actifs
}

export function ProfitabilityCard({ property, annualRentalIncome = 0 }: ProfitabilityCardProps) {
  // Calcul de l'investissement total
  const totalInvestment =
    (property.purchase_price ?? 0) +
    (property.notary_fees ?? 0) +
    (property.agency_fees ?? 0) +
    (property.renovation_costs ?? 0) +
    (property.other_acquisition_costs ?? 0)

  // Calcul des charges annuelles fixes
  const annualCharges =
    (property.property_tax ?? 0) +
    (property.housing_tax ?? 0) +
    (property.condo_fees_annual ?? 0) +
    (property.insurance_annual ?? 0)

  // Frais de gestion (% des loyers)
  const managementFees = annualRentalIncome * ((property.management_fees_percentage ?? 0) / 100)

  // Mensualités crédit immobilier (annuelles)
  let annualLoanPayments = 0
  if (property.has_loan && property.loan_amount && property.loan_rate && property.loan_duration_months) {
    const monthlyPayment = calculateMonthlyPayment(
      property.loan_amount,
      property.loan_rate,
      property.loan_duration_months
    )
    annualLoanPayments = monthlyPayment * 12
  }

  // Revenus totaux (loyers + autres revenus)
  const totalIncome = annualRentalIncome + (property.other_income ?? 0)

  // Charges sans crédit (pour le calcul fiscal)
  const chargesWithoutLoan = annualCharges + managementFees

  // Charges totales (charges fixes + frais de gestion + mensualités crédit)
  const totalCharges = chargesWithoutLoan + annualLoanPayments

  // Cash-flow annuel net (avant impôts)
  const annualNetCashFlow = totalIncome - totalCharges

  // Rentabilité brute (revenus / investissement * 100)
  const grossYield = totalInvestment > 0 ? (totalIncome / totalInvestment) * 100 : 0

  // Rentabilité nette avant impôts (cash-flow net / investissement * 100)
  const netYield = totalInvestment > 0 ? (annualNetCashFlow / totalInvestment) * 100 : 0

  // Calcul fiscal (sans les mensualités car le calculateur gère les intérêts séparément)
  const taxInputs: TaxInputs = {
    taxStructure: property.tax_structure || null,
    taxRegime: property.tax_regime || null,
    annualRentalIncome: totalIncome,
    annualCharges: chargesWithoutLoan,
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
  }

  const taxResults = calculateTax(taxInputs)
  const hasTaxData = property.tax_structure && property.tax_regime

  // Cash-flow après impôts
  const annualNetCashFlowAfterTax = annualNetCashFlow - taxResults.totalTax

  // Rentabilité nette après impôts
  const netYieldAfterTax = totalInvestment > 0 ? (annualNetCashFlowAfterTax / totalInvestment) * 100 : 0

  // Détermine si les données sont complètes
  const hasCompleteData = totalInvestment > 0 && annualRentalIncome > 0

  if (!hasCompleteData) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Rentabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complétez les informations financières de ce bien et ajoutez des baux actifs pour calculer la rentabilité.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Rentabilité du bien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Investissement total */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Investissement total</span>
            <Badge variant="secondary" className="gap-1">
              <Euro className="w-3 h-3" />
              {totalInvestment.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 ml-4">
            {property.purchase_price !== null && property.purchase_price !== undefined && <div>• Prix d'achat : {property.purchase_price.toLocaleString('fr-FR')} €</div>}
            {property.notary_fees !== null && property.notary_fees !== undefined && <div>• Frais notaire : {property.notary_fees.toLocaleString('fr-FR')} €</div>}
            {property.agency_fees !== null && property.agency_fees !== undefined && <div>• Frais agence : {property.agency_fees.toLocaleString('fr-FR')} €</div>}
            {property.renovation_costs !== null && property.renovation_costs !== undefined && <div>• Travaux : {property.renovation_costs.toLocaleString('fr-FR')} €</div>}
            {property.other_acquisition_costs !== null && property.other_acquisition_costs !== undefined && <div>• Autres : {property.other_acquisition_costs.toLocaleString('fr-FR')} €</div>}
          </div>
        </div>

        {/* Revenus annuels */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Revenus annuels</span>
            <Badge variant="default" className="gap-1 bg-green-600">
              <Euro className="w-3 h-3" />
              {totalIncome.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 ml-4">
            {annualRentalIncome !== undefined && annualRentalIncome !== null && annualRentalIncome > 0 && <div>• Loyers : {annualRentalIncome.toLocaleString('fr-FR')} €</div>}
            {property.other_income !== null && property.other_income !== undefined && property.other_income !== 0 && <div>• Autres revenus : {property.other_income.toLocaleString('fr-FR')} €</div>}
          </div>
        </div>

        {/* Charges annuelles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Charges annuelles</span>
            <Badge variant="destructive" className="gap-1">
              <Euro className="w-3 h-3" />
              {totalCharges.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 ml-4">
            {property.property_tax !== null && property.property_tax !== undefined && property.property_tax !== 0 && <div>• Taxe foncière : {property.property_tax.toLocaleString('fr-FR')} €</div>}
            {property.housing_tax !== null && property.housing_tax !== undefined && property.housing_tax !== 0 && <div>• Taxe habitation : {property.housing_tax.toLocaleString('fr-FR')} €</div>}
            {property.condo_fees_annual !== null && property.condo_fees_annual !== undefined && property.condo_fees_annual !== 0 && <div>• Charges copro : {property.condo_fees_annual.toLocaleString('fr-FR')} €</div>}
            {property.insurance_annual !== null && property.insurance_annual !== undefined && property.insurance_annual !== 0 && <div>• Assurance : {property.insurance_annual.toLocaleString('fr-FR')} €</div>}
            {managementFees > 0 && <div>• Frais de gestion ({property.management_fees_percentage}%) : {managementFees.toLocaleString('fr-FR')} €</div>}
            {annualLoanPayments > 0 && <div>• Mensualités crédit : {annualLoanPayments.toLocaleString('fr-FR')} €</div>}
          </div>
        </div>

        {/* Cash-flow net annuel (avant impôts) */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Cash-flow net annuel {hasTaxData && "(avant impôts)"}</span>
            <Badge variant={annualNetCashFlow >= 0 ? "default" : "destructive"} className="gap-1 text-base">
              {annualNetCashFlow >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {annualNetCashFlow.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </Badge>
          </div>
        </div>

        {/* Fiscalité */}
        {hasTaxData && (
          <div className="space-y-2 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fiscalité ({taxResults.details.regime})</span>
              <Badge variant="outline" className="gap-1">
                <Euro className="w-3 h-3" />
                {taxResults.totalTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 ml-4">
              {taxResults.incomeTax > 0 && <div>• Impôt sur le revenu : {taxResults.incomeTax.toLocaleString('fr-FR')} €</div>}
              {taxResults.socialContributions > 0 && <div>• Prélèvements sociaux : {taxResults.socialContributions.toLocaleString('fr-FR')} €</div>}
              {taxResults.corporateTax > 0 && <div>• Impôt sur les sociétés : {taxResults.corporateTax.toLocaleString('fr-FR')} €</div>}
              <div className="text-xs italic mt-2">{taxResults.details.explanation}</div>
            </div>
          </div>
        )}

        {/* Cash-flow après impôts */}
        {hasTaxData && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Cash-flow net annuel (après impôts)</span>
              <Badge variant={annualNetCashFlowAfterTax >= 0 ? "default" : "destructive"} className="gap-1 text-base">
                {annualNetCashFlowAfterTax >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {annualNetCashFlowAfterTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </Badge>
            </div>
          </div>
        )}

        {/* Rentabilités */}
        <div className={`grid ${hasTaxData ? 'grid-cols-3' : 'grid-cols-2'} gap-4 border-t pt-4`}>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Rentabilité brute</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {grossYield.toFixed(2)} %
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Rentabilité nette {hasTaxData && "(avant impôts)"}</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {netYield.toFixed(2)} %
            </div>
          </div>
          {hasTaxData && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Rentabilité nette (après impôts)</div>
              <div className="text-2xl font-bold flex items-center gap-1 text-green-600">
                {netYieldAfterTax.toFixed(2)} %
              </div>
            </div>
          )}
        </div>

        {/* Informations supplémentaires */}
        <div className="border-t pt-4 space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">📊 Formules de calcul</h4>
            <div className="text-xs text-muted-foreground space-y-1 pl-2">
              <div>• <strong>Rentabilité brute</strong> : Revenus annuels / Investissement total</div>
              <div>• <strong>Rentabilité nette</strong> : Cash-flow net / Investissement total</div>
            </div>
          </div>

          {!hasTaxData && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800">
                <strong>ℹ️ Note importante :</strong> Ces calculs ne prennent pas en compte la fiscalité. Renseignez la structure juridique et le régime fiscal dans les informations du bien pour obtenir un calcul après impôts.
              </p>
            </div>
          )}
          {hasTaxData && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-xs text-green-800">
                <strong>✓ Calcul fiscal activé :</strong> Les résultats après impôts sont calculés selon votre régime fiscal ({taxResults.details.regime}). Taux effectif d'imposition : {taxResults.effectiveTaxRate.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {/* Conseils personnalisés */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold">💡 Conseils personnalisés</h4>
          <div className="space-y-2">
            {/* Conseil sur la rentabilité brute */}
            {grossYield < 5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-xs text-orange-900">
                  <strong>⚠️ Rentabilité brute faible ({grossYield.toFixed(2)}%).</strong> Envisagez d'augmenter les loyers si le marché le permet, ou de réduire les coûts d'acquisition lors de futurs investissements.
                </p>
              </div>
            )}
            {grossYield >= 5 && grossYield < 8 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-900">
                  <strong>ℹ️ Rentabilité brute correcte ({grossYield.toFixed(2)}%).</strong> Vous êtes dans la moyenne du marché. Optimisez vos charges pour améliorer la rentabilité nette.
                </p>
              </div>
            )}
            {grossYield >= 8 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs text-green-900">
                  <strong>✓ Excellente rentabilité brute ({grossYield.toFixed(2)}%).</strong> Votre bien est très performant ! Maintenez cette performance en suivant régulièrement vos indicateurs.
                </p>
              </div>
            )}

            {/* Conseil sur le cash-flow */}
            {annualNetCashFlowAfterTax < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-900">
                  <strong>🚨 Cash-flow négatif ({annualNetCashFlowAfterTax.toLocaleString('fr-FR')} €).</strong> Votre bien coûte plus qu'il ne rapporte. Analysez vos charges et envisagez une renégociation de crédit ou une augmentation des loyers.
                </p>
              </div>
            )}
            {annualNetCashFlowAfterTax >= 0 && annualNetCashFlowAfterTax < 3000 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-900">
                  <strong>⚡ Cash-flow faible ({annualNetCashFlowAfterTax.toLocaleString('fr-FR')} €).</strong> Votre marge est étroite. Constituez une réserve pour les imprévus (travaux, vacance locative).
                </p>
              </div>
            )}
            {annualNetCashFlowAfterTax >= 3000 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-xs text-green-900">
                  <strong>✓ Cash-flow positif ({annualNetCashFlowAfterTax.toLocaleString('fr-FR')} €/an).</strong> Votre investissement est rentable ! Pensez à réinvestir ce surplus ou à le mettre en réserve.
                </p>
              </div>
            )}

            {/* Conseil fiscal */}
            {!hasTaxData && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-xs text-purple-900">
                  <strong>💼 Optimisation fiscale :</strong> Configurez votre structure juridique et régime fiscal dans les informations du bien pour voir votre rentabilité réelle après impôts et identifier des opportunités d'optimisation.
                </p>
              </div>
            )}
            {hasTaxData && taxResults.effectiveTaxRate > 40 && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-xs text-purple-900">
                  <strong>💼 Taux d'imposition élevé ({taxResults.effectiveTaxRate.toFixed(2)}%).</strong> Consultez un expert-comptable pour étudier des options d'optimisation fiscale (changement de régime, amortissements, etc.).
                </p>
              </div>
            )}

            {/* Conseil crédit */}
            {annualLoanPayments > 0 && annualLoanPayments > totalIncome * 0.5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-xs text-orange-900">
                  <strong>⚠️ Mensualités de crédit élevées.</strong> Vos remboursements représentent plus de 50% de vos revenus locatifs. Surveillez votre taux d'endettement et envisagez une renégociation si possible.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
