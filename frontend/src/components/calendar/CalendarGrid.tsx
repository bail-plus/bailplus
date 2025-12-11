import { format, isSameMonth, isSameDay } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

type CalendarItem = {
  id: string
  source: "event" | "rent" | "ticket"
  title: string
  start_date: string
  event_type: string
}

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" },
  rent_due: { label: "Loyer", color: "bg-emerald-500" },
  maintenance_ticket: { label: "Ticket maintenance", color: "bg-amber-500" },
  other: { label: "Autre", color: "bg-gray-400" },
}

interface CalendarGridProps {
  days: Date[]
  currentMonth: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  eventsByDate: Map<string, EventRow[]>
  extraEventsByDate: Map<string, CalendarItem[]>
}

export function CalendarGrid({
  days,
  currentMonth,
  selectedDate,
  onDateSelect,
  eventsByDate,
  extraEventsByDate,
}: CalendarGridProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const dayEvents = (eventsByDate.get(key) || []).length + (extraEventsByDate.get(key) || []).length
            const isSelected = isSameDay(day, selectedDate)
            return (
              <button
                key={key}
                onClick={() => onDateSelect(day)}
                className={`min-h-[80px] rounded-lg border text-left p-2 transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "hover:border-primary/40"
                } ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/70" : ""}`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{format(day, "d")}</span>
                  {dayEvents > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {dayEvents}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {(eventsByDate.get(key) || []).slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-xs px-2 py-1 rounded ${eventTypes[ev.event_type as keyof typeof eventTypes]?.color || "bg-gray-200"} text-white`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {(extraEventsByDate.get(key) || []).slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-xs px-2 py-1 rounded ${eventTypes[ev.event_type as keyof typeof eventTypes]?.color || "bg-gray-200"} text-white`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents > 4 && (
                    <div className="text-[10px] text-muted-foreground">+{dayEvents - 4} autres</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
