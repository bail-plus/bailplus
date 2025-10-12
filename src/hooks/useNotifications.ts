import { supabase } from '@/integrations/supabase/client'

export interface SendNotificationParams {
  recipientId: string
  recipientType: 'LANDLORD' | 'TENANT' | 'SERVICE_PROVIDER'
  subject: string
  content: string
  ticketId?: string
  contextType?: 'ticket' | 'lease' | 'general'
}

/**
 * Send a notification to a user via communication logs
 */
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
    const { error } = await supabase
      .from('communication_logs')
      .insert({
        recipient_id: recipientId,
        recipient_type: recipientType,
        recipient_email: recipientProfile?.email || null,
        sender_id: user.id,
        sender_role: senderProfile?.user_type || 'LANDLORD',
        subject,
        content,
        ticket_id: ticketId || null,
        context_type: contextType,
        status: 'SENT',
        sent_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error creating communication log:', error)
      throw error
    }

    console.log('Notification sent successfully')
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
  const content = `Vous avez été assigné au ticket de maintenance "${ticketTitle}" pour la propriété ${propertyName}.

Veuillez vous connecter à votre compte pour consulter les détails du ticket et prendre les mesures nécessaires.`

  await sendNotification({
    recipientId: providerId,
    recipientType: 'SERVICE_PROVIDER',
    subject,
    content,
    ticketId,
    contextType: 'ticket',
  })
}
