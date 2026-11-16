import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectionPhase, connectionStatusLabel, connectionStatusTone, type ConnectionPhase } from './connection-status';

test('the first attempt reads Connecting until it opens or fails', () => {
  let phase: ConnectionPhase = 'connecting';
  assert.equal(connectionStatusLabel(phase), 'Connecting…');
  assert.equal(connectionStatusTone(phase), 'neutral');
  phase = connectionPhase(phase, 'start');
  assert.equal(phase, 'connecting');
  assert.notEqual(connectionStatusLabel(phase), 'Disconnected');
  assert.notEqual(connectionStatusTone(phase), 'danger');

  assert.equal(connectionPhase('connecting', 'open'), 'connected');
  assert.equal(connectionStatusLabel('connected'), 'Connected');
  assert.equal(connectionStatusTone('connected'), 'success');

  assert.equal(connectionPhase('connecting', 'failure'), 'disconnected');
  assert.equal(connectionStatusLabel('disconnected'), 'Disconnected');
  assert.equal(connectionStatusTone('disconnected'), 'danger');
});

test('a drop is Disconnected, and a retry stays Disconnected until the socket opens', () => {
  const dropped = connectionPhase('connected', 'failure');
  assert.equal(dropped, 'disconnected');
  assert.equal(connectionPhase(dropped, 'start'), 'disconnected');
  assert.equal(connectionPhase('disconnected', 'open'), 'connected');
});
