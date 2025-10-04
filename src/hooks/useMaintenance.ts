import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type MaintenanceTicket = Tables<'maintenance_tickets'>;
export type MaintenanceTicketInsert = TablesInsert<'maintenance_tickets'>;
export type MaintenanceTicketUpdate = TablesUpdate<'maintenance_tickets'>;

export type WorkOrder = Tables<'work_orders'>;
export type WorkOrderInsert = TablesInsert<'work_orders'>;
export type WorkOrderUpdate = TablesUpdate<'work_orders'>;

// Extended ticket type with related data
export type MaintenanceTicketWithDetails = MaintenanceTicket & {
  property?: {
    name: string;
    address: string;
  };
  unit?: {
    unit_number: string;
    type?: string;
  };
  assigned_contact?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  created_by_contact?: {
    first_name: string;
    last_name: string;
  };
  work_orders?: WorkOrder[];
};

// Fetch all maintenance tickets with details
async function fetchMaintenanceTicketsWithDetails(): Promise<MaintenanceTicketWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Get tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ticketsError) throw new Error(ticketsError.message);
  if (!tickets) return [];

  // Enrich each ticket with related data
  const enrichedTickets = await Promise.all(
    tickets.map(async (ticket) => {
      // Get property
      const { data: property } = await supabase
        .from('properties')
        .select('name, address')
        .eq('id', ticket.property_id)
        .single();

      // Get unit if specified
      let unit = null;
      if (ticket.unit_id) {
        const { data: unitData } = await supabase
          .from('units')
          .select('unit_number, type')
          .eq('id', ticket.unit_id)
          .single();
        unit = unitData;
      }

      // Get assigned contact if specified
      let assigned_contact = null;
      if (ticket.assigned_to) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('first_name, last_name, email, phone')
          .eq('id', ticket.assigned_to)
          .single();
        assigned_contact = contactData;
      }

      // Get created by contact if specified
      let created_by_contact = null;
      if (ticket.created_by) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('first_name, last_name')
          .eq('id', ticket.created_by)
          .single();
        created_by_contact = contactData;
      }

      // Get work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false });

      return {
        ...ticket,
        property: property as any,
        unit: unit as any,
        assigned_contact: assigned_contact as any,
        created_by_contact: created_by_contact as any,
        work_orders: workOrders ?? [],
      };
    })
  );

  return enrichedTickets;
}

// Fetch a single ticket by ID
async function fetchTicketById(id: string): Promise<MaintenanceTicket> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create a new maintenance ticket
async function createMaintenanceTicket(ticket: MaintenanceTicketInsert): Promise<MaintenanceTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('maintenance_tickets')
    .insert({
      ...ticket,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance ticket:', error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing maintenance ticket
async function updateMaintenanceTicket({ id, ...updates }: MaintenanceTicketUpdate & { id: string }): Promise<MaintenanceTicket> {
  const { data, error } = await supabase
    .from('maintenance_tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a maintenance ticket
async function deleteMaintenanceTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_tickets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Create a new work order
async function createWorkOrder(workOrder: WorkOrderInsert): Promise<WorkOrder> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      ...workOrder,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating work order:', error);
    throw new Error(error.message);
  }

  return data;
}

// Update an existing work order
async function updateWorkOrder({ id, ...updates }: WorkOrderUpdate & { id: string }): Promise<WorkOrder> {
  const { data, error } = await supabase
    .from('work_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a work order
async function deleteWorkOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch all maintenance tickets with details
export function useMaintenanceTicketsWithDetails() {
  return useQuery({
    queryKey: ['maintenance-tickets', 'with-details'],
    queryFn: fetchMaintenanceTicketsWithDetails,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single ticket
export function useMaintenanceTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['maintenance-tickets', id],
    queryFn: () => fetchTicketById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a maintenance ticket
export function useCreateMaintenanceTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMaintenanceTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

// Hook to update a maintenance ticket
export function useUpdateMaintenanceTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMaintenanceTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.setQueryData(['maintenance-tickets', data.id], data);
    },
  });
}

// Hook to delete a maintenance ticket
export function useDeleteMaintenanceTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMaintenanceTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
    },
  });
}

// Hook to create a work order
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

// Hook to update a work order
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

// Hook to delete a work order
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}
