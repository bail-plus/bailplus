import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, AlertCircle, Building2, LineChart } from "lucide-react"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useGlobalProfitability, useGlobalProjection, usePropertyProjection } from "@/hooks/usePropertyProfitability"
import { GlobalProfitabilitySummary } from "@/components/properties/GlobalProfitabilitySummary"
import { PropertyProfitabilityTable } from "@/components/properties/PropertyProfitabilityTable"
import { ProfitabilityCard } from "@/components/properties/ProfitabilityCard"
import { ProjectionChart } from "@/components/properties/ProjectionChart"
import { ProjectionTimeline } from "@/components/properties/ProjectionTimeline"

export default function Profitability() {
  const { data: properties = [], isLoading: propertiesLoading } = usePropertiesWithUnits()
  const { data: profitabilityData, isLoading: profitabilityLoading } = useGlobalProfitability(properties)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  // États pour la projection
  const [projectionYears, setProjectionYears] = useState(25)
  const [inflationRate, setInflationRate] = useState(2.0)
  const [projectionPropertyId, setProjectionPropertyId] = useState<string | "all">("all")

  // Récupération des données de projection selon le filtre
  const selectedProjectionProperty = projectionPropertyId === "all"
    ? null
    : properties.find(p => p.id === projectionPropertyId) || null

  const { data: globalProjectionData, isLoading: globalProjectionLoading } = useGlobalProjection(
    properties,
    projectionYears,
    inflationRate
  )

  const { data: singleProjectionData, isLoading: singleProjectionLoading } = usePropertyProjection(
    selectedProjectionProperty,
    projectionYears,
    inflationRate
  )

  // Utiliser les bonnes données selon le filtre
  const projectionData = projectionPropertyId === "all" ? globalProjectionData : singleProjectionData
  const projectionLoading = projectionPropertyId === "all" ? globalProjectionLoading : singleProjectionLoading

  const selectedProperty = properties.find(p => p.id === selectedPropertyId)
  const selectedPropertyProfit = profitabilityData?.properties.find(p => p.propertyId === selectedPropertyId)

  const hasFinancialData = profitabilityData?.totalInvestment && profitabilityData.totalInvestment > 0

  if (propertiesLoading || profitabilityLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rentabilité</h1>
            <p className="text-muted-foreground mt-1">
              Analyse de la rentabilité de votre parc immobilier
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des données de rentabilité...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Rentabilité
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyse de la rentabilité de votre parc immobilier
          </p>
        </div>
      </div>

      {/* Alert si pas de données financières */}
      {!hasFinancialData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pour calculer la rentabilité, ajoutez les <strong>informations financières</strong> de vos propriétés
            (prix d'achat, frais, charges) et créez des <strong>baux actifs</strong> pour vos logements.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList>
          <TabsTrigger value="global" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Vue globale
          </TabsTrigger>
          <TabsTrigger value="by-property" className="gap-2">
            <Building2 className="w-4 h-4" />
            Par propriété
          </TabsTrigger>
          <TabsTrigger value="projection" className="gap-2">
            <LineChart className="w-4 h-4" />
            Projection
          </TabsTrigger>
        </TabsList>

        {/* Vue globale */}
        <TabsContent value="global" className="space-y-6">
          {/* KPIs globaux */}
          <GlobalProfitabilitySummary data={profitabilityData} isLoading={profitabilityLoading} />

          {/* Tableau détaillé par propriété */}
          <PropertyProfitabilityTable data={profitabilityData} isLoading={profitabilityLoading} />

          {/* Informations et conseils */}
          {hasFinancialData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Comprendre vos indicateurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Rentabilité brute</h4>
                  <p className="text-sm text-muted-foreground">
                    Formule : (Revenus locatifs annuels / Investissement total) × 100
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Indicateur de performance avant prise en compte des charges. Une bonne rentabilité brute se situe généralement entre 5% et 10%.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rentabilité nette</h4>
                  <p className="text-sm text-muted-foreground">
                    Formule : (Cash-flow net annuel / Investissement total) × 100
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Indicateur de performance réelle après déduction de toutes les charges et impôts (si configurés).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Cash-flow net</h4>
                  <p className="text-sm text-muted-foreground">
                    Formule : Revenus annuels - Charges annuelles - Impôts (si configurés)
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Argent disponible chaque année après paiement de toutes les charges et impôts. Un cash-flow positif est essentiel pour la pérennité de votre investissement.
                  </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 space-y-2">
                    <p>
                      <strong>⚖️ Avertissement légal :</strong> Les calculs fiscaux fournis par cette application sont donnés <strong>à titre purement indicatif</strong> et ne constituent en aucun cas un conseil fiscal, juridique ou comptable.
                    </p>
                    <p className="text-xs">
                      La réglementation fiscale française est complexe et évolue régulièrement. Chaque situation est unique et dépend de nombreux facteurs personnels.
                      Pour toute décision d'investissement ou optimisation fiscale, nous vous recommandons vivement de consulter des professionnels qualifiés :
                      <strong> expert-comptable, avocat fiscaliste, conseiller en gestion de patrimoine (CGP)</strong>.
                    </p>
                    <p className="text-xs">
                      BailoGenius décline toute responsabilité en cas d'erreur, d'imprécision ou de conséquence liée à l'utilisation de ces calculs.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vue par propriété */}
        <TabsContent value="by-property" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez une propriété</CardTitle>
              <CardDescription>
                Cliquez sur une propriété pour voir son analyse détaillée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => {
                  const profit = profitabilityData?.properties.find(p => p.propertyId === property.id)
                  const isSelected = selectedPropertyId === property.id
                  const hasData = profit && profit.totalInvestment > 0

                  return (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'border-primary border-2 shadow-lg' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPropertyId(property.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{property.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {property.address}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {hasData ? (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Rentabilité nette</span>
                              <span className={`font-semibold ${profit.netYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profit.netYield.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cash-flow/an</span>
                              <span className={`font-semibold ${profit.annualNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profit.annualNetCashFlow.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Complétez les informations financières
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Détail de la propriété sélectionnée */}
          {selectedProperty && (
            <ProfitabilityCard
              property={selectedProperty}
              annualRentalIncome={selectedPropertyProfit?.annualRentalIncome ?? 0}
            />
          )}
        </TabsContent>

        {/* Projection à long terme */}
        <TabsContent value="projection" className="space-y-6">
          {!hasFinancialData ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complétez les informations financières de vos propriétés et créez des baux actifs
                pour visualiser les projections à long terme.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Contrôles de simulation */}
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de projection</CardTitle>
                  <CardDescription>
                    Ajustez les paramètres pour personnaliser votre projection financière
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sélection de propriété */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="projection-property">
                          Propriété à projeter
                        </Label>
                        <Select
                          value={projectionPropertyId}
                          onValueChange={(value) => setProjectionPropertyId(value)}
                        >
                          <SelectTrigger id="projection-property">
                            <SelectValue placeholder="Sélectionner une propriété" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Toutes les propriétés
                              </div>
                            </SelectItem>
                            {properties
                              .filter(p => {
                                const totalInvestment =
                                  (p.purchase_price ?? 0) +
                                  (p.notary_fees ?? 0) +
                                  (p.agency_fees ?? 0) +
                                  (p.renovation_costs ?? 0) +
                                  (p.other_acquisition_costs ?? 0)
                                return totalInvestment > 0
                              })
                              .map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {projectionPropertyId === "all"
                            ? "Vue consolidée de tout le parc"
                            : "Vue détaillée d'une propriété"}
                        </p>
                      </div>
                    </div>

                    {/* Durée de projection */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="projection-years">
                          Durée de projection : <strong>{projectionYears} ans</strong>
                        </Label>
                        <Slider
                          id="projection-years"
                          min={5}
                          max={50}
                          step={5}
                          value={[projectionYears]}
                          onValueChange={(value) => setProjectionYears(value[0])}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Projection jusqu'en {new Date().getFullYear() + projectionYears}
                        </p>
                      </div>
                    </div>

                    {/* Taux d'inflation */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inflation-rate">
                          Taux d'inflation annuel : <strong>{inflationRate}%</strong>
                        </Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="inflation-rate"
                            min={0}
                            max={5}
                            step={0.1}
                            value={[inflationRate]}
                            onValueChange={(value) => setInflationRate(value[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={inflationRate}
                            onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                            min={0}
                            max={10}
                            step={0.1}
                            className="w-20"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Appliqué aux loyers et charges annuellement
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {projectionLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Calcul de la projection...</p>
                  </div>
                </div>
              ) : projectionData ? (
                <>
                  {/* Timeline détaillée */}
                  <ProjectionTimeline
                    data={projectionData.yearlyProjections}
                    initialInvestment={profitabilityData?.totalInvestment ?? 0}
                    roiYear={projectionData.roiYear ?? undefined}
                  />

                  {/* Graphiques */}
                  <ProjectionChart
                    data={projectionData.yearlyProjections}
                    propertyValue={profitabilityData?.totalInvestment ?? 0}
                  />
                </>
              ) : null}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
