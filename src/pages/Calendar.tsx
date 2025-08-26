import { useState, useEffect, useCallback } from "react"
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

interface Event {
  id: string
  title: string
  start_time: string | null
  event_type: string
  location: string | null
  attendees: string | null
  status: string | null
}

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" }
}

const Calendar = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('start_date', new Date().toISOString().split('T')[0])
        .order('start_time')
      
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des événements...</div>
      </div>
    )
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
        <Button className="bg-gradient-primary">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Aujourd'hui - Mardi 14 Mai 2024
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement prévu aujourd'hui</p>
              <Button className="mt-4" variant="outline">
                Ajouter un événement
              </Button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${eventTypes[event.event_type as keyof typeof eventTypes]?.color || 'bg-gray-500'}`} />
                  <div className="text-sm font-medium">
                    {event.start_time ? event.start_time.slice(0, 5) : '00:00'}
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attendees}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {eventTypes[event.event_type as keyof typeof eventTypes]?.label || event.event_type}
                      </Badge>
                      <Badge variant={event.status === "confirmed" ? "default" : "secondary"}>
                        {event.status === "confirmed" ? "Confirmé" : event.status === "pending" ? "En attente" : event.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Calendar Grid Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Vue mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 6 + 14 // Start from day 8, today is 14
              const isToday = day === 14
              const hasEvent = [14, 15, 18, 22].includes(day)
              
              return (
                <div
                  key={i}
                  className={`
                    aspect-square p-2 border rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors
                    ${isToday ? "bg-primary text-primary-foreground" : ""}
                    ${hasEvent && !isToday ? "bg-blue-50 border-blue-200" : ""}
                    ${day < 1 || day > 31 ? "text-muted-foreground/50" : ""}
                  `}
                >
                  <div className="font-medium">{day > 0 && day <= 31 ? day : ""}</div>
                  {hasEvent && !isToday && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Calendar