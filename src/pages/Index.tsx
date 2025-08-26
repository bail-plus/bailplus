import { useState, useEffect } from "react"
import { Building2, Users, Calculator, AlertTriangle, TrendingUp, Clock } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { MiniChart } from "@/components/dashboard/mini-chart"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { supabase } from "@/integrations/supabase/client"

const Index = () => {
  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    tickets: 0,
    loading: true
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [propertiesRes, tenantsRes, ticketsRes] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('tenants').select('id', { count: 'exact' }),
        supabase.from('maintenance_tickets').select('id', { count: 'exact' })
      ])

      setStats({
        properties: propertiesRes.count || 0,
        tenants: tenantsRes.count || 0,
        tickets: ticketsRes.count || 0,
        loading: false
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  if (stats.loading) {
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
          value={stats.properties.toString()}
          change={stats.properties === 0 ? "Aucun bien" : `${stats.properties} bien${stats.properties > 1 ? 's' : ''}`}
          changeType={stats.properties > 0 ? "positive" : "neutral"}
          icon={<Building2 className="w-5 h-5 text-primary" />}
        />
        
        <StatCard
          title="Locataires"
          value={stats.tenants.toString()}
          change={stats.tenants === 0 ? "Aucun locataire" : `${stats.tenants} locataire${stats.tenants > 1 ? 's' : ''}`}
          changeType={stats.tenants > 0 ? "positive" : "neutral"}
          icon={<Users className="w-5 h-5 text-primary" />}
        />
        
        <StatCard
          title="Revenus du mois"
          value="0€"
          change="Aucune donnée"
          changeType="neutral"
          icon={<Calculator className="w-5 h-5 text-primary" />}
        />
        
        <StatCard
          title="Tickets maintenance"
          value={stats.tickets.toString()}
          change={stats.tickets === 0 ? "Aucun ticket" : `${stats.tickets} ticket${stats.tickets > 1 ? 's' : ''}`}
          changeType={stats.tickets > 0 ? "negative" : "positive"}
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
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucune tâche pour aujourd'hui</p>
              <p className="text-xs mt-2">Les tâches apparaîtront ici une fois que vous aurez ajouté des biens et locataires</p>
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
            {stats.properties === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Aucun bien dans votre parc</p>
                <p className="text-xs mt-2">Ajoutez vos premiers biens pour voir les statistiques</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Biens total</span>
                  <span className="text-sm font-medium">{stats.properties}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Locataires</span>
                  <span className="text-sm font-medium">{stats.tenants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tickets ouverts</span>
                  <span className="text-sm font-medium">{stats.tickets}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index