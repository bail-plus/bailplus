import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { geocodeAddress } from '@/services/geocoding';
import { toast } from 'sonner';

interface GeocodeResult {
  propertyId: string;
  propertyName: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  error?: string;
}

/**
 * Hook pour géocoder automatiquement une propriété à partir de son adresse
 */
export function useGeocodeProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      address,
      city,
      postalCode,
    }: {
      propertyId: string;
      address: string;
      city?: string;
      postalCode?: string;
    }) => {
      // Construire l'adresse complète
      const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');

      // Géocoder l'adresse
      const result = await geocodeAddress(fullAddress);

      if (!result) {
        throw new Error('Impossible de localiser cette adresse');
      }

      if (result.score < 0.4) {
        throw new Error('L\'adresse semble incorrecte ou incomplète');
      }

      // Mettre à jour la propriété dans Supabase
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          latitude: result.latitude,
          longitude: result.longitude,
          city: result.city,
          postal_code: result.postalCode,
        })
        .eq('id', propertyId);

      if (updateError) throw updateError;

      return {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        postalCode: result.postalCode,
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties-with-units'] });
      toast.success('Coordonnées GPS mises à jour');
    },
    onError: (error: Error) => {
      console.error('Erreur géocodage:', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

/**
 * Hook pour géocoder automatiquement toutes les propriétés sans coordonnées GPS
 */
export function useGeocodeAllProperties() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Récupérer toutes les propriétés sans coordonnées GPS mais avec une adresse
      const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id, name, address, city, postal_code, latitude, longitude')
        .is('latitude', null)
        .not('address', 'is', null);

      if (fetchError) throw fetchError;

      if (!properties || properties.length === 0) {
        toast.info('Aucune propriété à géocoder');
        return { results: [], total: 0, success: 0, failed: 0 };
      }

      const results: GeocodeResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      // Géocoder chaque propriété
      for (const property of properties) {
        try {
          // Construire l'adresse complète
          const fullAddress = [
            property.address,
            property.postal_code,
            property.city,
          ]
            .filter(Boolean)
            .join(', ');

          // Géocoder
          const result = await geocodeAddress(fullAddress);

          if (!result || result.score < 0.4) {
            results.push({
              propertyId: property.id,
              propertyName: property.name,
              success: false,
              error: 'Adresse introuvable ou score trop faible',
            });
            failedCount++;
            continue;
          }

          // Mettre à jour dans Supabase
          const { error: updateError } = await supabase
            .from('properties')
            .update({
              latitude: result.latitude,
              longitude: result.longitude,
              city: result.city,
              postal_code: result.postalCode,
            })
            .eq('id', property.id);

          if (updateError) {
            results.push({
              propertyId: property.id,
              propertyName: property.name,
              success: false,
              error: updateError.message,
            });
            failedCount++;
          } else {
            results.push({
              propertyId: property.id,
              propertyName: property.name,
              success: true,
              latitude: result.latitude,
              longitude: result.longitude,
              city: result.city,
              postalCode: result.postalCode,
            });
            successCount++;
          }

          // Petite pause pour ne pas surcharger l'API
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          results.push({
            propertyId: property.id,
            propertyName: property.name,
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          });
          failedCount++;
        }
      }

      return {
        results,
        total: properties.length,
        success: successCount,
        failed: failedCount,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties-with-units'] });

      if (data.success > 0) {
        toast.success(
          `${data.success}/${data.total} propriétés géocodées avec succès`
        );
      }

      if (data.failed > 0) {
        toast.warning(
          `${data.failed} propriétés n'ont pas pu être géocodées`
        );
      }
    },
    onError: (error: Error) => {
      console.error('Erreur géocodage en masse:', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
