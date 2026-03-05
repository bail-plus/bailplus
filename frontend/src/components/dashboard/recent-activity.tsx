import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

const activities = [
  {
    id: "1",
    type: "payment",
    description: "Loyer reçu - Appartement 123 Rue de la Paix",
    amount: "1 200€",
    status: "success",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2", 
    type: "ticket",
    description: "Nouveau ticket - Fuite d'eau salle de bain",
    status: "pending",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: "3",
    type: "lease",
    description: "Bail signé - Studio 45 Avenue des Champs",
    status: "success",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "4",
    type: "expense",
    description: "Facture plombier - Appartement 123",
    amount: "180€",
    status: "pending",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "5",
    type: "document",
    description: "Quittance générée - Février 2024",
    status: "success",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  }
]

const statusBadges = {
  success: { label: "Terminé", variant: "default" as const },
  pending: { label: "En attente", variant: "secondary" as const },
  warning: { label: "Attention", variant: "destructive" as const }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusBadges[activity.status].variant} className="text-xs">
                  {statusBadges[activity.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
            {activity.amount && (
              <div className="text-sm font-medium text-right ml-2">
                {activity.amount}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}