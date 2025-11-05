import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface YearlyProjection {
  year: number
  annualCashFlow: number
  cumulativeCashFlow: number
  remainingDebt: number
  netWorth: number
  annualRevenue: number
  annualExpenses: number
}

interface ProjectionChartProps {
  data: YearlyProjection[]
  propertyValue: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

// Fonction pour calculer la marge en fonction de la valeur max
const calculateLeftMargin = (maxValue: number): number => {
  const formattedValue = `${(maxValue / 1000).toFixed(0)}k€`
  // Chaque caractère fait environ 8 pixels, on ajoute une marge minimale
  const calculatedMargin = formattedValue.length * 8 + 15
  return Math.max(45, calculatedMargin)
}

export function ProjectionChart({ data, propertyValue }: ProjectionChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projection financière</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aucune donnée de projection disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculer les valeurs max pour chaque graphique
  const maxCumulativeCashFlow = Math.max(...data.map(d => Math.abs(d.cumulativeCashFlow)))
  const maxNetWorth = Math.max(...data.map(d => Math.max(d.netWorth, d.remainingDebt)))
  const maxRevenueExpense = Math.max(...data.map(d => Math.max(d.annualRevenue, d.annualExpenses)))
  const maxAnnualCashFlow = Math.max(...data.map(d => Math.abs(d.annualCashFlow)))

  // Calculer les marges adaptatives
  const marginCumulative = calculateLeftMargin(maxCumulativeCashFlow)
  const marginNetWorth = calculateLeftMargin(maxNetWorth)
  const marginRevenueExpense = calculateLeftMargin(maxRevenueExpense)
  const marginAnnualCashFlow = calculateLeftMargin(maxAnnualCashFlow)

  return (
    <div className="space-y-6">
      {/* Cash-flow cumulé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash-flow cumulé</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ left: marginCumulative }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={data[data.length - 1]?.cumulativeCashFlow >= 0 ? "#10b981" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={data[data.length - 1]?.cumulativeCashFlow >= 0 ? "#10b981" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                label={{ value: "Année", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                label={{ value: "Cash-flow cumulé (€)", angle: -90, position: "center", dx: -35 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Année ${label}`}
              />
              <Area
                type="monotone"
                dataKey="cumulativeCashFlow"
                stroke={data[data.length - 1]?.cumulativeCashFlow >= 0 ? "#10b981" : "#ef4444"}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                name="Cash-flow cumulé"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolution du patrimoine net */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolution du patrimoine net</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ left: marginNetWorth }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                label={{ value: "Année", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                label={{ value: "Valeur (€)", angle: -90, position: "center", dx: -35 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Année ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#10b981"
                strokeWidth={2}
                name="Patrimoine net"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="remainingDebt"
                stroke="#ef4444"
                strokeWidth={2}
                name="Dette restante"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenus vs Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus vs Charges annuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ left: marginRevenueExpense }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                label={{ value: "Année", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                label={{ value: "Montant (€)", angle: -90, position: "center", dx: -35 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Année ${label}`}
              />
              <Legend />
              <Bar dataKey="annualRevenue" fill="#10b981" name="Revenus annuels" />
              <Bar dataKey="annualExpenses" fill="#ef4444" name="Charges annuelles" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash-flow annuel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash-flow annuel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ left: marginAnnualCashFlow }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                label={{ value: "Année", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                label={{ value: "Cash-flow (€)", angle: -90, position: "center", dx: -35 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Année ${label}`}
              />
              <Bar
                dataKey="annualCashFlow"
                fill="#3b82f6"
                name="Cash-flow annuel"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
