import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ReceiptTemplate } from "@/hooks/receipts/useReceiptTemplate";

interface ReceiptPreviewProps {
  template: ReceiptTemplate;
}

export function ReceiptPreview({ template }: ReceiptPreviewProps) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [stampDataUrl, setStampDataUrl] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [template.logo_url, template.signature_url, template.stamp_url]);

  const loadImages = async () => {
    if (template.logo_url) {
      const { data } = await supabase.storage
        .from('PRIVATE')
        .createSignedUrl(template.logo_url, 60);
      if (data) setLogoDataUrl(data.signedUrl);
    }
    if (template.signature_url) {
      const { data } = await supabase.storage
        .from('PRIVATE')
        .createSignedUrl(template.signature_url, 60);
      if (data) setSignatureDataUrl(data.signedUrl);
    }
    if (template.stamp_url) {
      const { data } = await supabase.storage
        .from('PRIVATE')
        .createSignedUrl(template.stamp_url, 60);
      if (data) setStampDataUrl(data.signedUrl);
    }
  };

  // Données d'exemple pour la prévisualisation
  const exampleData = {
    period: "Octobre 2025",
    tenantName: "Jean Dupont",
    tenantAddress: "45 Rue de la Paix, 75002 Paris",
    propertyAddress: "10 Avenue des Champs, 75008 Paris",
    unitNumber: "Appartement 3B",
    periodStart: "01/10/2025",
    periodEnd: "31/10/2025",
    rentAmount: 1200.00,
    chargesAmount: 150.00,
    totalAmount: 1350.00,
    date: new Date().toLocaleDateString('fr-FR'),
  };

  return (
    <div
      className="bg-white p-8 shadow-lg rounded-lg overflow-auto max-h-[800px]"
      style={{
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* LOGO (si activé) */}
      {template.show_logo && logoDataUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={logoDataUrl}
            alt="Logo"
            className="max-h-16 object-contain"
          />
        </div>
      )}

      {/* EN-TÊTE */}
      <div className="text-center mb-6">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: template.secondary_color }}
        >
          QUITTANCE DE LOYER
        </h1>
        <p className="text-gray-500 font-semibold">
          Période : {exampleData.period}
        </p>
      </div>

      {/* BORDURE BLEUE */}
      <div
        className="h-1 mb-6"
        style={{ backgroundColor: template.primary_color }}
      />

      {/* SECTION PROPRIÉTAIRE */}
      <div
        className="p-4 rounded mb-4"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <h3
          className="font-bold text-sm mb-3"
          style={{ color: template.secondary_color }}
        >
          PROPRIÉTAIRE
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Nom :</span>
            <span>{template.landlord_name}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Adresse :</span>
            <span>{template.landlord_address}</span>
          </div>
        </div>
      </div>

      {/* SECTION LOCATAIRE */}
      <div
        className="p-4 rounded mb-4"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <h3
          className="font-bold text-sm mb-3"
          style={{ color: template.secondary_color }}
        >
          LOCATAIRE
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Nom :</span>
            <span>{exampleData.tenantName}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Adresse :</span>
            <span>{exampleData.tenantAddress}</span>
          </div>
        </div>
      </div>

      {/* SECTION LOGEMENT */}
      <div
        className="p-4 rounded mb-6"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <h3
          className="font-bold text-sm mb-3"
          style={{ color: template.secondary_color }}
        >
          LOGEMENT LOUÉ
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Adresse :</span>
            <span>{exampleData.propertyAddress}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Logement :</span>
            <span>{exampleData.unitNumber}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-600 w-24">Période :</span>
            <span>Du {exampleData.periodStart} au {exampleData.periodEnd}</span>
          </div>
        </div>
      </div>

      {/* TABLEAU DES MONTANTS */}
      <div className="mb-6">
        {/* En-tête */}
        <div
          className="flex justify-between p-3 text-white font-semibold rounded-t"
          style={{ backgroundColor: template.primary_color }}
        >
          <span>Désignation</span>
          <span>Montant</span>
        </div>

        {/* Lignes */}
        <div className="border-l border-r border-gray-300">
          <div className="flex justify-between p-3 border-b border-gray-300">
            <span>Loyer</span>
            <span>{exampleData.rentAmount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between p-3 border-b border-gray-300">
            <span>Charges</span>
            <span>{exampleData.chargesAmount.toFixed(2)} €</span>
          </div>
        </div>

        {/* Total */}
        <div
          className="flex justify-between p-3 font-bold rounded-b"
          style={{
            backgroundColor: template.accent_color,
            color: template.secondary_color
          }}
        >
          <span>TOTAL</span>
          <span>{exampleData.totalAmount.toFixed(2)} €</span>
        </div>
      </div>

      {/* DÉCLARATION */}
      <div
        className="p-4 rounded mb-6 border-l-4 text-xs"
        style={{
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b'
        }}
      >
        <p className="text-amber-900">
          Le propriétaire soussigné reconnaît avoir reçu du locataire la somme de{' '}
          <strong>{exampleData.totalAmount.toFixed(2)} €</strong> au titre du loyer et des charges
          pour la période du {exampleData.periodStart} au {exampleData.periodEnd}.
        </p>
      </div>

      {/* SIGNATURES */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p className="font-semibold text-xs mb-12">Le locataire</p>
          <div className="border-t border-gray-400 pt-1" />
        </div>
        <div>
          <p className="font-semibold text-xs mb-2">Le propriétaire</p>
          {template.show_signature && signatureDataUrl && (
            <div className="mb-2">
              <img
                src={signatureDataUrl}
                alt="Signature"
                className="max-h-16 object-contain"
              />
            </div>
          )}
          {template.show_stamp && stampDataUrl && (
            <div className="mb-2">
              <img
                src={stampDataUrl}
                alt="Cachet"
                className="max-h-16 object-contain"
              />
            </div>
          )}
          {!template.show_signature && !template.show_stamp && (
            <div className="h-12" />
          )}
          <div className="border-t border-gray-400 pt-1" />
        </div>
      </div>

      {/* PIED DE PAGE */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Fait à {template.landlord_city}, le {exampleData.date}</p>
        <p className="text-[10px]">Document généré automatiquement par BailoGenius</p>
        {template.footer_text && (
          <p className="text-[10px]">{template.footer_text}</p>
        )}
      </div>
    </div>
  );
}
