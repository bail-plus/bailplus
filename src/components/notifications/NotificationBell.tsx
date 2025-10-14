import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotificationBell() {
  const { data: notifications = [], unreadCount, markAsRead, markAllAsRead, isLoading } = useInAppNotifications()
  const [filter, setFilter] = useState<'all' | 'unread' | 'ticket' | 'general'>('all')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.is_read)
    if (filter === 'ticket') return notifications.filter(n => n.context_type === 'ticket')
    if (filter === 'general') return notifications.filter(n => n.context_type !== 'ticket')
    return notifications
  }, [notifications, filter])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 flex items-center justify-between">
          <div className="font-medium">Notifications</div>
          <div className="flex items-center gap-1">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="xs" onClick={() => setFilter('all')}>Tous</Button>
            <Button variant={filter === 'unread' ? 'default' : 'outline'} size="xs" onClick={() => setFilter('unread')}>Non lus ({unreadCount})</Button>
            <Button variant={filter === 'ticket' ? 'default' : 'outline'} size="xs" onClick={() => setFilter('ticket')}>Tickets</Button>
            <Button variant={filter === 'general' ? 'default' : 'outline'} size="xs" onClick={() => setFilter('general')}>Général</Button>
          </div>
        </div>
        <Separator />
        <div className="px-3 py-2 text-right">
          <Button variant="ghost" size="sm" disabled={isLoading || unreadCount === 0} onClick={() => markAllAsRead.mutate()}>
            Tout marquer comme lu
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-96">
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Aucune notification</div>
            ) : (
              filtered.map((n) => (
                <div key={n.id} className={`p-3 rounded-md hover:bg-muted ${!n.is_read ? 'bg-muted/70' : ''}`}>
                  <div className="text-sm font-medium">{n.subject || 'Notification'}</div>
                  <div className="text-xs text-muted-foreground">
                    {n.context_type === 'ticket' ? 'Ticket' : 'Général'} • {new Date(n.created_at).toLocaleString('fr-FR')}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {!n.is_read && (
                      <Button variant="outline" size="xs" onClick={() => markAsRead.mutate(n.id)}>Marquer lu</Button>
                    )}
                    {n.ticket_id && (
                      <Button
                        variant="link"
                        size="xs"
                        className="px-0"
                        onClick={() => {
                          markAsRead.mutate(n.id)
                          navigate(`/app/maintenance?openTicket=${n.ticket_id}`)
                        }}
                      >
                        Voir le ticket
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
