import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ContactWithLeaseInfo, ContactInsert } from "@/hooks/useContacts"

interface PersonFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: ContactWithLeaseInfo | null
  onSubmit: (data: ContactInsert) => Promise<void>
  isSubmitting: boolean
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onSubmit,
  isSubmitting,
}: PersonFormDialogProps) {
  const [formData, setFormData] = useState<ContactInsert>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  })

  const { toast } = useToast()
  const isEditMode = !!person

  useEffect(() => {
    if (person) {
      setFormData({
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email ?? "",
        phone: person.phone ?? "",
        address: person.address ?? "",
      })
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
      })
    }
  }, [person, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name) {
      toast({
        title: "Erreur",
        description: "Le prénom et le nom sont requis",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier le garant" : "Ajouter un garant"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone ?? ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address ?? ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
