import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useMaintenanceTicketsWithDetails } from "@/hooks/maintenance/useMaintenance"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useContactsWithLeaseInfo } from "@/hooks/properties/useContacts"
import { useServiceProviderUsers } from "@/hooks/account/useUsers"
import { useAuth } from "@/hooks/auth/useAuth"
import { RatingDialog } from "@/components/provider/RatingDialog"
import { useSearchParams } from "react-router-dom"
import { MaintenanceStats } from "@/components/maintenance/MaintenanceStats"
import { MaintenanceSearch } from "@/components/maintenance/MaintenanceSearch"
import { MaintenanceKanban } from "@/components/maintenance/MaintenanceKanban"
import { MaintenanceList } from "@/components/maintenance/MaintenanceList"
import { TicketTitleWithUnread } from "@/components/maintenance/TicketTitleWithUnread"
import { TicketFormDialog } from "@/components/maintenance/TicketFormDialog"
import { WorkOrderDialog } from "@/components/maintenance/WorkOrderDialog"
import { TicketDetailModal } from "@/components/maintenance/TicketDetailModal"
import { getPriorityBadge, getStatusBadge, formatDate } from "@/components/maintenance/maintenance-utils"
import { useTicketForm } from "@/hooks/maintenance/useTicketForm"
import { useWorkOrderForm } from "@/hooks/maintenance/useWorkOrderForm"
import { useTicketActions } from "@/hooks/maintenance/useTicketActions"

export default function Maintenance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [providerToRate, setProviderToRate] = useState<{ id: string; name: string } | null>(null)

  // Data hooks
  const { profile } = useAuth()
  const { data: tickets = [], isLoading, error } = useMaintenanceTicketsWithDetails()
  const { data: properties = [] } = usePropertiesWithUnits()
  const { data: contacts = [] } = useContactsWithLeaseInfo()
  const { data: serviceProviders = [] } = useServiceProviderUsers()

  // Custom hooks
  const ticketForm = useTicketForm()
  const workOrderForm = useWorkOrderForm()
  const ticketActions = useTicketActions(tickets)

  // Determine user permissions
  const userType = profile?.user_type || 'LANDLORD'
  const isLandlord = userType === 'LANDLORD'
  const isProvider = userType === 'SERVICE_PROVIDER'

  // Keep selectedTicket in sync with latest fetched data
  useEffect(() => {
    if (!ticketForm.selectedTicket) return
    const updated = tickets.find(t => t.id === ticketForm.selectedTicket!.id)
    if (updated) {
      ticketForm.setSelectedTicket(updated)
    }
  }, [tickets])

  // Open ticket dialog directly via URL param
  useEffect(() => {
    const openId = searchParams.get('openTicket')
    if (!openId || tickets.length === 0) return

    const ticket = tickets.find(t => t.id === openId)
    if (ticket) {
      ticketForm.setSelectedTicket(ticket)
      const sp = new URLSearchParams(searchParams)
      sp.delete('openTicket')
      sp.delete('openTab')
      setSearchParams(sp, { replace: true })
    }
  }, [tickets, searchParams, setSearchParams])

  // Ouvrir le formulaire de ticket si ?create=1
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      ticketForm.setIsTicketDialogOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('create')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, ticketForm])

  // Get units for selected property
  const selectedProperty = properties.find(p => p.id === ticketForm.ticketFormData.property_id)
  const availableUnits = selectedProperty?.units ?? []

  // Get tenants for selected unit
  const availableTenants = contacts.filter(contact => {
    if (!ticketForm.ticketFormData.unit_id || ticketForm.ticketFormData.unit_id === "none") return false
    return contact.leases?.some(lease =>
      lease.unit_id === ticketForm.ticketFormData.unit_id &&
      lease.status === 'ACTIF'
    )
  })

  // Handler to close ticket modal and cleanup
  const handleCloseTicketModal = async (id: string) => {
    const deleted = await ticketActions.handleDeleteTicket(id)
    if (deleted && ticketForm.selectedTicket?.id === id) {
      ticketForm.setSelectedTicket(null)
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
            <TicketFormDialog
              open={ticketForm.isTicketDialogOpen}
              onOpenChange={ticketForm.setIsTicketDialogOpen}
              isEditMode={ticketForm.isEditMode}
              ticketFormData={ticketForm.ticketFormData}
              onFormDataChange={ticketForm.setTicketFormData}
              properties={properties}
              availableUnits={availableUnits}
              availableTenants={availableTenants}
              serviceProviders={serviceProviders}
              selectedProviderId={ticketForm.selectedProviderId}
              onSelectedProviderIdChange={ticketForm.setSelectedProviderId}
              selectedFiles={ticketForm.selectedFiles}
              onSelectedFilesChange={ticketForm.setSelectedFiles}
              onSubmit={ticketForm.submitTicket}
              isSubmitting={ticketForm.isSubmitting}
              isUploading={ticketForm.isUploading}
              isProvider={isProvider}
              onOpenDialog={ticketForm.openTicketDialog}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <MaintenanceSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      {/* Stats Cards */}
      <MaintenanceStats tickets={tickets} />

      {/* Content */}
      {viewMode === "kanban" ? (
        <MaintenanceKanban
          tickets={filteredTickets}
          onTicketClick={ticketForm.setSelectedTicket}
          onDragStart={ticketActions.handleDragStart}
          onDragOver={ticketActions.handleDragOver}
          onDragLeave={ticketActions.handleDragLeave}
          onDrop={ticketActions.handleDrop}
          draggedTicket={ticketActions.draggedTicket}
          dragOverColumn={ticketActions.dragOverColumn}
          isLandlord={isLandlord}
          getPriorityBadge={getPriorityBadge}
          formatDate={formatDate}
          TicketTitleWithUnread={TicketTitleWithUnread}
        />
      ) : (
        <MaintenanceList
          tickets={filteredTickets}
          onTicketClick={ticketForm.setSelectedTicket}
          onEditTicket={ticketForm.editTicket}
          onDeleteTicket={ticketActions.handleDeleteTicket}
          isLandlord={isLandlord}
          getPriorityBadge={getPriorityBadge}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          TicketTitleWithUnread={TicketTitleWithUnread}
        />
      )}

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        selectedTicket={ticketForm.selectedTicket}
        onClose={() => ticketForm.setSelectedTicket(null)}
        isLandlord={isLandlord}
        serviceProviders={serviceProviders}
        selectedProviderId={ticketForm.selectedProviderId}
        onSelectedProviderIdChange={ticketForm.setSelectedProviderId}
        onRateProvider={(providerId, providerName) => {
          setProviderToRate({ id: providerId, name: providerName })
          setIsRatingDialogOpen(true)
        }}
        onAssignServiceProvider={ticketActions.handleAssignServiceProvider}
        onEditTicket={ticketForm.editTicket}
        onDeleteTicket={handleCloseTicketModal}
        onEditWorkOrder={workOrderForm.editWorkOrder}
        onDeleteWorkOrder={workOrderForm.handleDeleteWorkOrder}
        onOpenWorkOrderDialog={workOrderForm.openWorkOrderDialog}
        isAssigning={ticketActions.isAssigning}
      />

      {/* Rating Dialog */}
      {providerToRate && (
        <RatingDialog
          open={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          providerId={providerToRate.id}
          providerName={providerToRate.name}
          ticketId={ticketForm.selectedTicket?.id}
        />
      )}

      {/* Work Order Dialog */}
      <WorkOrderDialog
        open={workOrderForm.isWorkOrderDialogOpen}
        onOpenChange={workOrderForm.setIsWorkOrderDialogOpen}
        selectedWorkOrder={workOrderForm.selectedWorkOrder}
        workOrderFormData={workOrderForm.workOrderFormData}
        onFormDataChange={workOrderForm.setWorkOrderFormData}
        onSubmit={workOrderForm.submitWorkOrder}
        isSubmitting={workOrderForm.isSubmitting}
      />
    </div>
  )
}
