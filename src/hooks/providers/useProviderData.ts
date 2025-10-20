import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderDashboardData {
  newMissionsCount: number;
  inProgressMissionsCount: number;
  completedMissionsCount: number;
  totalMissionsCount: number;
  providerInfo: {
    company_name: string | null;
    specialty: string[] | null;
    total_interventions: number | null;
    average_rating: number | null;
  } | null;
}

async function fetchProviderData(): Promise<ProviderDashboardData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  console.log('[PROVIDER DASHBOARD] Fetching data for provider', user.id);

  // Fetch tickets assigned to this provider
  const { data: tickets, error: ticketsError } = await supabase
    .from('maintenance_tickets')
    .select('id, status')
    .eq('assigned_to', user.id);

  if (ticketsError) {
    console.error('[PROVIDER DASHBOARD] Error fetching tickets:', ticketsError);
  }

  // Fetch provider info from service_providers table
  const { data: providerInfo, error: providerInfoError } = await supabase
    .from('service_providers')
    .select('company_name, specialty, total_interventions, average_rating')
    .eq('user_id', user.id)
    .single();

  if (providerInfoError) {
    console.log('[PROVIDER DASHBOARD] No service provider info found (might be normal):', providerInfoError);
  }

  const ticketsList = tickets || [];
  const newMissionsCount = ticketsList.filter(t => t.status === 'NOUVEAU').length;
  const inProgressMissionsCount = ticketsList.filter(t => t.status === 'EN COURS').length;
  const completedMissionsCount = ticketsList.filter(t => t.status === 'TERMINE').length;

  console.log('[PROVIDER DASHBOARD] Data loaded:', {
    newMissions: newMissionsCount,
    inProgress: inProgressMissionsCount,
    completed: completedMissionsCount,
    total: ticketsList.length,
  });

  return {
    newMissionsCount,
    inProgressMissionsCount,
    completedMissionsCount,
    totalMissionsCount: ticketsList.length,
    providerInfo: providerInfo || null,
  };
}

export function useProviderData() {
  return useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: fetchProviderData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
