import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Plus, Search, Phone, Mail, MapPin, User, ShieldCheck, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useContactsWithLeaseInfo,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  type ContactWithLeaseInfo,
  type ContactInsert
} from "@/hooks/useContacts"

export default function People() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "tenant" | "guarantor">("all")
  const [selectedPerson, setSelectedPerson] = useState<ContactWithLeaseInfo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<ContactInsert>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  })

  const { toast } = useToast()
  const { data: contacts = [], isLoading, error } = useContactsWithLeaseInfo()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
    })
    setIsEditMode(false)
    setSelectedPerson(null)
  }

  const handleOpenDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditPerson = (person: ContactWithLeaseInfo) => {
    setFormData({
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email ?? "",
      phone: person.phone ?? "",
      address: person.address ?? "",
    })
    setSelectedPerson(person)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name) {
      toast({
        title: "Erreur",
        description: "Le prénom et le nom sont requis",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedPerson) {
        await updateContact.mutateAsync({
          id: selectedPerson.id,
          ...formData,
        })
        toast({
          title: "Succès",
          description: "Contact modifié avec succès",
        })
      } else {
        await createContact.mutateAsync(formData)
        toast({
          title: "Succès",
          description: "Contact créé avec succès",
        })
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) return

    try {
      await deleteContact.mutateAsync(id)
      toast({
        title: "Succès",
        description: "Contact supprimé avec succès",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le contact",
        variant: "destructive",
      })
    }
  }

  const filteredPeople = contacts.filter(person => {
    const matchesSearch =
      person.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || person.role === typeFilter ||
      (typeFilter === "tenant" && person.role === "both") ||
      (typeFilter === "guarantor" && person.role === "both")

    return matchesSearch && matchesType
  })

  const tenantsCount = contacts.filter(p => p.role === "tenant" || p.role === "both").length
  const guarantorsCount = contacts.filter(p => p.role === "guarantor" || p.role === "both").length

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur lors du chargement des personnes</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
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

  const getRoleBadge = (role?: 'tenant' | 'guarantor' | 'both') => {
    if (!role) return null

    const badges = {
      tenant: { label: "Locataire", icon: User, variant: "default" as const },
      guarantor: { label: "Garant", icon: ShieldCheck, variant: "secondary" as const },
      both: { label: "Locataire & Garant", icon: User, variant: "outline" as const }
    }
    return badges[role]
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4" />
              Nouvelle personne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Modifier la personne" : "Ajouter une personne"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email ?? ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone ?? ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address ?? ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={createContact.isPending || updateContact.isPending}>
                  {isEditMode ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
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
        
        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="tenant">Locataires</SelectItem>
            <SelectItem value="guarantor">Garants</SelectItem>
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
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Locataires</span>
            </div>
            <div className="text-2xl font-bold">{tenantsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Garants</span>
            </div>
            <div className="text-2xl font-bold">{guarantorsCount}</div>
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
                <TableHead>Baux actifs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune personne trouvée</h3>
                      <p className="text-muted-foreground">
                        Vous n'avez pas encore ajouté de locataires ou garants.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeople.map((person) => {
                  const roleBadge = getRoleBadge(person.role);

                  return (
                    <TableRow key={person.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {person.first_name} {person.last_name}
                          </div>
                          {person.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {person.email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {roleBadge && (
                          <Badge variant={roleBadge.variant} className="gap-1">
                            <roleBadge.icon className="w-3 h-3" />
                            {roleBadge.label}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {person.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {person.phone}
                            </div>
                          )}
                          {person.address && (
                            <div className="flex items-center gap-1 text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              {person.address}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {person.activeLeases ?? 0}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPerson(person)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(person.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}