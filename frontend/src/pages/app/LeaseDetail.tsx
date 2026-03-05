import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Send, Power, Download, Calendar, Receipt } from 'lucide-react';

interface Lease {
  id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  charges_amount: number;
  deposit_amount: number;
  status: 'draft' | 'signed' | 'active' | 'terminated';
  contract_type: 'empty' | 'furnished';
  unit: {
    unit_number: string;
    property: {
      name: string;
      address: string;
    };
  };
  tenant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface RentInvoice {
  id: string;
  period_month: number;
  period_year: number;
  rent_amount: number;
  charges_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  paid_date: string | null;
  pdf_url: string | null;
}

export default function LeaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [lease, setLease] = useState<Lease | null>(null);
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLease();
      fetchInvoices();
      fetchDocuments();
      fetchHistory();
    }
  }, [id]);

  const fetchLease = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          unit:units (
            unit_number,
            property:properties (
              name,
              address
            )
          ),
          tenant:tenants (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setLease(data as Lease);
    } catch (error) {
      console.error('Error fetching lease:', error);
      toast.error('Erreur lors du chargement du bail');
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_invoices')
        .select('*')
        .eq('lease_id', id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) throw error;
      setInvoices((data as RentInvoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('lease_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    // For now, we'll create a mock history
    setHistory([
      { id: 1, date: new Date().toISOString(), action: 'Bail créé', user: 'Admin' },
      { id: 2, date: new Date().toISOString(), action: 'Bail envoyé pour signature', user: 'Admin' },
    ]);
  };

  const handleSendForSignature = async () => {
    if (!lease) return;

    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: 'signed' })
        .eq('id', lease.id);

      if (error) throw error;
      
      setLease({ ...lease, status: 'signed' });
      toast.success('Bail envoyé pour signature (simulation)');
    } catch (error) {
      console.error('Error updating lease status:', error);
      toast.error('Erreur lors de l\'envoi pour signature');
    }
  };

  const handleActivateLease = async () => {
    if (!lease) return;

    try {
      // Update lease status to active
      const { error: leaseError } = await supabase
        .from('leases')
        .update({ status: 'active' })
        .eq('id', lease.id);

      if (leaseError) throw leaseError;

      // Create first rent invoice
      const currentDate = new Date();
      const { error: invoiceError } = await supabase
        .from('rent_invoices')
        .insert({
          lease_id: lease.id,
          period_month: currentDate.getMonth() + 1,
          period_year: currentDate.getFullYear(),
          rent_amount: lease.rent_amount,
          charges_amount: lease.charges_amount,
          total_amount: lease.rent_amount + lease.charges_amount,
          due_date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5).toISOString().split('T')[0]
        });

      if (invoiceError) throw invoiceError;

      setLease({ ...lease, status: 'active' });
      toast.success('Bail activé et première quittance créée !');
      fetchInvoices(); // Refresh invoices
    } catch (error) {
      console.error('Error activating lease:', error);
      toast.error('Erreur lors de l\'activation du bail');
    }
  };

  const generateReceipt = async (invoiceId: string) => {
    try {
      // Simulate PDF generation
      const { error } = await supabase
        .from('rent_invoices')
        .update({ pdf_url: `/receipts/${invoiceId}.pdf` })
        .eq('id', invoiceId);

      if (error) throw error;
      
      toast.success('Quittance générée (simulation)');
      fetchInvoices();
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Erreur lors de la génération de la quittance');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', variant: 'secondary' as const },
      signed: { label: 'Signé', variant: 'default' as const },
      active: { label: 'Actif', variant: 'default' as const },
      terminated: { label: 'Terminé', variant: 'destructive' as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      paid: { label: 'Payé', variant: 'default' as const },
      overdue: { label: 'En retard', variant: 'destructive' as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  if (!lease) {
    return <div className="container mx-auto p-6">Bail non trouvé</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bail - {lease.unit.property.name} {lease.unit.unit_number}
          </h1>
          <p className="text-muted-foreground">
            {lease.tenant.first_name} {lease.tenant.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge {...getStatusBadge(lease.status)}>
            {getStatusBadge(lease.status).label}
          </Badge>
          {lease.status === 'draft' && (
            <Button onClick={handleSendForSignature} variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Envoyer pour signature
            </Button>
          )}
          {lease.status === 'signed' && (
            <Button onClick={handleActivateLease}>
              <Power className="h-4 w-4 mr-2" />
              Activer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="lease" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lease">Bail</TabsTrigger>
          <TabsTrigger value="schedule">Échéancier</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="lease" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Période :</span> du {new Date(lease.start_date).toLocaleDateString()} 
                  {lease.end_date && ` au ${new Date(lease.end_date).toLocaleDateString()}`}
                </div>
                <div>
                  <span className="font-medium">Type :</span> {lease.contract_type === 'empty' ? 'Vide' : 'Meublé'}
                </div>
                <div>
                  <span className="font-medium">Loyer :</span> {lease.rent_amount}€
                </div>
                <div>
                  <span className="font-medium">Charges :</span> {lease.charges_amount}€
                </div>
                <div>
                  <span className="font-medium">Dépôt de garantie :</span> {lease.deposit_amount}€
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Nom :</span> {lease.tenant.first_name} {lease.tenant.last_name}
                </div>
                <div>
                  <span className="font-medium">Email :</span> {lease.tenant.email}
                </div>
                <div>
                  <span className="font-medium">Téléphone :</span> {lease.tenant.phone}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Échéancier des loyers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {invoice.period_month.toString().padStart(2, '0')}/{invoice.period_year}
                      </TableCell>
                      <TableCell>{invoice.rent_amount}€</TableCell>
                      <TableCell>{invoice.charges_amount}€</TableCell>
                      <TableCell className="font-medium">{invoice.total_amount}€</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge {...getInvoiceStatusBadge(invoice.status)}>
                          {getInvoiceStatusBadge(invoice.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!invoice.pdf_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateReceipt(invoice.id)}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Générer
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents associés</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">Aucun document associé</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{doc.name}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border-l-2 border-primary pl-4">
                    <div className="font-medium">{item.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleString()} - par {item.user}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}