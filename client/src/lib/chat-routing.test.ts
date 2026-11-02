import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyChatRoute, chatRouteLabel, conversationLimit, readChatRoute, type ChatRoute } from './chat-routing';
import { createChatStreamParser } from './chat-stream';

test('a direct reply clears the current skill while earlier turns keep their routing evidence', () => {
  const initial: { role: 'user' | 'assistant'; content: string; skill?: string; routing?: ChatRoute }[] = [
    { role: 'assistant' as const, content: 'A proposal needs a change and a reason.', skill: 'proposal-creation' },
    { role: 'user' as const, content: 'Where is my profile?' },
    { role: 'assistant' as const, content: '', skill: 'proposal-creation' },
  ];
  const route: ChatRoute = { mode: 'platform', skill: null, source: 'decision' };
  const parser = createChatStreamParser();
  const [event] = parser.finish('event: skill_route\ndata: ' + JSON.stringify(route));
  const parsed = readChatRoute(JSON.parse(event.data));
  assert.ok(parsed);
  const messages = applyChatRoute(initial, parsed);
  assert.equal(messages[0].skill, 'proposal-creation');
  assert.equal(messages[2].skill, undefined);
  assert.deepEqual(messages[2].routing, route);
  assert.equal(initial[2].skill, 'proposal-creation');
  assert.equal(chatRouteLabel(parsed), 'Platform help');
});

test('skill, framework, general and terminal transitions have readable labels', () => {
  const examples: [ChatRoute, string][] = [
    [{ mode: 'skill', skill: 'proposal-creation', source: 'decision' }, 'Guided process: Proposal creation'],
    [{ mode: 'framework', skill: null, source: 'decision' }, 'Governance guide'],
    [{ mode: 'general', skill: null, source: 'transition' }, 'Process complete'],
    [{ mode: 'general', skill: null, source: 'decision' }, 'General help'],
  ];
  for (const [route, label] of examples) {
    assert.deepEqual(readChatRoute(route), route);
    assert.equal(chatRouteLabel(route), label);
  }
});

test('malformed routing frames cannot select a skill or display protocol payloads', () => {
  for (const value of [null, 'platform', {}, { mode: 'unknown', skill: null, source: 'decision' },
    { mode: 'platform', skill: 'proposal-creation', source: 'decision' },
    { mode: 'skill', skill: null, source: 'decision' },
    { mode: 'skill', skill: '<script>', source: 'decision' },
    { mode: 'framework', skill: null, source: 'invented' }]) assert.equal(readChatRoute(value), null);
});

test('conversation cap counts only user turns and a new conversation restores capacity', () => {
  const messages = Array.from({ length: 20 }, () => [{ role: 'user' }, { role: 'assistant' }]).flat();
  assert.deepEqual(conversationLimit(messages, 20), { userCount: 20, reached: true });
  assert.deepEqual(conversationLimit(messages.slice(0, 38), 20), { userCount: 19, reached: false });
  assert.deepEqual(conversationLimit([], 20), { userCount: 0, reached: false });
});
