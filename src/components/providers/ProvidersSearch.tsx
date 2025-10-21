import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

const SPECIALTIES = [
  "Plomberie",
  "Électricité",
  "Chauffage",
  "Climatisation",
  "Peinture",
  "Menuiserie",
  "Serrurerie",
  "Vitrier",
  "Maçonnerie",
  "Toiture",
  "Jardinage",
  "Nettoyage",
  "Autre"
]

interface ProvidersSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  availabilityFilter: string
  onAvailabilityFilterChange: (value: string) => void
  specialtyFilter: string
  onSpecialtyFilterChange: (value: string) => void
}

export function ProvidersSearch({
  searchTerm,
  onSearchChange,
  availabilityFilter,
  onAvailabilityFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
}: ProvidersSearchProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un prestataire..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={availabilityFilter} onValueChange={onAvailabilityFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Disponibilité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="available">Disponibles</SelectItem>
          <SelectItem value="unavailable">Non disponibles</SelectItem>
        </SelectContent>
      </Select>

      <Select value={specialtyFilter} onValueChange={onSpecialtyFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Spécialité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {SPECIALTIES.map((specialty) => (
            <SelectItem key={specialty} value={specialty}>
              {specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
