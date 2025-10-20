import type { Entity, EntityType, NotificationPreferences } from "@/hooks/account/useSettingsController";

export type { Entity, EntityType, NotificationPreferences };

export type SettingsBankAccount = {
  id: string;
  name: string;
  iban: string;
  provider: string;
  syncStatus: "connected" | "disconnected";
  lastSync: string;
};
