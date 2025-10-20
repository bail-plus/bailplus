import { useState } from "react"
import { useToast } from "@/hooks/ui/use-toast"
import {
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type ExpenseWithDetails,
  type ExpenseInsert,
} from "@/hooks/accounting/useAccounting"

export function useExpenseManagement() {
  const { toast } = useToast()
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithDetails | null>(null)
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

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

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

  return {
    // State
    isExpenseDialogOpen,
    setIsExpenseDialogOpen,
    selectedExpense,
    expenseFormData,
    setExpenseFormData,

    // Handlers
    handleOpenExpenseDialog,
    handleEditExpense,
    handleSubmitExpense,
    handleDeleteExpense,

    // Loading states
    isSubmitting: createExpense.isPending || updateExpense.isPending,
  }
}
