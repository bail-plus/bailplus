import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  useContactsWithLeaseInfo,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  type ContactWithLeaseInfo,
  type ContactInsert
} from "@/hooks/useContacts"
import { PeopleStats } from "@/components/people/PeopleStats"
import { PeopleSearch } from "@/components/people/PeopleSearch"
import { PeopleList } from "@/components/people/PeopleList"
import { PersonFormDialog } from "@/components/people/PersonFormDialog"

export default function People() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<ContactWithLeaseInfo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { toast } = useToast()
  const { data: contacts = [], isLoading, error } = useContactsWithLeaseInfo()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const handleOpenDialog = () => {
    setSelectedPerson(null)
    setIsDialogOpen(true)
  }

  const handleEditPerson = (person: ContactWithLeaseInfo) => {
    setSelectedPerson(person)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (formData: ContactInsert) => {
    if (selectedPerson) {
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
  }

  const handleDeletePerson = async (id: string) => {
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

    return matchesSearch
  })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Garants</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des garants pour vos locataires
          </p>
        </div>

        <Button className="gap-2" onClick={handleOpenDialog}>
          <Plus className="w-4 h-4" />
          Nouveau garant
        </Button>
      </div>

      {/* Search */}
      <PeopleSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Stats Cards */}
      <PeopleStats contacts={contacts} />

      {/* People List */}
      <PeopleList
        people={filteredPeople}
        onEditPerson={handleEditPerson}
        onDeletePerson={handleDeletePerson}
      />

      {/* Person Form Dialog */}
      <PersonFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        person={selectedPerson}
        onSubmit={handleSubmit}
        isSubmitting={createContact.isPending || updateContact.isPending}
      />
    </div>
  )
}