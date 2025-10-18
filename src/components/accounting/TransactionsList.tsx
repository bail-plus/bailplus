import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Edit, Trash2 } from "lucide-react"
import { type BankTransactionWithDetails } from "@/hooks/useAccounting"

interface TransactionsListProps {
  transactions: BankTransactionWithDetails[]
  onEdit: (transaction: BankTransactionWithDetails) => void
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

const getTransactionStatusBadge = (status: string | null) => {
  const key = (status || '').toUpperCase()
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'En attente de rapprochement', className: 'bg-yellow-100 text-yellow-800' },
    MATCHED: { label: 'Rapprochée (validée)', className: 'bg-green-100 text-green-800' },
    UNMATCHED: { label: 'À catégoriser', className: 'bg-gray-100 text-gray-800' },
  }
  return map[key] || { label: status || '—', className: 'bg-gray-100 text-gray-800' }
}

export function TransactionsList({ transactions, onEdit, onDelete }: TransactionsListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Rapprochement</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-center">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
                    <p className="text-muted-foreground">
                      Commencez par créer votre première transaction.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="max-w-xs truncate">{transaction.label}</TableCell>
                  <TableCell className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const b = getTransactionStatusBadge(transaction.status); return (
                        <Badge variant="outline" className={b.className}>{b.label}</Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {transaction.matched_expense ? (
                      <div className="text-sm">
                        <Badge variant="outline">Dépense</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.matched_expense.description}
                        </div>
                      </div>
                    ) : transaction.matched_rent_invoice ? (
                      <div className="text-sm">
                        <Badge variant="outline">Loyer</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.matched_rent_invoice.period_month}/{transaction.matched_rent_invoice.period_year}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transaction.id)}
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
