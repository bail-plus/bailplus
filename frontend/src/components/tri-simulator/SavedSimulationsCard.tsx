import { Upload, Trash2, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TRISimulationWithData } from "@/hooks/tri/useTRISimulations";

type SavedSimulationsCardProps = {
  simulations: TRISimulationWithData[];
  currentSimulationId: string | null;
  onLoadSimulation: (simulation: TRISimulationWithData) => void;
  onDeleteSimulation: (id: string) => void;
  isLoading?: boolean;
};

export function SavedSimulationsCard({
  simulations,
  currentSimulationId,
  onLoadSimulation,
  onDeleteSimulation,
  isLoading,
}: SavedSimulationsCardProps) {
  if (!simulations.length && !isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Simulations sauvegardées ({simulations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Chargement des simulations...
          </p>
        ) : (
          <div className="space-y-2">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  currentSimulationId === sim.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">{sim.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Créée le{" "}
                    {new Date(sim.created_at).toLocaleDateString("fr-FR")}
                    {sim.updated_at !== sim.created_at && (
                      <>
                        {" "}
                        · Modifiée le{" "}
                        {new Date(sim.updated_at).toLocaleDateString("fr-FR")}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadSimulation(sim)}
                    disabled={currentSimulationId === sim.id}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Charger
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSimulation(sim.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
