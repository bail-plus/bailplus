import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useMaintenanceTicketsWithDetails } from "@/hooks/useMaintenance"
import { useTenantData } from "@/hooks/useTenantData"
import { TenantKPIs } from "@/components/dashboard/TenantKPIs"
import {
  MyHomeInfo,
  MyRequestsCard,
  ContactLandlordCard,
  TenantQuickActionsCard,
} from "@/components/dashboard/TenantActivityCards"
import { NewRequestDialog } from "@/components/dashboard/NewRequestDialog"

const TenantDashboard = () => {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading } = useMaintenanceTicketsWithDetails()
  const { data: tenantData, isLoading: tenantDataLoading } = useTenantData()

  const openTickets = tenantData?.openTicketsCount || 0
  const closedTickets = tenantData?.closedTicketsCount || 0
  const isLoading = ticketsLoading || tenantDataLoading

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

        <NewRequestDialog
          trigger={
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Nouvelle demande
            </Button>
          }
          propertyId={tenantData?.lease?.unit.property.id}
          unitId={tenantData?.lease?.unit.id}
          leaseId={tenantData?.lease?.id}
        />
      </div>

      {/* My Home Info */}
      {tenantData?.lease && <MyHomeInfo lease={tenantData.lease} />}

      {/* Stats Cards */}
      <TenantKPIs
        openTickets={openTickets}
        closedTickets={closedTickets}
        totalTickets={tenantData?.totalTicketsCount || 0}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Requests */}
        <MyRequestsCard tickets={tickets} />

        {/* Contact Info */}
        {tenantData?.lease && <ContactLandlordCard lease={tenantData.lease} />}
      </div>

      {/* Quick Actions */}
      <TenantQuickActionsCard
        newRequestButton={
          <NewRequestDialog
            trigger={
              <Button variant="outline" className="justify-start h-auto p-4">
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
            }
            propertyId={tenantData?.lease?.unit.property.id}
            unitId={tenantData?.lease?.unit.id}
            leaseId={tenantData?.lease?.id}
          />
        }
      />
    </div>
  )
}

export default TenantDashboard
