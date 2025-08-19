import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Minus, FileText, DollarSign, Receipt } from 'lucide-react';

interface Deposit {
  id: string;
  amount: number;
  status: 'held' | 'returned' | 'partially_returned';
  returned_amount: number;
  deductions: Array<{ description: string; amount: number }>;
  return_date: string | null;
  receipt_pdf_url: string | null;
  lease: {
    tenant: {
      first_name: string;
      last_name: string;
    };
    unit: {
      unit_number: string;
      property: {
        name: string;
      };
    };
  };
}

interface ReturnFormData {
  returnAmount: string;
  deductions: Array<{ description: string; amount: string }>;
  notes: string;
}

export default function DepositManager() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReturnFormData>({
    returnAmount: '',
    deductions: [],
    notes: ''
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select(`
          *,
          lease:leases (
            tenant:tenants (
              first_name,
              last_name
            ),
            unit:units (
              unit_number,
              property:properties (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits((data as any) || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast.error('Erreur lors du chargement des dépôts');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnDeposit = async (depositId: string) => {
    if (!selectedDeposit) return;

    try {
      const returnAmount = parseFloat(formData.returnAmount);
      const totalDeductions = formData.deductions.reduce(
        (sum, deduction) => sum + parseFloat(deduction.amount || '0'),
        0
      );
      
      const finalReturnAmount = selectedDeposit.amount - totalDeductions;
      
      if (finalReturnAmount !== returnAmount) {
        toast.error('Le montant de restitution ne correspond pas au calcul');
        return;
      }

      const status = returnAmount === selectedDeposit.amount ? 'returned' : 'partially_returned';

      const { error } = await supabase
        .from('deposits')
        .update({
          status,
          returned_amount: returnAmount,
          deductions: formData.deductions.map(d => ({
            description: d.description,
            amount: parseFloat(d.amount)
          })),
          return_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', depositId);

      if (error) throw error;

      // Generate receipt (simulation)
      await generateDepositReceipt(depositId);

      toast.success('Dépôt de garantie restitué avec succès');
      setIsReturnModalOpen(false);
      setSelectedDeposit(null);
      setFormData({ returnAmount: '', deductions: [], notes: '' });
      fetchDeposits();
    } catch (error) {
      console.error('Error returning deposit:', error);
      toast.error('Erreur lors de la restitution du dépôt');
    }
  };

  const generateDepositReceipt = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ receipt_pdf_url: `/deposit-receipts/${depositId}.pdf` })
        .eq('id', depositId);

      if (error) throw error;

      // Create document record
      await supabase
        .from('documents')
        .insert({
          name: `Reçu de restitution - Dépôt ${depositId}`,
          type: 'deposit_receipt',
          category: 'deposit',
          file_url: `/deposit-receipts/${depositId}.pdf`,
        });

      toast.success('Reçu de restitution généré');
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const addDeduction = () => {
    setFormData({
      ...formData,
      deductions: [...formData.deductions, { description: '', amount: '' }]
    });
  };

  const removeDeduction = (index: number) => {
    const newDeductions = formData.deductions.filter((_, i) => i !== index);
    setFormData({ ...formData, deductions: newDeductions });
  };

  const updateDeduction = (index: number, field: 'description' | 'amount', value: string) => {
    const newDeductions = [...formData.deductions];
    newDeductions[index] = { ...newDeductions[index], [field]: value };
    setFormData({ ...formData, deductions: newDeductions });
  };

  const calculateReturnAmount = () => {
    if (!selectedDeposit) return 0;
    const totalDeductions = formData.deductions.reduce(
      (sum, deduction) => sum + parseFloat(deduction.amount || '0'),
      0
    );
    return selectedDeposit.amount - totalDeductions;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      held: { label: 'Détenu', variant: 'secondary' as const },
      returned: { label: 'Restitué', variant: 'default' as const },
      partially_returned: { label: 'Partiellement restitué', variant: 'outline' as const }
    };
    return config[status as keyof typeof config] || config.held;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des dépôts de garantie</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dépôts de garantie</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Locataire</TableHead>
                <TableHead>Propriété</TableHead>
                <TableHead>Montant initial</TableHead>
                <TableHead>Montant restitué</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de restitution</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    {deposit.lease.tenant.first_name} {deposit.lease.tenant.last_name}
                  </TableCell>
                  <TableCell>
                    {deposit.lease.unit.property.name} - {deposit.lease.unit.unit_number}
                  </TableCell>
                  <TableCell>{deposit.amount}€</TableCell>
                  <TableCell>
                    {deposit.status !== 'held' ? `${deposit.returned_amount}€` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadge(deposit.status)}>
                      {getStatusBadge(deposit.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deposit.return_date ? new Date(deposit.return_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {deposit.status === 'held' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setFormData({
                              returnAmount: deposit.amount.toString(),
                              deductions: [],
                              notes: ''
                            });
                            setIsReturnModalOpen(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Restituer
                        </Button>
                      )}
                      {deposit.receipt_pdf_url && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Reçu
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Restituer le dépôt de garantie</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded">
                <div>
                  <strong>Locataire :</strong> {selectedDeposit.lease.tenant.first_name} {selectedDeposit.lease.tenant.last_name}
                </div>
                <div>
                  <strong>Montant initial :</strong> {selectedDeposit.amount}€
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Retenues</h3>
                  <Button onClick={addDeduction} variant="outline" size="sm">
                    <Minus className="h-4 w-4 mr-2" />
                    Ajouter une retenue
                  </Button>
                </div>

                {formData.deductions.map((deduction, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Description</Label>
                      <Input
                        value={deduction.description}
                        onChange={(e) => updateDeduction(index, 'description', e.target.value)}
                        placeholder="ex: Nettoyage, réparations..."
                      />
                    </div>
                    <div className="w-32">
                      <Label>Montant (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button
                      onClick={() => removeDeduction(index)}
                      variant="outline"
                      size="icon"
                    >
                      ×
                    </Button>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Montant initial :</span>
                      <span>{selectedDeposit.amount}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total des retenues :</span>
                      <span>
                        -{formData.deductions.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0)}€
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Montant à restituer :</span>
                      <span>{calculateReturnAmount()}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Montant final de restitution (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.returnAmount}
                    onChange={(e) => setFormData({ ...formData, returnAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes sur la restitution..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => handleReturnDeposit(selectedDeposit.id)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Restituer et générer le reçu
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}