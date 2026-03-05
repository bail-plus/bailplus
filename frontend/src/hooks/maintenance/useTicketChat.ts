import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { notifyTicketMessage } from '@/hooks/notifications/useNotifications'

export interface TicketMessageRow {
  id: string
  ticket_id: string
  sender_id: string
  sender_role: string
  message: string
  created_at: string | null
}

export function useTicketMessages(ticketId: string | undefined) {
  const query = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [] as TicketMessageRow[]
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as unknown as TicketMessageRow[]
    },
    enabled: !!ticketId,
    staleTime: 10_000,
  })

  // Realtime subscription - DÉSACTIVÉ
  useEffect(() => {
    console.log('⏸️ [TICKET] Realtime subscription disabled');
    // if (!ticketId) return
    // const channel = supabase
    //   .channel(`tm_${ticketId}`)
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, () => {
    //     query.refetch()
    //   })
    //   .subscribe()
    // return () => { channel.unsubscribe() }
  }, [ticketId])

  return query
}

export function useSendTicketMessage(ticketId: string | undefined, ticketTitle?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) => {
      if (!ticketId) throw new Error('Ticket manquant')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .maybeSingle()
      const senderRole = (profile?.user_type as string) || 'LANDLORD'

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_role: senderRole as any,
          message: text,
          message_type: 'text',
        })
        .select('*')
        .single()
      if (error) throw error

      // Notify other participants (excluding sender)
      try {
        // Destinataires: participants + bailleur + locataire (si profil), hors émetteur
        const [participantsRes, ticketRes] = await Promise.all([
          supabase.from('ticket_participants').select('user_id').eq('ticket_id', ticketId),
          supabase.from('maintenance_tickets').select('user_id, tenant_user_id').eq('id', ticketId).maybeSingle(),
        ])
        const ids = new Set<string>()
        ;(participantsRes.data || []).forEach(p => { if (p.user_id) ids.add(p.user_id) })
        if (ticketRes.data?.user_id) ids.add(ticketRes.data.user_id) // bailleur
        if ((ticketRes.data as any)?.tenant_user_id) ids.add((ticketRes.data as any).tenant_user_id)
        ids.delete(user.id) // ne pas notifier l'émetteur
        const recipients = Array.from(ids)
        const preview = text.length > 140 ? `${text.slice(0, 137)}…` : text
        await Promise.all(recipients.map(uid => notifyTicketMessage(uid, ticketId, ticketTitle || 'Ticket', user.email || 'Utilisateur', preview)))
      } catch (e) {
        console.warn('[CHAT] notifyTicketMessage failed', e)
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-messages', ticketId] })
    }
  })
}
