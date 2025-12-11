import { Clock, MapPin, Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" },
  rent_due: { label: "Loyer", color: "bg-emerald-500" },
  maintenance_ticket: { label: "Ticket maintenance", color: "bg-amber-500" },
  other: { label: "Autre", color: "bg-gray-400" },
}

interface EventViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EventRow | null
}

export function EventViewDialog({ open, onOpenChange, event }: EventViewDialogProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Détails de l'événement</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informations détaillées sur ce rendez-vous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Titre</label>
            <p className="text-base">{event.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <Badge>{eventTypes[event.event_type as keyof typeof eventTypes]?.label || event.event_type}</Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-sm">{format(new Date(event.start_date), "d MMMM yyyy", { locale: fr })}</p>
            </div>
          </div>
          {event.start_time && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Heure</label>
              <p className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {event.start_time.slice(0, 5)}
                {event.end_time ? ` → ${event.end_time.slice(0, 5)}` : ""}
              </p>
            </div>
          )}
          {event.location && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Lieu</label>
              <p className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.location}
              </p>
            </div>
          )}
          {event.attendees && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Participants</label>
              <p className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                {event.attendees}
              </p>
            </div>
          )}
          {event.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
