import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateMaintenanceTicket,
  useUpdateMaintenanceTicket,
  type MaintenanceTicketWithDetails,
  type MaintenanceTicketInsert,
} from "@/hooks/useMaintenance"
import { useFileUpload } from "@/hooks/useFileUpload"
import { addServiceProviderToTicket } from "@/hooks/useTicketParticipants"
import { notifyProviderAssignment } from "@/hooks/useNotifications"
import { resolveLeaseTenantInfo } from "@/lib/tenant-resolver"

export function useTicketForm() {
  const { toast } = useToast()
  const createTicket = useCreateMaintenanceTicket()
  const updateTicket = useUpdateMaintenanceTicket()
  const { uploadFiles, isUploading } = useFileUpload()

  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicketWithDetails | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>("")

  const [ticketFormData, setTicketFormData] = useState<MaintenanceTicketInsert>({
    title: "",
    description: "",
    property_id: "",
    unit_id: "none",
    status: "NOUVEAU",
    priority: "MOYEN",
  })

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

  const openTicketDialog = () => {
    resetTicketForm()
    setIsTicketDialogOpen(true)
  }

  const editTicket = (ticket: MaintenanceTicketWithDetails) => {
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

  const submitTicket = async (e: React.FormEvent) => {
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
        // Update existing ticket
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
        // Create new ticket
        const { leaseId, tenantUserId } = await resolveLeaseTenantInfo(
          ticketFormData.unit_id,
          (ticketFormData as any).tenant_user_id
        )

        const newTicket = await createTicket.mutateAsync({
          ...ticketFormData,
          unit_id: ticketFormData.unit_id === "none" ? null : ticketFormData.unit_id,
          description: ticketFormData.description || null,
          lease_id: leaseId,
          tenant_user_id: tenantUserId,
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

        // Assign provider if selected
        if (selectedProviderId && newTicket) {
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

  return {
    // State
    isTicketDialogOpen,
    setIsTicketDialogOpen,
    isEditMode,
    selectedTicket,
    setSelectedTicket,
    ticketFormData,
    setTicketFormData,
    selectedFiles,
    setSelectedFiles,
    selectedProviderId,
    setSelectedProviderId,
    // Actions
    openTicketDialog,
    editTicket,
    submitTicket,
    resetTicketForm,
    // Status
    isSubmitting: createTicket.isPending || updateTicket.isPending,
    isUploading,
  }
}
