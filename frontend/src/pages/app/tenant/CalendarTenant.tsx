import { useState, useMemo } from "react"
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useEntity } from "@/contexts/EntityContext"
import type { Tables } from "@/integrations/supabase/types"
import { useCalendarEvents } from "@/hooks/calendar/useCalendarEvents"
import { CalendarHeader } from "@/components/calendar/CalendarHeader"
import { CalendarFilters } from "@/components/calendar/CalendarFilters"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { EventsList } from "@/components/calendar/EventsList"
import { EventViewDialog } from "@/components/calendar/EventViewDialog"

type EventRow = Tables<"events">

/**
 * Calendrier spécifique pour les locataires
 * Affiche les rendez-vous et échéances en mode lecture seule
 */
const CalendarTenant = () => {
  const userType = "tenant"

  const { selectedEntity, showAll } = useEntity()
  const { data: allProperties = [] } = usePropertiesWithUnits()

  const properties = useMemo(() => {
    if (showAll || !selectedEntity) return allProperties
    return allProperties.filter(p => p.entity_id === selectedEntity.id)
  }, [allProperties, selectedEntity, showAll])

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewingEvent, setViewingEvent] = useState<EventRow | null>(null)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all")

  const { data, isLoading } = useCalendarEvents(currentMonth, "[CALENDAR_TENANT]")
  const events = data?.events || []
  const extraEvents = data?.extraEvents || []

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>()
    events
      .filter(ev => {
        if (selectedEventTypes.includes(ev.event_type)) return false
        if (selectedPropertyFilter === "all") return true
        return ev.property_id === selectedPropertyFilter
      })
      .forEach(ev => {
        const key = ev.start_date
        map.set(key, [...(map.get(key) || []), ev])
      })
    return map
  }, [events, selectedEventTypes, selectedPropertyFilter])

  const extraEventsByDate = useMemo(() => {
    const map = new Map<string, typeof extraEvents>()
    extraEvents
      .filter(ev => {
        if (selectedEventTypes.includes(ev.event_type)) return false
        if (selectedPropertyFilter === "all") return true
        return true
      })
      .forEach(ev => {
        const key = ev.start_date
        map.set(key, [...(map.get(key) || []), ev])
      })
    return map
  }, [extraEvents, selectedEventTypes, selectedPropertyFilter])

  const eventsOfSelectedDay = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd")
    const base = eventsByDate.get(key) || []
    const extra = extraEventsByDate.get(key) || []
    return { base, extra }
  }, [selectedDate, eventsByDate, extraEventsByDate])

  const handleEventClick = (event: EventRow) => {
    setViewingEvent(event)
    setIsViewOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CalendarHeader
        title="Mon Calendrier"
        description="Consultez vos rendez-vous et échéances"
        canCreate={false}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        eventsCount={events.length + extraEvents.length}
      />

      <CalendarFilters
        properties={properties}
        selectedPropertyFilter={selectedPropertyFilter}
        onPropertyFilterChange={setSelectedPropertyFilter}
        selectedEventTypes={selectedEventTypes}
        onEventTypesChange={setSelectedEventTypes}
        filteredEventsCount={Object.values(eventsByDate).flat().length + Object.values(extraEventsByDate).flat().length}
      />

      <CalendarGrid
        days={days}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        eventsByDate={eventsByDate}
        extraEventsByDate={extraEventsByDate}
      />

      <EventsList
        selectedDate={selectedDate}
        baseEvents={eventsOfSelectedDay.base}
        extraEvents={eventsOfSelectedDay.extra}
        loading={isLoading}
        onEventClick={handleEventClick}
      />

      <EventViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        event={viewingEvent}
      />
    </div>
  )
}

export default CalendarTenant
