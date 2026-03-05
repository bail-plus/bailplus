import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/ui/use-toast"
import {
  useCreateCommunicationLog,
  useCreateCommunicationTemplate,
  useUpdateCommunicationTemplate,
  useDeleteCommunicationTemplate,
  useDuplicateCommunicationTemplate,
  extractVariables,
  type CommunicationLogInsert,
  type CommunicationTemplateInsert,
  type CommunicationTemplate,
} from "@/hooks/communications/useCommunications"
import { useCommunicationData } from "@/hooks/communications/useCommunicationData"
import { CommunicationsStats } from "@/components/communications/CommunicationsStats"
import { calculateCommunicationStats, mapRecipientTypeForLog } from "@/lib/communication-utils"
import { MessageFormDialog } from "@/components/communications/MessageFormDialog"
import { MessagesTab } from "@/components/communications/MessagesTab"
import { TemplatesTab } from "@/components/communications/TemplatesTab"

export default function Communications() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [messageDirection, setMessageDirection] = useState<"sent" | "received">("sent")
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)

  // Message form state
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [messageChannel, setMessageChannel] = useState<"EMAIL" | "SMS">("EMAIL")
  const [recipientMode, setRecipientMode] = useState<"PROFILE" | "EMAIL">("PROFILE")
  const [selectedRecipientProfileId, setSelectedRecipientProfileId] = useState("")
  const [manualRecipientEmail, setManualRecipientEmail] = useState("")
  const [messageTemplateId, setMessageTemplateId] = useState<string>("none")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageContent, setMessageContent] = useState("")

  // Template form state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateType, setTemplateType] = useState<"EMAIL" | "SMS">("EMAIL")
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateContent, setTemplateContent] = useState("")

  // Load data
  const communicationData = useCommunicationData()
  const {
    messages,
    templates,
    currentUserId,
    contactsById,
    contactsByUserId,
    availableRecipientProfiles,
    availableProfilesLoading,
    profilesById,
    isLoading,
  } = communicationData

  // Mutations
  const createMessage = useCreateCommunicationLog()
  const createTemplate = useCreateCommunicationTemplate()
  const updateTemplate = useUpdateCommunicationTemplate()
  const deleteTemplate = useDeleteCommunicationTemplate()
  const duplicateTemplate = useDuplicateCommunicationTemplate()

  // Reset forms
  const resetMessageForm = () => {
    setMessageChannel("EMAIL")
    setRecipientMode("PROFILE")
    setSelectedRecipientProfileId("")
    setManualRecipientEmail("")
    setMessageTemplateId("none")
    setMessageSubject("")
    setMessageContent("")
  }

  const resetTemplateForm = () => {
    setTemplateName("")
    setTemplateType("EMAIL")
    setTemplateSubject("")
    setTemplateContent("")
    setIsTemplateEditMode(false)
    setEditingTemplateId(null)
  }

  // Handle template selection
  useEffect(() => {
    if (messageTemplateId && messageTemplateId !== "none") {
      const template = templates.find(t => t.id === messageTemplateId)
      if (template) {
        setMessageSubject(template.subject || "")
        setMessageContent(template.content || "")
        setMessageChannel(template.type as "EMAIL" | "SMS")
      }
    }
  }, [messageTemplateId, templates])

  // Handle recipient mode change
  const handleRecipientModeChange = (value: "PROFILE" | "EMAIL") => {
    setRecipientMode(value)
    if (value === "PROFILE") {
      setManualRecipientEmail("")
    } else {
      setSelectedRecipientProfileId("")
      setMessageChannel("EMAIL")
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageContent) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs requis", variant: "destructive" })
      return
    }

    try {
      let logData: CommunicationLogInsert | null = null

      if (recipientMode === "PROFILE") {
        if (!selectedRecipientProfileId) {
          toast({ title: "Erreur", description: "Veuillez sélectionner un destinataire", variant: "destructive" })
          return
        }

        const profile = profilesById.get(selectedRecipientProfileId)
        if (!profile) {
          toast({ title: "Erreur", description: "Profil introuvable", variant: "destructive" })
          return
        }

        const relatedContact = contactsByUserId.get(profile.user_id)
        const recipientType = mapRecipientTypeForLog(profile.user_type, relatedContact?.role)
        const recipientEmail = messageChannel === "EMAIL" ? profile.email || relatedContact?.email || null : null
        const recipientPhone = messageChannel === "SMS" ? profile.phone_number || relatedContact?.phone || null : null

        if (messageChannel === "EMAIL" && !recipientEmail) {
          toast({ title: "Erreur", description: "Ce profil n'a pas d'adresse email", variant: "destructive" })
          return
        }

        if (messageChannel === "SMS" && !recipientPhone) {
          toast({ title: "Erreur", description: "Ce profil n'a pas de numéro de téléphone", variant: "destructive" })
          return
        }

        logData = {
          recipient_type: recipientType,
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone,
          recipient_id: profile.user_id,
          subject: messageChannel === "EMAIL" ? messageSubject : null,
          content: messageContent,
          template_id: messageTemplateId !== "none" ? messageTemplateId : null,
          status: "SENT",
          sent_at: new Date().toISOString(),
        }
      } else {
        const email = manualRecipientEmail.trim()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast({ title: "Erreur", description: "Adresse email invalide", variant: "destructive" })
          return
        }

        logData = {
          recipient_type: "other",
          recipient_email: email,
          recipient_phone: null,
          recipient_id: null,
          subject: messageSubject,
          content: messageContent,
          template_id: messageTemplateId !== "none" ? messageTemplateId : null,
          status: "SENT",
          sent_at: new Date().toISOString(),
        }
      }

      await createMessage.mutateAsync(logData)
      toast({ title: "Succès", description: "Message envoyé avec succès" })
      setIsMessageDialogOpen(false)
      resetMessageForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer le message",
        variant: "destructive",
      })
    }
  }

  // Handle template operations
  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) {
      toast({ title: "Erreur", description: "Veuillez remplir le nom et le contenu du modèle", variant: "destructive" })
      return
    }

    try {
      const variables = extractVariables(templateContent)
      if (templateSubject) variables.push(...extractVariables(templateSubject))

      const templateData: Partial<CommunicationTemplateInsert> = {
        name: templateName,
        type: templateType,
        subject: templateType === "EMAIL" ? templateSubject : null,
        content: templateContent,
        variables: JSON.stringify(Array.from(new Set(variables))),
      }

      if (isTemplateEditMode && editingTemplateId) {
        await updateTemplate.mutateAsync({ id: editingTemplateId, ...templateData })
        toast({ title: "Succès", description: "Modèle mis à jour avec succès" })
      } else {
        await createTemplate.mutateAsync(templateData as CommunicationTemplateInsert)
        toast({ title: "Succès", description: "Modèle créé avec succès" })
      }

      setIsTemplateDialogOpen(false)
      resetTemplateForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder le modèle",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (template: CommunicationTemplate) => {
    setIsTemplateEditMode(true)
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateType(template.type as "EMAIL" | "SMS")
    setTemplateSubject(template.subject || "")
    setTemplateContent(template.content)
    setIsTemplateDialogOpen(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return

    try {
      await deleteTemplate.mutateAsync(templateId)
      toast({ title: "Succès", description: "Modèle supprimé avec succès" })
      if (selectedTemplate?.id === templateId) setSelectedTemplate(null)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le modèle",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplate.mutateAsync(templateId)
      toast({ title: "Succès", description: "Modèle dupliqué avec succès" })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de dupliquer le modèle",
        variant: "destructive",
      })
    }
  }

  const handleUseTemplate = (template: CommunicationTemplate) => {
    setMessageTemplateId(template.id)
    setMessageChannel(template.type as "EMAIL" | "SMS")
    setMessageSubject(template.subject || "")
    setMessageContent(template.content)
    setIsMessageDialogOpen(true)
    setSelectedTemplate(null)
  }

  // Filter messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      (message.recipient_email && message.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()))

    const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
    const matchesChannel = channelFilter === "all" || messageChannel === channelFilter
    const matchesStatus = statusFilter === "all" || message.status === statusFilter
    const matchesDirection =
      (messageDirection === "sent" && message.sender_id === currentUserId) ||
      (messageDirection === "received" && message.recipient_id === currentUserId)

    return matchesSearch && matchesChannel && matchesStatus && matchesDirection
  })

  // Calculate stats
  const stats = calculateCommunicationStats(messages)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des communications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground mt-1">Envois d'emails et SMS, modèles et relances</p>
        </div>

        <Button className="gap-2" onClick={() => setIsMessageDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nouveau message
        </Button>
      </div>

      {/* Stats */}
      <CommunicationsStats {...stats} />

      {/* Tabs */}
      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Journal des envois</TabsTrigger>
          <TabsTrigger value="templates">Modèles ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <MessagesTab
            messages={filteredMessages}
            messageDirection={messageDirection}
            searchTerm={searchTerm}
            channelFilter={channelFilter}
            statusFilter={statusFilter}
            currentUserId={currentUserId}
            contactsById={contactsById}
            contactsByUserId={contactsByUserId}
            profilesById={profilesById}
            onDirectionChange={setMessageDirection}
            onSearchChange={setSearchTerm}
            onChannelFilterChange={setChannelFilter}
            onStatusFilterChange={setStatusFilter}
            onMessageClick={() => {}}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            isTemplateDialogOpen={isTemplateDialogOpen}
            isTemplateEditMode={isTemplateEditMode}
            templateName={templateName}
            templateType={templateType}
            templateSubject={templateSubject}
            templateContent={templateContent}
            onOpenDialog={() => setIsTemplateDialogOpen(true)}
            onCloseDialog={() => {
              setIsTemplateDialogOpen(false)
              resetTemplateForm()
            }}
            onTemplateClick={setSelectedTemplate}
            onUseTemplate={handleUseTemplate}
            onEditTemplate={handleEditTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onSaveTemplate={handleSaveTemplate}
            onTemplateNameChange={setTemplateName}
            onTemplateTypeChange={setTemplateType}
            onTemplateSubjectChange={setTemplateSubject}
            onTemplateContentChange={setTemplateContent}
            isSaving={createTemplate.isPending || updateTemplate.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Message Form Dialog */}
      <MessageFormDialog
        open={isMessageDialogOpen}
        messageChannel={messageChannel}
        recipientMode={recipientMode}
        selectedRecipientProfileId={selectedRecipientProfileId}
        manualRecipientEmail={manualRecipientEmail}
        messageTemplateId={messageTemplateId}
        messageSubject={messageSubject}
        messageContent={messageContent}
        templates={templates}
        availableRecipientProfiles={availableRecipientProfiles}
        availableProfilesLoading={availableProfilesLoading}
        isSending={createMessage.isPending}
        onOpenChange={(open) => {
          setIsMessageDialogOpen(open)
          if (!open) resetMessageForm()
        }}
        onChannelChange={setMessageChannel}
        onRecipientModeChange={handleRecipientModeChange}
        onRecipientProfileChange={setSelectedRecipientProfileId}
        onManualEmailChange={setManualRecipientEmail}
        onTemplateChange={setMessageTemplateId}
        onSubjectChange={setMessageSubject}
        onContentChange={setMessageContent}
        onSend={handleSendMessage}
      />
    </div>
  )
}
