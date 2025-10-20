import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { WorkOrderInsert, WorkOrder } from "@/hooks/maintenance/useMaintenance"

const WORK_ORDER_STATUSES = [
  { value: "EN ATTENTE", label: "En attente" },
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN COURS", label: "En cours" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" }
]

interface WorkOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedWorkOrder: WorkOrder | null
  workOrderFormData: WorkOrderInsert
  onFormDataChange: (data: WorkOrderInsert) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
}

export function WorkOrderDialog({
  open,
  onOpenChange,
  selectedWorkOrder,
  workOrderFormData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: WorkOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedWorkOrder ? "Modifier l'ordre de travail" : "Créer un ordre de travail"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="contractor_name">Prestataire *</Label>
            <Input
              id="contractor_name"
              value={workOrderFormData.contractor_name}
              onChange={(e) => onFormDataChange({ ...workOrderFormData, contractor_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo_description">Description</Label>
            <Textarea
              id="wo_description"
              value={workOrderFormData.description}
              onChange={(e) => onFormDataChange({ ...workOrderFormData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Coût estimé (€)</Label>
              <Input
                id="estimated_cost"
                type="number"
                value={workOrderFormData.estimated_cost ?? ""}
                onChange={(e) => onFormDataChange({ ...workOrderFormData, estimated_cost: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_cost">Coût réel (€)</Label>
              <Input
                id="actual_cost"
                type="number"
                value={workOrderFormData.actual_cost ?? ""}
                onChange={(e) => onFormDataChange({ ...workOrderFormData, actual_cost: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date programmée</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={workOrderFormData.scheduled_date ?? ""}
                onChange={(e) => onFormDataChange({ ...workOrderFormData, scheduled_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completed_date">Date de fin</Label>
              <Input
                id="completed_date"
                type="date"
                value={workOrderFormData.completed_date ?? ""}
                onChange={(e) => onFormDataChange({ ...workOrderFormData, completed_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo_status">Statut</Label>
            <Select
              value={workOrderFormData.status ?? "EN ATTENTE"}
              onValueChange={(value) => onFormDataChange({ ...workOrderFormData, status: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {WORK_ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {selectedWorkOrder ? "Modifier" : "Créer"}
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
