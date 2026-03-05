import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/ui/use-toast';

export interface ReceiptTemplate {
  landlord_name: string;
  landlord_address: string;
  landlord_city: string;
  logo_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  show_logo: boolean;
  show_signature: boolean;
  show_stamp: boolean;
  footer_text: string;
}

export function useReceiptTemplate() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'signature' | 'stamp' | null>(null);

  const [template, setTemplate] = useState<ReceiptTemplate>({
    landlord_name: "BailoGenius SAS",
    landlord_address: "123 Avenue de la République, 75011 Paris",
    landlord_city: "Paris",
    logo_url: null,
    signature_url: null,
    stamp_url: null,
    primary_color: "#2563eb",
    secondary_color: "#1e40af",
    accent_color: "#dbeafe",
    show_logo: false,
    show_signature: true,
    show_stamp: false,
    footer_text: "",
  });

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les informations du profil pour auto-remplir
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, company_name, adress, city, postal_code')
        .eq('user_id', user.id)
        .single();

      // Construire le nom du propriétaire depuis le profil
      let autoLandlordName = "BailoGenius SAS";
      if (profile?.company_name) {
        autoLandlordName = profile.company_name;
      } else if (profile?.first_name || profile?.last_name) {
        autoLandlordName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      }

      // Construire l'adresse depuis le profil
      let autoLandlordAddress = "123 Avenue de la République, 75011 Paris";
      let autoLandlordCity = "Paris";

      if (profile?.adress) {
        const parts = [profile.adress];
        if (profile.postal_code || profile.city) {
          parts.push(`${profile.postal_code || ''} ${profile.city || ''}`.trim());
        }
        autoLandlordAddress = parts.join(', ');
      }

      if (profile?.city) {
        autoLandlordCity = profile.city;
      }

      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading template:', error);
      }

      if (data) {
        setTemplate({
          landlord_name: autoLandlordName,
          landlord_address: autoLandlordAddress,
          landlord_city: autoLandlordCity,
          logo_url: data.logo_url,
          signature_url: data.signature_url,
          stamp_url: data.stamp_url,
          primary_color: data.primary_color || "#2563eb",
          secondary_color: data.secondary_color || "#1e40af",
          accent_color: data.accent_color || "#dbeafe",
          show_logo: data.show_logo ?? false,
          show_signature: data.show_signature ?? true,
          show_stamp: data.show_stamp ?? false,
          footer_text: data.footer_text || "",
        });
      } else {
        setTemplate(prev => ({
          ...prev,
          landlord_name: autoLandlordName,
          landlord_address: autoLandlordAddress,
          landlord_city: autoLandlordCity,
          footer_text: "",
        }));
      }
    } catch (error) {
      console.error('Error in loadTemplate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'signature' | 'stamp'
  ) => {
    try {
      setUploading(type);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `TEMPLATES/${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('PRIVATE')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setTemplate(prev => ({
        ...prev,
        [`${type}_url`]: filePath,
      }));

      toast({
        title: "Fichier uploadé",
        description: `Votre ${type === 'logo' ? 'logo' : type === 'signature' ? 'signature' : 'cachet'} a été uploadé avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Vérifier si un template existe déjà
      const { data: existing } = await supabase
        .from('receipt_templates')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      // Préparer les données à sauvegarder (uniquement les colonnes de la table)
      const templateData = {
        landlord_name: template.landlord_name,
        landlord_address: template.landlord_address,
        landlord_city: template.landlord_city,
        logo_url: template.logo_url,
        signature_url: template.signature_url,
        stamp_url: template.stamp_url,
        primary_color: template.primary_color,
        secondary_color: template.secondary_color,
        accent_color: template.accent_color,
        show_logo: template.show_logo,
        show_signature: template.show_signature,
        show_stamp: template.show_stamp,
        footer_text: template.footer_text,
      };

      if (existing) {
        // Mettre à jour le template existant
        const { error } = await supabase
          .from('receipt_templates')
          .update(templateData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Créer un nouveau template
        const { error } = await supabase
          .from('receipt_templates')
          .insert({
            user_id: user.id,
            ...templateData,
            is_default: true,
          });

        if (error) throw error;
      }

      toast({
        title: "Modèle sauvegardé",
        description: "Vos modifications ont été enregistrées avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    template,
    setTemplate,
    loading,
    saving,
    uploading,
    handleFileUpload,
    handleSave,
  };
}
