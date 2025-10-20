import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wrench, Edit, Trash2 } from "lucide-react"
import type { MaintenanceTicketWithDetails } from "@/hooks/maintenance/useMaintenance"

interface MaintenanceListProps {
  tickets: MaintenanceTicketWithDetails[]
  onTicketClick: (ticket: MaintenanceTicketWithDetails) => void
  onEditTicket: (ticket: MaintenanceTicketWithDetails) => void
  onDeleteTicket: (id: string) => void
  isLandlord: boolean
  getPriorityBadge: (priority: string | null) => { label: string; variant: "destructive" | "default" | "secondary" | "outline" }
  getStatusBadge: (status: string | null) => { label: string; variant: "destructive" | "default" | "secondary" | "outline" }
  formatDate: (dateString: string) => string
  TicketTitleWithUnread: React.ComponentType<{ ticketId: string; title: string; className?: string }>
}

export function MaintenanceList({
  tickets,
  onTicketClick,
  onEditTicket,
  onDeleteTicket,
  isLandlord,
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  TicketTitleWithUnread,
}: MaintenanceListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Lieu</TableHead>
              <TableHead>Assigné à</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-center">
                    <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun ticket trouvé</h3>
                    <p className="text-muted-foreground">
                      Commencez par créer votre premier ticket.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTicketClick(ticket)}
                >
                  <TableCell>
                    <div>
                      <TicketTitleWithUnread ticketId={ticket.id} title={ticket.title} className="font-medium text-sm line-clamp-1" />
                      <div className="text-xs text-muted-foreground">
                        {formatDate(ticket.created_at)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge {...getPriorityBadge(ticket.priority)} className="text-xs" />
                  </TableCell>

                  <TableCell>
                    <Badge {...getStatusBadge(ticket.status)} className="text-xs" />
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{ticket.property?.name}</div>
                      {ticket.unit && (
                        <div className="text-xs text-muted-foreground">{ticket.unit.unit_number}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {ticket.assigned_contact ?
                        `${ticket.assigned_contact.first_name} ${ticket.assigned_contact.last_name}` :
                        "-"
                      }
                    </div>
                  </TableCell>

                  <TableCell>
                    {isLandlord && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTicket(ticket)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteTicket(ticket.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {!isLandlord && <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
