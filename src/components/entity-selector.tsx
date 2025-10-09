// src/components/EntitySelector.tsx
import { useMemo } from "react"
import { Check, ChevronDown, Building, User, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEntity } from "@/contexts/EntityContext"

export function EntitySelector() {
  const { selectedEntity, entities, loading, showAll, setSelectedEntity, setShowAll } = useEntity()

  const displayLabel = useMemo(() => {
    if (showAll) return "Toutes les entités"
    if (selectedEntity) return selectedEntity.name
    return "Aucune entité"
  }, [showAll, selectedEntity])

  const displayDescription = useMemo(() => {
    if (showAll) return "Vue globale"
    if (selectedEntity) {
      return selectedEntity.description || (selectedEntity.type === "PERSONAL" ? "Biens personnels" : "Entité")
    }
    return ""
  }, [showAll, selectedEntity])

  const displayIcon = useMemo(() => {
    if (showAll) return Globe
    if (selectedEntity) {
      return selectedEntity.type === "PERSONAL" ? User : Building
    }
    return Building
  }, [showAll, selectedEntity])

  const Icon = displayIcon

  if (loading) {
    return (
      <Button variant="outline" size="sm" className="min-w-48" disabled>
        <User className="w-4 h-4 mr-2" />
        Chargement...
      </Button>
    )
  }

  if (entities.length === 0) {
    return (
      <Button variant="outline" size="sm" className="min-w-48" disabled>
        <Building className="w-4 h-4 mr-2" />
        Aucune entité
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-48 justify-between"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">{displayLabel}</div>
              <div className="text-xs text-muted-foreground">{displayDescription}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        {/* Option Tout */}
        <DropdownMenuItem
          onClick={() => setShowAll(true)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <div>
                <div className="font-medium">Toutes les entités</div>
                <div className="text-xs text-muted-foreground">Vue globale</div>
              </div>
            </div>
            {showAll && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Liste des entités */}
        {entities.map((entity) => {
          const EntityIcon = entity.type === "PERSONAL" ? User : Building
          const description = entity.description || (entity.type === "PERSONAL" ? "Biens personnels" : "Entité")

          return (
            <DropdownMenuItem
              key={entity.id}
              onClick={() => setSelectedEntity(entity)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <EntityIcon className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </div>
                {!showAll && selectedEntity?.id === entity.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
