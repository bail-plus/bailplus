import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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
async function fetchLeasesWithDetails(): Promise<LeaseWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Get leases
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select('*')
    .eq('user_id', user.id)
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

      // Get tenant
      const { data: tenant } = await supabase
        .from('contacts')
        .select('first_name, last_name, email, phone')
        .eq('id', lease.tenant_id)
        .single();

      // Get co-tenants
      const { data: leaseTenants } = await supabase
        .from('lease_tenants')
        .select(`
          contact:contacts(first_name, last_name)
        `)
        .eq('lease_id', lease.id)
        .eq('role', 'co-tenant');

      // Get guarantors count
      const { count: guarantorsCount } = await supabase
        .from('lease_guarantors')
        .select('*', { count: 'exact', head: true })
        .eq('lease_id', lease.id);

      return {
        ...lease,
        unit: unit as any,
        tenant: tenant as any,
        coTenants: leaseTenants?.map((lt: any) => lt.contact) ?? [],
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
  const query = useQuery({
    queryKey: ['leases', 'with-details'],
    queryFn: fetchLeasesWithDetails,
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
