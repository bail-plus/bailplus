import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TenantLeaseInfo {
  id: string;
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  charges_amount: number | null;
  status: string | null;
  unit: {
    id: string;
    unit_number: string;
    type: string | null;
    surface: number | null;
    furnished: boolean | null;
    property: {
      id: string;
      name: string;
      address: string;
      city: string | null;
      postal_code: string | null;
    };
  };
  landlord: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
}

export interface TenantDashboardData {
  lease: TenantLeaseInfo | null;
  openTicketsCount: number;
  closedTicketsCount: number;
  totalTicketsCount: number;
}

async function fetchTenantData(): Promise<TenantDashboardData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  console.log('[TENANT DASHBOARD] Fetching data for tenant', user.id);

  // Fetch active lease for this tenant
  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select(`
      id,
      start_date,
      end_date,
      rent_amount,
      charges_amount,
      status,
      user_id,
      unit:units!inner(
        id,
        unit_number,
        type,
        surface,
        furnished,
        property:properties!inner(
          id,
          name,
          address,
          city,
          postal_code,
          user_id
        )
      )
    `)
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .single();

  if (leaseError) {
    console.error('[TENANT DASHBOARD] Error fetching lease:', leaseError);
  }

  let landlordData = null;
  if (lease && lease.user_id) {
    // Fetch landlord info
    const { data: landlord, error: landlordError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, phone_number')
      .eq('user_id', lease.user_id)
      .single();

    if (landlordError) {
      console.error('[TENANT DASHBOARD] Error fetching landlord:', landlordError);
    } else {
      landlordData = landlord;
    }
  }

  // Fetch tickets created by this tenant OR assigned to their lease
  const { data: tickets, error: ticketsError } = await supabase
    .from('maintenance_tickets')
    .select('id, status, created_by')
    .or(`created_by.eq.${user.id},lease_id.eq.${lease?.id || '00000000-0000-0000-0000-000000000000'}`);

  if (ticketsError) {
    console.error('[TENANT DASHBOARD] Error fetching tickets:', ticketsError);
  }

  const ticketsList = tickets || [];
  const openTicketsCount = ticketsList.filter(t => t.status !== 'TERMINE').length;
  const closedTicketsCount = ticketsList.filter(t => t.status === 'TERMINE').length;

  const leaseData: TenantLeaseInfo | null = lease
    ? {
        ...lease,
        unit: Array.isArray(lease.unit) ? lease.unit[0] : lease.unit,
        landlord: landlordData || {
          user_id: lease.user_id,
          first_name: null,
          last_name: null,
          email: null,
          phone_number: null,
        },
      }
    : null;

  console.log('[TENANT DASHBOARD] Data loaded:', {
    hasLease: !!leaseData,
    openTickets: openTicketsCount,
    closedTickets: closedTicketsCount,
  });

  return {
    lease: leaseData as any,
    openTicketsCount,
    closedTicketsCount,
    totalTicketsCount: ticketsList.length,
  };
}

export function useTenantData() {
  return useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: fetchTenantData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
