import { Clock, MapPin, Users, Euro, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

type CalendarItem = {
  id: string
  source: "event" | "rent" | "ticket"
  title: string
  start_date: string
  start_time?: string | null
  end_time?: string | null
  event_type: string
  location?: string | null
  attendees?: string | null
  status?: string | null
  description?: string | null
  meta?: {
    property?: string | null
    amount?: number | null
    tenant?: string | null
  }
}

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" },
  rent_due: { label: "Loyer", color: "bg-emerald-500" },
  maintenance_ticket: { label: "Ticket maintenance", color: "bg-amber-500" },
  other: { label: "Autre", color: "bg-gray-400" },
}

interface EventsListProps {
  selectedDate: Date
  baseEvents: EventRow[]
  extraEvents: CalendarItem[]
  loading: boolean
  onEventClick?: (event: EventRow) => void
}

export function EventsList({
  selectedDate,
  baseEvents,
  extraEvents,
  loading,
  onEventClick,
}: EventsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">Chargement des événements...</div>
        ) : (baseEvents.length + extraEvents.length) === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucun événement ce jour.
          </div>
        ) : (
          <>
            {baseEvents.map((event) => (
              <button
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card text-left hover:border-primary/60 w-full"
                onClick={() => onEventClick?.(event)}
              >
                <div className={`w-2 h-2 rounded-full mt-1 ${eventTypes[event.event_type as keyof typeof eventTypes]?.color || "bg-gray-400"}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant="secondary">
                      {eventTypes[event.event_type as keyof typeof eventTypes]?.label || event.event_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {event.start_time ? event.start_time.slice(0, 5) : "Heure non définie"}
                    {event.end_time ? ` → ${event.end_time.slice(0, 5)}` : ""}
                  </p>
                  {event.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </p>
                  )}
                  {event.attendees && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.attendees}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
              </button>
            ))}
            {extraEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <div className={`w-2 h-2 rounded-full mt-1 ${eventTypes[event.event_type as keyof typeof eventTypes]?.color || "bg-gray-400"}`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant="secondary">
                      {eventTypes[event.event_type as keyof typeof eventTypes]?.label || event.event_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {event.start_time ? event.start_time.slice(0, 5) : "Date"}
                  </p>
                  {event.meta?.property && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.meta.property}
                    </p>
                  )}
                  {event.meta?.tenant && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.meta.tenant}
                    </p>
                  )}
                  {event.meta?.amount !== undefined && event.meta.amount !== null && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      {event.meta.amount} €
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
