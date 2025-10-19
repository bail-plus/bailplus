import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, MapPin, Home, Edit, Trash2 } from "lucide-react"
import type { PropertyWithUnits } from "@/hooks/useProperties"

interface PropertiesListProps {
  properties: PropertyWithUnits[]
  onOpenUnitsDialog: (property: PropertyWithUnits) => void
  onEditProperty: (property: PropertyWithUnits) => void
  onDeleteProperty: (id: string) => void
}

export function PropertiesList({
  properties,
  onOpenUnitsDialog,
  onEditProperty,
  onDeleteProperty,
}: PropertiesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des propriétés</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Logements</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune propriété trouvée</h3>
                    <p className="text-muted-foreground">
                      Commencez par ajouter votre première propriété.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              properties.map((property) => (
                <TableRow
                  key={property.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onOpenUnitsDialog(property)}
                >
                  <TableCell>
                    <div className="font-medium">{property.name}</div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {property.address}
                      </div>
                      {property.city && (
                        <div className="text-muted-foreground mt-1">
                          {property.postal_code} {property.city}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      <Home className="w-3 h-3 mr-1" />
                      {property.unitsCount ?? 0}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditProperty(property)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProperty(property.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
