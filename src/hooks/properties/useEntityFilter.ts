import { useEntity } from "@/contexts/EntityContext"

/**
 * Hook pour construire les filtres Supabase basés sur l'entité sélectionnée
 *
 * Usage:
 * const { getEntityFilter } = useEntityFilter()
 *
 * // Dans une requête Supabase:
 * let query = supabase.from('properties').select('*')
 * query = getEntityFilter(query, 'entity_id') // Applique le filtre si une entité est sélectionnée
 */
export function useEntityFilter() {
  const { selectedEntity, showAll } = useEntity()

  /**
   * Applique un filtre d'entité à une query Supabase
   * @param query - La query Supabase
   * @param columnName - Le nom de la colonne entity_id (par défaut 'entity_id')
   * @returns La query avec le filtre appliqué (ou non)
   */
  function getEntityFilter<T>(query: T, columnName: string = 'entity_id'): T {
    // Si "Tout" est sélectionné, ne pas filtrer
    if (showAll) {
      return query
    }

    // Si une entité spécifique est sélectionnée, filtrer
    if (selectedEntity) {
      // @ts-ignore - Supabase query type
      return query.eq(columnName, selectedEntity.id)
    }

    // Pas d'entité sélectionnée et pas en mode "Tout" - ne rien retourner
    // @ts-ignore - Supabase query type
    return query.eq(columnName, 'impossible-id-to-match-nothing')
  }

  return {
    selectedEntity,
    showAll,
    getEntityFilter,
  }
}
