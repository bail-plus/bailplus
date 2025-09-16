import { useState, useEffect, useMemo } from "react"
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
import { supabase } from "@/integrations/supabase/client"

// -------- Zod schema --------
const expenseSchema = z.object({
  propertyId: z.string().optional(), // "" = dépense générale
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  date: z.string().min(1, "La date est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  description: z.string().min(1, "La description est requise"),
  vatRate: z.number().min(0).max(100).optional(),
})
type ExpenseForm = z.infer<typeof expenseSchema>

// -------- Props --------
interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// -------- Types DB "properties" --------
type PropertyRow = {
  id: string
  name: string | null
  address: string | null
}
type Property = {
  id: string
  name?: string | null
  address?: string | null
  label?: string | null // libellé calculé pour l'UI
}

export function ExpenseModal({ open, onOpenChange, onSuccess }: ExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(false)

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      propertyId: "",
      amount: 100,
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      vatRate: 20,
    },
  })

  // -------- Charger les biens depuis Supabase --------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingProps(true)
        const { data } = await supabase
          .from("properties")
          .select("id,name,address")
          .returns<PropertyRow[]>() // typage strict des lignes
          .throwOnError()           // throw si erreur

        if (!cancelled) {
          const mapped: Property[] = (data ?? []).map((p) => ({
            id: String(p.id),
            name: p.name,
            address: p.address,
            // label pour l'affichage : "name — address" si dispo
            label: [p.name ?? undefined, p.address ?? undefined].filter(Boolean).join(" — ") || `Bien ${p.id}`,
          }))
          setProperties(mapped)
        }
      } catch (e) {
        console.error("Erreur chargement propriétés", e)
        if (!cancelled) setProperties([])
      } finally {
        if (!cancelled) setLoadingProps(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // -------- Soumission --------
  async function onSubmit(values: ExpenseForm) {
    setIsLoading(true)
    try {
      // 👉 Remplace ce mock par ton insert dans la table "expenses"
      // Exemple si ta table s'appelle "expenses" et colonnes correspondantes :
      // const { error } = await supabase.from("expenses").insert({
      //   property_id: values.propertyId || null,
      //   amount: values.amount,
      //   date: values.date,
      //   category: values.category,
      //   description: values.description,
      //   vat_rate: values.vatRate ?? null,
      // })
      // if (error) throw error

      await new Promise((r) => setTimeout(r, 800)) // mock

      toast.success("Dépense enregistrée avec succès")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating expense:", error)
      toast.error("Erreur lors de l'enregistrement de la dépense")
    } finally {
      setIsLoading(false)
    }
  }

  const availableProperties = useMemo(
    () => [
      { value: "", label: "Dépense générale" },
      ...properties.map((p) => ({
        value: p.id,
        label: p.label ?? p.name ?? `Bien ${p.id}`,
      })),
    ],
    [properties]
  )

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
          <DialogDescription>Enregistrez une nouvelle dépense</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bien concerné */}
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bien concerné</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingProps}>
                        <SelectValue placeholder={loadingProps ? "Chargement..." : "Sélectionnez un bien"} />
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

            {/* Montant + Date */}
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

            {/* Catégorie */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Description */}
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

            {/* TVA */}
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
