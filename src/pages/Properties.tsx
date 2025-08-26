import { useState, useEffect } from "react"
import { Building2, MapPin, Users, Plus, Eye, Edit, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const statusConfig = {
  occupied: { label: "Occupé", variant: "default" as const },
  vacant: { label: "Vacant", variant: "secondary" as const },
  maintenance: { label: "Maintenance", variant: "destructive" as const }
}

const Properties = () => {
  const { toast } = useToast()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
      
      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error loading properties:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les biens",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des biens...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Parc immobilier</h1>
          <p className="text-muted-foreground">
            Gérez vos propriétés et lots
          </p>
        </div>
        <Button 
          className="bg-gradient-primary"
          onClick={() => toast({
            title: "Fonctionnalité en développement",
            description: "Cette fonctionnalité sera bientôt disponible"
          })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un bien
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total biens</span>
          </div>
          <div className="text-2xl font-bold mt-2">{properties.length}</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Occupés</span>
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-muted-foreground">Vacants</span>
          </div>
          <div className="text-2xl font-bold mt-2">0</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Surface totale</span>
          </div>
          <div className="text-2xl font-bold mt-2">0 m²</div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun bien trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore ajouté de biens immobiliers.
            </p>
            <Button 
              className="bg-gradient-primary"
              onClick={() => toast({
                title: "Fonctionnalité en développement",
                description: "Cette fonctionnalité sera bientôt disponible"
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre premier bien
            </Button>
          </div>
        ) : properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-primary/40" />
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant={statusConfig[property.status].variant}>
                  {statusConfig[property.status].label}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{property.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {property.address}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Identifiant</span>
                  <span className="font-medium">{property.id.slice(0, 8)}...</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="font-medium">{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast({
                      title: "Voir le bien",
                      description: property.name
                    })}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast({
                      title: "Modifier le bien",
                      description: property.name
                    })}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => toast({
                        title: "Bien dupliqué",
                        description: "Le bien a été dupliqué avec succès"
                      })}>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({
                        title: "Bien archivé",
                        description: "Le bien a été archivé"
                      })}>Archiver</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => toast({
                          title: "Bien supprimé",
                          description: "Le bien a été supprimé définitivement",
                          variant: "destructive"
                        })}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Properties