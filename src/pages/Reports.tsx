import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Download, Calendar, Building, Euro, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useReports } from "@/hooks/useReports"

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#82ca9d', '#ffc658', '#ff7c7c']

export default function Reports() {
  const [period, setPeriod] = useState<string>("6")
  const { toast } = useToast()

  const months = parseInt(period);
  const { data: reportData, isLoading } = useReports(months);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des rapports...</div>
      </div>
    )
  }

  const hasMonthlyData = reportData && reportData.monthlyData.length > 0;
  const hasExpensesData = reportData && reportData.expensesByCategory.length > 0;
  const averageYield = reportData && reportData.totalRent > 0
    ? ((reportData.totalRent / months) / (reportData.totalRent / 12 * 12) * 100).toFixed(1)
    : "0.0";

  const monthlyTrend = reportData && hasMonthlyData
    ? reportData.monthlyData[reportData.monthlyData.length - 1].income - reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income
    : 0;

  const trendPercentage = reportData && hasMonthlyData && reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income > 0
    ? ((monthlyTrend / reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income) * 100).toFixed(1)
    : "0";

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
              <SelectItem value="3">3 derniers mois</SelectItem>
              <SelectItem value="6">6 derniers mois</SelectItem>
              <SelectItem value="12">12 derniers mois</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Revenus totaux</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(reportData?.totalRent || 0)}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${Number(trendPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(trendPercentage) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(Number(trendPercentage))}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Taux de vacance</span>
            </div>
            <div className="text-2xl font-bold">{reportData?.vacancyRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData?.occupiedUnits || 0}/{reportData?.totalUnits || 0} logements occupés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rendement moyen</span>
            </div>
            <div className="text-2xl font-bold">{averageYield}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {months} mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(reportData?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Factures à recevoir
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
              {formatCurrency(reportData?.overdueAmount || 0)}
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
            <p className="text-xs text-muted-foreground mt-1">
              Comparaison des revenus encaissés, en attente et dépenses
            </p>
          </CardHeader>
          <CardContent className="relative">
            {hasMonthlyData ? (
              <>
                <div className="flex flex-wrap gap-3 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                    <span>Revenus encaissés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>En attente de paiement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }}></div>
                    <span>Dépenses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                    <span>Net (encaissé - dépenses)</span>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Number(value)), ""]}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="hsl(var(--primary))" name="Revenus encaissés" />
                      <Bar dataKey="pendingAmount" fill="#f97316" name="En attente" />
                      <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Dépenses" />
                      <Bar dataKey="net" fill="hsl(var(--secondary))" name="Net" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune donnée disponible</p>
                </div>
              </div>
            )}
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
            {hasMonthlyData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Taux de vacance"]}
                      labelStyle={{ color: '#000' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vacancyRate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Vacance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune donnée de vacance disponible</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            {hasExpensesData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune dépense enregistrée</p>
                <p className="text-xs mt-2">Les dépenses apparaîtront ici une fois saisies</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Évolution des impayés
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {hasMonthlyData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Montant des impayés"]}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="overdueAmount" fill="hsl(var(--destructive))" name="Impayés" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun impayé enregistré</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
