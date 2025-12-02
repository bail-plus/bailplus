import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { DOCUMENT_CATEGORIES } from "@/lib/document-utils"

interface DocumentsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
}

export function DocumentsFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
}: DocumentsFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un document..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_CATEGORIES.map(category => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
