// Emergency phase words for the all-member banner, badges and the activity log.
// See pages/governance/AGENTS.md "Emergency and exit"; the server decides phase and dates.

export type EmergencyPhaseName = 'pending' | 'open' | 'recovery' | 'closed' | 'withdrawn';

const PHASE_LABELS: Record<EmergencyPhaseName, string> = {
  pending: 'Waiting for a co-signer',
  open: 'Emergency in effect',
  recovery: 'Recovery',
  closed: 'Closed',
  withdrawn: 'Withdrawn',
};

/** Badge text for a phase; unknown values read as their raw name. */
export function emergencyPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase as EmergencyPhaseName] ?? phase;
}

export interface BannerSource {
  id: string;
  phase: string;
  ecosystem_name: string | null;
  cosign_deadline: string | null;
  authority_ends_at: string | null;
  review_due_at: string | null;
  review_overdue: boolean;
  caller_is_steward: boolean;
  caller_can_cosign: boolean;
}

export interface BannerCopy {
  tone: 'critical' | 'notice';
  title: string;
  detail: string;
  action: string;
  href: string;
}

/** What the layout banner says about one live emergency; null when nothing is live. */
export function emergencyBanner(source: BannerSource, formatDate: (iso: string) => string): BannerCopy | null {
  const where = source.ecosystem_name ?? 'your ecosystem';
  const href = `/emergency/${source.id}`;
  const date = (iso: string | null) => (iso ? formatDate(iso) : 'soon');
  switch (source.phase) {
    case 'pending':
      return {
        tone: 'notice',
        title: `Emergency declared in ${where}: waiting for a co-signer`,
        detail: source.caller_can_cosign
          ? `If you agree it is an emergency, co-sign by ${date(source.cosign_deadline)}. Nothing changes until someone does.`
          : `It opens only if a second member co-signs by ${date(source.cosign_deadline)}.`,
        action: source.caller_can_cosign ? 'Review and co-sign' : 'View declaration',
        href,
      };
    case 'open':
      return {
        tone: 'critical',
        title: `Emergency in effect in ${where}`,
        detail: `Emergency authority ends automatically by ${date(source.authority_ends_at)}.`,
        action: 'View emergency',
        href,
      };
    case 'recovery':
      if (source.review_overdue && source.caller_is_steward) {
        return {
          tone: 'critical',
          title: `Recovery review overdue in ${where}`,
          detail: `The post-emergency review was due ${date(source.review_due_at)}. Recovery stays open until it is recorded.`,
          action: 'Open Recovery',
          href,
        };
      }
      return {
        tone: 'notice',
        title: `${where} is in Recovery: review due ${date(source.review_due_at)}`,
        detail: 'Emergency authority has ended. Decisions made during the emergency are being reviewed.',
        action: 'Open Recovery',
        href,
      };
    default:
      return null;
  }
}

const LOG_LABELS: Record<string, string> = {
  declared: 'Declared, waiting for a co-signer',
  co_signed: 'Co-signed: emergency authority started',
  withdrawn: 'Withdrawn before anyone co-signed',
  expired: 'Lapsed: nobody co-signed in time',
  recovery_completed: 'Recovery closed',
};

/** Plain words for one actions-log entry. */
export function emergencyLogLabel(entry: { action: string; trigger?: string; outcome?: string }): string {
  if (entry.action === 'half_open_transition') {
    return entry.trigger === 'auto_revert_timer' ? 'Timer ran out: Recovery started' : 'Ended early: Recovery started';
  }
  if (entry.action === 'review_recorded') {
    return entry.outcome === 'complete' ? 'Post-emergency review complete' : 'Post-emergency review scheduled';
  }
  return LOG_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ');
}
