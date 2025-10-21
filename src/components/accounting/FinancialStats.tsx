import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface FinancialStatsProps {
  totalRevenue: number
  totalExpenses: number
  balance: number
  pendingRevenue: number
  pendingExpenses: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function FinancialStats({
  totalRevenue,
  totalExpenses,
  balance,
  pendingRevenue,
  pendingExpenses,
}: FinancialStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Revenus</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(pendingRevenue)} en attente
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(pendingExpenses)} en attente
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Solde</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenus - Dépenses
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <Wallet className={`w-6 h-6 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
