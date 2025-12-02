import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ReceiptTemplateEditor } from "./ReceiptTemplateEditor";

export function TemplatesTab() {
  const [editingReceipt, setEditingReceipt] = useState(false);

  if (editingReceipt) {
    return (
      <ReceiptTemplateEditor onBack={() => setEditingReceipt(false)} />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Modèles de documents PDF</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez vos modèles de documents PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quittance de loyer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Personnalisez l'apparence de vos quittances de loyer
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEditingReceipt(true)}
            >
              Modifier le modèle
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bail de location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bientôt disponible
            </p>
            <Button variant="outline" className="w-full" disabled>
              Modifier le modèle
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              État des lieux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bientôt disponible
            </p>
            <Button variant="outline" className="w-full" disabled>
              Modifier le modèle
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
