import { useState, useEffect, useCallback, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/auth/useAuth";

export type EntityType = Database["public"]["Enums"]["entity_type_enum"];

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description: string | null;
  is_default: boolean;
  properties_count: number;
  active_leases_count: number;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  new_ticket_created: boolean;
  ticket_message: boolean;
  ticket_status_changed: boolean;
  provider_assigned: boolean;
  payment_received: boolean;
  frequency: "immediate" | "daily";
}

const TABS = [
  { value: "profile", label: "Profil", roles: ["LANDLORD", "TENANT", "SERVICE_PROVIDER"] as Array<string> },
  { value: "organizations", label: "Entités", roles: ["LANDLORD"] as Array<string> },
  { value: "users", label: "Utilisateurs", roles: ["LANDLORD"] as Array<string> },
  { value: "banking", label: "Banques", roles: ["LANDLORD"] as Array<string> },
  { value: "templates", label: "Modèles", roles: ["LANDLORD"] as Array<string> },
  { value: "rent-rules", label: "Règles loyers", roles: ["LANDLORD"] as Array<string> },
  { value: "branding", label: "Branding", roles: ["LANDLORD"] as Array<string> },
  { value: "privacy", label: "RGPD", roles: ["LANDLORD", "TENANT", "SERVICE_PROVIDER"] as Array<string> },
  { value: "notifications", label: "Notifications", roles: ["LANDLORD", "TENANT", "SERVICE_PROVIDER"] as Array<string> },
] as const;

export function useSettingsController() {
  const { profile } = useAuth();

  const userType = profile?.user_type ?? "LANDLORD";

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => tab.roles.includes(userType)),
    [userType]
  );

  const defaultTab = useMemo(() => {
    // Premier onglet visible selon le type d'utilisateur
    return "profile";
  }, [userType]);

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [newEntityOpen, setNewEntityOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState<EntityType>("PERSONAL");
  const [newEntityDescription, setNewEntityDescription] = useState("");
  const [creatingEntity, setCreatingEntity] = useState(false);

  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
    new_ticket_created: true,
    ticket_message: true,
    ticket_status_changed: true,
    provider_assigned: true,
    payment_received: false,
    frequency: "immediate",
  });

  const loadEntities = useCallback(async () => {
    try {
      setLoadingEntities(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entitiesData, error } = await supabase
        .from("entities")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      const enrichedEntities = await Promise.all(
        (entitiesData || []).map(async (entity) => {
          const { count: propertiesCount } = await supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("entity_id", entity.id);

          const { data: properties } = await supabase
            .from("properties")
            .select("id")
            .eq("entity_id", entity.id);

          let activeLeasesCount = 0;
          if (properties && properties.length > 0) {
            for (const property of properties) {
              const { data: units } = await supabase
                .from("units")
                .select("id")
                .eq("property_id", property.id);

              if (units && units.length > 0) {
                for (const unit of units) {
                  const { count } = await supabase
                    .from("leases")
                    .select("*", { count: "exact", head: true })
                    .eq("unit_id", unit.id)
                    .eq("status", "active");

                  activeLeasesCount += count || 0;
                }
              }
            }
          }

          return {
            id: entity.id,
            name: entity.name,
            type: entity.type as EntityType,
            description: entity.description,
            is_default: entity.is_default || false,
            properties_count: propertiesCount || 0,
            active_leases_count: activeLeasesCount,
          };
        })
      );

      setEntities(enrichedEntities);
    } catch (error) {
      console.error("Error loading entities:", error);
    } finally {
      setLoadingEntities(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPrefs(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setPrefs({
            email_enabled: !!data.email_enabled,
            sms_enabled: !!data.sms_enabled,
            push_enabled: !!data.push_enabled,
            new_ticket_created: !!data.new_ticket_created,
            ticket_message: !!data.ticket_message,
            ticket_status_changed: !!data.ticket_status_changed,
            provider_assigned: !!data.provider_assigned,
            payment_received: !!data.payment_received,
            frequency: (data as any).frequency || "immediate",
          });
        } else {
          await supabase
            .from("notification_preferences")
            .insert({ user_id: user.id });
        }
      } catch (error) {
        console.error("[SETTINGS] load notification prefs error", error);
      } finally {
        setLoadingPrefs(false);
      }
    })();
  }, []);

  const updatePrefs = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveNotificationPrefs = async () => {
    try {
      setSavingPrefs(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notification_preferences")
        .update({
          email_enabled: prefs.email_enabled,
          sms_enabled: prefs.sms_enabled,
          push_enabled: prefs.push_enabled,
          new_ticket_created: prefs.new_ticket_created,
          ticket_message: prefs.ticket_message,
          ticket_status_changed: prefs.ticket_status_changed,
          provider_assigned: prefs.provider_assigned,
          payment_received: prefs.payment_received,
          frequency: prefs.frequency,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      alert("Préférences enregistrées");
    } catch (error) {
      console.error("[SETTINGS] save notification prefs error", error);
      alert("Erreur lors de la sauvegarde des préférences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) {
      alert("Le nom de l'entité est requis");
      return;
    }

    setCreatingEntity(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("entities").insert({
        name: newEntityName,
        type: newEntityType,
        description: newEntityDescription || null,
        user_id: user.id,
        is_default: entities.length === 0,
      });

      if (error) throw error;

      alert("Entité créée avec succès !");
      setNewEntityOpen(false);
      setNewEntityName("");
      setNewEntityType("PERSONAL");
      setNewEntityDescription("");
      loadEntities();
    } catch (error) {
      console.error("Error creating entity:", error);
      alert("Erreur lors de la création de l'entité");
    } finally {
      setCreatingEntity(false);
    }
  };

  const handleSetDefault = async (entityId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await supabase
        .from("entities")
        .update({ is_default: false })
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("entities")
        .update({ is_default: true })
        .eq("id", entityId);

      if (error) throw error;
      loadEntities();
    } catch (error) {
      console.error("Error setting default entity:", error);
      alert("Erreur lors de la définition de l'entité par défaut");
    }
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette entité ? Toutes les propriétés associées seront également supprimées."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("entities")
        .delete()
        .eq("id", entityId);

      if (error) throw error;
      alert("Entité supprimée");
      loadEntities();
    } catch (error) {
      console.error("Error deleting entity:", error);
      alert("Erreur lors de la suppression de l'entité");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("fr-FR");

  return {
    userType,
    tabs: visibleTabs,
    activeTab,
    setActiveTab,

    entities,
    loadingEntities,
    newEntityOpen,
    setNewEntityOpen,
    newEntityName,
    setNewEntityName,
    newEntityType,
    setNewEntityType,
    newEntityDescription,
    setNewEntityDescription,
    creatingEntity,
    handleCreateEntity,
    handleSetDefault,
    handleDeleteEntity,

    prefs,
    loadingPrefs,
    savingPrefs,
    updatePrefs,
    saveNotificationPrefs,

    formatDate,
  };
}
