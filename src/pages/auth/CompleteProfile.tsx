import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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

export default function CompleteProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateOpen, setBirthDateOpen] = useState(false);

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

      // Invalider les queries pour forcer le rechargement du profil
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });

      toast.success('Profil complété avec succès !');

      // Rediriger vers l'app
      navigate('/app', { replace: true });
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Complétez votre profil</CardTitle>
            <CardDescription>
              Quelques informations supplémentaires sont nécessaires pour finaliser votre inscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations personnelles</h3>

                <div className="space-y-2">
                  <Label htmlFor="gender">Genre *</Label>
                  <Select name="gender" required>
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
                        defaultMonth={new Date(2000, 0)}
                        fromYear={1924}
                        toYear={new Date().getFullYear() - 18}
                        locale={fr}
                        className="rounded-lg border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone *</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    required
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Adresse</h3>

                <div className="space-y-2">
                  <Label htmlFor="adress">Adresse *</Label>
                  <Input
                    id="adress"
                    name="adress"
                    type="text"
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
                      placeholder="Paris"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Info message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Ces informations sont nécessaires pour utiliser pleinement la plateforme. Vous pourrez les modifier à tout moment dans vos paramètres.
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Finaliser mon inscription'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
