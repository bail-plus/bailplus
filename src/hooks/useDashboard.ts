import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useEntity } from '@/contexts/EntityContext';

export interface DashboardStats {
  // KPI principaux
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  occupiedUnits: number;
  vacancyRate: number;

  // Finances du mois en cours
  currentMonthRevenue: number; // Revenus encaissés
  currentMonthPending: number; // En attente
  currentMonthExpenses: number;
  currentMonthNet: number;

  // Impayés et maintenance
  overdueAmount: number;
  overdueCount: number;
  maintenanceTicketsOpen: number;

  // Activités récentes
  recentInvoices: Array<{
    id: string;
    total_amount: number;
    status: string;
    period_month: number;
    period_year: number;
    lease?: {
      tenant?: {
        first_name: string;
        last_name: string;
      };
    };
  }>;

  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    property?: {
      name: string;
    };
  }>;

  // Prochaines échéances
  upcomingDueDates: Array<{
    id: string;
    due_date: string;
    total_amount: number;
    status: string;
    lease?: {
      tenant?: {
        first_name: string;
        last_name: string;
      };
    };
  }>;
}

async function fetchDashboardData(entityId?: string | null, showAll?: boolean): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  console.log('[DASHBOARD] Fetching data for user', user.id);
  console.log('[DASHBOARD] Entity filter:', entityId, 'showAll:', showAll);
  console.log('[DASHBOARD] Current month:', currentMonth, currentYear);
  console.log('[DASHBOARD] Filtering enabled:', !showAll && !!entityId);

  // Build property query with entity filter
  let propertiesQuery = supabase
    .from('properties')
    .select('id')
    .eq('user_id', user.id);

  if (!showAll && entityId) {
    propertiesQuery = propertiesQuery.eq('entity_id', entityId);
  }

  // Fetch all data in parallel
  const [
    propertiesResult,
    unitsResult,
    leasesResult,
    invoicesResult,
    expensesResult,
    ticketsResult,
    upcomingResult,
    bankTransactionsResult,
    recentInvoicesResult
  ] = await Promise.all([
    // Properties
    propertiesQuery,

    // Units
    supabase
      .from('units')
      .select('id, property_id, properties!inner(user_id)')
      .eq('properties.user_id', user.id),

    // Active leases
    supabase
      .from('leases')
      .select(`
        id,
        status,
        start_date,
        end_date,
        tenant_id,
        unit_id
      `)
      .eq('user_id', user.id)
      .eq('status', 'active'),

    // Invoices for current month (for stats)
    supabase
      .from('rent_invoices')
      .select(`
        id,
        total_amount,
        status,
        period_month,
        period_year,
        created_at,
        lease_id,
        lease:leases!rent_invoices_lease_id_fkey (
          tenant_id,
          tenant:profiles!leases_tenant_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear)
      .order('created_at', { ascending: false }),

    // Expenses for current month
    supabase
      .from('expenses')
      .select('amount, property_id')
      .eq('user_id', user.id)
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd),

    // Open maintenance tickets
    supabase
      .from('maintenance_tickets')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        property:properties!maintenance_tickets_property_id_fkey (
          name
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['NOUVEAU', 'EN COURS'])
      .order('created_at', { ascending: false })
      .limit(5),

    // Upcoming due dates (next 7 days)
    supabase
      .from('rent_invoices')
      .select(`
        id,
        due_date,
        total_amount,
        status,
        lease_id,
        lease:leases!rent_invoices_lease_id_fkey (
          tenant_id,
          tenant:profiles!leases_tenant_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['pending', 'overdue'])
      .gte('due_date', format(now, 'yyyy-MM-dd'))
      .lte('due_date', format(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      .order('due_date', { ascending: true })
      .limit(5),

    // Bank transactions for current month (positive amounts = income)
    supabase
      .from('bank_transactions')
      .select('amount, matched_rent_invoice_id, matched_expense_id, status')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .gt('amount', 0), // Only positive amounts (income)

    // Recent invoices (all, not just current month)
    supabase
      .from('rent_invoices')
      .select(`
        id,
        total_amount,
        status,
        period_month,
        period_year,
        created_at,
        lease_id,
        lease:leases!rent_invoices_lease_id_fkey (
          tenant_id,
          tenant:profiles!leases_tenant_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  // Check for errors
  if (propertiesResult.error) console.error('[DASHBOARD] Error properties:', propertiesResult.error);
  if (unitsResult.error) console.error('[DASHBOARD] Error units:', unitsResult.error);
  if (leasesResult.error) console.error('[DASHBOARD] Error leases:', leasesResult.error);
  if (invoicesResult.error) console.error('[DASHBOARD] Error invoices:', invoicesResult.error);
  if (expensesResult.error) console.error('[DASHBOARD] Error expenses:', expensesResult.error);
  if (ticketsResult.error) console.error('[DASHBOARD] Error tickets:', ticketsResult.error);
  if (bankTransactionsResult.error) console.error('[DASHBOARD] Error bank transactions:', bankTransactionsResult.error);
  if (recentInvoicesResult.error) console.error('[DASHBOARD] Error recent invoices:', recentInvoicesResult.error);

  const properties = propertiesResult.data || [];
  const propertyIds = properties.map(p => p.id);

  // Filter data to only include items related to filtered properties
  const allUnits = unitsResult.data || [];
  const units = showAll || !entityId ? allUnits : allUnits.filter(u => propertyIds.includes(u.property_id));

  const allLeases = leasesResult.data || [];
  const unitIds = units.map(u => u.id);
  const leases = showAll || !entityId ? allLeases : allLeases.filter(l => unitIds.includes(l.unit_id));

  const leaseIds = leases.map(l => l.id);
  const allInvoices = invoicesResult.data || [];
  const invoices = showAll || !entityId ? allInvoices : allInvoices.filter(inv => inv.lease_id && leaseIds.includes(inv.lease_id));

  const allExpenses = expensesResult.data || [];
  const expenses = showAll || !entityId ? allExpenses : allExpenses.filter(e => !e.property_id || propertyIds.includes(e.property_id));

  const allTickets = ticketsResult.data || [];
  const tickets = showAll || !entityId ? allTickets : allTickets.filter(t => propertyIds.includes(t.property_id));

  const allUpcoming = upcomingResult.data || [];
  const upcoming = showAll || !entityId ? allUpcoming : allUpcoming.filter(inv => inv.lease_id && leaseIds.includes(inv.lease_id));

  // Filter bank transactions by entity
  const allBankTransactions = bankTransactionsResult.data || [];
  // For entity filtering: only include matched transactions related to filtered invoices/expenses
  // Unmatched transactions are included only in "show all" mode
  const invoiceIds = invoices.map(inv => inv.id);
  const expenseIds = expenses.map(exp => exp.id);
  const bankTransactions = showAll || !entityId
    ? allBankTransactions
    : allBankTransactions.filter(tx => {
        // Include matched transactions if their invoice/expense is in scope
        if (tx.status === 'matched') {
          if (tx.matched_rent_invoice_id && invoiceIds.includes(tx.matched_rent_invoice_id)) return true;
          if (tx.matched_expense_id && expenseIds.includes(tx.matched_expense_id)) return true;
          return false;
        }
        // Exclude unmatched transactions when filtering by entity
        return false;
      });

  const allRecentInvoices = recentInvoicesResult.data || [];
  const recentInvoices = showAll || !entityId ? allRecentInvoices : allRecentInvoices.filter(inv => inv.lease_id && leaseIds.includes(inv.lease_id));

  console.log('[DASHBOARD] Entity filtering results:', {
    totalProperties: properties.length,
    totalUnits: units.length,
    totalLeases: leases.length,
    filteredPropertyIds: propertyIds.length,
    filteredUnitIds: unitIds.length,
    filteredLeaseIds: leaseIds.length,
    filteredInvoices: invoices.length,
    filteredExpenses: expenses.length,
    filteredTickets: tickets.length,
    filteredBankTransactions: bankTransactions.length,
    allBankTransactions: allBankTransactions.length
  });

  // Calculate active leases (within date range)
  const activeLeases = leases.filter(lease => {
    const start = new Date(lease.start_date);
    const end = lease.end_date ? new Date(lease.end_date) : null;
    return start <= now && (!end || end >= now);
  });

  const occupiedUnits = activeLeases.length;
  const totalUnits = units.length;
  const vacancyRate = totalUnits > 0 ? Math.round(((totalUnits - occupiedUnits) / totalUnits) * 100) : 0;

  // Calculate unique tenants
  const uniqueTenants = new Set(activeLeases.map(l => l.tenant_id)).size;

  // Calculate finances for current month
  // Revenue from paid invoices
  const invoiceRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  // Revenue from bank transactions (INCOME type)
  const bankRevenue = bankTransactions
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Total revenue = invoices + bank transactions
  const currentMonthRevenue = invoiceRevenue + bankRevenue;

  const currentMonthPending = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

  const currentMonthExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const currentMonthNet = currentMonthRevenue - currentMonthExpenses;

  console.log('[DASHBOARD] Stats calculated:', {
    totalProperties: properties.length,
    totalUnits,
    occupiedUnits,
    vacancyRate,
    invoiceRevenue,
    bankRevenue,
    currentMonthRevenue,
    currentMonthPending,
    overdueAmount,
    maintenanceTicketsOpen: tickets.length
  });

  return {
    totalProperties: properties.length,
    totalUnits,
    totalTenants: uniqueTenants,
    occupiedUnits,
    vacancyRate,
    currentMonthRevenue,
    currentMonthPending,
    currentMonthExpenses,
    currentMonthNet,
    overdueAmount,
    overdueCount,
    maintenanceTicketsOpen: tickets.length,
    recentInvoices: recentInvoices.slice(0, 5) as any,
    recentTickets: tickets as any,
    upcomingDueDates: upcoming as any
  };
}

export function useDashboard() {
  const { selectedEntity, showAll } = useEntity();

  return useQuery({
    queryKey: ['dashboard', selectedEntity?.id, showAll],
    queryFn: () => fetchDashboardData(selectedEntity?.id, showAll),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
