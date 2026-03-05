import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Building2, Loader2 } from "lucide-react"
import type { GlobalProfitability } from "@/hooks/usePropertyProfitability"

interface PropertyProfitabilityTableProps {
  data: GlobalProfitability | undefined
  isLoading: boolean
}

export function PropertyProfitabilityTable({ data, isLoading }: PropertyProfitabilityTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Rentabilité par propriété
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.properties.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Rentabilité par propriété
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Ajoutez des propriétés avec leurs informations financières pour voir la rentabilité.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filtrer les propriétés qui ont des données financières
  const propertiesWithData = data.properties.filter(p => p.totalInvestment > 0)

  if (propertiesWithData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Rentabilité par propriété
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Complétez les informations financières de vos propriétés pour calculer leur rentabilité.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Rentabilité par propriété
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propriété</TableHead>
                <TableHead className="text-right">Investissement</TableHead>
                <TableHead className="text-right">Revenus/an</TableHead>
                <TableHead className="text-right">Charges/an</TableHead>
                <TableHead className="text-right">Impôts/an</TableHead>
                <TableHead className="text-right">Cash-flow net</TableHead>
                <TableHead className="text-right">Renta. brute</TableHead>
                <TableHead className="text-right">Renta. nette</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertiesWithData.map((property) => (
                <TableRow key={property.propertyId}>
                  <TableCell className="font-medium">{property.propertyName}</TableCell>
                  <TableCell className="text-right text-sm">
                    {property.totalInvestment.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })} €
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {property.totalIncome.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })} €
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {property.annualCharges.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })} €
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {property.totalTax > 0 ? (
                      <span className="text-red-600">
                        {property.totalTax.toLocaleString('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} €
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={property.annualNetCashFlowAfterTax >= 0 ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {property.annualNetCashFlowAfterTax >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {property.annualNetCashFlowAfterTax.toLocaleString('fr-FR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })} €
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-semibold">
                      {property.grossYield.toFixed(2)} %
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={property.netYieldAfterTax >= 0 ? "default" : "destructive"}
                      className="font-semibold"
                    >
                      {property.netYieldAfterTax.toFixed(2)} %
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
