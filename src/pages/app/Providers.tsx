import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/ui/use-toast"
import {
  useServiceProviders,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
  type ServiceProvider
} from "@/hooks/providers/useServiceProviders"
import { useServiceProviderUsers, type User as ProviderUser } from "@/hooks/account/useUsers"
import { useInvitations } from "@/hooks/account/useInvitations"
import { ProvidersStats } from "@/components/providers/ProvidersStats"
import { ProvidersSearch } from "@/components/providers/ProvidersSearch"
import { ProvidersList } from "@/components/providers/ProvidersList"
import { ProviderFormDialog } from "@/components/providers/ProviderFormDialog"
import { ProviderInviteDialog } from "@/components/providers/ProviderInviteDialog"

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const { toast } = useToast()
  const { data: providers = [], isLoading, isFetching, error } = useServiceProviders()
  const { data: providerUsers = [], isLoading: loadingProviderUsers, error: providerUsersError } = useServiceProviderUsers()

  console.log('[PROVIDERS PAGE]', {
    isLoading,
    isFetching,
    error,
    providersLength: providers.length,
    loadingProviderUsers,
    providerUsersError,
    providerUsersLength: providerUsers.length,
  })
  const updateProvider = useUpdateServiceProvider()
  const deleteProvider = useDeleteServiceProvider()
  const { createInvitation } = useInvitations()

  const handleEditProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setIsDialogOpen(true)
  }

  const handleSubmitProvider = async (formData: any) => {
    if (!selectedProvider) {
      toast({
        title: "Erreur",
        description: "Aucun prestataire sélectionné",
        variant: "destructive",
      })
      return
    }

    await updateProvider.mutateAsync({
      id: selectedProvider.id,
      ...formData,
    })
    toast({
      title: "Succès",
      description: "Prestataire modifié avec succès",
    })
  }

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce prestataire ?")) return

    try {
      await deleteProvider.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le prestataire",
        variant: "destructive",
      })
    }
  }

  const handleInvite = async (data: { email: string; firstName: string; lastName: string; companyName: string }) => {
    await createInvitation({
      email: data.email,
      role: "SERVICE_PROVIDER",
      invitation_context: "manual",
      first_name: data.firstName || undefined,
      last_name: data.lastName || undefined,
    })

    toast({
      title: "Succès",
      description: "Invitation envoyée avec succès",
    })
  }

  // Si aucun provider dans service_providers, fallback aux profiles SERVICE_PROVIDER
  const mergedProviders: (ServiceProvider | any)[] = providers.length > 0 ? providers : providerUsers.map((u: ProviderUser) => ({
    id: u.user_id,
    user_id: u.user_id,
    company_name: u.company_name,
    specialty: u.specialty ? [u.specialty] : [],
    available: true,
    total_interventions: 0,
    average_rating: null,
    professional_phone: u.phone_number,
    professional_email: u.email,
    hourly_rate: null,
    siret: null,
    address: null,
    user: { first_name: u.first_name, last_name: u.last_name, email: u.email },
  }))

  const filteredProviders = mergedProviders.filter((provider: any) => {
    const matchesSearch =
      provider.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.user.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && provider.available) ||
      (availabilityFilter === "unavailable" && !provider.available)

    const matchesSpecialty =
      specialtyFilter === "all" ||
      (provider.specialty && provider.specialty.includes(specialtyFilter))

    return matchesSearch && matchesAvailability && matchesSpecialty
  })

  const totalProviders = mergedProviders.length
  const availableProviders = mergedProviders.filter((p: any) => p.available).length
  const totalInterventions = mergedProviders.reduce((sum: number, p: any) => sum + (p.total_interventions || 0), 0)
  const avgRating = mergedProviders.length > 0
    ? mergedProviders.reduce((sum: number, p: any) => sum + (p.average_rating || 0), 0) / mergedProviders.length
    : 0

  if (error || providerUsersError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">
              Erreur lors du chargement des prestataires<br />
              <span className="text-muted-foreground text-sm">
                {(error as Error)?.message || (providerUsersError as Error)?.message}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || loadingProviderUsers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des prestataires...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Prestataires</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos prestataires de service
          </p>
        </div>

        <Button className="gap-2" onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Inviter un prestataire
        </Button>
      </div>

      {/* Stats Cards */}
      <ProvidersStats
        totalProviders={totalProviders}
        availableProviders={availableProviders}
        totalInterventions={totalInterventions}
        avgRating={avgRating}
      />

      {/* Search and Filters */}
      <ProvidersSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availabilityFilter={availabilityFilter}
        onAvailabilityFilterChange={setAvailabilityFilter}
        specialtyFilter={specialtyFilter}
        onSpecialtyFilterChange={setSpecialtyFilter}
      />

      {/* Providers List */}
      <ProvidersList
        providers={filteredProviders}
        onEditProvider={handleEditProvider}
        onDeleteProvider={handleDeleteProvider}
      />

      {/* Edit Dialog */}
      <ProviderFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        provider={selectedProvider}
        onSubmit={handleSubmitProvider}
        isSubmitting={updateProvider.isPending}
      />

      {/* Invite Dialog */}
      <ProviderInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInvite={handleInvite}
      />
    </div>
  )
}
