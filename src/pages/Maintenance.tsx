import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Clock, CheckCircle, Wrench, Plus, Search, Calendar, User, MapPin, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const KANBAN_COLUMNS = [
  { id: "NEW", title: "Nouveau", color: "bg-red-50", icon: AlertTriangle },
  { id: "IN_PROGRESS", title: "En cours", color: "bg-yellow-50", icon: Clock },
  { id: "WAITING_PARTS", title: "Attente pièces", color: "bg-blue-50", icon: Clock },
  { id: "DONE", title: "Terminé", color: "bg-green-50", icon: CheckCircle }
]

export default function Maintenance() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select('*')
      
      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les tickets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    
    return matchesSearch && matchesPriority
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des tickets...</p>
          </div>
        </div>
      </div>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorities = {
      HIGH: { label: "Élevée", variant: "destructive" as const },
      MEDIUM: { label: "Moyenne", variant: "default" as const },
      LOW: { label: "Faible", variant: "secondary" as const }
    }
    return priorities[priority as keyof typeof priorities] || { label: priority, variant: "secondary" as const }
  }

  const getStatusBadge = (status: string) => {
    const statuses = {
      NEW: { label: "Nouveau", variant: "destructive" as const },
      IN_PROGRESS: { label: "En cours", variant: "default" as const },
      WAITING_PARTS: { label: "Attente pièces", variant: "secondary" as const },
      DONE: { label: "Terminé", variant: "outline" as const }
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">
            Tickets de maintenance et ordres de travail
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              Liste
            </Button>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un ticket de maintenance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité en cours de développement
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="HIGH">Élevée</SelectItem>
            <SelectItem value="MEDIUM">Moyenne</SelectItem>
            <SelectItem value="LOW">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map(column => {
          const count = tickets.filter(t => t.status === column.id).length
          return (
            <Card key={column.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <column.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{column.title}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
          {KANBAN_COLUMNS.map(column => {
            const columnTickets = filteredTickets.filter(ticket => ticket.status === column.id)
            
            return (
              <div key={column.id} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-2">
                    <column.icon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnTickets.length}
                  </Badge>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {columnTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucun ticket {column.title.toLowerCase()}
                    </div>
                  ) : columnTickets.map(ticket => (
                    <Card 
                      key={ticket.id} 
                      className={`cursor-pointer transition-shadow hover:shadow-md ${column.color}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Title & Priority */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm line-clamp-2">{ticket.title}</h4>
                            <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                          </div>

                          {/* Created Date */}
                          <div className="text-xs text-muted-foreground">
                            Créé le: {formatDate(ticket.created_at)}
                          </div>

                          {/* Description */}
                          {ticket.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow 
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground">
                          #{ticket.id} • {formatDate(ticket.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                    </TableCell>
                    
                    <TableCell>
                      <Badge {...getStatusBadge(ticket.status)} className="text-xs" />
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{ticket.property}</div>
                        <div className="text-xs text-muted-foreground">{ticket.unit}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{ticket.reporter}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{ticket.assignedTo || "-"}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {ticket.finalCost ? `${ticket.finalCost}€` : 
                         ticket.estimatedCost ? `~${ticket.estimatedCost}€` : "-"}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Ticket #{selectedTicket.id} - {selectedTicket.title}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="summary" className="mt-4">
              <TabsList>
                <TabsTrigger value="summary">Résumé</TabsTrigger>
                <TabsTrigger value="workorders">Work Orders</TabsTrigger>
                <TabsTrigger value="attachments">Pièces jointes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Priorité:</span>
                    <Badge {...getPriorityBadge(selectedTicket.priority)} className="ml-2 text-xs" />
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <Badge {...getStatusBadge(selectedTicket.status)} className="ml-2 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Bien:</span> {selectedTicket.property}
                  </div>
                  <div>
                    <span className="font-medium">Unité:</span> {selectedTicket.unit}
                  </div>
                  <div>
                    <span className="font-medium">Demandeur:</span> {selectedTicket.reporter}
                  </div>
                  <div>
                    <span className="font-medium">Créé le:</span> {formatDate(selectedTicket.createdAt)}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="workorders" className="space-y-4">
                {selectedTicket.workOrders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTicket.workOrders.map((wo: any) => (
                      <Card key={wo.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{wo.vendor}</span>
                              {wo.approved && (
                                <Badge variant="outline" className="text-xs">Approuvé</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Devis: {wo.estimatedAmount}€
                              {wo.finalAmount && ` • Final: ${wo.finalAmount}€`}
                            </div>
                            {wo.scheduledAt && (
                              <div className="text-sm text-muted-foreground">
                                Programmé: {formatDate(wo.scheduledAt)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun ordre de travail créé
                  </p>
                )}
                
                <Button variant="outline" size="sm">
                  Créer un work order
                </Button>
              </TabsContent>
              
              <TabsContent value="attachments" className="space-y-4">
                {selectedTicket.photos > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.photos} photo(s) associée(s)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune pièce jointe
                  </p>
                )}
                <div className="text-sm text-muted-foreground">
                  Gestion des pièces jointes en cours de développement
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <Button variant="outline" size="sm">
                Assigner
              </Button>
              <Button variant="outline" size="sm">
                Changer statut
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}