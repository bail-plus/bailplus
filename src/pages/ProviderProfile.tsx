import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Wrench, Star, TrendingUp, Users, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useMyProviderRatings, useMyProviderRatingStats } from "@/hooks/useProviderRatings"
import { Progress } from "@/components/ui/progress"
import type { ServiceProvider } from "@/hooks/useServiceProviders"

const SPECIALTIES = [
  "Plomberie",
  "Électricité",
  "Chauffage",
  "Climatisation",
  "Peinture",
  "Menuiserie",
  "Serrurerie",
  "Vitrier",
  "Maçonnerie",
  "Toiture",
  "Jardinage",
  "Nettoyage",
  "Autre"
]

export default function ProviderProfile() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    company_name: "",
    specialty: [] as string[],
    professional_email: "",
    professional_phone: "",
    hourly_rate: null as number | null,
    siret: "",
    address: "",
    available: true,
    insurance_certificate_url: "",
    insurance_expiry_date: "",
  })

  const { data: ratings = [], isLoading: ratingsLoading } = useMyProviderRatings()
  const { data: stats, isLoading: statsLoading } = useMyProviderRatingStats()

  // Charger les données du prestataire
  useEffect(() => {
    async function loadProvider() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          toast({
            title: "Erreur",
            description: "Profil prestataire non trouvé",
            variant: "destructive",
          })
          return
        }

        setProvider(data as ServiceProvider)
        setFormData({
          company_name: data.company_name || "",
          specialty: data.specialty || [],
          professional_email: data.professional_email || "",
          professional_phone: data.professional_phone || "",
          hourly_rate: data.hourly_rate,
          siret: data.siret || "",
          address: data.address || "",
          available: data.available ?? true,
          insurance_certificate_url: data.insurance_certificate_url || "",
          insurance_expiry_date: data.insurance_expiry_date || "",
        })
      } catch (error) {
        console.error('Error loading provider:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProvider()
  }, [user, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('service_providers')
        .update(formData)
        .eq('id', provider.id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      })

      // Recharger les données
      const { data } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (data) setProvider(data as ServiceProvider)
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre profil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Profil prestataire non trouvé</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations professionnelles et consultez vos notes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Note Moyenne</span>
            </div>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.average_rating.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sur 5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total d'avis</span>
            </div>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.total_ratings || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              avis reçus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Interventions</span>
            </div>
            <div className="text-2xl font-bold">
              {provider.total_interventions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              réalisées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Statut</span>
            </div>
            <Badge variant={provider.available ? "default" : "secondary"} className="mt-2">
              {provider.available ? "Disponible" : "Non disponible"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats && stats.total_ratings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition des notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution]
              const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                  </div>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Latest Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers avis</CardTitle>
        </CardHeader>
        <CardContent>
          {ratingsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement des avis...</p>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun avis pour le moment</h3>
              <p className="text-muted-foreground">
                Vos avis apparaîtront ici après vos interventions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.slice(0, 5).map((rating) => (
                <div key={rating.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">
                        {rating.rated_by_user?.first_name} {rating.rated_by_user?.last_name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.ticket && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Ticket : {rating.ticket.title}
                    </p>
                  )}
                  {rating.comment && (
                    <p className="text-sm">{rating.comment}</p>
                  )}
                </div>
              ))}
              {ratings.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Et {ratings.length - 5} autres avis...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mes informations professionnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Ex: Plomberie Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label>Mes spécialités</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {SPECIALTIES.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={`specialty-${specialty}`}
                      checked={formData.specialty.includes(specialty)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            specialty: [...formData.specialty, specialty]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            specialty: formData.specialty.filter(s => s !== specialty)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`specialty-${specialty}`} className="cursor-pointer text-sm">
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="professional_email">Email professionnel</Label>
                <Input
                  id="professional_email"
                  type="email"
                  value={formData.professional_email}
                  onChange={(e) => setFormData({ ...formData, professional_email: e.target.value })}
                  placeholder="contact@entreprise.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_phone">Téléphone professionnel</Label>
                <Input
                  id="professional_phone"
                  value={formData.professional_phone}
                  onChange={(e) => setFormData({ ...formData, professional_phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarif horaire (€)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate || ""}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  placeholder="123 456 789 00010"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse professionnelle</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue Example, 75001 Paris"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_certificate_url">URL certificat d'assurance</Label>
                <Input
                  id="insurance_certificate_url"
                  value={formData.insurance_certificate_url}
                  onChange={(e) => setFormData({ ...formData, insurance_certificate_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_expiry_date">Date d'expiration assurance</Label>
                <Input
                  id="insurance_expiry_date"
                  type="date"
                  value={formData.insurance_expiry_date}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData({ ...formData, available: checked as boolean })}
              />
              <Label htmlFor="available" className="cursor-pointer">
                Je suis actuellement disponible pour de nouvelles missions
              </Label>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
