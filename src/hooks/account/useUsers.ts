import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/auth/useAuth';

type UserTypeEnum = Database['public']['Enums']['user_type_enum'];

export interface User {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  user_type: UserTypeEnum | null;
  company_name: string | null;
  specialty: string | null;
  is_invited_user: boolean | null;
  linked_to_landlord: string | null;
  invitation_accepted_at: string | null;
}

/**
 * Récupère tous les locataires (TENANT) invités par le landlord connecté
 */
async function fetchTenants(landlordId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name, phone_number, user_type, company_name, specialty, is_invited_user, linked_to_landlord, invitation_accepted_at')
    .eq('linked_to_landlord', landlordId)
    .eq('user_type', 'TENANT')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as User[];
}

/**
 * Récupère tous les prestataires (SERVICE_PROVIDER) invités par le landlord connecté
 */
async function fetchServiceProviderUsers(landlordId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name, phone_number, user_type, company_name, specialty, is_invited_user, linked_to_landlord, invitation_accepted_at')
    .eq('linked_to_landlord', landlordId)
    .eq('user_type', 'SERVICE_PROVIDER')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as User[];
}

/**
 * Récupère tous les utilisateurs invités (TENANT et SERVICE_PROVIDER)
 */
async function fetchAllInvitedUsers(landlordId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name, phone_number, user_type, company_name, specialty, is_invited_user, linked_to_landlord, invitation_accepted_at')
    .eq('linked_to_landlord', landlordId)
    .in('user_type', ['TENANT', 'SERVICE_PROVIDER'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as User[];
}

/**
 * Hook pour récupérer les locataires (TENANT)
 */
export function useTenants() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['tenants', user?.id],
    queryFn: () => fetchTenants(user!.id),
    enabled: isReady && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

/**
 * Hook pour récupérer les prestataires (SERVICE_PROVIDER)
 */
export function useServiceProviderUsers() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['service-provider-users', user?.id],
    queryFn: () => fetchServiceProviderUsers(user!.id),
    enabled: isReady && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

/**
 * Hook pour récupérer tous les utilisateurs invités
 */
export function useAllInvitedUsers() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['all-invited-users', user?.id],
    queryFn: () => fetchAllInvitedUsers(user!.id),
    enabled: isReady && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
