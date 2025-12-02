import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatPercentage,
  formatCompactCurrency,
} from "@/lib/format";
import type { TriResult } from "@/lib/tri-calculator";

type ChartPoint = {
  year: number;
  cumulative: number;
  flow: number;
};

type TRIResultsSectionProps = {
  results: TriResult | null;
  chartData: ChartPoint[];
  discountRate: number;
};

const getTRIBadgeVariant = (tri: number, discountRate: number) => {
  if (isNaN(tri)) return "outline";
  return tri > discountRate ? "default" : "secondary";
};

const getTRIIcon = (tri: number, discountRate: number) => {
  if (isNaN(tri)) return null;

  return tri > discountRate ? (
    <TrendingUp className="w-4 h-4 text-green-600" />
  ) : (
    <TrendingDown className="w-4 h-4 text-orange-600" />
  );
};

export function TRIResultsSection({
  results,
  chartData,
  discountRate,
}: TRIResultsSectionProps) {
  if (!results) {
    return null;
  }

  return (
    <>
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
                {isNaN(results.irrAnnual)
                  ? "N/A"
                  : formatPercentage(results.irrAnnual)}
              </div>
              {getTRIIcon(results.irrAnnual, discountRate)}
            </div>
            <Badge
              variant={getTRIBadgeVariant(results.irrAnnual, discountRate)}
              className="mt-2"
            >
              {isNaN(results.irrAnnual)
                ? "Non calculable"
                : results.irrAnnual > discountRate
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
                  <p>
                    Valeur Actuelle Nette à {formatPercentage(discountRate)}
                  </p>
                </TooltipContent>
              </TooltipComponent>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactCurrency(results.npv)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Actualisation: {formatPercentage(discountRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cash-flow Année 1
            </CardTitle>
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
                <h4 className="font-medium mb-2">
                  Conseils d&apos;optimisation :
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Augmentez l&apos;apport personnel pour réduire les intérêts</li>
                  <li>• Négociez le taux de crédit et l&apos;assurance emprunteur</li>
                  <li>• Optimisez votre régime fiscal selon votre situation</li>
                  <li>• Considérez les travaux déductibles pour réduire l&apos;impôt</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    label={{ value: "Années", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis
                    label={{ value: "Euros", angle: -90, position: "insideLeft" }}
                    tickFormatter={(value) => formatCompactCurrency(value)}
                  />
                  <RechartsTooltip
                    labelFormatter={(value) => `Année ${value}`}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "cumulative" ? "Flux cumulé" : "Flux annuel",
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
                    <TableHead className="text-right">
                      Charges déductibles
                    </TableHead>
                    <TableHead className="text-right">
                      Intérêts d&apos;emprunt
                    </TableHead>
                    <TableHead className="text-right">
                      Travaux déductibles
                    </TableHead>
                    <TableHead className="text-right">Amortissements</TableHead>
                    <TableHead className="text-right">
                      Impôt sur le revenu
                    </TableHead>
                    <TableHead className="text-right">
                      Prélèvements sociaux
                    </TableHead>
                    <TableHead className="text-right">Fiscalité totale</TableHead>
                    <TableHead className="text-right">Flux de trésorerie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.rows.map((row) => (
                    <TableRow key={row.year}>
                      <TableCell className="font-medium">{row.year}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.rents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.charges)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.interests)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.works)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.amortizations)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.incomeTax)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.socialTax)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.totalTax)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          row.cashflow >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(row.cashflow)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
