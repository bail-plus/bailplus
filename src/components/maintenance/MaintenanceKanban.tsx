import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import type { MaintenanceTicketWithDetails } from "@/hooks/useMaintenance"

const KANBAN_COLUMNS = [
  { id: "NOUVEAU", title: "Nouveau", color: "bg-red-50", icon: AlertTriangle },
  { id: "EN COURS", title: "En cours", color: "bg-yellow-50", icon: Clock },
  { id: "EN ATTENTE DE PIECE", title: "Attente pièces", color: "bg-blue-50", icon: Clock },
  { id: "TERMINE", title: "Terminé", color: "bg-green-50", icon: CheckCircle }
]

interface MaintenanceKanbanProps {
  tickets: MaintenanceTicketWithDetails[]
  onTicketClick: (ticket: MaintenanceTicketWithDetails) => void
  onDragStart: (ticket: MaintenanceTicketWithDetails) => void
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDragLeave: () => void
  onDrop: (newStatus: string) => void
  draggedTicket: MaintenanceTicketWithDetails | null
  dragOverColumn: string | null
  isLandlord: boolean
  getPriorityBadge: (priority: string | null) => { label: string; variant: "destructive" | "default" | "secondary" | "outline" }
  formatDate: (dateString: string) => string
  TicketTitleWithUnread: React.ComponentType<{ ticketId: string; title: string; className?: string }>
}

export function MaintenanceKanban({
  tickets,
  onTicketClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedTicket,
  dragOverColumn,
  isLandlord,
  getPriorityBadge,
  formatDate,
  TicketTitleWithUnread,
}: MaintenanceKanbanProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
      {KANBAN_COLUMNS.map(column => {
        const columnTickets = tickets.filter(ticket => ticket.status === column.id)

        return (
          <div
            key={column.id}
            className={`space-y-3 rounded-lg p-2 transition-all ${
              dragOverColumn === column.id
                ? 'bg-primary/10 border-2 border-primary border-dashed'
                : 'border-2 border-transparent'
            }`}
            onDragOver={(e) => onDragOver(e, column.id)}
            onDragLeave={onDragLeave}
            onDrop={() => onDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-2">
                <column.icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">{column.title}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {columnTickets.length}
              </Badge>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[100px]">
              {columnTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun ticket
                </div>
              ) : columnTickets.map(ticket => (
                <Card
                  key={ticket.id}
                  draggable={isLandlord}
                  onDragStart={() => isLandlord && onDragStart(ticket)}
                  className={`${isLandlord ? 'cursor-move' : 'cursor-pointer'} transition-all hover:shadow-md ${column.color} ${
                    draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                  }`}
                  onClick={() => onTicketClick(ticket)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Title & Priority */}
                      <div className="space-y-2">
                        <TicketTitleWithUnread ticketId={ticket.id} title={ticket.title} className="font-semibold text-sm line-clamp-2" />
                        <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                      </div>

                      {/* Property & Unit */}
                      <div className="text-xs text-muted-foreground">
                        {ticket.property?.name}
                        {ticket.unit && ` - ${ticket.unit.unit_number}`}
                      </div>

                      {/* Work Orders Count */}
                      {ticket.work_orders && ticket.work_orders.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {ticket.work_orders.length} ordre(s) de travail
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(ticket.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
