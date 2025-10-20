import { useState } from "react"
import { useToast } from "@/hooks/ui/use-toast"
import {
  useUpdateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  type MaintenanceTicketWithDetails,
} from "@/hooks/maintenance/useMaintenance"
import { addServiceProviderToTicket } from "@/hooks/maintenance/useTicketParticipants"
import { notifyProviderAssignment } from "@/hooks/notifications/useNotifications"

export function useTicketActions(tickets: MaintenanceTicketWithDetails[]) {
  const { toast } = useToast()
  const updateTicket = useUpdateMaintenanceTicket()
  const deleteTicket = useDeleteMaintenanceTicket()

  const [draggedTicket, setDraggedTicket] = useState<MaintenanceTicketWithDetails | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) return

    try {
      await deleteTicket.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Ticket supprimé avec succès",
      })
      return true
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le ticket",
        variant: "destructive",
      })
      return false
    }
  }

  const handleAssignServiceProvider = async (ticketId: string, providerId: string) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) {
        throw new Error("Ticket non trouvé")
      }

      await addServiceProviderToTicket(ticketId, providerId)

      await updateTicket.mutateAsync({
        id: ticketId,
        assigned_to: providerId,
      })

      try {
        await notifyProviderAssignment(
          ticketId,
          providerId,
          ticket.title,
          ticket.property?.name || 'Propriété'
        )
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
      }

      toast({
        title: "Succès",
        description: "Prestataire assigné avec succès",
      })
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

  return {
    // Drag & Drop state
    draggedTicket,
    dragOverColumn,
    // Actions
    handleDeleteTicket,
    handleAssignServiceProvider,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    // Status
    isAssigning: updateTicket.isPending,
  }
}
