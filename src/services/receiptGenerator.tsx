import { supabase } from "@/integrations/supabase/client"
import { pdf } from '@react-pdf/renderer'
import { ReceiptPDFTemplate } from "@/components/receipt-pdf-template-quittance"

interface RentInvoice {
  id: string
  period_month: number
  period_year: number
  rent_amount: number
  charges_amount: number | null
  total_amount: number
  pdf_url?: string | null
  lease_id?: string
  lease?: {
    tenant_id?: string
    unit_id?: string
    tenant?: {
      first_name: string
      last_name: string
    }
    unit?: {
      unit_number: string
    }
  }
}

/**
 * Download an invoice receipt from storage or URL
 */
export async function downloadInvoiceReceipt(inv: RentInvoice): Promise<void> {
  try {
    console.log('[RECEIPT-DL] START', { invoiceId: inv.id, pdf_url: inv.pdf_url })
    let path: string | null = inv.pdf_url || null

    if (!path || (!path.startsWith('QUITTANCES') && !path.startsWith('PRIVATE/'))) {
      console.log('[RECEIPT-DL] Fallback to documents for lease', inv.lease_id)
      const { data: docs } = await supabase
        .from('documents')
        .select('file_url')
        .eq('lease_id', inv.lease_id || '')
        .eq('type', 'receipt')
        .order('created_at', { ascending: false })
        .limit(1)
      if (docs && docs.length > 0) path = docs[0].file_url as string
      console.log('[RECEIPT-DL] Fallback path', path)
    }

    if (!path) throw new Error('Aucune quittance disponible')

    let blob: Blob
    if (path.startsWith('QUITTANCES') || path.startsWith('PRIVATE/')) {
      const cleanPath = path.startsWith('PRIVATE/') ? path.slice('PRIVATE/'.length) : path
      console.log('[RECEIPT-DL] Storage download', cleanPath)
      const { data, error } = await supabase.storage.from('PRIVATE').download(cleanPath)
      if (error || !data) throw error || new Error('Téléchargement Storage impossible')
      blob = data as Blob
    } else if (/^https?:\/\//i.test(path)) {
      console.log('[RECEIPT-DL] HTTP fetch', path)
      const resp = await fetch(path)
      if (!resp.ok) throw new Error('HTTP ' + resp.status)
      blob = await resp.blob()
    } else {
      console.warn('[RECEIPT-DL] Invalid path', path)
      throw new Error('Chemin de quittance invalide')
    }

    const url = URL.createObjectURL(blob)
    const displayMonth = inv.period_month.toString().padStart(2, '0')
    const filename = `quittance_${inv.period_year}_${displayMonth}.pdf`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    console.log('[RECEIPT-DL] DONE', filename)
  } catch (e) {
    console.error('[RECEIPT-DL] ERROR', e)
    throw e
  }
}

/**
 * Generate and upload a receipt PDF for a rent invoice
 */
export async function generateAndUploadReceipt(
  invoiceId: string,
  rentInvoices: RentInvoice[]
): Promise<{ storagePath: string; docName: string }> {
  const target = rentInvoices.find(inv => inv.id === invoiceId)
  if (!target) throw new Error('Facture non trouvée')

  // Build private storage path: PRIVATE/QUITTANCES/<profile_id>/quittance_YYYY_MM_lastname_<ts>.pdf
  let storagePath = ''
  let docName = 'Quittance'
  let tenantLastName = 'locataire'

  const displayMonth = target.period_month.toString().padStart(2, '0')
  tenantLastName = (target.lease?.tenant?.last_name || 'locataire').replace(/\s+/g, '_').toLowerCase()

  // Folder ownership must match auth.uid() due to RLS: use landlord's user_id
  const { data: auth } = await supabase.auth.getUser()
  const ownerUserId = auth?.user?.id || null

  const ts = Date.now()
  const filename = `quittance_${target.period_year}_${displayMonth}_${tenantLastName}_${ts}.pdf`
  const folder = ownerUserId ? `QUITTANCES/${ownerUserId}` : 'QUITTANCES'
  storagePath = `${folder}/${filename}`
  docName = `Quittance ${displayMonth}/${target.period_year} - ${target.lease?.tenant ? `${target.lease.tenant.first_name} ${target.lease.tenant.last_name}` : 'Locataire'}`

  // Fetch landlord profile (current user)
  if (!auth?.user) throw new Error('Utilisateur non connecté')
  const { data: landlord } = await supabase
    .from('profiles')
    .select('first_name,last_name,adress,city,postal_code')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  // Fetch property address from unit
  let propertyAddress = '-'
  if (target.lease?.unit_id) {
    const { data: unit } = await supabase
      .from('units')
      .select('unit_number, properties (address, city, postal_code, name)')
      .eq('id', target.lease.unit_id)
      .maybeSingle()
    if (unit?.properties) {
      const p: any = unit.properties
      propertyAddress = [p.address, p.postal_code, p.city].filter(Boolean).join(' ')
    }
  }

  // Tenant profile (address)
  const { data: tenantProf } = await supabase
    .from('profiles')
    .select('first_name,last_name,adress,city,postal_code,id')
    .eq('user_id', target.lease?.tenant_id || '')
    .maybeSingle()

  // Dates and period
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(target.period_year, target.period_month - 1, 1))
  const periodStart = new Date(target.period_year, target.period_month - 1, 1)
  const periodEnd = new Date(target.period_year, target.period_month, 0)

  const landlordName = landlord ? `${landlord.first_name || ''} ${landlord.last_name || ''}`.trim() : '—'
  const landlordAddr = landlord ? [landlord.adress, landlord.postal_code ? `${landlord.postal_code} ${landlord.city || ''}` : landlord.city].filter(Boolean).join(', ') : '—'
  const tenantName = tenantProf ? `${tenantProf.first_name || ''} ${tenantProf.last_name || ''}`.trim() : '—'
  const tenantAddr = tenantProf ? [tenantProf.adress, tenantProf.postal_code ? `${tenantProf.postal_code} ${tenantProf.city || ''}` : tenantProf.city].filter(Boolean).join(', ') : '—'

  const receiptData = {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    year: String(target.period_year),
    landlordName,
    landlordAddress: landlordAddr,
    tenantName,
    tenantAddress: tenantAddr,
    propertyAddress,
    unitNumber: target.lease?.unit?.unit_number || '-',
    rentAmount: target.rent_amount,
    chargesAmount: target.charges_amount || 0,
    totalAmount: target.total_amount,
    issueDate: new Date().toLocaleDateString('fr-FR'),
    periodStart: periodStart.toLocaleDateString('fr-FR'),
    periodEnd: periodEnd.toLocaleDateString('fr-FR'),
  }

  const pdfDoc = <ReceiptPDFTemplate data={receiptData} />
  const blob = await pdf(pdfDoc).toBlob()

  // Upload to PRIVATE bucket
  if (storagePath) {
    const { error: uploadError } = await supabase.storage.from('PRIVATE').upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (uploadError) {
      throw new Error(`Upload quittance: ${uploadError.message}`)
    }
  }

  return { storagePath, docName }
}
