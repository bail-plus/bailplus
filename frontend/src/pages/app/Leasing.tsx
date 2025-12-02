import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Plus, Search, User, FileText } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

const KANBAN_COLUMNS = [
  { id: "to_publish", title: "À diffuser", color: "bg-muted" },
  { id: "leads", title: "Leads", color: "bg-yellow-50" },
  { id: "applications", title: "Dossiers", color: "bg-blue-50" },
  { id: "visits", title: "Visites", color: "bg-purple-50" },
  { id: "draft_lease", title: "Bail (brouillon)", color: "bg-orange-50" },
  { id: "signed", title: "Signé", color: "bg-green-50" },
  { id: "active", title: "Actif", color: "bg-emerald-50" }
]

interface LeasingUnit {
  id: string
  property_name: string
  unit_number: string
  type: string
  surface: number | null
  status: string
  target_rent?: number
}

export default function Leasing() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnit, setSelectedUnit] = useState<any>(null)
  const [units, setUnits] = useState<LeasingUnit[]>([])
  const [loading, setLoading] = useState(true)

  const loadUnits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          properties!inner(name, address)
        `)
      
      if (error) throw error

      const formattedUnits = (data || []).map((unit: any) => ({
        id: unit.id,
        property_name: unit.properties?.name || 'N/A',
        unit_number: unit.unit_number,
        type: unit.type || 'N/A',
        surface: unit.surface,
        status: 'to_publish', // Default status since we don't have leasing status yet
        target_rent: 1000 // Placeholder
      }))

      setUnits(formattedUnits)
    } catch (error) {
      console.error('Error loading units:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const filteredUnits = units.filter(unit =>
    unit.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des biens...</div>
      </div>
    )
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
                {columnUnits.length === 0 && column.id === "to_publish" && filteredUnits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Aucun bien disponible</p>
                  </div>
                ) : (
                  columnUnits.map(unit => (
                    <Card 
                      key={unit.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${column.color}`}
                      onClick={() => setSelectedUnit(unit)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Title */}
                          <div>
                            <h4 className="font-semibold text-sm">{unit.type} - {unit.unit_number}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {unit.property_name}
                            </p>
                          </div>

                          {/* Details */}
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {unit.surface ? `${unit.surface}m²` : 'N/A'} • {unit.target_rent || 'N/A'}€/mois
                            </div>
                            
                            <Badge {...getStatusBadge(unit.status)} className="text-xs" />
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
                  ))
                )}
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
                  <span className="font-medium">Surface:</span> {selectedUnit.surface ? `${selectedUnit.surface}m²` : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Loyer cible:</span> {selectedUnit.target_rent || 'N/A'}€
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