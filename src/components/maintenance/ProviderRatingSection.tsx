import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Star } from "lucide-react"
import { useCheckUserRating } from "@/hooks/useProviderRatings"
import type { MaintenanceTicketWithDetails } from "@/hooks/useMaintenance"

interface ProviderRatingSectionProps {
  selectedTicket: MaintenanceTicketWithDetails
  serviceProviders: any[]
  onRateProvider: (providerId: string, providerName: string) => void
}

export function ProviderRatingSection({
  selectedTicket,
  serviceProviders,
  onRateProvider
}: ProviderRatingSectionProps) {
  const provider = serviceProviders.find(p => p.user_id === selectedTicket.assigned_to)

  const { data: existingRating } = useCheckUserRating(
    provider?.user_id || provider?.id || '',
    selectedTicket.id
  )

  if (!selectedTicket.assigned_contact) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p>Aucun prestataire assigné</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {selectedTicket.assigned_contact.first_name} {selectedTicket.assigned_contact.last_name}
                </p>
                {selectedTicket.assigned_contact.phone && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.assigned_contact.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Assigné</Badge>

              {selectedTicket.status === "TERMINE" && provider && (
                existingRating ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{existingRating.rating}/5</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Vous avez déjà noté ce prestataire pour ce ticket
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRateProvider(
                        provider.user_id || provider.id,
                        `${selectedTicket.assigned_contact?.first_name} ${selectedTicket.assigned_contact?.last_name}`
                      )
                    }}
                    className="gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Noter
                  </Button>
                )
              )}

              {selectedTicket.status !== "TERMINE" && (
                <p className="text-xs text-muted-foreground">
                  Disponible une fois terminé
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
