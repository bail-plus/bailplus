// src/components/EntitySelector.tsx
import { useState, useEffect, useCallback } from "react"
import type { LucideIcon } from "lucide-react"
import { Check, ChevronDown, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"

// ---- Types ----
type EntityType = "PERSONAL" | "SCI"

interface Entity {
  id: string
  name: string
  type: EntityType
  icon: LucideIcon
  description: string
}

// Optionnel: typer (grossièrement) la ligne venant de la table Supabase "entities"
type DbEntityRow = {
  id: string
  name: string
  type?: string | null
  description?: string | null
}

// (facultatif) exemples locaux si besoin de seed
const STATIC_ENTITIES: Entity[] = [
  {
    id: "personal",
    name: "Personnel",
    type: "PERSONAL",
    icon: User,
    description: "Biens personnels",
  },
  {
    id: "sci-demo",
    name: "SCI Investissement",
    type: "SCI",
    icon: Building,
    description: "3 biens • 2 locataires",
  },
  {
    id: "sci-paris",
    name: "SCI Paris Center",
    type: "SCI",
    icon: Building,
    description: "1 bien • 1 locataire",
  },
]

export function EntitySelector() {
  const [entityOptions, setEntityOptions] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("entities")
        .select("*")

      if (error) throw error

      const personal: Entity = {
        id: "personal",
        name: "Personnel",
        type: "PERSONAL",
        icon: User,
        description: "Biens personnels",
      }

      // map des entités réelles
      const realEntities: Entity[] = (data as DbEntityRow[] | null)?.map((row) => ({
        id: row.id,
        name: row.name,
        // si tu as une colonne "type" en DB, on la normalise, sinon "SCI" par défaut
        type: (row.type?.toUpperCase() as EntityType) ?? "SCI",
        icon: Building,
        description: row.description ?? "Entité",
      })) ?? []

      // dédoublonnage éventuel par id
      const byId = new Map<string, Entity>([[personal.id, personal]])
      for (const e of realEntities) byId.set(e.id, e)

      const options = Array.from(byId.values())

      setEntityOptions(options)
      setSelectedEntity(options[0] ?? personal)
    } catch (err) {
      console.error("Error loading entities:", err)
      // fallback
      const fallback = {
        id: "personal",
        name: "Personnel",
        type: "PERSONAL" as const,
        icon: User,
        description: "Biens personnels",
      }
      setEntityOptions([fallback])
      setSelectedEntity(fallback)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  if (loading || !selectedEntity) {
    return (
      <Button variant="outline" size="sm" className="min-w-48" disabled>
        <User className="w-4 h-4 mr-2" />
        Chargement...
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
            <selectedEntity.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">{selectedEntity.name}</div>
              <div className="text-xs text-muted-foreground">{selectedEntity.description}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        {entityOptions.map((entity) => (
          <DropdownMenuItem
            key={entity.id}
            onClick={() => setSelectedEntity(entity)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <entity.icon className="w-4 h-4" />
                <div>
                  <div className="font-medium">{entity.name}</div>
                  <div className="text-xs text-muted-foreground">{entity.description}</div>
                </div>
              </div>
              {selectedEntity.id === entity.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
