import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface YearlyProjection {
  year: number
  annualCashFlow: number
  cumulativeCashFlow: number
  remainingDebt: number
  netWorth: number
  annualRevenue: number
  annualExpenses: number
}

interface ProjectionTimelineProps {
  data: YearlyProjection[]
  initialInvestment: number
  roiYear?: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function ProjectionTimeline({ data, initialInvestment, roiYear }: ProjectionTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline de projection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aucune donnée de projection disponible
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculer quelques KPIs
  const finalYear = data[data.length - 1]
  const totalCashFlowGenerated = finalYear.cumulativeCashFlow
  const totalRevenue = data.reduce((sum, year) => sum + year.annualRevenue, 0)
  const totalExpenses = data.reduce((sum, year) => sum + year.annualExpenses, 0)
  const avgAnnualCashFlow = totalCashFlowGenerated / data.length
  const debtReduction = data[0]?.remainingDebt - finalYear.remainingDebt
  const wealthIncrease = finalYear.netWorth - (data[0]?.netWorth || 0)

  return (
    <div className="space-y-6">
      {/* KPIs de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cash-flow total généré</CardDescription>
            <CardTitle className={`text-2xl ${totalCashFlowGenerated >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalCashFlowGenerated)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Cash-flow annuel moyen</CardDescription>
            <CardTitle className={`text-2xl ${avgAnnualCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(avgAnnualCashFlow)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Réduction de la dette</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {formatCurrency(debtReduction)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Augmentation patrimoine net</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {formatCurrency(wealthIncrease)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Retour sur investissement */}
      {roiYear && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Retour sur investissement
            </CardTitle>
            <CardDescription className="text-green-700">
              Votre investissement initial de <strong>{formatCurrency(initialInvestment)}</strong> sera
              rentabilisé en <strong>{roiYear} ans</strong> (année {data[0]?.year + roiYear})
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Tableau détaillé année par année */}
      <Card>
        <CardHeader>
          <CardTitle>Projection année par année</CardTitle>
          <CardDescription>
            Détail de l'évolution financière sur {data.length} ans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Année</TableHead>
                  <TableHead className="text-right">Revenus</TableHead>
                  <TableHead className="text-right">Charges</TableHead>
                  <TableHead className="text-right">Cash-flow</TableHead>
                  <TableHead className="text-right">CF Cumulé</TableHead>
                  <TableHead className="text-right">Dette restante</TableHead>
                  <TableHead className="text-right">Patrimoine net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((yearData, index) => {
                  const isRoiYear = roiYear && index === roiYear - 1
                  const isCumulativePositive = yearData.cumulativeCashFlow >= 0

                  return (
                    <TableRow
                      key={yearData.year}
                      className={isRoiYear ? "bg-green-50" : ""}
                    >
                      <TableCell className="font-semibold">
                        {yearData.year}
                        {isRoiYear && (
                          <span className="ml-2 text-xs text-green-600 font-bold">ROI</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(yearData.annualRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(yearData.annualExpenses)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {yearData.annualCashFlow > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : yearData.annualCashFlow < 0 ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={yearData.annualCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(yearData.annualCashFlow)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={isCumulativePositive ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(yearData.cumulativeCashFlow)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(yearData.remainingDebt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {formatCurrency(yearData.netWorth)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistiques sur la période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Revenus et charges</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total des revenus</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total des charges</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Différence nette</span>
                  <span className={`font-semibold ${totalCashFlowGenerated >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(totalCashFlowGenerated)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Evolution du patrimoine</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Patrimoine initial</span>
                  <span className="font-semibold">{formatCurrency(data[0]?.netWorth || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Patrimoine final</span>
                  <span className="font-semibold">{formatCurrency(finalYear.netWorth)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Augmentation</span>
                  <span className="font-semibold text-purple-600">
                    {formatCurrency(wealthIncrease)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
