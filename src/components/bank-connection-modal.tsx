import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Building2, Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const SUPPORTED_BANKS = [
  { id: "bnp", name: "BNP Paribas", logo: "🏦" },
  { id: "ca", name: "Crédit Agricole", logo: "🏦" },
  { id: "sg", name: "Société Générale", logo: "🏦" },
  { id: "lcl", name: "LCL", logo: "🏦" },
  { id: "credit_mutuel", name: "Crédit Mutuel", logo: "🏦" },
  { id: "boursorama", name: "Boursorama", logo: "🏦" },
  { id: "revolut", name: "Revolut", logo: "🏦" },
  { id: "other", name: "Autre banque", logo: "🏛️" }
]

const MOCK_CONNECTED_ACCOUNTS = [
  {
    id: "1",
    bankName: "BNP Paribas",
    accountNumber: "****1234",
    type: "Compte courant",
    balance: 12500,
    lastSync: "2024-01-15T10:30:00Z",
    status: "connected"
  },
  {
    id: "2", 
    bankName: "Crédit Agricole",
    accountNumber: "****5678",
    type: "Livret A",
    balance: 8300,
    lastSync: "2024-01-14T15:45:00Z",
    status: "error"
  }
]

interface BankConnectionModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BankConnectionModal({ trigger, open, onOpenChange }: BankConnectionModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [selectedBank, setSelectedBank] = useState("")
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  })
  const { toast } = useToast()

  const handleConnect = async () => {
    if (!selectedBank || !credentials.username || !credentials.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    setIsConnecting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsConnecting(false)
      toast({
        title: "Succès",
        description: "Compte bancaire connecté avec succès!"
      })
      setCredentials({ username: "", password: "" })
      setSelectedBank("")
      onOpenChange?.(false)
    }, 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" />Connecté</Badge>
      case "error":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Erreur</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Connexion bancaire
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Connected Accounts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comptes connectés</h3>
            
            {MOCK_CONNECTED_ACCOUNTS.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun compte connecté</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {MOCK_CONNECTED_ACCOUNTS.map((account) => (
                  <Card key={account.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🏦</span>
                          <div>
                            <div className="font-medium">{account.bankName}</div>
                            <div className="text-sm text-muted-foreground">
                              {account.type} • {account.accountNumber}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(account.status)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold">
                            {formatCurrency(account.balance)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Dernière sync: {formatDate(account.lastSync)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Synchroniser
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Déconnecter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add New Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connecter un nouveau compte</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sélectionnez votre banque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banque</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une banque" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_BANKS.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          <div className="flex items-center gap-2">
                            <span>{bank.logo}</span>
                            {bank.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBank && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="username">Identifiant</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Votre identifiant bancaire"
                        value={credentials.username}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          username: e.target.value
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Votre mot de passe"
                        value={credentials.password}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                      />
                    </div>

                    <div className="bg-muted p-3 rounded-md text-sm">
                      <p className="font-medium mb-1">🔒 Sécurité</p>
                      <p className="text-muted-foreground">
                        Vos identifiants sont chiffrés et sécurisés. Nous utilisons une connexion en lecture seule
                        et ne stockons jamais vos mots de passe en clair.
                      </p>
                    </div>

                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting || !credentials.username || !credentials.password}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Connecter le compte
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Fonctionnalités disponibles</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Synchronisation automatique des comptes</li>
                  <li>• Catégorisation des transactions</li>
                  <li>• Rapprochement automatique des loyers</li>
                  <li>• Alertes de mouvements importants</li>
                  <li>• Export comptable (FEC)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}