import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { fr } from "date-fns/locale"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { LeaseWithDetails, LeaseInsert } from "@/hooks/useLeases"
import type { PropertyWithUnits } from "@/hooks/useProperties"
import type { Tenant } from "@/hooks/useUsers"
import type { ContactWithLeaseInfo } from "@/hooks/useContacts"
import type { UnitInsert } from "@/hooks/useUnits"

interface LeaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease: LeaseWithDetails | null
  properties: PropertyWithUnits[]
  tenants: Tenant[]
  guarantors: ContactWithLeaseInfo[]
  onSubmit: (data: LeaseInsert, coTenants: string[], guarantors: string[], pendingInvitationId: string | null) => Promise<void>
  onCreateUnit: (data: UnitInsert) => Promise<{ id: string }>
  onCreateInvitation: (params: { email: string; role: string; first_name: string | null; last_name: string | null; property_id: string | null; lease_id: string | null }) => Promise<{ id: string }>
  isSubmitting: boolean
}

export function LeaseFormDialog({
  open,
  onOpenChange,
  lease,
  properties,
  tenants,
  guarantors,
  onSubmit,
  onCreateUnit,
  onCreateInvitation,
  isSubmitting,
}: LeaseFormDialogProps) {
  const currentYear = new Date().getFullYear()
  const dayPickerLabels = {
    labelMonthDropdown: () => "Mois",
    labelYearDropdown: () => "Année",
    labelPrevious: () => "Mois précédent",
    labelNext: () => "Mois suivant",
  } as const

  const [startPickerOpen, setStartPickerOpen] = useState(false)
  const [endPickerOpen, setEndPickerOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [newUnitNumber, setNewUnitNumber] = useState("")
  const [newUnitType, setNewUnitType] = useState("")
  const [newUnitSurface, setNewUnitSurface] = useState<number | "">("")
  const [newUnitFurnished, setNewUnitFurnished] = useState(false)
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([])
  const [selectedCoTenants, setSelectedCoTenants] = useState<string[]>([])
  const [isInviteTenantDialogOpen, setIsInviteTenantDialogOpen] = useState(false)
  const [inviteTenantEmail, setInviteTenantEmail] = useState("")
  const [inviteTenantFirstName, setInviteTenantFirstName] = useState("")
  const [inviteTenantLastName, setInviteTenantLastName] = useState("")
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null)
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
  const isEditMode = !!lease

  useEffect(() => {
    if (!open) {
      setStartPickerOpen(false)
      setEndPickerOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (lease) {
      setFormData({
        unit_id: lease.unit_id ?? "",
        tenant_id: lease.tenant_id ?? "",
        start_date: lease.start_date,
        end_date: lease.end_date ?? "",
        rent_amount: lease.rent_amount,
        charges_amount: lease.charges_amount ?? 0,
        deposit_amount: lease.deposit_amount ?? 0,
        status: lease.status ?? "active",
        contract_type: lease.contract_type ?? "empty",
      })
      setSelectedPropertyId(lease.unit?.property.id ?? "")
    } else {
      resetForm()
    }
  }, [lease, open])

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
    setSelectedPropertyId("")
    setSelectedGuarantors([])
    setSelectedCoTenants([])
    setPendingInvitationId(null)
  }

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
      const newUnit = await onCreateUnit({
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

  const handleInviteTenant = async () => {
    if (!inviteTenantEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir l'email du locataire",
        variant: "destructive",
      })
      return
    }

    try {
      const invitation = await onCreateInvitation({
        email: inviteTenantEmail,
        role: "TENANT",
        first_name: inviteTenantFirstName || null,
        last_name: inviteTenantLastName || null,
        property_id: null,
        lease_id: null,
      })

      setPendingInvitationId(invitation.id)
      setIsInviteTenantDialogOpen(false)
      setInviteTenantEmail("")
      setInviteTenantFirstName("")
      setInviteTenantLastName("")

      toast({
        title: "Invitation envoyée",
        description: "Le locataire recevra un email d'invitation. Il sera automatiquement lié à ce bail une fois l'invitation acceptée.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'invitation",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.unit_id || (!formData.tenant_id && !pendingInvitationId) || !formData.start_date || !formData.rent_amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis (logement, locataire ou invitation, date de début, loyer)",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit(formData, selectedCoTenants, selectedGuarantors, pendingInvitationId)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      // Error is already handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsUnitDialogOpen(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer un logement</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new_unit_number">N° de logement *</Label>
                          <Input
                            id="new_unit_number"
                            placeholder="Ex: Appt 3B"
                            value={newUnitNumber}
                            onChange={(e) => setNewUnitNumber(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_unit_type">Type</Label>
                          <Input
                            id="new_unit_type"
                            placeholder="Ex: T2, T3"
                            value={newUnitType}
                            onChange={(e) => setNewUnitType(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new_unit_surface">Surface (m²)</Label>
                          <Input
                            id="new_unit_surface"
                            type="number"
                            value={newUnitSurface}
                            onChange={(e) => setNewUnitSurface(Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="new_unit_furnished"
                            checked={newUnitFurnished}
                            onCheckedChange={(checked) => setNewUnitFurnished(checked as boolean)}
                          />
                          <Label htmlFor="new_unit_furnished">Meublé</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" className="flex-1" onClick={handleCreateUnit}>
                            Créer
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
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
            <div className="flex items-center gap-2">
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un locataire" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun locataire invité
                    </div>
                  ) : (
                    tenants.map((tenant) => (
                      <SelectItem key={tenant.user_id} value={tenant.user_id}>
                        {tenant.first_name} {tenant.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Dialog open={isInviteTenantDialogOpen} onOpenChange={setIsInviteTenantDialogOpen}>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsInviteTenantDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Inviter un nouveau locataire</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite_tenant_email">Email *</Label>
                      <Input
                        id="invite_tenant_email"
                        type="email"
                        value={inviteTenantEmail}
                        onChange={(e) => setInviteTenantEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite_tenant_first_name">Prénom</Label>
                        <Input
                          id="invite_tenant_first_name"
                          value={inviteTenantFirstName}
                          onChange={(e) => setInviteTenantFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite_tenant_last_name">Nom</Label>
                        <Input
                          id="invite_tenant_last_name"
                          value={inviteTenantLastName}
                          onChange={(e) => setInviteTenantLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Le locataire recevra un email et sera automatiquement lié à ce bail
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button type="button" className="flex-1" onClick={handleInviteTenant}>
                        Envoyer
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsInviteTenantDialogOpen(false)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {pendingInvitationId && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Invitation envoyée. Le locataire sera lié au bail après acceptation.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Co-Tenants */}
          <div className="space-y-2">
            <Label>Colocataires (optionnel)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun locataire disponible</p>
              ) : (
                tenants
                  .filter(tenant => tenant.user_id !== formData.tenant_id)
                  .map((tenant) => (
                    <div key={tenant.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cotenant-${tenant.user_id}`}
                        checked={selectedCoTenants.includes(tenant.user_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCoTenants([...selectedCoTenants, tenant.user_id])
                          } else {
                            setSelectedCoTenants(selectedCoTenants.filter(id => id !== tenant.user_id))
                          }
                        }}
                      />
                      <Label htmlFor={`cotenant-${tenant.user_id}`} className="cursor-pointer text-sm">
                        {tenant.first_name} {tenant.last_name}
                      </Label>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Guarantors */}
          <div className="space-y-2">
            <Label>Garants (optionnel)</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
              {guarantors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun garant disponible</p>
              ) : (
                guarantors.map((guarantor) => (
                  <div key={guarantor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`guarantor-${guarantor.id}`}
                      checked={selectedGuarantors.includes(guarantor.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGuarantors([...selectedGuarantors, guarantor.id])
                        } else {
                          setSelectedGuarantors(selectedGuarantors.filter(id => id !== guarantor.id))
                        }
                      }}
                    />
                    <Label htmlFor={`guarantor-${guarantor.id}`} className="cursor-pointer text-sm">
                      {guarantor.first_name} {guarantor.last_name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? new Date(formData.start_date).toLocaleDateString() : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, start_date: date ? date.toISOString().split('T')[0] : "" })
                      setStartPickerOpen(false)
                    }}
                    locale={fr}
                    labels={dayPickerLabels}
                    captionLayout="dropdown-buttons"
                    fromYear={currentYear - 10}
                    toYear={currentYear + 10}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString() : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, end_date: date ? date.toISOString().split('T')[0] : "" })
                      setEndPickerOpen(false)
                    }}
                    locale={fr}
                    labels={dayPickerLabels}
                    captionLayout="dropdown-buttons"
                    fromYear={currentYear - 10}
                    toYear={currentYear + 10}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Loyer (€) *</Label>
              <Input
                id="rent_amount"
                type="number"
                value={formData.rent_amount}
                onChange={(e) => setFormData({ ...formData, rent_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charges_amount">Charges (€)</Label>
              <Input
                id="charges_amount"
                type="number"
                value={formData.charges_amount}
                onChange={(e) => setFormData({ ...formData, charges_amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Dépôt (€)</Label>
              <Input
                id="deposit_amount"
                type="number"
                value={formData.deposit_amount}
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
                  <SelectValue />
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
                  <SelectValue />
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
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
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
