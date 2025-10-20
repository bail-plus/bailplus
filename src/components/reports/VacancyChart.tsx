import { Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface VacancyChartProps {
  data: Array<{
    month: string
    vacancyRate: number
  }>
  hasData: boolean
}

export function VacancyChart({ data, hasData }: VacancyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building className="w-4 h-4" />
          Évolution de la vacance
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {hasData ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, "Taux de vacance"]} labelStyle={{ color: '#000' }} />
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
  )
}