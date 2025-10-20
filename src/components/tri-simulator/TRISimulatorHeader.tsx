import { RotateCcw, Save, FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";

type TRISimulatorHeaderProps = {
  currentSimulationName?: string;
  currentSimulationId: string | null;
  onNewSimulation: () => void;
  onSaveSimulation: () => void;
  onExportPDF: () => void;
};

export function TRISimulatorHeader({
  currentSimulationName,
  currentSimulationId,
  onNewSimulation,
  onSaveSimulation,
  onExportPDF,
}: TRISimulatorHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          TRI - Simulateur d&apos;Investissement
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentSimulationName ? (
            <>
              Simulation :{" "}
              <span className="font-semibold">{currentSimulationName}</span>
            </>
          ) : (
            "Calculez le taux de rendement interne et la rentabilité de votre projet immobilier"
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onNewSimulation}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Nouvelle
        </Button>
        <Button variant="outline" size="sm" onClick={onSaveSimulation}>
          <Save className="w-4 h-4 mr-2" />
          {currentSimulationId ? "Mettre à jour" : "Sauvegarder"}
        </Button>
        <Button size="sm" onClick={onExportPDF}>
          <FileDown className="w-4 h-4 mr-2" />
          Exporter PDF
        </Button>
      </div>
    </div>
  );
}
