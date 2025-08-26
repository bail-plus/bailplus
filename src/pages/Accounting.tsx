import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calculator, Plus, Download, Upload, Euro, Receipt, FileText, TrendingUp, AlertCircle, CreditCard } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { BankConnectionModal } from "@/components/bank-connection-modal"
import BatchReceiptGenerator from "@/components/batch-receipt-generator"
import ExpenseManager from "@/components/expense-manager"
import DepositManager from "@/components/deposit-manager"
import { useToast } from "@/hooks/use-toast"

interface RentInvoice {
  id: string
  lease_id: string
  tenant_name?: string
  property_name?: string
  period_month: number
  period_year: number
  rent_amount: number
  charges_amount: number
  total_amount: number
  status: string
  due_date: string
  paid_date?: string
}

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  expense_date: string
}

interface Deposit {
  id: string
  lease_id: string
  amount: number
  status: string
  created_at: string
}

export default function Accounting() {
  const [activeTab, setActiveTab] = useState("receipts")
  const [rentInvoices, setRentInvoices] = useState<RentInvoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAccountingData()
  }, [])

  const loadAccountingData = async () => {
    try {
      const [rentResult, expensesResult, depositsResult] = await Promise.all([
        supabase.from('rent_invoices').select('*'),
        supabase.from('expenses').select('*'), 
        supabase.from('deposits').select('*')
      ])

      setRentInvoices(rentResult.data || [])
      setExpenses(expensesResult.data || [])
      setDeposits(depositsResult.data || [])
    } catch (error) {
      console.error('Error loading accounting data:', error)
    } finally {
      setLoading(false)
    }
  }

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
  const totalRentDue = rentInvoices
    .filter(invoice => invoice.status === "pending" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  const totalOverdue = rentInvoices
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const totalDeposits = deposits
    .filter(deposit => deposit.status === "held")
    .reduce((sum, deposit) => sum + deposit.amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des données comptables...</div>
      </div>
    )
  }

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
              {rentInvoices.filter(i => i.status === "pending").length} facture(s)
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
              {rentInvoices.filter(i => i.status === "overdue").length} en retard
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
              {expenses.length} dépense(s)
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
              {deposits.filter(d => d.status === "held").length} détenu(s)
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
                  {rentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucune facture de loyer trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    rentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.tenant_name || 'N/A'}</TableCell>
                        <TableCell>{invoice.property_name || 'N/A'}</TableCell>
                        <TableCell>
                          {String(invoice.period_month).padStart(2, '0')}/{invoice.period_year}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.rent_amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.charges_amount || 0)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>
                          <Badge {...getStatusBadge(invoice.status.toUpperCase())} className="text-xs">
                            {getStatusBadge(invoice.status.toUpperCase()).label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {invoice.status !== "paid" && (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sprint 2 Implementation */}
        <TabsContent value="quittances" className="space-y-4">
          <BatchReceiptGenerator />
        </TabsContent>

        {/* Charges Tab */}
        <TabsContent value="charges" className="space-y-4">
          <ExpenseManager />
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4">
          <DepositManager />
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