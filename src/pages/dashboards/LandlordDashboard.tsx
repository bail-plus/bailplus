import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Euro, AlertTriangle, TrendingUp, TrendingDown, Clock, Wrench, Calendar, Home, UserCheck, Star } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { useServiceProviders } from "@/hooks/useServiceProviders"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"

const LandlordDashboard = () => {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: serviceProviders = [] } = useServiceProviders();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div>Erreur de chargement</div>;
  }

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre portefeuille immobilier - {currentMonth}
        </p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Parc immobilier */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parc immobilier</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{dashboard.totalProperties}</span>
                  <span className="text-sm text-muted-foreground">
                    bien{dashboard.totalProperties > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard.totalUnits} logement{dashboard.totalUnits > 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taux d'occupation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'occupation</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{100 - dashboard.vacancyRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard.occupiedUnits}/{dashboard.totalUnits} occupés
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locataires */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locataires actifs</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{dashboard.totalTenants}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard.totalTenants} contrat{dashboard.totalTenants > 1 ? 's' : ''} actif{dashboard.totalTenants > 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tickets ouverts</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold">{dashboard.maintenanceTicketsOpen}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maintenance en cours
                </p>
              </div>
              <div className={`w-12 h-12 ${dashboard.maintenanceTicketsOpen > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
                <Wrench className={`w-6 h-6 ${dashboard.maintenanceTicketsOpen > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview for Current Month */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Finances du mois en cours</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenus encaissés */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Revenus encaissés</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboard.currentMonthRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Loyers payés ce mois
              </p>
            </CardContent>
          </Card>

          {/* En attente */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">En attente</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(dashboard.currentMonthPending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Loyers à recevoir
              </p>
            </CardContent>
          </Card>

          {/* Dépenses */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Dépenses</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboard.currentMonthExpenses)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Charges et frais
              </p>
            </CardContent>
          </Card>

          {/* Cash-flow net */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Cash-flow net</span>
              </div>
              <div className={`text-2xl font-bold ${dashboard.currentMonthNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dashboard.currentMonthNet)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenus - Dépenses
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts & Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Impayés */}
        {dashboard.overdueAmount > 0 && (
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
                    {formatCurrency(dashboard.overdueAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nombre de factures</span>
                  <span className="text-lg font-bold">{dashboard.overdueCount}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Action requise : Contacter les locataires concernés
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prochaines échéances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Prochaines échéances (7 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingDueDates.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingDueDates.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {invoice.lease?.tenant?.first_name} {invoice.lease?.tenant?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.due_date), 'dd MMMM', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(invoice.total_amount)}</p>
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

        {/* Factures récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Factures récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {invoice.lease?.tenant?.first_name} {invoice.lease?.tenant?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(invoice.period_year, invoice.period_month - 1), 'MMMM yyyy', { locale: fr })}
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

        {/* Tickets de maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Maintenance en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentTickets.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentTickets.map((ticket) => (
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

        {/* Mes prestataires */}
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
                  <div key={provider.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/app/settings')}>
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
                <p className="text-xs mt-2">Invitez vos prestataires depuis les Paramètres</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LandlordDashboard;
