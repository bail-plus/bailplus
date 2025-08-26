import { useState, useEffect, useCallback } from "react"
import { Check, ChevronDown, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"

interface Entity {
  id: string
  name: string
  type: "PERSONAL" | "SCI"
  icon: typeof User | typeof Building
  description: string
}

export function EntitySelector() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true)
      const { data: entitiesData, error } = await supabase
        .from('entities')
        .select('*')

      if (error) throw error

      // Create a default personal entity
      const defaultEntities: Entity[] = [
        {
          id: "personal",
          name: "Personnel",
          type: "PERSONAL",
          icon: User,
          description: "Biens personnels"
        }
      ]

      // Add real entities from database
      if (entitiesData) {
        const realEntities = entitiesData.map(entity => ({
          id: entity.id,
          name: entity.name,
          type: "SCI" as const,
          icon: Building,
          description: "Entité" // Could be enhanced with property count later
        }))
        defaultEntities.push(...realEntities)
      }

      setEntities(defaultEntities)
      setSelectedEntity(defaultEntities[0])
    } catch (error) {
      console.error('Error loading entities:', error)
      // Fallback to default entity
      const fallbackEntity = {
        id: "personal",
        name: "Personnel",
        type: "PERSONAL" as const,
        icon: User,
        description: "Biens personnels"
      }
      setEntities([fallbackEntity])
      setSelectedEntity(fallbackEntity)
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
        {entities.map((entity) => (
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