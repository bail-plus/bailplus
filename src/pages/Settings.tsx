import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Settings as SettingsIcon, Plus, Building, Users, CreditCard, FileText, Palette, Shield, Upload, Download } from "lucide-react"
import SubscriptionPanel from "@/components/dashboard/settings/payment/SubscriptionPanel"

const MOCK_ORGANIZATIONS = [
  {
    id: "1",
    name: "Personnel",
    type: "PERSONAL",
    isDefault: true,
    properties: 2,
    activeLeases: 2
  },
  {
    id: "2",
    name: "SCI Demo",
    type: "SCI",
    isDefault: false,
    properties: 2,
    activeLeases: 1
  }
]

const MOCK_USERS = [
  {
    id: "1",
    name: "Propriétaire Principal",
    email: "proprietaire@example.com",
    role: "OWNER",
    status: "active",
    lastLogin: "2024-01-15"
  }
]

const MOCK_BANK_ACCOUNTS = [
  {
    id: "1",
    name: "Compte principal",
    iban: "FR76 **** **** **** ****1234",
    provider: "STUB",
    syncStatus: "connected",
    lastSync: "2024-01-15"
  }
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState("organizations")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getRoleBadge = (role: string) => {
    const roles = {
      OWNER: { label: "Propriétaire", variant: "default" as const },
      MANAGER: { label: "Gestionnaire", variant: "secondary" as const },
      VIEWER: { label: "Consultant", variant: "outline" as const }
    }
    return roles[role as keyof typeof roles] || { label: role, variant: "secondary" as const }
  }

  const getStatusBadge = (status: string) => {
    const statuses = {
      active: { label: "Actif", variant: "default" as const },
      inactive: { label: "Inactif", variant: "secondary" as const },
      pending: { label: "En attente", variant: "outline" as const }
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "secondary" as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Configuration de votre compte et de vos entités
          </p>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="organizations">Entités</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="banking">Banques</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="rent-rules">Règles loyers</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="privacy">RGPD</TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Organisations et entités</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos entités personnelles et SCI
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle entité
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle entité</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-name">Nom de l'entité</Label>
                    <Input id="entity-name" placeholder="Ex: SCI Investissement" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Personnel</SelectItem>
                        <SelectItem value="SCI">SCI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button>Créer</Button>
                    <Button variant="outline">Annuler</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_ORGANIZATIONS.map((org) => (
              <Card key={org.id} className={org.isDefault ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {org.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={org.type === "PERSONAL" ? "default" : "secondary"} className="text-xs">
                        {org.type === "PERSONAL" ? "Personnel" : "SCI"}
                      </Badge>
                      {org.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Par défaut
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Biens:</span>
                      <span className="font-medium">{org.properties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Baux actifs:</span>
                      <span className="font-medium">{org.activeLeases}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button size="sm" variant="outline">
                      Modifier
                    </Button>
                    {!org.isDefault && (
                      <Button size="sm" variant="outline">
                        Définir par défaut
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Utilisateurs et rôles</h3>
              <p className="text-sm text-muted-foreground">
                Gérez les accès et permissions
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Inviter utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Fonctionnalité en cours de développement
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_USERS.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...getRoleBadge(user.role)} className="text-xs">
                          {getRoleBadge(user.role).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(user.status)} className="text-xs">
                          {getStatusBadge(user.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Modifier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comptes bancaires</h3>
              <p className="text-sm text-muted-foreground">
                Connexion aux banques et agrégation
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Connecter un compte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connecter un compte bancaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Intégration bancaire en mode STUB pour la démonstration
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière synchro</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_BANK_ACCOUNTS.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{account.iban}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {account.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          Connecté
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(account.lastSync)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Synchroniser
                          </Button>
                          <Button size="sm" variant="ghost">
                            Configurer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Modèles de documents</h3>
            <p className="text-sm text-muted-foreground">
              Personnalisez vos modèles PDF et emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Bail de location
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Quittance de loyer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    État des lieux
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Envoi quittance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Relance impayé
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Convocation visite
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Rappel paiement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Confirmation RDV
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Intervention programmée
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rent Rules Tab */}
        <TabsContent value="rent-rules" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Règles de loyers</h3>
            <p className="text-sm text-muted-foreground">
              Configuration de l'IRL et de l'encadrement des loyers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indexation IRL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="irl-base">Index IRL de référence</Label>
                  <Input
                    id="irl-base"
                    placeholder="Ex: 131.12"
                    defaultValue="131.12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Index utilisé lors de la signature du bail
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irl-current">Index IRL actuel</Label>
                  <Input
                    id="irl-current"
                    placeholder="Ex: 134.48"
                    defaultValue="134.48"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dernier index publié par l'INSEE
                  </p>
                </div>

                <Button className="w-full">
                  Mettre à jour les indices
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Encadrement des loyers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rent-ref">Loyer de référence (€/m²)</Label>
                  <Input
                    id="rent-ref"
                    placeholder="Ex: 25.50"
                    defaultValue="25.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent-major">Loyer majoré (+20%)</Label>
                  <Input
                    id="rent-major"
                    placeholder="Calculé automatiquement"
                    value="30.60"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent-minor">Loyer minoré (-30%)</Label>
                  <Input
                    id="rent-minor"
                    placeholder="Calculé automatiquement"
                    value="17.85"
                    disabled
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="rent-control" defaultChecked />
                  <Label htmlFor="rent-control" className="text-sm">
                    Vérifier l'encadrement lors de la création des baux
                  </Label>
                </div>

                <Button className="w-full">
                  Sauvegarder les règles
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Branding et apparence</h3>
            <p className="text-sm text-muted-foreground">
              Personnalisez l'apparence de vos documents et emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Logo et couleurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo de l'organisation</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour importer votre logo
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue="#3b82f6"
                      className="w-20"
                    />
                    <Input
                      placeholder="#3b82f6"
                      defaultValue="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      defaultValue="#64748b"
                      className="w-20"
                    />
                    <Input
                      placeholder="#64748b"
                      defaultValue="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nom de l'organisation</Label>
                  <Input
                    id="org-name"
                    defaultValue="Propriétaire Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">Adresse</Label>
                  <Textarea
                    id="org-address"
                    placeholder="Adresse complète..."
                    defaultValue="123 rue de la République&#10;75001 Paris"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-phone">Téléphone</Label>
                  <Input
                    id="org-phone"
                    placeholder="01 23 45 67 89"
                    defaultValue="01 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    defaultValue="proprietaire@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Numérotation automatique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-format">Format des quittances</Label>
                  <Input
                    id="receipt-format"
                    placeholder="QUIT-YYYY-####"
                    defaultValue="QUIT-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: QUIT-2024-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lease-format">Format des baux</Label>
                  <Input
                    id="lease-format"
                    placeholder="BAIL-YYYY-####"
                    defaultValue="BAIL-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: BAIL-2024-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-format">Format des tickets</Label>
                  <Input
                    id="ticket-format"
                    placeholder="TIC-YYYY-####"
                    defaultValue="TIC-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: TIC-2024-0001
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">RGPD et confidentialité</h3>
            <p className="text-sm text-muted-foreground">
              Gestion des données personnelles et conformité RGPD
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Export des données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Conformément au RGPD, vous pouvez demander l'export de toutes vos données personnelles.
                </p>

                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger mes données
                </Button>

                <p className="text-xs text-muted-foreground">
                  L'export inclura : profil, biens, locataires, communications, documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Suppression du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La suppression de votre compte effacera définitivement toutes vos données.
                </p>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Cette action est irréversible
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Toutes vos données seront définitivement supprimées
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Supprimer mon compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Cette action supprimera définitivement votre compte et toutes les données associées.
                      </p>
                      <div className="space-y-2">
                        <Label>Tapez "SUPPRIMER" pour confirmer</Label>
                        <Input placeholder="SUPPRIMER" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive">Confirmer la suppression</Button>
                        <Button variant="outline">Annuler</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des traitements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Création du compte</div>
                    <div className="text-xs text-muted-foreground">15/01/2024 à 14:30</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Accepté
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Ajout de locataires</div>
                    <div className="text-xs text-muted-foreground">15/01/2024 à 15:45</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Traité
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* payments */}
          <SubscriptionPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}