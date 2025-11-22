import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { useUpdateProviderRadius, useUpdateProviderLocation, useCurrentProviderProfile } from '@/hooks/providers/useServiceProviders';
import { geocodeAddress } from '@/services/geocoding';
import { toast } from 'sonner';

export function InterventionRadiusSettings() {
  const { data: provider, isLoading } = useCurrentProviderProfile();
  const updateRadius = useUpdateProviderRadius();
  const updateLocation = useUpdateProviderLocation();

  const [radius, setRadius] = useState(50);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (provider) {
      setRadius(provider.intervention_radius_km || 50);
      setAddress(provider.address || '');
      setPostalCode(provider.postal_code || '');
      setCity(provider.city || '');
    }
  }, [provider]);

  // Récupérer automatiquement la ville à partir du code postal
  useEffect(() => {
    const fetchCity = async () => {
      if (postalCode.length === 5) {
        try {
          const response = await fetch(
            `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom&format=json`
          );
          const data = await response.json();
          if (data && data.length > 0) {
            setCity(data[0].nom);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de la ville:', error);
        }
      }
    };

    fetchCity();
  }, [postalCode]);

  const handleUpdateRadius = async () => {
    if (!provider) return;

    updateRadius.mutate({
      providerId: provider.id,
      radiusKm: radius,
    });
  };

  const handleGeocodeAddress = async () => {
    if (!provider || !address.trim() || !postalCode.trim() || !city.trim()) {
      toast.error('Veuillez saisir l\'adresse, le code postal et la ville');
      return;
    }

    setIsGeocoding(true);

    try {
      // Construire l'adresse complète
      const fullAddress = `${address}, ${postalCode} ${city}`;
      const result = await geocodeAddress(fullAddress);

      if (!result) {
        toast.error('Impossible de trouver cette adresse');
        return;
      }

      if (result.score < 0.5) {
        toast.error('L\'adresse semble incorrecte, veuillez vérifier');
        return;
      }

      updateLocation.mutate({
        providerId: provider.id,
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        postalCode: result.postalCode,
        address: address,
      });

      // Mettre à jour les champs avec les résultats du géocodage
      setCity(result.city);
      setPostalCode(result.postalCode);
    } catch (error) {
      console.error('Erreur géocodage:', error);
      toast.error('Erreur lors de la localisation de l\'adresse');
    } finally {
      setIsGeocoding(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!provider) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous devez être enregistré comme prestataire pour configurer votre rayon d'intervention.
        </AlertDescription>
      </Alert>
    );
  }

  const hasLocation = provider.latitude && provider.longitude;

  return (
    <div className="space-y-6">
      {/* Configuration de l'adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresse d'intervention
          </CardTitle>
          <CardDescription>
            Définissez votre adresse principale pour calculer les distances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="12 Rue de la Paix"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isGeocoding}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal *</Label>
              <Input
                id="postal_code"
                placeholder="75002"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\s+/g, '').slice(0, 5))}
                disabled={isGeocoding}
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="Paris"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isGeocoding}
              />
            </div>
          </div>

          <Button
            onClick={handleGeocodeAddress}
            disabled={isGeocoding || !address.trim() || !postalCode.trim() || !city.trim()}
            className="w-full"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Localisation en cours...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Localiser mon adresse
              </>
            )}
          </Button>

          {hasLocation && (
            <p className="text-xs text-muted-foreground">
              Position actuelle : {provider.city}, {provider.postal_code}
              {provider.latitude && provider.longitude && (
                <span className="ml-2">
                  ({provider.latitude.toFixed(4)}, {provider.longitude.toFixed(4)})
                </span>
              )}
            </p>
          )}

          {!hasLocation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vous devez localiser votre adresse pour que les propriétaires puissent vous trouver.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration du rayon */}
      <Card>
        <CardHeader>
          <CardTitle>Rayon d'intervention</CardTitle>
          <CardDescription>
            Définissez la distance maximale que vous êtes prêt à parcourir pour une intervention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="radius">Distance maximale : <strong>{radius} km</strong></Label>
              <Input
                type="number"
                min={5}
                max={500}
                step={5}
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
                className="w-24"
              />
            </div>

            <Slider
              id="radius"
              min={5}
              max={200}
              step={5}
              value={[radius]}
              onValueChange={(value) => setRadius(value[0])}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
              <span>200 km+</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleUpdateRadius}
              disabled={updateRadius.isPending || !hasLocation}
              className="w-full"
            >
              {updateRadius.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le rayon d\'intervention'
              )}
            </Button>

            {!hasLocation && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Localisez d'abord votre adresse pour activer cette fonctionnalité
              </p>
            )}
          </div>

          {hasLocation && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Les propriétaires situés à moins de <strong>{radius} km</strong> de votre position
                pourront vous trouver lors de leurs recherches de prestataires.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
