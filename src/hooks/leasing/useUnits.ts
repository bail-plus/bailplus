import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Unit = Tables<'units'>;
export type UnitInsert = TablesInsert<'units'>;
export type UnitUpdate = TablesUpdate<'units'>;

// Fetch all units for a property
async function fetchUnitsByProperty(propertyId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('property_id', propertyId)
    .order('unit_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Fetch a single unit by ID
async function fetchUnitById(id: string): Promise<Unit> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create a new unit
async function createUnit(unit: UnitInsert): Promise<Unit> {
  const { data, error } = await supabase
    .from('units')
    .insert(unit)
    .select()
    .single();

  if (error) {
    console.error('Error creating unit:', error);
    throw new Error(error.message);
  }
  return data;
}

// Update an existing unit
async function updateUnit({ id, ...updates }: UnitUpdate & { id: string }): Promise<Unit> {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a unit
async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch units for a property
export function useUnitsByProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['units', 'by-property', propertyId],
    queryFn: () => fetchUnitsByProperty(propertyId!),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single unit
export function useUnit(id: string | undefined) {
  return useQuery({
    queryKey: ['units', id],
    queryFn: () => fetchUnitById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a unit
export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUnit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['units', 'by-property', data.property_id] });
    },
  });
}

// Hook to update a unit
export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUnit,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.setQueryData(['units', data.id], data);
    },
  });
}

// Hook to delete a unit
export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
