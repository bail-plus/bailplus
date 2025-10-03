import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Plus, Search, Calendar, Home, User, Edit, Trash2, Euro, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import {
  useLeasesWithDetails,
  useCreateLease,
  useUpdateLease,
  useDeleteLease,
  type LeaseWithDetails,
  type LeaseInsert
} from "@/hooks/useLeases"
import { usePropertiesWithUnits, useCreateProperty } from "@/hooks/useProperties"
import { useContactsWithLeaseInfo } from "@/hooks/useContacts"
import { useCreateUnit } from "@/hooks/useUnits"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Leases() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLease, setSelectedLease] = useState<LeaseWithDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [newUnitNumber, setNewUnitNumber] = useState("")
  const [newUnitType, setNewUnitType] = useState("")
  const [newUnitSurface, setNewUnitSurface] = useState<number | "">("")
  const [newUnitFurnished, setNewUnitFurnished] = useState(false)
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([])
  const [formData, setFormData] = useState<LeaseInsert>({
    unit_id: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
    rent_amount: 0,
    charges_amount: 0,
    deposit_amount: 0,
    status: "active",
    contract_type: "empty",
  })

  const { toast } = useToast()
  const { data: leases = [], isLoading, error } = useLeasesWithDetails()
  const { data: properties = [] } = usePropertiesWithUnits()
  const { data: contacts = [] } = useContactsWithLeaseInfo()
  const createLease = useCreateLease()
  const updateLease = useUpdateLease()
  const deleteLease = useDeleteLease()
  const createUnit = useCreateUnit()

  // Get units for selected property
  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const availableUnits = selectedProperty?.units ?? []

  const handleCreateUnit = async () => {
    if (!selectedPropertyId || !newUnitNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le numéro de logement",
        variant: "destructive",
      })
      return
    }

    try {
      const newUnit = await createUnit.mutateAsync({
        property_id: selectedPropertyId,
        unit_number: newUnitNumber,
        type: newUnitType || null,
        surface: newUnitSurface || null,
        furnished: newUnitFurnished,
      })

      setFormData({ ...formData, unit_id: newUnit.id })
      setIsUnitDialogOpen(false)
      setNewUnitNumber("")
      setNewUnitType("")
      setNewUnitSurface("")
      setNewUnitFurnished(false)

      toast({
        title: "Succès",
        description: "Logement créé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création du logement",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      unit_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      rent_amount: 0,
      charges_amount: 0,
      deposit_amount: 0,
      status: "active",
      contract_type: "empty",
    })
    setIsEditMode(false)
    setSelectedLease(null)
    setSelectedPropertyId("")
    setSelectedGuarantors([])
  }

  const handleOpenDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditLease = (lease: LeaseWithDetails) => {
    setFormData({
      unit_id: lease.unit_id,
      tenant_id: lease.tenant_id,
      start_date: lease.start_date,
      end_date: lease.end_date ?? "",
      rent_amount: lease.rent_amount,
      charges_amount: lease.charges_amount ?? 0,
      deposit_amount: lease.deposit_amount ?? 0,
      status: lease.status ?? "active",
      contract_type: lease.contract_type ?? "empty",
    })
    setSelectedLease(lease)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.unit_id || !formData.tenant_id || !formData.start_date || !formData.rent_amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedLease) {
        await updateLease.mutateAsync({
          id: selectedLease.id,
          ...formData,
        })
        toast({
          title: "Succès",
          description: "Bail modifié avec succès",
        })
      } else {
        const newLease = await createLease.mutateAsync(formData)

        // Créer les garanties si des garants ont été sélectionnés
        if (selectedGuarantors.length > 0 && newLease) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await Promise.all(
              selectedGuarantors.map(guarantorId =>
                supabase.from('lease_guarantors').insert({
                  lease_id: newLease.id,
                  guarantor_contact_id: guarantorId,
                  tenant_contact_id: formData.tenant_id,
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

  const activeLeases = leases.filter(l => l.status === "active").length
  const totalRentAmount = leases
    .filter(l => l.status === "active")
    .reduce((sum, l) => sum + l.rent_amount, 0)

  const getStatusBadge = (status?: string | null) => {
    const statusMap = {
      "draft": { label: "Brouillon", variant: "secondary" as const },
      "signed": { label: "Signé", variant: "secondary" as const },
      "active": { label: "Actif", variant: "default" as const },
      "terminated": { label: "Terminé", variant: "destructive" as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status || "Inconnu", variant: "secondary" as const }
  }

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4" />
              Nouveau bail
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier le bail" : "Créer un nouveau bail"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Property and Unit Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property">Propriété *</Label>
                  <Select
                    value={selectedPropertyId}
                    onValueChange={(value) => {
                      setSelectedPropertyId(value)
                      setFormData({ ...formData, unit_id: "" })
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
                  <Label htmlFor="unit_id">Logement *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.unit_id}
                      onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                      disabled={!selectedPropertyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un logement" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.length === 0 && selectedPropertyId ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Aucun logement disponible
                          </div>
                        ) : (
                          availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_number} {unit.type ? `- ${unit.type}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedPropertyId && (
                      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Créer un logement</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="new_unit_number">N° de logement *</Label>
                              <Input
                                id="new_unit_number"
                                placeholder="Ex: Appt 3B, Studio 1, etc."
                                value={newUnitNumber}
                                onChange={(e) => setNewUnitNumber(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new_unit_type">Type de logement</Label>
                              <Input
                                id="new_unit_type"
                                placeholder="Ex: T2, T3, Studio, etc."
                                value={newUnitType}
                                onChange={(e) => setNewUnitType(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new_unit_surface">Surface (m²)</Label>
                              <Input
                                id="new_unit_surface"
                                type="number"
                                placeholder="Ex: 45"
                                value={newUnitSurface}
                                onChange={(e) => setNewUnitSurface(e.target.value ? Number(e.target.value) : "")}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="new_unit_furnished"
                                checked={newUnitFurnished}
                                onCheckedChange={(checked) => setNewUnitFurnished(checked as boolean)}
                              />
                              <Label htmlFor="new_unit_furnished" className="cursor-pointer">
                                Logement meublé
                              </Label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                className="flex-1"
                                onClick={handleCreateUnit}
                                disabled={createUnit.isPending}
                              >
                                Créer
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUnitDialogOpen(false)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>

              {/* Tenant Selection */}
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Locataire principal *</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un locataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Guarantors Selection */}
              <div className="space-y-2">
                <Label>Garants (optionnel)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun contact disponible</p>
                  ) : (
                    contacts
                      .filter(contact => contact.id !== formData.tenant_id)
                      .map((contact) => (
                        <div key={contact.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`guarantor-${contact.id}`}
                            checked={selectedGuarantors.includes(contact.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGuarantors([...selectedGuarantors, contact.id])
                              } else {
                                setSelectedGuarantors(selectedGuarantors.filter(id => id !== contact.id))
                              }
                            }}
                          />
                          <Label htmlFor={`guarantor-${contact.id}`} className="cursor-pointer text-sm">
                            {contact.first_name} {contact.last_name}
                          </Label>
                        </div>
                      ))
                  )}
                </div>
                {selectedGuarantors.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedGuarantors.length} garant(s) sélectionné(s)
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin (optionnelle)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date ?? ""}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Laissez la date de fin vide pour un bail renouvelable tacitement. Vous pourrez y mettre fin ultérieurement en changeant le statut.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Loyer *</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    placeholder="800"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="charges_amount">Charges</Label>
                  <Input
                    id="charges_amount"
                    type="number"
                    placeholder="100"
                    value={formData.charges_amount ?? ""}
                    onChange={(e) => setFormData({ ...formData, charges_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Dépôt de garantie</Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    placeholder="800"
                    value={formData.deposit_amount ?? ""}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Contract Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Type de contrat</Label>
                  <Select
                    value={formData.contract_type ?? "empty"}
                    onValueChange={(value) => setFormData({ ...formData, contract_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furnished">Meublé</SelectItem>
                      <SelectItem value="empty">Vide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status ?? "active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="signed">Signé</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="terminated">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createLease.isPending || updateLease.isPending}>
                  {isEditMode ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un bail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="signed">Signés</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="terminated">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Baux</span>
            </div>
            <div className="text-2xl font-bold">{leases.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Baux Actifs</span>
            </div>
            <div className="text-2xl font-bold">{activeLeases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Loyers Mensuels</span>
            </div>
            <div className="text-2xl font-bold">{totalRentAmount} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Leases List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des baux</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logement</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucun bail trouvé</h3>
                      <p className="text-muted-foreground">
                        Commencez par créer votre premier bail.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeases.map((lease) => (
                  <TableRow key={lease.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {lease.unit?.unit_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lease.unit?.property.name}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </div>
                      {lease.coTenants && lease.coTenants.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{lease.coTenants.length} co-locataire(s)
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(lease.start_date).toLocaleDateString()}
                        </div>
                        {lease.end_date && (
                          <div className="text-muted-foreground">
                            → {new Date(lease.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{lease.rent_amount} €</div>
                      {lease.charges_amount && lease.charges_amount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          +{lease.charges_amount} € charges
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusBadge(lease.status).variant}>
                        {getStatusBadge(lease.status).label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLease(lease)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(lease.id)}
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
    </div>
  )
}
