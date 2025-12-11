import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Euro, Wrench, UserCheck, Star } from "lucide-react"
import { formatCurrency } from "@/utils/formatters"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { useUpcomingEvents } from "@/hooks/analytics/useUpcomingEvents"

// Types
interface Invoice {
  id: string
  due_date?: string
  total_amount: number
  status: string
  period_month?: number
  period_year?: number
  lease?: {
    tenant?: {
      first_name: string
      last_name: string
    }
  }
}

interface Ticket {
  id: string
  title: string
  priority: string
  status: string
  property?: {
    name: string
  }
}

interface ServiceProvider {
  id: string
  company_name?: string
  specialty?: string[]
  available: boolean
  average_rating?: number
  total_interventions?: number
  user?: {
    first_name?: string
    last_name?: string
  }
}

// Overdue Alerts Card
interface OverdueAlertsCardProps {
  overdueAmount: number
  overdueCount: number
}

export function OverdueAlertsCard({ overdueAmount, overdueCount }: OverdueAlertsCardProps) {
  if (overdueAmount <= 0) return null

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Impayés à traiter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Montant total en retard</span>
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(overdueAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Nombre de factures</span>
            <span className="text-lg font-bold">{overdueCount}</span>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Action requise : Contacter les locataires concernés
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Upcoming Due Dates Card
interface UpcomingDueDatesCardProps {
  upcomingDueDates: Invoice[]
}

const eventTypeColors: Record<string, string> = {
  visit: "bg-blue-500",
  checkout: "bg-orange-500",
  maintenance: "bg-red-500",
  other: "bg-gray-400",
}

const eventTypeLabels: Record<string, string> = {
  visit: "Visite",
  checkout: "État des lieux",
  maintenance: "Maintenance",
  other: "Autre",
}

export function UpcomingDueDatesCard({ upcomingDueDates }: UpcomingDueDatesCardProps) {
  const navigate = useNavigate()

  // Charger les événements des 7 prochains jours avec le hook dédié
  const { data: upcomingEvents = [], isLoading } = useUpcomingEvents(7)

  const hasContent = upcomingDueDates.length > 0 || upcomingEvents.length > 0

  console.log('[DASHBOARD] UpcomingDueDatesCard - Invoices:', upcomingDueDates.length, 'Events:', upcomingEvents.length)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Prochaines échéances (7 jours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Chargement...</p>
          </div>
        ) : hasContent ? (
          <div className="space-y-2">
            {/* Événements */}
            {upcomingEvents.map((event) => (
              <div
                key={`event-${event.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate('/app/calendar')}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${eventTypeColors[event.event_type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.start_date), 'dd MMMM', { locale: fr })}
                      {event.start_time && ` à ${event.start_time.slice(0, 5)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs mb-1">
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </Badge>
                  {event.property?.name && (
                    <p className="text-xs text-muted-foreground">{event.property.name}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Factures */}
            {upcomingDueDates.map((invoice) => (
              <div key={`invoice-${invoice.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Loyer - {invoice.lease?.tenant?.first_name} {invoice.lease?.tenant?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMMM', { locale: fr }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold mb-1">{formatCurrency(invoice.total_amount)}</p>
                  <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                    {invoice.status === 'pending' ? 'En attente' : 'En retard'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucune échéance dans les 7 prochains jours</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Recent Invoices Card
interface RecentInvoicesCardProps {
  recentInvoices: Invoice[]
}

export function RecentInvoicesCard({ recentInvoices }: RecentInvoicesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Euro className="w-5 h-5" />
          Factures récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentInvoices.length > 0 ? (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {invoice.lease?.tenant?.first_name} {invoice.lease?.tenant?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.period_year && invoice.period_month ? format(new Date(invoice.period_year, invoice.period_month - 1), 'MMMM yyyy', { locale: fr }) : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(invoice.total_amount)}</p>
                  <Badge
                    variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'overdue' ? 'destructive' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {invoice.status === 'paid' ? 'Payé' : invoice.status === 'overdue' ? 'Retard' : 'En attente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucune facture récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Maintenance Tickets Card
interface MaintenanceTicketsCardProps {
  recentTickets: Ticket[]
}

export function MaintenanceTicketsCard({ recentTickets }: MaintenanceTicketsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Maintenance en cours
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTickets.length > 0 ? (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.property?.name || 'Propriété non spécifiée'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      ticket.priority === 'HIGH' ? 'destructive' :
                      ticket.priority === 'MEDIUM' ? 'default' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {ticket.priority === 'HIGH' ? 'Urgent' : ticket.priority === 'MEDIUM' ? 'Moyen' : 'Bas'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {ticket.status === 'NOUVEAU' ? 'Nouveau' : 'En cours'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucun ticket ouvert</p>
            <p className="text-xs mt-2">Tout est en ordre ! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Service Providers Card
interface ServiceProvidersCardProps {
  serviceProviders: ServiceProvider[]
}

export function ServiceProvidersCard({ serviceProviders }: ServiceProvidersCardProps) {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Mes prestataires
        </CardTitle>
      </CardHeader>
      <CardContent>
        {serviceProviders.length > 0 ? (
          <div className="space-y-3">
            {serviceProviders.slice(0, 5).map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate('/app/providers')}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {provider.company_name || `${provider.user?.first_name || ''} ${provider.user?.last_name || ''}`.trim() || 'Prestataire'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {provider.specialty && provider.specialty.length > 0
                      ? provider.specialty.join(', ')
                      : 'Aucune spécialité'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {provider.average_rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{provider.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <Badge
                    variant={provider.available ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {provider.available ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucun prestataire</p>
            <p className="text-xs mt-2">Ajoutez-en depuis l’onglet Prestataires</p>
            <div className="mt-3">
              <button
                onClick={() => navigate('/app/providers')}
                className="text-xs text-primary hover:underline"
              >
                Ouvrir mes prestataires
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
