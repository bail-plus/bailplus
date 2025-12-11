import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { useEntity } from "@/contexts/EntityContext"
import { useAuth } from "@/hooks/auth/useAuth"
import type { Tables } from "@/integrations/supabase/types"

type EventRow = Tables<"events">

export type CalendarItem = {
  id: string
  source: "event" | "rent" | "ticket"
  title: string
  start_date: string
  start_time?: string | null
  end_date?: string | null
  end_time?: string | null
  event_type: string
  location?: string | null
  attendees?: string | null
  status?: string | null
  description?: string | null
  meta?: {
    property?: string | null
    amount?: number | null
    tenant?: string | null
  }
}

export function useCalendarEvents(currentMonth: Date, logPrefix: string = "[CALENDAR]") {
  const { selectedEntity, showAll } = useEntity()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['calendar-events', user?.id, selectedEntity?.id, showAll, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      console.log(`${logPrefix} Loading events for month:`, format(currentMonth, 'yyyy-MM'))

      if (!user) {
        console.log(`${logPrefix} No user, skipping load`)
        return { events: [], extraEvents: [] }
      }

      console.log(`${logPrefix} User ID:`, user.id)

      // Filtrage par entité => propriété
      let propertyIds: string[] = []
      if (!showAll && selectedEntity) {
        const { data: props } = await supabase
          .from('properties')
          .select('id')
          .eq('entity_id', selectedEntity.id)
        propertyIds = props?.map(p => p.id) || []
      }

      const rangeStart = format(startOfMonth(currentMonth), "yyyy-MM-dd")
      const rangeEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd")
      console.log(`${logPrefix} Date range:`, rangeStart, 'to', rangeEnd)

      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', rangeStart)
        .lte('start_date', rangeEnd)

      if (!showAll && selectedEntity && propertyIds.length > 0) {
        console.log(`${logPrefix} Filtering by property_ids:`, propertyIds)
        query = query.or(`property_id.in.(${propertyIds.join(',')}),property_id.is.null`)
      }

      const { data, error } = await query.order('start_date').order('start_time', { nullsFirst: false })

      if (error) {
        console.error(`${logPrefix} Error loading events:`, error)
        throw error
      }

      console.log(`${logPrefix} Events loaded:`, data?.length || 0, 'events', data)
      const events = data || []

      // Charger les loyers dus dans le mois
      const { data: rentData, error: rentError } = await supabase
        .from('rent_invoices')
        .select(`
          id,
          due_date,
          status,
          total_amount,
          period_month,
          period_year,
          lease:leases!rent_invoices_lease_id_fkey (
            tenant:profiles!leases_tenant_id_fkey ( first_name, last_name ),
            units:units!leases_unit_id_fkey (
              unit_number,
              properties ( id, name )
            )
          )
        `)
        .gte('due_date', rangeStart)
        .lte('due_date', rangeEnd)
        .order('due_date', { ascending: true })

      if (rentError) throw rentError

      const rentItems: CalendarItem[] = (rentData || [])
        .filter((inv: any) => {
          if (!showAll && selectedEntity && propertyIds.length > 0) {
            const pid = inv.lease?.units?.properties?.id
            return pid ? propertyIds.includes(pid) : false
          }
          return true
        })
        .map((inv: any) => ({
          id: inv.id,
          source: "rent",
          title: `Loyer ${inv.period_month}/${inv.period_year}`,
          start_date: inv.due_date,
          start_time: null,
          end_date: inv.due_date,
          end_time: null,
          event_type: "rent_due",
          status: inv.status,
          location: inv.lease?.units?.properties?.name || null,
          attendees: inv.lease?.tenant ? `${inv.lease.tenant.first_name || ""} ${inv.lease.tenant.last_name || ""}`.trim() : null,
          meta: {
            property: inv.lease?.units?.properties?.name || null,
            amount: inv.total_amount,
            tenant: inv.lease?.tenant ? `${inv.lease.tenant.first_name || ""} ${inv.lease.tenant.last_name || ""}`.trim() : null,
          },
        }))

      // Charger les tickets maintenance du mois
      let ticketsQuery = supabase
        .from('maintenance_tickets')
        .select(`
          id,
          title,
          status,
          estimated_resolution_date,
          created_at,
          property:properties ( id, name )
        `)

      if (!showAll && selectedEntity && propertyIds.length > 0) {
        ticketsQuery = ticketsQuery.in('property_id', propertyIds)
      }

      const { data: ticketData, error: ticketError } = await ticketsQuery
      if (ticketError) throw ticketError

      const ticketItems: CalendarItem[] = (ticketData || [])
        .map((t: any) => {
          const dateStr: string | null = t.estimated_resolution_date || (t.created_at ? t.created_at.slice(0, 10) : null)
          return {
            id: t.id,
            source: "ticket",
            title: t.title || "Ticket",
            start_date: dateStr || format(currentMonth, "yyyy-MM-dd"),
            start_time: null,
            end_date: dateStr,
            end_time: null,
            event_type: "maintenance_ticket",
            status: t.status,
            location: t.property?.name || null,
            meta: {
              property: t.property?.name || null,
            },
          } as CalendarItem
        })
        .filter((t) => t.start_date >= rangeStart && t.start_date <= rangeEnd)

      return {
        events,
        extraEvents: [...rentItems, ...ticketItems]
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (remplace cacheTime)
  })
}
