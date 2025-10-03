import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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
async function fetchPropertiesWithUnits(): Promise<PropertyWithUnits[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (propertiesError) throw new Error(propertiesError.message);
  if (!properties) return [];

  // Get units count for each property
  const propertiesWithUnits = await Promise.all(
    properties.map(async (property) => {
      const { count } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', property.id);

      return {
        ...property,
        unitsCount: count ?? 0,
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
async function createProperty(property: PropertyInsert): Promise<Property> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...property,
      user_id: user.id,
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
  return useQuery({
    queryKey: ['properties', 'with-units'],
    queryFn: fetchPropertiesWithUnits,
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

  return useMutation({
    mutationFn: createProperty,
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
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
