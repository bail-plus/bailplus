import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useDeleteWorkOrder,
  type MaintenanceTicketWithDetails,
  type WorkOrderInsert,
  type WorkOrder,
} from "@/hooks/useMaintenance"

export function useWorkOrderForm() {
  const { toast } = useToast()
  const createWorkOrder = useCreateWorkOrder()
  const updateWorkOrder = useUpdateWorkOrder()
  const deleteWorkOrder = useDeleteWorkOrder()

  const [isWorkOrderDialogOpen, setIsWorkOrderDialogOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)

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

  const openWorkOrderDialog = (ticket: MaintenanceTicketWithDetails) => {
    resetWorkOrderForm()
    setWorkOrderFormData({ ...workOrderFormData, ticket_id: ticket.id })
    setIsWorkOrderDialogOpen(true)
  }

  const editWorkOrder = (workOrder: WorkOrder) => {
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

  const submitWorkOrder = async (e: React.FormEvent) => {
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

  return {
    // State
    isWorkOrderDialogOpen,
    setIsWorkOrderDialogOpen,
    selectedWorkOrder,
    workOrderFormData,
    setWorkOrderFormData,
    // Actions
    openWorkOrderDialog,
    editWorkOrder,
    submitWorkOrder,
    handleDeleteWorkOrder,
    resetWorkOrderForm,
    // Status
    isSubmitting: createWorkOrder.isPending || updateWorkOrder.isPending,
  }
}
