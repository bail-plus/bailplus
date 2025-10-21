import { useMemo } from "react"

interface RentInvoice {
  status: string | null
  total_amount: number
}

interface Expense {
  status: string | null
  amount: number
}

interface Transaction {
  amount: number
  status: string | null
}

export function useAccountingStats(
  rentInvoices: RentInvoice[],
  expenses: Expense[],
  transactions: Transaction[]
) {
  return useMemo(() => {
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
}
