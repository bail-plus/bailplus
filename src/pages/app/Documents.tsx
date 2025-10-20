import { useState, useEffect } from "react"
import { useEntity } from "@/contexts/EntityContext"
import { useAuth } from "@/hooks/auth/useAuth"
import { useDocuments } from "@/hooks/documents/useDocuments"
import { useDocumentActions } from "@/hooks/documents/useDocumentActions"
import { useDocumentModals } from "@/hooks/documents/useDocumentModals"
import { calculateDocumentStats } from "@/lib/document-utils"
import { DocumentsHeader } from "@/components/documents/DocumentsHeader"
import { DocumentsFilters } from "@/components/documents/DocumentsFilters"
import { DocumentsStats } from "@/components/documents/DocumentsStats"
import { QuickGenerationCard } from "@/components/documents/QuickGenerationCard"
import { DocumentsTable } from "@/components/documents/DocumentsTable"
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal"
import ReceiptGeneratorModal from "@/components/receipt-generator-modal"
import LeaseGeneratorModal from "@/components/lease-generator-modal"
import EDLGeneratorModal from "@/components/edl-generator-modal"
import LetterGeneratorModal from "@/components/letter-generator-modal"

export default function Documents() {
  const { profile } = useAuth()
  const { selectedEntity, showAll } = useEntity()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const isLandlord = profile?.user_type === 'LANDLORD'

  // Get current month and year
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long' })
  const currentYear = currentDate.getFullYear()

  // Custom hooks
  const { documents, loading, loadDocuments } = useDocuments({ selectedEntity, showAll })
  const documentActions = useDocumentActions()
  const modals = useDocumentModals()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Calculate stats
  const { totalDocuments, documentsByCategory } = calculateDocumentStats(documents)

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
      <DocumentsHeader
        isLandlord={isLandlord}
        onOpenReceiptModal={() => modals.setReceiptModalOpen(true)}
        onOpenLeaseModal={() => modals.setLeaseModalOpen(true)}
        onOpenEdlModal={() => modals.setEdlModalOpen(true)}
        onOpenLetterModal={() => modals.setLetterModalOpen(true)}
      />

      {/* Filters */}
      <DocumentsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {/* Stats Cards */}
      {isLandlord && (
        <DocumentsStats
          totalDocuments={totalDocuments}
          documentsByCategory={documentsByCategory}
        />
      )}

      {/* Quick Generation */}
      {isLandlord && (
        <QuickGenerationCard
          currentMonth={currentMonth}
          currentYear={currentYear}
          generatingBatch={modals.generatingBatch}
          onGenerateMonthlyReceipts={modals.handleGenerateMonthlyReceipts}
          onOpenLeaseModal={() => modals.setLeaseModalOpen(true)}
          onOpenEdlModal={() => modals.setEdlModalOpen(true)}
          onOpenLetterModal={() => modals.setLetterModalOpen(true)}
        />
      )}

      {/* Documents List */}
      <DocumentsTable
        documents={filteredDocuments}
        downloading={documentActions.downloading}
        onDocumentClick={documentActions.setSelectedDocument}
        onPreview={documentActions.handlePreview}
        onDownload={documentActions.handleDownload}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={documentActions.selectedDocument}
        previewUrl={documentActions.previewUrl}
        previewLoading={documentActions.previewLoading}
        onClose={documentActions.handleClosePreview}
        onDownload={documentActions.handleDownload}
      />

      {/* Receipt Generator Modal */}
      <ReceiptGeneratorModal
        open={modals.receiptModalOpen}
        onOpenChange={modals.setReceiptModalOpen}
        onGenerate={loadDocuments}
      />

      {/* Lease Generator Modal */}
      <LeaseGeneratorModal
        open={modals.leaseModalOpen}
        onOpenChange={modals.setLeaseModalOpen}
        onGenerate={loadDocuments}
      />

      {/* EDL Generator Modal */}
      <EDLGeneratorModal
        open={modals.edlModalOpen}
        onOpenChange={modals.setEdlModalOpen}
        onGenerate={loadDocuments}
      />

      {/* Letter Generator Modal */}
      <LetterGeneratorModal
        open={modals.letterModalOpen}
        onOpenChange={modals.setLetterModalOpen}
        onGenerate={loadDocuments}
      />
    </div>
  )
}
