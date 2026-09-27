// Integration checks for M3 auth + authorization against the real server with a
// real (in-memory) MongoDB. Covers register/login, bcrypt, JWT, protected REST,
// authenticated Socket.IO, token identity, and room ownership/access control.
const { spawn } = require('child_process');
const path = require('path');
const { io } = require('socket.io-client');

const PORT = 3013;
const URL = `http://localhost:${PORT}`;
const SECRET = 'auth-test-secret';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(t = 20000) {
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

async function api(method, pathname, { token, body } = {}) {
  const res = await fetch(`${URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

function socketConnect(token) {
  return new Promise((resolve) => {
    const s = io(URL, { transports: ['websocket'], reconnection: false, auth: token ? { token } : {} });
    s.on('connect', () => resolve({ ok: true, socket: s }));
    s.on('connect_error', (e) => { s.close(); resolve({ ok: false, error: e.message }); });
  });
}

const results = [];
const check = (label, ok) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); };

(async () => {
  let mongo;
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }
  const server = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    env: { ...process.env, PORT: String(PORT), MONGO_URI: uri, JWT_SECRET: SECRET, ENABLE_DEBUG: '1' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  await waitForServer();

  // --- Registration & login (bcrypt + JWT) ---
  const reg = await api('POST', '/auth/register', { body: { username: 'alice', password: 'secret123' } });
  check('register → 201 + token', reg.status === 201 && !!reg.data.token);
  const aliceToken = reg.data.token;

  check('duplicate username rejected (409)',
    (await api('POST', '/auth/register', { body: { username: 'alice', password: 'secret123' } })).status === 409);
  check('short password rejected (400)',
    (await api('POST', '/auth/register', { body: { username: 'zoe', password: '123' } })).status === 400);
  check('login wrong password → 401',
    (await api('POST', '/auth/login', { body: { username: 'alice', password: 'nope' } })).status === 401);
  const login = await api('POST', '/auth/login', { body: { username: 'alice', password: 'secret123' } });
  check('login correct password → 200 + token', login.status === 200 && !!login.data.token);

  // --- Protected REST ---
  check('/auth/me without token → 401', (await api('GET', '/auth/me')).status === 401);
  const me = await api('GET', '/auth/me', { token: aliceToken });
  check('/auth/me with token → 200 + identity', me.status === 200 && me.data.user.username === 'alice');
  check('room API without token → 401', (await api('GET', '/room/anything')).status === 401);

  // --- Ownership & access control ---
  const ROOM = 'room-' + Date.now();
  const enter1 = await api('POST', '/room/enter', { token: aliceToken, body: { roomId: ROOM } });
  check('owner creates room (201, role=owner)', enter1.status === 201 && enter1.data.role === 'owner');

  const bobToken = (await api('POST', '/auth/register', { body: { username: 'bob', password: 'secret123' } })).data.token;
  const enter2 = await api('POST', '/room/enter', { token: bobToken, body: { roomId: ROOM } });
  check('second user joins as member', enter2.status === 200 && enter2.data.role === 'member');

  const carolToken = (await api('POST', '/auth/register', { body: { username: 'carol', password: 'secret123' } })).data.token;
  check('non-member denied room read (403)', (await api('GET', `/room/${ROOM}`, { token: carolToken })).status === 403);
  check('member allowed room read (200)', (await api('GET', `/room/${ROOM}`, { token: bobToken })).status === 200);
  check('non-owner cannot delete (403)', (await api('DELETE', `/room/${ROOM}`, { token: bobToken })).status === 403);
  check('owner can delete (200)', (await api('DELETE', `/room/${ROOM}`, { token: aliceToken })).status === 200);

  // --- Authenticated Socket.IO ---
  check('socket without token rejected', (await socketConnect(null)).ok === false);
  check('socket with invalid token rejected', (await socketConnect('garbage.token')).ok === false);
  const good = await socketConnect(aliceToken);
  check('socket with valid token connects', good.ok === true);
  good.socket?.close();

  // --- Socket authorization + non-spoofable identity ---
  const ROOM2 = 'room2-' + Date.now();
  await api('POST', '/room/enter', { token: aliceToken, body: { roomId: ROOM2 } }); // alice owns

  const cs = io(URL, { transports: ['websocket'], reconnection: false, auth: { token: carolToken } });
  await new Promise((r) => cs.on('connect', r));
  const denied = await new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    cs.on('access-denied', () => fin(true));
    cs.on('room-users', () => fin(false));
    cs.emit('join-room', { roomId: ROOM2 });
    setTimeout(() => fin(false), 2500);
  });
  check('non-member denied socket join', denied === true);
  cs.close();

  const as = io(URL, { transports: ['websocket'], reconnection: false, auth: { token: aliceToken } });
  await new Promise((r) => as.on('connect', r));
  const usersList = await new Promise((resolve) => {
    as.on('room-users', (list) => resolve(list));
    as.emit('join-room', { roomId: ROOM2, username: 'HACKER' }); // spoof attempt
    setTimeout(() => resolve([]), 2500);
  });
  check('token identity used, client username ignored', usersList.includes('alice') && !usersList.includes('HACKER'));
  as.close();

  server.kill();
  if (mongo) await mongo.stop();
  const ok = results.every(Boolean);
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
