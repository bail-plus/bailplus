import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Wrench, Plus, Search, Edit, Trash2, Users, UserCheck, Star, Euro } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useServiceProviders,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
  type ServiceProvider
} from "@/hooks/useServiceProviders"
import { useInvitations } from "@/hooks/useInvitations"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useProviderRatings, useProviderRatingStats } from "@/hooks/useProviderRatings"

const SPECIALTIES = [
  "Plomberie",
  "Électricité",
  "Chauffage",
  "Climatisation",
  "Peinture",
  "Menuiserie",
  "Serrurerie",
  "Vitrier",
  "Maçonnerie",
  "Toiture",
  "Jardinage",
  "Nettoyage",
  "Autre"
]

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isViewRatingsOpen, setIsViewRatingsOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    company_name: "",
    specialty: [] as string[],
    professional_email: "",
    professional_phone: "",
    hourly_rate: null as number | null,
    siret: "",
    address: "",
    available: true,
    insurance_certificate_url: "",
    insurance_expiry_date: "",
  })

  // Invitation state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteCompanyName, setInviteCompanyName] = useState("")

  const { toast } = useToast()
  const { data: providers = [], isLoading, error } = useServiceProviders()
  const updateProvider = useUpdateServiceProvider()
  const deleteProvider = useDeleteServiceProvider()
  const { createInvitation } = useInvitations()

  const resetForm = () => {
    setFormData({
      company_name: "",
      specialty: [],
      professional_email: "",
      professional_phone: "",
      hourly_rate: null,
      siret: "",
      address: "",
      available: true,
      insurance_certificate_url: "",
      insurance_expiry_date: "",
    })
    setSelectedProvider(null)
  }

  const handleEdit = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setFormData({
      company_name: provider.company_name || "",
      specialty: provider.specialty || [],
      professional_email: provider.professional_email || "",
      professional_phone: provider.professional_phone || "",
      hourly_rate: provider.hourly_rate,
      siret: provider.siret || "",
      address: provider.address || "",
      available: provider.available ?? true,
      insurance_certificate_url: provider.insurance_certificate_url || "",
      insurance_expiry_date: provider.insurance_expiry_date || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProvider) {
      toast({
        title: "Erreur",
        description: "Aucun prestataire sélectionné",
        variant: "destructive",
      })
      return
    }

    try {
      await updateProvider.mutateAsync({
        id: selectedProvider.id,
        ...formData,
      })
      toast({
        title: "Succès",
        description: "Prestataire modifié avec succès",
      })
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
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

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner l'email du prestataire",
        variant: "destructive",
      })
      return
    }

    try {
      await createInvitation({
        email: inviteEmail,
        role: "SERVICE_PROVIDER",
        invitation_context: "manual",
        first_name: inviteFirstName || undefined,
        last_name: inviteLastName || undefined,
      })

      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
      setInviteCompanyName("")

      toast({
        title: "Succès",
        description: "Invitation envoyée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'invitation",
        variant: "destructive",
      })
    }
  }

  const filteredProviders = providers.filter(provider => {
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

  const totalProviders = providers.length
  const availableProviders = providers.filter(p => p.available).length
  const totalInterventions = providers.reduce((sum, p) => sum + (p.total_interventions || 0), 0)
  const avgRating = providers.length > 0
    ? providers.reduce((sum, p) => sum + (p.average_rating || 0), 0) / providers.length
    : 0

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur lors du chargement des prestataires</p>
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

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Inviter un prestataire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un nouveau prestataire</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="invite_email">Email *</Label>
                <Input
                  id="invite_email"
                  type="email"
                  placeholder="prestataire@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite_first_name">Prénom</Label>
                  <Input
                    id="invite_first_name"
                    placeholder="Jean"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite_last_name">Nom</Label>
                  <Input
                    id="invite_last_name"
                    placeholder="Dupont"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite_company_name">Nom de l'entreprise</Label>
                <Input
                  id="invite_company_name"
                  placeholder="Plomberie Dupont"
                  value={inviteCompanyName}
                  onChange={(e) => setInviteCompanyName(e.target.value)}
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Une invitation sera envoyée à cette adresse email. Le prestataire pourra créer son compte et compléter son profil.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleInvite}
                >
                  Envoyer l'invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
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
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Prestataires</span>
            </div>
            <div className="text-2xl font-bold">{totalProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Disponibles</span>
            </div>
            <div className="text-2xl font-bold">{availableProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Interventions</span>
            </div>
            <div className="text-2xl font-bold">{totalInterventions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Note Moyenne</span>
            </div>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Disponibilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
            <SelectItem value="unavailable">Non disponibles</SelectItem>
          </SelectContent>
        </Select>

        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Spécialité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {SPECIALTIES.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Providers List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des prestataires</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom / Entreprise</TableHead>
                <TableHead>Spécialités</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead>Interventions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun prestataire trouvé</h3>
                      <p className="text-muted-foreground">
                        Invitez vos premiers prestataires pour commencer.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {provider.company_name || `${provider.user.first_name} ${provider.user.last_name}`}
                        </div>
                        {provider.company_name && (
                          <div className="text-sm text-muted-foreground">
                            {provider.user.first_name} {provider.user.last_name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {provider.specialty?.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {provider.specialty && provider.specialty.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{provider.specialty.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div>{provider.professional_email || provider.user.email}</div>
                        {provider.professional_phone && (
                          <div className="text-muted-foreground">{provider.professional_phone}</div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {provider.hourly_rate ? (
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          <span>{provider.hourly_rate} €/h</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{provider.total_interventions || 0}</div>
                      {provider.average_rating && provider.average_rating > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {provider.average_rating.toFixed(1)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={provider.available ? "default" : "secondary"}>
                        {provider.available ? "Disponible" : "Non disponible"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(provider.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le prestataire</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Informations de base */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Spécialités</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {SPECIALTIES.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={formData.specialty.includes(specialty)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              specialty: [...formData.specialty, specialty]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              specialty: formData.specialty.filter(s => s !== specialty)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`specialty-${specialty}`} className="cursor-pointer text-sm">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="professional_email">Email professionnel</Label>
                  <Input
                    id="professional_email"
                    type="email"
                    value={formData.professional_email}
                    onChange={(e) => setFormData({ ...formData, professional_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professional_phone">Téléphone</Label>
                  <Input
                    id="professional_phone"
                    value={formData.professional_phone}
                    onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate || ""}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_certificate_url">URL certificat d'assurance</Label>
                  <Input
                    id="insurance_certificate_url"
                    value={formData.insurance_certificate_url}
                    onChange={(e) => setFormData({ ...formData, insurance_certificate_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_expiry_date">Date d'expiration assurance</Label>
                  <Input
                    id="insurance_expiry_date"
                    type="date"
                    value={formData.insurance_expiry_date}
                    onChange={(e) => setFormData({ ...formData, insurance_expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({ ...formData, available: checked as boolean })}
                />
                <Label htmlFor="available" className="cursor-pointer">
                  Prestataire disponible
                </Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={updateProvider.isPending}>
                Modifier
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
