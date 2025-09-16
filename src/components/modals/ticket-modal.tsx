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
import { Wrench } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

// ----------- Zod schema -----------
const ticketSchema = z.object({
  unitId: z.string().min(1, "Veuillez sélectionner un bien"),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  reporterId: z.string().optional(), // "" = signalement propriétaire
})
type TicketForm = z.infer<typeof ticketSchema>

interface TicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ----------- Types DB -----------
type PropertyRow = { id: string; name: string | null; address: string | null }
type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  kind?: string | null // si tu as ce champ pour distinguer TENANT
}

export function TicketModal({ open, onOpenChange, onSuccess }: TicketModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  const [units, setUnits] = useState<PropertyRow[]>([])
  const [people, setPeople] = useState<ProfileRow[]>([])

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      unitId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      reporterId: "", // vide = propriétaire
    },
  })

  // ----------- Charger biens + personnes -----------
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingData(true)
        const [propsRes, peopleRes] = await Promise.all([
          supabase.from("properties").select("id,name,address").returns<PropertyRow[]>().throwOnError(),
          supabase
            .from("profiles")
            .select("id,first_name,last_name,full_name,kind")
            .returns<ProfileRow[]>()
            .throwOnError(),
        ])
        if (cancelled) return
        setUnits(propsRes.data ?? [])
        setPeople(peopleRes.data ?? [])
      } catch (e) {
        console.error("Erreur chargement données ticket", e)
        if (!cancelled) {
          setUnits([])
          setPeople([])
        }
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ----------- Options UI -----------
  const availableUnits = useMemo(() => {
    return units.map(u => {
      const label = [u.name ?? undefined, u.address ?? undefined].filter(Boolean).join(" — ") || `Bien ${u.id}`
      return { value: String(u.id), label }
    })
  }, [units])

  const availableReporters = useMemo(() => {
    const tenants = people.filter(p => (p.kind ?? "").toUpperCase() === "TENANT" || !p.kind)
    const options = tenants.map(p => {
      const full = (p.full_name ?? "").trim()
      const basic = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
      return { value: String(p.id), label: (full || basic || `Personne ${p.id}`) + " (locataire)" }
    })
    return [{ value: "", label: "Signalement propriétaire" }, ...options]
  }, [people])

  const priorities = [
    { value: "LOW", label: "Faible", color: "text-green-600" },
    { value: "MEDIUM", label: "Moyenne", color: "text-yellow-600" },
    { value: "HIGH", label: "Haute", color: "text-orange-600" },
    { value: "URGENT", label: "Urgente", color: "text-red-600" },
  ] as const

  // ----------- Submit -----------
  async function onSubmit(values: TicketForm) {
    setIsLoading(true)
    try {
      // 👉 Remplace par ton insert réel supabase si tu as la table, p.ex.:
      // const { error } = await supabase.from("tickets").insert({
      //   unit_id: values.unitId,
      //   title: values.title,
      //   description: values.description,
      //   priority: values.priority,
      //   reporter_id: values.reporterId || null,
      // })
      // if (error) throw error

      await new Promise(r => setTimeout(r, 800)) // mock

      toast.success("Ticket de maintenance créé avec succès")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Erreur lors de la création du ticket")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Nouveau ticket de maintenance
          </DialogTitle>
          <DialogDescription>Signalez un problème ou une demande d'intervention</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bien concerné */}
            <FormField
              control={form.control}
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bien concerné</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingData}>
                        <SelectValue placeholder={loadingData ? "Chargement..." : "Sélectionnez un bien"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUnits.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Signalé par */}
            <FormField
              control={form.control}
              name="reporterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signalé par</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={loadingData}>
                        <SelectValue placeholder="Qui signale le problème ?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableReporters.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Titre */}
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

            {/* Description */}
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

            {/* Priorité */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la priorité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className={p.color}>{p.label}</span>
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
