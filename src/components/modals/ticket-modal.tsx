import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Wrench } from "lucide-react"
import { mockData } from "@/lib/supabase"

const ticketSchema = z.object({
  unitId: z.string().min(1, "Veuillez sélectionner un bien"),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  reporterId: z.string().optional(),
})

type TicketForm = z.infer<typeof ticketSchema>

interface TicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TicketModal({ open, onOpenChange, onSuccess }: TicketModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      reporterId: "",
    },
  })

  async function onSubmit(values: TicketForm) {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Creating ticket:', values)
      toast.success("Ticket de maintenance créé avec succès")
      
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error("Erreur lors de la création du ticket")
    } finally {
      setIsLoading(false)
    }
  }

  const availableUnits = mockData.properties.map(property => ({
    value: property.id,
    label: `${property.label} (${property.surface}m²)`
  }))

  const availableReporters = [
    { value: "", label: "Signalement propriétaire" },
    ...mockData.people
      .filter(person => person.kind === 'TENANT')
      .map(person => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName} (locataire)`
      }))
  ]

  const priorities = [
    { value: "LOW", label: "Faible", color: "text-green-600" },
    { value: "MEDIUM", label: "Moyenne", color: "text-yellow-600" },
    { value: "HIGH", label: "Haute", color: "text-orange-600" },
    { value: "URGENT", label: "Urgente", color: "text-red-600" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Nouveau ticket de maintenance
          </DialogTitle>
          <DialogDescription>
            Signalez un problème ou une demande d'intervention
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bien concerné</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un bien" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reporterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signalé par</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Qui signale le problème ?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableReporters.map((reporter) => (
                        <SelectItem key={reporter.value} value={reporter.value}>
                          {reporter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du problème</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Fuite dans la salle de bain" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description détaillée</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez le problème en détail..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <span className={priority.color}>{priority.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer le ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}