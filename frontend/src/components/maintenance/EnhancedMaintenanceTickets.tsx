import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Wrench, Upload, User, Calendar, DollarSign, Check } from 'lucide-react';

interface Property {
  id: string;
  name: string;
  units: Array<{
    id: string;
    unit_number: string;
  }>;
}

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
  assigned_to: string | null;
  created_at: string;
  property: {
    name: string;
  };
  unit: {
    unit_number: string;
  } | null;
  work_orders: WorkOrder[];
}

interface WorkOrder {
  id: string;
  contractor_name: string | null;
  description: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

const PRIORITIES = [
  { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
];

const STATUSES = [
  { value: 'open', label: 'Ouvert' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'waiting', label: 'En attente' },
  { value: 'done', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' }
];

export default function EnhancedMaintenanceTickets() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [ticketFormData, setTicketFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    property_id: '',
    unit_id: '',
    assigned_to: ''
  });
  const [workOrderFormData, setWorkOrderFormData] = useState({
    contractor_name: '',
    description: '',
    estimated_cost: '',
    scheduled_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchProperties(), fetchTickets()]);
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

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .select(`
        *,
        property:properties (name),
        unit:units (unit_number),
        work_orders (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setTickets(data as MaintenanceTicket[] || []);
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .insert({
          title: ticketFormData.title,
          description: ticketFormData.description,
          priority: ticketFormData.priority,
          property_id: ticketFormData.property_id,
          unit_id: ticketFormData.unit_id || null,
          assigned_to: ticketFormData.assigned_to || null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Ticket créé avec succès');
      setIsTicketModalOpen(false);
      setTicketFormData({
        title: '',
        description: '',
        priority: 'medium',
        property_id: '',
        unit_id: '',
        assigned_to: ''
      });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erreur lors de la création du ticket');
    }
  };

  const createWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('work_orders')
        .insert({
          ticket_id: selectedTicket.id,
          contractor_name: workOrderFormData.contractor_name,
          description: workOrderFormData.description,
          estimated_cost: parseFloat(workOrderFormData.estimated_cost) || null,
          scheduled_date: workOrderFormData.scheduled_date || null
        });

      if (error) throw error;

      toast.success('Ordre de travail créé avec succès');
      setIsWorkOrderModalOpen(false);
      setWorkOrderFormData({
        contractor_name: '',
        description: '',
        estimated_cost: '',
        scheduled_date: ''
      });
      fetchTickets();
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Erreur lors de la création de l\'ordre de travail');
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
    return { label: config.label, className: config.color };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Ouvert', variant: 'secondary' as const },
      in_progress: { label: 'En cours', variant: 'default' as const },
      waiting: { label: 'En attente', variant: 'outline' as const },
      done: { label: 'Terminé', variant: 'default' as const },
      cancelled: { label: 'Annulé', variant: 'destructive' as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
  };

  const selectedProperty = properties.find(p => p.id === ticketFormData.property_id);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tickets de maintenance</h2>
        <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un ticket de maintenance</DialogTitle>
            </DialogHeader>
            <form onSubmit={createTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={ticketFormData.title}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={ticketFormData.description}
                  onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={ticketFormData.priority} onValueChange={(value) => setTicketFormData({ ...ticketFormData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigné à</Label>
                  <Input
                    id="assigned_to"
                    value={ticketFormData.assigned_to}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, assigned_to: e.target.value })}
                    placeholder="Nom du prestataire"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property">Propriété</Label>
                <Select value={ticketFormData.property_id} onValueChange={(value) => setTicketFormData({ ...ticketFormData, property_id: value, unit_id: '' })}>
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

              {selectedProperty && (
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité (optionnel)</Label>
                  <Select value={ticketFormData.unit_id} onValueChange={(value) => setTicketFormData({ ...ticketFormData, unit_id: value })}>
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
                Créer le ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ticket.title}</h3>
                    <Badge 
                      className={getPriorityBadge(ticket.priority).className}
                    >
                      {getPriorityBadge(ticket.priority).label}
                    </Badge>
                    <Badge {...getStatusBadge(ticket.status)}>
                      {getStatusBadge(ticket.status).label}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.property.name}
                    {ticket.unit && ` - ${ticket.unit.unit_number}`}
                  </div>
                  {ticket.assigned_to && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {ticket.assigned_to}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={isWorkOrderModalOpen} onOpenChange={setIsWorkOrderModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Ordre de travail
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer un ordre de travail</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={createWorkOrder} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="contractor_name">Prestataire</Label>
                          <Input
                            id="contractor_name"
                            value={workOrderFormData.contractor_name}
                            onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, contractor_name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="wo_description">Description</Label>
                          <Textarea
                            id="wo_description"
                            value={workOrderFormData.description}
                            onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, description: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="estimated_cost">Coût estimé (€)</Label>
                            <Input
                              id="estimated_cost"
                              type="number"
                              step="0.01"
                              value={workOrderFormData.estimated_cost}
                              onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, estimated_cost: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="scheduled_date">Date prévue</Label>
                            <Input
                              id="scheduled_date"
                              type="date"
                              value={workOrderFormData.scheduled_date}
                              onChange={(e) => setWorkOrderFormData({ ...workOrderFormData, scheduled_date: e.target.value })}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full">
                          Créer l'ordre de travail
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {ticket.status !== 'done' && (
                    <Button
                      size="sm"
                      onClick={() => updateTicketStatus(ticket.id, 'done')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Terminer
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {ticket.description && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{ticket.description}</p>
              </CardContent>
            )}

            {ticket.work_orders.length > 0 && (
              <CardContent className="pt-0">
                <h4 className="font-medium mb-2">Ordres de travail ({ticket.work_orders.length})</h4>
                <div className="space-y-2">
                  {ticket.work_orders.map((wo) => (
                    <div key={wo.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <div>
                        <div className="font-medium">{wo.contractor_name}</div>
                        <div className="text-muted-foreground">{wo.description}</div>
                      </div>
                      <div className="text-right">
                        {wo.estimated_cost && (
                          <div className="text-muted-foreground">{wo.estimated_cost}€ estimé</div>
                        )}
                        {wo.scheduled_date && (
                          <div className="text-muted-foreground">
                            {new Date(wo.scheduled_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}