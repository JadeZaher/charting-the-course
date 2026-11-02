// One form for publishing and editing a share, need or solution (Discover, a domain page, the edit dialog).
import { useId, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldError } from '@/components/FieldError';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { formErrorView, POST_VISIBILITIES, postHref, VISIBILITY_LABELS, visibilityHelp } from '@/lib/exchange';
import { SHARESNEEDS_CATEGORY_OPTIONS, sharesNeedsCategoryLabel } from '@/lib/sharesneeds-vocab';
import type { SharesNeedsType, SharesNeedsVisibility } from '@/types/api';

export interface PostFormValues {
  type: SharesNeedsType;
  title: string;
  description: string;
  category: string;
  capacity: string;
  visibility: SharesNeedsVisibility;
  domainId: string;
}

export interface DomainChoice {
  id: string;
  label: string;
  ecosystemId: string;
}

const TYPE_OPTIONS: Array<{ value: SharesNeedsType; label: string }> = [
  { value: 'share', label: 'Share: something you offer' },
  { value: 'need', label: 'Need: something you are looking for' },
  { value: 'solution', label: 'Solution: an approach others can reuse' },
];

const NO_CATEGORY = 'none';

type FieldName = 'type' | 'title' | 'description' | 'category' | 'capacity' | 'visibility' | 'domain';

interface PostFormProps {
  initial?: Partial<PostFormValues>;
  /** Domains to choose from; omit when the domain is fixed (a domain page, an edit). */
  domainChoices?: DomainChoice[];
  /** Ecosystem of the fixed domain (ignored when `domainChoices` is given). */
  fixedEcosystemId?: string | null;
  /** Names an ecosystem for the visibility help. */
  ecosystemNameFor: (ecosystemId: string | null) => string | null;
  /** The write's failure: shown once, under the field the server named or for the whole form. */
  error: unknown;
  pending: boolean;
  disabled?: boolean;
  submitLabel: (type: SharesNeedsType) => string;
  pendingLabel: string;
  onSubmit: (values: PostFormValues) => void;
  onCancel?: () => void;
}

/** Fields, required-field errors and server errors for a post; the parent runs the write. */
export function PostForm({
  initial, domainChoices, fixedEcosystemId = null, ecosystemNameFor, error, pending, disabled = false,
  submitLabel, pendingLabel, onSubmit, onCancel,
}: PostFormProps) {
  const prefix = useId();
  const id = (name: string) => `${prefix}-${name}`;
  const [values, setValues] = useState<PostFormValues>({
    type: 'share', title: '', description: '', category: '', capacity: '', visibility: 'public', domainId: '', ...initial,
  });
  // Server messages a field shows until the member changes that field.
  const [edited, setEdited] = useState<ReadonlySet<FieldName>>(new Set());
  // A fixed domain validates as filled (see `submit`).
  const required = useRequiredFields({ title: 'Add a title.', domain: 'Choose the domain this belongs to.' });

  const fieldMap = useMemo<Record<string, FieldName>>(() => {
    const map: Record<string, FieldName> = { type: 'type', title: 'title', description: 'description', category: 'category', capacity: 'capacity', visibility: 'visibility' };
    if (domainChoices) Object.assign(map, { domain_id: 'domain', ecosystem_id: 'domain' });
    return map;
  }, [domainChoices]);
  const server = useMemo(() => formErrorView(error, fieldMap), [error, fieldMap]);

  const set = <Key extends keyof PostFormValues>(key: Key, value: PostFormValues[Key], field: FieldName) => {
    setValues((current) => ({ ...current, [key]: value }));
    setEdited((current) => (current.has(field) ? current : new Set(current).add(field)));
  };

  /** The one message a field shows: its required error, else the server's while unedited. */
  const messageFor = (name: FieldName): string | undefined => {
    if (name === 'title' || name === 'domain') {
      const requiredMessage = required.error(name).message;
      if (requiredMessage) return requiredMessage;
    }
    return edited.has(name) ? undefined : server.fields[name];
  };
  const errorIdFor = (name: FieldName) => (name === 'title' || name === 'domain' ? required.error(name).id : id(`${name}-error`));
  /** aria-invalid/aria-describedby for a field, joined with its hint when it has one. */
  const ariaFor = (name: FieldName, hintId?: string) => {
    const message = messageFor(name);
    const describedBy = [message ? errorIdFor(name) : null, hintId ?? null].filter(Boolean).join(' ');
    return { 'aria-invalid': message ? (true as const) : undefined, 'aria-describedby': describedBy || undefined };
  };

  const ecosystemId = domainChoices
    ? domainChoices.find((domain) => domain.id === values.domainId)?.ecosystemId ?? null
    : fixedEcosystemId;
  const ecosystemName = ecosystemNameFor(ecosystemId);
  const categoryKnown = SHARESNEEDS_CATEGORY_OPTIONS.some((option) => option.value === values.category);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    // React submit events bubble through portals; keep this one away from any form around the dialog.
    event.stopPropagation();
    const valid = required.validate({ title: values.title, domain: domainChoices ? values.domainId : 'fixed' });
    if (!valid) return;
    setEdited(new Set());
    onSubmit({ ...values, title: values.title.trim() });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {server.form && (
        <div role="alert" className="space-y-2 border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          <p>{server.form}</p>
          {server.duplicateOf && (
            <Link href={postHref(server.duplicateOf)} className="font-bold underline underline-offset-2">
              Open your existing post
            </Link>
          )}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">What are you posting?</legend>
        <RadioGroup value={values.type} onValueChange={(value) => set('type', value as SharesNeedsType, 'type')} {...ariaFor('type')}>
          {TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem value={option.value} id={id(`type-${option.value}`)} />
              <Label htmlFor={id(`type-${option.value}`)} className="cursor-pointer font-normal">{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <FieldError id={errorIdFor('type')} message={messageFor('type')} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={id('title')}>Title (required)</Label>
        <Input
          id={id('title')}
          {...required.field('title')}
          {...ariaFor('title')}
          value={values.title}
          maxLength={255}
          onChange={(event) => {
            set('title', event.target.value, 'title');
            required.settle('title', event.target.value);
          }}
          placeholder={values.type === 'need' ? 'e.g. Graphic design for our harvest fair' : values.type === 'share' ? 'e.g. Data engineering, 5 hours a week' : 'e.g. A reusable onboarding checklist'}
        />
        <FieldError id={errorIdFor('title')} message={messageFor('title')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id('description')}>Description (optional)</Label>
        <Textarea
          id={id('description')}
          {...ariaFor('description')}
          value={values.description}
          maxLength={20_000}
          rows={4}
          onChange={(event) => set('description', event.target.value, 'description')}
        />
        <FieldError id={errorIdFor('description')} message={messageFor('description')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={id('category')}>Category (optional)</Label>
          <Select value={values.category || NO_CATEGORY} onValueChange={(value) => set('category', value === NO_CATEGORY ? '' : value, 'category')}>
            <SelectTrigger id={id('category')} {...ariaFor('category')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>No category</SelectItem>
              {SHARESNEEDS_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
              {values.category && !categoryKnown && (
                <SelectItem value={values.category}>{sharesNeedsCategoryLabel(values.category)} (old category)</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FieldError id={errorIdFor('category')} message={messageFor('category')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id('capacity')}>Capacity (optional)</Label>
          <Input
            id={id('capacity')}
            {...ariaFor('capacity')}
            value={values.capacity}
            maxLength={100}
            onChange={(event) => set('capacity', event.target.value, 'capacity')}
            placeholder="e.g. 5 hours a week, up to 3 teams"
          />
          <FieldError id={errorIdFor('capacity')} message={messageFor('capacity')} />
        </div>
      </div>

      {domainChoices && (
        <div className="space-y-2">
          <Label htmlFor={id('domain')}>Domain (required)</Label>
          <Select
            value={values.domainId}
            disabled={disabled}
            onValueChange={(value) => {
              set('domainId', value, 'domain');
              required.settle('domain', value);
            }}
          >
            <SelectTrigger id={id('domain')} {...required.field('domain')} {...ariaFor('domain')} aria-required="true">
              <SelectValue placeholder="Choose a domain" />
            </SelectTrigger>
            <SelectContent>
              {domainChoices.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id={errorIdFor('domain')} message={messageFor('domain')} />
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Who can see it?</legend>
        <RadioGroup value={values.visibility} onValueChange={(value) => set('visibility', value as SharesNeedsVisibility, 'visibility')} {...ariaFor('visibility')}>
          {POST_VISIBILITIES.map((visibility) => (
            <div key={visibility} className="flex items-start gap-3">
              <RadioGroupItem value={visibility} id={id(`visibility-${visibility}`)} aria-describedby={id(`visibility-${visibility}-help`)} className="mt-0.5" />
              <div>
                <Label htmlFor={id(`visibility-${visibility}`)} className="cursor-pointer">{VISIBILITY_LABELS[visibility]}</Label>
                <p id={id(`visibility-${visibility}-help`)} className="text-xs text-muted-foreground">
                  {visibilityHelp(visibility, ecosystemName)}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
        <FieldError id={errorIdFor('visibility')} message={messageFor('visibility')} />
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || disabled}>
          {pending ? pendingLabel : submitLabel(values.type)}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
