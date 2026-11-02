// Server-sent event framing for the assistant; see client/src/AGENTS.md "Assistant drawer".
export interface ChatStreamEvent { type: string; data: string }

export function createChatStreamParser() {
  let buffer = '';
  let eventType = 'message';
  let data: string[] = [];
  let hasData = false;
  let events: ChatStreamEvent[] = [];

  function dispatch() {
    if (hasData || eventType !== 'message') events.push({ type: eventType, data: data.join('\n') });
    eventType = 'message';
    data = [];
    hasData = false;
  }

  function line(value: string) {
    if (!value) { dispatch(); return; }
    if (value.startsWith(':')) return;
    const colon = value.indexOf(':');
    const field = colon === -1 ? value : value.slice(0, colon);
    const raw = colon === -1 ? '' : value.slice(colon + 1);
    const content = raw.startsWith(' ') ? raw.slice(1) : raw;
    if (field === 'event') eventType = content;
    else if (field === 'data') { hasData = true; data.push(content); }
  }

  function drain(final: boolean): ChatStreamEvent[] {
    events = [];
    for (;;) {
      const match = /[\r\n]/.exec(buffer);
      if (!match) break;
      const at = match.index;
      if (!final && buffer[at] === '\r' && at === buffer.length - 1) break;
      const width = buffer[at] === '\r' && buffer[at + 1] === '\n' ? 2 : 1;
      line(buffer.slice(0, at));
      buffer = buffer.slice(at + width);
    }
    if (final) {
      if (buffer) line(buffer);
      buffer = '';
      dispatch();
    }
    return events;
  }

  return {
    feed(chunk: string) { buffer += chunk; return drain(false); },
    finish(chunk = '') { buffer += chunk; return drain(true); },
  };
}
