import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Search, Phone, Mail, MapPin, FileText, User, Wrench } from "lucide-react"

const MOCK_PEOPLE = [
  {
    id: "1",
    type: "TENANT",
    firstName: "Marie",
    lastName: "Dubois",
    email: "marie.dubois@email.com",
    phone: "06 12 34 56 78",
    address: "25 rue de la Paix, Paris 2e",
    activeLease: "T3 - 25 rue de la Paix",
    status: "active",
    documents: 5
  },
  {
    id: "2",
    type: "TENANT", 
    firstName: "Pierre",
    lastName: "Martin",
    email: "pierre.martin@email.com",
    phone: "06 87 65 43 21",
    address: "10 avenue Mozart, Paris 16e",
    activeLease: "Studio - 10 avenue Mozart",
    status: "active",
    documents: 3
  },
  {
    id: "3",
    type: "GUARANTOR",
    firstName: "Sophie",
    lastName: "Dubois",
    email: "sophie.dubois@email.com", 
    phone: "01 23 45 67 89",
    address: "12 rue de Rivoli, Paris 1er",
    guaranteeFor: "Marie Dubois",
    status: "active",
    documents: 2
  },
  {
    id: "4",
    type: "VENDOR",
    firstName: "Jean",
    lastName: "Plombier",
    email: "jean.plombier@artisan.com",
    phone: "06 11 22 33 44",
    specialty: "Plomberie",
    status: "active",
    documents: 1
  }
]

export default function People() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedPerson, setSelectedPerson] = useState<any>(null)

  const filteredPeople = MOCK_PEOPLE.filter(person => {
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || person.type === typeFilter
    
    return matchesSearch && matchesType
  })

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
            <div className="text-2xl font-bold">{MOCK_PEOPLE.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Locataires</span>
            </div>
            <div className="text-2xl font-bold">
              {MOCK_PEOPLE.filter(p => p.type === "TENANT").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Garants</span>
            </div>
            <div className="text-2xl font-bold">
              {MOCK_PEOPLE.filter(p => p.type === "GUARANTOR").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Prestataires</span>
            </div>
            <div className="text-2xl font-bold">
              {MOCK_PEOPLE.filter(p => p.type === "VENDOR").length}
            </div>
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
              {filteredPeople.map((person) => {
                const typeConfig = getPersonTypeLabel(person.type)
                const statusConfig = getStatusBadge(person.status)
                
                return (
                  <TableRow 
                    key={person.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPerson(person)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {person.firstName} {person.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={typeConfig.variant} className="gap-1">
                        <typeConfig.icon className="w-3 h-3" />
                        {typeConfig.label}
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
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {person.activeLease && (
                          <span className="text-muted-foreground">
                            Bail: {person.activeLease}
                          </span>
                        )}
                        {person.guaranteeFor && (
                          <span className="text-muted-foreground">
                            Garant de: {person.guaranteeFor}
                          </span>
                        )}
                        {person.specialty && (
                          <span className="text-muted-foreground">
                            {person.specialty}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{person.documents}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Button variant="ghost" size="sm">
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
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <Button variant="outline" size="sm">
                Envoyer message
              </Button>
              {selectedPerson.type === "TENANT" && (
                <Button variant="outline" size="sm">
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