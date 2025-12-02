import { supabase } from "@/integrations/supabase/client"

/**
 * Resolves lease_id and tenant_user_id for a given unit
 * Supports both old (tenant_id) and new (tenant_user_id) schema
 */
export async function resolveLeaseTenantInfo(
  unitId: string | undefined | null,
  existingTenantUserId?: string | null
): Promise<{ leaseId: string | null; tenantUserId: string | null }> {
  let resolvedLeaseId: string | null = null
  let resolvedTenantUserId: string | null = existingTenantUserId || null

  if (!unitId || unitId === 'none') {
    return { leaseId: null, tenantUserId: null }
  }

  // Try new schema (tenant_user_id)
  const q1 = await supabase
    .from('leases')
    .select('id, tenant_user_id, status')
    .eq('unit_id', unitId)
    .in('status', ['active', 'ACTIVE'])
    .maybeSingle()

  if (q1.error) {
    console.debug('[TENANT_RESOLVER] leases (tenant_user_id) not available, fallback to tenant_id')
  }

  let activeLease: any = q1.data

  if (!activeLease) {
    // Try old schema (tenant_id)
    const q2 = await supabase
      .from('leases')
      .select('id, tenant_id, status')
      .eq('unit_id', unitId)
      .in('status', ['active', 'ACTIVE'])
      .maybeSingle()

    if (q2.error) {
      console.debug('[TENANT_RESOLVER] leases (tenant_id) also unavailable')
    }

    activeLease = q2.data
    if (activeLease?.tenant_id && !resolvedTenantUserId) {
      resolvedTenantUserId = activeLease.tenant_id as string
    }
  } else {
    resolvedTenantUserId = activeLease.tenant_user_id || resolvedTenantUserId
  }

  console.log('[TENANT_RESOLVER] Lookup active lease for unit', unitId, '=>', activeLease)

  if (activeLease) {
    resolvedLeaseId = activeLease.id
    console.log('[TENANT_RESOLVER] Using tenant_user_id:', resolvedTenantUserId)
  }

  return {
    leaseId: resolvedLeaseId,
    tenantUserId: resolvedTenantUserId,
  }
}
