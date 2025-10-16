import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useEntity } from '@/contexts/EntityContext';
import type { TriFormData } from '@/lib/tri-schemas';

export type TRISimulation = Tables<'tri_simulations'>;
export type TRISimulationInsert = TablesInsert<'tri_simulations'>;
export type TRISimulationUpdate = TablesUpdate<'tri_simulations'>;

// Extended type with parsed simulation data
export type TRISimulationWithData = Omit<TRISimulation, 'simulation_data'> & {
  simulation_data: TriFormData;
};

// Fetch all TRI simulations for the current user
async function fetchTRISimulations(entityId?: string | null, showAll?: boolean): Promise<TRISimulationWithData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  let query = supabase
    .from('tri_simulations')
    .select('*')
    .eq('user_id', user.id);

  // Filter by entity if one is selected and not in "Show All" mode
  if (!showAll && entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as TRISimulationWithData[];
}

// Fetch a single TRI simulation by ID
async function fetchTRISimulationById(id: string): Promise<TRISimulationWithData> {
  const { data, error } = await supabase
    .from('tri_simulations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as TRISimulationWithData;
}

// Create a new TRI simulation
async function createTRISimulation(
  simulation: { name: string; simulation_data: TriFormData },
  entityId?: string | null
): Promise<TRISimulation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('tri_simulations')
    .insert({
      name: simulation.name,
      simulation_data: simulation.simulation_data as any,
      user_id: user.id,
      entity_id: entityId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating TRI simulation:', error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing TRI simulation
async function updateTRISimulation({
  id,
  ...updates
}: { id: string; name?: string; simulation_data?: TriFormData }): Promise<TRISimulation> {
  const updateData: any = {};

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.simulation_data !== undefined) {
    updateData.simulation_data = updates.simulation_data;
  }

  const { data, error } = await supabase
    .from('tri_simulations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a TRI simulation
async function deleteTRISimulation(id: string): Promise<void> {
  const { error } = await supabase
    .from('tri_simulations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch all TRI simulations
export function useTRISimulations() {
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['tri_simulations', selectedEntity?.id, showAll],
    queryFn: () => fetchTRISimulations(selectedEntity?.id, showAll),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single TRI simulation
export function useTRISimulation(id: string | undefined) {
  return useQuery({
    queryKey: ['tri_simulations', id],
    queryFn: () => fetchTRISimulationById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a TRI simulation
export function useCreateTRISimulation() {
  const queryClient = useQueryClient();
  const { selectedEntity } = useEntity();

  return useMutation({
    mutationFn: (simulation: { name: string; simulation_data: TriFormData }) =>
      createTRISimulation(simulation, selectedEntity?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tri_simulations'] });
    },
  });
}

// Hook to update a TRI simulation
export function useUpdateTRISimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTRISimulation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tri_simulations'] });
      queryClient.setQueryData(['tri_simulations', data.id], data);
    },
  });
}

// Hook to delete a TRI simulation
export function useDeleteTRISimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTRISimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tri_simulations'] });
    },
  });
}
