import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const eventTypes = {
  visit: { label: "Visite", color: "bg-blue-500" },
  checkout: { label: "État des lieux", color: "bg-orange-500" },
  maintenance: { label: "Maintenance", color: "bg-red-500" },
  rent_due: { label: "Loyer", color: "bg-emerald-500" },
  maintenance_ticket: { label: "Ticket maintenance", color: "bg-amber-500" },
  other: { label: "Autre", color: "bg-gray-400" },
}

interface CalendarFiltersProps {
  properties: Array<{ id: string; name: string }>
  selectedPropertyFilter: string
  onPropertyFilterChange: (value: string) => void
  selectedEventTypes: string[]
  onEventTypesChange: (types: string[]) => void
  filteredEventsCount: number
}

export function CalendarFilters({
  properties,
  selectedPropertyFilter,
  onPropertyFilterChange,
  selectedEventTypes,
  onEventTypesChange,
  filteredEventsCount,
}: CalendarFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filtre par bien */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Filtrer par bien</label>
            <Select
              value={selectedPropertyFilter}
              onValueChange={onPropertyFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les biens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Tous les biens
                  </div>
                </SelectItem>
                {properties.length > 0 && properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par type (masquer) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Masquer les types d'événements</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allTypes = Object.keys(eventTypes)
                  if (selectedEventTypes.length === allTypes.length) {
                    onEventTypesChange([])
                  } else {
                    onEventTypesChange(allTypes)
                  }
                }}
                className="text-xs h-7"
              >
                {selectedEventTypes.length === 0 ? "Tout masquer" : "Tout afficher"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(eventTypes).map(([type, config]) => {
                const isHidden = selectedEventTypes.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (isHidden) {
                        onEventTypesChange(selectedEventTypes.filter(t => t !== type))
                      } else {
                        onEventTypesChange([...selectedEventTypes, type])
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      isHidden
                        ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                        : `${config.color} text-white border-transparent`
                    }`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Compteur filtré */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {filteredEventsCount} événement(s) affiché(s)
            </span>
            {(selectedPropertyFilter !== "all" || selectedEventTypes.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onPropertyFilterChange("all")
                  onEventTypesChange([])
                }}
                className="text-xs h-7"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
