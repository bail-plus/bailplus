import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { useToast } from "@/hooks/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  useLeasesWithDetails,
  useCreateLease,
  useUpdateLease,
  useDeleteLease,
  type LeaseWithDetails,
  type LeaseInsert
} from "@/hooks/leasing/useLeases"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useContactsWithLeaseInfo } from "@/hooks/properties/useContacts"
import { useTenants } from "@/hooks/account/useUsers"
import { useCreateUnit } from "@/hooks/leasing/useUnits"
import { useInvitations } from "@/hooks/account/useInvitations"
import { LeasesStats } from "@/components/leases/LeasesStats"
import { LeasesSearch } from "@/components/leases/LeasesSearch"
import { LeasesList } from "@/components/leases/LeasesList"
import { LeaseFormDialog } from "@/components/leases/LeaseFormDialog"

export default function Leases() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLease, setSelectedLease] = useState<LeaseWithDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { toast } = useToast()
  const { data: leases = [], isLoading, error } = useLeasesWithDetails()
  const { data: properties = [] } = usePropertiesWithUnits()
  const { data: tenants = [] } = useTenants()
  const { data: guarantors = [] } = useContactsWithLeaseInfo()
  const createLease = useCreateLease()
  const updateLease = useUpdateLease()
  const deleteLease = useDeleteLease()
  const createUnit = useCreateUnit()
  const { createInvitation } = useInvitations()

  // Ouvre le formulaire si ?create=1 est présent
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedLease(null)
      setIsDialogOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete("create")
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleOpenDialog = () => {
    setSelectedLease(null)
    setIsDialogOpen(true)
  }

  const handleEditLease = (lease: LeaseWithDetails) => {
    setSelectedLease(lease)
    setIsDialogOpen(true)
  }

  const handleCreateUnit = async (data: { property_id: string; unit_number: string; type: string | null; surface: number | null; furnished: boolean }) => {
    const newUnit = await createUnit.mutateAsync(data)
    return { id: newUnit.id }
  }

  const handleCreateInvitation = async (params: { email: string; role: string; first_name: string | null; last_name: string | null; property_id: string | null; lease_id: string | null }) => {
    const invitation = await createInvitation(params as any)
    return { id: invitation.id }
  }

  const handleSubmitLease = async (
    formData: LeaseInsert,
    selectedCoTenants: string[],
    selectedGuarantors: string[],
    pendingInvitationId: string | null
  ) => {
    if (selectedLease) {
      await updateLease.mutateAsync({
        id: selectedLease.id,
        ...formData,
      })
      toast({
        title: "Succès",
        description: "Bail modifié avec succès",
      })
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const leaseData = {
        ...formData,
        tenant_id: formData.tenant_id || (pendingInvitationId ? user.id : ""),
      }

      const newLease = await createLease.mutateAsync(leaseData)

      if (newLease) {
        if (pendingInvitationId) {
          const unitData = await supabase
            .from('units')
            .select('property_id')
            .eq('id', formData.unit_id)
            .single()

          await supabase
            .from('user_invitations')
            .update({
              lease_id: newLease.id,
              property_id: unitData.data?.property_id || null
            })
            .eq('id', pendingInvitationId)
        }

        if (selectedCoTenants.length > 0) {
          await Promise.all(
            selectedCoTenants.map(coTenantUserId =>
              supabase.from('lease_tenants').insert({
                lease_id: newLease.id,
                user_id: coTenantUserId,
                role: 'co-tenant',
              })
            )
          )
        }

        if (selectedGuarantors.length > 0) {
          await Promise.all(
            selectedGuarantors.map(guarantorId =>
              supabase.from('lease_guarantors').insert({
                lease_id: newLease.id,
                guarantor_contact_id: guarantorId,
                tenant_contact_id: null,
                user_id: user.id,
              })
            )
          )
        }
      }

      toast({
        title: "Succès",
        description: "Bail créé avec succès",
      })
    }
  }

  const handleDeleteLease = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bail ?")) return

    try {
      await deleteLease.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Bail supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le bail",
        variant: "destructive",
      })
    }
  }

  const filteredLeases = leases.filter(lease => {
    const matchesSearch =
      lease.unit?.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unit?.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.last_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || lease.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur lors du chargement des baux</p>
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
            <p className="text-muted-foreground">Chargement des baux...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Baux</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos contrats de location
          </p>
        </div>

        <Button className="gap-2" onClick={handleOpenDialog}>
          <Plus className="w-4 h-4" />
          Nouveau bail
        </Button>
      </div>

      {/* Search and Filters */}
      <LeasesSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Stats Cards */}
      <LeasesStats leases={leases} />

      {/* Leases List */}
      <LeasesList
        leases={filteredLeases}
        onEditLease={handleEditLease}
        onDeleteLease={handleDeleteLease}
      />

      {/* Lease Form Dialog */}
      <LeaseFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lease={selectedLease}
        properties={properties}
        tenants={tenants}
        guarantors={guarantors}
        onSubmit={handleSubmitLease}
        onCreateUnit={handleCreateUnit}
        onCreateInvitation={handleCreateInvitation}
        isSubmitting={createLease.isPending || updateLease.isPending}
      />
    </div>
  )
}
