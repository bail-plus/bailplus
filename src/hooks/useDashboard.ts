import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
    amount: number;
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

async function fetchDashboardData(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  console.log('[DASHBOARD] Fetching data for user', user.id);
  console.log('[DASHBOARD] Current month:', currentMonth, currentYear);

  // Fetch all data in parallel
  const [
    propertiesResult,
    unitsResult,
    leasesResult,
    invoicesResult,
    expensesResult,
    ticketsResult,
    upcomingResult,
    bankTransactionsResult
  ] = await Promise.all([
    // Properties
    supabase
      .from('properties')
      .select('id')
      .eq('user_id', user.id),

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
        tenant_id
      `)
      .eq('user_id', user.id)
      .eq('status', 'active'),

    // Invoices for current month
    supabase
      .from('rent_invoices')
      .select(`
        id,
        total_amount,
        status,
        period_month,
        period_year,
        created_at,
        lease:leases!rent_invoices_lease_id_fkey (
          tenant:contacts!leases_tenant_id_fkey (
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
      .select('amount')
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
      .eq('created_by', user.id)
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
        lease:leases!rent_invoices_lease_id_fkey (
          tenant:contacts!leases_tenant_id_fkey (
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
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .gt('amount', 0) // Only positive amounts (income)
  ]);

  // Check for errors
  if (propertiesResult.error) console.error('[DASHBOARD] Error properties:', propertiesResult.error);
  if (unitsResult.error) console.error('[DASHBOARD] Error units:', unitsResult.error);
  if (leasesResult.error) console.error('[DASHBOARD] Error leases:', leasesResult.error);
  if (invoicesResult.error) console.error('[DASHBOARD] Error invoices:', invoicesResult.error);
  if (expensesResult.error) console.error('[DASHBOARD] Error expenses:', expensesResult.error);
  if (ticketsResult.error) console.error('[DASHBOARD] Error tickets:', ticketsResult.error);
  if (bankTransactionsResult.error) console.error('[DASHBOARD] Error bank transactions:', bankTransactionsResult.error);

  const properties = propertiesResult.data || [];
  const units = unitsResult.data || [];
  const leases = leasesResult.data || [];
  const invoices = invoicesResult.data || [];
  const expenses = expensesResult.data || [];
  const tickets = ticketsResult.data || [];
  const upcoming = upcomingResult.data || [];
  const bankTransactions = bankTransactionsResult.data || [];

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
    recentInvoices: invoices.slice(0, 5) as any,
    recentTickets: tickets as any,
    upcomingDueDates: upcoming as any
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
