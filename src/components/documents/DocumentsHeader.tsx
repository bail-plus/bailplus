import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Plus, Upload, File, Folder } from "lucide-react"

interface DocumentsHeaderProps {
  isLandlord: boolean
  onOpenReceiptModal: () => void
  onOpenLeaseModal: () => void
  onOpenEdlModal: () => void
  onOpenLetterModal: () => void
}

export function DocumentsHeader({
  isLandlord,
  onOpenReceiptModal,
  onOpenLeaseModal,
  onOpenEdlModal,
  onOpenLetterModal,
}: DocumentsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Coffre-fort numérique et génération de documents
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isLandlord && (
          <>
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
                      onClick={onOpenLeaseModal}
                    >
                      <FileText className="w-4 h-4" />
                      Bail de location
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={onOpenReceiptModal}
                    >
                      <File className="w-4 h-4" />
                      Quittance de loyer
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={onOpenEdlModal}
                    >
                      <Folder className="w-4 h-4" />
                      État des lieux
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={onOpenLetterModal}
                    >
                      <FileText className="w-4 h-4" />
                      Lettre de relance
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
