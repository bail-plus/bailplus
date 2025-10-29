import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDownIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ProfileTab() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateOpen, setBirthDateOpen] = useState(false);

  // Initialiser la date de naissance depuis le profil
  useEffect(() => {
    if (profile?.birthdate) {
      try {
        const date = parse(profile.birthdate, 'yyyy-MM-dd', new Date());
        setBirthDate(date);
      } catch (error) {
        console.error('Error parsing birthdate:', error);
      }
    }
  }, [profile?.birthdate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifier que la date de naissance est sélectionnée
      if (!birthDate) {
        toast.error('Veuillez sélectionner votre date de naissance');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData(e.currentTarget);

      // Formater la date au format YYYY-MM-DD
      const birthdate = format(birthDate, 'yyyy-MM-dd');

      const payload = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        phone_number: formData.get('phone_number') as string,
        adress: formData.get('adress') as string,
        city: formData.get('city') as string,
        postal_code: parseInt(formData.get('postal_code') as string, 10),
        gender: formData.get('gender') as string,
        birthdate: birthdate,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

      toast.success('Profil mis à jour avec succès !');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil utilisateur</CardTitle>
          <CardDescription>Chargement de votre profil...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>
          Gérez vos informations personnelles et coordonnées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identité */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Identité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  defaultValue={profile.first_name || ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  defaultValue={profile.last_name || ''}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre *</Label>
              <Select name="gender" defaultValue={profile.gender || undefined} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Date de naissance *</Label>
              <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="birthdate"
                    className="w-full justify-start font-normal"
                  >
                    <ChevronDownIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP", { locale: fr }) : "Sélectionnez votre date de naissance"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={(date) => {
                      setBirthDate(date);
                      setBirthDateOpen(false);
                    }}
                    captionLayout="dropdown"
                    defaultMonth={birthDate || new Date(2000, 0)}
                    fromYear={1924}
                    toYear={new Date().getFullYear() - 18}
                    locale={fr}
                    className="rounded-lg border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact</h3>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié depuis cette page
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Téléphone *</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                defaultValue={profile.phone_number || ''}
                placeholder="06 12 34 56 78"
                required
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Adresse</h3>

            <div className="space-y-2">
              <Label htmlFor="adress">Adresse *</Label>
              <Input
                id="adress"
                name="adress"
                type="text"
                defaultValue={profile.adress || ''}
                placeholder="12 rue de la Paix"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal *</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  type="text"
                  defaultValue={profile.postal_code?.toString() || ''}
                  placeholder="75001"
                  pattern="[0-9]{5}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  defaultValue={profile.city || ''}
                  placeholder="Paris"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
