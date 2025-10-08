import { useEffect, useState } from "react"
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
import { supabase } from "@/integrations/supabase/client"

const leaseSchema = z.object({
  propertyId: z.string().min(1, "Veuillez sélectionner une propriété"),
  unitId: z.string().min(1, "Veuillez sélectionner un logement"),
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

type Option = { value: string; label: string }

export function LeaseModal({ open, onOpenChange, onSuccess }: LeaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [propertyOptions, setPropertyOptions] = useState<Option[]>([])
  const [unitOptions, setUnitOptions] = useState<Option[]>([])
  const [tenantOptions, setTenantOptions] = useState<Option[]>([])

  // Load properties and tenants on mount
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          // Properties
          const { data: props, error: eProps } = await supabase
            .from("properties")
            .select("id,name")
            .order('name')

          if (eProps) throw eProps

          if (!cancelled) {
            const opts: Option[] = (props ?? []).map((p: any) => ({
              value: String(p.id),
              label: p.name ?? `Bien ${p.id}`,
            }))
            setPropertyOptions(opts)
          }

          // Tenants
          const { data: contacts, error: eContacts } = await supabase
            .from("contacts")
            .select("id,first_name,last_name")
            .limit(1000)
          if (eContacts) throw eContacts

          if (!cancelled) {
            const tenants: Option[] = (contacts ?? [])
              .map((c: any) => ({
                value: String(c.id),
                label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || `Personne ${c.id}`,
              }))
            setTenantOptions(tenants)
          }
        } catch (err) {
          console.error("lease-modal options load error", err)
          if (!cancelled) {
            setPropertyOptions([])
            setTenantOptions([])
          }
        }
      })()
    return () => { cancelled = true }
  }, [])

  // Load units when property changes
  const form = useForm<LeaseForm>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      propertyId: "",
      unitId: "",
      tenantId: "",
      startDate: "",
      rentHC: 800,
      charges: 50,
      depositAmount: 800,
    },
  })

  const selectedPropertyId = form.watch('propertyId')

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId)
    } else {
      setUnitOptions([])
      form.setValue('unitId', '')
    }
  }, [selectedPropertyId])

  const loadUnits = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, type')
        .eq('property_id', propertyId)
        .order('unit_number')

      if (error) throw error

      const opts: Option[] = (data ?? []).map((u: any) => ({
        value: String(u.id),
        label: `${u.unit_number} - ${u.type ?? 'Type non spécifié'}`,
      }))
      setUnitOptions(opts)
    } catch (error) {
      console.error('Error loading units:', error)
      setUnitOptions([])
    }
  }

  async function onSubmit(values: LeaseForm) {
    setIsLoading(true)
    try {
      // TODO: remplace par insertion Supabase
      await new Promise(resolve => setTimeout(resolve, 600))
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
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propriété</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une propriété" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertyOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
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
              name="unitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPropertyId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedPropertyId ? "Sélectionnez un logement" : "Sélectionnez d'abord une propriété"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOptions.map((u) => (
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

            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locataire</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un locataire" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
