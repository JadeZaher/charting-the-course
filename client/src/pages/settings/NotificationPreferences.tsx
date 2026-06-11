import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/use-governance';
import type { NotificationPreferences } from '@/types/api';
import { Bell, BellRing, Loader2, Save, Undo2 } from 'lucide-react';

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, { label: string; description: string; icon: React.ReactNode }> = {
  agreement_reviews: {
    label: 'Agreement Reviews',
    description: 'When agreements come due for periodic review',
    icon: <BellRing className="h-4 w-4 text-blue-600" />,
  },
  consent_rounds: {
    label: 'Consent Rounds',
    description: 'When proposals enter consent phase requiring your position',
    icon: <BellRing className="h-4 w-4 text-purple-600" />,
  },
  proposal_deadlines: {
    label: 'Proposal Deadlines',
    description: 'When proposal deadlines are approaching or past due',
    icon: <BellRing className="h-4 w-4 text-orange-600" />,
  },
  conflict_updates: {
    label: 'Conflict Updates',
    description: 'When conflict cases you\'re involved in are updated',
    icon: <BellRing className="h-4 w-4 text-red-600" />,
  },
};

const DEFAULT_PREFS: NotificationPreferences = {
  agreement_reviews: true,
  consent_rounds: true,
  proposal_deadlines: true,
  conflict_updates: true,
};

export default function NotificationPreferencesPage() {
  const { data, isLoading, error } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [initialized, setInitialized] = useState(false);

  // Load preferences from server
  if (data && !initialized) {
    const types = data.notification_types;
    setPrefs({
      agreement_reviews: types.agreement_reviews ?? true,
      consent_rounds: types.consent_rounds ?? true,
      proposal_deadlines: types.proposal_deadlines ?? true,
      conflict_updates: types.conflict_updates ?? true,
    });
    setInitialized(true);
  }

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    const types: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(prefs)) {
      types[key] = val;
    }
    await updateMutation.mutateAsync(types);
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFS);
  };

  const hasChanges = initialized && JSON.stringify(prefs) !== JSON.stringify(
    data?.notification_types
      ? {
          agreement_reviews: data.notification_types.agreement_reviews ?? true,
          consent_rounds: data.notification_types.consent_rounds ?? true,
          proposal_deadlines: data.notification_types.proposal_deadlines ?? true,
          conflict_updates: data.notification_types.conflict_updates ?? true,
        }
      : DEFAULT_PREFS
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-destructive">Failed to load notification preferences</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage which governance events trigger push notifications
          </p>
        </div>
      </div>

      {updateMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(updateMutation.error as Error).message}
        </div>
      )}

      {updateMutation.isSuccess && (
        <div className="p-3 rounded-md bg-green-50 text-green-800 text-sm border border-green-200">
          Preferences saved successfully.
        </div>
      )}

      {/* Notification type cards */}
      <div className="space-y-4">
        {(Object.keys(NOTIFICATION_LABELS) as Array<keyof NotificationPreferences>).map((key) => {
          const info = NOTIFICATION_LABELS[key];
          return (
            <Card key={key}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{info.icon}</div>
                  <div>
                    <p className="font-medium">{info.label}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={() => togglePref(key)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state: no subscriptions */}
      {!initialized && (
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No push subscription detected. Notifications require a browser that supports
              Web Push API. Subscribe from your browser settings to enable notifications.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={updateMutation.isPending || !hasChanges}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
          <Undo2 className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
