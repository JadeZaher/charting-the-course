// Words for governance health: measured values, bands, trends, audit due dates. Pure; no React.
// See client/src/AGENTS.md "Maintenance and health (G-Maint)".
import type { HealthBand, HealthIndicatorValue, MeasuredUnit } from '@/types/api';

/** "50%", "0.82", "3 cycles", "4 per quarter"; "No data" when nothing was measured. */
export function formatMeasured(value: number | string | null | undefined, unit: MeasuredUnit | null | undefined): string {
  if (value == null || value === '') return 'No data';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  const trimmed = String(Number(number.toFixed(2)));
  switch (unit) {
    case '%': return `${trimmed}%`;
    case 'ratio': return number.toFixed(2);
    case 'cycles': return `${trimmed} ${number === 1 ? 'cycle' : 'cycles'}`;
    case 'per quarter': return `${trimmed} per quarter`;
    default: return trimmed;
  }
}

const BAND_LABELS: Record<HealthBand, string> = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical' };

/** Plain name of a framework band; a missing band reads as "No threshold". */
export function bandLabel(band: HealthBand | null | undefined): string {
  return band ? BAND_LABELS[band] : 'No threshold';
}

const TREND_LABELS: Record<string, string> = {
  improving: 'Improving',
  stable: 'Steady',
  degrading: 'Getting worse',
  baseline: 'First measurement',
};

/** Plain name of a trend since the prior audit; empty when unknown. */
export function trendLabel(trend: string | null | undefined): string {
  return (trend && TREND_LABELS[trend]) || '';
}

/** "Next audit due <date>" or "Next audit overdue since <date>"; the server decides which. No date (an ecosystem with no start date and no audit) says so. */
export function auditDueText(auditDue: string | null, overdue: boolean, format: (date: string) => string): string {
  if (!auditDue) return 'No audit date yet';
  return overdue ? `Next audit overdue since ${format(auditDue)}` : `Next audit due ${format(auditDue)}`;
}

/** Ids of the indicators publishing requires a rating for: computable and measured in the period. */
export function ratingsNeeded(indicators: ReadonlyArray<Pick<HealthIndicatorValue, 'indicator_id' | 'computable' | 'measured_value'>>): string[] {
  return indicators.filter((i) => i.computable && i.measured_value != null).map((i) => i.indicator_id);
}

/** A score as text; null (not measured) never reads as 0 or 100. */
export function scoreText(value: number | null | undefined, suffix = ''): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}${suffix}` : 'Not measured';
}

// Pass 03 (uxqa 03-cross-ecosystem-exchange): audit wording and the publish rule; see client/src/AGENTS.md "Maintenance and health (G-Maint)".

/** An audit's scope as the form offers it. */
export const AUDIT_SCOPE_OPTIONS = [
  { value: 'full', label: 'Full review' },
  { value: 'indicators', label: 'Indicators only' },
  { value: 'capture_risk', label: 'Capture risk' },
] as const;

/** The form's words for a stored scope ("Full review", never "full"); an unknown value reads with spaces. */
export function auditScopeLabel(scope: string | null | undefined): string {
  if (!scope) return '';
  const known = AUDIT_SCOPE_OPTIONS.find((option) => option.value === scope);
  if (known) return known.label;
  const words = scope.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Published" for the server's `completed`; other statuses with spaces. */
export function auditStatusLabel(status: string): string {
  if (status === 'completed') return 'Published';
  if (status === 'draft') return 'Draft (not published)';
  const words = status.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const OVERALL_BANDS: Record<string, { name: string; range: string }> = {
  healthy: { name: 'Healthy', range: '80-100' },
  mixed: { name: 'Mixed', range: '50-79' },
  degrading: { name: 'Weak', range: '25-49' },
  critical: { name: 'Critical', range: '0-24' },
};

/** The band a published overall score falls in ("Weak (score 25-49)"), never a trend word: `degrading` is a score range, not a change. */
export function overallBandName(label: string | null | undefined): string | null {
  if (!label) return null;
  const band = OVERALL_BANDS[label];
  return band ? `${band.name} (score ${band.range})` : label;
}

/** "Overall band: Weak (score 25-49)", for a badge with no column heading beside it. */
export function overallBandText(label: string | null | undefined): string | null {
  const name = overallBandName(label);
  return name ? `Overall band: ${name}` : null;
}

/** The audit period's field error: an end before the start (the server refuses to compute or publish it). */
export function auditPeriodError(start: string, end: string): string | null {
  return start && end && start > end ? 'The period must end on or after the day it starts.' : null;
}

/** Why "Publish" is not offered yet, in one sentence; null when it is. Required ratings are named by the form's names. */
export function auditPublishBlocker(input: { periodError: string | null; missingNames: readonly string[]; ratedCount: number }): string | null {
  if (input.periodError) return 'Fix the audit period before publishing.';
  if (input.missingNames.length > 0) {
    return `Rate every indicator that has data before publishing. Still to rate: ${input.missingNames.join(', ')}.`;
  }
  if (input.ratedCount === 0) return 'Rate at least one indicator before publishing.';
  return null;
}
