import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import type { ServiceProvider } from "@/hooks/useServiceProviders"

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

interface ProviderFormData {
  company_name: string
  specialty: string[]
  professional_email: string
  professional_phone: string
  hourly_rate: number | null
  siret: string
  address: string
  available: boolean
  insurance_certificate_url: string
  insurance_expiry_date: string
}

interface ProviderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: ServiceProvider | null
  onSubmit: (data: ProviderFormData) => Promise<void>
  isSubmitting: boolean
}

export function ProviderFormDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isSubmitting,
}: ProviderFormDialogProps) {
  const [formData, setFormData] = useState<ProviderFormData>({
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

  const { toast } = useToast()

  useEffect(() => {
    if (provider) {
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
    }
  }, [provider, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!provider) {
      toast({
        title: "Erreur",
        description: "Aucun prestataire sélectionné",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      // Error is already handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le prestataire</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              Modifier
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
