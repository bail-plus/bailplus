import type { ReactNode } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SettingsTab = {
  value: string;
  label: string;
};

type SettingsTabsNavProps = {
  tabs: SettingsTab[];
  activeTab: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

export function SettingsTabsNav({
  tabs,
  activeTab,
  onChange,
  children,
}: SettingsTabsNavProps) {
  const gridClass =
    tabs.length === 2
      ? "grid-cols-2"
      : tabs.length === 3
      ? "grid-cols-3"
      : tabs.length === 4
      ? "grid-cols-4"
      : tabs.length === 5
      ? "grid-cols-5"
      : tabs.length === 6
      ? "grid-cols-6"
      : tabs.length === 7
      ? "grid-cols-7"
      : "grid-cols-8";

  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <TabsList className={`grid w-full ${gridClass}`}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
