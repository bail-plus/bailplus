import { renderEmailLayout, type Branding } from './EmailLayout'

export interface ProviderAssignmentEmailProps extends Branding {
  ticketTitle: string
  propertyName?: string
  assignedAt?: string
  ticketUrl?: string
}

export function generateProviderAssignmentEmailHTML(props: ProviderAssignmentEmailProps): string {
  const { ticketTitle, propertyName, assignedAt, ticketUrl, ...branding } = props
  const inner = `
    <h2 style=\"color:#111827; margin:0 0 12px 0;\">Nouveau ticket assigné</h2>
    <p style=\"color:#374151; line-height:1.6;\">Vous avez été assigné à un ticket de maintenance.</p>
    <p style=\"color:#374151; line-height:1.6;\"><strong>Titre :</strong> ${ticketTitle}</p>
    ${propertyName ? `<p style=\\"color:#374151; line-height:1.6;\\"><strong>Propriété :</strong> ${propertyName}</p>` : ''}
    ${assignedAt ? `<p style=\\"color:#374151; line-height:1.6;\\"><strong>Date :</strong> ${new Date(assignedAt).toLocaleString('fr-FR')}</p>` : ''}
    ${ticketUrl ? `<div style=\\"margin:16px 0;\\"><a href=\\"${ticketUrl}\\" style=\\"background:#3b82f6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;display:inline-block;\\">Voir le ticket</a></div>` : ''}
  `
  return renderEmailLayout({ title: 'Assignation prestataire', children: inner, ...branding })
}

