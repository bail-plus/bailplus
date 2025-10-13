import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Plus, FileText, User, Phone, Mail, MapPin, AlertCircle, Clock, CheckCircle2, Wrench } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useMaintenanceTicketsWithDetails } from "@/hooks/useMaintenance"
import { useTenantData } from "@/hooks/useTenantData"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCreateMaintenanceTicket, type MaintenanceTicketInsert } from "@/hooks/useMaintenance"

const TenantDashboard = () => {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading } = useMaintenanceTicketsWithDetails()
  const { data: tenantData, isLoading: tenantDataLoading } = useTenantData()
  const navigate = useNavigate()
  const { toast } = useToast()
  const createTicket = useCreateMaintenanceTicket()

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [ticketFormData, setTicketFormData] = useState<MaintenanceTicketInsert>({
    title: "",
    description: "",
    property_id: "",
    unit_id: null,
    status: "NOUVEAU",
    priority: "MOYEN",
  })

  // Pour un locataire, on filtre uniquement SES tickets
  const myTickets = tickets.filter(ticket => ticket.created_by === profile?.user_id)

  const openTickets = tenantData?.openTicketsCount || 0
  const closedTickets = tenantData?.closedTicketsCount || 0
  const isLoading = ticketsLoading || tenantDataLoading

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketFormData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre de la demande",
        variant: "destructive",
      })
      return
    }

    // Auto-fill property and unit from tenant lease
    const finalTicketData = {
      ...ticketFormData,
      property_id: tenantData?.lease?.unit.property.id || ticketFormData.property_id,
      unit_id: tenantData?.lease?.unit.id || ticketFormData.unit_id,
      lease_id: tenantData?.lease?.id || null,
      description: ticketFormData.description || null,
    }

    try {
      await createTicket.mutateAsync(finalTicketData)

      toast({
        title: "Succès",
        description: "Votre demande a été créée avec succès",
      })

      setIsRequestDialogOpen(false)
      setTicketFormData({
        title: "",
        description: "",
        property_id: "",
        unit_id: null,
        status: "NOUVEAU",
        priority: "MOYEN",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string | null) => {
    const statuses = {
      NOUVEAU: { label: "Nouveau", variant: "destructive" as const, icon: AlertCircle },
      "EN COURS": { label: "En cours", variant: "default" as const, icon: Clock },
      "EN ATTENTE DE PIECE": { label: "En attente", variant: "secondary" as const, icon: Clock },
      TERMINE: { label: "Terminé", variant: "outline" as const, icon: CheckCircle2 }
    }
    return statuses[status as keyof typeof statuses] || { label: status || "Nouveau", variant: "secondary" as const, icon: AlertCircle }
  }

  const getPriorityBadge = (priority: string | null) => {
    const priorities = {
      URGENT: { label: "Urgente", variant: "destructive" as const },
      ELEVE: { label: "Élevée", variant: "destructive" as const },
      MOYEN: { label: "Moyenne", variant: "default" as const },
      FAIBLE: { label: "Faible", variant: "secondary" as const }
    }
    return priorities[priority as keyof typeof priorities] || { label: priority || "Moyenne", variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon espace locataire</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Nouvelle demande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une demande d'intervention</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la demande *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Fuite d'eau dans la salle de bain"
                  value={ticketFormData.title}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le problème en détail..."
                  value={ticketFormData.description}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Niveau d'urgence</Label>
                <Select
                  value={ticketFormData.priority ?? "MOYEN"}
                  onValueChange={(value) => setTicketFormData({ ...ticketFormData, priority: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAIBLE">Faible - Peut attendre</SelectItem>
                    <SelectItem value="MOYEN">Moyenne - À traiter prochainement</SelectItem>
                    <SelectItem value="ELEVE">Élevée - Important</SelectItem>
                    <SelectItem value="URGENT">Urgente - Nécessite intervention immédiate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createTicket.isPending}
                >
                  {createTicket.isPending ? "Envoi..." : "Envoyer la demande"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Home Info */}
      {tenantData?.lease && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Mon logement</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{tenantData.lease.unit.property.name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {tenantData.lease.unit.property.address}
                      {tenantData.lease.unit.property.city && `, ${tenantData.lease.unit.property.city}`}
                      {tenantData.lease.unit.property.postal_code && ` ${tenantData.lease.unit.property.postal_code}`}
                    </span>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <span>
                      <strong>Logement:</strong> {tenantData.lease.unit.unit_number}
                    </span>
                    {tenantData.lease.unit.surface && (
                      <span>
                        <strong>Surface:</strong> {tenantData.lease.unit.surface}m²
                      </span>
                    )}
                    {tenantData.lease.unit.type && (
                      <span>
                        <strong>Type:</strong> {tenantData.lease.unit.type}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 pt-1">
                    <span>
                      <strong>Loyer:</strong> {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(tenantData.lease.rent_amount)}
                    </span>
                    {tenantData.lease.charges_amount && (
                      <span>
                        <strong>Charges:</strong> {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(tenantData.lease.charges_amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demandes ouvertes</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{openTickets}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  En cours de traitement
                </p>
              </div>
              <div className={`w-12 h-12 ${openTickets > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
                <Wrench className={`w-6 h-6 ${openTickets > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demandes terminées</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{closedTickets}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Interventions réalisées
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total demandes</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{tenantData?.totalTicketsCount || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Depuis le début
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Mes demandes d'intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTickets.length > 0 ? (
              <div className="space-y-3">
                {myTickets.slice(0, 5).map((ticket) => {
                  const statusInfo = getStatusBadge(ticket.status)
                  const priorityInfo = getPriorityBadge(ticket.priority)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div key={ticket.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/app/maintenance')}>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <StatusIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(ticket.created_at)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge {...statusInfo} className="text-xs" />
                          <Badge {...priorityInfo} className="text-xs" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Aucune demande pour le moment</p>
                <p className="text-xs mt-2">Créez votre première demande d'intervention</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact propriétaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenantData?.lease?.landlord && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tenantData.lease.landlord.first_name && tenantData.lease.landlord.last_name
                        ? `${tenantData.lease.landlord.first_name} ${tenantData.lease.landlord.last_name}`
                        : 'Votre propriétaire'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pour toute question ou demande
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                {tenantData?.lease?.landlord?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{tenantData.lease.landlord.email}</span>
                  </div>
                )}
                {tenantData?.lease?.landlord?.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{tenantData.lease.landlord.phone_number}</span>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => navigate('/app/communications')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un message
                </Button>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 Pour toute urgence, utilisez le bouton "Nouvelle demande" en haut de page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto p-4" onClick={() => setIsRequestDialogOpen(true)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Nouvelle demande</p>
                  <p className="text-xs text-muted-foreground">Signaler un problème</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4" onClick={() => navigate('/app/documents')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Mes documents</p>
                  <p className="text-xs text-muted-foreground">Bail et annexes</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4" onClick={() => navigate('/app/maintenance')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">Toutes mes demandes</p>
                  <p className="text-xs text-muted-foreground">Historique complet</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TenantDashboard
