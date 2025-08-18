import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calculator, Plus, Download, Upload, Euro, Receipt, FileText, TrendingUp, AlertCircle, CreditCard } from "lucide-react"
import { BankConnectionModal } from "@/components/bank-connection-modal"
import { useToast } from "@/hooks/use-toast"

const MOCK_RENT_INVOICES = [
  {
    id: "1",
    leaseId: "lease1",
    tenant: "Marie Dubois",
    property: "25 rue de la Paix - T3",
    periodMonth: 1,
    periodYear: 2024,
    rentAmount: 1100,
    charges: 150,
    total: 1250,
    status: "PAID",
    dueDate: "2024-01-05",
    paidDate: "2024-01-03"
  },
  {
    id: "2",
    leaseId: "lease2",
    tenant: "Pierre Martin",
    property: "10 avenue Mozart - Studio",
    periodMonth: 1,
    periodYear: 2024,
    rentAmount: 750,
    charges: 80,
    total: 830,
    status: "DUE",
    dueDate: "2024-01-05"
  },
  {
    id: "3",
    leaseId: "lease1",
    tenant: "Marie Dubois",
    property: "25 rue de la Paix - T3",
    periodMonth: 12,
    periodYear: 2023,
    rentAmount: 1100,
    charges: 150,
    total: 1250,
    status: "OVERDUE",
    dueDate: "2023-12-05"
  }
]

const MOCK_EXPENSES = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Réparation plomberie - T3",
    vendor: "Jean Plombier",
    property: "25 rue de la Paix",
    category: "Maintenance",
    amount: 250,
    vatRate: 20,
    deductible: true
  },
  {
    id: "2", 
    date: "2024-01-10",
    description: "Électricité parties communes",
    vendor: "EDF",
    property: "25 rue de la Paix",
    category: "Charges",
    amount: 45,
    vatRate: 20,
    deductible: true
  }
]

const MOCK_DEPOSITS = [
  {
    id: "1",
    leaseId: "lease1",
    tenant: "Marie Dubois",
    property: "25 rue de la Paix - T3",
    amount: 2200,
    receivedAt: "2023-06-01",
    status: "HELD"
  },
  {
    id: "2",
    leaseId: "lease2", 
    tenant: "Pierre Martin",
    property: "10 avenue Mozart - Studio",
    amount: 1500,
    receivedAt: "2023-09-15",
    status: "HELD"
  }
]

export default function Accounting() {
  const [activeTab, setActiveTab] = useState("receipts")
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    const statuses = {
      PAID: { label: "Payé", variant: "default" as const },
      DUE: { label: "Dû", variant: "secondary" as const },
      OVERDUE: { label: "En retard", variant: "destructive" as const },
      PARTIAL: { label: "Partiel", variant: "outline" as const },
      HELD: { label: "Détenu", variant: "default" as const },
      REFUNDED: { label: "Restitué", variant: "secondary" as const }
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Calculate stats
  const totalRentDue = MOCK_RENT_INVOICES
    .filter(invoice => invoice.status === "DUE" || invoice.status === "OVERDUE")
    .reduce((sum, invoice) => sum + invoice.total, 0)

  const totalOverdue = MOCK_RENT_INVOICES
    .filter(invoice => invoice.status === "OVERDUE")
    .reduce((sum, invoice) => sum + invoice.total, 0)

  const totalExpenses = MOCK_EXPENSES.reduce((sum, expense) => sum + expense.amount, 0)

  const totalDeposits = MOCK_DEPOSITS
    .filter(deposit => deposit.status === "HELD")
    .reduce((sum, deposit) => sum + deposit.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comptabilité</h1>
          <p className="text-muted-foreground mt-1">
            Hub financier : loyers, charges, dépenses et révisions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <BankConnectionModal 
            trigger={
              <Button variant="outline" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Connecter banque
              </Button>
            }
          />
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => toast({
              title: "Export en cours",
              description: "Export des données comptables..."
            })}
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle opération
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle opération comptable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité en cours de développement
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Loyers à encaisser</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalRentDue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MOCK_RENT_INVOICES.filter(i => i.status === "DUE").length} facture(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Impayés</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MOCK_RENT_INVOICES.filter(i => i.status === "OVERDUE").length} en retard
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dépenses du mois</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MOCK_EXPENSES.length} dépense(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dépôts de garantie</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {MOCK_DEPOSITS.filter(d => d.status === "HELD").length} détenu(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="receipts">Encaissements</TabsTrigger>
          <TabsTrigger value="quittances">Quittances</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="deposits">Dépôts</TabsTrigger>
          <TabsTrigger value="revisions">Révisions</TabsTrigger>
          <TabsTrigger value="reconciliation">Rapprochement</TabsTrigger>
        </TabsList>

        {/* Encaissements Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Loyers à encaisser</CardTitle>
              <Button size="sm" variant="outline">
                Générer les quittances du mois
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Loyer HC</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RENT_INVOICES.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.tenant}</TableCell>
                      <TableCell>{invoice.property}</TableCell>
                      <TableCell>
                        {String(invoice.periodMonth).padStart(2, '0')}/{invoice.periodYear}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.rentAmount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.charges)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(invoice.status)} className="text-xs">
                          {getStatusBadge(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {invoice.status !== "PAID" && (
                            <Button size="sm" variant="outline">
                              Enregistrer paiement
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Quittance
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

        {/* Quittances Tab */}
        <TabsContent value="quittances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Génération et suivi des quittances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button className="gap-2">
                  <FileText className="w-4 h-4" />
                  Générer quittances janvier 2024
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger toutes
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• 2 quittances générées et envoyées ce mois</p>
                <p>• 1 quittance en attente de génération</p>
                <p>• Modèle PDF conforme aux obligations légales françaises</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charges Tab */}
        <TabsContent value="charges" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Dépenses et charges</CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle dépense
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Montant HT</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Déductible</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_EXPENSES.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.vendor}</TableCell>
                      <TableCell>{expense.property}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount / (1 + expense.vatRate / 100))}</TableCell>
                      <TableCell>{expense.vatRate}%</TableCell>
                      <TableCell>
                        {expense.deductible ? (
                          <Badge variant="default" className="text-xs">Oui</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Régularisation annuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Calcul automatique des charges récupérables</p>
                <p>• Répartition selon les tantièmes ou surface</p>
                <p>• Génération des régularisations de charges</p>
                <Button variant="outline" className="mt-4">
                  Lancer régularisation 2023
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dépôts de garantie</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Bien</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Encaissé le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_DEPOSITS.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell className="font-medium">{deposit.tenant}</TableCell>
                      <TableCell>{deposit.property}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(deposit.amount)}</TableCell>
                      <TableCell>{formatDate(deposit.receivedAt)}</TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(deposit.status)} className="text-xs">
                          {getStatusBadge(deposit.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Restituer
                          </Button>
                          <Button size="sm" variant="ghost">
                            Détail
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

        {/* Revisions Tab */}
        <TabsContent value="revisions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Révision IRL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Index IRL de référence</label>
                  <Input placeholder="Ex: 131.12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nouvel index IRL</label>
                  <Input placeholder="Ex: 134.48" />
                </div>
                <Button className="w-full gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculer les nouveaux loyers
                </Button>
                <div className="text-xs text-muted-foreground">
                  Calcul automatique : Nouveau loyer = Loyer actuel × (IRL nouveau / IRL référence)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Encadrement des loyers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Loyer de référence:</span>
                    <span className="font-medium">25.50€/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer majoré (+20%):</span>
                    <span className="font-medium">30.60€/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer minoré (-30%):</span>
                    <span className="font-medium">17.85€/m²</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Configurer les références
                </Button>
                <div className="text-xs text-muted-foreground">
                  Vérification automatique lors de la création des baux
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Rapprochement bancaire</CardTitle>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Importer relevé CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Import des relevés bancaires au format CSV</p>
                <p>• Matching automatique avec les loyers et dépenses</p>
                <p>• Validation manuelle des correspondances</p>
                <p>• Suivi des écarts et régularisations</p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium text-sm mb-2">Dernière synchronisation</h4>
                <div className="text-sm text-muted-foreground">
                  <p>• 15/01/2024 : 3 transactions matchées automatiquement</p>
                  <p>• 1 transaction en attente de validation manuelle</p>
                  <p>• Solde comptable équilibré</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}