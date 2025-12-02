import { useState, useEffect, useCallback, useMemo } from "react"
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus, Euro } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import { useEntity } from "@/contexts/EntityContext"
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { useSearchParams } from "react-router-dom"
import { useToast } from "@/hooks/ui/use-toast"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

type CalendarItem = {
  id: string
  source: "event" | "rent" | "ticket"
  title: string
  start_date: string
  start_time?: string | null
  end_date?: string | null
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

const Calendar = () => {
  const { selectedEntity, showAll } = useEntity()
  const { data: properties = [] } = usePropertiesWithUnits()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState<EventRow[]>([])
  const [extraEvents, setExtraEvents] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<EventRow>>({
    start_date: format(new Date(), "yyyy-MM-dd"),
    event_type: "visit",
  })

  const loadEvents = useCallback(async (monthDate: Date) => {
    try {
      setLoading(true)

      // Filtrage par entité => propriété
      let propertyIds: string[] = []
      if (!showAll && selectedEntity) {
        const { data: props } = await supabase
          .from('properties')
          .select('id')
          .eq('entity_id', selectedEntity.id)
        propertyIds = props?.map(p => p.id) || []
      }

      const rangeStart = format(startOfMonth(monthDate), "yyyy-MM-dd")
      const rangeEnd = format(endOfMonth(monthDate), "yyyy-MM-dd")

      let query = supabase
        .from('events')
        .select('*')
        .gte('start_date', rangeStart)
        .lte('start_date', rangeEnd)

      if (!showAll && selectedEntity && propertyIds.length > 0) {
        query = query.in('property_id', propertyIds)
      }

      const { data, error } = await query.order('start_date').order('start_time', { nullsFirst: false })
      if (error) throw error
      setEvents(data || [])

      // Charger les loyers dus dans le mois
      const { data: rentData, error: rentError } = await supabase
        .from('rent_invoices')
        .select(`
          id,
          due_date,
          status,
          total_amount,
          period_month,
          period_year,
          lease:leases!rent_invoices_lease_id_fkey (
            tenant:profiles!leases_tenant_id_fkey ( first_name, last_name ),
            units:units!leases_unit_id_fkey (
              unit_number,
              properties ( id, name )
            )
          )
        `)
        .gte('due_date', rangeStart)
        .lte('due_date', rangeEnd)
        .order('due_date', { ascending: true })

      if (rentError) throw rentError

      const rentItems: CalendarItem[] = (rentData || [])
        .filter((inv: any) => {
          if (!showAll && selectedEntity && propertyIds.length > 0) {
            const pid = inv.lease?.units?.properties?.id
            return pid ? propertyIds.includes(pid) : false
          }
          return true
        })
        .map((inv: any) => ({
          id: inv.id,
          source: "rent",
          title: `Loyer ${inv.period_month}/${inv.period_year}`,
          start_date: inv.due_date,
          start_time: null,
          end_date: inv.due_date,
          end_time: null,
          event_type: "rent_due",
          status: inv.status,
          location: inv.lease?.units?.properties?.name || null,
          attendees: inv.lease?.tenant ? `${inv.lease.tenant.first_name || ""} ${inv.lease.tenant.last_name || ""}`.trim() : null,
          meta: {
            property: inv.lease?.units?.properties?.name || null,
            amount: inv.total_amount,
            tenant: inv.lease?.tenant ? `${inv.lease.tenant.first_name || ""} ${inv.lease.tenant.last_name || ""}`.trim() : null,
          },
        }))

      // Charger les tickets maintenance du mois (date ciblée = estimated_resolution_date sinon created_at)
      let ticketsQuery = supabase
        .from('maintenance_tickets')
        .select(`
          id,
          title,
          status,
          estimated_resolution_date,
          created_at,
          property:properties ( id, name )
        `)

      if (!showAll && selectedEntity && propertyIds.length > 0) {
        ticketsQuery = ticketsQuery.in('property_id', propertyIds)
      }

      const { data: ticketData, error: ticketError } = await ticketsQuery
      if (ticketError) throw ticketError

      const ticketItems: CalendarItem[] = (ticketData || [])
        .map((t: any) => {
          const dateStr: string | null = t.estimated_resolution_date || (t.created_at ? t.created_at.slice(0, 10) : null)
          return {
            id: t.id,
            source: "ticket",
            title: t.title || "Ticket",
            start_date: dateStr || format(currentMonth, "yyyy-MM-dd"),
            start_time: null,
            end_date: dateStr,
            end_time: null,
            event_type: "maintenance_ticket",
            status: t.status,
            location: t.property?.name || null,
            meta: {
              property: t.property?.name || null,
            },
          } as CalendarItem
        })
        .filter((t) => t.start_date >= rangeStart && t.start_date <= rangeEnd)

      setExtraEvents([...rentItems, ...ticketItems])
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      })
      setEvents([])
      setExtraEvents([])
    } finally {
      setLoading(false)
    }
  }, [selectedEntity, showAll, toast])

  useEffect(() => {
    loadEvents(currentMonth)
  }, [currentMonth, loadEvents])

  // Auto-ouverture du formulaire via ?create=visit
  useEffect(() => {
    if (searchParams.get("create") === "visit") {
      setIsCreateOpen(true)
      setEditingEventId(null)
      setNewEvent({
        start_date: format(new Date(), "yyyy-MM-dd"),
        event_type: "visit",
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
    events.forEach(ev => {
      const key = ev.start_date
      map.set(key, [...(map.get(key) || []), ev])
    })
    return map
  }, [events])

  const extraEventsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    extraEvents.forEach(ev => {
      const key = ev.start_date
      map.set(key, [...(map.get(key) || []), ev])
    })
    return map
  }, [extraEvents])

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
    try {
      const payload: Tables<"events">["Insert"] = {
        title: newEvent.title,
        start_date: newEvent.start_date,
        start_time: newEvent.start_time || null,
        end_date: newEvent.end_date || null,
        end_time: newEvent.end_time || null,
        event_type: newEvent.event_type || "other",
        location: newEvent.location || null,
        attendees: newEvent.attendees || null,
        description: (newEvent as any).description || null,
        property_id: newEvent.property_id || null,
        unit_id: newEvent.unit_id || null,
        status: newEvent.status || null,
        tenant_id: newEvent.tenant_id || null,
      }

      if (editingEventId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingEventId)
        if (error) throw error
        toast({ title: "Rendez-vous mis à jour", description: "L'événement a été modifié." })
      } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
        toast({ title: "Rendez-vous créé", description: "L'événement a été ajouté au calendrier." })
      }
      setIsCreateOpen(false)
      setEditingEventId(null)
      setNewEvent({
        start_date: format(selectedDate, "yyyy-MM-dd"),
        event_type: "visit",
      })
      loadEvents(currentMonth)
    } catch (error) {
      console.error(error)
      toast({ title: "Erreur", description: "Impossible de créer le rendez-vous", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground">
            Gérez vos rendez-vous et interventions
          </p>
        </div>
        <Button
          className="bg-gradient-primary"
          onClick={() => {
            setEditingEventId(null)
            setNewEvent({
              start_date: format(selectedDate, "yyyy-MM-dd"),
              event_type: "visit",
            })
            setIsCreateOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {events.length + extraEvents.length} événement{(events.length + extraEvents.length) > 1 ? "s" : ""} ce mois
        </div>
      </div>

      {/* Calendar grid */}
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
                  onClick={() => setSelectedDate(day)}
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

      {/* Events of selected day */}
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
          ) : (eventsOfSelectedDay.base.length + eventsOfSelectedDay.extra.length) === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun événement ce jour.
            </div>
          ) : (
            <>
            {eventsOfSelectedDay.base.map((event) => (
              <button
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card text-left hover:border-primary/60"
                onClick={() => {
                  setEditingEventId(event.id)
                  setNewEvent({
                    ...event,
                    description: (event as any).description || null,
                  })
                  setIsCreateOpen(true)
                }}
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
            {eventsOfSelectedDay.extra.map((event) => (
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

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Planifiez une visite, un état des lieux ou un rendez-vous de maintenance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={newEvent.title || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Visite T3 rue de la Paix"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newEvent.event_type || "visit"}
                  onValueChange={(val) => setNewEvent({ ...newEvent, event_type: val })}
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
                  value={newEvent.start_date || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure</label>
                <Input
                  type="time"
                  value={newEvent.start_time || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lieu</label>
                <Input
                  value={newEvent.location || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Adresse ou visio"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Participants</label>
                <Input
                  value={newEvent.attendees || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                  placeholder="Emails ou noms"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bien</label>
                <Select
                  value={newEvent.property_id || "none"}
                  onValueChange={(val) => setNewEvent({ ...newEvent, property_id: val === "none" ? null : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
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
                  value={newEvent.status || "scheduled"}
                  onValueChange={(val) => setNewEvent({ ...newEvent, status: val })}
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
                value={(newEvent as any).description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Détails, accès, code porte..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateEvent}>
                {editingEventId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Calendar
