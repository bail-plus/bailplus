import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, User, Wrench, FileText, Plus, Mail, Phone, MapPin, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatDate, formatCurrency } from "@/utils/formatters"

// Types
interface Lease {
  id: string
  rent_amount: number
  charges_amount?: number
  unit: {
    id: string
    unit_number: string
    surface?: number
    type?: string
    property: {
      id: string
      name: string
      address: string
      city?: string
      postal_code?: string
    }
  }
  landlord?: {
    first_name?: string
    last_name?: string
    email?: string
    phone_number?: string
  }
}

interface Ticket {
  id: string
  title: string
  status: string | null
  priority: string | null
  created_at: string
}

// Badge helpers
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

// My Home Info Banner
interface MyHomeInfoProps {
  lease: Lease
}

export function MyHomeInfo({ lease }: MyHomeInfoProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Mon logement</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{lease.unit.property.name}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {lease.unit.property.address}
                  {lease.unit.property.city && `, ${lease.unit.property.city}`}
                  {lease.unit.property.postal_code && ` ${lease.unit.property.postal_code}`}
                </span>
              </div>
              <div className="flex gap-4 pt-2">
                <span>
                  <strong>Logement:</strong> {lease.unit.unit_number}
                </span>
                {lease.unit.surface && (
                  <span>
                    <strong>Surface:</strong> {lease.unit.surface}m²
                  </span>
                )}
                {lease.unit.type && (
                  <span>
                    <strong>Type:</strong> {lease.unit.type}
                  </span>
                )}
              </div>
              <div className="flex gap-4 pt-1">
                <span>
                  <strong>Loyer:</strong> {formatCurrency(lease.rent_amount)}
                </span>
                {lease.charges_amount && (
                  <span>
                    <strong>Charges:</strong> {formatCurrency(lease.charges_amount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// My Requests Card
interface MyRequestsCardProps {
  tickets: Ticket[]
}

export function MyRequestsCard({ tickets }: MyRequestsCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Mes demandes d'intervention
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.slice(0, 5).map((ticket) => {
              const statusInfo = getStatusBadge(ticket.status)
              const priorityInfo = getPriorityBadge(ticket.priority)
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={ticket.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/app/maintenance')}
                >
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
  )
}

// Contact Landlord Card
interface ContactLandlordCardProps {
  lease: Lease
}

export function ContactLandlordCard({ lease }: ContactLandlordCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact propriétaire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lease.landlord && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {lease.landlord.first_name && lease.landlord.last_name
                    ? `${lease.landlord.first_name} ${lease.landlord.last_name}`
                    : 'Votre propriétaire'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pour toute question ou demande
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            {lease.landlord?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{lease.landlord.email}</span>
              </div>
            )}
            {lease.landlord?.phone_number && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{lease.landlord.phone_number}</span>
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
  )
}

// Quick Actions Card
interface TenantQuickActionsProps {
  newRequestButton?: React.ReactNode
}

export function TenantQuickActionsCard({ newRequestButton }: TenantQuickActionsProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {newRequestButton || (
            <Button variant="outline" className="justify-start h-auto p-4" disabled>
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
          )}

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
  )
}
