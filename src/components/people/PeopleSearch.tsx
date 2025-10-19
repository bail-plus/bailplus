import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface PeopleSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function PeopleSearch({ searchTerm, onSearchChange }: PeopleSearchProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un garant..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}
