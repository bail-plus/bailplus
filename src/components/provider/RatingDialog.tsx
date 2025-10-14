import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateRating, useUpdateRating, useCheckUserRating } from '@/hooks/useProviderRatings';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  ticketId?: string;
}

export function RatingDialog({ open, onOpenChange, providerId, providerName, ticketId }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: existingRating } = useCheckUserRating(providerId, ticketId);
  const createRating = useCreateRating();
  const updateRating = useUpdateRating();

  const isLockedByTicket = Boolean(ticketId && existingRating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedByTicket) return;
    if (rating === 0) {
      return;
    }

    if (existingRating) {
      // Mettre à jour la note existante
      await updateRating.mutateAsync({
        ratingId: existingRating.id,
        rating,
        comment,
      });
    } else {
      // Créer une nouvelle note
      await createRating.mutateAsync({
        provider_id: providerId,
        rating,
        comment,
        ticket_id: ticketId,
      });
    }

    onOpenChange(false);
    setRating(0);
    setComment('');
  };

  // Initialiser les valeurs si une note existe
  React.useEffect(() => {
    if (existingRating && open) {
      setRating(existingRating.rating || 0);
      setComment(existingRating.comment || '');
    } else if (!open) {
      // Réinitialiser quand on ferme
      setRating(0);
      setComment('');
    }
  }, [existingRating, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isLockedByTicket
              ? 'Votre note'
              : existingRating
              ? 'Modifier votre note'
              : 'Noter le prestataire'}
          </DialogTitle>
          <DialogDescription>
            {isLockedByTicket
              ? `Vous avez déjà noté ${providerName} pour ce ticket.`
              : existingRating
              ? `Modifiez votre note pour ${providerName}`
              : `Donnez votre avis sur ${providerName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection d'étoiles */}
          <div className="space-y-2">
            <Label>Note *</Label>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !isLockedByTicket && setRating(star)}
                  onMouseEnter={() => !isLockedByTicket && setHoveredRating(star)}
                  onMouseLeave={() => !isLockedByTicket && setHoveredRating(0)}
                  className={`transition-transform ${isLockedByTicket ? 'opacity-70 cursor-not-allowed' : 'hover:scale-110'}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Partagez votre expérience avec ce prestataire..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isLockedByTicket}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setRating(0);
                setComment('');
              }}
            >
              Annuler
            </Button>
            {!isLockedByTicket && (
              <Button
                type="submit"
                disabled={rating === 0 || createRating.isPending || updateRating.isPending}
              >
                {createRating.isPending || updateRating.isPending
                  ? 'Enregistrement...'
                  : existingRating
                  ? 'Modifier'
                  : 'Envoyer'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
