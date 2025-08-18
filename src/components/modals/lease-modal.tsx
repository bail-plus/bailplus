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
import { toast } from "sonner"
import { FileText } from "lucide-react"
import { mockData } from "@/lib/supabase"

const leaseSchema = z.object({
  unitId: z.string().min(1, "Veuillez sélectionner un bien"),
  tenantId: z.string().min(1, "Veuillez sélectionner un locataire"),
  startDate: z.string().min(1, "La date de début est requise"),
  rentHC: z.number().min(1, "Le loyer hors charges doit être supérieur à 0"),
  charges: z.number().min(0, "Les charges doivent être positives"),
  depositAmount: z.number().min(0, "Le dépôt de garantie doit être positif"),
})

type LeaseForm = z.infer<typeof leaseSchema>

interface LeaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LeaseModal({ open, onOpenChange, onSuccess }: LeaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LeaseForm>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      unitId: "",
      tenantId: "",
      startDate: "",
      rentHC: 800,
      charges: 50,
      depositAmount: 800,
    },
  })

  async function onSubmit(values: LeaseForm) {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Creating lease:', values)
      toast.success("Bail créé avec succès")
      
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating lease:', error)
      toast.error("Erreur lors de la création du bail")
    } finally {
      setIsLoading(false)
    }
  }

  const availableUnits = mockData.properties.map(property => ({
    value: property.id,
    label: `${property.label} (${property.surface}m²)`
  }))

  const availableTenants = mockData.people
    .filter(person => person.kind === 'TENANT')
    .map(person => ({
      value: person.id,
      label: `${person.firstName} ${person.lastName}`
    }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nouveau bail
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau contrat de location
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bien à louer</FormLabel>
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
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locataire</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un locataire" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.value} value={tenant.value}>
                          {tenant.label}
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
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rentHC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyer HC (€)</FormLabel>
                    <FormControl>
                     <Input 
                       type="number" 
                       placeholder="1200" 
                       {...field}
                       onChange={(e) => field.onChange(Number(e.target.value))}
                     />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="charges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charges (€)</FormLabel>
                    <FormControl>
                     <Input 
                       type="number" 
                       placeholder="200" 
                       {...field}
                       onChange={(e) => field.onChange(Number(e.target.value))}
                     />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dépôt de garantie (€)</FormLabel>
                  <FormControl>
                     <Input 
                       type="number" 
                       placeholder="1200" 
                       {...field}
                       onChange={(e) => field.onChange(Number(e.target.value))}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer le bail"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}