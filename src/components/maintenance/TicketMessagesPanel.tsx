import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTicketMessages, useSendTicketMessage } from "@/hooks/maintenance/useTicketChat"
import { useMarkTicketRead, useMarkTicketNotificationsRead } from "@/hooks/maintenance/useTicketUnread"
import type { MaintenanceTicketWithDetails } from "@/hooks/maintenance/useMaintenance"

interface TicketMessagesPanelProps {
  ticket: MaintenanceTicketWithDetails
}

export function TicketMessagesPanel({ ticket }: TicketMessagesPanelProps) {
  const { data: msgs = [] } = useTicketMessages(ticket.id)
  const send = useSendTicketMessage(ticket.id, ticket.title)
  const mark = useMarkTicketRead()
  const markNotif = useMarkTicketNotificationsRead()

  useEffect(() => {
    if (ticket.id) {
      mark.mutate(ticket.id)
      markNotif.mutate(ticket.id)
    }
  }, [ticket.id])

  return (
    <div className="space-y-3">
      <div className="border rounded-md max-h-64 overflow-auto p-2 bg-muted/20">
        {msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3">Aucun message. Commencez la discussion.</div>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="p-2 border-b last:border-0">
              <div className="text-xs text-muted-foreground">{new Date(m.created_at || '').toLocaleString('fr-FR')} • {m.sender_role}</div>
              <div className="text-sm whitespace-pre-wrap">{m.message}</div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const textarea = form.elements.namedItem('message') as HTMLTextAreaElement
          const text = (textarea?.value || '').trim()
          if (!text) return
          send.mutate(text)
          textarea.value = ''
        }}
        className="flex items-start gap-2"
      >
        <Textarea name="message" placeholder="Écrire un message..." className="flex-1" rows={2} />
        <Button type="submit" disabled={send.isPending}>Envoyer</Button>
      </form>
      <div className="text-xs text-muted-foreground">Participants: bailleur, locataire (si présent), prestataire assigné.</div>
    </div>
  )
}
