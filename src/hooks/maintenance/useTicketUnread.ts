import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useTicketUnread(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-unread', ticketId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      const [{ data: part }, { data: lastMsg }] = await Promise.all([
        supabase.from('ticket_participants').select('last_read_at').eq('ticket_id', ticketId).eq('user_id', user.id).maybeSingle(),
        supabase.from('ticket_messages').select('created_at').eq('ticket_id', ticketId).not('sender_id', 'eq', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (!lastMsg) return false
      const lastRead = part?.last_read_at ? new Date(part.last_read_at).getTime() : 0
      const lastCreated = lastMsg.created_at ? new Date(lastMsg.created_at).getTime() : 0
      return lastCreated > lastRead
    },
  })
}

export function useMarkTicketRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('ticket_participants')
        .update({ last_read_at: now })
        .eq('ticket_id', ticketId)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: (_d, ticketId) => {
      qc.invalidateQueries({ queryKey: ['ticket-unread', ticketId] })
    }
  })
}

export function useMarkTicketNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      // Récupérer les logs de notification pour ce ticket destinés à l'utilisateur courant
      const { data: logs, error } = await supabase
        .from('communication_logs')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('recipient_id', user.id)
      if (error) throw error
      if (!logs || logs.length === 0) return
      const rows = logs.map(l => ({ log_id: l.id as string, user_id: user.id, is_read: true, read_at: new Date().toISOString() }))
      const { error: upErr } = await supabase.from('notification_reads').upsert(rows as any, { onConflict: 'log_id,user_id' })
      if (upErr) throw upErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inapp-notifications'] })
    }
  })
}
