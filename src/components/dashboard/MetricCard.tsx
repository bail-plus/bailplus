import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import React from "react"

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

export const MetricCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend,
  color 
}: MetricCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          {React.cloneElement(icon as React.ReactElement, { 
            className: `w-4 h-4 ${color || 'text-muted-foreground'}`
          })}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
        {trend ? (
          <p className={`text-xs flex items-center gap-1 mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}% vs mois dernier
          </p>
        ) : subtitle ? (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}