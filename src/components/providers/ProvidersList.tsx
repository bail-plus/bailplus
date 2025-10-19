import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wrench, Edit, Trash2, Euro, Star } from "lucide-react"
import type { ServiceProvider } from "@/hooks/useServiceProviders"

interface ProvidersListProps {
  providers: any[]
  onEditProvider: (provider: ServiceProvider) => void
  onDeleteProvider: (id: string) => void
}

export function ProvidersList({ providers, onEditProvider, onDeleteProvider }: ProvidersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des prestataires</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Entreprise</TableHead>
              <TableHead>Spécialités</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tarif</TableHead>
              <TableHead>Interventions</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-center">
                    <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun prestataire trouvé</h3>
                    <p className="text-muted-foreground">
                      Invitez vos premiers prestataires pour commencer.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider: any) => (
                <TableRow key={provider.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {provider.company_name || `${provider.user.first_name} ${provider.user.last_name}`}
                      </div>
                      {provider.company_name && (
                        <div className="text-sm text-muted-foreground">
                          {provider.user.first_name} {provider.user.last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {provider.specialty?.slice(0, 2).map((spec: string) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {provider.specialty && provider.specialty.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.specialty.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{provider.professional_email || provider.user.email}</div>
                      {provider.professional_phone && (
                        <div className="text-muted-foreground">{provider.professional_phone}</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {provider.hourly_rate ? (
                      <div className="flex items-center gap-1">
                        <Euro className="w-3 h-3" />
                        <span>{provider.hourly_rate} €/h</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{provider.total_interventions || 0}</div>
                    {provider.average_rating && provider.average_rating > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {provider.average_rating.toFixed(1)}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={provider.available ? "default" : "secondary"}>
                      {provider.available ? "Disponible" : "Non disponible"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditProvider(provider)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteProvider(provider.id)}
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
