import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useEntity } from '@/contexts/EntityContext';

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

async function fetchExpenses(entityId?: string | null, showAll?: boolean): Promise<ExpenseWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Si une entité est sélectionnée, récupérer les property_ids de cette entité
  let propertyIds: string[] = []
  if (!showAll && entityId) {
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)

    propertyIds = properties?.map(p => p.id) || []

    if (propertyIds.length === 0) {
      return [] // Aucune propriété pour cette entité
    }
  }

  let expensesQuery = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)

  // Filtrer par property_id si une entité est sélectionnée
  if (!showAll && entityId && propertyIds.length > 0) {
    expensesQuery = expensesQuery.in('property_id', propertyIds)
  }

  const { data: expenses, error } = await expensesQuery
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

async function fetchRentInvoices(entityId?: string | null, showAll?: boolean): Promise<RentInvoiceWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Si une entité est sélectionnée, filtrer via properties → units → leases
  let unitIds: string[] = []
  if (!showAll && entityId) {
    // 1. Récupérer les properties de l'entité
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)

    const propertyIds = properties?.map(p => p.id) || []

    if (propertyIds.length === 0) {
      return [] // Aucune propriété pour cette entité
    }

    // 2. Récupérer les units de ces properties
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .in('property_id', propertyIds)

    unitIds = units?.map(u => u.id) || []

    if (unitIds.length === 0) {
      return [] // Aucun logement pour ces propriétés
    }
  }

  // Get all leases for the user (avec filtre optionnel)
  let leasesQuery = supabase
    .from('leases')
    .select('id')
    .eq('user_id', user.id)

  // Filtrer par unit_ids si une entité est sélectionnée
  if (!showAll && entityId && unitIds.length > 0) {
    leasesQuery = leasesQuery.in('unit_id', unitIds)
  }

  const { data: leases, error: leasesError } = await leasesQuery

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
          profiles!leases_tenant_id_fkey (
            first_name,
            last_name,
            email
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
          tenant: (lease as any)?.profiles ? {
            first_name: (lease as any).profiles.first_name,
            last_name: (lease as any).profiles.last_name,
            email: (lease as any).profiles.email,
          } : null
        } as any,
      };
    })
  );

  return enrichedInvoices;
}

async function updateRentInvoice({ id, ...updates }: RentInvoiceUpdate & { id: string }): Promise<RentInvoice> {
  const { data, error } = await supabase
    .from('rent_invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['expenses', selectedEntity?.id, showAll],
    queryFn: () => fetchExpenses(selectedEntity?.id, showAll),
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
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['rent-invoices', selectedEntity?.id, showAll],
    queryFn: () => fetchRentInvoices(selectedEntity?.id, showAll),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateRentInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRentInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-invoices'] });
    },
  });
}

// Bank Transactions (pas de filtre d'entité car non liées directement aux propriétés)
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
