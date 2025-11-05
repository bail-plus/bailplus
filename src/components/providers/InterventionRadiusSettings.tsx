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
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (provider) {
      setRadius(provider.intervention_radius_km || 50);
      setAddress(provider.address || '');
    }
  }, [provider]);

  const handleUpdateRadius = async () => {
    if (!provider) return;

    updateRadius.mutate({
      providerId: provider.id,
      radiusKm: radius,
    });
  };

  const handleGeocodeAddress = async () => {
    if (!provider || !address.trim()) {
      toast.error('Veuillez saisir une adresse');
      return;
    }

    setIsGeocoding(true);

    try {
      const result = await geocodeAddress(address);

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
        address: result.address,
      });

      setAddress(result.address);
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
            <Label htmlFor="address">Adresse complète</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                placeholder="12 Rue de la Paix, 75002 Paris"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isGeocoding}
              />
              <Button
                onClick={handleGeocodeAddress}
                disabled={isGeocoding || !address.trim()}
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                Localiser
              </Button>
            </div>
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
          </div>

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
