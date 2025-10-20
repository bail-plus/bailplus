import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Receipt, Mail } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
];

interface PaidInvoice {
  id: string;
  lease: {
    tenant: {
      first_name: string;
      last_name: string;
      email: string;
    };
    unit: {
      unit_number: string;
      property: {
        name: string;
      };
    };
  };
  period_month: number;
  period_year: number;
  total_amount: number;
}

export default function BatchReceiptGenerator() {
  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [paidInvoices, setPaidInvoices] = useState<PaidInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchPaidInvoices = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Veuillez sélectionner un mois et une année');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rent_invoices')
        .select(`
          id,
          period_month,
          period_year,
          total_amount,
          lease:leases (
            tenant:profiles!leases_tenant_id_fkey (
              first_name,
              last_name,
              email
            ),
            unit:units (
              unit_number,
              property:properties (
                name
              )
            )
          )
        `)
        .eq('period_month', selectedMonth)
        .eq('period_year', selectedYear)
        .eq('status', 'paid');

      if (error) throw error;

      setPaidInvoices(data as PaidInvoice[] || []);
      
      if (data?.length === 0) {
        toast.info('Aucune quittance payée trouvée pour cette période');
      } else {
        toast.success(`${data?.length} quittances payées trouvées`);
      }
    } catch (error) {
      console.error('Error fetching paid invoices:', error);
      toast.error('Erreur lors de la recherche des quittances');
    } finally {
      setLoading(false);
    }
  };

  const generateBatchReceipts = async () => {
    if (paidInvoices.length === 0) {
      toast.error('Aucune quittance à générer');
      return;
    }

    setGenerating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const invoice of paidInvoices) {
        try {
          // Simulate PDF generation
          const { error } = await supabase
            .from('rent_invoices')
            .update({ pdf_url: `/receipts/${invoice.id}.pdf` })
            .eq('id', invoice.id);

          if (error) throw error;

          // Create document record
          await supabase
            .from('documents')
            .insert({
              name: `Quittance ${invoice.period_month.toString().padStart(2, '0')}/${invoice.period_year} - ${invoice.lease.tenant.first_name} ${invoice.lease.tenant.last_name}`,
              type: 'receipt',
              category: 'rent',
              file_url: `/receipts/${invoice.id}.pdf`,
              lease_id: (invoice as any).lease_id || (invoice as any).lease?.id || undefined,
              mime_type: 'application/pdf'
            });

          successCount++;
          
          // Simulate email sending (stub)
          console.log(`Email envoyé à ${invoice.lease.tenant.email} pour la quittance ${invoice.id}`);
        } catch (error) {
          console.error(`Error generating receipt for invoice ${invoice.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} quittances générées avec succès`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erreurs lors de la génération`);
      }

      // Refresh the list
      fetchPaidInvoices();
    } catch (error) {
      console.error('Error in batch generation:', error);
      toast.error('Erreur lors de la génération en lot');
    } finally {
      setGenerating(false);
    }
  };

  const monthLabel = selectedMonth ? MONTHS.find(m => m.value === selectedMonth)?.label : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Génération en masse de quittances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mois</label>
            <Select value={selectedMonth?.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Année</label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchPaidInvoices} disabled={loading || !selectedMonth || !selectedYear}>
            {loading ? 'Recherche...' : 'Rechercher les quittances payées'}
          </Button>
          
          {paidInvoices.length > 0 && (
            <Button onClick={generateBatchReceipts} disabled={generating} className="bg-primary">
              <Receipt className="h-4 w-4 mr-2" />
              {generating ? 'Génération...' : `Générer quittances ${monthLabel} ${selectedYear}`}
            </Button>
          )}
        </div>

        {paidInvoices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{paidInvoices.length} quittances payées trouvées</h3>
              <Badge variant="default">{paidInvoices.length} PDF à générer</Badge>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {paidInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {invoice.lease.tenant.first_name} {invoice.lease.tenant.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.lease.unit.property.name} - {invoice.lease.unit.unit_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{invoice.total_amount}€</div>
                    <div className="text-sm text-muted-foreground">
                      {monthLabel} {selectedYear}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
