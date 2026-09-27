// Integration check for M1: proves concurrent edits over the real Socket.IO
// transport converge to an identical document (CRDT conflict resolution).
// Deterministic: gates on server /health, socket connect, and initial sync,
// then polls until convergence instead of relying on fixed sleeps.
const { spawn } = require('child_process');
const path = require('path');
const { io } = require('socket.io-client');
const Y = require('yjs');
const jwt = require('jsonwebtoken');

const SECRET = 'test-secret';
const PORT = 3011;
const URL = `http://localhost:${PORT}`;
const ROOM = 'verify-' + Date.now();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function until(cond, timeout = 5000, step = 25) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (cond()) return true;
    await wait(step);
  }
  return cond();
}

async function waitForServer(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const r = await fetch(`${URL}/health`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await wait(150);
  }
  throw new Error('server did not start in time');
}

function makeClient(name) {
  const socket = io(URL, {
    transports: ['websocket'],
    auth: { token: jwt.sign({ id: name, username: name }, SECRET) },
  });
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('monaco');

  ydoc.on('update', (update, origin) => {
    if (origin === 'remote') return;
    socket.emit('yjs-update', { roomId: ROOM, update });
  });
  socket.on('yjs-update', (d) => Y.applyUpdate(ydoc, new Uint8Array(d), 'remote'));

  let resolveSync;
  const synced = new Promise((res) => (resolveSync = res));
  socket.on('yjs-sync-state', (d) => {
    Y.applyUpdate(ydoc, new Uint8Array(d), 'remote');
    resolveSync();
  });

  const connected = new Promise((res) => {
    if (socket.connected) return res();
    socket.once('connect', res);
  });

  return { name, socket, ydoc, ytext, connected, synced };
}

(async () => {
  const server = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), MONGO_URI: '', JWT_SECRET: SECRET },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  await waitForServer();

  const a = makeClient('A');
  const b = makeClient('B');
  await Promise.all([a.connected, b.connected]);

  a.socket.emit('join-room', { roomId: ROOM, username: 'A' });
  b.socket.emit('join-room', { roomId: ROOM, username: 'B' });
  await Promise.all([a.synced, b.synced]); // both hold authoritative state

  // Normalize both to a shared empty base.
  a.ydoc.transact(() => a.ytext.delete(0, a.ytext.length));
  await until(() => a.ytext.length === 0 && b.ytext.length === 0);

  // Diverge: each edits its local copy before the other's ops arrive.
  a.ytext.insert(0, 'AAAA');
  b.ytext.insert(b.ytext.length, 'BBBB');
  a.ytext.insert(0, 'aa');
  b.ytext.insert(b.ytext.length, 'bb');

  await until(() => a.ytext.toString() === b.ytext.toString() && a.ytext.length > 0);

  const ta = a.ytext.toString();
  const tb = b.ytext.toString();
  const converged = ta === tb;
  const hasBoth = ta.includes('AAAA') && ta.includes('BBBB');

  console.log('A:', JSON.stringify(ta));
  console.log('B:', JSON.stringify(tb));
  console.log('converged:', converged, '| both edits present:', hasBoth);

  a.socket.close();
  b.socket.close();
  server.kill();
  const ok = converged && hasBoth;
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
