import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSecureToken, generateExpirationDate } from '@/lib/invitation-token';
import type { Database } from '@/integrations/supabase/types';

type UserTypeEnum = Database['public']['Enums']['user_type_enum'];
type InvitationContextEnum = Database['public']['Enums']['invitation_context_enum'];
type InvitationStatusEnum = Database['public']['Enums']['invitation_status_enum'];

export interface Invitation {
  id: string;
  email: string;
  role: UserTypeEnum;
  invited_by: string;
  invitation_context: InvitationContextEnum;
  lease_id: string | null;
  property_id: string | null;
  token: string;
  expires_at: string;
  status: InvitationStatusEnum;
  accepted_at: string | null;
  user_id: string | null;
  custom_message: string | null;
  created_at: string;
}

export interface CreateInvitationParams {
  email: string;
  role: 'TENANT' | 'SERVICE_PROVIDER';
  invitation_context?: InvitationContextEnum;
  lease_id?: string;
  property_id?: string;
  custom_message?: string;
}

export function useInvitations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère toutes les invitations du landlord connecté
   */
  const fetchInvitations = useCallback(async (): Promise<Invitation[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invited_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    } catch (err) {
      console.error('Error fetching invitations:', err);
      throw err;
    }
  }, []);

  /**
   * Crée une nouvelle invitation
   */
  const createInvitation = useCallback(async (params: CreateInvitationParams) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si l'utilisateur existe déjà
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', params.email)
        .single();

      if (existingProfile) {
        throw new Error('A user with this email already exists');
      }

      // Vérifier si une invitation existe déjà
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', params.email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new Error('An invitation has already been sent to this email');
      }

      // Générer le token et la date d'expiration
      const token = generateSecureToken();
      const expiresAt = generateExpirationDate(7); // 7 jours

      // Créer l'invitation
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: params.email,
          role: params.role,
          invited_by: user.id,
          invitation_context: params.invitation_context || 'manual',
          lease_id: params.lease_id || null,
          property_id: params.property_id || null,
          token,
          expires_at: expiresAt,
          status: 'pending',
          custom_message: params.custom_message || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer l'email d'invitation (obligatoire)
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-invitation-email',
          {
            body: { invitationId: data.id }
          }
        );

        if (emailError) {
          // Si l'email échoue, supprimer l'invitation créée
          await supabase.from('user_invitations').delete().eq('id', data.id);
          throw new Error('Failed to send invitation email: ' + emailError.message);
        }

        // En mode dev, afficher l'URL d'invitation
        if (emailData?.devMode) {
          console.log('🎉 Invitation créée avec succès !');
          console.log('🔗 URL d\'invitation:', emailData.invitationUrl);
          console.log('📋 Copiez cette URL pour tester l\'acceptation d\'invitation');
        } else {
          console.log('✅ Invitation email sent successfully:', emailData);
        }
      } catch (emailErr) {
        // Si l'email échoue, supprimer l'invitation créée
        await supabase.from('user_invitations').delete().eq('id', data.id);
        const message = emailErr instanceof Error ? emailErr.message : 'Failed to send invitation email';
        throw new Error(message);
      }

      return data as Invitation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invitation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Annule une invitation
   */
  const cancelInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel invitation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Renvoie une invitation (génère un nouveau token)
   */
  const resendInvitation = useCallback(async (invitationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const newToken = generateSecureToken();
      const newExpiresAt = generateExpirationDate(7);

      const { error } = await supabase
        .from('user_invitations')
        .update({
          token: newToken,
          expires_at: newExpiresAt,
          status: 'pending'
        })
        .eq('id', invitationId);

      if (error) throw error;

      // Renvoyer l'email d'invitation
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-invitation-email',
          {
            body: { invitationId }
          }
        );

        if (emailError) {
          console.error('Failed to resend invitation email:', emailError);
        } else {
          console.log('Invitation email resent successfully:', emailData);
        }
      } catch (emailErr) {
        console.error('Error resending invitation email:', emailErr);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère une invitation par son token
   */
  const getInvitationByToken = useCallback(async (token: string): Promise<Invitation | null> => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Invitation not found
        }
        throw error;
      }

      return data as Invitation;
    } catch (err) {
      console.error('Error fetching invitation by token:', err);
      throw err;
    }
  }, []);

  /**
   * Accepte une invitation et crée le profil utilisateur
   */
  const acceptInvitation = useCallback(async (token: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer l'invitation
      const invitation = await getInvitationByToken(token);

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status === 'accepted') {
        throw new Error('Cette invitation a déjà été acceptée');
      }

      if (invitation.status === 'cancelled') {
        throw new Error('Cette invitation a été annulée');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Cette invitation n\'est plus valide');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Cette invitation a expiré');
      }

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', invitation.email)
        .single();

      if (existingUser) {
        throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter.');
      }

      // Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            role: invitation.role,
            invited_by: invitation.invited_by,
            is_invited_user: true,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter.');
        }
        throw authError;
      }
      if (!authData.user) throw new Error('Failed to create user');

      // Attendre un peu que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vérifier si le profil existe
      let profileExists = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!profileExists && attempts < maxAttempts) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', authData.user.id)
          .single();

        if (existingProfile) {
          profileExists = true;
        } else {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Si le profil n'existe toujours pas, le créer manuellement
      if (!profileExists) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: invitation.email,
            user_type: invitation.role,
            invited_by: invitation.invited_by,
            linked_to_landlord: invitation.invited_by,
            is_invited_user: true,
            invitation_accepted_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
          throw new Error('Impossible de créer le profil utilisateur');
        }
      } else {
        // Mettre à jour le profil existant
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            user_type: invitation.role,
            invited_by: invitation.invited_by,
            linked_to_landlord: invitation.invited_by,
            is_invited_user: true,
            invitation_accepted_at: new Date().toISOString(),
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Failed to update profile:', profileError);
        }
      }

      // Mettre à jour l'invitation
      await supabase
        .from('user_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: authData.user.id,
        })
        .eq('token', token);

      // Si c'est un prestataire, créer l'entrée dans service_providers
      if (invitation.role === 'SERVICE_PROVIDER') {
        const { error: providerError } = await supabase
          .from('service_providers')
          .insert({
            user_id: authData.user.id,
            landlord_id: invitation.invited_by,
          });

        if (providerError) throw providerError;
      }

      return authData.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getInvitationByToken]);

  /**
   * Supprime un utilisateur invité et son invitation
   */
  const deleteInvitedUser = useCallback(async (invitationId: string, userId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      // Supprimer le profil si userId est fourni
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) {
          console.error('Error deleting profile:', profileError);
          // On continue même si ça échoue
        }
      }

      // Supprimer l'invitation
      const { error: invitationError } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (invitationError) throw invitationError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    getInvitationByToken,
    acceptInvitation,
    deleteInvitedUser,
  };
}
