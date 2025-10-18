import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useExpenses,
  useRentInvoices,
  useBankTransactions,
} from "@/hooks/useAccounting"
import { usePropertiesWithUnits } from "@/hooks/useProperties"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { FinancialStats } from "@/components/accounting/FinancialStats"
import { ExpenseForm } from "@/components/accounting/ExpenseForm"
import { ExpensesList } from "@/components/accounting/ExpensesList"
import { ExpensesFilters } from "@/components/accounting/ExpensesFilters"
import { TransactionForm } from "@/components/accounting/TransactionForm"
import { TransactionsList } from "@/components/accounting/TransactionsList"
import { RentInvoicesList } from "@/components/accounting/RentInvoicesList"
import { RevenueForm } from "@/components/accounting/RevenueForm"
import { useExpenseManagement } from "@/hooks/accounting/useExpenseManagement"
import { useTransactionManagement } from "@/hooks/accounting/useTransactionManagement"
import { useInvoiceManagement } from "@/hooks/accounting/useInvoiceManagement"
import { useAccountingStats } from "@/hooks/accounting/useAccountingStats"

export default function Accounting() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { data: expenses = [], isLoading: expensesLoading } = useExpenses()
  const { data: rentInvoices = [], isLoading: invoicesLoading } = useRentInvoices()
  const { data: transactions = [], isLoading: transactionsLoading } = useBankTransactions()
  const { data: properties = [] } = usePropertiesWithUnits()

  // Custom hooks for business logic
  const expenseManagement = useExpenseManagement()
  const transactionManagement = useTransactionManagement()
  const invoiceManagement = useInvoiceManagement(rentInvoices)
  const stats = useAccountingStats(rentInvoices, expenses, transactions)

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

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.property?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter

    return matchesSearch && matchesCategory
  })

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
      <FinancialStats
        totalRevenue={stats.totalRevenue}
        totalExpenses={stats.totalExpenses}
        balance={stats.balance}
        pendingRevenue={stats.pendingRevenue}
        pendingExpenses={stats.pendingExpenses}
      />

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
            <ExpensesFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
            />

            <ExpenseForm
              isOpen={expenseManagement.isExpenseDialogOpen}
              onOpenChange={expenseManagement.setIsExpenseDialogOpen}
              formData={expenseManagement.expenseFormData}
              onFormDataChange={expenseManagement.setExpenseFormData}
              selectedExpense={expenseManagement.selectedExpense}
              onSubmit={expenseManagement.handleSubmitExpense}
              properties={properties}
              isSubmitting={expenseManagement.isSubmitting}
            />
          </div>

          <ExpensesList
            expenses={filteredExpenses}
            onEdit={expenseManagement.handleEditExpense}
            onDelete={expenseManagement.handleDeleteExpense}
          />
        </TabsContent>

        {/* REVENUES TAB */}
        <TabsContent value="revenues" className="space-y-4">
          <RevenueForm
            isOpen={transactionManagement.isRevenueDialogOpen}
            onOpenChange={transactionManagement.setIsRevenueDialogOpen}
            formData={transactionManagement.revenueFormData}
            onFormDataChange={transactionManagement.setRevenueFormData}
            onSubmit={transactionManagement.handleSubmitRevenue}
            isSubmitting={transactionManagement.isSubmitting}
            onOpenDialog={transactionManagement.handleOpenRevenueDialog}
          />
        </TabsContent>

        {/* LOYERS TAB */}
        <TabsContent value="loyers" className="space-y-4">
          <RentInvoicesList
            rentInvoices={rentInvoices}
            onMarkPaid={invoiceManagement.handleMarkInvoicePaid}
            onDownloadReceipt={invoiceManagement.handleDownloadReceipt}
            isPending={invoiceManagement.isPending}
          />
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center justify-end">
            <TransactionForm
              isOpen={transactionManagement.isTransactionDialogOpen}
              onOpenChange={transactionManagement.setIsTransactionDialogOpen}
              formData={transactionManagement.transactionFormData}
              onFormDataChange={transactionManagement.setTransactionFormData}
              selectedTransaction={transactionManagement.selectedTransaction}
              onSubmit={transactionManagement.handleSubmitTransaction}
              isSubmitting={transactionManagement.isSubmitting}
            />
          </div>

          <TransactionsList
            transactions={transactions}
            onEdit={transactionManagement.handleEditTransaction}
            onDelete={transactionManagement.handleDeleteTransaction}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
