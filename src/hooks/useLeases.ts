import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useEntity } from '@/contexts/EntityContext';

export type Lease = Tables<'leases'>;
export type LeaseInsert = TablesInsert<'leases'>;
export type LeaseUpdate = TablesUpdate<'leases'>;

export type LeaseTenant = Tables<'lease_tenants'>;
export type LeaseGuarantor = Tables<'lease_guarantors'>;

// Extended lease type with related data
export type LeaseWithDetails = Lease & {
  unit?: {
    unit_number: string;
    type?: string;
    property: {
      name: string;
      address: string;
    };
  };
  tenant?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  coTenants?: Array<{
    first_name: string;
    last_name: string;
  }>;
  guarantorsCount?: number;
};

// Fetch all leases with details
async function fetchLeasesWithDetails(entityId?: string | null, showAll?: boolean): Promise<LeaseWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Si une entité est sélectionnée, filtrer via properties → units → leases
  let unitIds: string[] = []
  if (!showAll && entityId) {
    // 1. Récupérer les properties de l'entité
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)

    const propertyIds = properties?.map(p => p.id) || []

    if (propertyIds.length === 0) {
      return [] // Aucune propriété pour cette entité
    }

    // 2. Récupérer les units de ces properties
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .in('property_id', propertyIds)

    unitIds = units?.map(u => u.id) || []

    if (unitIds.length === 0) {
      return [] // Aucun logement pour ces propriétés
    }
  }

  // Get leases
  let leasesQuery = supabase
    .from('leases')
    .select('*')
    .eq('user_id', user.id)

  // Filtrer par unit_ids si une entité est sélectionnée
  if (!showAll && entityId && unitIds.length > 0) {
    leasesQuery = leasesQuery.in('unit_id', unitIds)
  }

  const { data: leases, error: leasesError } = await leasesQuery
    .order('created_at', { ascending: false });

  if (leasesError) throw new Error(leasesError.message);
  if (!leases) return [];

  // Enrich each lease with related data
  const enrichedLeases = await Promise.all(
    leases.map(async (lease) => {
      // Get unit with property
      const { data: unit } = await supabase
        .from('units')
        .select(`
          unit_number,
          type,
          property:properties(name, address)
        `)
        .eq('id', lease.unit_id)
        .single();

      // Get tenant from profiles (invited users)
      const { data: tenant } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone_number')
        .eq('user_id', lease.tenant_id)
        .single();

      // Get co-tenants from lease_tenants -> profiles
      const { data: leaseTenants } = await supabase
        .from('lease_tenants')
        .select('user_id')
        .eq('lease_id', lease.id)
        .eq('role', 'co-tenant');

      // Fetch co-tenant details from profiles
      let coTenants: any[] = [];
      if (leaseTenants && leaseTenants.length > 0) {
        const coTenantIds = leaseTenants.map(lt => lt.user_id).filter(id => id !== null);
        if (coTenantIds.length > 0) {
          const { data: coTenantsData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .in('user_id', coTenantIds);
          coTenants = coTenantsData || [];
        }
      }

      // Get guarantors count
      const { count: guarantorsCount } = await supabase
        .from('lease_guarantors')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', lease.id);

      return {
        ...lease,
        unit: unit as any,
        tenant: tenant as any,
        coTenants: coTenants,
        guarantorsCount: guarantorsCount ?? 0,
      };
    })
  );

  return enrichedLeases;
}

// Fetch a single lease by ID
async function fetchLeaseById(id: string): Promise<Lease> {
  const { data, error } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create a new lease
async function createLease(lease: LeaseInsert): Promise<Lease> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('leases')
    .insert({
      ...lease,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating lease:', error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing lease
async function updateLease({ id, ...updates }: LeaseUpdate & { id: string }): Promise<Lease> {
  const { data, error } = await supabase
    .from('leases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a lease
async function deleteLease(id: string): Promise<void> {
  const { error } = await supabase
    .from('leases')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch all leases with details
export function useLeasesWithDetails() {
  const { selectedEntity, showAll } = useEntity();

  const query = useQuery({
    queryKey: ['leases', 'with-details', selectedEntity?.id, showAll],
    queryFn: () => fetchLeasesWithDetails(selectedEntity?.id, showAll),
  });

  console.log('[LEASES QUERY]', {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasData: !!query.data,
    dataLength: query.data?.length || 0,
    status: query.status,
    fetchStatus: query.fetchStatus,
    error: query.error
  });

  return query;
}

// Hook to fetch a single lease
export function useLease(id: string | undefined) {
  return useQuery({
    queryKey: ['leases', id],
    queryFn: () => fetchLeaseById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a lease
export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// Hook to update a lease
export function useUpdateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLease,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.setQueryData(['leases', data.id], data);
    },
  });
}

// Hook to delete a lease
export function useDeleteLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
