import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, TrendingUp, AlertCircle, Building2 } from "lucide-react"
import { usePropertiesWithUnits } from "@/hooks/properties/useProperties"
import { useGlobalProfitability } from "@/hooks/usePropertyProfitability"
import { GlobalProfitabilitySummary } from "@/components/properties/GlobalProfitabilitySummary"
import { PropertyProfitabilityTable } from "@/components/properties/PropertyProfitabilityTable"
import { ProfitabilityCard } from "@/components/properties/ProfitabilityCard"

export default function Profitability() {
  const { data: properties = [], isLoading: propertiesLoading } = usePropertiesWithUnits()
  const { data: profitabilityData, isLoading: profitabilityLoading } = useGlobalProfitability(properties)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

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
      </Tabs>
    </div>
  )
}
