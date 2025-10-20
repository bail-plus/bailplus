import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  TriFormData,
  triFormSchema,
  defaultTriInputs,
} from "@/lib/tri-schemas";
import { computeTri, type TriResult } from "@/lib/tri-calculator";
import { useToast } from "@/hooks/ui/use-toast";
import {
  useCreateTRISimulation,
  useUpdateTRISimulation,
  useTRISimulations,
  useDeleteTRISimulation,
  type TRISimulationWithData,
} from "@/hooks/tri/useTRISimulations";
import { TRIPDFTemplate } from "@/components/tri-pdf-template";

export type TRISimulatorController = ReturnType<
  typeof useTRISimulatorController
>;

export function useTRISimulatorController() {
  const { toast } = useToast();
  const createSimulation = useCreateTRISimulation();
  const updateSimulation = useUpdateTRISimulation();
  const {
    data: simulations = [],
    isLoading: isLoadingSimulations,
  } = useTRISimulations();
  const deleteSimulation = useDeleteTRISimulation();

  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(
    null
  );
  const [currentSimulationName, setCurrentSimulationName] =
    useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveSimulationName, setSaveSimulationName] = useState("");
  const [deleteDialogSimId, setDeleteDialogSimId] = useState<string | null>(
    null
  );

  const form = useForm<TriFormData>({
    resolver: zodResolver(triFormSchema),
    defaultValues: defaultTriInputs,
    mode: "onChange",
  });

  const watchedValues = form.watch();

  const results = useMemo<TriResult | null>(() => {
    try {
      if (
        watchedValues.acquisitionPrice <= 0 ||
        watchedValues.holdingPeriodYears <= 0
      ) {
        return null;
      }

      const triInputs = {
        ...watchedValues,
        loanAmount:
          watchedValues.loanAmount ||
          watchedValues.acquisitionPrice +
            watchedValues.furniturePrice +
            watchedValues.notaryFees +
            watchedValues.agencyFees +
            watchedValues.worksCost -
            watchedValues.downPayment,
      };

      return computeTri(triInputs);
    } catch (error) {
      console.error("Erreur de calcul TRI:", error);
      return null;
    }
  }, [watchedValues]);

  const chartData = useMemo(() => {
    if (!results) return [];

    let cumulative = -results.totalInvestment;
    const data = [{ year: 0, cumulative, flow: -results.totalInvestment }];

    results.rows.forEach((row) => {
      cumulative += row.cashflow;
      data.push({
        year: row.year,
        cumulative,
        flow: row.cashflow,
      });
    });

    return data;
  }, [results]);

  const handleOpenSaveDialog = () => {
    setSaveSimulationName(
      currentSimulationName ||
        `Simulation du ${new Date().toLocaleDateString("fr-FR")}`
    );
    setIsSaveDialogOpen(true);
  };

  const handleSaveSimulation = async () => {
    if (!saveSimulationName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom pour la simulation.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentSimulationId) {
        await updateSimulation.mutateAsync({
          id: currentSimulationId,
          name: saveSimulationName,
          simulation_data: watchedValues,
        });

        setCurrentSimulationName(saveSimulationName);
        toast({
          title: "Simulation mise à jour",
          description: "Les modifications ont été enregistrées.",
        });
      } else {
        const newSim = await createSimulation.mutateAsync({
          name: saveSimulationName,
          simulation_data: watchedValues,
        });

        setCurrentSimulationId(newSim.id);
        setCurrentSimulationName(saveSimulationName);
        toast({
          title: "Simulation sauvegardée",
          description: "La simulation a été créée avec succès.",
        });
      }

      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving simulation:", error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer la simulation.",
        variant: "destructive",
      });
    }
  };

  const handleLoadSimulation = (simulation: TRISimulationWithData) => {
    form.reset(simulation.simulation_data as TriFormData);
    setCurrentSimulationId(simulation.id);
    setCurrentSimulationName(simulation.name);

    toast({
      title: "Simulation chargée",
      description: `"${simulation.name}" a été chargée.`,
    });
  };

  const handleDeleteSimulation = async (id: string) => {
    try {
      await deleteSimulation.mutateAsync(id);

      if (currentSimulationId === id) {
        setCurrentSimulationId(null);
        setCurrentSimulationName("");
      }

      toast({
        title: "Simulation supprimée",
        description: "La simulation a été supprimée.",
      });

      setDeleteDialogSimId(null);
    } catch (error) {
      console.error("Error deleting simulation:", error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer la simulation.",
        variant: "destructive",
      });
    }
  };

  const handleNewSimulation = () => {
    form.reset(defaultTriInputs);
    setCurrentSimulationId(null);
    setCurrentSimulationName("");

    toast({
      title: "Nouvelle simulation",
      description: "Les champs ont été réinitialisés.",
    });
  };

  const handleExportPDF = async () => {
    if (!results) {
      toast({
        title: "Aucun résultat",
        description: "Veuillez d'abord effectuer une simulation.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Génération en cours",
        description: "Veuillez patienter...",
      });

      const pdfData = {
        simulationName: currentSimulationName || "Simulation TRI",
        generatedAt: new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        inputs: watchedValues,
        results,
      };

      const blob = await pdf(<TRIPDFTemplate data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TRI_${
        currentSimulationName || "Simulation"
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF généré",
        description: "Le fichier a été téléchargé avec succès.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  return {
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
  };
}
