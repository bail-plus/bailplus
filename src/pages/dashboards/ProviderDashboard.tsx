import { useAuth } from "@/hooks/useAuth"
import { useMaintenanceTicketsWithDetails } from "@/hooks/useMaintenance"
import { useProviderData } from "@/hooks/useProviderData"
import { useMyProviderRatings } from "@/hooks/useProviderRatings"
import { ProviderKPIs } from "@/components/dashboard/ProviderKPIs"
import {
  RatingsCard,
  MissionsCard,
  UpcomingInterventionsCard,
  PerformanceStatsCard,
  ProviderQuickActionsCard,
  ProviderInfoBanner,
} from "@/components/dashboard/ProviderActivityCards"

const ProviderDashboard = () => {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading } = useMaintenanceTicketsWithDetails()
  const { data: providerData, isLoading: providerDataLoading } = useProviderData()
  const { data: ratings = [] } = useMyProviderRatings()

  // Pour un prestataire, on filtre uniquement les tickets qui lui sont assignés
  const myMissions = tickets.filter(ticket => ticket.assigned_to === profile?.user_id)

  const newMissions = providerData?.newMissionsCount || 0
  const inProgressMissions = providerData?.inProgressMissionsCount || 0
  const completedMissions = providerData?.completedMissionsCount || 0
  const totalMissions = providerData?.totalMissionsCount || 0
  const isLoading = ticketsLoading || providerDataLoading

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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Espace prestataire</h1>
        <p className="text-muted-foreground">
          Bienvenue {providerData?.providerInfo?.company_name || profile?.first_name || profile?.company_name} - Gérez vos interventions
        </p>
      </div>

      {/* Stats Cards */}
      <ProviderKPIs
        newMissions={newMissions}
        inProgressMissions={inProgressMissions}
        completedMissions={completedMissions}
        totalMissions={totalMissions}
      />

      {/* Ratings Section */}
      <RatingsCard ratings={ratings} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Missions */}
        <MissionsCard missions={myMissions} />

        {/* Upcoming interventions */}
        <UpcomingInterventionsCard missions={myMissions} />

        {/* Performance stats */}
        <PerformanceStatsCard
          totalMissions={totalMissions}
          completedMissions={completedMissions}
          newMissions={newMissions}
          providerInfo={providerData?.providerInfo}
        />

        {/* Quick actions */}
        <ProviderQuickActionsCard />
      </div>

      {/* Info Banner */}
      <ProviderInfoBanner
        companyName={providerData?.providerInfo?.company_name}
        firstName={profile?.first_name}
      />
    </div>
  )
}

export default ProviderDashboard
