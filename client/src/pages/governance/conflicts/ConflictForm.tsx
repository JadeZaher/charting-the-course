import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateConflict } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ArrowLeft } from 'lucide-react';

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'immediate', label: 'Immediate' },
];

export default function ConflictForm() {
  const [, navigate] = useLocation();
  const { selected: selectedEcosystem } = useEcosystem();
  const createMutation = useCreateConflict();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [urgency, setUrgency] = useState('');
  const [domain, setDomain] = useState('');
  const [scope, setScope] = useState('');
  const [safetyFlag, setSafetyFlag] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!severity) errs.severity = 'Severity is required';
    if (!urgency) errs.urgency = 'Urgency is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      severity,
      urgency,
      domain: domain || null,
      scope: scope || null,
      safety_flag: safetyFlag,
    };

    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast({ title: 'Conflict reported', description: 'Your conflict report has been submitted successfully.' });
      navigate(`/conflicts/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/conflicts">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Conflicts
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">Report Conflict</h1>

      {createMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(createMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Conflict title"
                required
                aria-required="true"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <AITextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the conflict..."
                rows={6}
                fieldLabel="Conflict Description"
                fieldContext="A detailed description of a governance conflict or dispute within the organization"
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.severity && <p className="text-sm text-destructive">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.urgency && <p className="text-sm text-destructive">{errors.urgency}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Affected domain"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scope">Scope</Label>
                <Input
                  id="scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Conflict scope"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="safety_flag"
                checked={safetyFlag}
                onChange={(e) => setSafetyFlag(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="safety_flag" className="font-normal">
                Safety concern (requires immediate attention)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Report Conflict'}
              </Button>
              <Link href="/conflicts">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
