import { Card, CardContent } from "@/components/ui/card"
import { Wrench, CheckCircle2, FileText } from "lucide-react"

interface TenantKPIsProps {
  openTickets: number
  closedTickets: number
  totalTickets: number
}

export function TenantKPIs({ openTickets, closedTickets, totalTickets }: TenantKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Demandes ouvertes</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{openTickets}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En cours de traitement
              </p>
            </div>
            <div className={`w-12 h-12 ${openTickets > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
              <Wrench className={`w-6 h-6 ${openTickets > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Demandes terminées</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{closedTickets}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Interventions réalisées
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
              <p className="text-sm font-medium text-muted-foreground">Total demandes</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{totalTickets}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Depuis le début
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
