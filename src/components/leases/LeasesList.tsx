import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Home, User, Calendar as CalendarIcon, Edit, Trash2 } from "lucide-react"
import type { LeaseWithDetails } from "@/hooks/useLeases"

interface LeasesListProps {
  leases: LeaseWithDetails[]
  onEditLease: (lease: LeaseWithDetails) => void
  onDeleteLease: (id: string) => void
}

const getStatusBadge = (status?: string | null) => {
  const statusMap = {
    "draft": { label: "Brouillon", variant: "secondary" as const },
    "signed": { label: "Signé", variant: "secondary" as const },
    "active": { label: "Actif", variant: "default" as const },
    "terminated": { label: "Terminé", variant: "destructive" as const },
  }
  return statusMap[status as keyof typeof statusMap] || { label: status || "Inconnu", variant: "secondary" as const }
}

export function LeasesList({ leases, onEditLease, onDeleteLease }: LeasesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des baux</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logement</TableHead>
              <TableHead>Locataire</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Loyer</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun bail trouvé</h3>
                    <p className="text-muted-foreground">
                      Commencez par créer votre premier bail.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leases.map((lease) => (
                <TableRow key={lease.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {lease.unit?.unit_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lease.unit?.property.name}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {lease.tenant?.first_name} {lease.tenant?.last_name}
                    </div>
                    {lease.coTenants && lease.coTenants.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        +{lease.coTenants.length} co-locataire(s)
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(lease.start_date).toLocaleDateString()}
                      </div>
                      {lease.end_date && (
                        <div className="text-muted-foreground">
                          → {new Date(lease.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{lease.rent_amount} €</div>
                    {lease.charges_amount && lease.charges_amount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{lease.charges_amount} € charges
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={getStatusBadge(lease.status).variant}>
                      {getStatusBadge(lease.status).label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditLease(lease)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLease(lease.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
