import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEmergencyState, useDeclareEmergency } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function EmergencyDashboard() {
  const [, navigate] = useLocation();
  const { selected: selectedEcosystem } = useEcosystem();
  const { member } = useAuth();
  const { data, isLoading, error } = useEmergencyState();
  const declareMutation = useDeclareEmergency();
  const { toast } = useToast();

  const [reason, setReason] = useState('');
  const [autoRevertDays, setAutoRevertDays] = useState('7');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!reason.trim()) errs.reason = 'Reason is required';
    if (!autoRevertDays || Number(autoRevertDays) < 1) errs.autoRevertDays = 'Must be at least 1 day';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      reason: reason.trim(),
      auto_revert_days: Number(autoRevertDays),
      declared_by: member?.display_name ?? 'Unknown',
    };
    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      const result = await declareMutation.mutateAsync(payload);
      setReason('');
      setAutoRevertDays('7');
      toast({ title: 'Emergency declared', description: 'The emergency circuit breaker has been activated.' });
      navigate(`/emergency/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  if (isLoading) return <LoadingState message="Loading emergency state..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load emergency state</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const isActive = data?.current?.state === 'open';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Emergency Circuit Breaker</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {isActive ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Emergency Active
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                System Normal
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isActive && data?.current ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Declared By</dt>
                <dd className="font-medium">{data.current.declared_by ?? 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Declared At</dt>
                <dd className="font-medium">{data.current.declared_at ? new Date(data.current.declared_at).toLocaleString() : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="font-medium">{data.current.notes ?? 'No reason provided'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Auto-Revert At</dt>
                <dd className="font-medium">{data.current.auto_revert_at ? new Date(data.current.auto_revert_at).toLocaleString() : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant="destructive">Active</Badge>
                </dd>
              </div>
              <div>
                <Link href={`/emergency/${data.current.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active emergency. The governance system is operating normally.
            </p>
          )}
        </CardContent>
      </Card>

      {!isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Declare Emergency</CardTitle>
          </CardHeader>
          <CardContent>
            {declareMutation.error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                {(declareMutation.error as Error).message}
              </div>
            )}
            <form onSubmit={handleDeclare} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <AITextarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the emergency situation..."
                  rows={4}
                  fieldLabel="Emergency Reason"
                  fieldContext="The reason for declaring an emergency circuit breaker in the governance system"
                />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
              </div>

              <div className="space-y-2 max-w-xs">
                <Label htmlFor="auto_revert_days">Auto-Revert Days *</Label>
                <Input
                  id="auto_revert_days"
                  type="number"
                  min="1"
                  value={autoRevertDays}
                  onChange={(e) => setAutoRevertDays(e.target.value)}
                  required
                  aria-required="true"
                />
                {errors.autoRevertDays && <p className="text-sm text-destructive">{errors.autoRevertDays}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="destructive" disabled={declareMutation.isPending}>
                  {declareMutation.isPending ? 'Declaring...' : 'Declare Emergency'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
