import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const events = [
  {
    id: "1",
    title: "Visite appartement 123 Rue de la Paix",
    time: "14:30",
    type: "visit",
    location: "123 Rue de la Paix, 75001 Paris",
    attendees: "Candidat: Sophie Martin",
    status: "confirmed"
  },
  {
    id: "2", 
    title: "État des lieux sortie - Studio 45",
    time: "10:00",
    type: "checkout",
    location: "45 Avenue des Champs, 75008 Paris",
    attendees: "Locataire: Pierre Dubois",
    status: "pending"
  },
  {
    id: "3",
    title: "Intervention plombier",
    time: "16:00",
    type: "maintenance",
    location: "78 Boulevard Victor Hugo, 75015 Paris",
    attendees: "Artisan: SOS Plomberie",
    status: "confirmed"
  }
]

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" }
}

const Calendar = () => {
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
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${eventTypes[event.type].color}`} />
                <div className="text-sm font-medium">{event.time}</div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.attendees}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{eventTypes[event.type].label}</Badge>
                    <Badge variant={event.status === "confirmed" ? "default" : "secondary"}>
                      {event.status === "confirmed" ? "Confirmé" : "En attente"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
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