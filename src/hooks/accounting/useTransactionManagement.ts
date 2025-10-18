import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  useCreateBankTransaction,
  useUpdateBankTransaction,
  useDeleteBankTransaction,
  type BankTransactionWithDetails,
  type BankTransactionInsert,
} from "@/hooks/useAccounting"

export function useTransactionManagement() {
  const { toast } = useToast()
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransactionWithDetails | null>(null)

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

  const createTransaction = useCreateBankTransaction()
  const updateTransaction = useUpdateBankTransaction()
  const deleteTransaction = useDeleteBankTransaction()

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

  const handleOpenRevenueDialog = () => {
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
  }

  const handleSubmitRevenue = async (e: React.FormEvent) => {
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
  }

  return {
    // Transaction state
    isTransactionDialogOpen,
    setIsTransactionDialogOpen,
    selectedTransaction,
    transactionFormData,
    setTransactionFormData,

    // Revenue state
    isRevenueDialogOpen,
    setIsRevenueDialogOpen,
    revenueFormData,
    setRevenueFormData,

    // Handlers
    handleOpenTransactionDialog,
    handleEditTransaction,
    handleSubmitTransaction,
    handleDeleteTransaction,
    handleOpenRevenueDialog,
    handleSubmitRevenue,

    // Loading states
    isSubmitting: createTransaction.isPending || updateTransaction.isPending,
  }
}
