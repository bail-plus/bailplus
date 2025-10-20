import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { FileUpload } from "@/components/documents/FileUpload"
import type { MaintenanceTicketInsert } from "@/hooks/maintenance/useMaintenance"

interface TicketFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditMode: boolean
  ticketFormData: MaintenanceTicketInsert
  onFormDataChange: (data: MaintenanceTicketInsert) => void
  properties: any[]
  availableUnits: any[]
  availableTenants: any[]
  serviceProviders: any[]
  selectedProviderId: string
  onSelectedProviderIdChange: (id: string) => void
  selectedFiles: File[]
  onSelectedFilesChange: (files: File[]) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  isUploading: boolean
  isProvider: boolean
  onOpenDialog: () => void
}

export function TicketFormDialog({
  open,
  onOpenChange,
  isEditMode,
  ticketFormData,
  onFormDataChange,
  properties,
  availableUnits,
  availableTenants,
  serviceProviders,
  selectedProviderId,
  onSelectedProviderIdChange,
  selectedFiles,
  onSelectedFilesChange,
  onSubmit,
  isSubmitting,
  isUploading,
  isProvider,
  onOpenDialog,
}: TicketFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={onOpenDialog}>
          <Plus className="w-4 h-4" />
          Nouveau ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier le ticket" : "Créer un ticket de maintenance"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={ticketFormData.title}
              onChange={(e) => onFormDataChange({ ...ticketFormData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={ticketFormData.description}
              onChange={(e) => onFormDataChange({ ...ticketFormData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_id">Propriété *</Label>
              <Select
                value={ticketFormData.property_id}
                onValueChange={(value) => {
                  onFormDataChange({ ...ticketFormData, property_id: value, unit_id: "none" })
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
              <Label htmlFor="unit_id">Logement</Label>
              <Select
                value={ticketFormData.unit_id || "none"}
                onValueChange={(value) => onFormDataChange({ ...ticketFormData, unit_id: value === "none" ? "" : value })}
                disabled={!ticketFormData.property_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un logement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les logements</SelectItem>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number} {unit.type ? `- ${unit.type}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ticketFormData.unit_id && ticketFormData.unit_id !== "none" && availableTenants.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tenant_user_id">Locataire concerné</Label>
              <Select
                value={(ticketFormData as any).tenant_user_id || "none"}
                onValueChange={(value) => onFormDataChange({ ...(ticketFormData as any), tenant_user_id: value === "none" ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un locataire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun locataire spécifique</SelectItem>
                  {availableTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name}
                      {tenant.email && ` (${tenant.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={ticketFormData.priority ?? "MOYEN"}
                onValueChange={(value) => onFormDataChange({ ...ticketFormData, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAIBLE">Faible</SelectItem>
                  <SelectItem value="MOYEN">Moyenne</SelectItem>
                  <SelectItem value="ELEVE">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={ticketFormData.status ?? "NOUVEAU"}
                onValueChange={(value) => onFormDataChange({ ...ticketFormData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOUVEAU">Nouveau</SelectItem>
                  <SelectItem value="EN COURS">En cours</SelectItem>
                  <SelectItem value="EN ATTENTE DE PIECE">Attente pièces</SelectItem>
                  <SelectItem value="TERMINE">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isProvider && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Prestataire (optionnel)</Label>
              <Select
                value={selectedProviderId}
                onValueChange={onSelectedProviderIdChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un prestataire" />
                </SelectTrigger>
                <SelectContent>
                  {serviceProviders.length === 0 ? (
                    <SelectItem value="" disabled>Aucun prestataire disponible</SelectItem>
                  ) : (
                    serviceProviders.map((provider) => {
                      const displayName = provider.first_name && provider.last_name
                        ? `${provider.first_name} ${provider.last_name}`
                        : (provider.company_name || provider.email)
                      return (
                        <SelectItem key={provider.user_id} value={provider.user_id}>
                          {displayName}
                          {provider.specialty && ` - ${provider.specialty}`}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Photos et documents</Label>
            <FileUpload
              onFilesChange={(files) => onSelectedFilesChange(files.map(f => f.file))}
              maxFiles={5}
              maxSize={10 * 1024 * 1024}
              acceptedTypes={['image/*', 'application/pdf']}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || isUploading}
            >
              {isEditMode ? "Modifier" : "Créer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
