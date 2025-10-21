import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Folder, Loader2 } from "lucide-react"

interface QuickGenerationCardProps {
  currentMonth: string
  currentYear: number
  generatingBatch: boolean
  onGenerateMonthlyReceipts: () => void
  onOpenLeaseModal: () => void
  onOpenEdlModal: () => void
  onOpenLetterModal: () => void
}

export function QuickGenerationCard({
  currentMonth,
  currentYear,
  generatingBatch,
  onGenerateMonthlyReceipts,
  onOpenLeaseModal,
  onOpenEdlModal,
  onOpenLetterModal,
}: QuickGenerationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Génération rapide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={onGenerateMonthlyReceipts}
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
            onClick={onOpenLeaseModal}
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
            onClick={onOpenEdlModal}
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
            onClick={onOpenLetterModal}
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
  )
}
