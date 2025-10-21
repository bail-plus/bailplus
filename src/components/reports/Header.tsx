import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

interface HeaderProps {
  period: string
  setPeriod: (value: string) => void
  onExport: () => void
}

export const Header = ({ period, setPeriod, onExport }: HeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
      <p className="text-muted-foreground mt-1">
        Analyses de performance et tableaux de bord
      </p>
    </div>

    <div className="flex items-center gap-2">
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 derniers mois</SelectItem>
          <SelectItem value="6">6 derniers mois</SelectItem>
          <SelectItem value="12">12 derniers mois</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" className="gap-2" onClick={onExport}>
        <Download className="w-4 h-4" />
        Exporter CSV
      </Button>
    </div>
  </div>
)