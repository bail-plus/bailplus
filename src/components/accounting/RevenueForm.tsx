import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { type BankTransactionInsert } from "@/hooks/accounting/useAccounting"

interface RevenueFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: BankTransactionInsert
  onFormDataChange: (data: BankTransactionInsert) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
  onOpenDialog: () => void
}

export function RevenueForm({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  onOpenDialog,
}: RevenueFormProps) {
  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button
          className="gap-2"
          onClick={onOpenDialog}
        >
          <Plus className="w-4 h-4" />
          Ajouter un revenu
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un revenu</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={onSubmit}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rev_amount">Montant (€) *</Label>
                <Input
                  id="rev_amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => onFormDataChange({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rev_date">Date *</Label>
                <Input
                  id="rev_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev_label">Libellé *</Label>
              <Input
                id="rev_label"
                value={formData.label}
                onChange={(e) => onFormDataChange({ ...formData, label: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                Créer
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
