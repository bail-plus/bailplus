import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Search, Phone, Mail, MapPin, FileText, User, Wrench } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export default function People() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedPerson, setSelectedPerson] = useState<any>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
      
      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      console.error('Error loading tenants:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les personnes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPeople = tenants.filter(person => {
    const matchesSearch = 
      person.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des personnes...</p>
          </div>
        </div>
      </div>
    )
  }

  const getPersonTypeLabel = (type: string) => {
    const types = {
      TENANT: { label: "Locataire", icon: User, variant: "default" as const },
      GUARANTOR: { label: "Garant", icon: User, variant: "secondary" as const },
      VENDOR: { label: "Prestataire", icon: Wrench, variant: "outline" as const }
    }
    return types[type as keyof typeof types] || { label: type, icon: User, variant: "secondary" as const }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { label: "Actif", variant: "default" as const },
      inactive: { label: "Inactif", variant: "secondary" as const }
    }
    return variants[status as keyof typeof variants] || { label: status, variant: "secondary" as const }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personnes</h1>
          <p className="text-muted-foreground mt-1">
            Locataires, garants et prestataires
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle personne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une personne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Fonctionnalité en cours de développement
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une personne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="TENANT">Locataires</SelectItem>
            <SelectItem value="GUARANTOR">Garants</SelectItem>
            <SelectItem value="VENDOR">Prestataires</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Locataires</span>
            </div>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Garants</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Prestataires</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* People List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des personnes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune personne trouvée</h3>
                      <p className="text-muted-foreground">
                        Vous n'avez pas encore ajouté de locataires ou autres personnes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPeople.map((person) => {
                
                return (
                  <TableRow 
                    key={person.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPerson(person)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {person.first_name} {person.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="default" className="gap-1">
                        <User className="w-3 h-3" />
                        Locataire
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </div>
                        {person.address && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {person.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="default">
                        Actif
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        -
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">0</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast({
                            title: "Voir la personne",
                            description: `${person.first_name} ${person.last_name}`
                          })
                        }}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Person Detail Modal */}
      {selectedPerson && (
        <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedPerson.firstName} {selectedPerson.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList>
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {selectedPerson.email}
                  </div>
                  <div>
                    <span className="font-medium">Téléphone:</span> {selectedPerson.phone}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Adresse:</span> {selectedPerson.address}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <Badge variant="secondary" className="ml-2">
                      {getPersonTypeLabel(selectedPerson.type).label}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <Badge variant="secondary" className="ml-2">
                      {getStatusBadge(selectedPerson.status).label}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedPerson.documents} document(s) associé(s)
                </p>
                <div className="text-sm text-muted-foreground">
                  Gestion des documents en cours de développement
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Historique des interactions en cours de développement
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Modifier la personne",
                  description: `${selectedPerson.firstName} ${selectedPerson.lastName}`
                })}
              >
                Modifier
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast({
                  title: "Message envoyé",
                  description: `Message envoyé à ${selectedPerson.firstName} ${selectedPerson.lastName}`
                })}
              >
                Envoyer message
              </Button>
              {selectedPerson.type === "TENANT" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({
                    title: "Ticket créé",
                    description: `Ticket créé pour ${selectedPerson.firstName} ${selectedPerson.lastName}`
                  })}
                >
                  Créer ticket
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}