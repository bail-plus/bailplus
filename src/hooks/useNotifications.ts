import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export interface SendNotificationParams {
  recipientId: string
  // For DB we map to: 'tenant' | 'contractor' | 'other'
  recipientType: 'LANDLORD' | 'TENANT' | 'SERVICE_PROVIDER'
  subject: string
  content: string // HTML content
  ticketId?: string
  contextType?: 'ticket' | 'lease' | 'general'
}

/**
 * Send a notification to a user via communication logs
 */
type BrandingRow = Database['public']['Tables']['branding_settings']['Row'] | null

async function loadBrandingForUser(userId: string): Promise<BrandingRow> {
  // Load default entity
  const { data: entity } = await supabase
    .from('entities')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle()

  if (!entity) return null

  const { data: branding } = await supabase
    .from('branding_settings')
    .select('*')
    .eq('entity_id', entity.id)
    .maybeSingle()

  return branding
}

function mapBrandingToLayoutProps(branding: BrandingRow | null | undefined) {
  if (!branding) return {}
  return {
    brandName: branding.brand_name || undefined,
    logoUrl: branding.logo_url || undefined,
    primaryColor: branding.primary_color || undefined,
    footerText: branding.footer_text || undefined,
  }
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  const {
    recipientId,
    recipientType,
    subject,
    content,
    ticketId,
    contextType = 'ticket'
  } = params

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get sender's role from profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    // Get recipient's email and notification preferences
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', recipientId)
      .single()

    const { data: notificationPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', recipientId)
      .single()

    // Check if user wants email notifications
    const emailEnabled = notificationPrefs?.email_enabled ?? true

    if (!emailEnabled) {
      console.log('User has disabled email notifications')
      return
    }

    // Create communication log
    // Map recipient type to DB check constraint values
    const recipientTypeDb = recipientType === 'TENANT' ? 'tenant' : recipientType === 'SERVICE_PROVIDER' ? 'contractor' : 'other'

    const { error } = await supabase
      .from('communication_logs')
      .insert({
        recipient_id: recipientId,
        recipient_type: recipientTypeDb,
        recipient_email: recipientProfile?.email || null,
        sender_id: user.id,
        sender_role: senderProfile?.user_type || 'LANDLORD',
        subject,
        content,
        ticket_id: ticketId || null,
        context_type: contextType,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating communication log:', error)
      throw error
    }

    // Try to send email via Edge Function if available
    try {
      const { data: recipient } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', recipientId)
        .maybeSingle()

      const branding = await loadBrandingForUser(user.id)

      const to = recipient?.email
      if (to) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          to,
          subject,
          html: content,
        }
        if (branding?.from_email) payload.fromEmail = branding.from_email
        if (branding?.from_name) payload.fromName = branding.from_name
        if (branding?.reply_to_email) payload.replyTo = branding.reply_to_email

        // Fire-and-forget; rely on Edge function logs for delivery status
        await supabase.functions.invoke('send-email', { body: payload })
      }
    } catch (invokeError) {
      console.warn('Edge email send failed or function missing:', invokeError)
    }

    console.log('Notification logged and email attempted')
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

/**
 * Send notification when a service provider is assigned to a ticket
 */
export async function notifyProviderAssignment(
  ticketId: string,
  providerId: string,
  ticketTitle: string,
  propertyName: string
): Promise<void> {
  // Check if provider wants provider_assigned notifications
  const { data: notificationPrefs } = await supabase
    .from('notification_preferences')
    .select('provider_assigned, email_enabled')
    .eq('user_id', providerId)
    .single()

  // If provider has disabled provider_assigned notifications, don't send
  if (notificationPrefs && !notificationPrefs.provider_assigned) {
    console.log('Provider has disabled assignment notifications')
    return
  }

  const subject = 'Nouveau ticket de maintenance assigné'
  const branding = await loadBrandingForUser((await supabase.auth.getUser()).data.user!.id)
  const { generateProviderAssignmentEmailHTML } = await import('@/components/email/ProviderAssignmentEmail')
  const content = generateProviderAssignmentEmailHTML({
    ticketTitle,
    propertyName,
    ...mapBrandingToLayoutProps(branding),
  })

  await sendNotification({
    recipientId: providerId,
    recipientType: 'SERVICE_PROVIDER',
    subject,
    content,
    ticketId,
    contextType: 'ticket',
  })
}

// Additional helpers to cover other Sprint 5.1 events
export async function notifyNewTicket(
  recipientId: string,
  ticketId: string,
  ticketTitle: string,
  propertyName?: string
) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('new_ticket_created, email_enabled')
    .eq('user_id', recipientId)
    .single()

  if (prefs && (!prefs.email_enabled || !prefs.new_ticket_created)) return

  const subject = 'Nouveau ticket créé'
  const branding = await loadBrandingForUser((await supabase.auth.getUser()).data.user!.id)
  const { generateNewTicketEmailHTML } = await import('@/components/email/NewTicketEmail')
  const content = generateNewTicketEmailHTML({ ticketTitle, propertyName, ...mapBrandingToLayoutProps(branding) })

  await sendNotification({
    recipientId,
    recipientType: 'LANDLORD',
    subject,
    content,
    ticketId,
    contextType: 'ticket',
  })
}

export async function notifyTicketMessage(
  recipientId: string,
  ticketId: string,
  ticketTitle: string,
  authorName: string,
  messagePreview: string
) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('ticket_message, email_enabled')
    .eq('user_id', recipientId)
    .single()

  if (prefs && (!prefs.email_enabled || !prefs.ticket_message)) return

  const subject = 'Nouveau message sur votre ticket'
  const branding = await loadBrandingForUser((await supabase.auth.getUser()).data.user!.id)
  const { generateTicketMessageEmailHTML } = await import('@/components/email/TicketMessageEmail')
  const content = generateTicketMessageEmailHTML({ ticketTitle, authorName, messagePreview, ...mapBrandingToLayoutProps(branding) })

  await sendNotification({
    recipientId,
    recipientType: 'TENANT',
    subject,
    content,
    ticketId,
    contextType: 'ticket',
  })
}

export async function notifyTicketStatusChange(
  recipientId: string,
  ticketId: string,
  ticketTitle: string,
  oldStatus: string | undefined,
  newStatus: string,
  changedByName?: string
) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('ticket_status_changed, email_enabled')
    .eq('user_id', recipientId)
    .single()

  if (prefs && (!prefs.email_enabled || !prefs.ticket_status_changed)) return

  const subject = 'Statut du ticket mis à jour'
  const branding = await loadBrandingForUser((await supabase.auth.getUser()).data.user!.id)
  const { generateTicketStatusChangeEmailHTML } = await import('@/components/email/TicketStatusChangeEmail')
  const content = generateTicketStatusChangeEmailHTML({ ticketTitle, oldStatus, newStatus, changedByName, ...mapBrandingToLayoutProps(branding) })

  await sendNotification({
    recipientId,
    recipientType: 'TENANT',
    subject,
    content,
    ticketId,
    contextType: 'ticket',
  })
}

export async function sendTenantInvitationEmail(
  recipientId: string,
  inviteeEmail: string,
  invitationUrl: string,
  expiresAt: string,
  inviterName?: string,
  inviteeName?: string
) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_enabled')
    .eq('user_id', recipientId)
    .maybeSingle()

  if (prefs && prefs.email_enabled === false) return

  const subject = 'Invitation à rejoindre BailoGenius'
  const { generateInvitationEmailHTML } = await import('@/components/email/InvitationEmailTemplate')
  const content = generateInvitationEmailHTML({
    inviterName: inviterName || 'Bailleur',
    inviteeName: inviteeName || inviteeEmail,
    role: 'tenant',
    invitationUrl,
    expiresAt,
  })

  await sendNotification({
    recipientId,
    recipientType: 'TENANT',
    subject,
    content,
    contextType: 'general',
  })
}

export async function sendProviderInvitationEmail(
  recipientId: string,
  inviteeEmail: string,
  invitationUrl: string,
  expiresAt: string,
  inviterName?: string,
  inviteeName?: string
) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_enabled')
    .eq('user_id', recipientId)
    .maybeSingle()

  if (prefs && prefs.email_enabled === false) return

  const subject = 'Invitation prestataire – BailoGenius'
  const { generateInvitationEmailHTML } = await import('@/components/email/InvitationEmailTemplate')
  const content = generateInvitationEmailHTML({
    inviterName: inviterName || 'Bailleur',
    inviteeName: inviteeName || inviteeEmail,
    role: 'manager',
    invitationUrl,
    expiresAt,
  })

  await sendNotification({
    recipientId,
    recipientType: 'SERVICE_PROVIDER',
    subject,
    content,
    contextType: 'general',
  })
}
