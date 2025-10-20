import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Plus, Edit, Copy, Trash2 } from "lucide-react"
import { getChannelIcon, getChannelBadge } from "@/lib/communication-utils"
import { extractVariables, type CommunicationTemplate } from "@/hooks/useCommunications"

interface TemplatesTabProps {
  templates: CommunicationTemplate[]
  selectedTemplate: CommunicationTemplate | null
  isTemplateDialogOpen: boolean
  isTemplateEditMode: boolean
  templateName: string
  templateType: "EMAIL" | "SMS"
  templateSubject: string
  templateContent: string
  isSaving: boolean
  onOpenDialog: () => void
  onCloseDialog: () => void
  onTemplateClick: (template: CommunicationTemplate | null) => void
  onUseTemplate: (template: CommunicationTemplate) => void
  onEditTemplate: (template: CommunicationTemplate) => void
  onDuplicateTemplate: (templateId: string) => void
  onDeleteTemplate: (templateId: string) => void
  onSaveTemplate: () => void
  onTemplateNameChange: (name: string) => void
  onTemplateTypeChange: (type: "EMAIL" | "SMS") => void
  onTemplateSubjectChange: (subject: string) => void
  onTemplateContentChange: (content: string) => void
}

export function TemplatesTab({
  templates,
  selectedTemplate,
  isTemplateDialogOpen,
  isTemplateEditMode,
  templateName,
  templateType,
  templateSubject,
  templateContent,
  isSaving,
  onOpenDialog,
  onCloseDialog,
  onTemplateClick,
  onUseTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onTemplateNameChange,
  onTemplateTypeChange,
  onTemplateSubjectChange,
  onTemplateContentChange,
}: TemplatesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Modèles de messages</h3>
          <p className="text-sm text-muted-foreground">
            Créez et gérez vos modèles d'emails et SMS
          </p>
        </div>

        <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => open ? onOpenDialog() : onCloseDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{isTemplateEditMode ? "Modifier le modèle" : "Créer un modèle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom du modèle *</Label>
                <Input
                  placeholder="Ex: Relance loyer impayé"
                  value={templateName}
                  onChange={(e) => onTemplateNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de canal *</Label>
                <Select value={templateType} onValueChange={(value) => onTemplateTypeChange(value as "EMAIL" | "SMS")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {templateType === "EMAIL" && (
                <div className="space-y-2">
                  <Label>Sujet</Label>
                  <Input
                    placeholder="Objet de l'email"
                    value={templateSubject}
                    onChange={(e) => onTemplateSubjectChange(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Contenu *</Label>
                <Textarea
                  placeholder="Contenu du message..."
                  rows={8}
                  value={templateContent}
                  onChange={(e) => onTemplateContentChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez {'{{nomVariable}}'} pour créer des variables dynamiques.
                  Ex: Bonjour {'{{prenom}}'}, votre loyer de {'{{montant}}'} est dû.
                </p>
              </div>

              {(templateContent || templateSubject) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Variables détectées :</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set([
                      ...extractVariables(templateContent),
                      ...(templateSubject ? extractVariables(templateSubject) : [])
                    ])).map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {'{{'}{variable}{'}}'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={onSaveTemplate}
                  disabled={isSaving}
                >
                  {isTemplateEditMode ? "Mettre à jour" : "Créer"}
                </Button>
                <Button variant="outline" onClick={onCloseDialog}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun modèle trouvé</p>
            <p className="text-xs mt-2">Créez votre premier modèle de message</p>
          </div>
        ) : (
          templates.map((template) => {
            const ChannelIcon = getChannelIcon(template.type)
            const channelBadge = getChannelBadge(template.type)

            return (
              <Card
                key={template.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => onTemplateClick(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                      <Badge variant={channelBadge.variant} className="text-xs">
                        {channelBadge.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {template.subject && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Sujet</div>
                        <div className="text-sm truncate">{template.subject}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Contenu</div>
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {template.content}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>
                        {(() => {
                          try {
                            const vars = JSON.parse(template.variables as string || '[]')
                            return Array.isArray(vars) ? vars.length : 0
                          } catch {
                            return 0
                          }
                        })()} variable(s)
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTemplate(template)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicateTemplate(template.id)
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteTemplate(template.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => onTemplateClick(null)}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = getChannelIcon(selectedTemplate.type || 'EMAIL'); return <Icon className="w-5 h-5" /> })()}
                {selectedTemplate.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Canal:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getChannelBadge(selectedTemplate.type || 'EMAIL').label}
                  </Badge>
                </div>
              </div>

              {selectedTemplate.subject && (
                <div>
                  <span className="font-medium text-sm">Sujet:</span>
                  <p className="mt-1 text-sm">{selectedTemplate.subject}</p>
                </div>
              )}

              <div>
                <span className="font-medium text-sm">Contenu:</span>
                <div className="mt-1 p-3 bg-muted/20 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>

              <div>
                <span className="font-medium text-sm">Variables disponibles:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(() => {
                    let vars: string[] = []
                    try {
                      if (typeof selectedTemplate.variables === 'string') {
                        const parsed = JSON.parse(selectedTemplate.variables)
                        if (Array.isArray(parsed)) vars = parsed.filter((v): v is string => typeof v === 'string')
                        else if (parsed && typeof parsed === 'object') vars = Object.keys(parsed)
                      } else if (Array.isArray(selectedTemplate.variables)) {
                        vars = (selectedTemplate.variables as any[]).filter((v): v is string => typeof v === 'string')
                      } else if (selectedTemplate.variables && typeof selectedTemplate.variables === 'object') {
                        vars = Object.keys(selectedTemplate.variables)
                      }
                    } catch {}
                    return vars.length > 0 ? vars.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                    )) : <span className="text-xs text-muted-foreground">Aucune</span>
                  })()}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" onClick={() => onUseTemplate(selectedTemplate)}>
                  Utiliser ce modèle
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  onEditTemplate(selectedTemplate)
                  onTemplateClick(null)
                }}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  onDuplicateTemplate(selectedTemplate.id)
                  onTemplateClick(null)
                }}>
                  Dupliquer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onDeleteTemplate(selectedTemplate.id)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
