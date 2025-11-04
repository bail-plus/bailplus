import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Euro, Scale } from "lucide-react"
import type { PropertyWithUnits, PropertyInsert } from "@/hooks/properties/useProperties"
import { TaxFormSection } from "./TaxFormSection"

interface PropertyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: PropertyWithUnits | null
  onSubmit: (data: PropertyInsert) => Promise<void>
  isSubmitting: boolean
}

export function PropertyFormDialog({
  open,
  onOpenChange,
  property,
  onSubmit,
  isSubmitting,
}: PropertyFormDialogProps) {
  const [formData, setFormData] = useState<PropertyInsert>({
    name: "",
    address: "",
    city: "",
    postal_code: "",
  })
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const postalFetchRef = useRef<AbortController | null>(null)

  const isEditMode = !!property

  // Reset form when property changes or dialog opens/closes
  useEffect(() => {
    if (open && property) {
      setFormData({
        name: property.name,
        address: property.address,
        city: property.city ?? "",
        postal_code: property.postal_code ?? "",
        purchase_price: property.purchase_price ?? undefined,
        notary_fees: property.notary_fees ?? undefined,
        agency_fees: property.agency_fees ?? undefined,
        renovation_costs: property.renovation_costs ?? undefined,
        other_acquisition_costs: property.other_acquisition_costs ?? undefined,
        other_income: property.other_income ?? undefined,
        property_tax: property.property_tax ?? undefined,
        housing_tax: property.housing_tax ?? undefined,
        condo_fees_annual: property.condo_fees_annual ?? undefined,
        insurance_annual: property.insurance_annual ?? undefined,
        management_fees_percentage: property.management_fees_percentage ?? undefined,
        tax_structure: property.tax_structure ?? undefined,
        tax_regime: property.tax_regime ?? undefined,
        marginal_tax_rate: property.marginal_tax_rate ?? undefined,
        social_contributions_rate: property.social_contributions_rate ?? 17.2,
        corporate_tax_rate: property.corporate_tax_rate ?? undefined,
        dividend_distribution_percentage: property.dividend_distribution_percentage ?? undefined,
        property_amortization_duration: property.property_amortization_duration ?? undefined,
        furniture_amortization_duration: property.furniture_amortization_duration ?? undefined,
        furniture_value: property.furniture_value ?? undefined,
        has_loan: property.has_loan ?? false,
        loan_amount: property.loan_amount ?? undefined,
        loan_rate: property.loan_rate ?? undefined,
        loan_duration_months: property.loan_duration_months ?? undefined,
        loan_start_date: property.loan_start_date ?? undefined,
      })
    } else if (open && !property) {
      setFormData({
        name: "",
        address: "",
        city: "",
        postal_code: "",
        social_contributions_rate: 17.2,
        has_loan: false,
      })
    }
    setCitySuggestions([])
  }, [open, property])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handlePostalCodeChange = async (value: string) => {
    const cleanedValue = value.replace(/\s+/g, "").slice(0, 5)
    setFormData({ ...formData, postal_code: cleanedValue })

    // reset when empty or incomplete
    if (!cleanedValue || cleanedValue.length < 2) {
      setCitySuggestions([])
      return
    }

    // cancel any ongoing request
    if (postalFetchRef.current) {
      postalFetchRef.current.abort()
    }
    const controller = new AbortController()
    postalFetchRef.current = controller

    try {
      // Query official French GEO API for communes by postal code
      const url = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(
        cleanedValue
      )}&fields=nom,codesPostaux&format=json` as const
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error("Erreur réseau GEO API")
      const data: Array<{ nom: string; codesPostaux?: string[] }> = await res.json()

      const cities = (data || []).map((c) => c.nom).filter(Boolean)
      setCitySuggestions(cities)

      // Auto-fill if exactly one city
      if (cities.length === 1) {
        setFormData((prev) => ({ ...prev, city: cities[0] }))
      }
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        // On error, just clear suggestions; keep manual entry possible
        setCitySuggestions([])
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la propriété" : "Ajouter une propriété"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Général
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Financier
              </TabsTrigger>
              <TabsTrigger value="tax" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Fiscal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la propriété *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Immeuble 12 rue Victor Hugo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  placeholder="12 rue Victor Hugo"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="75001"
                    value={formData.postal_code ?? ""}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    list="city-suggestions"
                    value={formData.city ?? ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                  <datalist id="city-suggestions">
                    {citySuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6 mt-4">
              {/* Investissement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Investissement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Prix d'achat (€)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="1000"
                      placeholder="200000"
                      value={formData.purchase_price ?? ""}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notary_fees">Frais de notaire (€)</Label>
                    <Input
                      id="notary_fees"
                      type="number"
                      step="100"
                      placeholder="15000"
                      value={formData.notary_fees ?? ""}
                      onChange={(e) => setFormData({ ...formData, notary_fees: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agency_fees">Frais d'agence (€)</Label>
                    <Input
                      id="agency_fees"
                      type="number"
                      step="100"
                      placeholder="5000"
                      value={formData.agency_fees ?? ""}
                      onChange={(e) => setFormData({ ...formData, agency_fees: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renovation_costs">Coût des travaux (€)</Label>
                    <Input
                      id="renovation_costs"
                      type="number"
                      step="100"
                      placeholder="10000"
                      value={formData.renovation_costs ?? ""}
                      onChange={(e) => setFormData({ ...formData, renovation_costs: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="other_acquisition_costs">Autres frais d'acquisition (€)</Label>
                    <Input
                      id="other_acquisition_costs"
                      type="number"
                      step="100"
                      placeholder="1000"
                      value={formData.other_acquisition_costs ?? ""}
                      onChange={(e) => setFormData({ ...formData, other_acquisition_costs: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>

              {/* Revenus et charges */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Revenus et charges annuels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="other_income">Autres revenus annuels (€)</Label>
                    <Input
                      id="other_income"
                      type="number"
                      step="100"
                      placeholder="0"
                      value={formData.other_income ?? ""}
                      onChange={(e) => setFormData({ ...formData, other_income: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="property_tax">Taxe foncière annuelle (€)</Label>
                    <Input
                      id="property_tax"
                      type="number"
                      step="10"
                      placeholder="1200"
                      value={formData.property_tax ?? ""}
                      onChange={(e) => setFormData({ ...formData, property_tax: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="housing_tax">Taxe d'habitation annuelle (€)</Label>
                    <Input
                      id="housing_tax"
                      type="number"
                      step="10"
                      placeholder="0"
                      value={formData.housing_tax ?? ""}
                      onChange={(e) => setFormData({ ...formData, housing_tax: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condo_fees_annual">Charges de copropriété annuelles (€)</Label>
                    <Input
                      id="condo_fees_annual"
                      type="number"
                      step="10"
                      placeholder="1500"
                      value={formData.condo_fees_annual ?? ""}
                      onChange={(e) => setFormData({ ...formData, condo_fees_annual: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_annual">Assurance annuelle (€)</Label>
                    <Input
                      id="insurance_annual"
                      type="number"
                      step="10"
                      placeholder="200"
                      value={formData.insurance_annual ?? ""}
                      onChange={(e) => setFormData({ ...formData, insurance_annual: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="management_fees_percentage">Frais de gestion (%)</Label>
                    <Input
                      id="management_fees_percentage"
                      type="number"
                      step="0.1"
                      placeholder="8"
                      value={formData.management_fees_percentage ?? ""}
                      onChange={(e) => setFormData({ ...formData, management_fees_percentage: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4 mt-4">
              <TaxFormSection formData={formData} setFormData={setFormData} />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isEditMode ? "Modifier" : "Créer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
