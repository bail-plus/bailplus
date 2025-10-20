import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/ui/use-toast"
import {
  usePropertiesWithUnits,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  type PropertyWithUnits,
  type PropertyInsert
} from "@/hooks/properties/useProperties"
import {
  useUnitsByProperty,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  type Unit,
  type UnitInsert
} from "@/hooks/leasing/useUnits"
import { PropertiesStats } from "@/components/properties/PropertiesStats"
import { PropertiesSearch } from "@/components/properties/PropertiesSearch"
import { PropertiesList } from "@/components/properties/PropertiesList"
import { PropertyFormDialog } from "@/components/properties/PropertyFormDialog"
import { UnitsDialog } from "@/components/properties/UnitsDialog"
import { UnitFormDialog } from "@/components/properties/UnitFormDialog"

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithUnits | null>(null)
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false)
  const [selectedPropertyForUnits, setSelectedPropertyForUnits] = useState<PropertyWithUnits | null>(null)
  const [isUnitsDialogOpen, setIsUnitsDialogOpen] = useState(false)
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  const { toast } = useToast()
  const { data: properties = [], isLoading, error } = usePropertiesWithUnits()
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const deleteProperty = useDeleteProperty()

  const { data: units = [], isLoading: unitsLoading } = useUnitsByProperty(selectedPropertyForUnits?.id)
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  // Property handlers
  const handleOpenPropertyDialog = () => {
    setSelectedProperty(null)
    setIsPropertyDialogOpen(true)
  }

  const handleEditProperty = (property: PropertyWithUnits) => {
    setSelectedProperty(property)
    setIsPropertyDialogOpen(true)
  }

  const handleSubmitProperty = async (data: PropertyInsert) => {
    try {
      if (selectedProperty) {
        await updateProperty.mutateAsync({
          id: selectedProperty.id,
          ...data,
        })
        toast({
          title: "Succès",
          description: "Propriété modifiée avec succès",
        })
      } else {
        await createProperty.mutateAsync(data)
        toast({
          title: "Succès",
          description: "Propriété créée avec succès",
        })
      }
      setIsPropertyDialogOpen(false)
      setSelectedProperty(null)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteProperty = async (id: string) => {
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

  // Units handlers
  const handleOpenUnitsDialog = (property: PropertyWithUnits) => {
    setSelectedPropertyForUnits(property)
    setIsUnitsDialogOpen(true)
  }

  const handleOpenUnitDialog = () => {
    setSelectedUnit(null)
    setIsUnitDialogOpen(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsUnitDialogOpen(true)
  }

  const handleSubmitUnit = async (data: UnitInsert) => {
    try {
      if (selectedUnit) {
        await updateUnit.mutateAsync({
          id: selectedUnit.id,
          ...data,
        })
        toast({
          title: "Succès",
          description: "Logement modifié avec succès",
        })
      } else {
        await createUnit.mutateAsync(data)
        toast({
          title: "Succès",
          description: "Logement créé avec succès",
        })
      }
      setIsUnitDialogOpen(false)
      setSelectedUnit(null)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
      throw error
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

        <Button className="gap-2" onClick={handleOpenPropertyDialog}>
          <Plus className="w-4 h-4" />
          Nouvelle propriété
        </Button>
      </div>

      {/* Search */}
      <PropertiesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Stats Cards */}
      <PropertiesStats properties={properties} />

      {/* Properties List */}
      <PropertiesList
        properties={filteredProperties}
        onOpenUnitsDialog={handleOpenUnitsDialog}
        onEditProperty={handleEditProperty}
        onDeleteProperty={handleDeleteProperty}
      />

      {/* Property Form Dialog */}
      <PropertyFormDialog
        open={isPropertyDialogOpen}
        onOpenChange={setIsPropertyDialogOpen}
        property={selectedProperty}
        onSubmit={handleSubmitProperty}
        isSubmitting={createProperty.isPending || updateProperty.isPending}
      />

      {/* Units Management Dialog */}
      <UnitsDialog
        open={isUnitsDialogOpen}
        onOpenChange={setIsUnitsDialogOpen}
        property={selectedPropertyForUnits}
        units={units}
        isLoading={unitsLoading}
        onAddUnit={handleOpenUnitDialog}
        onEditUnit={handleEditUnit}
        onDeleteUnit={handleDeleteUnit}
      />

      {/* Unit Form Dialog */}
      <UnitFormDialog
        open={isUnitDialogOpen}
        onOpenChange={setIsUnitDialogOpen}
        unit={selectedUnit}
        propertyId={selectedPropertyForUnits?.id ?? ""}
        onSubmit={handleSubmitUnit}
        isSubmitting={createUnit.isPending || updateUnit.isPending}
      />
    </div>
  )
}
