import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Loader2 } from "lucide-react"
import type { Document } from "@/hooks/useDocuments"
import { getDocumentBadge, getCategoryLabel, formatDate } from "@/lib/document-utils"

interface DocumentPreviewModalProps {
  document: Document | null
  previewUrl: string | null
  previewLoading: boolean
  onClose: () => void
  onDownload: (document: Document) => void
}

export function DocumentPreviewModal({
  document,
  previewUrl,
  previewLoading,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  if (!document) return null

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
            <div>
              <span className="font-medium">Type:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {getDocumentBadge(document.type).label}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Catégorie:</span> {getCategoryLabel(document.category)}
            </div>
            <div>
              <span className="font-medium">Créé le:</span> {formatDate(document.created_at)}
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
              onClick={() => document && onDownload(document)}
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
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
