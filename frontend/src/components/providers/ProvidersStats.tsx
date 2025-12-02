import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, Wrench, Star } from "lucide-react"

interface ProvidersStatsProps {
  totalProviders: number
  availableProviders: number
  totalInterventions: number
  avgRating: number
}

export function ProvidersStats({
  totalProviders,
  availableProviders,
  totalInterventions,
  avgRating,
}: ProvidersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Prestataires</span>
          </div>
          <div className="text-2xl font-bold">{totalProviders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Disponibles</span>
          </div>
          <div className="text-2xl font-bold">{availableProviders}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Interventions</span>
          </div>
          <div className="text-2xl font-bold">{totalInterventions}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Note Moyenne</span>
          </div>
          <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
