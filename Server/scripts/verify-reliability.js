// Integration checks for M2 reliability: reconnect/resync, offline-edit merge,
// duplicate/stale updates, disconnect/rejoin race, and empty-room cleanup.
// Runs the real server (no DB) with debug introspection + short cleanup grace.
const { spawn } = require('child_process');
const path = require('path');
const { io } = require('socket.io-client');
const Y = require('yjs');
const jwt = require('jsonwebtoken');

const SECRET = 'test-secret';
const PORT = 3012;
const URL = `http://localhost:${PORT}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function until(cond, timeout = 5000, step = 25) {
  const s = Date.now();
  while (Date.now() - s < timeout) {
    if (cond()) return true;
    await wait(step);
  }
  return cond();
}
async function waitForServer(t = 15000) {
  const s = Date.now();
  while (Date.now() - s < t) {
    try {
      const r = await fetch(`${URL}/health`);
      if (r.ok) return;
    } catch { /* not up */ }
    await wait(150);
  }
  throw new Error('server did not start');
}
async function getDocs() {
  const r = await fetch(`${URL}/debug/docs`);
  return r.json();
}

// Mirrors the app's reconnect behavior: rejoin + push local state on every connect.
function makeClient(roomId, name) {
  const socket = io(URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 200,
    auth: { token: jwt.sign({ id: name, username: name }, SECRET) },
  });
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('monaco');
  ydoc.on('update', (u, o) => {
    if (o === 'remote') return;
    socket.emit('yjs-update', { roomId, update: u });
  });
  socket.on('yjs-update', (d) => Y.applyUpdate(ydoc, new Uint8Array(d), 'remote'));
  socket.on('yjs-sync-state', (d) => Y.applyUpdate(ydoc, new Uint8Array(d), 'remote'));
  const onConnect = () => {
    socket.emit('join-room', { roomId, username: name });
    socket.emit('yjs-update', { roomId, update: Y.encodeStateAsUpdate(ydoc) });
  };
  socket.on('connect', onConnect);
  if (socket.connected) onConnect();
  return { socket, ydoc, ytext, name };
}
const setText = (c, s) =>
  c.ydoc.transact(() => {
    c.ytext.delete(0, c.ytext.length);
    c.ytext.insert(0, s);
  });

const results = [];
const check = (label, ok) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
};

(async () => {
  const server = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), MONGO_URI: '', ENABLE_DEBUG: '1', CLEANUP_MS: '600', JWT_SECRET: SECRET },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  await waitForServer();

  // 1) Reconnect resync: server retains state across a client's reconnect.
  const R1 = 'rel-' + Date.now();
  const a = makeClient(R1, 'A');
  await until(() => a.socket.connected);
  await wait(200);
  setText(a, 'hello');
  await wait(200);
  a.socket.disconnect();
  await until(() => !a.socket.connected);
  a.socket.connect();
  await until(() => a.socket.connected);
  await wait(300);
  const b = makeClient(R1, 'B'); // fresh peer joins after A reconnected
  check('reconnect: server retains state, new peer resyncs', await until(() => b.ytext.toString() === 'hello', 4000));

  // 2) Offline edits merge on reconnect (bidirectional).
  a.socket.disconnect();
  await until(() => !a.socket.connected);
  setText(a, 'hello world'); // edited while offline
  a.socket.connect();
  await until(() => a.socket.connected);
  check('offline edits propagate to peer after reconnect', await until(() => b.ytext.toString() === 'hello world', 4000));

  // 3) Duplicate/stale updates are idempotent.
  setText(a, 'X');
  await until(() => b.ytext.toString() === 'X', 4000);
  const dup = Y.encodeStateAsUpdate(a.ydoc);
  for (let i = 0; i < 3; i++) a.socket.emit('yjs-update', { roomId: R1, update: dup });
  await wait(400);
  check('duplicate updates do not corrupt/duplicate content', a.ytext.toString() === 'X' && b.ytext.toString() === 'X');

  // 4) Cleanup: empty room frees its in-memory doc after the grace period.
  const R2 = 'rel2-' + Date.now();
  const c = makeClient(R2, 'C');
  await until(() => c.socket.connected);
  await wait(200);
  setText(c, 'temp');
  await wait(200);
  const before = await getDocs();
  c.socket.disconnect();
  await wait(1200); // > CLEANUP_MS (600)
  const after = await getDocs();
  check('empty room doc cleaned up after grace', before.rooms.includes(R2) && !after.rooms.includes(R2));

  // 5) Rejoin within grace cancels cleanup (no premature drop / data loss).
  const R3 = 'rel3-' + Date.now();
  const d = makeClient(R3, 'D');
  await until(() => d.socket.connected);
  await wait(200);
  setText(d, 'keep');
  await wait(200);
  d.socket.disconnect();
  await wait(150); // within grace
  const e = makeClient(R3, 'E'); // rejoin should cancel cleanup
  await until(() => e.socket.connected);
  check('rejoin within grace preserves doc', await until(() => e.ytext.toString() === 'keep', 4000));

  [a, b, c, d, e].forEach((x) => x.socket.close());
  server.kill();
  const ok = results.every(Boolean);
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
