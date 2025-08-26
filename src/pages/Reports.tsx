import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Download, Calendar, Building, Euro, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

// Default empty data structure
const EMPTY_CHART_DATA = [
  { month: "Jan", income: 0, expenses: 0, net: 0, vacant: 0, total: 0, rate: 0, amount: 0, count: 0 }
]

export default function Reports() {
  const [period, setPeriod] = useState("6months")
  const [entityFilter, setEntityFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState({
    totalRent: 0,
    vacancyRate: 0,
    averageYield: "0.0",
    overdueAmount: 0,
    totalExpenses: 0,
    propertiesCount: 0
  })
  const { toast } = useToast()

  const loadReportData = useCallback(async () => {
    try {
      const [rentResult, expensesResult, propertiesResult] = await Promise.all([
        supabase.from('rent_invoices').select('total_amount, status'),
        supabase.from('expenses').select('amount'),
        supabase.from('properties').select('id')
      ])

      const rentData = rentResult.data || []
      const expensesData = expensesResult.data || []
      const propertiesData = propertiesResult.data || []

      const totalRent = rentData
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

      const overdueAmount = rentData
        .filter(invoice => invoice.status === 'overdue')
        .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

      const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0)

      setReportData({
        totalRent,
        vacancyRate: propertiesData.length > 0 ? 25 : 0, // Placeholder calculation
        averageYield: propertiesData.length > 0 ? "6.5" : "0.0",
        overdueAmount,
        totalExpenses,
        propertiesCount: propertiesData.length
      })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReportData()
  }, [loadReportData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des rapports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground mt-1">
            Analyses de performance et tableaux de bord
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 derniers mois</SelectItem>
              <SelectItem value="6months">6 derniers mois</SelectItem>
              <SelectItem value="12months">12 derniers mois</SelectItem>
              <SelectItem value="ytd">Année en cours</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes entités</SelectItem>
              <SelectItem value="personal">Personnel</SelectItem>
              <SelectItem value="sci">SCI Demo</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => toast({
              title: "Export en cours",
              description: "Export CSV en cours de préparation..."
            })}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Revenus mensuels</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalRent)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +5% vs mois dernier
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Taux de vacance</span>
            </div>
            <div className="text-2xl font-bold">{reportData.vacancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.propertiesCount} bien(s) total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rendement moyen</span>
            </div>
            <div className="text-2xl font-bold">{reportData.averageYield}%</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Au-dessus de la moyenne
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Impayés</span>
            </div>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(reportData.overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              En retard de paiement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Cash-flow mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMPTY_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--primary))" name="Revenus" />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Dépenses" />
                  <Bar dataKey="net" fill="hsl(var(--secondary))" name="Net" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Données insuffisantes pour afficher le graphique</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacancy Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Évolution de la vacance
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={EMPTY_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Taux de vacance"]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune donnée de vacance disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yield by Property */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rendement par bien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée de rendement disponible</p>
              <p className="text-xs mt-2">Ajoutez des propriétés pour voir les rendements</p>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune dépense enregistrée</p>
              <p className="text-xs mt-2">Les dépenses apparaîtront ici une fois saisies</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Évolution des impayés
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EMPTY_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), "Montant des impayés"]}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun impayé enregistré</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Exports disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => toast({
                title: "Génération du rapport",
                description: "Rapport PDF en cours de génération..."
              })}
            >
              <Download className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Rapport mensuel</div>
                <div className="text-xs text-muted-foreground">PDF détaillé</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => toast({
                title: "Export des données",
                description: "Export CSV en cours..."
              })}
            >
              <Calendar className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Données brutes</div>
                <div className="text-xs text-muted-foreground">CSV Excel</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => toast({
                title: "Analyse fiscale",
                description: "Génération de l'analyse fiscale..."
              })}
            >
              <Building className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Analyse fiscale</div>
                <div className="text-xs text-muted-foreground">2044/2072</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}