import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function RentRulesTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Règles de loyer et indexation</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les paramètres utilisés pour l&apos;indexation automatique et le suivi des loyers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Index IRL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="irl-reference">Index de référence</Label>
              <Input
                id="irl-reference"
                placeholder="Ex: 132.62"
                defaultValue="132.62"
              />
              <p className="text-xs text-muted-foreground">
                Index utilisé lors de la signature du bail
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="irl-current">Index IRL actuel</Label>
              <Input
                id="irl-current"
                placeholder="Ex: 134.48"
                defaultValue="134.48"
              />
              <p className="text-xs text-muted-foreground">
                Dernier index publié par l&apos;INSEE
              </p>
            </div>

            <Button className="w-full">Mettre à jour les indices</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Encadrement des loyers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rent-ref">Loyer de référence (€/m²)</Label>
              <Input id="rent-ref" placeholder="Ex: 25.50" defaultValue="25.50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent-major">Loyer majoré (+20%)</Label>
              <Input
                id="rent-major"
                placeholder="Calculé automatiquement"
                value="30.60"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent-minor">Loyer minoré (-30%)</Label>
              <Input
                id="rent-minor"
                placeholder="Calculé automatiquement"
                value="17.85"
                disabled
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="rent-control" defaultChecked />
              <Label htmlFor="rent-control" className="text-sm">
                Vérifier l&apos;encadrement lors de la création des baux
              </Label>
            </div>

            <Button className="w-full">Sauvegarder les règles</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Révision automatique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revision-month">Mois d&apos;anniversaire</Label>
              <Input id="revision-month" placeholder="Ex: Avril" defaultValue="Avril" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revision-notice">Délai de prévenance</Label>
              <Input
                id="revision-notice"
                placeholder="Ex: 2 mois"
                defaultValue="2 mois"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revision-commentaires">Commentaires</Label>
              <Input
                id="revision-commentaires"
                placeholder="Ex: notifier le locataire par email"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
