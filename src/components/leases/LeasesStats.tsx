import { Card, CardContent } from "@/components/ui/card"
import { FileText, Euro } from "lucide-react"
import type { LeaseWithDetails } from "@/hooks/leasing/useLeases"

interface LeasesStatsProps {
  leases: LeaseWithDetails[]
}

export function LeasesStats({ leases }: LeasesStatsProps) {
  const activeLeases = leases.filter(l => l.status === "active").length
  const totalRentAmount = leases
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + l.rent_amount, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Baux</span>
          </div>
          <div className="text-2xl font-bold">{leases.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Baux Actifs</span>
          </div>
          <div className="text-2xl font-bold">{activeLeases}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Loyers Mensuels</span>
          </div>
          <div className="text-2xl font-bold">{totalRentAmount} €</div>
        </CardContent>
      </Card>
    </div>
  )
}
