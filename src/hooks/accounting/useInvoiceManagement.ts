import { useToast } from "@/hooks/use-toast"
import { useUpdateRentInvoice } from "@/hooks/useAccounting"
import { supabase } from "@/integrations/supabase/client"
import { downloadInvoiceReceipt, generateAndUploadReceipt } from "@/services/receiptGenerator.tsx"

interface RentInvoice {
  id: string
  lease_id?: string
  period_month: number
  period_year: number
  rent_amount: number
  charges_amount: number | null
  total_amount: number
  status: string | null
  pdf_url?: string | null
  lease?: any
}

export function useInvoiceManagement(rentInvoices: RentInvoice[]) {
  const { toast } = useToast()
  const updateRentInvoice = useUpdateRentInvoice()

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { storagePath, docName } = await generateAndUploadReceipt(invoiceId, rentInvoices)

      await updateRentInvoice.mutateAsync({
        id: invoiceId,
        status: 'paid',
        paid_date: today,
        pdf_url: storagePath || null,
      } as any)

      // Create a document entry linked to the lease
      const target = rentInvoices.find(inv => inv.id === invoiceId)
      if (target) {
        await supabase
          .from('documents')
          .insert({
            name: docName,
            type: 'receipt',
            category: 'rent',
            file_url: storagePath || '',
            lease_id: target.lease_id,
            mime_type: 'application/pdf',
          })
      }
      toast({ title: 'Succès', description: 'Facture marquée comme payée et quittance générée.' })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de marquer payé',
        variant: 'destructive'
      })
    }
  }

  const handleDownloadReceipt = async (invoice: RentInvoice) => {
    try {
      await downloadInvoiceReceipt(invoice)
    } catch (error) {
      toast({ title: 'Erreur', description: 'Téléchargement impossible', variant: 'destructive' })
    }
  }

  return {
    handleMarkInvoicePaid,
    handleDownloadReceipt,
    isPending: updateRentInvoice.isPending,
  }
}
