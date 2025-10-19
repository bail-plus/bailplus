import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Home, Plus, Edit, Trash2, Maximize2 } from "lucide-react"
import type { PropertyWithUnits } from "@/hooks/useProperties"
import type { Unit } from "@/hooks/useUnits"

interface UnitsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: PropertyWithUnits | null
  units: Unit[]
  isLoading: boolean
  onAddUnit: () => void
  onEditUnit: (unit: Unit) => void
  onDeleteUnit: (id: string) => void
}

export function UnitsDialog({
  open,
  onOpenChange,
  property,
  units,
  isLoading,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
}: UnitsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Logements - {property?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {units.length} logement(s)
            </p>
            <Button size="sm" onClick={onAddUnit}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un logement
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des logements...</p>
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun logement</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez votre premier logement pour cette propriété.
              </p>
              <Button size="sm" onClick={onAddUnit}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un logement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Logement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Surface</TableHead>
                  <TableHead>Meublé</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_number}</TableCell>
                    <TableCell>{unit.type || "-"}</TableCell>
                    <TableCell>
                      {unit.surface ? (
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" />
                          {unit.surface} m²
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {unit.furnished ? (
                        <Badge variant="default">Oui</Badge>
                      ) : (
                        <Badge variant="secondary">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditUnit(unit)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteUnit(unit.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
