import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Wallet, Plus, Euro, Calendar, Building, Search, Edit, Trash2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useExpenses,
  useRentInvoices,
  useBankTransactions,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCreateBankTransaction,
  useUpdateBankTransaction,
  useDeleteBankTransaction,
  type ExpenseWithDetails,
  type ExpenseInsert,
  type BankTransactionWithDetails,
  type BankTransactionInsert,
  useUpdateRentInvoice,
} from "@/hooks/useAccounting"
import { usePropertiesWithUnits } from "@/hooks/useProperties"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { pdf } from '@react-pdf/renderer'
import { ReceiptPDFTemplate } from "@/components/receipt-pdf-template-quittance"
import BatchReceiptGenerator from "@/components/batch-receipt-generator"

const EXPENSE_CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXE", label: "Taxe" },
  { value: "ASSURANCE", label: "Assurance" },
  { value: "CHARGES", label: "Charges" },
  { value: "TRAVAUX", label: "Travaux" },
  { value: "AUTRE", label: "Autre" },
]

const EXPENSE_STATUS = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvée" },
  { value: "rejected", label: "Rejetée" },
]

const TRANSACTION_STATUS = [
  { value: "PENDING", label: "En attente de rapprochement" },
  { value: "MATCHED", label: "Rapprochée (validée)" },
  { value: "UNMATCHED", label: "À catégoriser" },
]

export default function Accounting() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransactionWithDetails | null>(null)

  const [expenseFormData, setExpenseFormData] = useState<ExpenseInsert>({
    amount: 0,
    description: "",
    expense_date: new Date().toISOString().slice(0, 10),
    category: "AUTRE",
    status: "pending",
    property_id: null,
    unit_id: null,
    invoice_file_url: null,
  })

  const [transactionFormData, setTransactionFormData] = useState<BankTransactionInsert>({
    amount: 0,
    label: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PENDING",
    matched_expense_id: null,
    matched_rent_invoice_id: null,
    match_score: null,
  })
  const [revenueFormData, setRevenueFormData] = useState<BankTransactionInsert>({
    amount: 0,
    label: "",
    date: new Date().toISOString().slice(0, 10),
    status: "MATCHED",
    matched_expense_id: null,
    matched_rent_invoice_id: null,
    match_score: null,
  })

  const { toast } = useToast()
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses()
  const { data: rentInvoices = [], isLoading: invoicesLoading } = useRentInvoices()
  const { data: transactions = [], isLoading: transactionsLoading } = useBankTransactions()
  const { data: properties = [] } = usePropertiesWithUnits()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const createTransaction = useCreateBankTransaction()
  const updateTransaction = useUpdateBankTransaction()
  const deleteTransaction = useDeleteBankTransaction()
  const updateRentInvoice = useUpdateRentInvoice()

  // Realtime refresh for rent invoices
  useEffect(() => {
    const channel = supabase
      .channel('rent_invoices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rent-invoices'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  // Get units for selected property
  const selectedProperty = properties.find(p => p.id === expenseFormData.property_id)
  const availableUnits = selectedProperty?.units ?? []

  // Calculate statistics
  const stats = useMemo(() => {
    // Revenus des loyers payés
    const rentRevenue = rentInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0)

    // Revenus des transactions bancaires (montant positif et statut MATCHED)
    const transactionRevenue = transactions
      .filter(t => t.amount > 0 && t.status === "MATCHED")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRevenue = rentRevenue + transactionRevenue

    // Dépenses approuvées
    const approvedExpenses = expenses
      .filter(exp => exp.status === "approved")
      .reduce((sum, exp) => sum + exp.amount, 0)

    // Dépenses des transactions bancaires (montant négatif et statut MATCHED)
    const transactionExpenses = transactions
      .filter(t => t.amount < 0 && t.status === "MATCHED")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const totalExpenses = approvedExpenses + transactionExpenses

    const balance = totalRevenue - totalExpenses

    // En attente
    const pendingRevenue = rentInvoices
      .filter(inv => inv.status === "pending")
      .reduce((sum, inv) => sum + inv.total_amount, 0) +
      transactions
        .filter(t => t.amount > 0 && t.status === "PENDING")
        .reduce((sum, t) => sum + t.amount, 0)

    const pendingExpenses = expenses
      .filter(exp => exp.status === "pending")
      .reduce((sum, exp) => sum + exp.amount, 0) +
      transactions
        .filter(t => t.amount < 0 && t.status === "PENDING")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      totalRevenue,
      totalExpenses,
      balance,
      pendingRevenue,
      pendingExpenses,
    }
  }, [rentInvoices, expenses, transactions])

  const resetExpenseForm = () => {
    setExpenseFormData({
      amount: 0,
      description: "",
      expense_date: new Date().toISOString().slice(0, 10),
      category: "AUTRE",
      status: "pending",
      property_id: null,
      unit_id: null,
      invoice_file_url: null,
    })
    setSelectedExpense(null)
  }

  const resetTransactionForm = () => {
    setTransactionFormData({
      amount: 0,
      label: "",
      date: new Date().toISOString().slice(0, 10),
      status: "PENDING",
      matched_expense_id: null,
      matched_rent_invoice_id: null,
      match_score: null,
    })
    setSelectedTransaction(null)
  }

  const handleOpenExpenseDialog = () => {
    resetExpenseForm()
    setIsExpenseDialogOpen(true)
  }

  const handleEditExpense = (expense: ExpenseWithDetails) => {
    setExpenseFormData({
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date,
      category: expense.category || "AUTRE",
      status: expense.status || "pending",
      property_id: expense.property_id || null,
      unit_id: expense.unit_id || null,
      invoice_file_url: expense.invoice_file_url || null,
    })
    setSelectedExpense(expense)
    setIsExpenseDialogOpen(true)
  }

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!expenseFormData.amount || !expenseFormData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      const cleanData = {
        amount: expenseFormData.amount,
        description: expenseFormData.description,
        expense_date: expenseFormData.expense_date,
        category: expenseFormData.category,
        status: expenseFormData.status,
        property_id: expenseFormData.property_id || null,
        unit_id: expenseFormData.unit_id || null,
        invoice_file_url: expenseFormData.invoice_file_url || null,
      }

      if (selectedExpense) {
        await updateExpense.mutateAsync({
          id: selectedExpense.id,
          ...cleanData,
        })
        toast({
          title: "Succès",
          description: "Dépense modifiée avec succès",
        })
      } else {
        await createExpense.mutateAsync(cleanData)
        toast({
          title: "Succès",
          description: "Dépense créée avec succès",
        })
      }
      setIsExpenseDialogOpen(false)
      resetExpenseForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return

    try {
      await deleteExpense.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Dépense supprimée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la dépense",
        variant: "destructive",
      })
    }
  }

  const handleOpenTransactionDialog = () => {
    resetTransactionForm()
    setIsTransactionDialogOpen(true)
  }

  const handleEditTransaction = (transaction: BankTransactionWithDetails) => {
    setTransactionFormData({
      amount: transaction.amount,
      label: transaction.label,
      date: transaction.date,
      status: transaction.status || "PENDING",
      matched_expense_id: transaction.matched_expense_id || null,
      matched_rent_invoice_id: transaction.matched_rent_invoice_id || null,
      match_score: transaction.match_score || null,
    })
    setSelectedTransaction(transaction)
    setIsTransactionDialogOpen(true)
  }

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!transactionFormData.amount || !transactionFormData.label) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (selectedTransaction) {
        await updateTransaction.mutateAsync({
          id: selectedTransaction.id,
          ...transactionFormData,
        })
        toast({
          title: "Succès",
          description: "Transaction modifiée avec succès",
        })
      } else {
        await createTransaction.mutateAsync(transactionFormData)
        toast({
          title: "Succès",
          description: "Transaction créée avec succès",
        })
      }
      setIsTransactionDialogOpen(false)
      resetTransactionForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette transaction ?")) return

    try {
      await deleteTransaction.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Transaction supprimée avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer la transaction",
        variant: "destructive",
      })
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.property?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string | null) => {
    const statuses = {
      "pending": { label: "En attente", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
      "approved": { label: "Approuvée", variant: "default" as const, className: "bg-green-100 text-green-800" },
      "rejected": { label: "Rejetée", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
    }
    return statuses[status as keyof typeof statuses] || { label: status || "En attente", variant: "secondary" as const, className: "" }
  }

  const getTransactionStatusBadge = (status: string | null) => {
    const key = (status || '').toUpperCase()
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'En attente de rapprochement', className: 'bg-yellow-100 text-yellow-800' },
      MATCHED: { label: 'Rapprochée (validée)', className: 'bg-green-100 text-green-800' },
      UNMATCHED: { label: 'À catégoriser', className: 'bg-gray-100 text-gray-800' },
    }
    return map[key] || { label: status || '—', className: 'bg-gray-100 text-gray-800' }
  }

  const getInvoiceStatusBadge = (status: string | null) => {
    const key = (status || '').toLowerCase()
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
      late: { label: 'En retard', className: 'bg-red-100 text-red-800' },
    }
    return map[key] || { label: status || '—', className: 'bg-gray-100 text-gray-800' }
  }

  // Debuggable, reusable receipt download
  const downloadInvoiceReceipt = async (inv: any) => {
    try {
      console.log('[RECEIPT-DL] START', { invoiceId: inv.id, pdf_url: inv.pdf_url })
      let path: string | null = inv.pdf_url || null
      if (!path || (!path.startsWith('QUITTANCES') && !path.startsWith('PRIVATE/'))) {
        console.log('[RECEIPT-DL] Fallback to documents for lease', inv.lease_id)
        const { data: docs } = await supabase
          .from('documents')
          .select('file_url')
          .eq('lease_id', inv.lease_id)
          .eq('type', 'receipt')
          .order('created_at', { ascending: false })
          .limit(1)
        if (docs && docs.length > 0) path = docs[0].file_url as string
        console.log('[RECEIPT-DL] Fallback path', path)
      }
      if (!path) throw new Error('Aucune quittance disponible')
      let blob: Blob
      if (path.startsWith('QUITTANCES') || path.startsWith('PRIVATE/')) {
        const cleanPath = path.startsWith('PRIVATE/') ? path.slice('PRIVATE/'.length) : path
        console.log('[RECEIPT-DL] Storage download', cleanPath)
        const { data, error } = await supabase.storage.from('PRIVATE').download(cleanPath)
        if (error || !data) throw error || new Error('Téléchargement Storage impossible')
        blob = data as Blob
      } else if (/^https?:\/\//i.test(path)) {
        console.log('[RECEIPT-DL] HTTP fetch', path)
        const resp = await fetch(path)
        if (!resp.ok) throw new Error('HTTP ' + resp.status)
        blob = await resp.blob()
      } else {
        console.warn('[RECEIPT-DL] Invalid path', path)
        throw new Error('Chemin de quittance invalide')
      }
      const url = URL.createObjectURL(blob)
      const displayMonth = inv.period_month.toString().padStart(2, '0')
      const filename = `quittance_${inv.period_year}_${displayMonth}.pdf`
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      console.log('[RECEIPT-DL] DONE', filename)
    } catch (e) {
      console.error('[RECEIPT-DL] ERROR', e)
      toast({ title: 'Erreur', description: 'Téléchargement impossible', variant: 'destructive' })
    }
  }

  // Mark invoice as paid and generate a receipt PDF from template
  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const target = rentInvoices.find(inv => inv.id === invoiceId)
      // Build private storage path: PRIVATE/QUITTANCES/<profile_id>/quittance_YYYY_MM_lastname_<ts>.pdf
      let storagePath = ''
      let docName = 'Quittance'
      let tenantLastName = 'locataire'
      let ownerUserId: string | null = null

      if (target) {
        const displayMonth = target.period_month.toString().padStart(2, '0')
        tenantLastName = (target.lease?.tenant?.last_name || 'locataire').replace(/\s+/g, '_').toLowerCase()

        // Folder ownership must match auth.uid() due to RLS: use landlord's user_id
        const { data: auth } = await supabase.auth.getUser()
        ownerUserId = auth?.user?.id || null

        const ts = Date.now()
        const filename = `quittance_${target.period_year}_${displayMonth}_${tenantLastName}_${ts}.pdf`
        const folder = ownerUserId ? `QUITTANCES/${ownerUserId}` : 'QUITTANCES'
        storagePath = `${folder}/${filename}`
        docName = `Quittance ${displayMonth}/${target.period_year} - ${target.lease?.tenant ? `${target.lease.tenant.first_name} ${target.lease.tenant.last_name}` : 'Locataire'}`
      }

      // Build data for receipt template
      if (!target) throw new Error('Facture non trouvée')

      // Fetch landlord profile (current user)
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('Utilisateur non connecté')
      const { data: landlord } = await supabase
        .from('profiles')
        .select('first_name,last_name,adress,city,postal_code')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      // Fetch property address from unit
      let propertyAddress = '-'
      if (target.lease?.unit_id) {
        const { data: unit } = await supabase
          .from('units')
          .select('unit_number, properties (address, city, postal_code, name)')
          .eq('id', target.lease.unit_id)
          .maybeSingle()
        if (unit?.properties) {
          const p: any = unit.properties
          propertyAddress = [p.address, p.postal_code, p.city].filter(Boolean).join(' ')
        }
      }

      // Tenant profile (address)
      const { data: tenantProf } = await supabase
        .from('profiles')
        .select('first_name,last_name,adress,city,postal_code,id')
        .eq('user_id', target.lease?.tenant_id || '')
        .maybeSingle()

      // Dates and period
      const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(target.period_year, target.period_month - 1, 1))
      const periodStart = new Date(target.period_year, target.period_month - 1, 1)
      const periodEnd = new Date(target.period_year, target.period_month, 0)

      const landlordName = landlord ? `${landlord.first_name || ''} ${landlord.last_name || ''}`.trim() : '—'
      const landlordAddr = landlord ? [landlord.adress, landlord.postal_code ? `${landlord.postal_code} ${landlord.city || ''}` : landlord.city].filter(Boolean).join(', ') : '—'
      const tenantName = tenantProf ? `${tenantProf.first_name || ''} ${tenantProf.last_name || ''}`.trim() : '—'
      const tenantAddr = tenantProf ? [tenantProf.adress, tenantProf.postal_code ? `${tenantProf.postal_code} ${tenantProf.city || ''}` : tenantProf.city].filter(Boolean).join(', ') : '—'

      const receiptData = {
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        year: String(target.period_year),
        landlordName,
        landlordAddress: landlordAddr,
        tenantName,
        tenantAddress: tenantAddr,
        propertyAddress,
        unitNumber: target.lease?.unit?.unit_number || '-',
        rentAmount: target.rent_amount,
        chargesAmount: target.charges_amount || 0,
        totalAmount: target.total_amount,
        issueDate: new Date().toLocaleDateString('fr-FR'),
        periodStart: periodStart.toLocaleDateString('fr-FR'),
        periodEnd: periodEnd.toLocaleDateString('fr-FR'),
      }

      const pdfDoc = <ReceiptPDFTemplate data={receiptData} />
      const blob = await pdf(pdfDoc).toBlob()

      // Upload to PRIVATE bucket
      if (storagePath) {
        const { error: uploadError } = await supabase.storage.from('PRIVATE').upload(storagePath, blob, {
          contentType: 'application/pdf',
          upsert: true,
        })
        if (uploadError) {
          toast({ title: 'Erreur', description: `Upload quittance: ${uploadError.message}`, variant: 'destructive' })
          return
        }
      }

      await updateRentInvoice.mutateAsync({
        id: invoiceId,
        status: 'paid',
        paid_date: today,
        pdf_url: storagePath || null,
      } as any)

      // Create a document entry linked to the lease
      if (target) {
        const tenantName = target.lease?.tenant ? `${target.lease.tenant.first_name} ${target.lease.tenant.last_name}` : 'Locataire'
        await supabase
          .from('documents')
          .insert({
            name: docName,
            type: 'receipt',
            category: 'rent',
            file_url: storagePath || '',
            lease_id: target.lease_id,
            mime_type: 'application/pdf',
          })
      }
      toast({ title: 'Succès', description: 'Facture marquée comme payée et quittance générée.' })
    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de marquer payé', variant: 'destructive' })
    }
  }

  if (expensesLoading || invoicesLoading || transactionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comptabilité</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos revenus, dépenses et transactions bancaires
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.pendingRevenue)} en attente
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.pendingExpenses)} en attente
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solde</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenus - Dépenses
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <Wallet className={`w-6 h-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Dépenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="loyers">Loyers ({rentInvoices.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions bancaires ({transactions.length})</TabsTrigger>
        </TabsList>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher une dépense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleOpenExpenseDialog}>
                  <Plus className="w-4 h-4" />
                  Nouvelle dépense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedExpense ? "Modifier la dépense" : "Créer une dépense"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitExpense} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (€) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expense_date">Date *</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={expenseFormData.expense_date}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={expenseFormData.description}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select
                        value={expenseFormData.category || "AUTRE"}
                        onValueChange={(value) => setExpenseFormData({ ...expenseFormData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={expenseFormData.status || "pending"}
                        onValueChange={(value) => setExpenseFormData({ ...expenseFormData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="property_id">Propriété</Label>
                      <Select
                        value={expenseFormData.property_id || "none"}
                        onValueChange={(value) => setExpenseFormData({ ...expenseFormData, property_id: value === "none" ? null : value, unit_id: null })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une propriété" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune propriété</SelectItem>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit_id">Logement</Label>
                      <Select
                        value={expenseFormData.unit_id || "none"}
                        onValueChange={(value) => setExpenseFormData({ ...expenseFormData, unit_id: value === "none" ? null : value })}
                        disabled={!expenseFormData.property_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un logement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun logement</SelectItem>
                          {availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={createExpense.isPending || updateExpense.isPending}>
                      {selectedExpense ? "Modifier" : "Créer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-center">
                          <Euro className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Aucune dépense trouvée</h3>
                          <p className="text-muted-foreground">
                            Commencez par créer votre première dépense.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.expense_date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category || "Autre"}</Badge>
                        </TableCell>

                        <TableCell>
                          {expense.property ? (
                            <div className="text-sm">
                              <div>{expense.property.name}</div>
                              {expense.unit && (
                                <div className="text-xs text-muted-foreground">{expense.unit.unit_number}</div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadge(expense.status).className}>
                            {getStatusBadge(expense.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* REVENUES TAB */}
        <TabsContent value="revenues" className="space-y-4">
          <div className="flex items-center justify-end mb-4">
            <Button
              className="gap-2"
              onClick={() => {
                setRevenueFormData({
                  amount: 0,
                  label: "",
                  date: new Date().toISOString().slice(0, 10),
                  status: "MATCHED",
                  matched_expense_id: null,
                  matched_rent_invoice_id: null,
                  match_score: null,
                })
                setIsRevenueDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4" />
              Ajouter un revenu
            </Button>
          </div>

          <Dialog open={isRevenueDialogOpen} onOpenChange={setIsRevenueDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un revenu</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (revenueFormData.amount <= 0) {
                    toast({ title: "Montant invalide", description: "Le montant doit être positif", variant: "destructive" })
                    return
                  }
                  try {
                    await createTransaction.mutateAsync({
                      ...revenueFormData,
                      amount: Math.abs(revenueFormData.amount),
                      status: revenueFormData.status || "MATCHED",
                    })
                    toast({ title: "Succès", description: "Revenu ajouté" })
                    setIsRevenueDialogOpen(false)
                  } catch (err: any) {
                    toast({ title: "Erreur", description: err?.message || "Impossible d'ajouter le revenu", variant: "destructive" })
                  }
                }}
                className="space-y-4 pt-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rev_amount">Montant (€) *</Label>
                    <Input
                      id="rev_amount"
                      type="number"
                      step="0.01"
                      value={revenueFormData.amount}
                      onChange={(e) => setRevenueFormData({ ...revenueFormData, amount: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rev_date">Date *</Label>
                    <Input
                      id="rev_date"
                      type="date"
                      value={revenueFormData.date}
                      onChange={(e) => setRevenueFormData({ ...revenueFormData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rev_label">Libellé *</Label>
                  <Input
                    id="rev_label"
                    value={revenueFormData.label}
                    onChange={(e) => setRevenueFormData({ ...revenueFormData, label: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1" disabled={createTransaction.isPending}>
                    Créer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsRevenueDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>


        </TabsContent>

        {/* LOYERS TAB */}
        <TabsContent value="loyers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factures de loyer</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Propriété</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                          <p className="text-muted-foreground">
                            Les factures de loyer s'afficheront ici.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {invoice.period_month.toString().padStart(2, '0')}/{invoice.period_year}
                        </TableCell>
                        <TableCell>
                          {invoice.lease?.tenant ?
                            `${invoice.lease.tenant.first_name} ${invoice.lease.tenant.last_name}` :
                            "-"
                          }
                        </TableCell>
                        <TableCell>
                          {invoice.lease?.unit?.property?.name || "-"}
                          {invoice.lease?.unit && (
                            <div className="text-xs text-muted-foreground">
                              {invoice.lease.unit.unit_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.rent_amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.charges_amount || 0)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getInvoiceStatusBadge(invoice.status).className}>
                            {getInvoiceStatusBadge(invoice.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="pointer-events-auto">
                          {invoice.status !== 'paid' ? (
                            <Button size="sm" onClick={() => handleMarkInvoicePaid(invoice.id)} disabled={updateRentInvoice.isPending}>
                              Marquer payé
                            </Button>
                          ) : invoice.pdf_url ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); downloadInvoiceReceipt(invoice) }}
                            >
                              Télécharger une quittance
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Quittance à générer</span>
                          )}
                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <BatchReceiptGenerator />
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-end">
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleOpenTransactionDialog}>
                  <Plus className="w-4 h-4" />
                  Nouvelle transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedTransaction ? "Modifier la transaction" : "Créer une transaction bancaire"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitTransaction} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trans_amount">Montant (€) *</Label>
                      <Input
                        id="trans_amount"
                        type="number"
                        step="0.01"
                        value={transactionFormData.amount}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trans_date">Date *</Label>
                      <Input
                        id="trans_date"
                        type="date"
                        value={transactionFormData.date}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trans_label">Libellé *</Label>
                    <Input
                      id="trans_label"
                      value={transactionFormData.label}
                      onChange={(e) => setTransactionFormData({ ...transactionFormData, label: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trans_status">Statut</Label>
                    <Select
                      value={transactionFormData.status || "PENDING"}
                      onValueChange={(value) => setTransactionFormData({ ...transactionFormData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_STATUS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={createTransaction.isPending || updateTransaction.isPending}>
                      {selectedTransaction ? "Modifier" : "Créer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rapprochement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-center">
                          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
                          <p className="text-muted-foreground">
                            Commencez par créer votre première transaction.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.label}</TableCell>
                        <TableCell className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const b = getTransactionStatusBadge(transaction.status); return (
                              <Badge variant="outline" className={b.className}>{b.label}</Badge>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          {transaction.matched_expense ? (
                            <div className="text-sm">
                              <Badge variant="outline">Dépense</Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {transaction.matched_expense.description}
                              </div>
                            </div>
                          ) : transaction.matched_rent_invoice ? (
                            <div className="text-sm">
                              <Badge variant="outline">Loyer</Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {transaction.matched_rent_invoice.period_month}/{transaction.matched_rent_invoice.period_year}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
      </Tabs>
    </div>
  )
}
