import { useState, useEffect, useMemo } from "react"
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { useSearchParams } from "react-router-dom"
import { useToast } from "@/hooks/ui/use-toast"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useAuth } from "@/hooks/auth/useAuth"
import { useEntity } from "@/contexts/EntityContext"
import { supabase } from "@/integrations/supabase/client"
import type { Tables, TablesInsert } from "@/integrations/supabase/types"
import { useCalendarEvents } from "@/hooks/calendar/useCalendarEvents"
import { CalendarHeader } from "@/components/calendar/CalendarHeader"
import { CalendarFilters } from "@/components/calendar/CalendarFilters"
import { CalendarGrid } from "@/components/calendar/CalendarGrid"
import { EventsList } from "@/components/calendar/EventsList"
import { EventFormDialog } from "@/components/calendar/EventFormDialog"

type EventRow = Tables<"events">

/**
 * Calendrier spécifique pour les prestataires
 * Affiche uniquement les interventions et rendez-vous de maintenance
 */
const CalendarProvider = () => {
  const userType = "provider"

  const { selectedEntity, showAll } = useEntity()
  const { data: allProperties = [] } = usePropertiesWithUnits()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const properties = useMemo(() => {
    if (showAll || !selectedEntity) return allProperties
    return allProperties.filter(p => p.entity_id === selectedEntity.id)
  }, [allProperties, selectedEntity, showAll])

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>("all")
  const [newEvent, setNewEvent] = useState<Partial<EventRow> & { description?: string | null }>({
    start_date: format(new Date(), "yyyy-MM-dd"),
    event_type: "maintenance",
  })

  const { data, isLoading, refetch } = useCalendarEvents(currentMonth, "[CALENDAR_PROVIDER]")
  const events = data?.events || []
  const extraEvents = data?.extraEvents || []

  // Auto-ouverture du formulaire via ?create=visit
  useEffect(() => {
    if (searchParams.get("create") === "visit") {
      setIsCreateOpen(true)
      setEditingEventId(null)
      setNewEvent({
        start_date: format(new Date(), "yyyy-MM-dd"),
        event_type: "maintenance",
      })
      const next = new URLSearchParams(searchParams)
      next.delete("create")
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

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

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_date) {
      toast({ title: "Titre requis", description: "Ajoutez un titre et une date.", variant: "destructive" })
      return
    }
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté pour créer un événement.", variant: "destructive" })
      return
    }
    try {
      const payload: TablesInsert<"events"> = {
        title: newEvent.title,
        start_date: newEvent.start_date,
        start_time: newEvent.start_time || null,
        end_date: newEvent.end_date || null,
        end_time: newEvent.end_time || null,
        event_type: newEvent.event_type || "other",
        location: newEvent.location || null,
        attendees: newEvent.attendees || null,
        description: newEvent.description || null,
        property_id: newEvent.property_id || null,
        unit_id: newEvent.unit_id || null,
        status: newEvent.status || null,
        tenant_id: newEvent.tenant_id || null,
        user_id: user.id,
      }

      console.log('[CALENDAR_PROVIDER] Creating/updating event with payload:', payload)

      if (editingEventId) {
        const { data, error } = await supabase.from('events').update(payload).eq('id', editingEventId).select()
        console.log('[CALENDAR_PROVIDER] Update result:', { data, error })
        if (error) throw error
        toast({ title: "Intervention mise à jour", description: "L'événement a été modifié." })
      } else {
        const { data, error } = await supabase.from('events').insert(payload).select()
        console.log('[CALENDAR_PROVIDER] Insert result:', { data, error })
        if (error) throw error
        toast({ title: "Intervention créée", description: "L'événement a été ajouté au calendrier." })
      }
      setIsCreateOpen(false)
      setEditingEventId(null)
      setNewEvent({
        start_date: format(selectedDate, "yyyy-MM-dd"),
        event_type: "maintenance",
      })
      refetch()
    } catch (error) {
      console.error('[CALENDAR_PROVIDER] Error creating event:', error)
      toast({ title: "Erreur", description: "Impossible de créer l'intervention", variant: "destructive" })
    }
  }

  const handleOpenCreate = () => {
    setEditingEventId(null)
    const defaultPropertyId = (!showAll && selectedEntity && properties.length > 0)
      ? properties[0].id
      : undefined
    setNewEvent({
      start_date: format(selectedDate, "yyyy-MM-dd"),
      event_type: "maintenance",
      property_id: defaultPropertyId,
    })
    setIsCreateOpen(true)
  }

  const handleEventClick = (event: EventRow) => {
    setEditingEventId(event.id)
    setNewEvent({
      ...event,
      description: event.description || null,
    })
    setIsCreateOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CalendarHeader
        title="Mes Interventions"
        description="Gérez vos interventions et rendez-vous clients"
        canCreate={true}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        eventsCount={events.length + extraEvents.length}
        onCreateClick={handleOpenCreate}
        createButtonText="Nouvelle intervention"
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

      <EventFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        event={newEvent}
        onEventChange={setNewEvent}
        onSubmit={handleCreateEvent}
        isEditing={!!editingEventId}
        properties={properties}
        userType={userType}
        showPropertyHint={!showAll && !!selectedEntity}
      />
    </div>
  )
}

export default CalendarProvider
