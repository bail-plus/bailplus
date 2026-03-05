import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

const KANBAN_COLUMNS = [
  { id: "NOUVEAU", title: "Nouveau", color: "bg-red-50", icon: AlertTriangle },
  { id: "EN COURS", title: "En cours", color: "bg-yellow-50", icon: Clock },
  { id: "EN ATTENTE DE PIECE", title: "Attente pièces", color: "bg-blue-50", icon: Clock },
  { id: "TERMINE", title: "Terminé", color: "bg-green-50", icon: CheckCircle }
]

interface MaintenanceStatsProps {
  tickets: any[]
}

export function MaintenanceStats({ tickets }: MaintenanceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(column => {
        const count = tickets.filter(t => t.status === column.id).length
        return (
          <Card key={column.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <column.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{column.title}</span>
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
