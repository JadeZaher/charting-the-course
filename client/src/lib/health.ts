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
