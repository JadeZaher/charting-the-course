import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChatStreamParser } from './chat-stream';

const stream = ': keepalive\r\nevent: skill_route\r\ndata: {"mode":"platform","skill":null,"source":"decision"}\r\n\r\n'
  + 'event: append\r\ndata: Hello\r\ndata: world\r\n\r\nevent: done\r\ndata:\r\n\r\n';
const expected = [
  { type: 'skill_route', data: '{"mode":"platform","skill":null,"source":"decision"}' },
  { type: 'append', data: 'Hello\nworld' },
  { type: 'done', data: '' },
];

test('assistant SSE framing survives every CRLF and data boundary split, including empty done', () => {
  for (let at = 0; at <= stream.length; at++) {
    const parser = createChatStreamParser();
    assert.deepEqual([...parser.feed(stream.slice(0, at)), ...parser.feed(stream.slice(at)), ...parser.finish()], expected, `split ${at}`);
  }
});

test('a final frame is flushed without a trailing blank line and UTF-8 can span chunks', () => {
  const bytes = new TextEncoder().encode('event: append\ndata: Café 🌱');
  for (let at = 0; at <= bytes.length; at++) {
    const parser = createChatStreamParser();
    const decoder = new TextDecoder();
    const events = [...parser.feed(decoder.decode(bytes.slice(0, at), { stream: true })),
      ...parser.feed(decoder.decode(bytes.slice(at), { stream: true })), ...parser.finish(decoder.decode())];
    assert.deepEqual(events, [{ type: 'append', data: 'Café 🌱' }], `byte split ${at}`);
  }
});

test('LF, lone CR, comments and optional field spaces do not corrupt event contents', () => {
  const parser = createChatStreamParser();
  assert.deepEqual([...parser.feed('id: x\nretry: 50\n: comment\nevent:append\ndata: leading space stays\ndata:  two\n\nevent:done\r\r'), ...parser.finish()], [
    { type: 'append', data: 'leading space stays\n two' }, { type: 'done', data: '' },
  ]);
});
