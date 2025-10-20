import { useTicketUnread } from "@/hooks/maintenance/useTicketUnread"

interface TicketTitleWithUnreadProps {
  ticketId: string
  title: string
  className?: string
}

export function TicketTitleWithUnread({ ticketId, title, className }: TicketTitleWithUnreadProps) {
  const { data: unread } = useTicketUnread(ticketId)
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="truncate">{title}</span>
      {unread ? <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> : null}
    </div>
  )
}
