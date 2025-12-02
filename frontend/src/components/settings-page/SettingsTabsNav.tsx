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
  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <div className="overflow-x-auto pb-2">
        <TabsList className="flex w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 whitespace-nowrap">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
