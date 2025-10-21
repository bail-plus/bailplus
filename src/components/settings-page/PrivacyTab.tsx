import { Shield, Download } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import SubscriptionPanel from "@/components/dashboard/settings/payment/SubscriptionPanel";

type PrivacyTabProps = {
  userType: string;
};

export function PrivacyTab({ userType }: PrivacyTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">RGPD et confidentialité</h3>
        <p className="text-sm text-muted-foreground">
          Gestion des données personnelles et conformité RGPD
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Export des données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conformément au RGPD, vous pouvez demander l&apos;export de toutes vos données personnelles.
            </p>

            <Button className="w-full gap-2">
              <Download className="w-4 h-4" />
              Télécharger mes données
            </Button>

            <p className="text-xs text-muted-foreground">
              L&apos;export inclura : profil, biens, locataires, communications, documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Suppression du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La suppression de votre compte effacera définitivement toutes vos données.
            </p>

            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Cette action est irréversible
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Toutes vos données seront définitivement supprimées
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Supprimer mon compte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Cette action supprimera définitivement votre compte et toutes les données associées.
                  </p>
                  <div className="space-y-2">
                    <Label>Tapez &quot;SUPPRIMER&quot; pour confirmer</Label>
                    <Input placeholder="SUPPRIMER" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive">Confirmer la suppression</Button>
                    <Button variant="outline">Annuler</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {userType === "LANDLORD" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des traitements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Création du compte</div>
                    <div className="text-xs text-muted-foreground">
                      15/01/2024 à 14:30
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Accepté
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Ajout de locataires</div>
                    <div className="text-xs text-muted-foreground">
                      15/01/2024 à 15:45
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Traité
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <SubscriptionPanel />
        </>
      )}
    </div>
  );
}
