import { UseFormReturn } from "react-hook-form";
import { Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TriFormData,
  frequencyOptions,
  deferredTypeOptions,
  fiscalRegimeOptions,
} from "@/lib/tri-schemas";
import { formatDuration } from "@/lib/format";

type TRIParametersFormProps = {
  form: UseFormReturn<TriFormData>;
  watchedValues: TriFormData;
};

export function TRIParametersForm({
  form,
  watchedValues,
}: TRIParametersFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de simulation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Coût d&apos;achat</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="acquisitionPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d&apos;acquisition (€)</FormLabel>
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
                      <FormLabel>Frais d&apos;agence (€)</FormLabel>
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
            </section>

            <section className="space-y-4">
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                        <FormLabel>Charges de copropriété</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                    name="otherCharges"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Autres charges (€)</FormLabel>
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
                    name="otherChargesFrequency"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Périodicité</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vacancyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de vacance (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5"
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
                  name="rentGrowthRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Évolution annuelle des loyers (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1.5"
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
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Financement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="downPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant de l&apos;apport (€)</FormLabel>
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
                      <FormLabel>Durée de l&apos;emprunt (mois)</FormLabel>
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
                      <FormLabel>Taux d&apos;assurance emprunteur (%)</FormLabel>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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

                {watchedValues.deferredType !== "none" && (
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
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Situation fiscale</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="fiscalRegime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régime fiscal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                      <FormLabel>Tranche marginale d&apos;imposition (%)</FormLabel>
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
            </section>

            <section className="space-y-4">
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
                  name="resalePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de revente estimé (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="220 000"
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
                  name="resaleCostsPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de cession (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="7"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="capitalGainTaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxe sur la plus-value (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="19"
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
                  name="socialTaxCapitalGainRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prélèvements sociaux PV (%)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="capitalGainAllowanceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abattement pour durée de détention (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="6"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Trésorerie & amortissements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="initialCash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trésorerie initiale (€)</FormLabel>
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
                  name="furnitureAmortizationYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée amortissement mobilier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="7"
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
                  name="worksAmortizationYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée amortissement travaux</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="buildingAmortizationYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée amortissement immeuble</FormLabel>
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
                  name="loanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant du prêt (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="280 000"
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
                  name="insuranceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d&apos;assurance</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">
                            Mensualités constantes
                          </SelectItem>
                          <SelectItem value="capital">
                            Sur capital restant dû
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Hypothèses avancées</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maintenanceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taux de maintenance annuelle (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="1"
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
                  name="managementFeesRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de gestion (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="6"
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
                  name="additionalRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenus supplémentaires €/an</FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="additionalCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coûts supplémentaires €/an</FormLabel>
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
                  name="fiscalOptimization"
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
                          Optimisation fiscale
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fiscalOptimizationAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant optimisation fiscale (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          disabled={!watchedValues.fiscalOptimization}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="space-y-4">
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
                              Taux d&apos;actualisation pour VAN (%)
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </FormLabel>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Taux de rendement minimum exigé (coût d&apos;opportunité)</p>
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
            </section>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
