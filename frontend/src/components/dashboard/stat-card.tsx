import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: ReactNode
  trend?: ReactNode
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon, 
  trend,
  className 
}: StatCardProps) {
  const changeColorClass = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  }[changeType]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <p className={cn("text-xs font-medium", changeColorClass)}>
                  {change}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
            {trend && (
              <div className="w-16 h-8">
                {trend}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}