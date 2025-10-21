import { Card, CardContent } from "@/components/ui/card"
import { Building2, Users, Home, Wrench } from "lucide-react"

interface DashboardKPIsProps {
  totalProperties: number
  totalUnits: number
  occupiedUnits: number
  vacancyRate: number
  totalTenants: number
  maintenanceTicketsOpen: number
}

export function DashboardKPIs({
  totalProperties,
  totalUnits,
  occupiedUnits,
  vacancyRate,
  totalTenants,
  maintenanceTicketsOpen,
}: DashboardKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Parc immobilier */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parc immobilier</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{totalProperties}</span>
                <span className="text-sm text-muted-foreground">
                  bien{totalProperties > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalUnits} logement{totalUnits > 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taux d'occupation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux d'occupation</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{100 - vacancyRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {occupiedUnits}/{totalUnits} occupés
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locataires */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Locataires actifs</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{totalTenants}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalTenants} contrat{totalTenants > 1 ? 's' : ''} actif{totalTenants > 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tickets ouverts</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{maintenanceTicketsOpen}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maintenance en cours
              </p>
            </div>
            <div className={`w-12 h-12 ${maintenanceTicketsOpen > 0 ? 'bg-orange-500/10' : 'bg-gray-500/10'} rounded-full flex items-center justify-center`}>
              <Wrench className={`w-6 h-6 ${maintenanceTicketsOpen > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
