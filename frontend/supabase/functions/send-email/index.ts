// Supabase Edge Function: send-email
// Receives { to, subject, html, fromEmail?, fromName?, replyTo? }
// TODO: Integrate with your email provider (Resend, SendGrid, etc.) via secrets

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface SendPayload {
  to: string
  subject: string
  html: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    // CORS preflight
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as SendPayload
    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(JSON.stringify({ error: 'Missing to/subject/html' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Example: use Resend (commented out). Set RESEND_API_KEY secret.
    // const apiKey = Deno.env.get('RESEND_API_KEY')
    // if (!apiKey) throw new Error('Missing RESEND_API_KEY')
    // const from = payload.fromEmail && payload.fromName ? `${payload.fromName} <${payload.fromEmail}>` : (payload.fromEmail || 'no-reply@example.com')
    // const res = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ to: payload.to, subject: payload.subject, html: payload.html, from, reply_to: payload.replyTo }),
    // })
    // if (!res.ok) {
    //   const text = await res.text()
    //   console.error('Email provider error:', text)
    //   return new Response(JSON.stringify({ error: 'Provider error', details: text }), { status: 502 })
    // }

    // For now, log only
    console.log('[send-email] to=', payload.to, 'subject=', payload.subject)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[send-email] error', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
