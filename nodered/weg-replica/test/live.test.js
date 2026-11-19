'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { createLiveBridge } = require('../src/live');

function fakeRemote() { const e = new EventEmitter(); e.subs = []; e.subscribe = (t) => e.subs.push(t); return e; }
function fakeLocal() { const e = new EventEmitter(); e.published = []; e.subs = []; e.subscribe = (t) => e.subs.push(t); e.publish = (t, p, o) => e.published.push({ t, p: String(p), o }); return e; }
const quiet = { log() {}, error() {} };

test('subscribes to frio/# on connect and reports live status', () => {
  const remote = fakeRemote(); const statuses = [];
  createLiveBridge({ remote, local: fakeLocal(), onStatus: (s) => statuses.push(s), log: quiet });
  remote.emit('connect');
  assert.deepEqual(remote.subs, ['frio/#']);
  remote.emit('close');
  assert.deepEqual(statuses, [{ live: true }, { live: false }]);
});

test('republishes every message with retain=true, including empty payloads', () => {
  const remote = fakeRemote(); const local = fakeLocal();
  const bridge = createLiveBridge({ remote, local, log: quiet });
  remote.emit('message', 'frio/estado', Buffer.from('{"C4.modo":"AUTOMATICO"}'), { retain: false });
  remote.emit('message', 'frio/latido', Buffer.from(''), { retain: true });
  assert.deepEqual(local.published, [
    { t: 'frio/estado', p: '{"C4.modo":"AUTOMATICO"}', o: { qos: 0, retain: true } },
    { t: 'frio/latido', p: '', o: { qos: 0, retain: true } },
  ]);
  assert.equal(typeof bridge.lastMessageAt(), 'number');
});

test('ignores frio/replica/* to avoid loops', () => {
  const remote = fakeRemote(); const local = fakeLocal();
  createLiveBridge({ remote, local, log: quiet });
  remote.emit('message', 'frio/replica/status', Buffer.from('{}'), {});
  assert.deepEqual(local.published, []);
});

