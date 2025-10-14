import { useEffect, useState } from "react"
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
import { AlertTriangle, Clock, CheckCircle, Wrench, Plus, Search, Edit, Trash2, DollarSign, User, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useMaintenanceTicketsWithDetails,
  useCreateMaintenanceTicket,
  useUpdateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useDeleteWorkOrder,
  type MaintenanceTicketWithDetails,
  type MaintenanceTicketInsert,
  type WorkOrderInsert,
  type WorkOrder
} from "@/hooks/useMaintenance"
import { usePropertiesWithUnits } from "@/hooks/useProperties"
import { useContactsWithLeaseInfo } from "@/hooks/useContacts"
import { FileUpload } from "@/components/FileUpload"
import { useFileUpload } from "@/hooks/useFileUpload"
import { addServiceProviderToTicket } from "@/hooks/useTicketParticipants"
import { useServiceProviderUsers } from "@/hooks/useUsers"
import { notifyProviderAssignment } from "@/hooks/useNotifications"
import { useAuth } from "@/hooks/useAuth"
import { RatingDialog } from "@/components/provider/RatingDialog"
import { useCheckUserRating } from "@/hooks/useProviderRatings"
import { useTicketMessages, useSendTicketMessage } from "@/hooks/useTicketChat"
import { useTicketUnread, useMarkTicketRead, useMarkTicketNotificationsRead } from "@/hooks/useTicketUnread"
import { useSearchParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

const KANBAN_COLUMNS = [
  { id: "NOUVEAU", title: "Nouveau", color: "bg-red-50", icon: AlertTriangle },
  { id: "EN COURS", title: "En cours", color: "bg-yellow-50", icon: Clock },
  { id: "EN ATTENTE DE PIECE", title: "Attente pièces", color: "bg-blue-50", icon: Clock },
  { id: "TERMINE", title: "Terminé", color: "bg-green-50", icon: CheckCircle }
]

const WORK_ORDER_STATUSES = [
  { value: "EN ATTENTE", label: "En attente" },
  { value: "PLANIFIE", label: "Planifié" },
  { value: "EN COURS", label: "En cours" },
  { value: "TERMINE", label: "Terminé" },
  { value: "ANNULE", label: "Annulé" }
]

// Component to handle provider rating section
function ProviderRatingSection({
  selectedTicket,
  serviceProviders,
  onRateProvider
}: {
  selectedTicket: MaintenanceTicketWithDetails
  serviceProviders: any[]
  onRateProvider: (providerId: string, providerName: string) => void
}) {
  // Trouver le service_provider correspondant au user_id assigné
  const provider = serviceProviders.find(p => p.user_id === selectedTicket.assigned_to)

  // Vérifier si l'utilisateur a déjà noté ce prestataire pour ce ticket
  const { data: existingRating } = useCheckUserRating(
    provider?.user_id || provider?.id || '',
    selectedTicket.id
  )

  if (!selectedTicket.assigned_contact) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p>Aucun prestataire assigné</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {selectedTicket.assigned_contact.first_name} {selectedTicket.assigned_contact.last_name}
                </p>
                {selectedTicket.assigned_contact.phone && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.assigned_contact.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Assigné</Badge>

              {/* Bouton noter si ticket terminé ET pas encore noté */}
              {selectedTicket.status === "TERMINE" && provider && (
                existingRating ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{existingRating.rating}/5</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Vous avez déjà noté ce prestataire pour ce ticket
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRateProvider(
                        provider.user_id || provider.id,
                        `${selectedTicket.assigned_contact?.first_name} ${selectedTicket.assigned_contact?.last_name}`
                      )
                    }}
                    className="gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Noter
                  </Button>
                )
              )}

              {/* Message si ticket pas encore terminé */}
              {selectedTicket.status !== "TERMINE" && (
                <p className="text-xs text-muted-foreground">
                  Disponible une fois terminé
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TicketMessagesPanel({ ticket }: { ticket: MaintenanceTicketWithDetails }) {
  const { data: msgs = [] } = useTicketMessages(ticket.id)
  const send = useSendTicketMessage(ticket.id, ticket.title)
  const mark = useMarkTicketRead()
  const markNotif = useMarkTicketNotificationsRead()
  useEffect(() => {
    if (ticket.id) {
      mark.mutate(ticket.id)
      markNotif.mutate(ticket.id)
    }
  }, [ticket.id])
  return (
    <div className="space-y-3">
      <div className="border rounded-md max-h-64 overflow-auto p-2 bg-muted/20">
        {msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3">Aucun message. Commencez la discussion.</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="p-2 border-b last:border-0">
              <div className="text-xs text-muted-foreground">{new Date(m.created_at || '').toLocaleString('fr-FR')} • {m.sender_role}</div>
              <div className="text-sm whitespace-pre-wrap">{m.message}</div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const textarea = form.elements.namedItem('message') as HTMLTextAreaElement
          const text = (textarea?.value || '').trim()
          if (!text) return
          send.mutate(text)
          textarea.value = ''
        }}
        className="flex items-start gap-2"
      >
        <Textarea name="message" placeholder="Écrire un message..." className="flex-1" rows={2} />
        <Button type="submit" disabled={send.isPending}>Envoyer</Button>
      </form>
      <div className="text-xs text-muted-foreground">Participants: bailleur, locataire (si présent), prestataire assigné.</div>
    </div>
  )
}

function TicketTitleWithUnread({ ticketId, title, className }: { ticketId: string; title: string; className?: string }) {
  const { data: unread } = useTicketUnread(ticketId)
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="truncate">{title}</span>
      {unread ? <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> : null}
    </div>
  )
}

function MessagesTabLabel({ ticketId }: { ticketId: string }) {
  const { data: unread } = useTicketUnread(ticketId)
  return (
    <span className="inline-flex items-center gap-2">
      Messages {unread ? <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> : null}
    </span>
  )
}

export default function Maintenance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicketWithDetails | null>(null)
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isWorkOrderDialogOpen, setIsWorkOrderDialogOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [draggedTicket, setDraggedTicket] = useState<MaintenanceTicketWithDetails | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>("")
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [providerToRate, setProviderToRate] = useState<{ id: string; name: string } | null>(null)

  const [ticketFormData, setTicketFormData] = useState<MaintenanceTicketInsert>({
    title: "",
    description: "",
    property_id: "",
    unit_id: "none",
    status: "NOUVEAU",
    priority: "MOYEN",
  })

  const [workOrderFormData, setWorkOrderFormData] = useState<WorkOrderInsert>({
    ticket_id: "",
    description: "",
    contractor_name: "",
    estimated_cost: 0,
    actual_cost: 0,
    scheduled_date: "",
    completed_date: "",
    status: "EN ATTENTE",
  })

  const { toast } = useToast()
  const { profile } = useAuth()
  const { data: tickets = [], isLoading, error } = useMaintenanceTicketsWithDetails()
  const { data: properties = [] } = usePropertiesWithUnits()
  const { data: contacts = [] } = useContactsWithLeaseInfo()
  const { data: serviceProviders = [] } = useServiceProviderUsers()
  const createTicket = useCreateMaintenanceTicket()
  const updateTicket = useUpdateMaintenanceTicket()
  const deleteTicket = useDeleteMaintenanceTicket()
  const createWorkOrder = useCreateWorkOrder()
  const updateWorkOrder = useUpdateWorkOrder()
  const deleteWorkOrder = useDeleteWorkOrder()
  const { uploadFiles, isUploading } = useFileUpload()

  // Determine user permissions
  const userType = profile?.user_type || 'LANDLORD'
  const isLandlord = userType === 'LANDLORD'
  const isTenant = userType === 'TENANT'
  const isProvider = userType === 'SERVICE_PROVIDER'

  // Debug: log service providers
  console.log('[MAINTENANCE] User type:', userType)
  console.log('[MAINTENANCE] Service Providers:', serviceProviders)
  console.log('[MAINTENANCE] Tickets:', tickets)

  // Open ticket dialog directly via URL param ?openTicket=<id>&openTab=messages|summary|provider|workorders
  useEffect(() => {
    const openId = searchParams.get('openTicket')
    const openTab = searchParams.get('openTab') || undefined
    if (!openId) return
    if (tickets.length === 0) return
    const t = tickets.find(t => t.id === openId)
    if (t) {
      // Ouvrir uniquement la modale de consultation du ticket, pas la création
      setSelectedTicket(t)
      // Ouvrir éventuellement un onglet spécifique
      if (openTab) {
        // petite temporisation pour laisser la modale se monter
        setTimeout(() => {
          const allowed = ['summary','messages','provider','workorders']
          // @ts-ignore state declared later
          if (allowed.includes(openTab)) {
            // @ts-ignore: will set state if exists
            try { (setActiveTab as any)?.(openTab) } catch {}
          }
        }, 0)
      }
      const sp = new URLSearchParams(searchParams)
      sp.delete('openTicket')
      sp.delete('openTab')
      setSearchParams(sp, { replace: true })
    }
  }, [tickets, searchParams, setSearchParams])

  // Get units for selected property
  const selectedProperty = properties.find(p => p.id === ticketFormData.property_id)
  const availableUnits = selectedProperty?.units ?? []

  // Get tenants for selected unit (from contacts with active leases)
  const availableTenants = contacts.filter(contact => {
    if (!ticketFormData.unit_id || ticketFormData.unit_id === "none") return false
    // Check if contact has an active lease for the selected unit
    return contact.leases?.some(lease =>
      lease.unit_id === ticketFormData.unit_id &&
      lease.status === 'ACTIF'
    )
  })

  // Plus d'auto-sélection de contact: on bascule vers tenant_user_id (profil)

  const resetTicketForm = () => {
    setTicketFormData({
      title: "",
      description: "",
      property_id: "",
      unit_id: "none",
      status: "NOUVEAU",
      priority: "MOYEN",
    })
    setIsEditMode(false)
    setSelectedTicket(null)
    setSelectedFiles([])
  }

  const resetWorkOrderForm = () => {
    setWorkOrderFormData({
      ticket_id: "",
      description: "",
      contractor_name: "",
      estimated_cost: 0,
      actual_cost: 0,
      scheduled_date: "",
      completed_date: "",
      status: "EN ATTENTE",
    })
    setSelectedWorkOrder(null)
  }

  const handleOpenTicketDialog = () => {
    resetTicketForm()
    setIsTicketDialogOpen(true)
  }

  const handleEditTicket = (ticket: MaintenanceTicketWithDetails) => {
    setTicketFormData({
      title: ticket.title,
      description: ticket.description ?? "",
      property_id: ticket.property_id,
      unit_id: ticket.unit_id || "none",
      status: ticket.status ?? "NOUVEAU",
      priority: ticket.priority ?? "MOYEN",
    })
    setSelectedTicket(ticket)
    setIsEditMode(true)
    setIsTicketDialogOpen(true)
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketFormData.title || !ticketFormData.property_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedTicket) {
        await updateTicket.mutateAsync({
          id: selectedTicket.id,
          ...ticketFormData,
          unit_id: ticketFormData.unit_id === "none" ? null : ticketFormData.unit_id,
          description: ticketFormData.description || null,
        })

        // Upload files if any
        if (selectedFiles.length > 0) {
          await uploadFiles(selectedFiles, {
            ticketId: selectedTicket.id,
            propertyId: ticketFormData.property_id,
            category: 'maintenance'
          })
        }

        toast({
          title: "Succès",
          description: "Ticket modifié avec succès",
        })
      } else {
        // Déterminer lease_id et tenant_user_id en fonction du logement sélectionné
        let resolvedLeaseId: string | null = null
        let resolvedTenantUserId: string | null = (ticketFormData as any).tenant_user_id || null
        if (ticketFormData.unit_id && ticketFormData.unit_id !== 'none') {
          // Essai n°1: nouveau schéma (tenant_user_id)
          const q1 = await supabase
            .from('leases')
            .select('id, tenant_user_id, status')
            .eq('unit_id', ticketFormData.unit_id)
            .in('status', ['active', 'ACTIVE'])
            .maybeSingle()
          if (q1.error) {
            console.debug('[TICKET] leases (tenant_user_id) not available, fallback to tenant_id')
          }
          let activeLease: any = q1.data
          if (!activeLease) {
            // Essai n°2: ancien schéma (tenant_id)
            const q2 = await supabase
              .from('leases')
              .select('id, tenant_id, status')
              .eq('unit_id', ticketFormData.unit_id)
              .in('status', ['active', 'ACTIVE'])
              .maybeSingle()
            if (q2.error) {
              console.debug('[TICKET] leases (tenant_id) also unavailable')
            }
            activeLease = q2.data
            if (activeLease?.tenant_id && !resolvedTenantUserId) {
              // Dans ton schéma, leases.tenant_id est déjà un profiles.user_id
              resolvedTenantUserId = activeLease.tenant_id as string
            }
          } else {
            resolvedTenantUserId = activeLease.tenant_user_id || resolvedTenantUserId
          }
          console.log('[TICKET] Lookup active lease for unit', ticketFormData.unit_id, '=>', activeLease)
          if (activeLease) {
            resolvedLeaseId = activeLease.id
            console.log('[TICKET] Using tenant_user_id:', resolvedTenantUserId)
          }
        }

        console.log('[TICKET] Final payload tenant_user_id:', resolvedTenantUserId, 'lease_id:', resolvedLeaseId)
        const newTicket = await createTicket.mutateAsync({
          ...ticketFormData,
          unit_id: ticketFormData.unit_id === "none" ? null : ticketFormData.unit_id,
          description: ticketFormData.description || null,
          lease_id: resolvedLeaseId,
          tenant_user_id: resolvedTenantUserId,
          assigned_to: selectedProviderId || null,
        })

        // Upload files if any
        if (selectedFiles.length > 0 && newTicket) {
          await uploadFiles(selectedFiles, {
            ticketId: newTicket.id,
            propertyId: ticketFormData.property_id,
            category: 'maintenance'
          })
        }

        // Si prestataire choisi à la création, ajouter en participants et notifier
        if (selectedProviderId) {
          try {
            await addServiceProviderToTicket(newTicket.id, selectedProviderId)
            await notifyProviderAssignment(
              newTicket.id,
              selectedProviderId,
              newTicket.title || 'Ticket',
              (newTicket as any).property_name || 'Propriété'
            )
          } catch (e) {
            console.debug('[TICKET] provider assign at creation failed:', e)
          }
        }

        // reset provider select after creation
        setSelectedProviderId("")
        toast({
          title: "Succès",
          description: "Ticket créé avec succès",
        })
      }
      setIsTicketDialogOpen(false)
      resetTicketForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) return

    try {
      await deleteTicket.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès",
      })
      if (selectedTicket?.id === id) {
        setSelectedTicket(null)
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le ticket",
        variant: "destructive",
      })
    }
  }

  const handleOpenWorkOrderDialog = (ticket: MaintenanceTicketWithDetails) => {
    resetWorkOrderForm()
    setWorkOrderFormData({ ...workOrderFormData, ticket_id: ticket.id })
    setSelectedTicket(ticket)
    setIsWorkOrderDialogOpen(true)
  }

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrderFormData({
      ticket_id: workOrder.ticket_id,
      description: workOrder.description ?? "",
      contractor_name: workOrder.contractor_name ?? "",
      estimated_cost: workOrder.estimated_cost ?? 0,
      actual_cost: workOrder.actual_cost ?? 0,
      scheduled_date: workOrder.scheduled_date ?? "",
      completed_date: workOrder.completed_date ?? "",
      status: workOrder.status ?? "EN ATTENTE",
    })
    setSelectedWorkOrder(workOrder)
    setIsWorkOrderDialogOpen(true)
  }

  const handleSubmitWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workOrderFormData.ticket_id || !workOrderFormData.contractor_name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (selectedWorkOrder) {
        await updateWorkOrder.mutateAsync({
          id: selectedWorkOrder.id,
          ...workOrderFormData,
          description: workOrderFormData.description || null,
          estimated_cost: workOrderFormData.estimated_cost || null,
          actual_cost: workOrderFormData.actual_cost || null,
          scheduled_date: workOrderFormData.scheduled_date || null,
          completed_date: workOrderFormData.completed_date || null,
        })
        toast({
          title: "Succès",
          description: "Ordre de travail modifié avec succès",
        })
      } else {
        await createWorkOrder.mutateAsync({
          ...workOrderFormData,
          description: workOrderFormData.description || null,
          estimated_cost: workOrderFormData.estimated_cost || null,
          actual_cost: workOrderFormData.actual_cost || null,
          scheduled_date: workOrderFormData.scheduled_date || null,
          completed_date: workOrderFormData.completed_date || null,
        })
        toast({
          title: "Succès",
          description: "Ordre de travail créé avec succès",
        })
      }
      setIsWorkOrderDialogOpen(false)
      resetWorkOrderForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteWorkOrder = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet ordre de travail ?")) return

    try {
      await deleteWorkOrder.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Ordre de travail supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer l'ordre de travail",
        variant: "destructive",
      })
    }
  }

  const handleAssignServiceProvider = async (ticketId: string, providerId: string) => {
    try {
      // Get ticket details for notification
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) {
        throw new Error("Ticket non trouvé")
      }

      // Add provider to ticket participants
      await addServiceProviderToTicket(ticketId, providerId)

      // Update the ticket to set assigned_to
      await updateTicket.mutateAsync({
        id: ticketId,
        assigned_to: providerId,
      })

      // Send notification to the service provider
      try {
        await notifyProviderAssignment(
          ticketId,
          providerId,
          ticket.title,
          ticket.property?.name || 'Propriété'
        )
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        // Don't fail the assignment if notification fails
      }

      toast({
        title: "Succès",
        description: "Prestataire assigné avec succès",
      })
      setSelectedProviderId("")
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'assigner le prestataire",
        variant: "destructive",
      })
    }
  }

  const handleDragStart = (ticket: MaintenanceTicketWithDetails) => {
    setDraggedTicket(ticket)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (newStatus: string) => {
    if (!draggedTicket) return

    try {
      await updateTicket.mutateAsync({
        id: draggedTicket.id,
        status: newStatus as any,
      })
      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour le statut",
        variant: "destructive",
      })
    } finally {
      setDraggedTicket(null)
      setDragOverColumn(null)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.property?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesPriority
  })

  const getPriorityBadge = (priority: string | null) => {
    const priorities = {
      URGENT: { label: "Urgente", variant: "destructive" as const },
      ELEVE: { label: "Élevée", variant: "destructive" as const },
      MOYEN: { label: "Moyenne", variant: "default" as const },
      FAIBLE: { label: "Faible", variant: "secondary" as const }
    }
    return priorities[priority as keyof typeof priorities] || { label: priority || "Moyenne", variant: "secondary" as const }
  }

  const getStatusBadge = (status: string | null) => {
    const statuses = {
      NOUVEAU: { label: "Nouveau", variant: "destructive" as const },
      "EN COURS": { label: "En cours", variant: "default" as const },
      "EN ATTENTE DE PIECE": { label: "Attente pièces", variant: "secondary" as const },
      TERMINE: { label: "Terminé", variant: "outline" as const }
    }
    return statuses[status as keyof typeof statuses] || { label: status || "Nouveau", variant: "secondary" as const }
  }

  const getWorkOrderStatusBadge = (status: string | null) => {
    const statuses = {
      "EN ATTENTE": { label: "En attente", variant: "secondary" as const },
      "PLANIFIE": { label: "Planifié", variant: "default" as const },
      "EN COURS": { label: "En cours", variant: "default" as const },
      "TERMINE": { label: "Terminé", variant: "outline" as const },
      "ANNULE": { label: "Annulé", variant: "destructive" as const }
    }
    return statuses[status as keyof typeof statuses] || { label: status || "En attente", variant: "secondary" as const }
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur lors du chargement des tickets</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des tickets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">
            Tickets de maintenance et ordres de travail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              Liste
            </Button>
          </div>

          {/* Prestataires ne peuvent pas créer de tickets */}
          {!isProvider && (
            <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleOpenTicketDialog}>
                  <Plus className="w-4 h-4" />
                  Nouveau ticket
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Modifier le ticket" : "Créer un ticket de maintenance"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitTicket} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={ticketFormData.title}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property_id">Propriété *</Label>
                    <Select
                      value={ticketFormData.property_id}
                      onValueChange={(value) => {
                        setTicketFormData({ ...ticketFormData, property_id: value, unit_id: "none" })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une propriété" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_id">Logement</Label>
                    <Select
                      value={ticketFormData.unit_id || "none"}
                      onValueChange={(value) => setTicketFormData({ ...ticketFormData, unit_id: value === "none" ? "" : value })}
                      disabled={!ticketFormData.property_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un logement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tous les logements</SelectItem>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unit_number} {unit.type ? `- ${unit.type}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tenant Selection */}
                {ticketFormData.unit_id && ticketFormData.unit_id !== "none" && availableTenants.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant_id">Locataire concerné</Label>
                    <Select
                      value={ticketFormData.tenant_id || "none"}
                      onValueChange={(value) => setTicketFormData({ ...ticketFormData, tenant_id: value === "none" ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un locataire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun locataire spécifique</SelectItem>
                        {availableTenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.first_name} {tenant.last_name}
                            {tenant.email && ` (${tenant.email})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Select
                      value={ticketFormData.priority ?? "MOYEN"}
                      onValueChange={(value) => setTicketFormData({ ...ticketFormData, priority: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FAIBLE">Faible</SelectItem>
                        <SelectItem value="MOYEN">Moyenne</SelectItem>
                        <SelectItem value="ELEVE">Élevée</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={ticketFormData.status ?? "NOUVEAU"}
                      onValueChange={(value) => setTicketFormData({ ...ticketFormData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOUVEAU">Nouveau</SelectItem>
                        <SelectItem value="EN COURS">En cours</SelectItem>
                        <SelectItem value="EN ATTENTE DE PIECE">Attente pièces</SelectItem>
                        <SelectItem value="TERMINE">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Prestataire (optionnel) à la création */}
                {!isProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Prestataire (optionnel)</Label>
                    <Select
                      value={selectedProviderId}
                      onValueChange={setSelectedProviderId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un prestataire" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceProviders.length === 0 ? (
                          <SelectItem value="" disabled>Aucun prestataire disponible</SelectItem>
                        ) : (
                          serviceProviders.map((provider) => {
                            const displayName = provider.first_name && provider.last_name
                              ? `${provider.first_name} ${provider.last_name}`
                              : (provider.company_name || provider.email)
                            return (
                              <SelectItem key={provider.user_id} value={provider.user_id}>
                                {displayName}
                                {provider.specialty && ` - ${provider.specialty}`}
                              </SelectItem>
                            )
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Photos et documents</Label>
                  <FileUpload
                    onFilesChange={(files) => setSelectedFiles(files.map(f => f.file))}
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024}
                    acceptedTypes={['image/*', 'application/pdf']}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createTicket.isPending || updateTicket.isPending || isUploading}
                  >
                    {isEditMode ? "Modifier" : "Créer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
            <SelectItem value="ELEVE">Élevée</SelectItem>
            <SelectItem value="MOYEN">Moyenne</SelectItem>
            <SelectItem value="FAIBLE">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map(column => {
          const count = tickets.filter(t => t.status === column.id).length
          return (
            <Card key={column.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <column.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{column.title}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
          {KANBAN_COLUMNS.map(column => {
            const columnTickets = filteredTickets.filter(ticket => ticket.status === column.id)

            return (
              <div
                key={column.id}
                className={`space-y-3 rounded-lg p-2 transition-all ${
                  dragOverColumn === column.id
                    ? 'bg-primary/10 border-2 border-primary border-dashed'
                    : 'border-2 border-transparent'
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-2">
                    <column.icon className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnTickets.length}
                  </Badge>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 min-h-[100px]">
                  {columnTickets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucun ticket
                    </div>
                  ) : columnTickets.map(ticket => (
                    <Card
                      key={ticket.id}
                      draggable={isLandlord} // Seuls les propriétaires peuvent déplacer les tickets
                      onDragStart={() => isLandlord && handleDragStart(ticket)}
                      className={`${isLandlord ? 'cursor-move' : 'cursor-pointer'} transition-all hover:shadow-md ${column.color} ${
                        draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Title & Priority */}
                          <div className="space-y-2">
                            <TicketTitleWithUnread ticketId={ticket.id} title={ticket.title} className="font-semibold text-sm line-clamp-2" />
                            <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                          </div>

                          {/* Property & Unit */}
                          <div className="text-xs text-muted-foreground">
                            {ticket.property?.name}
                            {ticket.unit && ` - ${ticket.unit.unit_number}`}
                          </div>

                          {/* Work Orders Count */}
                          {ticket.work_orders && ticket.work_orders.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {ticket.work_orders.length} ordre(s) de travail
                            </div>
                          )}

                          {/* Created Date */}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(ticket.created_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-center">
                        <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucun ticket trouvé</h3>
                        <p className="text-muted-foreground">
                          Commencez par créer votre premier ticket.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell>
                        <div>
                          <TicketTitleWithUnread ticketId={ticket.id} title={ticket.title} className="font-medium text-sm line-clamp-1" />
                          <div className="text-xs text-muted-foreground">
                            {formatDate(ticket.created_at)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                      </TableCell>

                      <TableCell>
                        <Badge {...getStatusBadge(ticket.status)} className="text-xs" />
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{ticket.property?.name}</div>
                          {ticket.unit && (
                            <div className="text-xs text-muted-foreground">{ticket.unit.unit_number}</div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {ticket.assigned_contact ?
                            `${ticket.assigned_contact.first_name} ${ticket.assigned_contact.last_name}` :
                            "-"
                          }
                        </div>
                      </TableCell>

                      <TableCell>
                        {/* Seuls les propriétaires peuvent modifier/supprimer */}
                        {isLandlord && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTicket(ticket)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTicket(ticket.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {!isLandlord && <span className="text-xs text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                {selectedTicket.title}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="summary" className="mt-4">
            <TabsList>
              <TabsTrigger value="summary">Résumé</TabsTrigger>
              <TabsTrigger value="messages"><MessagesTabLabel ticketId={selectedTicket.id} /></TabsTrigger>
              {/* Seuls les propriétaires peuvent gérer les prestataires et ordres de travail */}
              {isLandlord && <TabsTrigger value="provider">Prestataire</TabsTrigger>}
              {isLandlord && (
                <TabsTrigger value="workorders">
                  Ordres de travail ({selectedTicket.work_orders?.length || 0})
                </TabsTrigger>
              )}
            </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Priorité:</span>
                    <Badge {...getPriorityBadge(selectedTicket.priority)} className="ml-2 text-xs" />
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <Badge {...getStatusBadge(selectedTicket.status)} className="ml-2 text-xs" />
                  </div>
                  {selectedTicket.description && (
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Bien:</span> {selectedTicket.property?.name}
                  </div>
                  {selectedTicket.unit && (
                    <div>
                      <span className="font-medium">Unité:</span> {selectedTicket.unit.unit_number}
                    </div>
                  )}
                  {selectedTicket.assigned_contact && (
                    <div>
                      <span className="font-medium">Assigné à:</span> {selectedTicket.assigned_contact.first_name} {selectedTicket.assigned_contact.last_name}
                    </div>
                  )}
                  {selectedTicket.created_by_contact && (
                    <div>
                      <span className="font-medium">Créé par:</span> {selectedTicket.created_by_contact.first_name} {selectedTicket.created_by_contact.last_name}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Créé le:</span> {formatDate(selectedTicket.created_at)}
                  </div>
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-3">
                <TicketMessagesPanel ticket={selectedTicket} />
              </TabsContent>

              <TabsContent value="provider" className="space-y-4">
                <ProviderRatingSection
                  selectedTicket={selectedTicket}
                  serviceProviders={serviceProviders}
                  onRateProvider={(providerId, providerName) => {
                    setProviderToRate({ id: providerId, name: providerName })
                    setIsRatingDialogOpen(true)
                  }}
                />

                  <div className="space-y-3">
                    <Label htmlFor="service_provider">Assigner un prestataire</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedProviderId}
                        onValueChange={setSelectedProviderId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un prestataire" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceProviders.length === 0 ? (
                            <SelectItem value="none" disabled>
                              Aucun prestataire disponible
                            </SelectItem>
                          ) : (
                            serviceProviders.map((provider) => {
                              // Afficher nom/prénom ou company_name si pas de nom
                              const displayName = provider.first_name && provider.last_name
                                ? `${provider.first_name} ${provider.last_name}`
                                : (provider.company_name || provider.email);

                              return (
                                <SelectItem key={provider.user_id} value={provider.user_id}>
                                  {displayName}
                                  {provider.specialty && ` - ${provider.specialty}`}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAssignServiceProvider(selectedTicket.id, selectedProviderId)}
                        disabled={!selectedProviderId || updateTicket.isPending}
                      >
                        Assigner
                      </Button>
                    </div>
                    {serviceProviders.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Vous n'avez pas encore ajouté de prestataires.
                      </p>
                    )}
                  </div>
              </TabsContent>

              <TabsContent value="workorders" className="space-y-4">
                {selectedTicket.work_orders && selectedTicket.work_orders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTicket.work_orders.map((wo) => (
                      <Card key={wo.id}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{wo.contractor_name}</span>
                              <Badge {...getWorkOrderStatusBadge(wo.status)} className="text-xs" />
                            </div>
                            {wo.description && (
                              <div className="text-sm text-muted-foreground">
                                {wo.description}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Devis: {wo.estimated_cost ?? 0}€
                              {wo.actual_cost && wo.actual_cost > 0 && ` • Réel: ${wo.actual_cost}€`}
                            </div>
                            {wo.scheduled_date && (
                              <div className="text-sm text-muted-foreground">
                                Programmé: {new Date(wo.scheduled_date).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditWorkOrder(wo)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWorkOrder(wo.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun ordre de travail créé
                  </p>
                )}

                <Button variant="outline" size="sm" onClick={() => handleOpenWorkOrderDialog(selectedTicket)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Créer un ordre de travail
                </Button>
              </TabsContent>
            </Tabs>

            {/* Seuls les propriétaires peuvent modifier/supprimer */}
            {isLandlord && (
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => handleEditTicket(selectedTicket)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleDeleteTicket(selectedTicket.id)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Rating Dialog */}
      {providerToRate && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          providerId={providerToRate.id}
          providerName={providerToRate.name}
          ticketId={selectedTicket?.id}
        />
      )}

      {/* Work Order Dialog */}
      <Dialog open={isWorkOrderDialogOpen} onOpenChange={setIsWorkOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkOrder ? "Modifier l'ordre de travail" : "Créer un ordre de travail"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitWorkOrder} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="contractor_name">Prestataire *</Label>
              <Input
                id="contractor_name"
                value={workOrderFormData.contractor_name}
                onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, contractor_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo_description">Description</Label>
              <Textarea
                id="wo_description"
                value={workOrderFormData.description}
                onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Coût estimé (€)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={workOrderFormData.estimated_cost ?? ""}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, estimated_cost: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_cost">Coût réel (€)</Label>
                <Input
                  id="actual_cost"
                  type="number"
                  value={workOrderFormData.actual_cost ?? ""}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, actual_cost: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date programmée</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={workOrderFormData.scheduled_date ?? ""}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completed_date">Date de fin</Label>
                <Input
                  id="completed_date"
                  type="date"
                  value={workOrderFormData.completed_date ?? ""}
                  onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, completed_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo_status">Statut</Label>
              <Select
                value={workOrderFormData.status ?? "EN ATTENTE"}
                onValueChange={(value) => setWorkOrderFormData({ ...workOrderFormData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={createWorkOrder.isPending || updateWorkOrder.isPending}>
                {selectedWorkOrder ? "Modifier" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsWorkOrderDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
