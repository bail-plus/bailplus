import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText } from "lucide-react"
import BatchReceiptGenerator from "@/components/receipts/BatchReceiptGenerator"

interface Tenant {
  first_name: string
  last_name: string
}

interface Unit {
  unit_number: string
  property?: {
    name: string
  }
}

interface Lease {
  tenant?: Tenant
  unit?: Unit
}

interface RentInvoice {
  id: string
  period_month: number
  period_year: number
  rent_amount: number
  charges_amount: number | null
  total_amount: number
  due_date: string
  status: string | null
  pdf_url: string | null
  lease?: Lease
}

interface RentInvoicesListProps {
  rentInvoices: RentInvoice[]
  onMarkPaid: (invoiceId: string) => void
  onDownloadReceipt: (invoice: RentInvoice) => void
  isPending: boolean
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

const getInvoiceStatusBadge = (status: string | null) => {
  const key = (status || '').toLowerCase()
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
    late: { label: 'En retard', className: 'bg-red-100 text-red-800' },
  }
  return map[key] || { label: status || '—', className: 'bg-gray-100 text-gray-800' }
}

export function RentInvoicesList({
  rentInvoices,
  onMarkPaid,
  onDownloadReceipt,
  isPending
}: RentInvoicesListProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Factures de loyer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Propriété</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date d'échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                      <p className="text-muted-foreground">
                        Les factures de loyer s'afficheront ici.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {invoice.period_month.toString().padStart(2, '0')}/{invoice.period_year}
                    </TableCell>
                    <TableCell>
                      {invoice.lease?.tenant ?
                        `${invoice.lease.tenant.first_name} ${invoice.lease.tenant.last_name}` :
                        "-"
                      }
                    </TableCell>
                    <TableCell>
                      {invoice.lease?.unit?.property?.name || "-"}
                      {invoice.lease?.unit && (
                        <div className="text-xs text-muted-foreground">
                          {invoice.lease.unit.unit_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.rent_amount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.charges_amount || 0)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getInvoiceStatusBadge(invoice.status).className}>
                        {getInvoiceStatusBadge(invoice.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pointer-events-auto">
                      {invoice.status !== 'paid' ? (
                        <Button size="sm" onClick={() => onMarkPaid(invoice.id)} disabled={isPending}>
                          Marquer payé
                        </Button>
                      ) : invoice.pdf_url ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); onDownloadReceipt(invoice) }}
                        >
                          Télécharger une quittance
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Quittance à générer</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BatchReceiptGenerator />
    </>
  )
}
