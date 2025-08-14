import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Plus, Search, User, FileText } from "lucide-react"

const KANBAN_COLUMNS = [
  { id: "to_publish", title: "À diffuser", color: "bg-muted" },
  { id: "leads", title: "Leads", color: "bg-yellow-50" },
  { id: "applications", title: "Dossiers", color: "bg-blue-50" },
  { id: "visits", title: "Visites", color: "bg-purple-50" },
  { id: "draft_lease", title: "Bail (brouillon)", color: "bg-orange-50" },
  { id: "signed", title: "Signé", color: "bg-green-50" },
  { id: "active", title: "Actif", color: "bg-emerald-50" }
]

const MOCK_UNITS = [
  {
    id: "1",
    property: "25 rue de la Paix",
    label: "Appartement T3",
    surface: 65,
    targetRent: 1200,
    status: "to_publish",
    city: "Paris 2e"
  },
  {
    id: "2", 
    property: "10 avenue Mozart",
    label: "Studio",
    surface: 25,
    targetRent: 800,
    status: "leads",
    city: "Paris 16e",
    leads: 3
  },
  {
    id: "3",
    property: "25 rue de la Paix", 
    label: "T2 avec balcon",
    surface: 45,
    targetRent: 1100,
    status: "visits",
    city: "Paris 2e",
    nextVisit: "2024-01-20 14:00"
  }
]

export default function Leasing() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<any>(null)

  const filteredUnits = MOCK_UNITS.filter(unit =>
    unit.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      to_publish: { label: "À diffuser", variant: "secondary" as const },
      leads: { label: "Leads", variant: "default" as const },
      applications: { label: "Dossiers", variant: "default" as const },
      visits: { label: "Visites", variant: "default" as const },
      draft_lease: { label: "Brouillon", variant: "outline" as const },
      signed: { label: "Signé", variant: "default" as const },
      active: { label: "Actif", variant: "default" as const }
    }
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location</h1>
          <p className="text-muted-foreground mt-1">
            Pipeline de mise en location et gestion des baux
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Fonctionnalité en cours de développement
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un bien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[600px]">
        {KANBAN_COLUMNS.map(column => {
          const columnUnits = filteredUnits.filter(unit => unit.status === column.id)
          
          return (
            <div key={column.id} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnUnits.length}
                </Badge>
              </div>

              {/* Column Cards */}
              <div className="space-y-3">
                {columnUnits.map(unit => (
                  <Card 
                    key={unit.id} 
                    className={`cursor-pointer transition-shadow hover:shadow-md ${column.color}`}
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Title */}
                        <div>
                          <h4 className="font-semibold text-sm">{unit.label}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {unit.property}, {unit.city}
                          </p>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {unit.surface}m² • {unit.targetRent}€/mois
                          </div>
                          
                          <Badge {...getStatusBadge(unit.status)} className="text-xs" />
                          
                          {unit.leads && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {unit.leads} lead(s)
                            </div>
                          )}
                          
                          {unit.nextVisit && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {unit.nextVisit}
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          {column.id === "leads" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                              Planifier visite
                            </Button>
                          )}
                          {column.id === "visits" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                              Créer bail
                            </Button>
                          )}
                          {column.id === "draft_lease" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                              Envoyer signature
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedUnit.label} - {selectedUnit.property}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Surface:</span> {selectedUnit.surface}m²
                </div>
                <div>
                  <span className="font-medium">Loyer cible:</span> {selectedUnit.targetRent}€
                </div>
                <div>
                  <span className="font-medium">Statut:</span>
                  <Badge {...getStatusBadge(selectedUnit.status)} className="ml-2 text-xs" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  Voir le bien
                </Button>
                <Button variant="outline" size="sm">
                  Historique
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}