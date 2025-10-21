import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Upload, Calculator, FileText } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  units: Array<{
    id: string;
    unit_number: string;
  }>;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  status: 'pending' | 'allocated' | 'reconciled';
  invoice_file_url: string | null;
  property: {
    name: string;
  } | null;
  unit: {
    unit_number: string;
  } | null;
}

const EXPENSE_CATEGORIES = [
  'Réparations',
  'Entretien',
  'Assurances',
  'Taxes foncières',
  'Charges communes',
  'Frais de gestion',
  'Travaux',
  'Autres'
];

export default function ExpenseManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    property_id: '',
    unit_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchProperties(), fetchExpenses()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        units (
          id,
          unit_number
        )
      `);

    if (error) throw error;
    setProperties(data || []);
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        property:properties (name),
        unit:units (unit_number)
      `)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    setExpenses(data as Expense[] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          property_id: formData.property_id || null,
          unit_id: formData.unit_id || null,
        });

      if (error) throw error;

      toast.success('Dépense créée avec succès');
      setIsModalOpen(false);
      setFormData({
        description: '',
        amount: '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        property_id: '',
        unit_id: '',
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Erreur lors de la création de la dépense');
    }
  };

  const handleFileUpload = async (expenseId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${expenseId}.${fileExt}`;
      const filePath = `expenses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('expenses')
        .update({ invoice_file_url: publicUrl })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      toast.success('Facture téléchargée avec succès');
      fetchExpenses();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors du téléchargement de la facture');
    }
  };

  const performAnnualRegularization = async () => {
    try {
      // Simulate annual regularization calculation
      const totalExpenses = expenses
        .filter(e => e.status === 'allocated')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0);
      const expensePerUnit = totalExpenses / totalUnits;

      // Create regularization entries (simplified)
      for (const property of properties) {
        for (const unit of property.units) {
          await supabase
            .from('expenses')
            .insert({
              description: `Régularisation charges ${new Date().getFullYear()}`,
              amount: expensePerUnit,
              category: 'Régularisation',
              expense_date: new Date().toISOString().split('T')[0],
              property_id: property.id,
              unit_id: unit.id,
              status: 'reconciled'
            });
        }
      }

      toast.success('Régularisation annuelle effectuée');
      fetchExpenses();
    } catch (error) {
      console.error('Error performing regularization:', error);
      toast.error('Erreur lors de la régularisation');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      allocated: { label: 'Répartie', variant: 'default' as const },
      reconciled: { label: 'Régularisée', variant: 'outline' as const }
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const selectedProperty = properties.find(p => p.id === formData.property_id);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des charges</h2>
        <div className="flex gap-2">
          <Button onClick={performAnnualRegularization} variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Régularisation annuelle
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une dépense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense_date">Date</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property">Propriété (optionnel)</Label>
                  <Select value={formData.property_id} onValueChange={(value) => setFormData({ ...formData, property_id: value, unit_id: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une propriété" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProperty && selectedProperty.units.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unité (optionnel)</Label>
                    <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProperty.units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unit_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Créer la dépense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Propriété</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.amount}€</TableCell>
                  <TableCell>
                    {expense.property ? (
                      <div>
                        {expense.property.name}
                        {expense.unit && ` - ${expense.unit.unit_number}`}
                      </div>
                    ) : (
                      'Générale'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge {...getStatusBadge(expense.status)}>
                      {getStatusBadge(expense.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!expense.invoice_file_url ? (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(expense.id, file);
                            }
                          }}
                          style={{ display: 'none' }}
                          id={`file-${expense.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`file-${expense.id}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Facture
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Voir facture
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}