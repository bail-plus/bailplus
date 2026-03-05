import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { Unit, UnitInsert } from "@/hooks/leasing/useUnits"

interface UnitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  propertyId: string
  onSubmit: (data: UnitInsert) => Promise<void>
  isSubmitting: boolean
}

export function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  propertyId,
  onSubmit,
  isSubmitting,
}: UnitFormDialogProps) {
  const [formData, setFormData] = useState<UnitInsert>({
    property_id: propertyId,
    unit_number: "",
    type: "",
    surface: 0,
    furnished: false,
  })

  const isEditMode = !!unit

  // Reset form when unit changes or dialog opens/closes
  useEffect(() => {
    if (open && unit) {
      setFormData({
        property_id: unit.property_id,
        unit_number: unit.unit_number,
        type: unit.type ?? "",
        surface: unit.surface ?? 0,
        furnished: unit.furnished ?? false,
      })
    } else if (open && !unit) {
      setFormData({
        property_id: propertyId,
        unit_number: "",
        type: "",
        surface: 0,
        furnished: false,
      })
    }
  }, [open, unit, propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier le logement" : "Ajouter un logement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="unit_number">N° de logement *</Label>
            <Input
              id="unit_number"
              placeholder="Ex: Appt 3B, Studio 1, etc."
              value={formData.unit_number}
              onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de logement</Label>
            <Input
              id="type"
              placeholder="Ex: T2, T3, Studio, etc."
              value={formData.type ?? ""}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surface">Surface (m²)</Label>
            <Input
              id="surface"
              type="number"
              placeholder="Ex: 45"
              value={formData.surface ?? ""}
              onChange={(e) => setFormData({ ...formData, surface: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="furnished"
              checked={formData.furnished ?? false}
              onCheckedChange={(checked) => setFormData({ ...formData, furnished: checked as boolean })}
            />
            <Label htmlFor="furnished" className="cursor-pointer">
              Logement meublé
            </Label>
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
