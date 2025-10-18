import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Plus, Search, Send, Eye, Clock, CheckCircle, AlertCircle, Trash2, Copy, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useContactsWithLeaseInfo, type ContactWithLeaseInfo } from "@/hooks/useContacts"
import { supabase } from "@/integrations/supabase/client"
import type { Tables } from "@/integrations/supabase/types"
import {
  useCommunicationLogs,
  useCommunicationTemplates,
  useCreateCommunicationLog,
  useCreateCommunicationTemplate,
  useUpdateCommunicationTemplate,
  useDeleteCommunicationTemplate,
  useDuplicateCommunicationTemplate,
  extractVariables,
  type CommunicationLogInsert,
  type CommunicationTemplateInsert,
  type CommunicationTemplate,
} from "@/hooks/useCommunications"

type ProfileSummary = Pick<
  Tables<"profiles">,
  "user_id" | "first_name" | "last_name" | "email" | "phone_number" | "user_type"
>

export default function Communications() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [messageDirection, setMessageDirection] = useState<"sent" | "received">("sent")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
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
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Get current user ID
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    })()
  }, [])

  // Fetch data
  const { data: messages = [], isLoading: messagesLoading } = useCommunicationLogs()
  const { data: templates = [], isLoading: templatesLoading } = useCommunicationTemplates()
  const { data: contacts = [] } = useContactsWithLeaseInfo()
  const contactsById = useMemo(() => {
    const map = new Map<string, ContactWithLeaseInfo>()
    contacts.forEach(contact => {
      map.set(contact.id, contact)
    })
    return map
  }, [contacts])
  const contactsByUserId = useMemo(() => {
    const map = new Map<string, ContactWithLeaseInfo>()
    contacts.forEach(contact => {
      if (contact.user_id) {
        map.set(contact.user_id, contact)
      }
    })
    return map
  }, [contacts])

  const { data: availableRecipientProfiles = [], isLoading: availableProfilesLoading } = useQuery<ProfileSummary[]>({
    queryKey: ["available-recipient-profiles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Non authentifié")

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone_number, user_type")
        .or(`linked_to_landlord.eq.${auth.user.id},user_id.eq.${auth.user.id}`)
        .order("first_name", { ascending: true, nullsFirst: false })
        .order("last_name", { ascending: true, nullsFirst: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as ProfileSummary[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const profileUserIds = useMemo(() => {
    const ids = new Set<string>()
    messages.forEach(message => {
      if (message.recipient_id) {
        ids.add(message.recipient_id)
      }
    })
    contacts.forEach(contact => {
      if (contact.user_id) {
        ids.add(contact.user_id)
      }
    })
    return Array.from(ids).sort()
  }, [messages, contacts])

  const { data: recipientProfiles = [] } = useQuery<ProfileSummary[]>({
    queryKey: ["recipient-profiles", profileUserIds],
    enabled: profileUserIds.length > 0,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Non authentifié")

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone_number, user_type")
        .in("user_id", profileUserIds)

      if (error) throw new Error(error.message)
      return (data ?? []) as ProfileSummary[]
    },
  })

  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileSummary>()
    availableRecipientProfiles.forEach(profile => {
      map.set(profile.user_id, profile)
    })
    recipientProfiles.forEach(profile => {
      map.set(profile.user_id, profile)
    })
    return map
  }, [availableRecipientProfiles, recipientProfiles])

  const mapRecipientTypeForLog = (
    profileType?: ProfileSummary["user_type"] | null,
    contactRole?: ContactWithLeaseInfo["role"] | string | null
  ): "tenant" | "contractor" | "other" => {
    const normalizedRole = (contactRole || "").toString().toLowerCase()
    if (normalizedRole === "tenant" || normalizedRole === "both") return "tenant"
    if (normalizedRole === "guarantor") return "tenant"
    if (normalizedRole === "contractor" || normalizedRole === "service_provider") return "contractor"

    switch (profileType) {
      case "TENANT":
        return "tenant"
      case "SERVICE_PROVIDER":
        return "contractor"
      default:
        return "other"
    }
  }

  const handleRecipientModeChange = (value: "PROFILE" | "EMAIL") => {
    setRecipientMode(value)
    if (value === "PROFILE") {
      setManualRecipientEmail("")
    } else {
      setSelectedRecipientProfileId("")
      setMessageChannel("EMAIL")
    }
  }

  // Mutations
  const createMessage = useCreateCommunicationLog()
  const createTemplate = useCreateCommunicationTemplate()
  const updateTemplate = useUpdateCommunicationTemplate()
  const deleteTemplate = useDeleteCommunicationTemplate()
  const duplicateTemplate = useDuplicateCommunicationTemplate()

  // Reset message form
  const resetMessageForm = () => {
    setMessageChannel("EMAIL")
    setRecipientMode("PROFILE")
    setSelectedRecipientProfileId("")
    setManualRecipientEmail("")
    setMessageTemplateId("none")
    setMessageSubject("")
    setMessageContent("")
  }

  // Reset template form
  const resetTemplateForm = () => {
    setTemplateName("")
    setTemplateType("EMAIL")
    setTemplateSubject("")
    setTemplateContent("")
    setIsTemplateEditMode(false)
    setEditingTemplateId(null)
  }

  // Handle template selection in message form
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

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageContent) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      let logData: CommunicationLogInsert | null = null

      if (recipientMode === "PROFILE") {
        if (!selectedRecipientProfileId) {
          toast({
            title: "Erreur",
            description: "Veuillez sélectionner un destinataire",
            variant: "destructive",
          })
          return
        }

        const profile = profilesById.get(selectedRecipientProfileId)
        if (!profile) {
          toast({
            title: "Erreur",
            description: "Profil introuvable",
            variant: "destructive",
          })
          return
        }

        const relatedContact = contactsByUserId.get(profile.user_id)

        const recipientType = mapRecipientTypeForLog(profile.user_type, relatedContact?.role)
        const recipientEmail =
          messageChannel === "EMAIL"
            ? profile.email || relatedContact?.email || null
            : null
        const recipientPhone =
          messageChannel === "SMS"
            ? profile.phone_number || relatedContact?.phone || null
            : null

        if (messageChannel === "EMAIL" && !recipientEmail) {
          toast({
            title: "Erreur",
            description: "Ce profil n'a pas d'adresse email",
            variant: "destructive",
          })
          return
        }

        if (messageChannel === "SMS" && !recipientPhone) {
          toast({
            title: "Erreur",
            description: "Ce profil n'a pas de numéro de téléphone",
            variant: "destructive",
          })
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
        if (messageChannel !== "EMAIL") {
          toast({
            title: "Erreur",
            description: "L'envoi à une adresse email nécessite le canal Email",
            variant: "destructive",
          })
          return
        }

        const email = manualRecipientEmail.trim()
        if (!email) {
          toast({
            title: "Erreur",
            description: "Veuillez renseigner une adresse email",
            variant: "destructive",
          })
          return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          toast({
            title: "Erreur",
            description: "Adresse email invalide",
            variant: "destructive",
          })
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

      toast({
        title: "Succès",
        description: "Message envoyé avec succès",
      })

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

  // Handle create/update template
  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le nom et le contenu du modèle",
        variant: "destructive",
      })
      return
    }

    try {
      const variables = extractVariables(templateContent)
      if (templateSubject) {
        variables.push(...extractVariables(templateSubject))
      }

      const templateData: Partial<CommunicationTemplateInsert> = {
        name: templateName,
        type: templateType,
        subject: templateType === "EMAIL" ? templateSubject : null,
        content: templateContent,
        variables: JSON.stringify(Array.from(new Set(variables))),
      }

      if (isTemplateEditMode && editingTemplateId) {
        await updateTemplate.mutateAsync({
          id: editingTemplateId,
          ...templateData,
        })
        toast({
          title: "Succès",
          description: "Modèle mis à jour avec succès",
        })
      } else {
        await createTemplate.mutateAsync(templateData as CommunicationTemplateInsert)
        toast({
          title: "Succès",
          description: "Modèle créé avec succès",
        })
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

  // Handle edit template
  const handleEditTemplate = (template: CommunicationTemplate) => {
    setIsTemplateEditMode(true)
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateType(template.type as "EMAIL" | "SMS")
    setTemplateSubject(template.subject || "")
    setTemplateContent(template.content)
    setIsTemplateDialogOpen(true)
  }

  // Handle duplicate template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplate.mutateAsync(templateId)
      toast({
        title: "Succès",
        description: "Modèle dupliqué avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de dupliquer le modèle",
        variant: "destructive",
      })
    }
  }

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return

    try {
      await deleteTemplate.mutateAsync(templateId)
      toast({
        title: "Succès",
        description: "Modèle supprimé avec succès",
      })
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le modèle",
        variant: "destructive",
      })
    }
  }

  // Handle use template
  const handleUseTemplate = (template: CommunicationTemplate) => {
    setMessageTemplateId(template.id)
    setMessageChannel(template.type as "EMAIL" | "SMS")
    setMessageSubject(template.subject || "")
    setMessageContent(template.content)
    setIsMessageDialogOpen(true)
    setSelectedTemplate(null)
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      (message.recipient_email && message.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase()))

    const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
    const matchesChannel = channelFilter === "all" || messageChannel === channelFilter
    const matchesStatus = statusFilter === "all" || message.status === statusFilter

    // Filter by direction (sent/received)
    const matchesDirection =
      (messageDirection === "sent" && message.sender_id === currentUserId) ||
      (messageDirection === "received" && message.recipient_id === currentUserId)

    return matchesSearch && matchesChannel && matchesStatus && matchesDirection
  })

  const getChannelIcon = (channel: string) => {
    return channel === "EMAIL" ? Mail : MessageSquare
  }

  const getChannelBadge = (channel: string) => {
    const channels = {
      EMAIL: { label: "Email", variant: "default" as const },
      SMS: { label: "SMS", variant: "secondary" as const }
    }
    return channels[channel as keyof typeof channels] || { label: channel, variant: "secondary" as const }
  }

  const getStatusBadge = (status: string) => {
    const key = (status || '').toString().toUpperCase()
    const statuses = {
      PENDING: { label: "En attente", variant: "secondary" as const, icon: Clock },
      DELIVERED: { label: "Livré", variant: "default" as const, icon: CheckCircle },
      SENT: { label: "Livré", variant: "default" as const, icon: CheckCircle },
      FAILED: { label: "Échec", variant: "destructive" as const, icon: AlertCircle }
    }
    return (statuses as any)[key] || { label: status, variant: "secondary" as const, icon: Clock }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRecipientTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'tenant': 'Locataire',
      'guarantor': 'Garant',
      'both': 'Locataire/Garant',
      'TENANT': 'Locataire',
      'GUARANTOR': 'Garant',
      'LANDLORD': 'Propriétaire',
      'SERVICE_PROVIDER': 'Prestataire',
      'service_provider': 'Prestataire',
      'contractor': 'Prestataire',
      'CONTRACTOR': 'Prestataire',
      'other': 'Autre',
      'OTHER': 'Autre',
    }
    return types[type] || type
  }

  // Calculate stats
  const totalMessages = messages.length
  const deliveredMessages = messages.filter(m => (m.status || '').toLowerCase() === "sent").length
  const pendingMessages = messages.filter(m => (m.status || '').toLowerCase() === "pending").length
  const emailMessages = messages.filter(m => m.recipient_email).length

  if (messagesLoading || templatesLoading) {
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
          <p className="text-muted-foreground mt-1">
            Envois d'emails et SMS, modèles et relances
          </p>
        </div>

        <Dialog open={isMessageDialogOpen} onOpenChange={(open) => {
          setIsMessageDialogOpen(open)
          if (!open) resetMessageForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau message
            </Button>
          </DialogTrigger>
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
                    onValueChange={(value) => setMessageChannel(value as "EMAIL" | "SMS")}
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
                    onValueChange={(value) => handleRecipientModeChange(value as "PROFILE" | "EMAIL")}
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
                      onValueChange={setSelectedRecipientProfileId}
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
                      onChange={(e) => setManualRecipientEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      L'adresse sera utilisée uniquement pour ce message.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Modèle (optionnel)</Label>
                <Select value={messageTemplateId} onValueChange={setMessageTemplateId}>
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
                    onChange={(e) => setMessageSubject(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Votre message..."
                  rows={6}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
                {messageTemplateId !== "none" && (
                  <p className="text-xs text-muted-foreground">
                    Astuce : Utilisez {'{{variableName}}'} pour insérer des variables dynamiques
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="gap-2" onClick={handleSendMessage} disabled={createMessage.isPending}>
                  <Send className="w-4 h-4" />
                  {createMessage.isPending ? "Envoi..." : "Envoyer"}
                </Button>
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total envoyé</span>
            </div>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Livrés</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{deliveredMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(0) : 0}% de succès
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{pendingMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Emails</span>
            </div>
            <div className="text-2xl font-bold">{emailMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {totalMessages - emailMessages} SMS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Journal des envois</TabsTrigger>
          <TabsTrigger value="templates">Modèles ({templates.length})</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Direction Tabs */}
          <Tabs value={messageDirection} onValueChange={(value) => setMessageDirection(value as "sent" | "received")}>
            <TabsList>
              <TabsTrigger value="sent">Envoyés</TabsTrigger>
              <TabsTrigger value="received">Reçus</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher un message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="DELIVERED">Livrés</SelectItem>
                    <SelectItem value="SENT">Livrés</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="FAILED">Échecs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {messageDirection === "sent" ? "Messages envoyés" : "Messages reçus"}
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{messageDirection === "sent" ? "Destinataire" : "Expéditeur"}</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Sujet/Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>{messageDirection === "sent" ? "Envoyé le" : "Reçu le"}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Aucun message trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMessages.map((message) => {
                      const contact = message.recipient_id
                        ? contactsById.get(message.recipient_id) || contactsByUserId.get(message.recipient_id)
                        : undefined
                      const profile =
                        (message.recipient_id ? profilesById.get(message.recipient_id) : undefined) ||
                        (contact?.user_id ? profilesById.get(contact.user_id) : undefined)

                      const profileName = profile
                        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
                        : ""
                      const contactName = contact
                        ? [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim()
                        : ""
                      const contactDetailCandidates = [
                        message.recipient_email,
                        message.recipient_phone,
                        profile?.email,
                        profile?.phone_number,
                        contact?.email,
                        contact?.phone,
                      ].filter((value): value is string => Boolean(value))
                      const uniqueDetails = Array.from(new Set(contactDetailCandidates))
                      const primaryRole = profile?.user_type || contact?.role || message.recipient_type || ""
                      const recipientLabel = primaryRole ? getRecipientTypeLabel(primaryRole) : ""
                      const displayName =
                        profileName ||
                        contactName ||
                        uniqueDetails[0] ||
                        recipientLabel ||
                        "—"
                      const detailValue = uniqueDetails.find(value => value !== displayName) || ""
                      const infoParts = [
                        recipientLabel && recipientLabel !== displayName ? recipientLabel : "",
                        detailValue,
                      ].filter(Boolean)
                      const secondaryInfo = infoParts.length > 0 ? Array.from(new Set(infoParts)).join(" • ") : ""
                      const selectedToValue = uniqueDetails[0] || "—"

                      const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
                      const ChannelIcon = getChannelIcon(messageChannel)
                      const channelBadge = getChannelBadge(messageChannel)
                      const statusBadge = getStatusBadge(message.status || "pending")

                      return (
                        <TableRow
                          key={message.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{displayName}</div>
                              {secondaryInfo && (
                                <div className="text-xs text-muted-foreground">
                                  {secondaryInfo}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={channelBadge.variant} className="text-xs">
                                {channelBadge.label}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-xs">
                              {message.subject ? (
                                <div className="font-medium text-sm truncate">{message.subject}</div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {message.template_id ? "Auto" : "Manuel"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <statusBadge.icon className="w-4 h-4" />
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.label}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {message.sent_at ? formatDate(message.sent_at) : 'N/A'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => {
                                const channel = message.recipient_email ? 'EMAIL' : 'SMS'
                                setSelectedMessage({
                                  id: message.id,
                                  channel,
                                  toName: displayName,
                                  to: selectedToValue,
                                  sentAt: message.sent_at,
                                  subject: message.subject,
                                  body: message.content || '',
                                  status: (message.status || '').toString(),
                                })
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </div>
          </Tabs>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Modèles de messages</h3>
              <p className="text-sm text-muted-foreground">
                Créez et gérez vos modèles d'emails et SMS
              </p>
            </div>

            <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
              setIsTemplateDialogOpen(open)
              if (!open) resetTemplateForm()
            }}>
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
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type de canal *</Label>
                    <Select value={templateType} onValueChange={(value) => setTemplateType(value as "EMAIL" | "SMS")}>
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
                        onChange={(e) => setTemplateSubject(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Contenu *</Label>
                    <Textarea
                      placeholder="Contenu du message..."
                      rows={8}
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
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
                      onClick={handleSaveTemplate}
                      disabled={createTemplate.isPending || updateTemplate.isPending}
                    >
                      {isTemplateEditMode ? "Mettre à jour" : "Créer"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
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
                  onClick={() => setSelectedTemplate(template)}
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
                                handleEditTemplate(template)
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
                                handleDuplicateTemplate(template.id)
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
                                handleDeleteTemplate(template.id)
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
        </TabsContent>
      </Tabs>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = getChannelIcon(selectedMessage.channel); return <Icon className="w-5 h-5" /> })()}
                Message à {selectedMessage.toName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Canal:</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {getChannelBadge(selectedMessage.channel).label}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                    {getStatusBadge(selectedMessage.status).label}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Destinataire:</span> {selectedMessage.to || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Envoyé le:</span> {selectedMessage.sentAt ? formatDate(selectedMessage.sentAt) : 'N/A'}
                  </div>
                </div>

              {selectedMessage.subject && (
                <div>
                  <span className="font-medium text-sm">Sujet:</span>
                  <p className="mt-1 text-sm">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <span className="font-medium text-sm">Message:</span>
                {selectedMessage.body ? (
                  <div className="mt-2 border rounded-md p-3 bg-white max-h-[60vh] overflow-auto text-sm prose prose-sm prose-slate">
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.body }} />
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">Aucun contenu</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
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
                <Button size="sm" onClick={() => handleUseTemplate(selectedTemplate)}>
                  Utiliser ce modèle
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  handleEditTemplate(selectedTemplate)
                  setSelectedTemplate(null)
                }}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  handleDuplicateTemplate(selectedTemplate.id)
                  setSelectedTemplate(null)
                }}>
                  Dupliquer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDeleteTemplate(selectedTemplate.id)}
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
