import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { Folder, Loader2 } from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import { EDLPDFTemplate } from "./edl-pdf-template"

interface Property {
  id: string
  name: string
  address: string
}

interface Unit {
  id: string
  unit_number: string
  type: string
  surface: number
  property_id: string
}

interface Lease {
  id: string
  tenant_id: string
  contact: {
    first_name: string | null
    last_name: string | null
    address: string | null
  }
}

interface EDLGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate?: () => void
}

interface LandlordProfile {
  first_name: string | null
  last_name: string | null
  adress: string | null
  city: string | null
  postal_code: number | null
}

export default function EDLGeneratorModal({ open, onOpenChange, onGenerate }: EDLGeneratorModalProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lease, setLease] = useState<Lease | null>(null)
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null)
  const [selectedUnitData, setSelectedUnitData] = useState<Unit | null>(null)
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null)

  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [edlType, setEdlType] = useState<"ENTREE" | "SORTIE">("ENTREE")

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Load properties and landlord profile on mount
  useEffect(() => {
    loadProperties()
    loadLandlordProfile()
  }, [])

  // Load units when property changes
  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty)
      setSelectedPropertyData(property || null)
      loadUnits(selectedProperty)
    } else {
      setSelectedPropertyData(null)
      setUnits([])
      setSelectedUnit("")
      setLease(null)
    }
  }, [selectedProperty, properties])

  // Load lease when unit changes
  useEffect(() => {
    if (selectedUnit) {
      const unit = units.find(u => u.id === selectedUnit)
      setSelectedUnitData(unit || null)
      loadLease(selectedUnit)
    } else {
      setSelectedUnitData(null)
      setLease(null)
    }
  }, [selectedUnit, units])

  const loadLandlordProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, adress, city, postal_code')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setLandlordProfile(data)
    } catch (error) {
      console.error('Error loading landlord profile:', error)
    }
  }

  const loadProperties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address')
        .order('name')

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnits = async (propertyId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, type, surface, property_id')
        .eq('property_id', propertyId)
        .order('unit_number')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error loading units:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLease = async (unitId: string) => {
    setLoading(true)
    try {
      // Get active lease
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('id, tenant_id')
        .eq('unit_id', unitId)
        .eq('status', 'active')
        .maybeSingle()

      if (leaseError) throw leaseError

      if (!leaseData) {
        setLease(null)
        return
      }

      // Get contact info
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('first_name, last_name, address')
        .eq('id', leaseData.tenant_id)
        .single()

      if (contactError) throw contactError

      setLease({
        ...leaseData,
        contact: contactData
      })
    } catch (error) {
      console.error('Error loading lease:', error)
      setLease(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!lease || !selectedPropertyData || !selectedUnitData) return

    setGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      // Prepare landlord info
      const landlordName = landlordProfile
        ? `${landlordProfile.first_name || ''} ${landlordProfile.last_name || ''}`.trim()
        : 'Propriétaire non renseigné'

      const landlordAddress = landlordProfile
        ? [
            landlordProfile.adress,
            landlordProfile.postal_code ? `${landlordProfile.postal_code} ${landlordProfile.city || ''}` : landlordProfile.city
          ].filter(Boolean).join(', ')
        : 'Adresse non renseignée'

      const edlData = {
        type: edlType,
        landlordName: landlordName,
        landlordAddress: landlordAddress,
        tenantName: `${lease.contact.first_name || ''} ${lease.contact.last_name || ''}`.trim(),
        tenantAddress: lease.contact.address || 'Non renseignée',
        propertyAddress: selectedPropertyData.address,
        unitNumber: selectedUnitData.unit_number,
        unitType: selectedUnitData.type,
        surface: selectedUnitData.surface,
        inspectionDate: new Date().toLocaleDateString('fr-FR'),
        issueDate: new Date().toLocaleDateString('fr-FR'),
      }

      // Generate PDF
      const pdfDoc = <EDLPDFTemplate data={edlData} />
      const blob = await pdf(pdfDoc).toBlob()

      // Upload PDF to Supabase Storage
      const typeLabel = edlType === 'ENTREE' ? 'entree' : 'sortie'
      const fileName = `edl_${typeLabel}_${lease.contact.last_name}_${selectedUnitData.unit_number}_${Date.now()}.pdf`
      const filePath = `ETAT-DES-LIEUX/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('PRIVATE')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError)
        throw new Error('Erreur lors de l\'upload du PDF: ' + uploadError.message)
      }

      // Download PDF locally
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)

      // Create document record in database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: `EDL ${edlType === 'ENTREE' ? 'Entrée' : 'Sortie'} - ${lease.contact.first_name} ${lease.contact.last_name} - ${selectedUnitData.unit_number}`,
          type: 'EDL',
          category: 'États des lieux',
          file_url: filePath,
          property_id: selectedPropertyData.id,
          lease_id: lease.id,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (docError) {
        console.error('Error creating document record:', docError)
        alert(`Erreur lors de l'enregistrement du document: ${docError.message}`)
        throw docError
      }

      console.log('EDL PDF created:', filePath)
      console.log('Document record created:', docData)

      // Success
      alert('État des lieux généré et téléchargé avec succès!')
      onOpenChange(false)
      if (onGenerate) onGenerate()

      // Reset form
      setSelectedProperty("")
      setSelectedUnit("")
      setLease(null)
      setSelectedPropertyData(null)
      setSelectedUnitData(null)
      setEdlType("ENTREE")
    } catch (error) {
      console.error('Error generating EDL:', error)
      alert('Erreur lors de la génération de l\'état des lieux')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = selectedProperty && selectedUnit && lease

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Générer un état des lieux
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'état des lieux</Label>
            <Select value={edlType} onValueChange={(value) => setEdlType(value as "ENTREE" | "SORTIE")}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTREE">État des lieux d'entrée</SelectItem>
                <SelectItem value="SORTIE">État des lieux de sortie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Bien immobilier</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger id="property">
                <SelectValue placeholder="Sélectionner un bien" />
              </SelectTrigger>
              <SelectContent>
                {properties.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {loading ? "Chargement..." : "Aucun bien disponible"}
                  </div>
                ) : (
                  properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <Label htmlFor="unit">Logement</Label>
            <Select
              value={selectedUnit}
              onValueChange={setSelectedUnit}
              disabled={!selectedProperty}
            >
              <SelectTrigger id="unit">
                <SelectValue placeholder="Sélectionner un logement" />
              </SelectTrigger>
              <SelectContent>
                {units.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {!selectedProperty ? "Sélectionner d'abord un bien" : loading ? "Chargement..." : "Aucun logement disponible"}
                  </div>
                ) : (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.type} ({unit.surface}m²)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Lease Info */}
          {lease && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="text-sm font-medium">Informations du bail</div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Locataire:</span>{" "}
                  {lease.contact.first_name} {lease.contact.last_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Adresse actuelle:</span>{" "}
                  {lease.contact.address || 'Non renseignée'}
                </div>
              </div>
            </div>
          )}

          {selectedUnit && !lease && !loading && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-sm text-yellow-800 dark:text-yellow-200">
              Aucun bail actif trouvé pour ce logement
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
          >
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {generating ? "Génération..." : "Générer l'état des lieux"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
