import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface MaintenanceSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
}

export function MaintenanceSearch({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
}: MaintenanceSearchProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un ticket..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          <SelectItem value="URGENT">Urgente</SelectItem>
          <SelectItem value="ELEVE">Élevée</SelectItem>
          <SelectItem value="MOYEN">Moyenne</SelectItem>
          <SelectItem value="FAIBLE">Faible</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
