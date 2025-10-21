import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function TemplatesTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Modèles de documents</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez vos modèles PDF et emails
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Modèles PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Bail de location
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Quittance de loyer
              </Button>
              <Button variant="outline" className="w-full justify-start">
                État des lieux
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Modèles emails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Invitation locataire
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Avis d&apos;échéance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Relance paiement
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Automatisations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Envoi quittance auto
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Relance impayés
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Rappels échéances
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
