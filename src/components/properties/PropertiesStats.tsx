import { Card, CardContent } from "@/components/ui/card"
import { Building2, Home, MapPin } from "lucide-react"
import type { PropertyWithUnits } from "@/hooks/properties/useProperties"

interface PropertiesStatsProps {
  properties: PropertyWithUnits[]
}

export function PropertiesStats({ properties }: PropertiesStatsProps) {
  const totalUnits = properties.reduce((sum, p) => sum + (p.unitsCount ?? 0), 0)
  const uniqueCities = new Set(properties.map(p => p.city).filter(Boolean)).size

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Propriétés</span>
          </div>
          <div className="text-2xl font-bold">{properties.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Logements</span>
          </div>
          <div className="text-2xl font-bold">{totalUnits}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Villes</span>
          </div>
          <div className="text-2xl font-bold">{uniqueCities}</div>
        </CardContent>
      </Card>
    </div>
  )
}
