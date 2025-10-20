import { Bell, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import type { NotificationPreferences } from "@/hooks/account/useSettingsController";

type NotificationsTabProps = {
  prefs: NotificationPreferences;
  loading: boolean;
  saving: boolean;
  onToggle: (
    key: keyof NotificationPreferences,
    value: NotificationPreferences[keyof NotificationPreferences]
  ) => void;
  onSave: () => void;
};

export function NotificationsTab({
  prefs,
  loading,
  saving,
  onToggle,
  onSave,
}: NotificationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">Préférences de notification</h3>
          <p className="text-sm text-muted-foreground">
            Choisissez comment nous devons vous informer des événements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email</Label>
                <p className="text-xs text-muted-foreground">
                  Recommandé pour les notifications principales
                </p>
              </div>
              <Switch
                checked={prefs.email_enabled}
                onCheckedChange={(value) =>
                  onToggle("email_enabled", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS</Label>
                <p className="text-xs text-muted-foreground">
                  Notifications par SMS (bientôt)
                </p>
              </div>
              <Switch
                checked={prefs.sms_enabled}
                onCheckedChange={(value) =>
                  onToggle("sms_enabled", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Push</Label>
                <p className="text-xs text-muted-foreground">
                  Notifications push (bientôt)
                </p>
              </div>
              <Switch
                checked={prefs.push_enabled}
                onCheckedChange={(value) =>
                  onToggle("push_enabled", Boolean(value))
                }
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Événements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Nouveau ticket</Label>
                <p className="text-xs text-muted-foreground">
                  Lorsqu’un ticket est créé
                </p>
              </div>
              <Switch
                checked={prefs.new_ticket_created}
                onCheckedChange={(value) =>
                  onToggle("new_ticket_created", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Message reçu</Label>
                <p className="text-xs text-muted-foreground">
                  Nouveau message dans un ticket
                </p>
              </div>
              <Switch
                checked={prefs.ticket_message}
                onCheckedChange={(value) =>
                  onToggle("ticket_message", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Changement de statut</Label>
                <p className="text-xs text-muted-foreground">
                  Le statut du ticket change
                </p>
              </div>
              <Switch
                checked={prefs.ticket_status_changed}
                onCheckedChange={(value) =>
                  onToggle("ticket_status_changed", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Assignation prestataire</Label>
                <p className="text-xs text-muted-foreground">
                  Un ticket vous est assigné (prestataire)
                </p>
              </div>
              <Switch
                checked={prefs.provider_assigned}
                onCheckedChange={(value) =>
                  onToggle("provider_assigned", Boolean(value))
                }
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Paiement reçu</Label>
                <p className="text-xs text-muted-foreground">
                  Confirmation d’un paiement (bailleur)
                </p>
              </div>
              <Switch
                checked={prefs.payment_received}
                onCheckedChange={(value) =>
                  onToggle("payment_received", Boolean(value))
                }
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fréquence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Fréquence d&apos;envoi des emails</Label>
              <Select
                value={prefs.frequency}
                onValueChange={(value: "immediate" | "daily") =>
                  onToggle("frequency", value)
                }
                disabled={loading}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immédiat</SelectItem>
                  <SelectItem value="daily">Digest quotidien</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Immediat : un email par événement. Digest : résumé quotidien
                (à implémenter).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || loading}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
