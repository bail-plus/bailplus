import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Download, Upload, Eye, File, Folder, Image, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import ReceiptGeneratorModal from "@/components/receipt-generator-modal"
import LeaseGeneratorModal from "@/components/lease-generator-modal"
import EDLGeneratorModal from "@/components/edl-generator-modal"
import LetterGeneratorModal from "@/components/letter-generator-modal"

interface Document {
  id: string
  name: string
  type: string
  category: string | null
  file_size: number | null
  created_at: string
  file_url: string
}

const DOCUMENT_CATEGORIES = [
  { value: "all", label: "Tous les documents" },
  { value: "Contrats", label: "Contrats" },
  { value: "Quittances", label: "Quittances" },
  { value: "États des lieux", label: "États des lieux" },
  { value: "KYC", label: "Documents locataires" },
  { value: "Factures", label: "Factures" },
  { value: "Lettres", label: "Lettres types" }
]

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [leaseModalOpen, setLeaseModalOpen] = useState(false)
  const [edlModalOpen, setEdlModalOpen] = useState(false)
  const [letterModalOpen, setLetterModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [generatingBatch, setGeneratingBatch] = useState(false)

  // Get current month and year
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long' })
  const currentYear = currentDate.getFullYear()

  const loadDocuments = useCallback(async () => {
    try {
      // Load all documents from documents table
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (docsError) throw docsError

      // For LEASE documents, enrich with tenant info
      const transformedDocs = await Promise.all(
        (docsData || []).map(async (doc) => {
          if (doc.type === 'LEASE' && doc.lease_id) {
            try {
              // Load lease with tenant info
              const { data: leaseData } = await supabase
                .from('leases')
                .select(`
                  tenant:contacts(first_name, last_name)
                `)
                .eq('id', doc.lease_id)
                .single()

              if (leaseData?.tenant) {
                return {
                  ...doc,
                  name: doc.name || `Bail - ${leaseData.tenant.first_name} ${leaseData.tenant.last_name}`
                }
              }
            } catch (err) {
              console.error('Error loading lease data:', err)
            }
          }
          return doc
        })
      )

      // Load receipts from rent_invoices table
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('rent_invoices')
        .select(`
          id,
          created_at,
          period_month,
          period_year,
          total_amount,
          pdf_url,
          leases!inner (
            units!inner (
              unit_number,
              properties!inner (
                name
              )
            ),
            contacts!inner (
              first_name,
              last_name
            )
          )
        `)
        .not('pdf_url', 'is', null)
        .order('created_at', { ascending: false })

      if (receiptsError) throw receiptsError

      // Transform receipts to match Document interface
      const transformedReceipts = (receiptsData || []).map(receipt => ({
        id: receipt.id,
        name: `Quittance ${receipt.period_month}/${receipt.period_year} - ${receipt.leases.contacts.first_name} ${receipt.leases.contacts.last_name}`,
        type: 'RECEIPT',
        category: 'Quittances',
        file_size: null,
        created_at: receipt.created_at,
        file_url: receipt.pdf_url || ''
      }))

      // Combine both arrays
      const allDocuments = [...transformedReceipts, ...transformedDocs]
      allDocuments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getSignedUrl = async (document: Document): Promise<string | null> => {
    if (!document.file_url) return null

    try {
      // Check if it's a document stored in PRIVATE bucket (RECEIPT, LEASE, EDL, LETTER)
      if (document.type === 'RECEIPT' || document.type === 'LEASE' || document.type === 'EDL' || document.type === 'LETTER') {
        // Get signed URL for private file
        const { data, error } = await supabase.storage
          .from('PRIVATE')
          .createSignedUrl(document.file_url, 3600) // Valid for 1 hour

        if (error) throw error
        return data?.signedUrl || null
      } else {
        // For other documents, use the file_url directly
        return document.file_url
      }
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return null
    }
  }

  const handlePreview = async (document: Document) => {
    setSelectedDocument(document)
    setPreviewLoading(true)
    setPreviewUrl(null)

    try {
      const url = await getSignedUrl(document)
      if (!url) throw new Error('Impossible de générer le lien')
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error previewing document:', error)
      alert('Erreur lors de la prévisualisation du document')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleDownload = async (document: Document) => {
    setDownloading(document.id)
    try {
      const url = await getSignedUrl(document)
      if (!url) throw new Error('Impossible de générer le lien de téléchargement')

      // Download the file
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.name
      link.click()
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Erreur lors du téléchargement du document')
    } finally {
      setDownloading(null)
    }
  }

  const handleClosePreview = () => {
    setSelectedDocument(null)
    setPreviewUrl(null)
  }

  const handleGenerateMonthlyReceipts = () => {
    // Open the receipt modal which will pre-fill with current month/year
    setReceiptModalOpen(true)
  }

  const getDocumentIcon = (type: string) => {
    const icons = {
      LEASE: FileText,
      RECEIPT: File,
      EDL: Folder,
      LETTER: FileText,
      OTHER: File
    }
    return icons[type as keyof typeof icons] || File
  }

  const getDocumentBadge = (type: string) => {
    const types = {
      LEASE: { label: "Bail", variant: "default" as const },
      RECEIPT: { label: "Quittance", variant: "secondary" as const },
      EDL: { label: "EDL", variant: "outline" as const },
      LETTER: { label: "Lettre", variant: "secondary" as const },
      OTHER: { label: "Autre", variant: "secondary" as const }
    }
    return types[type as keyof typeof types] || { label: type, variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (size: number | null) => {
    if (!size) return 'N/A'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
    return `${Math.round(size / (1024 * 1024))} MB`
  }

  // Calculate stats
  const totalDocuments = documents.length
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'Autres'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Coffre-fort numérique et génération de documents
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité d'import en cours de développement
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Générer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => {
                      setLeaseModalOpen(true)
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Bail de location
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => {
                      setReceiptModalOpen(true)
                    }}
                  >
                    <File className="w-4 h-4" />
                    Quittance de loyer
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => {
                      setEdlModalOpen(true)
                    }}
                  >
                    <Folder className="w-4 h-4" />
                    État des lieux
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => {
                      setLetterModalOpen(true)
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Lettre de relance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">documents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quittances</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory.Quittances || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">générées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">États des lieux</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory["États des lieux"] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">en stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contrats</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory.Contrats || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Génération rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleGenerateMonthlyReceipts}
              disabled={generatingBatch}
            >
              {generatingBatch ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
              <div className="text-center">
                <div className="font-medium">Quittances du mois</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {currentMonth} {currentYear}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setLeaseModalOpen(true)}
            >
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Bail de location</div>
                <div className="text-xs text-muted-foreground">Nouveau contrat</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setEdlModalOpen(true)}
            >
              <Folder className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">État des lieux</div>
                <div className="text-xs text-muted-foreground">Entrée/Sortie</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setLetterModalOpen(true)}
            >
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Lettres de relance</div>
                <div className="text-xs text-muted-foreground">Impayés</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Liste des documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    Aucun document trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((document) => {
                  const IconComponent = getDocumentIcon(document.type)
                  const badgeConfig = getDocumentBadge(document.type)
                  
                  return (
                    <TableRow 
                      key={document.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedDocument(document)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{document.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {document.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={badgeConfig.variant} className="text-xs">
                          {badgeConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">{document.category || 'N/A'}</span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatFileSize(document.file_size)}</span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatDate(document.created_at)}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => handlePreview(document)}
                          >
                            <Eye className="w-3 h-3" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => handleDownload(document)}
                            disabled={downloading === document.id}
                          >
                            {downloading === document.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            Télécharger
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={handleClosePreview}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedDocument.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getDocumentBadge(selectedDocument.type).label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Catégorie:</span> {selectedDocument.category}
                </div>
                <div>
                  <span className="font-medium">Taille:</span> {formatFileSize(selectedDocument.file_size)}
                </div>
                <div>
                  <span className="font-medium">Créé le:</span> {formatDate(selectedDocument.created_at)}
                </div>
              </div>

              {/* PDF Preview */}
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                {previewLoading ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2">Chargement du document...</span>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[500px]"
                    title="Document preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm">Impossible de charger la prévisualisation</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="gap-2"
                  onClick={() => selectedDocument && handleDownload(selectedDocument)}
                  disabled={!previewUrl}
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                  disabled={!previewUrl}
                >
                  <Eye className="w-4 h-4" />
                  Ouvrir dans un nouvel onglet
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  onClick={handleClosePreview}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Generator Modal */}
      <ReceiptGeneratorModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        onGenerate={loadDocuments}
      />

      {/* Lease Generator Modal */}
      <LeaseGeneratorModal
        open={leaseModalOpen}
        onOpenChange={setLeaseModalOpen}
        onGenerate={loadDocuments}
      />

      {/* EDL Generator Modal */}
      <EDLGeneratorModal
        open={edlModalOpen}
        onOpenChange={setEdlModalOpen}
        onGenerate={loadDocuments}
      />

      {/* Letter Generator Modal */}
      <LetterGeneratorModal
        open={letterModalOpen}
        onOpenChange={setLetterModalOpen}
        onGenerate={loadDocuments}
      />
    </div>
  )
}