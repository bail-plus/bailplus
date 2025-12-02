import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, Loader2 } from "lucide-react"
import type { Document } from "@/hooks/documents/useDocuments"
import { getDocumentIcon, getDocumentBadge, getCategoryLabel, formatDate } from "@/lib/document-utils"

interface DocumentsTableProps {
  documents: Document[]
  downloading: string | null
  onDocumentClick: (document: Document) => void
  onPreview: (document: Document) => void
  onDownload: (document: Document) => void
}

export function DocumentsTable({
  documents,
  downloading,
  onDocumentClick,
  onPreview,
  onDownload,
}: DocumentsTableProps) {
  return (
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
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  Aucun document trouvé
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const IconComponent = getDocumentIcon(document.type)
                const badgeConfig = getDocumentBadge(document.type)

                return (
                  <TableRow
                    key={document.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onDocumentClick(document)}
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
                      <span className="text-sm">{getCategoryLabel(document.category)}</span>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            onPreview(document)
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(document)
                          }}
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
  )
}
