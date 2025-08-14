import { Building2, Users, Calculator, AlertTriangle, TrendingUp, Clock } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { MiniChart } from "@/components/dashboard/mini-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"

// Mock data for charts
const revenueData = [
  { value: 8500 }, { value: 9200 }, { value: 8800 }, { value: 9600 },
  { value: 10200 }, { value: 9800 }, { value: 10500 }
]

const occupancyData = [
  { value: 85 }, { value: 88 }, { value: 92 }, { value: 89 },
  { value: 95 }, { value: 94 }, { value: 96 }
]

const Index = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre portefeuille immobilier
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Biens gérés"
          value="12"
          change="+2 ce mois"
          changeType="positive"
          icon={<Building2 className="w-5 h-5 text-primary" />}
          trend={<MiniChart data={[{value: 8}, {value: 9}, {value: 10}, {value: 11}, {value: 12}]} />}
        />
        
        <StatCard
          title="Revenus du mois"
          value="10 500€"
          change="+8.2% vs mois dernier"
          changeType="positive"
          icon={<Calculator className="w-5 h-5 text-primary" />}
          trend={<MiniChart data={revenueData} />}
        />
        
        <StatCard
          title="Taux d'occupation"
          value="96%"
          change="+2% vs mois dernier"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          trend={<MiniChart data={occupancyData} />}
        />
        
        <StatCard
          title="Impayés"
          value="1 200€"
          change="1 locataire en retard"
          changeType="negative"
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        
        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Tasks & Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Tasks */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Tâches du jour</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Relance loyer en retard</p>
                  <p className="text-sm text-muted-foreground">Marie Dupont - Studio 45</p>
                </div>
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                  Urgent
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Visite programmée</p>
                  <p className="text-sm text-muted-foreground">Appartement 78 Boulevard - 14h30</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  Aujourd'hui
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Envoyer quittances</p>
                  <p className="text-sm text-muted-foreground">3 quittances à générer</p>
                </div>
                <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                  En cours
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Property Overview */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Aperçu du parc</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Appartements</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-4/5"></div>
                  </div>
                  <span className="text-sm font-medium">8/10</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Studios</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-full"></div>
                  </div>
                  <span className="text-sm font-medium">2/2</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Parkings</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-1/2"></div>
                  </div>
                  <span className="text-sm font-medium">1/2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index