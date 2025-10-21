import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

// Enriched contact type with lease information
export type ContactWithLeaseInfo = Contact & {
  role?: 'tenant' | 'guarantor' | 'both';
  activeLeases?: number;
  leases?: Array<{
    id: string;
    unit_id: string;
    status: string | null;
    start_date: string;
    end_date: string | null;
  }>;
};

// Fetch all contacts
async function fetchContacts(): Promise<Contact[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Fetch contacts with lease information
async function fetchContactsWithLeaseInfo(): Promise<ContactWithLeaseInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (contactsError) throw new Error(contactsError.message);
  if (!contacts) return [];

  // Get lease_tenants info
  const { data: leaseTenants } = await supabase
    .from('lease_tenants')
    .select('contact_id, role, lease_id')
    .eq('user_id', user.id);

  // Get lease_guarantors info
  const { data: leaseGuarantors } = await supabase
    .from('lease_guarantors')
    .select('guarantor_contact_id, lease_id')
    .eq('user_id', user.id);

  // Get all leases
  const { data: allLeases } = await supabase
    .from('leases')
    .select('id, unit_id, status, start_date, end_date, tenant_id')
    .eq('user_id', user.id);

  // Enrich contacts with role information
  const enrichedContacts = contacts.map(contact => {
    const isTenant = leaseTenants?.some(lt => lt.contact_id === contact.id);
    const isGuarantor = leaseGuarantors?.some(lg => lg.guarantor_contact_id === contact.id);

    let role: 'tenant' | 'guarantor' | 'both' | undefined;
    if (isTenant && isGuarantor) role = 'both';
    else if (isTenant) role = 'tenant';
    else if (isGuarantor) role = 'guarantor';

    const activeLeases = leaseTenants?.filter(lt => lt.contact_id === contact.id).length ?? 0;

    // Get leases for this contact
    const contactLeases = allLeases?.filter(lease => lease.tenant_id === contact.id) ?? [];

    return {
      ...contact,
      role,
      activeLeases,
      leases: contactLeases.map(lease => ({
        id: lease.id,
        unit_id: lease.unit_id,
        status: lease.status,
        start_date: lease.start_date,
        end_date: lease.end_date,
      })),
    };
  });

  return enrichedContacts;
}

// Fetch a single contact by ID
async function fetchContactById(id: string): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create a new contact
async function createContact(contact: ContactInsert): Promise<Contact> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Remove user_id from the contact data - let the DB handle it via RLS or trigger
  const { user_id, ...contactWithoutUserId } = contact;

  const { data, error } = await supabase
    .from('contacts')
    .insert(contactWithoutUserId)
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw new Error(`Erreur: ${error.message}. Code: ${error.code}. Détails: ${error.details}`);
  }
  return data;
}

// Update an existing contact
async function updateContact({ id, ...updates }: ContactUpdate & { id: string }): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a contact
async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Hook to fetch all contacts
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch contacts with lease information
export function useContactsWithLeaseInfo() {
  return useQuery({
    queryKey: ['contacts', 'with-lease-info'],
    queryFn: fetchContactsWithLeaseInfo,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single contact
export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => fetchContactById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a contact
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

// Hook to update a contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContact,
    onSuccess: (data) => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Update the specific contact in the cache
      queryClient.setQueryData(['contacts', data.id], data);
    },
  });
}

// Hook to delete a contact
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      // Invalidate all contact-related queries
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
