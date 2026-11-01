import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signupEcosystemId } from './signup-ecosystem';

// The raw window.location.search a sign-up link opens Login with; register sends what this returns as ecosystem_id.
const garden = '3f2b8c1e-6d4a-4b7e-9a1c-2e5f8d0b7c64';
const commons = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

test('a sign-up link places the newcomer in the ecosystem it names, and junk names none', () => {
  const cases: Array<[moment: string, search: string, expected: string | null]> = [
    ['explicit id', `?ecosystem=${garden}`, garden],
    ['explicit id, upper case', `?ecosystem=${garden.toUpperCase()}`, garden],
    ['from the ethos page it was sent to', `?redirect=${encodeURIComponent(`/ethos/${garden}`)}`, garden],
    ['from an orientation journey', `?redirect=${encodeURIComponent(`/orientation/${garden}/journey?step=2`)}`, garden],
    ['explicit id wins over the redirect', `?ecosystem=${commons}&redirect=${encodeURIComponent(`/ethos/${garden}`)}`, commons],
    ['junk id falls back to the redirect', `?ecosystem=garden&redirect=${encodeURIComponent(`/ethos/${garden}`)}`, garden],
    ['junk id', '?ecosystem=%27%3Bdrop', null],
    ['an ethos slug is not an id', `?redirect=${encodeURIComponent('/ethos/omnione')}`, null],
    ['another page with an id in it', `?redirect=${encodeURIComponent(`/proposals/${garden}`)}`, null],
    ['an id hidden deeper in the path', `?redirect=${encodeURIComponent(`/ethos/x/${garden}`)}`, null],
    ['nothing', '', null],
  ];
  for (const [moment, search, expected] of cases) assert.equal(signupEcosystemId(search), expected, moment);
});
