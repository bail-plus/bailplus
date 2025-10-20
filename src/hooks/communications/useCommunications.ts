import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type CommunicationLog = Tables<'communication_logs'>;
export type CommunicationLogInsert = TablesInsert<'communication_logs'>;
export type CommunicationLogUpdate = TablesUpdate<'communication_logs'>;

export type CommunicationTemplate = Tables<'communication_templates'>;
export type CommunicationTemplateInsert = TablesInsert<'communication_templates'>;
export type CommunicationTemplateUpdate = TablesUpdate<'communication_templates'>;

// ============ COMMUNICATION LOGS ============

// Fetch all communication logs
async function fetchCommunicationLogs(): Promise<CommunicationLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('sent_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Create a communication log (send message)
async function createCommunicationLog(log: CommunicationLogInsert): Promise<CommunicationLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('communication_logs')
    .insert({
      ...log,
      sender_id: user.id,
      sender_role: 'LANDLORD', // Par défaut, le propriétaire envoie les messages
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating communication log:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
  return data;
}

// Update a communication log
async function updateCommunicationLog({ id, ...updates }: CommunicationLogUpdate & { id: string }): Promise<CommunicationLog> {
  const { data, error } = await supabase
    .from('communication_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a communication log
async function deleteCommunicationLog(id: string): Promise<void> {
  const { error } = await supabase
    .from('communication_logs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============ COMMUNICATION TEMPLATES ============

// Fetch all communication templates
async function fetchCommunicationTemplates(): Promise<CommunicationTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Fetch a single template by ID
async function fetchTemplateById(id: string): Promise<CommunicationTemplate> {
  const { data, error } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Create a new template
async function createCommunicationTemplate(template: CommunicationTemplateInsert): Promise<CommunicationTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase
    .from('communication_templates')
    .insert({
      ...template,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating template:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
  return data;
}

// Update a template
async function updateCommunicationTemplate({ id, ...updates }: CommunicationTemplateUpdate & { id: string }): Promise<CommunicationTemplate> {
  const { data, error } = await supabase
    .from('communication_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Delete a template
async function deleteCommunicationTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('communication_templates')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Duplicate a template
async function duplicateCommunicationTemplate(id: string): Promise<CommunicationTemplate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Fetch the original template
  const original = await fetchTemplateById(id);

  // Create a copy with a modified name
  const { data, error } = await supabase
    .from('communication_templates')
    .insert({
      name: `${original.name} (copie)`,
      type: original.type,
      subject: original.subject,
      content: original.content,
      variables: original.variables,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error duplicating template:', error);
    throw new Error(`Erreur: ${error.message}`);
  }
  return data;
}

// ============ HOOKS ============

// Hook to fetch all communication logs
export function useCommunicationLogs() {
  return useQuery({
    queryKey: ['communication-logs'],
    queryFn: fetchCommunicationLogs,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a communication log
export function useCreateCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCommunicationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
  });
}

// Hook to update a communication log
export function useUpdateCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCommunicationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
  });
}

// Hook to delete a communication log
export function useDeleteCommunicationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCommunicationLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
  });
}

// Hook to fetch all templates
export function useCommunicationTemplates() {
  return useQuery({
    queryKey: ['communication-templates'],
    queryFn: fetchCommunicationTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch a single template
export function useCommunicationTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['communication-templates', id],
    queryFn: () => fetchTemplateById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to create a template
export function useCreateCommunicationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCommunicationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
    },
  });
}

// Hook to update a template
export function useUpdateCommunicationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCommunicationTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      queryClient.setQueryData(['communication-templates', data.id], data);
    },
  });
}

// Hook to delete a template
export function useDeleteCommunicationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCommunicationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
    },
  });
}

// Hook to duplicate a template
export function useDuplicateCommunicationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateCommunicationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
    },
  });
}

// ============ UTILITY FUNCTIONS ============

/**
 * Replace variables in a template content
 * Variables should be in the format {{variableName}}
 */
export function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

/**
 * Extract variable names from template content
 * Returns an array of variable names found in {{variableName}} format
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = [...content.matchAll(regex)];
  return Array.from(new Set(matches.map(match => match[1])));
}
