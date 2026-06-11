import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateConflict } from '@/hooks/use-governance';
import type { ConflictDetail } from '@/types/api';
import { Loader2, ClipboardCheck } from 'lucide-react';

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low — Address in normal course' },
  { value: 'standard', label: 'Standard — Address within cycle' },
  { value: 'high', label: 'High — Address this week' },
  { value: 'immediate', label: 'Immediate — Address now' },
];

const SCOPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'domain', label: 'Domain' },
  { value: 'cross-domain', label: 'Cross-Domain' },
  { value: 'ecosystem', label: 'Ecosystem-wide' },
  { value: 'cross-ecosystem', label: 'Cross-Ecosystem' },
];

const TIER_OPTIONS = [
  { value: '1', label: 'Tier 1 — Facilitated conversation' },
  { value: '2', label: 'Tier 2 — Mediation' },
  { value: '3', label: 'Tier 3 — Formal tribunal' },
];

const ROOT_CAUSE_OPTIONS = [
  { value: '', label: 'Not classified' },
  { value: 'communication', label: 'Communication breakdown' },
  { value: 'resource', label: 'Resource contention' },
  { value: 'boundary', label: 'Authority boundary dispute' },
  { value: 'process', label: 'Process violation' },
  { value: 'values', label: 'Values misalignment' },
  { value: 'external', label: 'External pressure' },
];

interface ConflictTriageModalProps {
  conflict: ConflictDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: ConflictDetail) => void;
}

export function ConflictTriageModal({ conflict, open, onOpenChange, onSuccess }: ConflictTriageModalProps) {
  const updateMutation = useUpdateConflict();

  const [severity, setSeverity] = useState(conflict.severity ?? '');
  const [urgency, setUrgency] = useState(conflict.urgency ?? '');
  const [scope, setScope] = useState(conflict.scope ?? '');
  const [tier, setTier] = useState(String(conflict.tier ?? ''));
  const [rootCauseCategory, setRootCauseCategory] = useState(conflict.root_cause_category ?? '');
  const [facilitatorId, setFacilitatorId] = useState('');
  const [triageNotes, setTriageNotes] = useState(conflict.triage_notes ?? '');

  // Sync with conflict data when modal opens
  useEffect(() => {
    if (open) {
      setSeverity(conflict.severity ?? '');
      setUrgency(conflict.urgency ?? '');
      setScope(conflict.scope ?? '');
      setTier(String(conflict.tier ?? ''));
      setRootCauseCategory(conflict.root_cause_category ?? '');
      setTriageNotes(conflict.triage_notes ?? '');
    }
  }, [open, conflict]);

  const hasChanges =
    severity !== (conflict.severity ?? '') ||
    urgency !== (conflict.urgency ?? '') ||
    scope !== (conflict.scope ?? '') ||
    tier !== String(conflict.tier ?? '') ||
    rootCauseCategory !== (conflict.root_cause_category ?? '') ||
    triageNotes !== (conflict.triage_notes ?? '');

  const handleSubmit = async () => {
    const data: Record<string, any> = {
      severity: severity || null,
      urgency: urgency || null,
      scope: scope || null,
      tier: tier ? Number(tier) : null,
      root_cause_category: rootCauseCategory || null,
      triage_notes: triageNotes || null,
    };
    if (facilitatorId.trim()) {
      data.facilitator_id = facilitatorId.trim();
    }

    try {
      const result = await updateMutation.mutateAsync({ id: conflict.id, data });
      onSuccess?.(result);
      onOpenChange(false);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Triage Conflict
          </DialogTitle>
          <DialogDescription>
            Classify and route this conflict case to the appropriate resolution track.
            {conflict.case_id && (
              <span className="block mt-1 text-xs font-mono">{conflict.case_id}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="triage-severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="triage-severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="triage-urgency">Urgency</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger id="triage-urgency">
                <SelectValue placeholder="Select urgency" />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label htmlFor="triage-scope">Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger id="triage-scope">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier */}
          <div className="space-y-2">
            <Label htmlFor="triage-tier">Resolution Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger id="triage-tier">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Root Cause */}
          <div className="space-y-2">
            <Label htmlFor="triage-root-cause">Root Cause Category</Label>
            <Select value={rootCauseCategory} onValueChange={setRootCauseCategory}>
              <SelectTrigger id="triage-root-cause">
                <SelectValue placeholder="Select root cause" />
              </SelectTrigger>
              <SelectContent>
                {ROOT_CAUSE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Facilitator */}
          <div className="space-y-2">
            <Label htmlFor="triage-facilitator">Facilitator (optional)</Label>
            <Input
              id="triage-facilitator"
              value={facilitatorId}
              onChange={(e) => setFacilitatorId(e.target.value)}
              placeholder="Facilitator name or member ID"
            />
          </div>

          {/* Triage Notes */}
          <div className="space-y-2">
            <Label htmlFor="triage-notes">Triage Notes</Label>
            <Textarea
              id="triage-notes"
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              placeholder="Record initial triage assessment, safety concerns, or routing notes..."
              rows={4}
            />
          </div>
        </div>

        {updateMutation.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {(updateMutation.error as Error).message}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending || !hasChanges}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Triage'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
