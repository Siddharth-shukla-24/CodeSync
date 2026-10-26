// M4 performance benchmark: drives the REAL server over authenticated Socket.IO
// with the real binary-Yjs protocol (join-room + yjs-update + yjs-sync-state).
// Measures concurrent users, edit-propagation latency (p50/p95/p99), throughput
// (ingress edits/s + egress deliveries/s), and reconnect success/latency.
//
// Reproducible + tunable via env (defaults in CONFIG). All numbers are computed
// from real socket events — nothing is synthesized. Clients share this process,
// so send/receive timestamps use one monotonic clock (perf_hooks.performance).
//
// Run: npm run bench:perf   (optionally BENCH_USERS_PER_ROOM=20 BENCH_ROOMS=10 ...)
const { spawn } = require('child_process');
const path = require('path');
const { performance } = require('perf_hooks');
const { io } = require('socket.io-client');
const Y = require('yjs');
const jwt = require('jsonwebtoken');

const SECRET = 'bench-secret';
const PORT = 3014;
const URL = `http://localhost:${PORT}`;

const CONFIG = {
  rooms: Number(process.env.BENCH_ROOMS) || 5,
  usersPerRoom: Number(process.env.BENCH_USERS_PER_ROOM) || 10,
  durationMs: Number(process.env.BENCH_DURATION_MS) || 8000,
  editIntervalMs: Number(process.env.BENCH_EDIT_INTERVAL_MS) || 100,
  reconnects: process.env.BENCH_RECONNECTS !== undefined ? Number(process.env.BENCH_RECONNECTS) : 10,
  warmupMs: Number(process.env.BENCH_WARMUP_MS) || 500,
  drainMs: Number(process.env.BENCH_DRAIN_MS) || 1000,
};
const TOTAL_USERS = CONFIG.rooms * CONFIG.usersPerRoom;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(cond, timeout = 8000, step = 25) {
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

// nearest-rank percentile over an array of numbers.
function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * s.length));
  return s[rank - 1];
}
// max via reduce (avoids Math.max(...arr) arg-count overflow on large samples).
const maxOf = (arr) => arr.reduce((m, v) => (v > m ? v : m), 0);
const round = (n, d = 2) => Number(n.toFixed(d));

// Shared across all clients (one process): edit send-times keyed by "sid:seq".
const sendTimes = new Map();
const MARKER = /@@B:(\d+):(\d+)@@/g;

// Global counters, gated by `counting` to a clean steady-state window.
let counting = false;
let sent = 0;        // client->server edits emitted
let delivered = 0;   // server->client relayed updates received (fan-out)
const latencies = []; // ms, one sample per (edit, receiving peer)

function makeClient(sid, roomId, name) {
  const socket = io(URL, {
    transports: ['websocket'],
    reconnection: false, // reconnect is driven explicitly in the reconnect phase
    auth: { token: jwt.sign({ id: name, username: name }, SECRET) },
  });
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('monaco');
  const client = { sid, roomId, name, socket, ydoc, ytext, seq: 0, synced: false, errored: false };

  // Local edits (origin 'edit') are sent; relayed/sync applies are not re-emitted.
  ydoc.on('update', (u, origin) => {
    if (origin !== 'edit') return;
    socket.emit('yjs-update', { roomId, update: u });
    if (counting) sent++;
  });
  socket.on('yjs-update', (d) => {
    if (counting) delivered++;
    Y.applyUpdate(ydoc, new Uint8Array(d), 'relay');
  });
  socket.on('yjs-sync-state', (d) => {
    Y.applyUpdate(ydoc, new Uint8Array(d), 'sync');
    client.synced = true;
  });
  socket.on('connect_error', () => { client.errored = true; });

  // Measure latency only for relayed peer edits during the counting window;
  // ignore full-state syncs (initial join + reconnect resync) via tx origin.
  ytext.observe((event, tr) => {
    if (tr.origin !== 'relay' || !counting) return;
    for (const op of event.changes.delta) {
      if (typeof op.insert !== 'string') continue;
      let m;
      MARKER.lastIndex = 0;
      while ((m = MARKER.exec(op.insert))) {
        const t = sendTimes.get(`${m[1]}:${m[2]}`);
        if (t !== undefined) latencies.push(performance.now() - t);
      }
    }
  });

  const onConnect = () => {
    client.synced = false;
    socket.emit('join-room', { roomId });
  };
  socket.on('connect', onConnect);
  if (socket.connected) onConnect();
  return client;
}

// One edit: append a compact marker; record send-time for latency attribution.
function doEdit(c) {
  const seq = c.seq++;
  sendTimes.set(`${c.sid}:${seq}`, performance.now());
  c.ydoc.transact(() => c.ytext.insert(c.ytext.length, `@@B:${c.sid}:${seq}@@`), 'edit');
}

(async () => {
  const server = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    // No DB: skips room-access lookups so any authed socket can join (JWT still required).
    env: { ...process.env, PORT: String(PORT), MONGO_URI: '', JWT_SECRET: SECRET },
    stdio: ['ignore', 'ignore', 'inherit'], // suppress server stdout; keep stderr for real errors
  });
  await waitForServer();

  console.log('=== M4 Socket.IO performance benchmark ===');
  console.log(`config: ${CONFIG.rooms} rooms x ${CONFIG.usersPerRoom} users = ${TOTAL_USERS} concurrent clients`);
  console.log(`        ${CONFIG.durationMs}ms window, edit every ${CONFIG.editIntervalMs}ms/user, ${CONFIG.reconnects} reconnects\n`);

  // --- Ramp up: connect all clients and gate on join+initial sync. ---
  const rampStart = performance.now();
  const clients = [];
  let sidCounter = 0;
  for (let r = 0; r < CONFIG.rooms; r++) {
    const roomId = `bench-r${r}-${Date.now()}`;
    for (let u = 0; u < CONFIG.usersPerRoom; u++) {
      clients.push(makeClient(sidCounter, roomId, `u${sidCounter}`));
      sidCounter++;
    }
  }
  await until(() => clients.every((c) => c.socket.connected), 20000);
  const connected = clients.filter((c) => c.socket.connected).length;
  await until(() => clients.every((c) => c.synced), 20000);
  const synced = clients.filter((c) => c.synced).length;
  const rampMs = performance.now() - rampStart;
  console.log(`ramp-up:  ${connected}/${TOTAL_USERS} connected, ${synced}/${TOTAL_USERS} initial-synced in ${round(rampMs)}ms`);

  // --- Steady-state load: every user edits at a fixed interval. ---
  const timers = clients.map((c) => setInterval(() => doEdit(c), CONFIG.editIntervalMs));
  await wait(CONFIG.warmupMs);   // let the pipeline fill before measuring
  counting = true;
  const winStart = performance.now();
  await wait(CONFIG.durationMs);
  counting = false;
  const winSec = (performance.now() - winStart) / 1000;
  timers.forEach(clearInterval);
  await wait(CONFIG.drainMs);    // let in-flight updates settle (not counted)

  const ingress = sent / winSec;              // edits/s accepted by server
  const egress = delivered / winSec;          // relayed updates/s delivered to peers
  console.log('\nthroughput:');
  console.log(`  ingress (edits sent):        ${round(ingress, 1)} /s   (${sent} in ${round(winSec)}s)`);
  console.log(`  egress  (updates delivered): ${round(egress, 1)} /s   (${delivered} in ${round(winSec)}s)`);
  console.log('latency (edit -> peer receive):');
  console.log(`  samples: ${latencies.length}`);
  console.log(`  p50: ${round(pct(latencies, 50))}ms   p95: ${round(pct(latencies, 95))}ms   p99: ${round(pct(latencies, 99))}ms   max: ${round(maxOf(latencies))}ms`);

  // --- Reconnect phase: force reconnect on a subset, measure recovery. ---
  const k = Math.min(CONFIG.reconnects, clients.length);
  const reconnectMs = [];
  let reconnected = 0;
  for (let i = 0; i < k; i++) {
    const c = clients[i];
    const t0 = performance.now();
    c.socket.disconnect();
    await until(() => !c.socket.connected, 5000);
    c.synced = false;
    c.socket.connect();
    const ok = await until(() => c.socket.connected && c.synced, 8000);
    if (ok) { reconnected++; reconnectMs.push(performance.now() - t0); }
  }
  console.log('\nreconnect:');
  console.log(`  success: ${reconnected}/${k}`);
  if (reconnectMs.length) {
    console.log(`  reconnect+resync latency  p50: ${round(pct(reconnectMs, 50))}ms   p95: ${round(pct(reconnectMs, 95))}ms   max: ${round(maxOf(reconnectMs))}ms`);
  }

  clients.forEach((c) => c.socket.close());
  server.kill();

  // Run-validity gate (not a performance grade): the benchmark is meaningful only
  // if every client connected+synced, measurements were captured, and reconnects recovered.
  const checks = [
    ['all clients connected', connected === TOTAL_USERS],
    ['all clients initial-synced', synced === TOTAL_USERS],
    ['edits were emitted', sent > 0],
    ['updates were delivered', delivered > 0],
    ['latency samples captured', latencies.length > 0],
    ['reconnects recovered', reconnected === k],
  ];
  console.log('\nvalidity:');
  for (const [label, ok] of checks) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  const valid = checks.every(([, ok]) => ok);
  console.log(`\n${valid ? 'PASS' : 'FAIL'}`);
  process.exit(valid ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
