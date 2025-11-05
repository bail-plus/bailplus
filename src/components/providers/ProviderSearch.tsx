import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Navigation,
  Building2,
  AlertCircle,
  Loader2,
  Euro,
  Briefcase,
} from 'lucide-react';
import { usePropertiesWithUnits } from '@/hooks/properties/useProperties';
import { useAvailableProviders } from '@/hooks/providers/useServiceProviders';

export function ProviderSearch() {
  const { data: properties = [], isLoading: propertiesLoading } = usePropertiesWithUnits();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const { data: providers = [], isLoading: providersLoading } = useAvailableProviders(
    selectedPropertyId || undefined
  );

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const hasPropertiesWithLocation = properties.some(
    (p) => p.latitude && p.longitude
  );

  if (propertiesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous devez d'abord créer des propriétés pour rechercher des prestataires.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection de la propriété */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Sélectionnez un bien
          </CardTitle>
          <CardDescription>
            Choisissez la propriété pour laquelle vous recherchez un prestataire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une propriété" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {property.name}
                    {property.city && (
                      <span className="text-xs text-muted-foreground">
                        - {property.city}
                      </span>
                    )}
                    {!property.latitude || !property.longitude ? (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        GPS manquant
                      </Badge>
                    ) : null}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!hasPropertiesWithLocation && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucune de vos propriétés n'a de coordonnées GPS. Ajoutez l'adresse complète
                de vos biens pour trouver des prestataires à proximité.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {selectedProperty && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Prestataires disponibles près de {selectedProperty.name}
            </h3>
            {providersLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>

          {!providersLoading && providers.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun prestataire disponible dans la zone d'intervention de cette propriété.
                {!selectedProperty.latitude || !selectedProperty.longitude ? (
                  <span className="block mt-2 font-semibold">
                    Veuillez d'abord ajouter les coordonnées GPS de cette propriété.
                  </span>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {provider.company_name || 'Prestataire'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3" />
                        {provider.city}, {provider.postal_code}
                        <Badge variant="secondary" className="ml-2">
                          <Navigation className="w-3 h-3 mr-1" />
                          {provider.distance} km
                        </Badge>
                      </CardDescription>
                    </div>

                    {provider.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {provider.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Spécialités */}
                  {provider.specialty && provider.specialty.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {provider.specialty.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="outline">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {spec}
                        </Badge>
                      ))}
                      {provider.specialty.length > 3 && (
                        <Badge variant="outline">
                          +{provider.specialty.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Informations */}
                  <div className="space-y-2 text-sm">
                    {provider.hourly_rate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="w-4 h-4" />
                        <span>{provider.hourly_rate}€/heure</span>
                      </div>
                    )}

                    {provider.professional_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <a
                          href={`tel:${provider.professional_phone}`}
                          className="hover:underline"
                        >
                          {provider.professional_phone}
                        </a>
                      </div>
                    )}

                    {provider.professional_email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <a
                          href={`mailto:${provider.professional_email}`}
                          className="hover:underline"
                        >
                          {provider.professional_email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  {provider.total_interventions && (
                    <div className="pt-3 border-t text-xs text-muted-foreground">
                      {provider.total_interventions} intervention
                      {provider.total_interventions > 1 ? 's' : ''} réalisée
                      {provider.total_interventions > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex gap-2">
                    <Button size="sm" className="flex-1">
                      Contacter
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Voir le profil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
