import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface ServiceProvider {
  id: string;
  user_id: string;
  company_name: string | null;
  specialty: string[] | null;
  available: boolean | null;
  total_interventions: number | null;
  average_rating: number | null;
  professional_phone: string | null;
  professional_email: string | null;
  hourly_rate: number | null;
  siret: string | null;
  address: string | null;
  insurance_certificate_url: string | null;
  insurance_expiry_date: string | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export type ServiceProviderInsert = TablesInsert<'service_providers'>;
export type ServiceProviderUpdate = TablesUpdate<'service_providers'>;

async function fetchServiceProviders(): Promise<ServiceProvider[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  console.log('[SERVICE PROVIDERS] Fetching providers for landlord', user.id);

  const { data, error } = await supabase
    .from('service_providers')
    .select(`
      id,
      user_id,
      company_name,
      specialty,
      available,
      total_interventions,
      average_rating,
      professional_phone,
      professional_email,
      hourly_rate,
      siret,
      address,
      insurance_certificate_url,
      insurance_expiry_date,
      user:profiles!service_providers_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .eq('landlord_id', user.id)
    .order('company_name', { ascending: true });

  if (error) {
    console.error('[SERVICE PROVIDERS] Error fetching:', error);
    throw error;
  }

  console.log('[SERVICE PROVIDERS] Loaded', data?.length || 0, 'providers');

  return (data || []) as any;
}

export function useServiceProviders() {
  return useQuery({
    queryKey: ['service-providers'],
    queryFn: fetchServiceProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update provider
async function updateServiceProvider({ id, ...updates }: ServiceProviderUpdate & { id: string }): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from('service_providers')
    .update(updates)
    .eq('id', id)
    .select(`
      id,
      user_id,
      company_name,
      specialty,
      available,
      total_interventions,
      average_rating,
      professional_phone,
      professional_email,
      hourly_rate,
      siret,
      address,
      insurance_certificate_url,
      insurance_expiry_date,
      user:profiles!service_providers_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateServiceProvider,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      queryClient.setQueryData(['service-provider', data.id], data);
    },
  });
}

// Delete provider
async function deleteServiceProvider(id: string): Promise<void> {
  const { error } = await supabase
    .from('service_providers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export function useDeleteServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteServiceProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });
}
