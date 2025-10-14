import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useEntity } from '@/contexts/EntityContext';
import { autoCreateTicketParticipants } from '@/hooks/useTicketParticipants';

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
async function fetchMaintenanceTicketsWithDetails(userId: string, entityId?: string | null, showAll?: boolean): Promise<MaintenanceTicketWithDetails[]> {
  if (!userId) return [];

  console.log('[useMaintenance] Fetching tickets for user', userId);

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('user_id', userId)
    .single();

  const userType = profile?.user_type || 'LANDLORD';
  console.log('[useMaintenance] User type:', userType);

  // Build query based on user type
  let ticketsQuery = supabase
    .from('maintenance_tickets')
    .select('*');

  if (userType === 'LANDLORD') {
    // Propriétaires : voir tous leurs tickets
    ticketsQuery = ticketsQuery.eq('user_id', userId);

    // Si une entité est sélectionnée, filtrer par property_ids de cette entité
    if (!showAll && entityId) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('entity_id', entityId);

      const propertyIds = properties?.map(p => p.id) || [];

      if (propertyIds.length === 0) {
        return []; // Aucune propriété pour cette entité
      }

      ticketsQuery = ticketsQuery.in('property_id', propertyIds);
    }
  } else if (userType === 'TENANT') {
    // Locataires : voir les tickets de leur logement
    // D'abord récupérer le bail actif du locataire
    const { data: activeLease, error: leaseError } = await supabase
      .from('leases')
      .select('unit_id')
      .eq('tenant_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (leaseError) {
      console.error('[useMaintenance] Error fetching lease:', leaseError);
    }

    console.log('[useMaintenance] Active lease for tenant:', activeLease);

    if (!activeLease) {
      console.log('[useMaintenance] No active lease found for tenant');
      return []; // Pas de bail actif, pas de tickets à afficher
    }

    // Filtrer par unit_id ou tenant_id
    ticketsQuery = ticketsQuery.or(`unit_id.eq.${activeLease.unit_id},tenant_id.eq.${userId}`);
  } else if (userType === 'SERVICE_PROVIDER') {
    // Prestataires : voir uniquement les tickets qui leur sont assignés
    ticketsQuery = ticketsQuery.eq('assigned_to', userId);
    console.log('[useMaintenance] Filtering tickets by assigned_to:', userId);
  } else {
    // Type inconnu, ne rien afficher
    console.warn('[useMaintenance] Unknown user type:', userType);
    return [];
  }

  const { data: tickets, error: ticketsError } = await ticketsQuery
    .order('created_at', { ascending: false });

  console.log('[useMaintenance] Tickets found:', tickets?.length || 0);

  if (ticketsError) {
    console.error('[useMaintenance] Error fetching tickets:', ticketsError);
    throw new Error(ticketsError.message);
  }
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

      // Get assigned service provider if specified (from profiles, not contacts)
      let assigned_contact = null;
      if (ticket.assigned_to) {
        console.log('[useMaintenance] Fetching provider for:', ticket.assigned_to);
        const { data: providerData, error: providerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', ticket.assigned_to)
          .maybeSingle();

        if (providerError) {
          console.error('[useMaintenance] Error fetching provider:', providerError);
        }

        console.log('[useMaintenance] Provider data:', providerData);

        if (providerData) {
          // Use fallbacks: first_name+last_name > company_name > 'Prestataire'
          let displayFirstName = '';
          let displayLastName = '';

          if (providerData.first_name && providerData.last_name) {
            // Si on a prénom et nom, on les utilise
            displayFirstName = providerData.first_name;
            displayLastName = providerData.last_name;
          } else if (providerData.company_name) {
            // Sinon si on a un nom d'entreprise, on l'utilise comme prénom
            displayFirstName = providerData.company_name;
            displayLastName = '';
          } else {
            // Sinon on affiche "Prestataire"
            displayFirstName = 'Prestataire';
            displayLastName = '';
          }

          assigned_contact = {
            first_name: displayFirstName,
            last_name: displayLastName,
            email: providerData.email || '',
            phone: providerData.phone_number || '',
          };
        }
      }

      // Get created by user if specified (from profiles)
      let created_by_contact = null;
      if (ticket.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', ticket.created_by)
          .maybeSingle();

        if (creatorData) {
          let displayFirstName = '';
          let displayLastName = '';

          if (creatorData.first_name && creatorData.last_name) {
            displayFirstName = creatorData.first_name;
            displayLastName = creatorData.last_name;
          } else if (creatorData.company_name) {
            displayFirstName = creatorData.company_name;
            displayLastName = '';
          } else {
            displayFirstName = 'Utilisateur';
            displayLastName = '';
          }

          created_by_contact = {
            first_name: displayFirstName,
            last_name: displayLastName,
          };
        }
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
import { notifyNewTicket, notifyProviderAssignment, notifyTicketStatusChange } from '@/hooks/useNotifications'

async function createMaintenanceTicket(ticket: MaintenanceTicketInsert): Promise<MaintenanceTicket> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Get user's role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('user_id', user.id)
    .single();

  const userRole = profile?.user_type || 'LANDLORD';

  const { data, error } = await supabase
    .from('maintenance_tickets')
    .insert({
      ...ticket,
      user_id: user.id,
      created_by: user.id,
      created_by_role: userRole,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating maintenance ticket:', error);
    throw new Error(error.message);
  }

  // Auto-create participants (landlord + tenant if applicable)
  try {
    await autoCreateTicketParticipants(
      data.id,
      user.id, // landlord
      ticket.tenant_id || null // tenant if provided
    );
  } catch (participantError) {
    console.error('Error creating participants:', participantError);
    // Don't fail the ticket creation if participant creation fails
  }

  // Notifications: informer le tenant (s'il existe)
  try {
    // Notifier le bailleur (toujours) pour vérifier le flux
    if (data.user_id) {
      await notifyNewTicket(data.user_id, data.id, data.title || 'Nouveau ticket', (data as any).property_name)
    }
    // Notifier le locataire uniquement s'il a un compte (profil)
    if (data.tenant_id) {
      const { data: tenantProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', data.tenant_id)
        .maybeSingle()
      if (tenantProfile?.user_id) {
        await notifyNewTicket(tenantProfile.user_id, data.id, data.title || 'Nouveau ticket', (data as any).property_name)
      }
    }
  } catch (e) {
    console.warn('[notifications] notifyNewTicket failed:', e)
  }

  return data;
}

// Update an existing maintenance ticket
async function updateMaintenanceTicket({ id, ...updates }: MaintenanceTicketUpdate & { id: string }): Promise<MaintenanceTicket> {
  // Fetch previous state to detect changes
  const { data: prev } = await supabase
    .from('maintenance_tickets')
    .select('id, user_id, tenant_id, property_id, title, status, assigned_to')
    .eq('id', id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('maintenance_tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Detect status change
  try {
    if (prev && updates.status && updates.status !== prev.status) {
      // Notify landlord and tenant if present
      if (prev.user_id) {
        await notifyTicketStatusChange(prev.user_id, id, data.title || 'Ticket', prev.status || undefined, updates.status)
      }
      if (prev.tenant_id) {
        await notifyTicketStatusChange(prev.tenant_id, id, data.title || 'Ticket', prev.status || undefined, updates.status)
      }
    }
  } catch (e) {
    console.warn('[notifications] status change notify failed:', e)
  }

  // Detect provider assignment
  try {
    if (prev && updates.assigned_to && updates.assigned_to !== prev.assigned_to) {
      // fetch property name
      let propertyName: string | undefined
      if (data.property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('name')
          .eq('id', data.property_id)
          .maybeSingle()
        propertyName = prop?.name || undefined
      }
      await notifyProviderAssignment(id, updates.assigned_to as string, data.title || 'Ticket', propertyName || '')
    }
  } catch (e) {
    console.warn('[notifications] provider assignment notify failed:', e)
  }

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
  const { user } = useAuth();
  const { selectedEntity, showAll } = useEntity();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: ['maintenance-tickets', 'with-details', userId, selectedEntity?.id, showAll],
    queryFn: () => fetchMaintenanceTicketsWithDetails(userId, selectedEntity?.id, showAll),
    enabled: !!userId,
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
