import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Euro, Edit, Trash2 } from "lucide-react"
import { type ExpenseWithDetails } from "@/hooks/useAccounting"

interface ExpensesListProps {
  expenses: ExpenseWithDetails[]
  onEdit: (expense: ExpenseWithDetails) => void
  onDelete: (id: string) => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getStatusBadge = (status: string | null) => {
  const statuses = {
    "pending": { label: "En attente", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
    "approved": { label: "Approuvée", variant: "default" as const, className: "bg-green-100 text-green-800" },
    "rejected": { label: "Rejetée", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
  }
  return statuses[status as keyof typeof statuses] || { label: status || "En attente", variant: "secondary" as const, className: "" }
}

export function ExpensesList({ expenses, onEdit, onDelete }: ExpensesListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Propriété</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-center">
                    <Euro className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune dépense trouvée</h3>
                    <p className="text-muted-foreground">
                      Commencez par créer votre première dépense.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.expense_date)}</TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category || "Autre"}</Badge>
                  </TableCell>

                  <TableCell>
                    {expense.property ? (
                      <div className="text-sm">
                        <div>{expense.property.name}</div>
                        {expense.unit && (
                          <div className="text-xs text-muted-foreground">{expense.unit.unit_number}</div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(expense.status).className}>
                      {getStatusBadge(expense.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(expense)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(expense.id)}
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
