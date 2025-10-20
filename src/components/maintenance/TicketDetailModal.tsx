import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, DollarSign, Wrench } from "lucide-react"
import { MessagesTabLabel } from "./MessagesTabLabel"
import { TicketMessagesPanel } from "./TicketMessagesPanel"
import { ProviderRatingSection } from "./ProviderRatingSection"
import { getPriorityBadge, getStatusBadge, getWorkOrderStatusBadge, formatDate } from "./maintenance-utils"
import type { MaintenanceTicketWithDetails, WorkOrder } from "@/hooks/useMaintenance"

interface TicketDetailModalProps {
  selectedTicket: MaintenanceTicketWithDetails | null
  onClose: () => void
  isLandlord: boolean
  serviceProviders: any[]
  selectedProviderId: string
  onSelectedProviderIdChange: (id: string) => void
  onRateProvider: (providerId: string, providerName: string) => void
  onAssignServiceProvider: (ticketId: string, providerId: string) => void
  onEditTicket: (ticket: MaintenanceTicketWithDetails) => void
  onDeleteTicket: (id: string) => void
  onEditWorkOrder: (workOrder: WorkOrder) => void
  onDeleteWorkOrder: (id: string) => void
  onOpenWorkOrderDialog: (ticket: MaintenanceTicketWithDetails) => void
  isAssigning: boolean
}

export function TicketDetailModal({
  selectedTicket,
  onClose,
  isLandlord,
  serviceProviders,
  selectedProviderId,
  onSelectedProviderIdChange,
  onRateProvider,
  onAssignServiceProvider,
  onEditTicket,
  onDeleteTicket,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onOpenWorkOrderDialog,
  isAssigning,
}: TicketDetailModalProps) {
  if (!selectedTicket) return null

  return (
    <Dialog open={!!selectedTicket} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            {selectedTicket.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="mt-4">
          <TabsList>
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="messages"><MessagesTabLabel ticketId={selectedTicket.id} /></TabsTrigger>
            {isLandlord && <TabsTrigger value="provider">Prestataire</TabsTrigger>}
            {isLandlord && (
              <TabsTrigger value="workorders">
                Ordres de travail ({selectedTicket.work_orders?.length || 0})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Priorité:</span>
                <Badge {...getPriorityBadge(selectedTicket.priority)} className="ml-2 text-xs" />
              </div>
              <div>
                <span className="font-medium">Statut:</span>
                <Badge {...getStatusBadge(selectedTicket.status)} className="ml-2 text-xs" />
              </div>
              {selectedTicket.description && (
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
                </div>
              )}
              <div>
                <span className="font-medium">Bien:</span> {selectedTicket.property?.name}
              </div>
              {selectedTicket.unit && (
                <div>
                  <span className="font-medium">Unité:</span> {selectedTicket.unit.unit_number}
                </div>
              )}
              {selectedTicket.assigned_contact && (
                <div>
                  <span className="font-medium">Assigné à:</span> {selectedTicket.assigned_contact.first_name} {selectedTicket.assigned_contact.last_name}
                </div>
              )}
              {selectedTicket.created_by_contact && (
                <div>
                  <span className="font-medium">Créé par:</span> {selectedTicket.created_by_contact.first_name} {selectedTicket.created_by_contact.last_name}
                </div>
              )}
              <div>
                <span className="font-medium">Créé le:</span> {formatDate(selectedTicket.created_at)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-3">
            <TicketMessagesPanel ticket={selectedTicket} />
          </TabsContent>

          <TabsContent value="provider" className="space-y-4">
            <ProviderRatingSection
              selectedTicket={selectedTicket}
              serviceProviders={serviceProviders}
              onRateProvider={onRateProvider}
            />

            <div className="space-y-3">
              <Label htmlFor="service_provider">Assigner un prestataire</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProviderId}
                  onValueChange={onSelectedProviderIdChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceProviders.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aucun prestataire disponible
                      </SelectItem>
                    ) : (
                      serviceProviders.map((provider) => {
                        const displayName = provider.first_name && provider.last_name
                          ? `${provider.first_name} ${provider.last_name}`
                          : (provider.company_name || provider.email);

                        return (
                          <SelectItem key={provider.user_id} value={provider.user_id}>
                            {displayName}
                            {provider.specialty && ` - ${provider.specialty}`}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => onAssignServiceProvider(selectedTicket.id, selectedProviderId)}
                  disabled={!selectedProviderId || isAssigning}
                >
                  Assigner
                </Button>
              </div>
              {serviceProviders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore ajouté de prestataires.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workorders" className="space-y-4">
            {selectedTicket.work_orders && selectedTicket.work_orders.length > 0 ? (
              <div className="space-y-3">
                {selectedTicket.work_orders.map((wo) => (
                  <Card key={wo.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{wo.contractor_name}</span>
                          <Badge {...getWorkOrderStatusBadge(wo.status)} className="text-xs" />
                        </div>
                        {wo.description && (
                          <div className="text-sm text-muted-foreground">
                            {wo.description}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Devis: {wo.estimated_cost ?? 0}€
                          {wo.actual_cost && wo.actual_cost > 0 && ` • Réel: ${wo.actual_cost}€`}
                        </div>
                        {wo.scheduled_date && (
                          <div className="text-sm text-muted-foreground">
                            Programmé: {new Date(wo.scheduled_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditWorkOrder(wo)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteWorkOrder(wo.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun ordre de travail créé
              </p>
            )}

            <Button variant="outline" size="sm" onClick={() => onOpenWorkOrderDialog(selectedTicket)}>
              <Plus className="w-4 h-4 mr-1" />
              Créer un ordre de travail
            </Button>
          </TabsContent>
        </Tabs>

        {isLandlord && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => onEditTicket(selectedTicket)}>
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteTicket(selectedTicket.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
