import { useTicketUnread } from "@/hooks/maintenance/useTicketUnread"

interface MessagesTabLabelProps {
  ticketId: string
}

export function MessagesTabLabel({ ticketId }: MessagesTabLabelProps) {
  const { data: unread } = useTicketUnread(ticketId)
  return (
    <span className="inline-flex items-center gap-2">
      Messages {unread ? <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> : null}
    </span>
  )
}
