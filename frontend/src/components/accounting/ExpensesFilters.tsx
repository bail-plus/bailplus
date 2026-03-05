import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXE", label: "Taxe" },
  { value: "ASSURANCE", label: "Assurance" },
  { value: "CHARGES", label: "Charges" },
  { value: "TRAVAUX", label: "Travaux" },
  { value: "AUTRE", label: "Autre" },
]

interface ExpensesFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
}

export function ExpensesFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}: ExpensesFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-1">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher une dépense..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {EXPENSE_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
