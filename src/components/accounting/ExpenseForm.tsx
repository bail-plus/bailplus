import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { type ExpenseInsert, type ExpenseWithDetails } from "@/hooks/useAccounting"

const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXE", label: "Taxe" },
  { value: "ASSURANCE", label: "Assurance" },
  { value: "CHARGES", label: "Charges" },
  { value: "TRAVAUX", label: "Travaux" },
  { value: "AUTRE", label: "Autre" },
]

const EXPENSE_STATUS = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvée" },
  { value: "rejected", label: "Rejetée" },
]

interface Property {
  id: string
  name: string
  units?: Array<{ id: string; unit_number: string }>
}

interface ExpenseFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: ExpenseInsert
  onFormDataChange: (data: ExpenseInsert) => void
  selectedExpense: ExpenseWithDetails | null
  onSubmit: (e: React.FormEvent) => Promise<void>
  properties: Property[]
  isSubmitting: boolean
}

export function ExpenseForm({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  selectedExpense,
  onSubmit,
  properties,
  isSubmitting,
}: ExpenseFormProps) {
  const selectedProperty = properties.find(p => p.id === formData.property_id)
  const availableUnits = selectedProperty?.units ?? []

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle dépense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedExpense ? "Modifier la dépense" : "Créer une dépense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => onFormDataChange({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => onFormDataChange({ ...formData, expense_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category || "AUTRE"}
                onValueChange={(value) => onFormDataChange({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status || "pending"}
                onValueChange={(value) => onFormDataChange({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_id">Propriété</Label>
              <Select
                value={formData.property_id || "none"}
                onValueChange={(value) => onFormDataChange({ ...formData, property_id: value === "none" ? null : value, unit_id: null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une propriété" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune propriété</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Logement</Label>
              <Select
                value={formData.unit_id || "none"}
                onValueChange={(value) => onFormDataChange({ ...formData, unit_id: value === "none" ? null : value })}
                disabled={!formData.property_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un logement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun logement</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {selectedExpense ? "Modifier" : "Créer"}
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
