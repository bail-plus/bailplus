import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { useAuth } from "@/hooks/auth/useAuth"

type EntityType = Database["public"]["Enums"]["entity_type_enum"]

export interface Entity {
  id: string
  name: string
  type: EntityType
  description: string | null
  is_default: boolean
}

interface EntityContextType {
  selectedEntity: Entity | null
  entities: Entity[]
  loading: boolean
  showAll: boolean
  setSelectedEntity: (entity: Entity | null) => void
  setShowAll: (showAll: boolean) => void
  refreshEntities: () => Promise<void>
}

const EntityContext = createContext<EntityContextType | undefined>(undefined)

export function EntityProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAllState] = useState(false)
  const { user, isReady } = useAuth()

  const loadEntities = useCallback(async () => {
    if (!isReady) return

    setLoading(true)
    try {
      if (!user?.id) {
        setEntities([])
        setSelectedEntityState(null)
        return
      }

      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error

      const loadedEntities: Entity[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type as EntityType,
        description: row.description,
        is_default: row.is_default || false,
      }))

      setEntities(loadedEntities)

      // Si pas d'entité sélectionnée, prendre la première ou celle par défaut
      if (!showAll) {
        setSelectedEntityState(prev => {
          if (prev && loadedEntities.some(e => e.id === prev.id)) {
            return prev
          }
          const defaultEntity = loadedEntities.find(e => e.is_default) || loadedEntities[0] || null
          return defaultEntity ?? null
        })
      }
    } catch (error) {
      console.error('Error loading entities:', error)
    } finally {
      setLoading(false)
    }
  }, [isReady, user?.id, showAll])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  const setSelectedEntity = useCallback((entity: Entity | null) => {
    setSelectedEntityState(entity)
    setShowAllState(false)
  }, [])

  const setShowAll = useCallback((value: boolean) => {
    setShowAllState(value)
    if (value) {
      setSelectedEntityState(null)
    }
  }, [])

  const refreshEntities = useCallback(async () => {
    await loadEntities()
  }, [loadEntities])

  return (
    <EntityContext.Provider
      value={{
        selectedEntity,
        entities,
        loading,
        showAll,
        setSelectedEntity,
        setShowAll,
        refreshEntities,
      }}
    >
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return context
}
