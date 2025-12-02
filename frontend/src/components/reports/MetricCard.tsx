import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps {
  icon: React.ComponentType<any>
  title: string
  value: string | number
  trend?: number
  subtitle?: string
  color?: string
}

export const MetricCard = ({ icon: Icon, title, value, trend, subtitle, color }: MetricCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color || 'text-muted-foreground'}`} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
      {trend !== undefined ? (
        <p className={`text-xs flex items-center gap-1 mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs mois dernier
        </p>
      ) : subtitle ? (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      ) : null}
    </CardContent>
  </Card>
)