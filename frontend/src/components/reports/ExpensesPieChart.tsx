import { Euro } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

interface ExpenseChartData {
  category: string
  amount: number
}

interface ExpensesPieChartProps {
  data: ExpenseChartData[]
  hasData: boolean
  colors: string[]
}

export function ExpensesPieChart({ data, hasData, colors }: ExpensesPieChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Répartition des dépenses</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
  )
}