import { Card, CardContent } from "@/components/ui/card"
import { Euro, Clock, TrendingDown, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/utils/formatters"

interface DashboardFinancialOverviewProps {
  currentMonthRevenue: number
  currentMonthPending: number
  currentMonthExpenses: number
  currentMonthNet: number
}

export function DashboardFinancialOverview({
  currentMonthRevenue,
  currentMonthPending,
  currentMonthExpenses,
  currentMonthNet,
}: DashboardFinancialOverviewProps) {
  return (
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
              {formatCurrency(currentMonthRevenue)}
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
              {formatCurrency(currentMonthPending)}
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
              {formatCurrency(currentMonthExpenses)}
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
            <div className={`text-2xl font-bold ${currentMonthNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentMonthNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenus - Dépenses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
