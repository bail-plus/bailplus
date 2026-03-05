import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Mail, Phone, MapPin, ShieldCheck, Edit, Trash2 } from "lucide-react"
import type { ContactWithLeaseInfo } from "@/hooks/properties/useContacts"

interface PeopleListProps {
  people: ContactWithLeaseInfo[]
  onEditPerson: (person: ContactWithLeaseInfo) => void
  onDeletePerson: (id: string) => void
}

export function PeopleList({ people, onEditPerson, onDeletePerson }: PeopleListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des garants</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="text-center">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun garant trouvé</h3>
                    <p className="text-muted-foreground">
                      Vous n'avez pas encore ajouté de garants.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              people.map((person) => (
                <TableRow key={person.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {person.first_name} {person.last_name}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm space-y-1">
                      {person.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {person.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {person.address}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditPerson(person)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeletePerson(person.id)}
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
