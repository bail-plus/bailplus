import { renderEmailLayout, type Branding } from './EmailLayout'

export interface TicketStatusChangeEmailProps extends Branding {
  ticketTitle: string
  oldStatus?: string
  newStatus: string
  changedByName?: string
  ticketUrl?: string
}

export function generateTicketStatusChangeEmailHTML(props: TicketStatusChangeEmailProps): string {
  const { ticketTitle, oldStatus, newStatus, changedByName, ticketUrl, ...branding } = props
  const inner = `
    <h2 style="color:#111827; margin:0 0 12px 0;">Changement de statut</h2>
    <p style="color:#374151; line-height:1.6;">${changedByName ? `<strong>${changedByName}</strong> a mis à jour le statut.` : 'Le statut du ticket a été mis à jour.'}</p>
    <p style="color:#374151; line-height:1.6;"><strong>Ticket :</strong> ${ticketTitle}</p>
    <p style="color:#374151; line-height:1.6;">${oldStatus ? `<strong>${oldStatus}</strong> → ` : ''}<strong>${newStatus}</strong></p>
    ${ticketUrl ? `<div style=\"margin:16px 0;\"><a href=\"${ticketUrl}\" style=\"background:#3b82f6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;\">Voir le ticket</a></div>` : ''}
  `
  return renderEmailLayout({ title: 'Statut du ticket', children: inner, ...branding })
}

