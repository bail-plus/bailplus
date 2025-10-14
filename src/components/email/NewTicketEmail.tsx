import { renderEmailLayout, type Branding } from './EmailLayout'

export interface NewTicketEmailProps extends Branding {
  ticketTitle: string
  propertyName?: string
  createdByName?: string
  ticketUrl?: string
}

export function generateNewTicketEmailHTML(props: NewTicketEmailProps): string {
  const { ticketTitle, propertyName, createdByName, ticketUrl, ...branding } = props
  const inner = `
    <h2 style="color:#111827; margin:0 0 12px 0;">Nouveau ticket créé</h2>
    <p style="color:#374151; line-height:1.6;">Un nouveau ticket a été créé${createdByName ? ` par <strong>${createdByName}</strong>` : ''}.</p>
    <p style="color:#374151; line-height:1.6;"><strong>Titre :</strong> ${ticketTitle}</p>
    ${propertyName ? `<p style=\"color:#374151; line-height:1.6;\"><strong>Propriété :</strong> ${propertyName}</p>` : ''}
    ${ticketUrl ? `<div style=\"margin:16px 0;\"><a href=\"${ticketUrl}\" style=\"background:#3b82f6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;\">Voir le ticket</a></div>` : ''}
  `
  return renderEmailLayout({ title: 'Nouveau ticket', children: inner, ...branding })
}

