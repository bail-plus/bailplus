import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProviderInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (data: {
    email: string
    firstName: string
    lastName: string
    companyName: string
  }) => Promise<void>
}

export function ProviderInviteDialog({
  open,
  onOpenChange,
  onInvite,
}: ProviderInviteDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteCompanyName, setInviteCompanyName] = useState("")

  const { toast } = useToast()

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
      await onInvite({
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        companyName: inviteCompanyName,
      })

      setInviteEmail("")
      setInviteFirstName("")
      setInviteLastName("")
      setInviteCompanyName("")
      onOpenChange(false)
    } catch (error) {
      // Error is already handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
