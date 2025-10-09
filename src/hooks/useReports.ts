import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format } from 'date-fns';
import { useEntity } from '@/contexts/EntityContext';

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  vacancyRate: number;
  overdueAmount: number;
  pendingAmount: number; // Nouveau: montant en attente de paiement
  date: Date;
}

export interface ReportData {
  totalRent: number;
  totalExpenses: number;
  vacancyRate: number;
  overdueAmount: number;
  pendingAmount: number; // Nouveau: total des factures en attente
  propertiesCount: number;
  occupiedUnits: number;
  totalUnits: number;
  monthlyData: MonthlyData[];
  expensesByCategory: { category: string; amount: number; }[];
}

async function fetchReportData(months: number = 6, entityId?: string | null, showAll?: boolean): Promise<ReportData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const startDate = startOfMonth(subMonths(new Date(), months));
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth() + 1; // 1-12

  console.log('[REPORTS] Fetching data from', format(startDate, 'yyyy-MM-dd'), 'for user', user.id);
  console.log('[REPORTS] Period filter:', { startYear, startMonth }, 'entityId:', entityId, 'showAll:', showAll);

  // Si une entité est sélectionnée, récupérer les IDs à filtrer
  let propertyIds: string[] = []
  let unitIds: string[] = []
  let leaseIds: string[] = []

  if (!showAll && entityId) {
    // 1. Récupérer les properties de l'entité
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .eq('entity_id', entityId)

    propertyIds = properties?.map(p => p.id) || []

    if (propertyIds.length === 0) {
      // Aucune propriété pour cette entité - retourner données vides
      return {
        totalRent: 0,
        totalExpenses: 0,
        vacancyRate: 0,
        overdueAmount: 0,
        pendingAmount: 0,
        propertiesCount: 0,
        occupiedUnits: 0,
        totalUnits: 0,
        monthlyData: [],
        expensesByCategory: []
      }
    }

    // 2. Récupérer les units de ces properties
    const { data: units } = await supabase
      .from('units')
      .select('id')
      .in('property_id', propertyIds)

    unitIds = units?.map(u => u.id) || []

    if (unitIds.length > 0) {
      // 3. Récupérer les leases de ces units
      const { data: leases } = await supabase
        .from('leases')
        .select('id')
        .in('unit_id', unitIds)

      leaseIds = leases?.map(l => l.id) || []
    }
  }

  // Fetch all data in parallel avec filtres optionnels
  let rentQuery = supabase
    .from('rent_invoices')
    .select('total_amount, status, due_date, paid_date, period_month, period_year, lease_id')
    .eq('user_id', user.id)
    .or(`period_year.gt.${startYear},and(period_year.eq.${startYear},period_month.gte.${startMonth})`)

  if (!showAll && entityId && leaseIds.length > 0) {
    rentQuery = rentQuery.in('lease_id', leaseIds)
  }

  let expensesQuery = supabase
    .from('expenses')
    .select('amount, expense_date, category')
    .eq('user_id', user.id)
    .gte('expense_date', format(startDate, 'yyyy-MM-dd'))

  if (!showAll && entityId && propertyIds.length > 0) {
    expensesQuery = expensesQuery.in('property_id', propertyIds)
  }

  let propertiesQuery = supabase
    .from('properties')
    .select('id')
    .eq('user_id', user.id)

  if (!showAll && entityId) {
    propertiesQuery = propertiesQuery.eq('entity_id', entityId)
  }

  let unitsQuery = supabase
    .from('units')
    .select('id, property_id, properties!inner(user_id)')
    .eq('properties.user_id', user.id)

  if (!showAll && entityId && propertyIds.length > 0) {
    unitsQuery = unitsQuery.in('property_id', propertyIds)
  }

  let leasesQuery = supabase
    .from('leases')
    .select('id, unit_id, status, start_date, end_date')
    .eq('user_id', user.id)

  if (!showAll && entityId && unitIds.length > 0) {
    leasesQuery = leasesQuery.in('unit_id', unitIds)
  }

  const [rentResult, expensesResult, propertiesResult, unitsResult, leasesResult] = await Promise.all([
    rentQuery,
    expensesQuery,
    propertiesQuery,
    unitsQuery,
    leasesQuery
  ]);

  // Check for errors
  if (rentResult.error) console.error('[REPORTS] Error fetching rent_invoices:', rentResult.error);
  if (expensesResult.error) console.error('[REPORTS] Error fetching expenses:', expensesResult.error);
  if (propertiesResult.error) console.error('[REPORTS] Error fetching properties:', propertiesResult.error);
  if (unitsResult.error) console.error('[REPORTS] Error fetching units:', unitsResult.error);
  if (leasesResult.error) console.error('[REPORTS] Error fetching leases:', leasesResult.error);

  const rentInvoices = rentResult.data || [];
  const expenses = expensesResult.data || [];
  const properties = propertiesResult.data || [];
  const units = unitsResult.data || [];
  const leases = leasesResult.data || [];

  console.log('[REPORTS] Data fetched:', {
    rentInvoices: rentInvoices.length,
    expenses: expenses.length,
    properties: properties.length,
    units: units.length,
    leases: leases.length
  });

  // Calculate totals
  const totalRent = rentInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const overdueAmount = rentInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const pendingAmount = rentInvoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  // Total invoiced (all statuses)
  const totalInvoiced = rentInvoices
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  console.log('[REPORTS] Financial summary:', {
    totalRent,
    totalInvoiced,
    totalExpenses,
    overdueAmount,
    pendingAmount
  });

  // Calculate vacancy
  const activeLeases = leases.filter(lease => {
    const now = new Date();
    const start = new Date(lease.start_date);
    const end = lease.end_date ? new Date(lease.end_date) : null;
    return lease.status === 'active' && start <= now && (!end || end >= now);
  });

  const occupiedUnits = activeLeases.length;
  const totalUnits = units.filter((u: any) => u.properties?.user_id === user.id).length;
  const vacancyRate = totalUnits > 0 ? Math.round(((totalUnits - occupiedUnits) / totalUnits) * 100) : 0;

  // Calculate monthly data
  const monthlyDataMap = new Map<string, MonthlyData>();

  for (let i = 0; i < months; i++) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'yyyy-MM');
    monthlyDataMap.set(monthKey, {
      month: format(date, 'MMM'),
      income: 0,
      expenses: 0,
      net: 0,
      vacancyRate: 0,
      overdueAmount: 0,
      pendingAmount: 0,
      date
    });
  }

  // Aggregate rent income by month (based on period_month/period_year, not paid_date)
  rentInvoices.forEach(invoice => {
    // Use period_month and period_year to determine which month this invoice belongs to
    const year = invoice.period_year;
    const month = invoice.period_month;

    // Create the monthKey in format 'YYYY-MM'
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = monthlyDataMap.get(monthKey);

    if (monthData) {
      // Only count as income if actually paid
      if (invoice.status === 'paid') {
        monthData.income += invoice.total_amount || 0;
      }
      // Note: Pending invoices are not counted as income yet
      // They will be counted when status changes to 'paid'
    }
  });

  // Aggregate expenses by month
  expenses.forEach(expense => {
    const monthKey = format(new Date(expense.expense_date), 'yyyy-MM');
    const monthData = monthlyDataMap.get(monthKey);
    if (monthData) {
      monthData.expenses += expense.amount || 0;
    }
  });

  // Calculate overdue and pending for each month (based on period_month/period_year)
  rentInvoices.forEach(invoice => {
    const year = invoice.period_year;
    const month = invoice.period_month;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthData = monthlyDataMap.get(monthKey);

    if (monthData) {
      if (invoice.status === 'overdue') {
        monthData.overdueAmount += invoice.total_amount || 0;
      } else if (invoice.status === 'pending') {
        monthData.pendingAmount += invoice.total_amount || 0;
      }
    }
  });

  const monthlyData = Array.from(monthlyDataMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(data => ({
      ...data,
      net: data.income - data.expenses
    }));

  // Calculate expenses by category
  const expensesByCategoryMap = new Map<string, number>();
  expenses.forEach(expense => {
    const category = expense.category || 'Autres';
    expensesByCategoryMap.set(
      category,
      (expensesByCategoryMap.get(category) || 0) + (expense.amount || 0)
    );
  });

  const expensesByCategory = Array.from(expensesByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalRent,
    totalExpenses,
    vacancyRate,
    overdueAmount,
    pendingAmount,
    propertiesCount: properties.length,
    occupiedUnits,
    totalUnits,
    monthlyData,
    expensesByCategory
  };
}

export function useReports(months: number = 6) {
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['reports', months, selectedEntity?.id, showAll],
    queryFn: () => fetchReportData(months, selectedEntity?.id, showAll),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
