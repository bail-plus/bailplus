import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/ui/use-toast"
import { useCreateMaintenanceTicket, type MaintenanceTicketInsert } from "@/hooks/maintenance/useMaintenance"

interface NewRequestDialogProps {
  trigger: React.ReactNode
  propertyId?: string
  unitId?: string
  leaseId?: string
}

export function NewRequestDialog({ trigger, propertyId, unitId, leaseId }: NewRequestDialogProps) {
  const { toast } = useToast()
  const createTicket = useCreateMaintenanceTicket()
  const [isOpen, setIsOpen] = useState(false)
  const [ticketFormData, setTicketFormData] = useState<MaintenanceTicketInsert>({
    title: "",
    description: "",
    property_id: "",
    unit_id: null,
    status: "NOUVEAU",
    priority: "MOYEN",
  })

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketFormData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre de la demande",
        variant: "destructive",
      })
      return
    }

    // Auto-fill property and unit from props
    const finalTicketData = {
      ...ticketFormData,
      property_id: propertyId || ticketFormData.property_id,
      unit_id: unitId || ticketFormData.unit_id,
      lease_id: leaseId || null,
      description: ticketFormData.description || null,
    }

    try {
      await createTicket.mutateAsync(finalTicketData)

      toast({
        title: "Succès",
        description: "Votre demande a été créée avec succès",
      })

      setIsOpen(false)
      setTicketFormData({
        title: "",
        description: "",
        property_id: "",
        unit_id: null,
        status: "NOUVEAU",
        priority: "MOYEN",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une demande d'intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateRequest} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la demande *</Label>
            <Input
              id="title"
              placeholder="Ex: Fuite d'eau dans la salle de bain"
              value={ticketFormData.title}
              onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description détaillée</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              value={ticketFormData.description}
              onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Niveau d'urgence</Label>
            <Select
              value={ticketFormData.priority ?? "MOYEN"}
              onValueChange={(value) => setTicketFormData({ ...ticketFormData, priority: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FAIBLE">Faible - Peut attendre</SelectItem>
                <SelectItem value="MOYEN">Moyenne - À traiter prochainement</SelectItem>
                <SelectItem value="ELEVE">Élevée - Important</SelectItem>
                <SelectItem value="URGENT">Urgente - Nécessite intervention immédiate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? "Envoi..." : "Envoyer la demande"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
