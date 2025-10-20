import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Palette, Upload } from "lucide-react";

export function BrandingTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Branding et apparence</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez l&apos;apparence de vos documents et emails
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Logo et couleurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo de l&apos;organisation</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour importer votre logo
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  defaultValue="#3b82f6"
                  className="w-20"
                />
                <Input
                  placeholder="#3b82f6"
                  defaultValue="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  defaultValue="#64748b"
                  className="w-20"
                />
                <Input
                  placeholder="#64748b"
                  defaultValue="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
              <Input id="org-name" defaultValue="Propriétaire Principal" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-address">Adresse</Label>
              <Textarea
                id="org-address"
                placeholder="Adresse complète..."
                defaultValue={"123 rue de la République\n75001 Paris"}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-phone">Téléphone</Label>
              <Input id="org-phone" placeholder="01 23 45 67 89" defaultValue="01 23 45 67 89" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-email">Email</Label>
              <Input id="org-email" type="email" defaultValue="proprietaire@example.com" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Numérotation automatique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receipt-format">Format des quittances</Label>
              <Input
                id="receipt-format"
                placeholder="QUIT-YYYY-####"
                defaultValue="QUIT-YYYY-####"
              />
              <p className="text-xs text-muted-foreground">Ex: QUIT-2024-0001</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease-format">Format des baux</Label>
              <Input id="lease-format" placeholder="BAIL-YYYY-####" defaultValue="BAIL-YYYY-####" />
              <p className="text-xs text-muted-foreground">Ex: BAIL-2024-0001</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-format">Format des tickets</Label>
              <Input id="ticket-format" placeholder="TIC-YYYY-####" defaultValue="TIC-YYYY-####" />
              <p className="text-xs text-muted-foreground">Ex: TIC-2024-0001</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Enregistrer les préférences</Button>
      </div>
    </div>
  );
}
