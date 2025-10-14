import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

export type TicketParticipant = Tables<'ticket_participants'>;
export type TicketParticipantInsert = TablesInsert<'ticket_participants'>;

// Fetch participants for a ticket
async function fetchTicketParticipants(ticketId: string): Promise<TicketParticipant[]> {
  const { data, error } = await supabase
    .from('ticket_participants')
    .select('*')
    .eq('ticket_id', ticketId);

  if (error) throw new Error(error.message);
  return data || [];
}

// Add a participant to a ticket
async function addTicketParticipant(participant: TicketParticipantInsert): Promise<TicketParticipant> {
  const { data, error } = await supabase
    .from('ticket_participants')
    .insert(participant)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Auto-create participants for a ticket (landlord + tenant)
export async function autoCreateTicketParticipants(
  ticketId: string,
  landlordId: string,
  tenantId?: string | null
): Promise<void> {
  const participants: TicketParticipantInsert[] = [];

  // Add landlord as participant
  participants.push({
    ticket_id: ticketId,
    user_id: landlordId,
    role: 'LANDLORD',
    can_edit: true,
    can_close: true,
    notifications_enabled: true,
  });

  // Add tenant as participant if provided
  if (tenantId) {
    participants.push({
      ticket_id: ticketId,
      user_id: tenantId,
      role: 'TENANT',
      can_edit: false,
      can_close: false,
      notifications_enabled: true,
    });
  }

  const { error } = await supabase
    .from('ticket_participants')
    .insert(participants);

  if (error) {
    console.error('Error creating participants:', error);
    throw new Error(error.message);
  }
}

// Add service provider as participant
export async function addServiceProviderToTicket(
  ticketId: string,
  providerId: string
): Promise<void> {
  const { error } = await supabase
    .from('ticket_participants')
    .insert({
      ticket_id: ticketId,
      user_id: providerId,
      role: 'SERVICE_PROVIDER',
      can_edit: false,
      can_close: false,
      notifications_enabled: true,
    });

  if (error) throw new Error(error.message);
}

// Remove a participant from a ticket
async function removeTicketParticipant(participantId: string): Promise<void> {
  const { error } = await supabase
    .from('ticket_participants')
    .delete()
    .eq('id', participantId);

  if (error) throw new Error(error.message);
}

// Fetch service providers for a landlord (from profiles, not service_providers table)
async function fetchServiceProviders(landlordId: string): Promise<any[]> {
  console.log('[useTicketParticipants] Fetching providers for landlord:', landlordId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('linked_to_landlord', landlordId)
    .eq('user_type', 'SERVICE_PROVIDER')
    .order('first_name');

  if (error) {
    console.error('[useTicketParticipants] Error fetching providers:', error);
    throw new Error(error.message);
  }

  console.log('[useTicketParticipants] Providers fetched:', data);

  // Transform data to match expected format
  return (data || []).map(provider => {
    // Construct display name with fallbacks: first_name+last_name > company_name > 'Prestataire'
    let displayName = '';

    if (provider.first_name && provider.last_name) {
      displayName = `${provider.first_name} ${provider.last_name}`;
    } else if (provider.company_name) {
      displayName = provider.company_name;
    } else {
      displayName = 'Prestataire';
    }

    return {
      id: provider.user_id,
      user_id: provider.user_id,
      company_name: displayName,
      specialty: provider.specialty,
      first_name: provider.first_name,
      last_name: provider.last_name,
      email: provider.email,
    };
  });
}

// Hook to fetch participants for a ticket
export function useTicketParticipants(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['ticket-participants', ticketId],
    queryFn: () => fetchTicketParticipants(ticketId!),
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to add a participant
export function useAddTicketParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTicketParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-participants'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
    },
  });
}

// Hook to remove a participant
export function useRemoveTicketParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeTicketParticipant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-participants'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets'] });
    },
  });
}

// Hook to fetch service providers
export function useServiceProviders() {
  const { user } = useAuth();
  const landlordId = user?.id ?? '';

  return useQuery({
    queryKey: ['service-providers', landlordId],
    queryFn: () => fetchServiceProviders(landlordId),
    enabled: !!landlordId,
    staleTime: 10 * 60 * 1000,
  });
}
