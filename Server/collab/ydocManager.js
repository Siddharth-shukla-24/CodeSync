const Y = require('yjs');
const mongoose = require('mongoose');
const Room = require('../model/Room');

// Authoritative Y.Doc per room, kept in memory and persisted (debounced) to Mongo.
const docs = new Map();   // roomId -> Y.Doc
const timers = new Map(); // roomId -> persist timeout

const DEFAULT_TEXT = '// Start coding here...\n';

function dbReady() {
  return mongoose.connection.readyState === 1;
}

async function getYDoc(roomId) {
  if (docs.has(roomId)) return docs.get(roomId);

  const doc = new Y.Doc();
  let seeded = false;

  if (dbReady()) {
    try {
      const room = await Room.findOne({ roomId });
      if (room?.ydocState) {
        Y.applyUpdate(doc, new Uint8Array(Buffer.from(room.ydocState, 'base64')));
        seeded = true;
      } else if (room?.lastCode) {
        doc.getText('monaco').insert(0, room.lastCode);
        seeded = true;
      }
    } catch {
      /* fall through to default seed */
    }
  }

  if (!seeded && doc.getText('monaco').length === 0) {
    doc.getText('monaco').insert(0, DEFAULT_TEXT);
  }

  docs.set(roomId, doc);
  return doc;
}

function persist(roomId) {
  if (!dbReady()) return;
  clearTimeout(timers.get(roomId));
  timers.set(roomId, setTimeout(async () => {
    const doc = docs.get(roomId);
    if (!doc) return;
    const ydocState = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    const lastCode = doc.getText('monaco').toString();
    try {
      await Room.findOneAndUpdate({ roomId }, { ydocState, lastCode }, { upsert: true });
    } catch {
      /* best-effort persistence */
    }
  }, 800));
}

// Apply a binary update from a client to the room's authoritative doc.
function applyUpdate(roomId, update) {
  const doc = docs.get(roomId);
  if (!doc) return;
  Y.applyUpdate(doc, new Uint8Array(update));
  persist(roomId);
}

function encodeState(doc) {
  return Y.encodeStateAsUpdate(doc);
}

const cleanupTimers = new Map();

// Persist immediately (used before dropping a room from memory).
async function flushNow(roomId) {
  clearTimeout(timers.get(roomId));
  timers.delete(roomId);
  if (!dbReady()) return;
  const doc = docs.get(roomId);
  if (!doc) return;
  const ydocState = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
  const lastCode = doc.getText('monaco').toString();
  try {
    await Room.findOneAndUpdate({ roomId }, { ydocState, lastCode }, { upsert: true });
  } catch {
    /* best-effort */
  }
}

function cancelCleanup(roomId) {
  const t = cleanupTimers.get(roomId);
  if (t) {
    clearTimeout(t);
    cleanupTimers.delete(roomId);
  }
}

// Free an empty room's in-memory doc after a grace period (cancelled on rejoin),
// flushing latest state first. Prevents unbounded memory growth on churn.
function scheduleCleanup(roomId, isEmpty, delay = Number(process.env.CLEANUP_MS) || 30000) {
  cancelCleanup(roomId);
  const t = setTimeout(async () => {
    cleanupTimers.delete(roomId);
    if (!isEmpty()) return; // someone rejoined during the grace window
    await flushNow(roomId);
    docs.get(roomId)?.destroy();
    docs.delete(roomId);
  }, delay);
  cleanupTimers.set(roomId, t);
}

function stats() {
  return { activeDocs: docs.size, rooms: [...docs.keys()] };
}

module.exports = {
  getYDoc, applyUpdate, encodeState, docs,
  flushNow, cancelCleanup, scheduleCleanup, stats,
};
