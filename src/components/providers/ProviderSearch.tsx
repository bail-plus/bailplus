import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  User,
  Calendar,
  Clock3,
  Users,
} from 'lucide-react';
import { usePropertiesWithUnits } from '@/hooks/properties/useProperties';
import { useAvailableProviders, useTenantProviderHistory } from '@/hooks/providers/useServiceProviders';

const SPECIALTIES = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'chauffage', label: 'Chauffage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'serrurerie', label: 'Serrurerie' },
  { value: 'jardinage', label: 'Jardinage' },
  { value: 'nettoyage', label: 'Nettoyage' },
  { value: 'autre', label: 'Autre' },
];

export function ProviderSearch() {
  const { data: properties = [], isLoading: propertiesLoading } = usePropertiesWithUnits();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { data: providers = [], isLoading: providersLoading } = useAvailableProviders(
    selectedPropertyId || undefined
  );
  const { data: historyProviders = [], isLoading: historyLoading } = useTenantProviderHistory(
    selectedPropertyId || undefined
  );

  // Filtrer les prestataires par spécialité
  const filteredProviders = useMemo(() => {
    if (selectedSpecialty === 'all') return providers;

    return providers.filter((provider) => {
      if (!provider.specialty || provider.specialty.length === 0) return false;
      return provider.specialty.includes(selectedSpecialty);
    });
  }, [providers, selectedSpecialty]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const hasPropertiesWithLocation = properties.some(
    (p) => p.latitude && p.longitude
  );

  const formatDate = (value: string | null) => {
    if (!value) return 'Date inconnue';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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

      {/* Filtre par spécialité */}
      {selectedProperty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Filtrer par métier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les métiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les métiers</SelectItem>
                {SPECIALTIES.map((spec) => (
                  <SelectItem key={spec.value} value={spec.value}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Résultats de recherche */}
      {selectedProperty && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {filteredProviders.length} prestataire{filteredProviders.length > 1 ? 's' : ''} disponible{filteredProviders.length > 1 ? 's' : ''} près de {selectedProperty.name}
                {selectedSpecialty !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {SPECIALTIES.find(s => s.value === selectedSpecialty)?.label}
                  </Badge>
                )}
              </h3>
              {providersLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>

            {!providersLoading && filteredProviders.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {providers.length === 0 ? (
                    <>
                      Aucun prestataire disponible dans la zone d'intervention de cette propriété.
                      {!selectedProperty.latitude || !selectedProperty.longitude ? (
                        <span className="block mt-2 font-semibold">
                          Veuillez d'abord ajouter les coordonnées GPS de cette propriété.
                        </span>
                      ) : null}
                    </>
                  ) : (
                    `Aucun prestataire trouvé pour le métier "${SPECIALTIES.find(s => s.value === selectedSpecialty)?.label}".`
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProviders.map((provider) => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {provider.company_name || 'Prestataire'}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {provider.city}, {provider.postal_code}
                            <Badge variant="secondary" className="ml-2">
                              <Navigation className="w-3 h-3 mr-1" />
                              {provider.distance} km
                            </Badge>
                          </div>
                        </div>

                        {provider.average_rating && (
                          <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded-md">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {provider.average_rating.toFixed(1)} ({provider.review_count || 0})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {provider.specialty?.map((spec: string) => (
                        <Badge key={spec} variant="outline">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {SPECIALTIES.find(s => s.value === spec)?.label || spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Rayon</p>
                        <p className="font-semibold">{provider.intervention_radius_km} km</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Tarif horaire</p>
                        <p className="font-semibold">{provider.hourly_rate ? `${provider.hourly_rate}€` : 'Sur devis'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Interventions</p>
                        <p className="font-semibold">{provider.total_interventions || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Réactivité</p>
                        <p className="font-semibold">{provider.response_time_hours ? `${provider.response_time_hours}h` : 'N.C.'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{provider.professional_phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{provider.professional_email || provider.user?.email || 'Non renseigné'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" className="flex-1">
                        Contacter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        Voir le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Prestataires déjà sollicités par vos locataires
              </CardTitle>
              <CardDescription>
                Basé sur les tickets de maintenance assignés pour ce bien. Priorisez ceux qui connaissent déjà le locataire.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {historyLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recherche des interventions passées...
                </div>
              )}

              {!historyLoading && historyProviders.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun prestataire n'a encore été assigné aux locataires de cette propriété.
                  </AlertDescription>
                </Alert>
              )}

              {!historyLoading && historyProviders.length > 0 && (
                <div className="space-y-3">
                  {historyProviders.map((provider) => {
                    const displayName =
                      provider.company_name ||
                      [provider.user?.first_name, provider.user?.last_name].filter(Boolean).join(' ') ||
                      provider.professional_email ||
                      'Prestataire';

                    return (
                      <div
                        key={provider.id}
                        className="border rounded-lg p-3 hover:border-primary/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <p className="font-semibold">{displayName}</p>
                              {provider.specialty?.slice(0, 2).map((spec: string) => (
                                <Badge key={spec} variant="secondary">
                                  {SPECIALTIES.find((s) => s.value === spec)?.label || spec}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {[provider.city, provider.postal_code].filter(Boolean).join(' ') || 'Localisation inconnue'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock3 className="w-3 h-3" />
                                Dernière intervention {formatDate(provider.last_intervention_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {provider.interventions_count} intervention{provider.interventions_count > 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {provider.tenants_count} locataire{provider.tenants_count > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {provider.average_rating && (
                            <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded-md">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {provider.average_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {provider.professional_phone && (
                            <Button variant="outline" size="sm" className="gap-2">
                              <Phone className="w-4 h-4" />
                              Appeler
                            </Button>
                          )}
                          {provider.professional_email && (
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Mail className="w-4 h-4" />
                              Écrire
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modale de profil détaillé */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil du prestataire
            </DialogTitle>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6 pt-4">
              {/* En-tête du profil */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {selectedProvider.company_name || 'Prestataire'}
                  </h3>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedProvider.city}, {selectedProvider.postal_code}
                  </p>
                </div>

                {selectedProvider.average_rating && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <div>
                      <div className="font-bold text-lg">
                        {selectedProvider.average_rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedProvider.review_count || 0} avis
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Spécialités */}
              {selectedProvider.specialty && selectedProvider.specialty.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Spécialités
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.specialty.map((spec: string) => (
                      <Badge key={spec} variant="secondary">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {SPECIALTIES.find(s => s.value === spec)?.label || spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedProvider.description && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Description
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProvider.description}
                  </p>
                </div>
              )}

              {/* Informations de contact */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">
                  Informations de contact
                </Label>
                <div className="space-y-3">
                  {selectedProvider.professional_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`tel:${selectedProvider.professional_phone}`}
                        className="text-sm hover:underline"
                      >
                        {selectedProvider.professional_phone}
                      </a>
                    </div>
                  )}

                  {selectedProvider.professional_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedProvider.professional_email}`}
                        className="text-sm hover:underline"
                      >
                        {selectedProvider.professional_email}
                      </a>
                    </div>
                  )}

                  {selectedProvider.distance !== undefined && (
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        À {selectedProvider.distance} km de votre propriété
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarifs et disponibilité */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">
                  Tarifs et disponibilité
                </Label>
                <div className="space-y-3">
                  {selectedProvider.hourly_rate && (
                    <div className="flex items-center gap-3">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedProvider.hourly_rate}€/heure
                      </span>
                    </div>
                  )}

                  {selectedProvider.intervention_radius_km && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Rayon d'intervention : {selectedProvider.intervention_radius_km} km
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">
                  Statistiques
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedProvider.total_interventions !== undefined && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">
                        {selectedProvider.total_interventions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Interventions réalisées
                      </div>
                    </div>
                  )}

                  {selectedProvider.years_of_experience && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">
                        {selectedProvider.years_of_experience}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Années d'expérience
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex gap-3">
                <Button className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
