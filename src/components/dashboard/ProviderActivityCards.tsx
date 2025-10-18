import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, Calendar, FileText, TrendingUp, Star, MapPin, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { formatDate } from "@/utils/formatters"

// Types
interface Ticket {
  id: string
  title: string
  status: string | null
  priority: string | null
  created_at: string
  property?: {
    name: string
  }
  unit?: {
    unit_number: string
  }
}

interface Rating {
  id: string
  rating: number | null
  comment: string | null
  created_at: string
}

interface ProviderInfo {
  total_interventions?: number
  average_rating?: number
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

// Ratings Card
interface RatingsCardProps {
  ratings: Rating[]
}

export function RatingsCard({ ratings }: RatingsCardProps) {
  if (!ratings || ratings.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Star className="w-5 h-5" />
          Mes avis clients ({ratings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ratings.slice(0, 3).map((rating) => (
            <div key={rating.id} className="flex gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (rating.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{rating.rating}/5</span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-muted-foreground">{rating.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(rating.created_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          ))}
          {ratings.length > 3 && (
            <Button variant="outline" className="w-full" size="sm">
              Voir tous les avis ({ratings.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Missions Card
interface MissionsCardProps {
  missions: Ticket[]
}

export function MissionsCard({ missions }: MissionsCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Mes missions assignées
        </CardTitle>
      </CardHeader>
      <CardContent>
        {missions.length > 0 ? (
          <div className="space-y-3">
            {missions.slice(0, 5).map((ticket) => {
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
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{ticket.property?.name}</span>
                    </div>
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
            <p className="text-sm">Aucune mission assignée</p>
            <p className="text-xs mt-2">Les nouvelles missions apparaîtront ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Upcoming Interventions Card
interface UpcomingInterventionsCardProps {
  missions: Ticket[]
}

export function UpcomingInterventionsCard({ missions }: UpcomingInterventionsCardProps) {
  const activeMissions = missions.filter(t => t.status !== 'TERMINE')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Prochaines interventions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeMissions.length > 0 ? (
          <div className="space-y-3">
            {activeMissions.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.property?.name}
                    {ticket.unit && ` - ${ticket.unit.unit_number}`}
                  </p>
                </div>
                <Badge {...getStatusBadge(ticket.status)} className="text-xs" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucune intervention prévue</p>
            <p className="text-xs mt-2">Votre planning est à jour ! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Performance Stats Card
interface PerformanceStatsCardProps {
  totalMissions: number
  completedMissions: number
  newMissions: number
  providerInfo?: ProviderInfo
}

export function PerformanceStatsCard({
  totalMissions,
  completedMissions,
  newMissions,
  providerInfo,
}: PerformanceStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Mes statistiques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taux de completion</span>
            <span className="text-lg font-bold">
              {totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total interventions</span>
            <span className="text-lg font-bold">{providerInfo?.total_interventions || totalMissions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">En attente</span>
            <span className="text-lg font-bold text-orange-600">{newMissions}</span>
          </div>
          {providerInfo?.average_rating && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Note moyenne</span>
              <span className="text-lg font-bold">{providerInfo.average_rating.toFixed(1)}/5</span>
            </div>
          )}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Maintenez un bon taux de completion pour recevoir plus de missions
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Card
export function ProviderQuickActionsCard() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/maintenance')}>
            <Wrench className="w-4 h-4 mr-2" />
            Voir toutes mes missions
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/documents')}>
            <FileText className="w-4 h-4 mr-2" />
            Mes documents et devis
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/calendar')}>
            <Calendar className="w-4 h-4 mr-2" />
            Mon planning
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Info Banner
interface ProviderInfoBannerProps {
  companyName?: string
  firstName?: string
}

export function ProviderInfoBanner({ companyName, firstName }: ProviderInfoBannerProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Vous êtes prestataire de services</h3>
            <p className="text-sm text-muted-foreground">
              Gérez vos interventions, consultez vos missions assignées et maintenez un bon taux de completion.
              Pour toute question, contactez le propriétaire via la messagerie intégrée.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
