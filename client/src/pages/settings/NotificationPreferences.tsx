import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/hooks/use-notifications';
import { Bell, BellOff, Loader2, AlertTriangle } from 'lucide-react';

interface NotificationType {
  id: string;
  label: string;
  description: string;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  {
    id: 'agreement_reviews',
    label: 'Agreement Reviews',
    description: 'When an agreement requires your review or has been updated',
  },
  {
    id: 'consent_rounds',
    label: 'Consent Rounds',
    description: 'When a consent round opens or closes on a proposal',
  },
  {
    id: 'proposal_deadlines',
    label: 'Proposal Deadlines',
    description: 'Reminders when proposal deadlines are approaching',
  },
  {
    id: 'conflict_updates',
    label: 'Conflict Updates',
    description: 'When a conflict you are involved in is updated',
  },
];

export default function NotificationPreferences() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermissionAndSubscribe,
    unsubscribe,
  } = useNotifications();

  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(
    new Set(NOTIFICATION_TYPES.map((t) => t.id))
  );

  const toggleType = (id: string) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await requestPermissionAndSubscribe();
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Manage how and when NEOS notifies you about governance activity.
        </p>
      </div>

      {/* Push toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive push notifications in your browser, even when the app is not open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Push notifications are not supported in this browser.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-toggle" className="text-sm font-medium">
                    {isSubscribed ? 'Enabled' : 'Disabled'}
                  </Label>
                  {permission === 'denied' && (
                    <p className="text-xs text-destructive">
                      Permission denied. Enable notifications in your browser settings.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Switch
                    id="push-toggle"
                    checked={isSubscribed}
                    onCheckedChange={handleTogglePush}
                    disabled={isLoading || permission === 'denied'}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which events you want to be notified about.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type.id} className="flex items-start gap-3">
              <Checkbox
                id={type.id}
                checked={enabledTypes.has(type.id)}
                onCheckedChange={() => toggleType(type.id)}
                disabled={!isSubscribed || !isSupported}
                className="mt-0.5"
              />
              <div className="space-y-0.5 leading-none">
                <Label
                  htmlFor={type.id}
                  className={`text-sm font-medium cursor-pointer ${
                    !isSubscribed || !isSupported ? 'text-muted-foreground' : ''
                  }`}
                >
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            </div>
          ))}

          {isSubscribed && (
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => {
                  // Preferences are local for now; a real impl would POST to backend
                }}
              >
                Save Preferences
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
