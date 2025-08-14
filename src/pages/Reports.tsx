import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Download, Calendar, Building, Euro, AlertTriangle } from "lucide-react"

// Mock data for reports
const VACANCY_DATA = [
  { month: "Août", vacant: 1, total: 4, rate: 25 },
  { month: "Sept", vacant: 0, total: 4, rate: 0 },
  { month: "Oct", vacant: 1, total: 4, rate: 25 },
  { month: "Nov", vacant: 0, total: 4, rate: 0 },
  { month: "Déc", vacant: 0, total: 4, rate: 0 },
  { month: "Jan", vacant: 1, total: 4, rate: 25 }
]

const CASH_FLOW_DATA = [
  { month: "Août", income: 3200, expenses: 450, net: 2750 },
  { month: "Sept", income: 4200, expenses: 320, net: 3880 },
  { month: "Oct", income: 3200, expenses: 680, net: 2520 },
  { month: "Nov", income: 4200, expenses: 290, net: 3910 },
  { month: "Déc", income: 4200, expenses: 150, net: 4050 },
  { month: "Jan", income: 3400, expenses: 520, net: 2880 }
]

const OVERDUE_DATA = [
  { month: "Août", amount: 0, count: 0 },
  { month: "Sept", amount: 0, count: 0 },
  { month: "Oct", amount: 0, count: 0 },
  { month: "Nov", amount: 0, count: 0 },
  { month: "Déc", amount: 1250, count: 1 },
  { month: "Jan", amount: 830, count: 1 }
]

const YIELD_BY_PROPERTY = [
  { name: "25 rue de la Paix - T3", rent: 1250, expenses: 85, yield: 6.8, color: "#0088FE" },
  { name: "25 rue de la Paix - T2", rent: 1100, expenses: 75, yield: 7.2, color: "#00C49F" },
  { name: "10 avenue Mozart - Studio", rent: 830, expenses: 45, yield: 8.1, color: "#FFBB28" },
  { name: "Parking Mozart", rent: 120, expenses: 5, yield: 4.5, color: "#FF8042" }
]

const EXPENSE_CATEGORIES = [
  { name: "Maintenance", value: 320, color: "#0088FE" },
  { name: "Charges", value: 180, color: "#00C49F" },
  { name: "Assurance", value: 85, color: "#FFBB28" },
  { name: "Taxes", value: 95, color: "#FF8042" }
]

export default function Reports() {
  const [period, setPeriod] = useState("6months")
  const [entityFilter, setEntityFilter] = useState("all")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const calculateTotalRent = () => {
    return YIELD_BY_PROPERTY.reduce((sum, prop) => sum + prop.rent, 0)
  }

  const calculateTotalExpenses = () => {
    return EXPENSE_CATEGORIES.reduce((sum, cat) => sum + cat.value, 0)
  }

  const calculateAverageYield = () => {
    const totalYield = YIELD_BY_PROPERTY.reduce((sum, prop) => sum + prop.yield, 0)
    return (totalYield / YIELD_BY_PROPERTY.length).toFixed(1)
  }

  const getCurrentVacancyRate = () => {
    const current = VACANCY_DATA[VACANCY_DATA.length - 1]
    return current.rate
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
          
          <Button variant="outline" className="gap-2">
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
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalRent())}</div>
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
            <div className="text-2xl font-bold">{getCurrentVacancyRate()}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              1 bien sur {VACANCY_DATA[VACANCY_DATA.length - 1].total}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rendement moyen</span>
            </div>
            <div className="text-2xl font-bold">{calculateAverageYield()}%</div>
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
              {formatCurrency(OVERDUE_DATA[OVERDUE_DATA.length - 1].amount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {OVERDUE_DATA[OVERDUE_DATA.length - 1].count} locataire(s)
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
                <BarChart data={CASH_FLOW_DATA}>
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
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={VACANCY_DATA}>
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
            <div className="space-y-4">
              {YIELD_BY_PROPERTY.map((property, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate pr-2">{property.name}</span>
                    <span className="text-green-600 font-medium">{property.yield}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(property.yield / 10) * 100}%`,
                        backgroundColor: property.color
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Loyer: {formatCurrency(property.rent)}</span>
                    <span>Charges: {formatCurrency(property.expenses)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={EXPENSE_CATEGORIES}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {EXPENSE_CATEGORIES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
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
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OVERDUE_DATA}>
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
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Exports disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Rapport mensuel</div>
                <div className="text-xs text-muted-foreground">PDF détaillé</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Données brutes</div>
                <div className="text-xs text-muted-foreground">CSV Excel</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
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