import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { type BankTransactionInsert, type BankTransactionWithDetails } from "@/hooks/accounting/useAccounting"

const TRANSACTION_STATUS = [
  { value: "PENDING", label: "En attente de rapprochement" },
  { value: "MATCHED", label: "Rapprochée (validée)" },
  { value: "UNMATCHED", label: "À catégoriser" },
]

interface TransactionFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: BankTransactionInsert
  onFormDataChange: (data: BankTransactionInsert) => void
  selectedTransaction: BankTransactionWithDetails | null
  onSubmit: (e: React.FormEvent) => Promise<void>
  isSubmitting: boolean
}

export function TransactionForm({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  selectedTransaction,
  onSubmit,
  isSubmitting,
}: TransactionFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedTransaction ? "Modifier la transaction" : "Créer une transaction bancaire"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trans_amount">Montant (€) *</Label>
              <Input
                id="trans_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => onFormDataChange({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trans_date">Date *</Label>
              <Input
                id="trans_date"
                type="date"
                value={formData.date}
                onChange={(e) => onFormDataChange({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trans_label">Libellé *</Label>
            <Input
              id="trans_label"
              value={formData.label}
              onChange={(e) => onFormDataChange({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trans_status">Statut</Label>
            <Select
              value={formData.status || "PENDING"}
              onValueChange={(value) => onFormDataChange({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {selectedTransaction ? "Modifier" : "Créer"}
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
