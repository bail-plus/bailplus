export interface Branding {
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string; // hex or css color
  footerText?: string;
}

export interface EmailLayoutProps extends Branding {
  title: string;
  children: string; // inner HTML already escaped/controlled
}

export function renderEmailLayout({
  title,
  children,
  brandName = 'BailoGenius',
  logoUrl,
  primaryColor = '#3b82f6',
  footerText = 'Cet email vous a été envoyé par BailoGenius',
}: EmailLayoutProps): string {
  const header = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName}" style="max-height:40px" />`
    : `<h1 style="color: white; margin: 0;">${brandName}</h1>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>img{display:block} a{color:${primaryColor}}</style>
  <!-- Preheader -->
</head>
<body style="margin:0;padding:0;font-family:Arial, sans-serif; background-color:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto; background:#ffffff;">
    <div style="background-color:${primaryColor}; padding:20px; text-align:center;">
      ${header}
    </div>
    <div style="padding:24px;">${children}</div>
    <div style="padding:16px; text-align:center; background-color:#f3f4f6; color:#6b7280; font-size:12px;">
      <p style="margin:0 0 8px 0;">${footerText}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

