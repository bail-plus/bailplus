import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PropertyWithUnits, PropertyInsert } from "@/hooks/properties/useProperties"

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
      })
    } else if (open && !property) {
      setFormData({
        name: "",
        address: "",
        city: "",
        postal_code: "",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la propriété" : "Ajouter une propriété"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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

          <div className="flex gap-2 pt-4">
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
