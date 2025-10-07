import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { FileText, Loader2 } from "lucide-react"
import { pdf } from '@react-pdf/renderer'
import { ReceiptPDFTemplate } from "./receipt-pdf-template"

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
  rent_amount: number
  charges_amount: number
  contact: {
    first_name: string | null
    last_name: string | null
    address: string | null
  }
}

interface ReceiptGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate?: () => void
}

const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" }
]

interface LandlordProfile {
  first_name: string | null
  last_name: string | null
  adress: string | null
  city: string | null
  postal_code: number | null
}

export default function ReceiptGeneratorModal({ open, onOpenChange, onGenerate }: ReceiptGeneratorModalProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lease, setLease] = useState<Lease | null>(null)
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null)
  const [selectedUnitData, setSelectedUnitData] = useState<Unit | null>(null)
  const [landlordProfile, setLandlordProfile] = useState<LandlordProfile | null>(null)

  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))

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
      // First get the lease
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('id, tenant_id, rent_amount, charges_amount')
        .eq('unit_id', unitId)
        .eq('status', 'active')
        .maybeSingle()

      if (leaseError) throw leaseError

      if (!leaseData) {
        setLease(null)
        return
      }

      // Then get the contact (tenant) info
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('first_name, last_name, address')
        .eq('id', leaseData.tenant_id)
        .single()

      if (contactError) throw contactError

      // Combine the data
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
    if (!lease || !selectedMonth || !selectedYear || !selectedPropertyData || !selectedUnitData) return

    setGenerating(true)
    try {
      // Check if receipt already exists
      const { data: existing } = await supabase
        .from('rent_invoices')
        .select('id')
        .eq('lease_id', lease.id)
        .eq('period_month', parseInt(selectedMonth))
        .eq('period_year', parseInt(selectedYear))
        .single()

      if (existing) {
        alert('Une quittance existe déjà pour cette période')
        return
      }

      // Prepare receipt data
      const totalAmount = lease.rent_amount + (lease.charges_amount || 0)
      const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || ''

      const periodStart = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
      const periodEnd = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
      const issueDate = new Date().toLocaleDateString('fr-FR')

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

      const receiptData = {
        month: monthName,
        year: selectedYear,
        landlordName: landlordName,
        landlordAddress: landlordAddress,
        tenantName: `${lease.contact.first_name || ''} ${lease.contact.last_name || ''}`.trim(),
        tenantAddress: lease.contact.address || 'N/A',
        propertyAddress: selectedPropertyData.address,
        unitNumber: selectedUnitData.unit_number,
        rentAmount: lease.rent_amount,
        chargesAmount: lease.charges_amount || 0,
        totalAmount: totalAmount,
        issueDate: issueDate,
        periodStart: periodStart.toLocaleDateString('fr-FR'),
        periodEnd: periodEnd.toLocaleDateString('fr-FR'),
      }

      // Generate PDF
      const pdfDoc = <ReceiptPDFTemplate data={receiptData} />
      const blob = await pdf(pdfDoc).toBlob()

      // Get current user ID for storage path
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      // Upload PDF to Supabase Storage with user_id in path
      const fileName = `quittance_${selectedYear}_${selectedMonth.padStart(2, '0')}_${lease.contact.last_name}_${Date.now()}.pdf`
      const filePath = `QUITTANCES/${user.id}/${fileName}`

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

      // Create rent invoice in database with pdf_url
      const dueDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 5)

      const { data, error } = await supabase
        .from('rent_invoices')
        .insert({
          lease_id: lease.id,
          period_month: parseInt(selectedMonth),
          period_year: parseInt(selectedYear),
          rent_amount: lease.rent_amount,
          charges_amount: lease.charges_amount || 0,
          total_amount: totalAmount,
          status: 'pending',
          due_date: dueDate.toISOString().split('T')[0],
          pdf_url: filePath // Stocker le chemin complet
        })
        .select()
        .single()

      if (error) throw error

      console.log('Receipt created:', data)
      console.log('PDF uploaded to:', filePath)

      // Success
      alert('Quittance générée et téléchargée avec succès!')
      onOpenChange(false)
      if (onGenerate) onGenerate()

      // Reset form
      setSelectedProperty("")
      setSelectedUnit("")
      setLease(null)
      setSelectedPropertyData(null)
      setSelectedUnitData(null)
    } catch (error) {
      console.error('Error generating receipt:', error)
      alert('Erreur lors de la génération de la quittance')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerate = selectedProperty && selectedUnit && lease && selectedMonth && selectedYear

  // Generate years array (current year +/- 2 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Générer une quittance de loyer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                  <span className="text-muted-foreground">Loyer:</span>{" "}
                  {lease.rent_amount.toFixed(2)} €
                </div>
                <div>
                  <span className="text-muted-foreground">Charges:</span>{" "}
                  {lease.charges_amount ? lease.charges_amount.toFixed(2) : '0.00'} €
                </div>
                <div className="font-medium pt-1 border-t">
                  <span className="text-muted-foreground">Total:</span>{" "}
                  {(lease.rent_amount + (lease.charges_amount || 0)).toFixed(2)} €
                </div>
              </div>
            </div>
          )}

          {selectedUnit && !lease && !loading && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 text-sm text-yellow-800 dark:text-yellow-200">
              Aucun bail actif trouvé pour ce logement
            </div>
          )}

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
            {generating ? "Génération..." : "Générer la quittance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
