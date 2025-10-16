import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, FileDown, RotateCcw, Info, TrendingUp, TrendingDown, FolderOpen, Trash2, Upload } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip as TooltipComponent, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import {
  TriFormData,
  triFormSchema,
  defaultTriInputs,
  fiscalRegimeOptions,
  deferredTypeOptions,
  frequencyOptions
} from "@/lib/tri-schemas";
import { computeTri, TriResult } from "@/lib/tri-calculator";
import { formatCurrency, formatPercentage, formatDuration, formatCompactCurrency } from "@/lib/format";
import {
  useCreateTRISimulation,
  useUpdateTRISimulation,
  useTRISimulations,
  useDeleteTRISimulation
} from "@/hooks/useTRISimulations";
import { TRIPDFTemplate } from "@/components/tri-pdf-template";

export default function TRISimulator() {
  const { toast } = useToast();
  const createSimulation = useCreateTRISimulation();
  const updateSimulation = useUpdateTRISimulation();
  const { data: simulations = [], isLoading: isLoadingSimulations } = useTRISimulations();
  const deleteSimulation = useDeleteTRISimulation();

  // State pour la gestion des simulations
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [currentSimulationName, setCurrentSimulationName] = useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveSimulationName, setSaveSimulationName] = useState("");
  const [deleteDialogSimId, setDeleteDialogSimId] = useState<string | null>(null);

  const form = useForm<TriFormData>({
    resolver: zodResolver(triFormSchema),
    defaultValues: defaultTriInputs,
    mode: "onChange"
  });

  const watchedValues = form.watch();

  // Calcul en temps réel des résultats
  const results = useMemo<TriResult | null>(() => {
    try {
      // Petite validation rapide avant calcul
      if (watchedValues.acquisitionPrice <= 0 || watchedValues.holdingPeriodYears <= 0) {
        return null;
      }

      const triInputs = {
        ...watchedValues,
        loanAmount: watchedValues.loanAmount ||
          (watchedValues.acquisitionPrice + watchedValues.furniturePrice + watchedValues.notaryFees +
           watchedValues.agencyFees + watchedValues.worksCost - watchedValues.downPayment)
      };

      const result = computeTri(triInputs);
      return result;
    } catch (error) {
      console.error('Erreur de calcul TRI:', error);
      return null;
    }
  }, [watchedValues]);

  // Données pour le graphique des flux cumulés
  const chartData = useMemo(() => {
    if (!results) return [];
    
    let cumulative = -results.totalInvestment;
    const data = [{ year: 0, cumulative, flow: -results.totalInvestment }];
    
    results.rows.forEach(row => {
      cumulative += row.cashflow;
      data.push({
        year: row.year,
        cumulative,
        flow: row.cashflow
      });
    });
    
    return data;
  }, [results]);

  // Ouvrir la dialog de sauvegarde
  const handleOpenSaveDialog = () => {
    setSaveSimulationName(currentSimulationName || `Simulation du ${new Date().toLocaleDateString('fr-FR')}`);
    setIsSaveDialogOpen(true);
  };

  // Sauvegarder ou mettre à jour une simulation
  const handleSaveSimulation = async () => {
    if (!saveSimulationName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom pour la simulation.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (currentSimulationId) {
        // UPDATE si simulation existante
        await updateSimulation.mutateAsync({
          id: currentSimulationId,
          name: saveSimulationName,
          simulation_data: watchedValues
        });

        setCurrentSimulationName(saveSimulationName);

        toast({
          title: "Simulation mise à jour",
          description: "Les modifications ont été enregistrées."
        });
      } else {
        // CREATE nouvelle simulation
        const newSim = await createSimulation.mutateAsync({
          name: saveSimulationName,
          simulation_data: watchedValues
        });

        setCurrentSimulationId(newSim.id);
        setCurrentSimulationName(saveSimulationName);

        toast({
          title: "Simulation sauvegardée",
          description: "La simulation a été créée avec succès."
        });
      }

      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible d'enregistrer la simulation.",
        variant: "destructive"
      });
    }
  };

  // Charger une simulation
  const handleLoadSimulation = (simulation: typeof simulations[0]) => {
    form.reset(simulation.simulation_data as TriFormData);
    setCurrentSimulationId(simulation.id);
    setCurrentSimulationName(simulation.name);

    toast({
      title: "Simulation chargée",
      description: `"${simulation.name}" a été chargée.`
    });
  };

  // Supprimer une simulation
  const handleDeleteSimulation = async (id: string) => {
    try {
      await deleteSimulation.mutateAsync(id);

      if (currentSimulationId === id) {
        setCurrentSimulationId(null);
        setCurrentSimulationName("");
      }

      toast({
        title: "Simulation supprimée",
        description: "La simulation a été supprimée."
      });

      setDeleteDialogSimId(null);
    } catch (error) {
      console.error('Error deleting simulation:', error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer la simulation.",
        variant: "destructive"
      });
    }
  };

  // Nouvelle simulation
  const handleNewSimulation = () => {
    form.reset(defaultTriInputs);
    setCurrentSimulationId(null);
    setCurrentSimulationName("");

    toast({
      title: "Nouvelle simulation",
      description: "Les champs ont été réinitialisés."
    });
  };

  const handleExportPDF = async () => {
    if (!results) {
      toast({
        title: "Aucun résultat",
        description: "Veuillez d'abord effectuer une simulation.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Génération en cours",
        description: "Veuillez patienter..."
      });

      const pdfData = {
        simulationName: currentSimulationName || "Simulation TRI",
        generatedAt: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        inputs: watchedValues,
        results: results
      };

      const blob = await pdf(<TRIPDFTemplate data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TRI_${currentSimulationName || 'Simulation'}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF généré",
        description: "Le fichier a été téléchargé avec succès."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF.",
        variant: "destructive"
      });
    }
  };


  const getTRIBadgeVariant = (tri: number, discountRate: number) => {
    if (isNaN(tri)) return "outline";
    return tri > discountRate ? "default" : "secondary";
  };

  const getTRIIcon = (tri: number, discountRate: number) => {
    if (isNaN(tri)) return null;
    return tri > discountRate ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-orange-600" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TRI - Simulateur d'Investissement</h1>
          <p className="text-muted-foreground mt-1">
            {currentSimulationName ? (
              <>Simulation : <span className="font-semibold">{currentSimulationName}</span></>
            ) : (
              "Calculez le taux de rendement interne et la rentabilité de votre projet immobilier"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNewSimulation}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Nouvelle
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenSaveDialog}>
            <Save className="w-4 h-4 mr-2" />
            {currentSimulationId ? "Mettre à jour" : "Sauvegarder"}
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <FileDown className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Liste des simulations sauvegardées */}
      {simulations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Simulations sauvegardées ({simulations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    currentSimulationId === sim.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{sim.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Créée le {new Date(sim.created_at).toLocaleDateString('fr-FR')}
                      {sim.updated_at !== sim.created_at && (
                        <> · Modifiée le {new Date(sim.updated_at).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadSimulation(sim)}
                      disabled={currentSimulationId === sim.id}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Charger
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogSimId(sim.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bannière des résultats */}
      {results ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TRI Annuel</CardTitle>
              <TooltipProvider>
                <TooltipComponent>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Taux de Rendement Interne sur base annuelle</p>
                  </TooltipContent>
                </TooltipComponent>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  {isNaN(results.irrAnnual) ? "N/A" : formatPercentage(results.irrAnnual)}
                </div>
                {getTRIIcon(results.irrAnnual, watchedValues.discountRate)}
              </div>
              <Badge 
                variant={getTRIBadgeVariant(results.irrAnnual, watchedValues.discountRate)}
                className="mt-2"
              >
                {isNaN(results.irrAnnual) 
                  ? "Non calculable" 
                  : results.irrAnnual > watchedValues.discountRate 
                    ? "Projet viable" 
                    : "À reconsidérer"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VAN / NPV</CardTitle>
              <TooltipProvider>
                <TooltipComponent>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Valeur Actuelle Nette à {formatPercentage(watchedValues.discountRate)}</p>
                  </TooltipContent>
                </TooltipComponent>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCompactCurrency(results.npv)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Actualisation: {formatPercentage(watchedValues.discountRate)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash-flow Année 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCompactCurrency(results.cashflowYear1Annual)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(results.cashflowYear1Monthly)}/mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {results.paybackYear ? `${results.paybackYear} ans` : "Non atteint"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Récupération investissement
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Interprétation et Astuces */}
      {results && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="interpretation">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Interprétation des résultats
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {results.interpretation}
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Conseils d'optimisation :</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Augmentez l'apport personnel pour réduire les intérêts</li>
                    <li>• Négociez le taux de crédit et l'assurance emprunteur</li>
                    <li>• Optimisez votre régime fiscal selon votre situation</li>
                    <li>• Considérez les travaux déductibles pour réduire l'impôt</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des flux */}
        {results && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Évolution des flux de trésorerie cumulés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      label={{ value: 'Années', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Euros', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => formatCompactCurrency(value)}
                    />
                    <Tooltip 
                      labelFormatter={(value) => `Année ${value}`}
                      formatter={(value: any, name: string) => [
                        formatCurrency(value), 
                        name === 'cumulative' ? 'Flux cumulé' : 'Flux annuel'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau annuel */}
        {results && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Projection annuelle détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">Revenus locatifs</TableHead>
                      <TableHead className="text-right">Charges déductibles</TableHead>
                      <TableHead className="text-right">Intérêts d'emprunt</TableHead>
                      <TableHead className="text-right">Travaux déductibles</TableHead>
                      <TableHead className="text-right">Amortissements</TableHead>
                      <TableHead className="text-right">Impôt sur le revenu</TableHead>
                      <TableHead className="text-right">Prélèvements sociaux</TableHead>
                      <TableHead className="text-right">Fiscalité totale</TableHead>
                      <TableHead className="text-right">Flux de trésorerie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.rows.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.rents)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.charges)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interests)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.works)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amortizations)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.incomeTax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.socialTax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalTax)}</TableCell>
                        <TableCell className={`text-right font-medium ${row.cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(row.cashflow)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulaire de paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-8">
              {/* Coût d'achat */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Coût d'achat</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="acquisitionPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d'acquisition (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="150 000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notaryFees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais de notaire (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12 000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agencyFees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais d'agence (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="furniturePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobilier/électroménager (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="worksCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant des travaux (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="worksDeductible"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2 h-10">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Travaux déductibles
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Revenus & charges */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Revenus & charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="rents"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Montant des loyers</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="800"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rentsFrequency"
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>Périodicité</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="charges"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Charges déductibles</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="200"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="chargesFrequency"
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>Périodicité</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencyOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="vacancyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de vacance locative (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rentsGrowthRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Évolution annuelle des loyers (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chargesGrowthRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Évolution annuelle des charges (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Financement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="downPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant de l'apport (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30 000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loanDurationMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée de l'emprunt (mois)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="240"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(field.value)}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loanRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de crédit annuel (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="3.50"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="insuranceRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux d'assurance emprunteur (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.40"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deferredType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Différé de remboursement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deferredTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedValues.deferredType !== 'none' && (
                    <FormField
                      control={form.control}
                      name="deferredMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée du différé (mois)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="6"
                              max={24}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Fiscalité */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Situation fiscale</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fiscalRegime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Régime fiscal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fiscalRegimeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marginalTaxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tranche marginale d'imposition (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="socialTaxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prélèvements sociaux (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="17.2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Cession du bien */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cession du bien</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="holdingPeriodYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée de détention (années)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="20"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resaleValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur de revente (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="300 000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capitalGainsTaxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impôt sur plus-value (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="36.2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actualisation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Actualisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <TooltipProvider>
                          <TooltipComponent>
                            <TooltipTrigger asChild>
                              <FormLabel className="flex items-center gap-1">
                                Taux d'actualisation pour VAN (%)
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </FormLabel>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Taux de rendement minimum exigé (coût d'opportunité)</p>
                            </TooltipContent>
                          </TooltipComponent>
                        </TooltipProvider>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="4"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>
          <strong>Simulation indicative – non constitutive d'un conseil fiscal.</strong><br />
          Les calculs sont basés sur les données saisies et les hypothèses retenues.
          Consultez un conseiller fiscal pour votre situation personnelle.
        </p>
      </div>

      {/* Dialog de sauvegarde */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentSimulationId ? "Mettre à jour la simulation" : "Sauvegarder la simulation"}
            </DialogTitle>
            <DialogDescription>
              {currentSimulationId
                ? "Donnez un nouveau nom ou gardez le même pour mettre à jour cette simulation."
                : "Donnez un nom à votre simulation pour pouvoir la retrouver facilement."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="simulation-name">Nom de la simulation</Label>
              <Input
                id="simulation-name"
                value={saveSimulationName}
                onChange={(e) => setSaveSimulationName(e.target.value)}
                placeholder="Ex: Appartement Paris 15ème"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveSimulation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSimulation} disabled={!saveSimulationName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {currentSimulationId ? "Mettre à jour" : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog open={!!deleteDialogSimId} onOpenChange={() => setDeleteDialogSimId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la simulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette simulation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogSimId && handleDeleteSimulation(deleteDialogSimId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}