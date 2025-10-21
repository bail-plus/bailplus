import { TabsContent } from "@/components/ui/tabs";

import { InvitationManager } from "@/components/settings/InvitationManager";
import { SettingsHeader } from "@/components/settings-page/SettingsHeader";
import { SettingsTabsNav } from "@/components/settings-page/SettingsTabsNav";
import { OrganizationsTab } from "@/components/settings-page/OrganizationsTab";
import { BankingTab } from "@/components/settings-page/BankingTab";
import { TemplatesTab } from "@/components/settings-page/TemplatesTab";
import { RentRulesTab } from "@/components/settings-page/RentRulesTab";
import { BrandingTab } from "@/components/settings-page/BrandingTab";
import { PrivacyTab } from "@/components/settings-page/PrivacyTab";
import { NotificationsTab } from "@/components/settings-page/NotificationsTab";
import {
  useSettingsController,
  type EntityType,
} from "@/hooks/account/useSettingsController";
import type { SettingsTab } from "@/components/settings-page/SettingsTabsNav";

export default function Settings() {
  const {
    userType,
    tabs,
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
  } = useSettingsController();

  const tabItems: SettingsTab[] = tabs.map(({ value, label }) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-6">
      <SettingsHeader />

      <SettingsTabsNav
        tabs={tabItems}
        activeTab={activeTab}
        onChange={(value) => setActiveTab(value)}
      >
        {userType === "LANDLORD" && (
          <TabsContent value="organizations" className="space-y-4">
            <OrganizationsTab
              entities={entities}
              loading={loadingEntities}
              creating={creatingEntity}
              newEntityOpen={newEntityOpen}
              onOpenChange={(open) => setNewEntityOpen(open)}
              newEntityName={newEntityName}
              onEntityNameChange={(value) => setNewEntityName(value)}
              newEntityType={newEntityType}
              onEntityTypeChange={(value: EntityType) => setNewEntityType(value)}
              newEntityDescription={newEntityDescription}
              onEntityDescriptionChange={(value) =>
                setNewEntityDescription(value)
              }
              onCreateEntity={handleCreateEntity}
              onSetDefault={handleSetDefault}
              onDeleteEntity={handleDeleteEntity}
            />
          </TabsContent>
        )}

        {userType === "LANDLORD" && (
          <TabsContent value="users" className="space-y-4">
            <InvitationManager />
          </TabsContent>
        )}

        {userType === "LANDLORD" && (
          <TabsContent value="banking" className="space-y-4">
            <BankingTab accounts={[]} formatDate={formatDate} />
          </TabsContent>
        )}

        {userType === "LANDLORD" && (
          <TabsContent value="templates" className="space-y-4">
            <TemplatesTab />
          </TabsContent>
        )}

        {userType === "LANDLORD" && (
          <TabsContent value="rent-rules" className="space-y-4">
            <RentRulesTab />
          </TabsContent>
        )}

        {userType === "LANDLORD" && (
          <TabsContent value="branding" className="space-y-4">
            <BrandingTab />
          </TabsContent>
        )}

        <TabsContent value="privacy" className="space-y-4">
          <PrivacyTab userType={userType} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsTab
            prefs={prefs}
            loading={loadingPrefs}
            saving={savingPrefs}
            onToggle={updatePrefs}
            onSave={saveNotificationPrefs}
          />
        </TabsContent>
      </SettingsTabsNav>
    </div>
  );
}
