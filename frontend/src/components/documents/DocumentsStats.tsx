import { Card, CardContent } from "@/components/ui/card"
import { FileText, File, Folder } from "lucide-react"

interface DocumentsStatsProps {
  totalDocuments: number
  documentsByCategory: Record<string, number>
}

export function DocumentsStats({ totalDocuments, documentsByCategory }: DocumentsStatsProps) {
  return (
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
          <div className="text-2xl font-bold">{documentsByCategory.rent || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">générées</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">États des lieux</span>
          </div>
          <div className="text-2xl font-bold">{documentsByCategory.edl || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">en stock</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Contrats</span>
          </div>
          <div className="text-2xl font-bold">{documentsByCategory.lease || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">actifs</p>
        </CardContent>
      </Card>
    </div>
  )
}
