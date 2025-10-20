import { TRISimulatorHeader } from "@/components/tri-simulator/TRISimulatorHeader";
import { SavedSimulationsCard } from "@/components/tri-simulator/SavedSimulationsCard";
import { TRIResultsSection } from "@/components/tri-simulator/TRIResultsSection";
import { TRIParametersForm } from "@/components/tri-simulator/TRIParametersForm";
import { TRISaveSimulationDialog } from "@/components/tri-simulator/TRISaveSimulationDialog";
import { TRIDeleteSimulationDialog } from "@/components/tri-simulator/TRIDeleteSimulationDialog";
import { useTRISimulatorController } from "@/hooks/tri/useTRISimulatorController";

export default function TRISimulator() {
  const {
    form,
    watchedValues,
    results,
    chartData,
    simulations,
    isLoadingSimulations,
    currentSimulationId,
    currentSimulationName,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    saveSimulationName,
    setSaveSimulationName,
    deleteDialogSimId,
    setDeleteDialogSimId,
    handleOpenSaveDialog,
    handleSaveSimulation,
    handleLoadSimulation,
    handleDeleteSimulation,
    handleNewSimulation,
    handleExportPDF,
  } = useTRISimulatorController();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TRISimulatorHeader
        currentSimulationName={currentSimulationName}
        currentSimulationId={currentSimulationId}
        onNewSimulation={handleNewSimulation}
        onSaveSimulation={handleOpenSaveDialog}
        onExportPDF={handleExportPDF}
      />

      <SavedSimulationsCard
        simulations={simulations}
        currentSimulationId={currentSimulationId}
        onLoadSimulation={handleLoadSimulation}
        onDeleteSimulation={setDeleteDialogSimId}
        isLoading={isLoadingSimulations}
      />

      <TRIResultsSection
        results={results}
        chartData={chartData}
        discountRate={watchedValues.discountRate}
      />

      <TRIParametersForm form={form} watchedValues={watchedValues} />

      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>
          <strong>
            Simulation indicative – non constitutive d&apos;un conseil fiscal.
          </strong>
          <br />
          Les calculs sont basés sur les données saisies et les hypothèses
          retenues. Consultez un conseiller fiscal pour votre situation
          personnelle.
        </p>
      </div>

      <TRISaveSimulationDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        currentSimulationId={currentSimulationId}
        saveSimulationName={saveSimulationName}
        onSaveSimulationNameChange={setSaveSimulationName}
        onConfirm={handleSaveSimulation}
      />

      <TRIDeleteSimulationDialog
        simulationId={deleteDialogSimId}
        onClose={() => setDeleteDialogSimId(null)}
        onConfirm={handleDeleteSimulation}
      />
    </div>
  );
}
