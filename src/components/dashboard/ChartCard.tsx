import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from "react"

interface ChartCardProps {
  title: string
  icon?: React.ReactNode
  subtitle?: string
  children: React.ReactNode
}

export const ChartCard = ({ 
  title,
  icon,
  subtitle,
  children 
}: ChartCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="relative">
        {children}
      </CardContent>
    </Card>
  )
}