import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Euro } from "lucide-react"
import { CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, ResponsiveContainer, Legend } from "recharts"

interface CashFlowChartProps {
  data: any[]
  hasData: boolean
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export const CashFlowChart = ({ data, hasData }: CashFlowChartProps) => (
  <Card>
    <CardContent className="relative">
      {hasData ? (
        <>
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            {[
              { color: 'hsl(var(--primary))', label: 'Revenus encaissés' },
              { color: 'bg-orange-500', label: 'En attente de paiement' },
              { color: 'hsl(var(--destructive))', label: 'Dépenses' },
              { color: 'hsl(var(--secondary))', label: 'Net (encaissé - dépenses)' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${item.color.includes('hsl') ? '' : item.color}`} 
                     style={item.color.includes('hsl') ? { backgroundColor: item.color } : undefined}></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
            <Euro className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)