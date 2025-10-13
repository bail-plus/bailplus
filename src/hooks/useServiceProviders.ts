import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

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
