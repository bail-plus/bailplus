import { useState, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface Document {
  id: string
  name: string
  type: string
  category: string | null
  file_size: number | null
  created_at: string
  file_url: string
}

interface UseDocumentsOptions {
  selectedEntity?: { id: string } | null
  showAll?: boolean
}

export function useDocuments({ selectedEntity, showAll }: UseDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const loadDocuments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDocuments([])
        setLoading(false)
        return
      }

      let docsQuery = supabase
        .from('documents')
        .select(`
          *,
          property:properties (
            id,
            name,
            entity_id
          ),
          lease:leases (
            id,
            unit:units (
              property:properties (
                id,
                name,
                entity_id
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      const { data: docsData, error: docsError } = await docsQuery

      if (docsError) throw docsError

      let filteredDocs = docsData || []
      if (!showAll && selectedEntity) {
        filteredDocs = docsData?.filter(doc => {
          const propertyEntityId = doc.property?.entity_id
          const leasePropertyEntityId = doc.lease?.unit?.property?.entity_id
          const entityId = propertyEntityId || leasePropertyEntityId
          return entityId === selectedEntity.id
        }) || []
      }

      setDocuments(filteredDocs)
    } catch (error) {
      console.error('❌ Erreur chargement documents:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedEntity, showAll])

  return {
    documents,
    loading,
    loadDocuments,
  }
}
