import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format, addDays } from 'date-fns'
import { useAuth } from '@/hooks/auth/useAuth'

export interface UpcomingEvent {
  id: string
  title: string
  start_date: string
  start_time: string | null
  event_type: string
  location: string | null
  property?: {
    name: string
  } | null
}

export function useUpcomingEvents(days: number = 7) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['upcoming-events', user?.id, days],
    queryFn: async () => {
      if (!user) return []

      const today = format(new Date(), 'yyyy-MM-dd')
      const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd')

      console.log('[UPCOMING_EVENTS] Fetching events for user:', user.id)
      console.log('[UPCOMING_EVENTS] Date range:', today, 'to', futureDate)

      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date, start_time, event_type, location, property_id')
        .eq('user_id', user.id)
        .gte('start_date', today)
        .lte('start_date', futureDate)
        .order('start_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
        .limit(10)

      if (error) {
        console.error('[UPCOMING_EVENTS] Error:', error)
        throw error
      }

      console.log('[UPCOMING_EVENTS] Fetched events:', data?.length || 0, data)

      // Si on a des événements avec property_id, récupérer les noms des propriétés
      const eventsWithProperties = await Promise.all(
        (data || []).map(async (event: any) => {
          if (event.property_id) {
            const { data: propData } = await supabase
              .from('properties')
              .select('name')
              .eq('id', event.property_id)
              .single()

            return {
              ...event,
              property: propData ? { name: propData.name } : null
            }
          }
          return {
            ...event,
            property: null
          }
        })
      )

      console.log('[UPCOMING_EVENTS] Events with properties:', eventsWithProperties)
      return eventsWithProperties as UpcomingEvent[]
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
