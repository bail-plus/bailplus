import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/auth/useAuth';
import { calculateDistance } from '@/services/geocoding';
import { toast } from 'sonner';

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

async function fetchServiceProviders(userId: string): Promise<ServiceProvider[]> {
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
    .eq('landlord_id', userId)
    .order('company_name', { ascending: true });

  if (error) {
    console.error('[SERVICE PROVIDERS] Error:', error);
    throw error;
  }

  return (data || []) as ServiceProvider[];
}

export function useServiceProviders() {
  const { user, isReady } = useAuth();

  return useQuery({
    queryKey: ['service-providers', user?.id],
    queryFn: () => fetchServiceProviders(user!.id),
    enabled: isReady && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
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

/**
 * Hook pour récupérer les prestataires disponibles dans un rayon donné autour d'une propriété
 */
export function useAvailableProviders(
  propertyId?: string,
  maxDistance?: number
) {
  return useQuery({
    queryKey: ['available-providers', propertyId, maxDistance],
    queryFn: async () => {
      if (!propertyId) return [];

      // 1. Récupérer la propriété avec ses coordonnées
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      if (!property.latitude || !property.longitude) {
        toast.error('La propriété n\'a pas de coordonnées GPS');
        return [];
      }

      // 2. Récupérer tous les prestataires disponibles avec coordonnées
      const { data: providers, error: providersError } = await supabase
        .from('service_providers')
        .select(`
          *,
          user:profiles!service_providers_user_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('available', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (providersError) throw providersError;

      // 3. Filtrer par distance et rayon d'intervention
      const providersWithDistance = providers
        .map((provider) => {
          const distance = calculateDistance(
            property.latitude!,
            property.longitude!,
            provider.latitude!,
            provider.longitude!
          );

          return {
            ...provider,
            distance,
          };
        })
        .filter((provider) => {
          // Le prestataire doit avoir défini un rayon et être dans ce rayon
          const withinProviderRadius = provider.intervention_radius_km
            ? provider.distance <= provider.intervention_radius_km
            : false;

          // Si maxDistance est défini, filtrer aussi par cette limite
          const withinMaxDistance = maxDistance
            ? provider.distance <= maxDistance
            : true;

          return withinProviderRadius && withinMaxDistance;
        })
        .sort((a, b) => a.distance - b.distance); // Trier par distance croissante

      return providersWithDistance;
    },
    enabled: !!propertyId,
  });
}

/**
 * Hook pour mettre à jour le rayon d'intervention d'un prestataire
 */
export function useUpdateProviderRadius() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      radiusKm,
    }: {
      providerId: string;
      radiusKm: number;
    }) => {
      const { data, error } = await supabase
        .from('service_providers')
        .update({ intervention_radius_km: radiusKm })
        .eq('id', providerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['available-providers'] });
      toast.success('Rayon d\'intervention mis à jour');
    },
    onError: (error) => {
      console.error('Erreur mise à jour rayon:', error);
      toast.error('Erreur lors de la mise à jour du rayon d\'intervention');
    },
  });
}

/**
 * Hook pour mettre à jour les coordonnées GPS d'un prestataire
 */
export function useUpdateProviderLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      latitude,
      longitude,
      city,
      postalCode,
      address,
    }: {
      providerId: string;
      latitude: number;
      longitude: number;
      city?: string;
      postalCode?: string;
      address?: string;
    }) => {
      const updateData: ServiceProviderUpdate = {
        latitude,
        longitude,
      };

      if (city) updateData.city = city;
      if (postalCode) updateData.postal_code = postalCode;
      if (address) updateData.address = address;

      const { data, error } = await supabase
        .from('service_providers')
        .update(updateData)
        .eq('id', providerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['available-providers'] });
      toast.success('Localisation mise à jour');
    },
    onError: (error) => {
      console.error('Erreur mise à jour localisation:', error);
      toast.error('Erreur lors de la mise à jour de la localisation');
    },
  });
}

/**
 * Hook pour récupérer le profil prestataire de l'utilisateur connecté
 */
export function useCurrentProviderProfile() {
  return useQuery({
    queryKey: ['current-provider-profile'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          user:profiles!service_providers_user_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Pas de profil prestataire
        throw error;
      }

      return data;
    },
  });
}
