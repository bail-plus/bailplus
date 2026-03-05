import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { ReceiptPreview } from "./ReceiptPreview";
import { useReceiptTemplate } from "@/hooks/receipts/useReceiptTemplate";

interface ReceiptTemplateEditorProps {
  onBack: () => void;
}

export function ReceiptTemplateEditor({ onBack }: ReceiptTemplateEditorProps) {
  const {
    template,
    setTemplate,
    loading,
    saving,
    uploading,
    handleFileUpload,
    handleSave,
  } = useReceiptTemplate();

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANNEAU GAUCHE - Options de personnalisation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du propriétaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom du propriétaire</Label>
                <Input
                  value={template.landlord_name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rempli automatiquement depuis votre profil
                </p>
              </div>
              <div>
                <Label>Adresse du propriétaire</Label>
                <Input
                  value={template.landlord_address}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Remplie automatiquement depuis votre profil
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personnalisation visuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Logo</Label>
                  <Switch
                    checked={template.show_logo}
                    onCheckedChange={(checked) => setTemplate({ ...template, show_logo: checked })}
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'logo');
                  }}
                  disabled={uploading === 'logo'}
                />
                {template.logo_url && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Logo uploadé ✓
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Signature</Label>
                  <Switch
                    checked={template.show_signature}
                    onCheckedChange={(checked) => setTemplate({ ...template, show_signature: checked })}
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'signature');
                  }}
                  disabled={uploading === 'signature'}
                />
                {template.signature_url && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Signature uploadée ✓
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Cachet</Label>
                  <Switch
                    checked={template.show_stamp}
                    onCheckedChange={(checked) => setTemplate({ ...template, show_stamp: checked })}
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'stamp');
                  }}
                  disabled={uploading === 'stamp'}
                />
                {template.stamp_url && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cachet uploadé ✓
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Couleurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">Couleur principale</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primary_color"
                      type="color"
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary_color">Couleur secondaire</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={template.secondary_color}
                      onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={template.secondary_color}
                      onChange={(e) => setTemplate({ ...template, secondary_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="accent_color">Couleur d'accent</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="accent_color"
                    type="color"
                    value={template.accent_color}
                    onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={template.accent_color}
                    onChange={(e) => setTemplate({ ...template, accent_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texte personnalisé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Texte par défaut (non modifiable)
                </Label>
                <p className="text-sm font-medium mt-1">
                  Document généré automatiquement par BailoGenius
                </p>
              </div>
              <div>
                <Label htmlFor="footer_text">Texte additionnel (optionnel)</Label>
                <Textarea
                  id="footer_text"
                  value={template.footer_text}
                  onChange={(e) => setTemplate({ ...template, footer_text: e.target.value })}
                  rows={2}
                  placeholder="Ajoutez du texte supplémentaire qui apparaîtra après le texte par défaut..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ce texte apparaîtra en plus du texte par défaut
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PANNEAU DROIT - Prévisualisation */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation</CardTitle>
            </CardHeader>
            <CardContent>
              <ReceiptPreview template={template} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
