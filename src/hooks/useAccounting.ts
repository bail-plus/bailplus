import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Expense = Tables<'expenses'>;
export type ExpenseInsert = TablesInsert<'expenses'>;
export type ExpenseUpdate = TablesUpdate<'expenses'>;

export type RentInvoice = Tables<'rent_invoices'>;
export type RentInvoiceInsert = TablesInsert<'rent_invoices'>;
export type RentInvoiceUpdate = TablesUpdate<'rent_invoices'>;

export type BankTransaction = Tables<'bank_transactions'>;
export type BankTransactionInsert = TablesInsert<'bank_transactions'>;
export type BankTransactionUpdate = TablesUpdate<'bank_transactions'>;

// Extended types with related data
export type ExpenseWithDetails = Expense & {
  property?: {
    name: string;
    address: string;
  };
  unit?: {
    unit_number: string;
  };
};

export type RentInvoiceWithDetails = RentInvoice & {
  lease?: {
    unit_id: string;
    tenant_id: string;
    unit?: {
      unit_number: string;
      property?: {
        name: string;
      };
    };
    tenant?: {
      first_name: string;
      last_name: string;
    };
  };
};

export type BankTransactionWithDetails = BankTransaction & {
  matched_expense?: {
    description: string;
    category: string | null;
  };
  matched_rent_invoice?: {
    period_month: number;
    period_year: number;
  };
};

/* =======================
   EXPENSES
   ======================= */

async function fetchExpenses(): Promise<ExpenseWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false });

  if (error) throw new Error(error.message);
  if (!expenses) return [];

  // Enrich with property and unit data
  const enrichedExpenses = await Promise.all(
    expenses.map(async (expense) => {
      let property = null;
      let unit = null;

      if (expense.property_id) {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('name, address')
          .eq('id', expense.property_id)
          .single();
        property = propertyData;
      }

      if (expense.unit_id) {
        const { data: unitData } = await supabase
          .from('units')
          .select('unit_number')
          .eq('id', expense.unit_id)
          .single();
        unit = unitData;
      }

      return {
        ...expense,
        property: property as any,
        unit: unit as any,
      };
    })
  );

  return enrichedExpenses;
}

async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expense,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function updateExpense({ id, ...updates }: ExpenseUpdate & { id: string }): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/* =======================
   RENT INVOICES
   ======================= */

async function fetchRentInvoices(): Promise<RentInvoiceWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Get all leases for the user
  const { data: leases, error: leasesError } = await supabase
    .from('leases')
    .select('id')
    .eq('user_id', user.id);

  if (leasesError) throw new Error(leasesError.message);
  if (!leases || leases.length === 0) return [];

  const leaseIds = leases.map(l => l.id);

  const { data: invoices, error } = await supabase
    .from('rent_invoices')
    .select('*')
    .in('lease_id', leaseIds)
    .order('due_date', { ascending: false });

  if (error) throw new Error(error.message);
  if (!invoices) return [];

  // Enrich with lease data
  const enrichedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      const { data: lease } = await supabase
        .from('leases')
        .select(`
          unit_id,
          tenant_id,
          units (
            unit_number,
            properties (
              name
            )
          ),
          contacts (
            first_name,
            last_name
          )
        `)
        .eq('id', invoice.lease_id)
        .single();

      return {
        ...invoice,
        lease: {
          unit_id: lease?.unit_id,
          tenant_id: lease?.tenant_id,
          unit: lease?.units ? {
            unit_number: (lease.units as any).unit_number,
            property: (lease.units as any).properties ? {
              name: ((lease.units as any).properties as any).name
            } : null
          } : null,
          tenant: lease?.contacts ? {
            first_name: (lease.contacts as any).first_name,
            last_name: (lease.contacts as any).last_name
          } : null
        } as any,
      };
    })
  );

  return enrichedInvoices;
}

/* =======================
   BANK TRANSACTIONS
   ======================= */

async function fetchBankTransactions(): Promise<BankTransactionWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: transactions, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  if (!transactions) return [];

  // Enrich with matched expense/invoice data
  const enrichedTransactions = await Promise.all(
    transactions.map(async (transaction) => {
      let matched_expense = null;
      let matched_rent_invoice = null;

      if (transaction.matched_expense_id) {
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('description, category')
          .eq('id', transaction.matched_expense_id)
          .single();
        matched_expense = expenseData;
      }

      if (transaction.matched_rent_invoice_id) {
        const { data: invoiceData } = await supabase
          .from('rent_invoices')
          .select('period_month, period_year')
          .eq('id', transaction.matched_rent_invoice_id)
          .single();
        matched_rent_invoice = invoiceData;
      }

      return {
        ...transaction,
        matched_expense: matched_expense as any,
        matched_rent_invoice: matched_rent_invoice as any,
      };
    })
  );

  return enrichedTransactions;
}

async function createBankTransaction(transaction: BankTransactionInsert): Promise<BankTransaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('bank_transactions')
    .insert({
      ...transaction,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function updateBankTransaction({ id, ...updates }: BankTransactionUpdate & { id: string }): Promise<BankTransaction> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteBankTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_transactions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/* =======================
   HOOKS
   ======================= */

// Expenses
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// Rent Invoices
export function useRentInvoices() {
  return useQuery({
    queryKey: ['rent-invoices'],
    queryFn: fetchRentInvoices,
    staleTime: 5 * 60 * 1000,
  });
}

// Bank Transactions
export function useBankTransactions() {
  return useQuery({
    queryKey: ['bank-transactions'],
    queryFn: fetchBankTransactions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBankTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

export function useUpdateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBankTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

export function useDeleteBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBankTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}
