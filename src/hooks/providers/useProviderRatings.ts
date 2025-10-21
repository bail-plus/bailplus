import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type ProviderRating = Tables<'provider_ratings'>;

export interface ProviderRatingWithDetails extends ProviderRating {
  rated_by_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  ticket?: {
    title: string | null;
    description: string | null;
  };
}

export interface RatingInput {
  provider_id: string;
  rating: number;
  comment?: string;
  ticket_id?: string;
}

export interface RatingStats {
  total_ratings: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Récupérer toutes les notes d'un prestataire avec détails
export const useProviderRatings = (providerId: string | undefined) => {
  return useQuery({
    queryKey: ['provider-ratings', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_ratings')
        .select(`
          *,
          rated_by_user:profiles!provider_ratings_rated_by_fkey(
            first_name,
            last_name,
            email
          ),
          ticket:maintenance_tickets(
            title,
            description
          )
        `)
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProviderRatingWithDetails[];
    },
    enabled: !!providerId,
  });
};

// Récupérer les statistiques de notes d'un prestataire
export const useProviderRatingStats = (providerId: string | undefined) => {
  return useQuery({
    queryKey: ['provider-rating-stats', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_ratings')
        .select('rating')
        .eq('provider_id', providerId!);

      if (error) throw error;

      const ratings = data || [];
      const total = ratings.length;

      if (total === 0) {
        return {
          total_ratings: 0,
          average_rating: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        } as RatingStats;
      }

      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / total;

      const distribution = ratings.reduce((acc, r) => {
        acc[r.rating as keyof typeof acc] = (acc[r.rating as keyof typeof acc] || 0) + 1;
        return acc;
      }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

      return {
        total_ratings: total,
        average_rating: Math.round(average * 10) / 10,
        rating_distribution: distribution
      } as RatingStats;
    },
    enabled: !!providerId,
  });
};

// Récupérer les notes d'un ticket spécifique
export const useTicketRatings = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket-ratings', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_ratings')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProviderRating[];
    },
    enabled: !!ticketId,
  });
};

// Créer une nouvelle note
export const useCreateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: RatingInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si l'utilisateur a déjà noté ce ticket
      if (rating.ticket_id) {
        const { data: existingRating } = await supabase
          .from('provider_ratings')
          .select('id')
          .eq('ticket_id', rating.ticket_id)
          .eq('rated_by', user.id)
          .maybeSingle();

        if (existingRating) {
          throw new Error('Vous avez déjà noté ce prestataire pour ce ticket');
        }
      }

      const { data, error } = await supabase
        .from('provider_ratings')
        .insert({
          provider_id: rating.provider_id,
          rated_by: user.id,
          rating: rating.rating,
          comment: rating.comment || null,
          ticket_id: rating.ticket_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la moyenne du prestataire
      await updateProviderAverageRating(rating.provider_id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-ratings', variables.provider_id] });
      queryClient.invalidateQueries({ queryKey: ['provider-rating-stats', variables.provider_id] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['provider-data'] });
      queryClient.invalidateQueries({ queryKey: ['my-provider-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['my-provider-rating-stats'] });
      if (variables.ticket_id) {
        queryClient.invalidateQueries({ queryKey: ['ticket-ratings', variables.ticket_id] });
        queryClient.invalidateQueries({ queryKey: ['user-rating', variables.provider_id, variables.ticket_id] });
      }
      toast.success('Note ajoutée avec succès');
    },
    onError: (error: Error) => {
      console.error('Error creating rating:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout de la note');
    },
  });
};

// Mettre à jour une note existante
export const useUpdateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ratingId, rating, comment }: { ratingId: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('provider_ratings')
        .update({
          rating,
          comment: comment || null,
        })
        .eq('id', ratingId)
        .select()
        .single();

      if (error) throw error;

      // Récupérer le provider_id pour mettre à jour la moyenne
      if (data) {
        await updateProviderAverageRating(data.provider_id);
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['provider-ratings', data.provider_id] });
        queryClient.invalidateQueries({ queryKey: ['service-providers'] });
        queryClient.invalidateQueries({ queryKey: ['provider-data'] });
      }
      toast.success('Note mise à jour avec succès');
    },
    onError: (error: Error) => {
      console.error('Error updating rating:', error);
      toast.error('Erreur lors de la mise à jour de la note');
    },
  });
};

// Supprimer une note
export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratingId: string) => {
      // Récupérer la note avant de la supprimer pour avoir le provider_id
      const { data: rating } = await supabase
        .from('provider_ratings')
        .select('provider_id')
        .eq('id', ratingId)
        .single();

      const { error } = await supabase
        .from('provider_ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;

      // Mettre à jour la moyenne du prestataire
      if (rating) {
        await updateProviderAverageRating(rating.provider_id);
      }

      return rating;
    },
    onSuccess: (rating) => {
      if (rating) {
        queryClient.invalidateQueries({ queryKey: ['provider-ratings', rating.provider_id] });
        queryClient.invalidateQueries({ queryKey: ['service-providers'] });
        queryClient.invalidateQueries({ queryKey: ['provider-data'] });
      }
      toast.success('Note supprimée avec succès');
    },
    onError: (error: Error) => {
      console.error('Error deleting rating:', error);
      toast.error('Erreur lors de la suppression de la note');
    },
  });
};

// Fonction utilitaire pour recalculer et mettre à jour la moyenne des notes
async function updateProviderAverageRating(providerKey: string) {
  // providerKey peut être service_providers.id ou service_providers.user_id
  const { data: sp } = await supabase
    .from('service_providers')
    .select('id, user_id')
    .or(`id.eq.${providerKey},user_id.eq.${providerKey}`)
    .maybeSingle();

  if (!sp) {
    console.warn('updateProviderAverageRating: provider not found for key', providerKey);
    return;
  }

  // Récupérer toutes les notes du prestataire, peu importe la clé utilisée
  const { data: ratings, error: ratingsError } = await supabase
    .from('provider_ratings')
    .select('rating')
    .in('provider_id', [sp.id, sp.user_id]);

  if (ratingsError) {
    console.error('Error fetching ratings:', ratingsError);
    return;
  }

  const average = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
    : null;

  const { error: updateError } = await supabase
    .from('service_providers')
    .update({ average_rating: average })
    .eq('id', sp.id);

  if (updateError) {
    console.error('Error updating average rating:', updateError);
  }
}

// Vérifier si l'utilisateur a déjà noté ce prestataire pour ce ticket
export const useCheckUserRating = (providerId: string, ticketId?: string) => {
  return useQuery({
    queryKey: ['user-rating', providerId, ticketId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const query = supabase
        .from('provider_ratings')
        .select('*')
        .eq('provider_id', providerId)
        .eq('rated_by', user.id);

      if (ticketId) {
        query.eq('ticket_id', ticketId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as ProviderRating | null;
    },
    enabled: !!providerId,
  });
};

// Hook pour que les prestataires voient leurs propres notes
export const useMyProviderRatings = () => {
  return useQuery({
    queryKey: ['my-provider-ratings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le provider_id à partir de l'user_id
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError) throw providerError;
      if (!provider) throw new Error('Prestataire non trouvé');

      // Récupérer toutes les notes du prestataire (avec détails si autorisé par RLS)
      console.log('[MY_PROVIDER_RATINGS] provider_id', provider.id, 'user', user.id);
      const { data, error } = await supabase
        .from('provider_ratings')
        .select(`
          *,
          rated_by_user:profiles!provider_ratings_rated_by_fkey(
            first_name,
            last_name,
            email
          ),
          ticket:maintenance_tickets(
            title,
            description
          )
        `)
        .in('provider_id', [provider.id, provider.user_id])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Fallback to base ratings due to RLS or relationship error:', error.message);
        const { data: baseData, error: baseError } = await supabase
          .from('provider_ratings')
          .select('*')
          .in('provider_id', [provider.id, provider.user_id])
          .order('created_at', { ascending: false });
        if (baseError) throw baseError;
        console.log('[MY_PROVIDER_RATINGS] base count', baseData?.length || 0);
        return baseData as ProviderRatingWithDetails[];
      }
      console.log('[MY_PROVIDER_RATINGS] count', data?.length || 0);
      return data as ProviderRatingWithDetails[];
    },
  });
};

// Hook pour que les prestataires voient leurs statistiques de notes
export const useMyProviderRatingStats = () => {
  return useQuery({
    queryKey: ['my-provider-rating-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer le provider_id à partir de l'user_id
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError) throw providerError;
      if (!provider) throw new Error('Prestataire non trouvé');

      // Récupérer les notes
      const { data, error } = await supabase
        .from('provider_ratings')
        .select('rating, provider_id')
        .in('provider_id', [provider.id, provider.user_id]);

      if (error) throw error;

      const ratings = data || [];
      const total = ratings.length;

      if (total === 0) {
        return {
          total_ratings: 0,
          average_rating: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        } as RatingStats;
      }

      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / total;

      const distribution = ratings.reduce((acc, r) => {
        acc[r.rating as keyof typeof acc] = (acc[r.rating as keyof typeof acc] || 0) + 1;
        return acc;
      }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

      return {
        total_ratings: total,
        average_rating: Math.round(average * 10) / 10,
        rating_distribution: distribution
      } as RatingStats;
    },
  });
};
