import { useEffect, useMemo, useState } from "react"
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
import { Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

const visitSchema = z.object({
  unitId: z.string().min(1, "Veuillez sélectionner un bien"),
  visitorName: z.string().min(2, "Le nom du visiteur doit contenir au moins 2 caractères"),
  visitorEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  visitorPhone: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
  visitDate: z.string().min(1, "La date est requise"),
  visitTime: z.string().min(1, "L'heure est requise"),
  notes: z.string().optional(),
})
type VisitForm = z.infer<typeof visitSchema>

interface VisitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type PropertyRow = { id: string; name: string | null; address: string | null }

export function VisitModal({ open, onOpenChange, onSuccess }: VisitModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [properties, setProperties] = useState<PropertyRow[]>([])

  const form = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      unitId: "",
      visitorName: "",
      visitorEmail: "",
      visitorPhone: "",
      visitDate: "",
      visitTime: "",
      notes: "",
    },
  })

  // Charger les biens depuis Supabase
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingProps(true)
        const { data } = await supabase
          .from("properties")
          .select("id,name,address")
          .returns<PropertyRow[]>()
          .throwOnError()

        if (!cancelled) setProperties(data ?? [])
      } catch (e) {
        console.error("Erreur chargement propriétés (visites)", e)
        if (!cancelled) setProperties([])
      } finally {
        if (!cancelled) setLoadingProps(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Options "biens"
  const availableUnits = useMemo(() => {
    return properties.map(p => ({
      value: String(p.id),
      label: [p.name ?? undefined, p.address ?? undefined].filter(Boolean).join(" — ") || `Bien ${p.id}`,
    }))
  }, [properties])

  // Créneaux horaires 08:00 → 19:00 par pas de 30 min
  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = []
    for (let hour = 8; hour <= 19; hour++) {
      for (const minute of [0, 30]) {
        const t = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push({ value: t, label: t })
      }
    }
    return slots
  }, [])

  async function onSubmit(values: VisitForm) {
    setIsLoading(true)
    try {
      // 👉 Remplace par ton insertion Supabase si tu as la table (ex. "visits"):
      // const { error } = await supabase.from("visits").insert({
      //   unit_id: values.unitId,
      //   visitor_name: values.visitorName,
      //   visitor_email: values.visitorEmail || null,
      //   visitor_phone: values.visitorPhone,
      //   visit_date: values.visitDate, // "YYYY-MM-DD"
      //   visit_time: values.visitTime, // "HH:mm"
      //   notes: values.notes || null,
      // })
      // if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 600)) // mock

      toast.success("Visite programmée avec succès")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating visit:", error)
      toast.error("Erreur lors de la programmation de la visite")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nouvelle visite
          </DialogTitle>
          <DialogDescription>Programmez une visite pour un bien immobilier</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bien à visiter */}
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bien à visiter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingProps}>
                        <SelectValue placeholder={loadingProps ? "Chargement..." : "Sélectionnez un bien"} />
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

            {/* Nom visiteur */}
            <FormField
              control={form.control}
              name="visitorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du visiteur</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email visiteur */}
            <FormField
              control={form.control}
              name="visitorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jean.dupont@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Téléphone */}
            <FormField
              control={form.control}
              name="visitorPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="0123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Heure */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitDate"
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

              <FormField
                control={form.control}
                name="visitTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Heure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations complémentaires..."
                      className="min-h-[60px]"
                      {...field}
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
                {isLoading ? "Programmation..." : "Programmer la visite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
