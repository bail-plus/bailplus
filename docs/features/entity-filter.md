# Guide d'utilisation du filtre d'entité

## Vue d'ensemble

Le système de filtrage par entité permet de :
- Sélectionner une entité spécifique (Personnel ou SCI)
- Afficher toutes les entités avec l'option "Tout"
- Filtrer automatiquement toutes les données (propriétés, baux, etc.) selon l'entité sélectionnée

## Composants créés

### 1. EntityContext (`src/contexts/EntityContext.tsx`)
Contexte global qui gère :
- `selectedEntity` : L'entité actuellement sélectionnée
- `showAll` : Booléen indiquant si on affiche toutes les entités
- `entities` : Liste de toutes les entités de l'utilisateur
- `setSelectedEntity()` : Fonction pour changer d'entité
- `setShowAll()` : Fonction pour activer le mode "Tout"
- `refreshEntities()` : Fonction pour recharger la liste des entités

### 2. EntitySelector (`src/components/entity-selector.tsx`)
Dropdown dans le header permettant de :
- Choisir une entité spécifique
- Choisir "Toutes les entités" (icône Globe)
- Afficher l'entité courante avec son icône et description

### 3. useEntityFilter (`src/hooks/properties/useEntityFilter.ts`)
Hook helper pour faciliter le filtrage dans les requêtes Supabase

## Comment utiliser le filtre dans vos pages

### Méthode simple avec le hook

```tsx
import { useEntityFilter } from "@/hooks/properties/useEntityFilter"
import { supabase } from "@/integrations/supabase/client"

function MyComponent() {
  const { getEntityFilter, selectedEntity, showAll } = useEntityFilter()

  async function loadData() {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)

    // Applique le filtre d'entité
    query = getEntityFilter(query, 'entity_id')

    const { data, error } = await query
    return data
  }
}
```

### Exemple complet : Modifier usePropertiesWithUnits

Dans `src/hooks/useProperties.ts`, modifier la fonction `fetchPropertiesWithUnits` :

```tsx
// Avant
async function fetchPropertiesWithUnits(): Promise<PropertyWithUnits[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // ...
}

// Après - avec filtre d'entité
async function fetchPropertiesWithUnits(entityId?: string | null, showAll?: boolean): Promise<PropertyWithUnits[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  let query = supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)

  // Filtre par entité si une est sélectionnée et qu'on n'est pas en mode "Tout"
  if (!showAll && entityId) {
    query = query.eq('entity_id', entityId)
  }

  const { data: properties, error: propertiesError } = await query
    .order('created_at', { ascending: false });

  // ...
}
```

Puis modifier le hook `usePropertiesWithUnits` :

```tsx
import { useEntity } from "@/contexts/EntityContext"

export function usePropertiesWithUnits() {
  const { selectedEntity, showAll } = useEntity()

  return useQuery({
    queryKey: ['properties', 'with-units', selectedEntity?.id, showAll],
    queryFn: () => fetchPropertiesWithUnits(selectedEntity?.id, showAll),
    enabled: !!selectedEntity || showAll, // Attendre qu'une entité soit sélectionnée ou mode "Tout"
  });
}
```

## Comportement

1. **Entité sélectionnée** : Affiche uniquement les données de cette entité
2. **"Toutes les entités"** : Affiche toutes les données de toutes les entités de l'utilisateur
3. **Aucune sélection** : Ne retourne aucune donnée (cas rare, normalement une entité par défaut est sélectionnée)

## Pages à mettre à jour

Pour chaque page qui charge des données liées aux entités, utiliser le hook `useEntityFilter` :

### Priorité haute :
- ✅ Properties (Biens immobiliers) - via entity_id
- ⏳ Dashboard (Statistiques par entité)
- ⏳ Leases (Baux - via units → properties → entity_id)
- ⏳ Documents (via property_id → entity_id)
- ⏳ Finances (via leases/properties)

### Priorité moyenne :
- ⏳ Maintenance tickets (via property_id → entity_id)
- ⏳ Calendar/Events (via property_id → entity_id)

## Gestion des entités

Dans **Paramètres → Onglet "Entités"** :
- Créer de nouvelles entités
- Définir une entité par défaut
- Voir le nombre de biens et baux par entité
- Supprimer une entité

## Notes importantes

- La première entité créée est automatiquement définie par défaut
- L'entité par défaut est présélectionnée au chargement
- Le changement d'entité rafraîchit automatiquement toutes les données des pages
- Les propriétés doivent avoir un `entity_id` pour être filtrées correctement
