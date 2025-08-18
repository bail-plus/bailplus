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
import { Calculator } from "lucide-react"
import { mockData } from "@/lib/supabase"

const expenseSchema = z.object({
  propertyId: z.string().optional(),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  date: z.string().min(1, "La date est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().min(1, "La description est requise"),
  vatRate: z.number().min(0).max(100).optional(),
})

type ExpenseForm = z.infer<typeof expenseSchema>

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ExpenseModal({ open, onOpenChange, onSuccess }: ExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      propertyId: "",
      amount: 100,
      date: new Date().toISOString().split('T')[0],
      category: "",
      description: "",
      vatRate: 20,
    },
  })

  async function onSubmit(values: ExpenseForm) {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Creating expense:', values)
      toast.success("Dépense enregistrée avec succès")
      
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error("Erreur lors de l'enregistrement de la dépense")
    } finally {
      setIsLoading(false)
    }
  }

  const availableProperties = [
    { value: "", label: "Dépense générale" },
    ...mockData.properties.map(property => ({
      value: property.id,
      label: property.label
    }))
  ]

  const expenseCategories = [
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "REPAIRS", label: "Réparations" },
    { value: "INSURANCE", label: "Assurance" },
    { value: "TAXES", label: "Taxes et impôts" },
    { value: "MANAGEMENT", label: "Gestion" },
    { value: "UTILITIES", label: "Charges communes" },
    { value: "LEGAL", label: "Frais juridiques" },
    { value: "OTHER", label: "Autre" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Nouvelle dépense
          </DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle dépense
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
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
                      {availableProperties.map((property) => (
                        <SelectItem key={property.value} value={property.value}>
                          {property.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (€)</FormLabel>
                    <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="150.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Décrivez la dépense..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TVA (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="20" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                {isLoading ? "Enregistrement..." : "Enregistrer la dépense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}