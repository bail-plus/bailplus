import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TRISaveSimulationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSimulationId: string | null;
  saveSimulationName: string;
  onSaveSimulationNameChange: (value: string) => void;
  onConfirm: () => void;
};

export function TRISaveSimulationDialog({
  open,
  onOpenChange,
  currentSimulationId,
  saveSimulationName,
  onSaveSimulationNameChange,
  onConfirm,
}: TRISaveSimulationDialogProps) {
  const handleConfirm = () => {
    if (saveSimulationName.trim()) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentSimulationId
              ? "Mettre à jour la simulation"
              : "Sauvegarder la simulation"}
          </DialogTitle>
          <DialogDescription>
            {currentSimulationId
              ? "Donnez un nouveau nom ou gardez le même pour mettre à jour cette simulation."
              : "Donnez un nom à votre simulation pour pouvoir la retrouver facilement."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="simulation-name">Nom de la simulation</Label>
            <Input
              id="simulation-name"
              value={saveSimulationName}
              onChange={(e) => onSaveSimulationNameChange(e.target.value)}
              placeholder="Ex: Appartement Paris 15ème"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!saveSimulationName.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {currentSimulationId ? "Mettre à jour" : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
