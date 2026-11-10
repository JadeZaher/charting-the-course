process.env.TZ = 'America/Los_Angeles';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardAuditLine, dashboardQueue, dashboardQueueCopy, isOlderDashboardItem } from './dashboard-queue';

const NOW = new Date(2026, 10, 10, 12, 0, 0);

test('an active member does not see a finished entry quiz, and orientation stays', () => {
  const items = [
    { uid: 'quiz', kind: 'newcomer', action: 'Start the entry questionnaire', what: 'Finished quiz should stay hidden', link: '/quiz/take/q1' },
    { uid: 'orient', kind: 'newcomer', what: 'Start orientation', link: '/orientation/eco-1' },
    { uid: 'advice', kind: 'proposal', what: 'Give advice', due: '2026-11-20', overdue: false },
  ];
  const view = dashboardQueue(items, NOW, true);
  assert.deepEqual(view.current.map((item) => item.uid), ['orient', 'advice']);
  assert.deepEqual(view.older, []);
  assert.equal(JSON.stringify(view).includes('Finished quiz'), false);
  assert.deepEqual(dashboardQueue(items, NOW, false).current.map((item) => item.uid), ['quiz', 'orient', 'advice']);
});

test('months-overdue work is grouped and not deleted', () => {
  assert.equal(isOlderDashboardItem({ uid: 'a', kind: 'proposal', due: '2026-05-29', overdue: true }, NOW), true);
  assert.equal(isOlderDashboardItem({ uid: 'b', kind: 'proposal', due: '2026-11-01', overdue: true }, NOW), false);
  assert.equal(isOlderDashboardItem({ uid: 'c', kind: 'proposal', due: '2026-01-01', overdue: false }, NOW), false);
  const view = dashboardQueue([
    { uid: 'old', kind: 'proposal', what: 'Advise on the old charter', due: '2026-05-29', overdue: true },
    { uid: 'fresh', kind: 'newcomer', what: 'Start orientation', link: '/orientation/eco-1' },
  ], NOW, true);
  assert.deepEqual(view.current.map((item) => item.uid), ['fresh']);
  assert.deepEqual(view.older.map((item) => item.uid), ['old']);
  assert.equal(view.older[0]?.what, 'Advise on the old charter');
});

test('the dashboard audit line names a steward when the server says it is overdue', () => {
  const format = (date: string) => date;
  assert.equal(dashboardAuditLine('2026-05-29', true, format), 'The next audit was due on 2026-05-29. A steward can update it.');
  assert.equal(dashboardAuditLine('2026-12-01', false, format), 'Next audit due 2026-12-01');
  assert.equal(dashboardAuditLine(null, true, format), 'No audit date yet');
  assert.equal(dashboardQueueCopy.olderItems, 'Older items');
});
