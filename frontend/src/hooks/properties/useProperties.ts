import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useEntity } from '@/contexts/EntityContext';
import { geocodeAddress } from '@/services/geocoding';

export type Property = Tables<'properties'>;
export type PropertyInsert = TablesInsert<'properties'>;
export type PropertyUpdate = TablesUpdate<'properties'>;

export type Unit = Tables<'units'>;
export type UnitInsert = TablesInsert<'units'>;
export type UnitUpdate = TablesUpdate<'units'>;

// Extended property type with units count
export type PropertyWithUnits = Property & {
  unitsCount?: number;
  units?: Unit[];
};

// Fetch all properties
async function fetchProperties(): Promise<Property[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Fetch properties with units count
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

  if (propertiesError) throw new Error(propertiesError.message);
  if (!properties) return [];

  // Get units for each property
  const propertiesWithUnits = await Promise.all(
    properties.map(async (property) => {
      const { data: units } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', property.id)
        .order('unit_number', { ascending: true });

      return {
        ...property,
        units: units ?? [],
        unitsCount: units?.length ?? 0,
      };
    })
  );

  return propertiesWithUnits;
}

// Fetch a single property by ID
async function fetchPropertyById(id: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Fetch a property with its units
async function fetchPropertyWithUnits(id: string): Promise<PropertyWithUnits> {
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (propertyError) throw new Error(propertyError.message);

  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', id)
    .order('unit_number', { ascending: true });

  if (unitsError) throw new Error(unitsError.message);

  return {
    ...property,
    units: units ?? [],
    unitsCount: units?.length ?? 0,
  };
}

// Create a new property
async function createProperty(property: PropertyInsert, entityId?: string | null): Promise<Property> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Géocoder automatiquement l'adresse si elle est fournie et qu'il n'y a pas déjà de coordonnées
  let geocodedData = {};
  if (property.address && !property.latitude && !property.longitude) {
    try {
      const fullAddress = [
        property.address,
        property.postal_code,
        property.city,
      ]
        .filter(Boolean)
        .join(', ');

      const geocodeResult = await geocodeAddress(fullAddress);

      if (geocodeResult && geocodeResult.score >= 0.4) {
        geocodedData = {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
          city: geocodeResult.city,
          postal_code: geocodeResult.postalCode,
        };
        console.log('✅ Propriété géocodée automatiquement:', geocodeResult);
      }
    } catch (error) {
      console.warn('⚠️ Impossible de géocoder l\'adresse:', error);
      // On continue sans bloquer la création
    }
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...property,
      ...geocodedData, // Ajoute les coordonnées GPS si géocodage réussi
      user_id: user.id,
      entity_id: property.entity_id || entityId || null, // Utilise entity_id du form, sinon celui sélectionné, sinon null
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing property
async function updateProperty({ id, ...updates }: PropertyUpdate & { id: string }): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a property
async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch all properties
export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch properties with units count
export function usePropertiesWithUnits() {
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['properties', 'with-units', selectedEntity?.id, showAll],
    queryFn: () => fetchPropertiesWithUnits(selectedEntity?.id, showAll),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single property
export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => fetchPropertyById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a property with its units
export function usePropertyWithUnits(id: string | undefined) {
  return useQuery({
    queryKey: ['properties', id, 'with-units'],
    queryFn: () => fetchPropertyWithUnits(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a property
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { selectedEntity } = useEntity();

  return useMutation({
    mutationFn: (property: PropertyInsert) => createProperty(property, selectedEntity?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

// Hook to update a property
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProperty,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.setQueryData(['properties', data.id], data);
    },
  });
}

// Hook to delete a property
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      // Invalidate all related queries due to cascade delete
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['rent_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}
