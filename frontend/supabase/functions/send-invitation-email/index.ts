import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  invitationId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { invitationId } = await req.json() as InvitationEmailRequest

    // Create Supabase client (service role pour bypasser RLS en dev)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      throw new Error('Invitation not found: ' + (invitationError?.message || 'Unknown error'))
    }

    // Get inviter profile separately
    const { data: inviterProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', invitation.invited_by)
      .single()

    // Generate invitation URL
    const appUrl = (Deno.env.get('APP_URL') || 'http://localhost:8080').replace(/\/$/, '')
    const invitationUrl = `${appUrl}/accept-invitation?token=${invitation.token}`

    // Role translations
    const roleTranslations: Record<string, string> = {
      landlord: 'Propriétaire',
      tenant: 'Locataire',
      manager: 'Gestionnaire',
      viewer: 'Consultant',
      TENANT: 'Locataire',
      SERVICE_PROVIDER: 'Prestataire de services',
    }

    const roleName = roleTranslations[invitation.role] || invitation.role

    // Get inviter name
    const inviterName = inviterProfile?.full_name ||
                       inviterProfile?.email ||
                       'Un utilisateur'

    // Format expiration date
    const expirationDate = new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Generate email HTML
    const emailHTML = generateInvitationEmailHTML({
      inviterName,
      inviteeName: invitation.email.split('@')[0], // Use email prefix as name
      role: invitation.role,
      roleName,
      invitationUrl,
      customMessage: invitation.custom_message,
      expirationDate,
    })

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const isDev = Deno.env.get('ENVIRONMENT') !== 'production'

    // En mode dev, ne pas envoyer d'email, juste retourner l'URL
    if (isDev || !resendApiKey) {
      console.log('🔗 Mode développement - Invitation URL:', invitationUrl)
      console.log('📧 Email destinataire:', invitation.email)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dev mode: Email not sent, check logs for invitation URL',
          invitationUrl,
          devMode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // En production, envoyer l'email via Resend
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `BailoGenius <${fromEmail}>`,
        to: [invitation.email],
        subject: `Invitation à rejoindre BailoGenius en tant que ${roleName}`,
        html: emailHTML,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailResult = await resendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        invitationUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

interface EmailTemplateProps {
  inviterName: string;
  inviteeName: string;
  role: string;
  roleName: string;
  invitationUrl: string;
  customMessage?: string | null;
  expirationDate: string;
}

function generateInvitationEmailHTML(props: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation BailoGenius</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">BailoGenius</h1>
    </div>

    <div style="padding: 30px; background-color: #f9fafb;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">
        Vous êtes invité(e) à rejoindre BailoGenius
      </h2>

      <p style="color: #4b5563; line-height: 1.6;">
        Bonjour ${props.inviteeName},
      </p>

      <p style="color: #4b5563; line-height: 1.6;">
        <strong>${props.inviterName}</strong> vous invite à rejoindre sa plateforme de gestion locative
        BailoGenius en tant que <strong>${props.roleName}</strong>.
      </p>

      ${props.customMessage ? `
      <div style="background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; font-style: italic; color: #6b7280;">
        "${props.customMessage}"
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a
          href="${props.invitationUrl}"
          style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;"
        >
          Accepter l'invitation
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Cette invitation expire le <strong>${props.expirationDate}</strong>.
      </p>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
      </p>

      <p style="color: #3b82f6; font-size: 12px; word-break: break-all; background-color: white; padding: 10px; border-radius: 4px;">
        ${props.invitationUrl}
      </p>
    </div>

    <div style="padding: 20px; text-align: center; background-color: #e5e7eb; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        Cet email vous a été envoyé par BailoGenius
      </p>
      <p style="margin: 0;">
        Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
