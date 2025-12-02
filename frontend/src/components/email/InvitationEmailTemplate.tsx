interface InvitationEmailTemplateProps {
  inviterName: string;
  inviteeName: string;
  role: string;
  invitationUrl: string;
  customMessage?: string;
  expiresAt: string;
}

export function InvitationEmailTemplate({
  inviterName,
  inviteeName,
  role,
  invitationUrl,
  customMessage,
  expiresAt,
}: InvitationEmailTemplateProps) {
  const roleTranslations: Record<string, string> = {
    landlord: 'Propriétaire',
    tenant: 'Locataire',
    manager: 'Gestionnaire',
    viewer: 'Consultant',
  };

  const roleName = roleTranslations[role] || role;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#3b82f6', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0 }}>BailoGenius</h1>
      </div>

      <div style={{ padding: '30px', backgroundColor: '#f9fafb' }}>
        <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>
          Vous êtes invité(e) à rejoindre BailoGenius
        </h2>

        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
          Bonjour {inviteeName || 'Cher utilisateur'},
        </p>

        <p style={{ color: '#4b5563', lineHeight: '1.6' }}>
          <strong>{inviterName}</strong> vous invite à rejoindre sa plateforme de gestion locative
          BailoGenius en tant que <strong>{roleName}</strong>.
        </p>

        {customMessage && (
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderLeft: '4px solid #3b82f6',
            margin: '20px 0',
            fontStyle: 'italic',
            color: '#6b7280'
          }}>
            "{customMessage}"
          </div>
        )}

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={invitationUrl}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 30px',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            Accepter l'invitation
          </a>
        </div>

        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
          Cette invitation expire le{' '}
          <strong>{new Date(expiresAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</strong>.
        </p>

        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
          Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
        </p>

        <p style={{
          color: '#3b82f6',
          fontSize: '12px',
          wordBreak: 'break-all',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {invitationUrl}
        </p>
      </div>

      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
        fontSize: '12px'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          Cet email vous a été envoyé par BailoGenius
        </p>
        <p style={{ margin: 0 }}>
          Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
        </p>
      </div>
    </div>
  );
}

export function generateInvitationEmailHTML(props: InvitationEmailTemplateProps): string {
  const roleTranslations: Record<string, string> = {
    landlord: 'Propriétaire',
    tenant: 'Locataire',
    manager: 'Gestionnaire',
    viewer: 'Consultant',
  };

  const roleName = roleTranslations[props.role] || props.role;
  const expirationDate = new Date(props.expiresAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
        Bonjour ${props.inviteeName || 'Cher utilisateur'},
      </p>

      <p style="color: #4b5563; line-height: 1.6;">
        <strong>${props.inviterName}</strong> vous invite à rejoindre sa plateforme de gestion locative
        BailoGenius en tant que <strong>${roleName}</strong>.
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
        Cette invitation expire le <strong>${expirationDate}</strong>.
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
  `.trim();
}
