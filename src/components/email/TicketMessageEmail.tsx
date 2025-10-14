import { renderEmailLayout, type Branding } from './EmailLayout'

export interface TicketMessageEmailProps extends Branding {
  ticketTitle: string
  authorName?: string
  messagePreview: string
  ticketUrl?: string
}

export function generateTicketMessageEmailHTML(props: TicketMessageEmailProps): string {
  const { ticketTitle, authorName, messagePreview, ticketUrl, ...branding } = props
  const inner = `
    <h2 style="color:#111827; margin:0 0 12px 0;">Nouveau message sur le ticket</h2>
    <p style="color:#374151; line-height:1.6;">${authorName ? `<strong>${authorName}</strong> a écrit :` : 'Nouveau message reçu :'}</p>
    <blockquote style="margin:12px 0; padding:12px; background:#f9fafb; border-left:4px solid #3b82f6; color:#374151;">${messagePreview}</blockquote>
    <p style="color:#374151; line-height:1.6;"><strong>Ticket :</strong> ${ticketTitle}</p>
    ${ticketUrl ? `<div style=\"margin:16px 0;\"><a href=\"${ticketUrl}\" style=\"background:#3b82f6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;\">Ouvrir la conversation</a></div>` : ''}
  `
  return renderEmailLayout({ title: 'Nouveau message', children: inner, ...branding })
}

