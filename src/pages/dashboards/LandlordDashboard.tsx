import { useDashboard } from "@/hooks/useDashboard"
import { useServiceProviders } from "@/hooks/useServiceProviders"
import { getCurrentMonth } from "@/utils/formatters"
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs"
import { DashboardFinancialOverview } from "@/components/dashboard/DashboardFinancialOverview"
import {
  OverdueAlertsCard,
  UpcomingDueDatesCard,
  RecentInvoicesCard,
  MaintenanceTicketsCard,
  ServiceProvidersCard,
} from "@/components/dashboard/DashboardActivityCards"

const LandlordDashboard = () => {
  const { data: dashboard, isLoading } = useDashboard()
  const { data: serviceProviders = [] } = useServiceProviders()

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
    )
  }

  if (!dashboard) {
    return <div>Erreur de chargement</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre portefeuille immobilier - {getCurrentMonth()}
        </p>
      </div>

      {/* Main KPI Grid */}
      <DashboardKPIs
        totalProperties={dashboard.totalProperties}
        totalUnits={dashboard.totalUnits}
        occupiedUnits={dashboard.occupiedUnits}
        vacancyRate={dashboard.vacancyRate}
        totalTenants={dashboard.totalTenants}
        maintenanceTicketsOpen={dashboard.maintenanceTicketsOpen}
      />

      {/* Financial Overview for Current Month */}
      <DashboardFinancialOverview
        currentMonthRevenue={dashboard.currentMonthRevenue}
        currentMonthPending={dashboard.currentMonthPending}
        currentMonthExpenses={dashboard.currentMonthExpenses}
        currentMonthNet={dashboard.currentMonthNet}
      />

      {/* Alerts & Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OverdueAlertsCard
          overdueAmount={dashboard.overdueAmount}
          overdueCount={dashboard.overdueCount}
        />

        <UpcomingDueDatesCard upcomingDueDates={dashboard.upcomingDueDates} />

        <RecentInvoicesCard recentInvoices={dashboard.recentInvoices} />

        <MaintenanceTicketsCard recentTickets={dashboard.recentTickets} />

        <ServiceProvidersCard serviceProviders={serviceProviders} />
      </div>
    </div>
  )
}

export default LandlordDashboard
