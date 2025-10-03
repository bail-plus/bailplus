import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Plus, Search, MapPin, Home, Edit, Trash2, Maximize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  usePropertiesWithUnits,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  type PropertyWithUnits,
  type PropertyInsert
} from "@/hooks/useProperties"
import {
  useUnitsByProperty,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  type Unit,
  type UnitInsert
} from "@/hooks/useUnits"

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithUnits | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<PropertyInsert>({
    name: "",
    address: "",
    city: "",
    postal_code: "",
  })

  // Units management
  const [isUnitsDialogOpen, setIsUnitsDialogOpen] = useState(false)
  const [selectedPropertyForUnits, setSelectedPropertyForUnits] = useState<PropertyWithUnits | null>(null)
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [isUnitEditMode, setIsUnitEditMode] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [unitFormData, setUnitFormData] = useState<UnitInsert>({
    property_id: "",
    unit_number: "",
    type: "",
    surface: 0,
    furnished: false,
  })

  const { toast } = useToast()
  const { data: properties = [], isLoading, error } = usePropertiesWithUnits()
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()

  // Units hooks
  const { data: units = [], isLoading: unitsLoading } = useUnitsByProperty(selectedPropertyForUnits?.id)
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      postal_code: "",
    })
    setIsEditMode(false)
    setSelectedProperty(null)
  }

  const handleOpenDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditProperty = (property: PropertyWithUnits) => {
    setFormData({
      name: property.name,
      address: property.address,
      city: property.city ?? "",
      postal_code: property.postal_code ?? "",
    })
    setSelectedProperty(property)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address) {
      toast({
        title: "Erreur",
        description: "Le nom et l'adresse sont requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedProperty) {
        await updateProperty.mutateAsync({
          id: selectedProperty.id,
          ...formData,
        })
        toast({
          title: "Succès",
          description: "Propriété modifiée avec succès",
        })
      } else {
        await createProperty.mutateAsync(formData)
        toast({
          title: "Succès",
          description: "Propriété créée avec succès",
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette propriété ? Tous les logements associés seront également supprimés.")) return

    try {
      await deleteProperty.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Propriété supprimée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la propriété",
        variant: "destructive",
      })
    }
  }

  // Units management functions
  const handleOpenUnitsDialog = (property: PropertyWithUnits) => {
    setSelectedPropertyForUnits(property)
    setIsUnitsDialogOpen(true)
  }

  const resetUnitForm = () => {
    setUnitFormData({
      property_id: selectedPropertyForUnits?.id ?? "",
      unit_number: "",
      type: "",
      surface: 0,
      furnished: false,
    })
    setIsUnitEditMode(false)
    setSelectedUnit(null)
  }

  const handleOpenUnitDialog = () => {
    resetUnitForm()
    setUnitFormData({
      ...unitFormData,
      property_id: selectedPropertyForUnits?.id ?? "",
    })
    setIsUnitDialogOpen(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setUnitFormData({
      property_id: unit.property_id,
      unit_number: unit.unit_number,
      type: unit.type ?? "",
      surface: unit.surface ?? 0,
      furnished: unit.furnished ?? false,
    })
    setSelectedUnit(unit)
    setIsUnitEditMode(true)
    setIsUnitDialogOpen(true)
  }

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!unitFormData.unit_number) {
      toast({
        title: "Erreur",
        description: "Le numéro de logement est requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (isUnitEditMode && selectedUnit) {
        await updateUnit.mutateAsync({
          id: selectedUnit.id,
          ...unitFormData,
        })
        toast({
          title: "Succès",
          description: "Logement modifié avec succès",
        })
      } else {
        await createUnit.mutateAsync(unitFormData)
        toast({
          title: "Succès",
          description: "Logement créé avec succès",
        })
      }
      setIsUnitDialogOpen(false)
      resetUnitForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce logement ?")) return

    try {
      await deleteUnit.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Logement supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le logement",
        variant: "destructive",
      })
    }
  }

  const filteredProperties = properties.filter(property =>
    property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnits = properties.reduce((sum, p) => sum + (p.unitsCount ?? 0), 0)

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur lors du chargement des propriétés</p>
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
            <p className="text-muted-foreground">Chargement des propriétés...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Propriétés</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos biens immobiliers et logements
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4" />
              Nouvelle propriété
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier la propriété" : "Ajouter une propriété"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la propriété *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Immeuble 12 rue Victor Hugo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  placeholder="12 rue Victor Hugo"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="75001"
                    value={formData.postal_code ?? ""}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    value={formData.city ?? ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createProperty.isPending || updateProperty.isPending}>
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

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une propriété..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Propriétés</span>
            </div>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Logements</span>
            </div>
            <div className="text-2xl font-bold">{totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Villes</span>
            </div>
            <div className="text-2xl font-bold">
              {new Set(properties.map(p => p.city).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des propriétés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Logements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-center">
                      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune propriété trouvée</h3>
                      <p className="text-muted-foreground">
                        Commencez par ajouter votre première propriété.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProperties.map((property) => (
                  <TableRow
                    key={property.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleOpenUnitsDialog(property)}
                  >
                    <TableCell>
                      <div className="font-medium">{property.name}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.address}
                        </div>
                        {property.city && (
                          <div className="text-muted-foreground mt-1">
                            {property.postal_code} {property.city}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        <Home className="w-3 h-3 mr-1" />
                        {property.unitsCount ?? 0}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProperty(property)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(property.id)
                          }}
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

      {/* Units Management Dialog */}
      <Dialog open={isUnitsDialogOpen} onOpenChange={setIsUnitsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Logements - {selectedPropertyForUnits?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {units.length} logement(s)
              </p>
              <Button size="sm" onClick={handleOpenUnitDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un logement
              </Button>
            </div>

            {unitsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des logements...</p>
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun logement</h3>
                <p className="text-muted-foreground mb-4">
                  Ajoutez votre premier logement pour cette propriété.
                </p>
                <Button size="sm" onClick={handleOpenUnitDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un logement
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Logement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Meublé</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell>{unit.type || "-"}</TableCell>
                      <TableCell>
                        {unit.surface ? (
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" />
                            {unit.surface} m²
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {unit.furnished ? (
                          <Badge variant="default">Oui</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUnit(unit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUnit(unit.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isUnitEditMode ? "Modifier le logement" : "Ajouter un logement"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitUnit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">N° de logement *</Label>
              <Input
                id="unit_number"
                placeholder="Ex: Appt 3B, Studio 1, etc."
                value={unitFormData.unit_number}
                onChange={(e) => setUnitFormData({ ...unitFormData, unit_number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de logement</Label>
              <Input
                id="type"
                placeholder="Ex: T2, T3, Studio, etc."
                value={unitFormData.type ?? ""}
                onChange={(e) => setUnitFormData({ ...unitFormData, type: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                placeholder="Ex: 45"
                value={unitFormData.surface ?? ""}
                onChange={(e) => setUnitFormData({ ...unitFormData, surface: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="furnished"
                checked={unitFormData.furnished ?? false}
                onCheckedChange={(checked) => setUnitFormData({ ...unitFormData, furnished: checked as boolean })}
              />
              <Label htmlFor="furnished" className="cursor-pointer">
                Logement meublé
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={createUnit.isPending || updateUnit.isPending}>
                {isUnitEditMode ? "Modifier" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
