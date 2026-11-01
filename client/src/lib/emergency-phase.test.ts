import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emergencyBanner, emergencyLogLabel, type BannerSource } from './emergency-phase';

const day = (iso: string) => iso.slice(0, 10);
const base: BannerSource = {
  id: 'em-1',
  phase: 'open',
  ecosystem_name: 'Delta',
  cosign_deadline: '2026-11-02T10:00:00',
  authority_ends_at: '2026-11-07T10:00:00',
  review_due_at: '2026-12-01T10:00:00',
  review_overdue: false,
  caller_is_steward: false,
  caller_can_cosign: false,
};

test('the banner names the phase, the date that matters and the next action for each live emergency', () => {
  const cases: Array<[change: Partial<BannerSource>, expected: { tone: string; title: string; action: string } | null]> = [
    [{ phase: 'pending', caller_can_cosign: true }, { tone: 'notice', title: 'Emergency declared in Delta: waiting for a co-signer', action: 'Review and co-sign' }],
    [{ phase: 'pending' }, { tone: 'notice', title: 'Emergency declared in Delta: waiting for a co-signer', action: 'View declaration' }],
    [{ phase: 'open' }, { tone: 'critical', title: 'Emergency in effect in Delta', action: 'View emergency' }],
    [{ phase: 'recovery' }, { tone: 'notice', title: 'Delta is in Recovery: review due 2026-12-01', action: 'Open Recovery' }],
    // Overdue is a steward's alarm; members keep seeing the due date.
    [{ phase: 'recovery', review_overdue: true, caller_is_steward: true }, { tone: 'critical', title: 'Recovery review overdue in Delta', action: 'Open Recovery' }],
    [{ phase: 'recovery', review_overdue: true }, { tone: 'notice', title: 'Delta is in Recovery: review due 2026-12-01', action: 'Open Recovery' }],
    [{ phase: 'closed' }, null],
    [{ phase: 'withdrawn' }, null],
  ];
  for (const [change, expected] of cases) {
    const banner = emergencyBanner({ ...base, ...change }, day);
    assert.deepEqual(banner && { tone: banner.tone, title: banner.title, action: banner.action }, expected, JSON.stringify(change));
    if (banner) assert.equal(banner.href, '/emergency/em-1');
  }
});

test('the banner gives the co-sign deadline and the authority end date', () => {
  assert.match(emergencyBanner({ ...base, phase: 'pending' }, day)!.detail, /by 2026-11-02/);
  assert.match(emergencyBanner({ ...base, phase: 'open' }, day)!.detail, /by 2026-11-07/);
});

test('log entries read as what happened, including why Recovery started', () => {
  assert.equal(emergencyLogLabel({ action: 'half_open_transition', trigger: 'auto_revert_timer' }), 'Timer ran out: Recovery started');
  assert.equal(emergencyLogLabel({ action: 'half_open_transition', trigger: 'manual_resolve' }), 'Ended early: Recovery started');
  assert.equal(emergencyLogLabel({ action: 'review_recorded', outcome: 'complete' }), 'Post-emergency review complete');
  assert.equal(emergencyLogLabel({ action: 'review_recorded', outcome: 'scheduled' }), 'Post-emergency review scheduled');
  assert.equal(emergencyLogLabel({ action: 'something_new' }), 'something new');
});
