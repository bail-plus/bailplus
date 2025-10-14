import { Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProviderRatings, useDeleteRating } from '@/hooks/useProviderRatings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RatingsListProps {
  providerId: string;
}

export function RatingsList({ providerId }: RatingsListProps) {
  const { data: ratings, isLoading } = useProviderRatings(providerId);
  const deleteRating = useDeleteRating();

  // Récupérer l'utilisateur actuel
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chargement des notes...
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune note pour ce prestataire
      </div>
    );
  }

  const handleDelete = async (ratingId: string) => {
    await deleteRating.mutateAsync(ratingId);
  };

  return (
    <div className="space-y-4">
      {ratings.map((rating) => {
        const isOwnRating = currentUser?.id === rating.rated_by;

        return (
          <Card key={rating.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {/* Étoiles */}
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (rating.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {rating.rating}/5
                  </span>
                </div>

                {/* Bouton supprimer si c'est sa propre note */}
                {isOwnRating && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. La note sera définitivement supprimée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(rating.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Commentaire */}
              {rating.comment && (
                <p className="text-sm text-muted-foreground mb-2">
                  {rating.comment}
                </p>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground">
                {format(new Date(rating.created_at), 'dd MMMM yyyy', { locale: fr })}
                {isOwnRating && ' • Votre note'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
