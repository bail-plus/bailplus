import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useGeocodeAllProperties } from '@/hooks/properties/useGeocodeProperties';
import { Progress } from '@/components/ui/progress';

export function GeocodePropertiesButton() {
  const [showResults, setShowResults] = useState(false);
  const geocodeAll = useGeocodeAllProperties();

  const handleGeocode = async () => {
    setShowResults(false);
    await geocodeAll.mutateAsync();
    setShowResults(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Géolocalisation automatique
        </CardTitle>
        <CardDescription>
          Ajoutez automatiquement les coordonnées GPS à vos propriétés à partir de leurs adresses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cette action va analyser toutes vos propriétés et ajouter automatiquement les coordonnées GPS
            pour celles qui n'en ont pas encore. Cela permettra aux prestataires de vous trouver.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleGeocode}
          disabled={geocodeAll.isPending}
          className="w-full"
        >
          {geocodeAll.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Géocodage en cours...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Géocoder toutes les propriétés
            </>
          )}
        </Button>

        {geocodeAll.isPending && geocodeAll.data && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{geocodeAll.data.success + geocodeAll.data.failed}/{geocodeAll.data.total}</span>
            </div>
            <Progress
              value={((geocodeAll.data.success + geocodeAll.data.failed) / geocodeAll.data.total) * 100}
            />
          </div>
        )}

        {showResults && geocodeAll.data && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Résultats du géocodage</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{geocodeAll.data.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{geocodeAll.data.success}</div>
                <div className="text-xs text-green-700">Réussis</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{geocodeAll.data.failed}</div>
                <div className="text-xs text-red-700">Échecs</div>
              </div>
            </div>

            {geocodeAll.data.results.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {geocodeAll.data.results.map((result) => (
                  <div
                    key={result.propertyId}
                    className={`flex items-start gap-2 p-2 rounded text-sm ${
                      result.success
                        ? 'bg-green-50 text-green-900'
                        : 'bg-red-50 text-red-900'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{result.propertyName}</div>
                      {result.success ? (
                        <div className="text-xs">
                          {result.city}, {result.postalCode}
                        </div>
                      ) : (
                        <div className="text-xs">{result.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
