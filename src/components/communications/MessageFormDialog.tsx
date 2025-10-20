import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send } from "lucide-react"
import { getRecipientTypeLabel } from "@/lib/communication-utils"
import type { CommunicationTemplate } from "@/hooks/communications/useCommunications"
import type { Tables } from "@/integrations/supabase/types"

type ProfileSummary = Pick<
  Tables<"profiles">,
  "user_id" | "first_name" | "last_name" | "email" | "phone_number" | "user_type"
>

interface MessageFormDialogProps {
  open: boolean
  messageChannel: "EMAIL" | "SMS"
  recipientMode: "PROFILE" | "EMAIL"
  selectedRecipientProfileId: string
  manualRecipientEmail: string
  messageTemplateId: string
  messageSubject: string
  messageContent: string
  templates: CommunicationTemplate[]
  availableRecipientProfiles: ProfileSummary[]
  availableProfilesLoading: boolean
  isSending: boolean
  onOpenChange: (open: boolean) => void
  onChannelChange: (channel: "EMAIL" | "SMS") => void
  onRecipientModeChange: (mode: "PROFILE" | "EMAIL") => void
  onRecipientProfileChange: (profileId: string) => void
  onManualEmailChange: (email: string) => void
  onTemplateChange: (templateId: string) => void
  onSubjectChange: (subject: string) => void
  onContentChange: (content: string) => void
  onSend: () => void
}

export function MessageFormDialog({
  open,
  messageChannel,
  recipientMode,
  selectedRecipientProfileId,
  manualRecipientEmail,
  messageTemplateId,
  messageSubject,
  messageContent,
  templates,
  availableRecipientProfiles,
  availableProfilesLoading,
  isSending,
  onOpenChange,
  onChannelChange,
  onRecipientModeChange,
  onRecipientProfileChange,
  onManualEmailChange,
  onTemplateChange,
  onSubjectChange,
  onContentChange,
  onSend,
}: MessageFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select
                value={messageChannel}
                onValueChange={(value) => onChannelChange(value as "EMAIL" | "SMS")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS" disabled={recipientMode === "EMAIL"}>
                    SMS
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type de destinataire</Label>
              <Select
                value={recipientMode}
                onValueChange={(value) => onRecipientModeChange(value as "PROFILE" | "EMAIL")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFILE">Profil utilisateur</SelectItem>
                  <SelectItem value="EMAIL">Adresse email externe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Destinataire</Label>
            {recipientMode === "PROFILE" ? (
              <>
                <Select
                  value={selectedRecipientProfileId}
                  onValueChange={onRecipientProfileChange}
                  disabled={availableProfilesLoading || availableRecipientProfiles.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableProfilesLoading
                          ? "Chargement des profils..."
                          : availableRecipientProfiles.length > 0
                            ? "Choisir un profil"
                            : "Aucun profil disponible"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecipientProfiles.map(profile => {
                      const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
                      const subtitleParts: string[] = []
                      if (profile.email) subtitleParts.push(profile.email)
                      if (profile.user_type) subtitleParts.push(getRecipientTypeLabel(profile.user_type))

                      return (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          <div className="flex flex-col">
                            <span>{name || profile.email || profile.user_id}</span>
                            {subtitleParts.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {Array.from(new Set(subtitleParts)).join(" • ")}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {availableProfilesLoading && (
                  <p className="text-xs text-muted-foreground">Chargement des profils...</p>
                )}
                {!availableProfilesLoading && availableRecipientProfiles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Invitez un locataire ou un prestataire pour l'ajouter ici.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="adresse@example.com"
                  value={manualRecipientEmail}
                  onChange={(e) => onManualEmailChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  L'adresse sera utilisée uniquement pour ce message.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Modèle (optionnel)</Label>
            <Select value={messageTemplateId} onValueChange={onTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun modèle</SelectItem>
                {templates.filter(t => t.type === messageChannel).map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {messageChannel === "EMAIL" && (
            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                placeholder="Objet du message"
                value={messageSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Votre message..."
              rows={6}
              value={messageContent}
              onChange={(e) => onContentChange(e.target.value)}
            />
            {messageTemplateId !== "none" && (
              <p className="text-xs text-muted-foreground">
                Astuce : Utilisez {'{{variableName}}'} pour insérer des variables dynamiques
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button className="gap-2" onClick={onSend} disabled={isSending}>
              <Send className="w-4 h-4" />
              {isSending ? "Envoi..." : "Envoyer"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
