import { FileText, File, Folder } from "lucide-react"

export const DOCUMENT_CATEGORIES = [
  { value: "all", label: "Tous les documents" },
  { value: "rent", label: "Quittances" },
  { value: "lease", label: "Contrats" },
  { value: "edl", label: "États des lieux" },
  { value: "kyc", label: "Documents locataires" },
  { value: "invoice", label: "Factures" },
  { value: "letter", label: "Lettres types" },
  { value: "other", label: "Autres" }
]

export function getDocumentIcon(type: string) {
  const icons = {
    LEASE: FileText,
    RECEIPT: File,
    EDL: Folder,
    LETTER: FileText,
    OTHER: File
  }
  return icons[type as keyof typeof icons] || File
}

export function getDocumentBadge(type: string) {
  const typeUpper = type.toUpperCase()
  const types = {
    LEASE: { label: "Bail", variant: "default" as const },
    RECEIPT: { label: "Quittance", variant: "secondary" as const },
    EDL: { label: "État des lieux", variant: "outline" as const },
    LETTER: { label: "Lettre", variant: "secondary" as const },
    OTHER: { label: "Autre", variant: "secondary" as const }
  }
  return types[typeUpper as keyof typeof types] || { label: "Autre", variant: "secondary" as const }
}

export function getCategoryLabel(category: string | null) {
  if (!category) return 'Autre'
  const categoryMap: Record<string, string> = {
    rent: 'Quittances',
    lease: 'Contrats',
    edl: 'États des lieux',
    kyc: 'Documents locataires',
    invoice: 'Factures',
    letter: 'Lettres types',
    other: 'Autres'
  }
  return categoryMap[category.toLowerCase()] || category
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateDocumentStats(documents: any[]) {
  const totalDocuments = documents.length
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'Autres'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return { totalDocuments, documentsByCategory }
}
