import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Scale, CreditCard } from "lucide-react"
import { TAX_STRUCTURE_LABELS, TAX_REGIME_LABELS, AVAILABLE_REGIMES, type TaxStructure, type TaxRegime } from "@/lib/taxCalculator"
import type { PropertyInsert } from "@/hooks/properties/useProperties"

interface TaxFormSectionProps {
  formData: PropertyInsert
  setFormData: (data: PropertyInsert) => void
}

export function TaxFormSection({ formData, setFormData }: TaxFormSectionProps) {
  const taxStructure = (formData.tax_structure as TaxStructure) || null
  const availableRegimes = taxStructure ? AVAILABLE_REGIMES[taxStructure] : []

  const needsAmortization = taxStructure === 'LMNP' || taxStructure === 'LMP'
  const needsMarginalRate = taxStructure === 'PHYSICAL_PERSON' || taxStructure === 'SCI_IR' || taxStructure === 'LMNP' || taxStructure === 'LMP'
  const needsCorporateRate = taxStructure === 'SCI_IS'

  return (
    <div className="space-y-6">
      {/* Section Fiscalité */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Fiscalité (optionnel)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tax_structure">Structure juridique</Label>
            <Select
              value={formData.tax_structure || ''}
              onValueChange={(value) => setFormData({ ...formData, tax_structure: value as TaxStructure, tax_regime: undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_STRUCTURE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {taxStructure && (
            <div className="space-y-2">
              <Label htmlFor="tax_regime">Régime fiscal</Label>
              <Select
                value={formData.tax_regime || ''}
                onValueChange={(value) => setFormData({ ...formData, tax_regime: value as TaxRegime })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  {availableRegimes.map((regime) => (
                    <SelectItem key={regime} value={regime}>
                      {TAX_REGIME_LABELS[regime]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsMarginalRate && (
            <div className="space-y-2">
              <Label htmlFor="marginal_tax_rate">TMI (Tranche Marginale) %</Label>
              <Select
                value={formData.marginal_tax_rate?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, marginal_tax_rate: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="11">11%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="41">41%</SelectItem>
                  <SelectItem value="45">45%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="social_contributions_rate">Prélèvements sociaux (%)</Label>
            <Input
              id="social_contributions_rate"
              type="number"
              step="0.1"
              placeholder="17.2"
              value={formData.social_contributions_rate ?? ''}
              onChange={(e) => setFormData({ ...formData, social_contributions_rate: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          {needsCorporateRate && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dividend_distribution_percentage">Distribution de dividendes (%)</Label>
              <Input
                id="dividend_distribution_percentage"
                type="number"
                step="1"
                placeholder="50"
                value={formData.dividend_distribution_percentage ?? ''}
                onChange={(e) => setFormData({ ...formData, dividend_distribution_percentage: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}
        </div>

        {/* Amortissement LMNP/LMP */}
        {needsAmortization && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="property_amortization_duration">Amort. bien (années)</Label>
              <Input
                id="property_amortization_duration"
                type="number"
                placeholder="30"
                value={formData.property_amortization_duration ?? ''}
                onChange={(e) => setFormData({ ...formData, property_amortization_duration: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="furniture_value">Valeur mobilier (€)</Label>
              <Input
                id="furniture_value"
                type="number"
                placeholder="15000"
                value={formData.furniture_value ?? ''}
                onChange={(e) => setFormData({ ...formData, furniture_value: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="furniture_amortization_duration">Amort. mobilier (années)</Label>
              <Input
                id="furniture_amortization_duration"
                type="number"
                placeholder="7"
                value={formData.furniture_amortization_duration ?? ''}
                onChange={(e) => setFormData({ ...formData, furniture_amortization_duration: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Section Crédit immobilier */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="has_loan"
            checked={formData.has_loan ?? false}
            onCheckedChange={(checked) => setFormData({ ...formData, has_loan: checked as boolean })}
          />
          <Label htmlFor="has_loan" className="cursor-pointer flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-lg font-semibold">Crédit immobilier</span>
          </Label>
        </div>

        {formData.has_loan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="loan_amount">Montant emprunté (€)</Label>
              <Input
                id="loan_amount"
                type="number"
                step="1000"
                placeholder="200000"
                value={formData.loan_amount ?? ''}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_rate">Taux d'intérêt (%)</Label>
              <Input
                id="loan_rate"
                type="number"
                step="0.01"
                placeholder="1.5"
                value={formData.loan_rate ?? ''}
                onChange={(e) => setFormData({ ...formData, loan_rate: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_duration_years">Durée (années)</Label>
              <Input
                id="loan_duration_years"
                type="number"
                placeholder="20"
                value={formData.loan_duration_months ? Math.round(formData.loan_duration_months / 12) : ''}
                onChange={(e) => setFormData({ ...formData, loan_duration_months: e.target.value ? Number(e.target.value) * 12 : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_start_date">Date de début</Label>
              <Input
                id="loan_start_date"
                type="date"
                value={formData.loan_start_date ?? ''}
                onChange={(e) => setFormData({ ...formData, loan_start_date: e.target.value || undefined })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
