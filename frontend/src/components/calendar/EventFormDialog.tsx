import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Partial<EventRow> & { description?: string | null }
  onEventChange: (event: Partial<EventRow> & { description?: string | null }) => void
  onSubmit: () => void
  isEditing: boolean
  properties: Array<{ id: string; name: string }>
  userType: "owner" | "tenant" | "provider"
  showPropertyHint?: boolean
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onEventChange,
  onSubmit,
  isEditing,
  properties,
  userType,
  showPropertyHint = false,
}: EventFormDialogProps) {
  const dialogTitle = userType === "provider"
    ? "Nouvelle intervention"
    : isEditing
    ? "Modifier le rendez-vous"
    : "Nouveau rendez-vous"

  const dialogDescription = userType === "provider"
    ? "Planifiez une intervention chez un client."
    : "Planifiez une visite, un état des lieux ou un rendez-vous de maintenance."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={event.title || ""}
                onChange={(e) => onEventChange({ ...event, title: e.target.value })}
                placeholder="Visite T3 rue de la Paix"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={event.event_type || "visit"}
                onValueChange={(val) => onEventChange({ ...event, event_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visit">Visite</SelectItem>
                  <SelectItem value="checkout">État des lieux</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={event.start_date || ""}
                onChange={(e) => onEventChange({ ...event, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Heure</label>
              <Input
                type="time"
                value={event.start_time || ""}
                onChange={(e) => onEventChange({ ...event, start_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lieu</label>
              <Input
                value={event.location || ""}
                onChange={(e) => onEventChange({ ...event, location: e.target.value })}
                placeholder="Adresse ou visio"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Participants</label>
              <Input
                value={event.attendees || ""}
                onChange={(e) => onEventChange({ ...event, attendees: e.target.value })}
                placeholder="Emails ou noms"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Bien {showPropertyHint && <span className="text-xs text-muted-foreground">(recommandé pour filtrer)</span>}
              </label>
              <Select
                value={event.property_id || "none"}
                onValueChange={(val) => onEventChange({ ...event, property_id: val === "none" ? null : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun bien</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select
                value={event.status || "scheduled"}
                onValueChange={(val) => onEventChange({ ...event, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={event.description || ""}
              onChange={(e) => onEventChange({ ...event, description: e.target.value })}
              placeholder="Détails, accès, code porte..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit}>
              {isEditing ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
