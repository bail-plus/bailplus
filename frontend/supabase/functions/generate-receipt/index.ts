import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }

    console.log('Generating receipt for invoice:', invoiceId);

    // Récupérer les détails de la facture avec toutes les relations
    const { data: invoice, error: invoiceError } = await supabase
      .from('rent_invoices')
      .select(`
        *,
        lease:leases (
          *,
          unit:units (
            *,
            property:properties (*)
          )
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Récupérer le tenant depuis lease_tenants
    const { data: leaseTenants, error: tenantsError } = await supabase
      .from('lease_tenants')
      .select(`
        *,
        contact:contacts (*)
      `)
      .eq('lease_id', invoice.lease_id)
      .eq('role', 'tenant')
      .limit(1);

    if (tenantsError) {
      console.error('Error fetching tenant:', tenantsError);
    }

    const tenant = leaseTenants && leaseTenants.length > 0 ? leaseTenants[0].contact : null;
    const tenantLastName = tenant?.last_name || 'locataire';
    const tenantFirstName = tenant?.first_name || '';
    const tenantFullName = `${tenantFirstName} ${tenantLastName}`.trim();

    // Générer le nom du fichier
    const displayMonth = invoice.period_month.toString().padStart(2, '0');
    const timestamp = Date.now();
    const sanitizedLastName = tenantLastName.replace(/\s+/g, '_').toLowerCase();
    const filename = `quittance_${invoice.period_year}_${displayMonth}_${sanitizedLastName}_${timestamp}.pdf`;

    // Récupérer le user_id pour le path
    const { data: { user } } = await supabase.auth.getUser();
    const userId = invoice.user_id || user?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    const storagePath = `QUITTANCES/${userId}/${filename}`;

    // Récupérer le template personnalisé de l'utilisateur
    const { data: template } = await supabase
      .from('receipt_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    // Générer le PDF avec le template personnalisé
    const pdfBuffer = await generateReceiptPDF(invoice, tenant, invoice.lease?.unit, invoice.lease?.unit?.property, template, supabase);

    // Upload vers Supabase Storage dans le bucket PRIVATE
    const { error: uploadError } = await supabase.storage
      .from('PRIVATE')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Mettre à jour la facture avec le PDF URL
    await supabase
      .from('rent_invoices')
      .update({
        pdf_url: storagePath,
        auto_receipt_sent: true,
        auto_receipt_sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    // Créer une entrée dans documents
    await supabase
      .from('documents')
      .insert({
        name: `Quittance ${displayMonth}/${invoice.period_year}`,
        type: 'receipt',
        category: 'rent',
        file_url: storagePath,
        lease_id: invoice.lease_id,
        mime_type: 'application/pdf',
      });

    console.log('Receipt generated and uploaded:', storagePath);

    return new Response(
      JSON.stringify({
        success: true,
        storagePath,
        filename,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating receipt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Fonction helper pour charger une image depuis Supabase Storage
async function loadImageFromStorage(supabase: any, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('PRIVATE')
      .download(path);

    if (error || !data) {
      console.error('Error loading image:', error);
      return null;
    }

    // Convertir le blob en base64
    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // Détecter le type MIME
    const ext = path.split('.').pop()?.toLowerCase();
    let mimeType = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error in loadImageFromStorage:', error);
    return null;
  }
}

// Fonction pour générer le PDF avec jsPDF (même design que le template React)
async function generateReceiptPDF(invoice: any, tenant: any, unit: any, property: any, template: any, supabase: any): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const displayMonth = invoice.period_month.toString().padStart(2, '0');
  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Locataire';
  const tenantAddress = tenant?.address || 'Adresse non disponible';
  const propertyAddress = property?.address || 'Adresse non disponible';
  const unitNumber = unit?.unit_number || 'N/A';

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthName = monthNames[invoice.period_month - 1];

  const issueDate = new Date().toLocaleDateString('fr-FR');
  const periodStart = `01/${displayMonth}/${invoice.period_year}`;
  const lastDay = new Date(invoice.period_year, invoice.period_month, 0).getDate();
  const periodEnd = `${lastDay}/${displayMonth}/${invoice.period_year}`;

  // Utiliser les couleurs du template ou les couleurs par défaut
  const primaryColor = template?.primary_color || '#2563eb';
  const secondaryColor = template?.secondary_color || '#1e40af';
  const accentColor = template?.accent_color || '#dbeafe';

  // Utiliser le nom/adresse du template ou les valeurs par défaut
  const landlordName = template?.landlord_name || 'BailoGenius SAS';
  const landlordAddress = template?.landlord_address || '123 Avenue de la République, 75011 Paris';
  const landlordCity = template?.landlord_city || 'Paris';
  const additionalFooterText = template?.footer_text || '';

  // Charger les images si elles existent et sont activées
  let logoBase64 = null;
  let signatureBase64 = null;
  let stampBase64 = null;

  if (template?.show_logo && template?.logo_url) {
    logoBase64 = await loadImageFromStorage(supabase, template.logo_url);
  }
  if (template?.show_signature && template?.signature_url) {
    signatureBase64 = await loadImageFromStorage(supabase, template.signature_url);
  }
  if (template?.show_stamp && template?.stamp_url) {
    stampBase64 = await loadImageFromStorage(supabase, template.stamp_url);
  }

  // Convertir hex en RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 37, g: 99, b: 235 }; // Fallback au bleu par défaut
  };

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  const accentRgb = hexToRgb(accentColor);

  let yPos = 20;

  // LOGO (si activé et chargé)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 85, yPos, 40, 20, undefined, 'FAST');
      yPos += 25;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // EN-TÊTE avec bordure bleue
  doc.setFontSize(22);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFont('helvetica', 'bold');
  doc.text('QUITTANCE DE LOYER', 105, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`Période : ${monthName} ${invoice.period_year}`, 105, yPos, { align: 'center' });

  yPos += 5;
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.7);
  doc.line(20, yPos, 190, yPos);

  yPos += 10;

  // SECTION PROPRIÉTAIRE (avec fond gris clair)
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.rect(20, yPos, 170, 25, 'F');

  doc.setFontSize(13);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPRIÉTAIRE', 25, yPos + 6);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // #475569
  doc.setFont('helvetica', 'bold');
  doc.text('Nom :', 25, yPos + 13);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.setFont('helvetica', 'normal');
  doc.text(landlordName, 80, yPos + 13);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', 25, yPos + 19);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(landlordAddress, 80, yPos + 19);

  yPos += 30;

  // SECTION LOCATAIRE
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.rect(20, yPos, 170, 25, 'F');

  doc.setFontSize(13);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFont('helvetica', 'bold');
  doc.text('LOCATAIRE', 25, yPos + 6);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // #475569
  doc.setFont('helvetica', 'bold');
  doc.text('Nom :', 25, yPos + 13);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.setFont('helvetica', 'normal');
  doc.text(tenantName, 80, yPos + 13);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', 25, yPos + 19);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(tenantAddress, 80, yPos + 19);

  yPos += 30;

  // SECTION LOGEMENT LOUÉ
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.rect(20, yPos, 170, 30, 'F');

  doc.setFontSize(13);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGEMENT LOUÉ', 25, yPos + 6);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // #475569
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', 25, yPos + 13);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.setFont('helvetica', 'normal');
  doc.text(propertyAddress, 80, yPos + 13);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Logement :', 25, yPos + 19);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(unitNumber, 80, yPos + 19);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Période :', 25, yPos + 25);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Du ${periodStart} au ${periodEnd}`, 80, yPos + 25);

  yPos += 35;

  // TABLEAU DES MONTANTS
  // En-tête du tableau (bleu)
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(20, yPos, 170, 10, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Désignation', 25, yPos + 7);
  doc.text('Montant', 160, yPos + 7, { align: 'right' });

  yPos += 10;

  // Ligne Loyer
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.3);
  doc.rect(20, yPos, 170, 9, 'S');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // #1e293b
  doc.setFont('helvetica', 'normal');
  doc.text('Loyer', 25, yPos + 6);
  doc.text(`${invoice.rent_amount.toFixed(2)} €`, 185, yPos + 6, { align: 'right' });

  yPos += 9;

  // Ligne Charges
  doc.rect(20, yPos, 170, 9, 'S');
  doc.text('Charges', 25, yPos + 6);
  doc.text(`${(invoice.charges_amount || 0).toFixed(2)} €`, 185, yPos + 6, { align: 'right' });

  yPos += 9;

  // Ligne TOTAL (bleu clair)
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.rect(20, yPos, 170, 11, 'F');
  doc.setFontSize(12);
  doc.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 25, yPos + 7);
  doc.text(`${invoice.total_amount.toFixed(2)} €`, 185, yPos + 7, { align: 'right' });

  yPos += 16;

  // DÉCLARATION (fond jaune)
  doc.setFillColor(254, 243, 199); // #fef3c7
  doc.rect(20, yPos, 170, 22, 'F');
  doc.setDrawColor(245, 158, 11); // #f59e0b
  doc.setLineWidth(1);
  doc.line(20, yPos, 20, yPos + 22);

  doc.setFontSize(10.5);
  doc.setTextColor(120, 53, 15); // #78350f
  doc.setFont('helvetica', 'normal');
  const declarationText = `Le propriétaire soussigné reconnaît avoir reçu du locataire la somme de ${invoice.total_amount.toFixed(2)} € au titre du loyer et des charges pour la période du ${periodStart} au ${periodEnd}.`;
  doc.text(declarationText, 25, yPos + 6, { maxWidth: 160 });

  yPos += 27;

  // SIGNATURES
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // #475569
  doc.setFont('helvetica', 'bold');
  doc.text('Le locataire', 30, yPos);
  doc.text('Le propriétaire', 130, yPos);

  yPos += 5;

  // Ajouter la signature et/ou le cachet du propriétaire si activés
  if (signatureBase64) {
    try {
      doc.addImage(signatureBase64, 'PNG', 125, yPos, 30, 15, undefined, 'FAST');
      yPos += 17;
    } catch (error) {
      console.error('Error adding signature:', error);
      yPos += 15;
    }
  } else {
    yPos += 15;
  }

  if (stampBase64) {
    try {
      doc.addImage(stampBase64, 'PNG', 140, yPos - 12, 20, 20, undefined, 'FAST');
    } catch (error) {
      console.error('Error adding stamp:', error);
    }
  }

  // Lignes de signature
  doc.setDrawColor(148, 163, 184); // #94a3b8
  doc.setLineWidth(0.5);
  doc.line(25, yPos, 75, yPos);
  doc.line(125, yPos, 175, yPos);

  yPos += 15;

  // PIED DE PAGE
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.setFont('helvetica', 'normal');
  doc.text(`Fait à ${landlordCity}, le ${issueDate}`, 105, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(9);
  doc.text('Document généré automatiquement par BailoGenius', 105, yPos, { align: 'center' });

  // Ajouter le texte additionnel s'il existe
  if (additionalFooterText) {
    yPos += 4;
    doc.text(additionalFooterText, 105, yPos, { align: 'center' });
  }

  // Retourner le PDF en Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
