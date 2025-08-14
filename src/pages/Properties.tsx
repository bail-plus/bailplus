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

const properties = [
  {
    id: "1",
    title: "Appartement 123 Rue de la Paix",
    address: "123 Rue de la Paix, 75001 Paris",
    type: "Appartement",
    surface: "65 m²",
    units: 1,
    occupied: 1,
    rent: "1,200€",
    status: "occupied",
    image: "/api/placeholder/300/200"
  },
  {
    id: "2",
    title: "Studio 45 Avenue des Champs",
    address: "45 Avenue des Champs, 75008 Paris", 
    type: "Studio",
    surface: "25 m²",
    units: 1,
    occupied: 0,
    rent: "850€",
    status: "vacant",
    image: "/api/placeholder/300/200"
  },
  {
    id: "3",
    title: "Maison 78 Boulevard Victor Hugo",
    address: "78 Boulevard Victor Hugo, 75015 Paris",
    type: "Maison",
    surface: "120 m²",
    units: 1,
    occupied: 1,
    rent: "2,500€",
    status: "occupied",
    image: "/api/placeholder/300/200"
  },
  {
    id: "4",
    title: "Parking souterrain",
    address: "15 Rue des Lilas, 75011 Paris",
    type: "Parking",
    surface: "15 m²",
    units: 1,
    occupied: 0,
    rent: "120€",
    status: "vacant",
    image: "/api/placeholder/300/200"
  }
]

const statusConfig = {
  occupied: { label: "Occupé", variant: "default" as const },
  vacant: { label: "Vacant", variant: "secondary" as const },
  maintenance: { label: "Maintenance", variant: "destructive" as const }
}

const Properties = () => {
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
        <Button className="bg-gradient-primary">
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
          <div className="text-2xl font-bold mt-2">4</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Occupés</span>
          </div>
          <div className="text-2xl font-bold mt-2">2</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-warning" />
            <span className="text-sm font-medium text-muted-foreground">Vacants</span>
          </div>
          <div className="text-2xl font-bold mt-2">2</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Surface totale</span>
          </div>
          <div className="text-2xl font-bold mt-2">225 m²</div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
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
                  <h3 className="font-semibold text-lg leading-tight">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {property.address}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{property.type}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Surface</span>
                  <span className="font-medium">{property.surface}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Occupation</span>
                  <span className="font-medium">{property.occupied}/{property.units} lots</span>
                </div>
                
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Loyer</span>
                  <span className="font-bold text-lg">{property.rent}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
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
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem>Archiver</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
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