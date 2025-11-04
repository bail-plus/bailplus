import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'LANDLORD' | 'SERVICE_PROVIDER' | null;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isFetchingCity, setIsFetchingCity] = useState(false);

  // Pré-remplir les champs avec les données existantes du profil
  useEffect(() => {
    if (profile) {
      console.log('[CompleteProfile] Pre-filling with profile:', profile);
      console.log('[CompleteProfile] Existing specialty:', profile.specialty);
      console.log('[CompleteProfile] Existing gender:', profile.gender);

      // Pré-remplir la date de naissance
      if (profile.birthdate) {
        try {
          const date = new Date(profile.birthdate);
          if (!isNaN(date.getTime())) {
            setBirthDate(date);
          }
        } catch (e) {
          console.error('Error parsing birthdate:', e);
        }
      }

      // Pré-remplir le genre SEULEMENT s'il existe déjà
      if (profile.gender && profile.gender !== '') {
        setSelectedGender(profile.gender);
      } else {
        // S'assurer que c'est bien vide pour un nouveau compte
        setSelectedGender('');
      }

      // Pré-remplir la spécialité SEULEMENT si elle existe déjà
      if (profile.specialty && profile.specialty !== '') {
        setSelectedSpecialty(profile.specialty);
      } else {
        // S'assurer que c'est bien vide pour un nouveau compte
        setSelectedSpecialty('');
      }

      // Pré-remplir l'adresse
      if (profile.postal_code) {
        setPostalCode(profile.postal_code.toString());
      }
      if (profile.city) {
        setCity(profile.city);
      }
    }
  }, [profile]);

  // Fonction pour récupérer la ville à partir du code postal
  const fetchCityFromPostalCode = async (postalCode: string) => {
    if (postalCode.length !== 5) return;

    setIsFetchingCity(true);
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom&format=json`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        // Si plusieurs villes ont le même code postal, prendre la première
        setCity(data[0].nom);
      } else {
        toast.error('Code postal non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la ville:', error);
      toast.error('Erreur lors de la récupération de la ville');
    } finally {
      setIsFetchingCity(false);
    }
  };

  // Effet pour récupérer la ville quand le code postal change
  useEffect(() => {
    if (postalCode.length === 5) {
      fetchCityFromPostalCode(postalCode);
    }
  }, [postalCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifications
      if (!birthDate) {
        toast.error('Veuillez sélectionner votre date de naissance');
        setIsSubmitting(false);
        return;
      }

      if (!selectedGender) {
        toast.error('Veuillez sélectionner votre genre');
        setIsSubmitting(false);
        return;
      }

      if (userType === 'SERVICE_PROVIDER' && !selectedSpecialty) {
        toast.error('Veuillez sélectionner votre spécialité');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData(e.currentTarget);

      // Formater la date au format YYYY-MM-DD
      const birthdate = format(birthDate, 'yyyy-MM-dd');

      const payload: any = {
        phone_number: formData.get('phone_number') as string,
        adress: formData.get('adress') as string,
        city: city, // Utiliser le state au lieu de formData
        postal_code: parseInt(postalCode, 10), // Utiliser le state au lieu de formData
        gender: selectedGender, // Utiliser le state au lieu de formData
        birthdate: birthdate,
        updated_at: new Date().toISOString(),
      };

      // Si un type est spécifié (OAuth ou inscription classique), mettre à jour le user_type
      if (userType) {
        payload.user_type = userType;
      }

      // Si SERVICE_PROVIDER, ajouter la spécialité
      if (userType === 'SERVICE_PROVIDER') {
        payload.specialty = selectedSpecialty; // Utiliser le state au lieu de formData
      }

      console.log('[CompleteProfile] Payload envoyé:', payload);

      console.log('[CompleteProfile] 🔄 Mise à jour du profil dans Supabase...');
      console.log('[CompleteProfile] User ID:', user?.id);

      // IMPORTANT : Ne pas utiliser .select() ou .single() car la policy RLS SELECT est trop complexe
      // On fait juste l'update sans vérifier le résultat
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', user?.id);

      console.log('[CompleteProfile] Résultat update:', { error });

      if (error) {
        console.error('[CompleteProfile] ❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('[CompleteProfile] ✅ Profil mis à jour avec succès');

      // Invalider les queries pour forcer le rechargement du profil
      console.log('[CompleteProfile] 🔄 Invalidation des queries...');
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      console.log('[CompleteProfile] ✅ Queries invalidées');

      toast.success('Profil complété avec succès !');

      console.log('[CompleteProfile] 🔄 Redirection vers /app...');
      // Rediriger vers l'app
      navigate('/app', { replace: true });
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTypeLabel = userType === 'LANDLORD' ? 'Propriétaire' : userType === 'SERVICE_PROVIDER' ? 'Prestataire' : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>
              Complétez votre profil {userTypeLabel && `- ${userTypeLabel}`}
            </CardTitle>
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
                  <Select name="gender" value={selectedGender} onValueChange={setSelectedGender} required>
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
                    defaultValue={profile?.phone_number || ''}
                    required
                  />
                </div>
              </div>

              {/* Spécialité (uniquement pour SERVICE_PROVIDER) */}
              {userType === 'SERVICE_PROVIDER' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informations professionnelles</h3>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Spécialité *</Label>
                    <Select name="specialty" value={selectedSpecialty} onValueChange={setSelectedSpecialty} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plomberie">Plomberie</SelectItem>
                        <SelectItem value="electricite">Électricité</SelectItem>
                        <SelectItem value="chauffage">Chauffage</SelectItem>
                        <SelectItem value="menuiserie">Menuiserie</SelectItem>
                        <SelectItem value="peinture">Peinture</SelectItem>
                        <SelectItem value="serrurerie">Serrurerie</SelectItem>
                        <SelectItem value="jardinage">Jardinage</SelectItem>
                        <SelectItem value="nettoyage">Nettoyage</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

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
                    defaultValue={profile?.adress || ''}
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
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <div className="relative">
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="Paris"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        disabled={isFetchingCity}
                      />
                      {isFetchingCity && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
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
