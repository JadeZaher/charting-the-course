import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveInternalPath } from './internal-path';
import { safeRedirect } from './post-login-redirect';

// Every value an attacker can put in ?redirect= or a chat link must stay inside the app.
const OFF_SITE = [
  'https://evil.example',
  '//evil.example',
  '/\\evil.example',
  '/\t/evil.example',
  '/.//evil.example', // dot segments normalise to "//evil.example"
  '/%2e//evil.example',
  '/a/..//evil.example',
  'javascript:alert(1)',
];

test('resolveInternalPath refuses anything that leaves the app', () => {
  for (const value of OFF_SITE) {
    assert.equal(resolveInternalPath(value), undefined, value);
  }
});

test('resolveInternalPath keeps in-app paths with their query and hash', () => {
  assert.equal(resolveInternalPath('/proposals/42?tab=advice#latest'), '/proposals/42?tab=advice#latest');
  assert.equal(resolveInternalPath('/a/../discover'), '/discover');
});

test('safeRedirect lands sign-in on an in-app page, never off-site or back on /login', () => {
  const cases: Array<[string | null, string]> = [
    ['/proposals/42?tab=advice', '/proposals/42?tab=advice'],
    [null, '/dashboard'],
    ['/login', '/dashboard'],
    ['/login?redirect=/me', '/dashboard'],
    ['/loginhelp', '/loginhelp'],
    ...OFF_SITE.map((value): [string, string] => [value, '/dashboard']),
  ];
  for (const [raw, expected] of cases) {
    assert.equal(safeRedirect(raw), expected, String(raw));
  }
});
