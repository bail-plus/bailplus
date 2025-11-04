import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Euro, Percent, Loader2 } from "lucide-react"
import type { GlobalProfitability } from "@/hooks/usePropertyProfitability"

interface GlobalProfitabilitySummaryProps {
  data: GlobalProfitability | undefined
  isLoading: boolean
}

export function GlobalProfitabilitySummary({ data, isLoading }: GlobalProfitabilitySummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-center items-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data || data.totalInvestment === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Euro className="w-4 h-4" />
              <span className="text-sm font-medium">Investissement total</span>
            </div>
            <div className="text-2xl font-bold">- €</div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Revenus annuels</span>
            </div>
            <div className="text-2xl font-bold">- €</div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">Rentabilité brute</span>
            </div>
            <div className="text-2xl font-bold">- %</div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">Rentabilité nette</span>
            </div>
            <div className="text-2xl font-bold">- %</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Investissement total */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Euro className="w-4 h-4" />
            <span className="text-sm font-medium">Investissement total</span>
          </div>
          <div className="text-2xl font-bold">
            {data.totalInvestment.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })} €
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Somme de tous les biens
          </p>
        </CardContent>
      </Card>

      {/* Cash-flow net annuel (après impôts) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {data.totalNetCashFlowAfterTax >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">Cash-flow net/an</span>
          </div>
          <div className={`text-2xl font-bold ${data.totalNetCashFlowAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.totalNetCashFlowAfterTax.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })} €
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Après impôts
          </p>
        </CardContent>
      </Card>

      {/* Rentabilité brute moyenne */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-sm font-medium">Rentabilité brute</span>
          </div>
          <div className="text-2xl font-bold">
            {data.averageGrossYield.toFixed(2)} %
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Moyenne du parc
          </p>
        </CardContent>
      </Card>

      {/* Rentabilité nette moyenne (après impôts) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-sm font-medium">Rentabilité nette</span>
          </div>
          <div className={`text-2xl font-bold ${data.averageNetYieldAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.averageNetYieldAfterTax.toFixed(2)} %
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Après impôts
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
