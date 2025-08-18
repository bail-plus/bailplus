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
import { Calculator } from "lucide-react"
import { mockData } from "@/lib/supabase"

const receiptSchema = z.object({
  leaseId: z.string().min(1, "Veuillez sélectionner un bail"),
  periodMonth: z.number().min(1).max(12, "Mois invalide"),
  periodYear: z.number().min(2020).max(2030, "Année invalide"),
  amountHC: z.number().min(1, "Le montant hors charges doit être supérieur à 0"),
  charges: z.number().min(0, "Les charges doivent être positives"),
})

type ReceiptForm = z.infer<typeof receiptSchema>

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReceiptModal({ open, onOpenChange, onSuccess }: ReceiptModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      leaseId: "",
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      amountHC: 0,
      charges: 0,
    },
  })

  async function onSubmit(values: ReceiptForm) {
    setIsLoading(true)
    try {
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const total = values.amountHC + values.charges
      console.log('Creating receipt:', { ...values, total })
      toast.success("Quittance générée avec succès")
      
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating receipt:', error)
      toast.error("Erreur lors de la génération de la quittance")
    } finally {
      setIsLoading(false)
    }
  }

  const availableLeases = mockData.leases.map(lease => {
    const property = mockData.properties.find(p => p.id === lease.unitId)
    const tenant = mockData.people.find(p => p.id === lease.tenantId)
    return {
      value: lease.id,
      label: `${property?.label} - ${tenant?.firstName} ${tenant?.lastName}`
    }
  })

  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
  ]

  const watchedValues = form.watch(["amountHC", "charges"])
  const total = (watchedValues[0] || 0) + (watchedValues[1] || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Nouvelle quittance
          </DialogTitle>
          <DialogDescription>
            Générez une quittance de loyer
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bail concerné</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un bail" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableLeases.map((lease) => (
                        <SelectItem key={lease.value} value={lease.value}>
                          {lease.label}
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
                name="periodMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
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
                name="periodYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amountHC"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loyer hors charges (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1200" {...field} />
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
                    <Input type="number" placeholder="200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {total > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold">{total.toFixed(2)} €</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Génération..." : "Générer la quittance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}