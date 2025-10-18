import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Clock, CheckCircle2, TrendingUp } from "lucide-react"

interface ProviderKPIsProps {
  newMissions: number
  inProgressMissions: number
  completedMissions: number
  totalMissions: number
}

export function ProviderKPIs({
  newMissions,
  inProgressMissions,
  completedMissions,
  totalMissions,
}: ProviderKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nouvelles missions</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{newMissions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                À prendre en charge
              </p>
            </div>
            <div className={`w-12 h-12 ${newMissions > 0 ? 'bg-red-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
              <AlertCircle className={`w-6 h-6 ${newMissions > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En cours</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{inProgressMissions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Interventions actives
              </p>
            </div>
            <div className={`w-12 h-12 ${inProgressMissions > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
              <Clock className={`w-6 h-6 ${inProgressMissions > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Terminées</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{completedMissions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ce mois-ci
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total missions</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{totalMissions}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toutes périodes
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
