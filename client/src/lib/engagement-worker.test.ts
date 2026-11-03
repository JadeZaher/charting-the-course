import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const worker = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
function harness() {
  const handlers: Record<string, (event: any) => void> = {};
  const shown: { title: string; options: any }[] = [];
  const opened: string[] = [];
  const origin = 'https://neos.example';
  const self = {
    location: { origin }, addEventListener: (name: string, handler: (event: any) => void) => { handlers[name] = handler; },
    registration: { showNotification: async (title: string, options: any) => { shown.push({ title, options }); } },
    clients: { matchAll: async () => [], openWindow: async (url: string) => { opened.push(url); }, claim: async () => {} },
    skipWaiting: async () => {},
  };
  runInNewContext(worker, { self, URL });
  return { handlers, shown, opened };
}
test('push previews never expose incoming private body or title', async () => {
  const h = harness();
  let completed: Promise<unknown> = Promise.resolve();
  h.handlers.push({ data: { json: () => ({ title: 'Private conversation', body: 'Secret message', url: '/updates' }) }, waitUntil: (promise: Promise<unknown>) => { completed = promise; } });
  await completed;
  assert.equal(h.shown[0].title, 'NEOS update');
  assert.equal(h.shown[0].options.body, 'There is a new update in your communities.');
  assert.equal(h.shown[0].options.icon, '/favicon.svg');
});
test('notification clicks reject external and normalized protocol-relative targets', async () => {
  for (const url of ['https://evil.example', '//evil.example', '/.//evil.example', '/\\evil.example', 'javascript:alert(1)']) {
    const h = harness();
    let completed: Promise<unknown> = Promise.resolve();
    h.handlers.notificationclick({ notification: { data: { url }, close() {} }, waitUntil: (promise: Promise<unknown>) => { completed = promise; } });
    await completed;
    assert.equal(h.opened[0], 'https://neos.example/updates');
  }
});
test('notification clicks retain safe internal deep links', async () => {
  const h = harness();
  let completed: Promise<unknown> = Promise.resolve();
  h.handlers.notificationclick({ notification: { data: { url: '/proposals/one?from=update' }, close() {} }, waitUntil: (promise: Promise<unknown>) => { completed = promise; } });
  await completed;
  assert.equal(h.opened[0], 'https://neos.example/proposals/one?from=update');
});
