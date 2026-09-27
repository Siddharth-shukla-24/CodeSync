const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
console.log("Gemini key exists:", !!process.env.GEMINI_API_KEY);

const roomRoutes = require('./routes/roomRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const Room = require('./model/Room');
const { roleFor } = require('./controllers/roomController');
const { verifyToken } = require('./middleware/auth');
const { getYDoc, applyUpdate, encodeState, cancelCleanup, scheduleCleanup, stats } = require('./collab/ydocManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(cors());

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MONGODB connected'))
    .catch((err) => console.log('Error:', err));
} else {
  console.log('MONGO_URI not set — running without persistence');
}

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Test/ops introspection for in-memory CRDT docs (disabled by default).
if (process.env.ENABLE_DEBUG === '1') {
  app.get('/debug/docs', (req, res) => res.json(stats()));
}

app.use('/auth', authRoutes);
app.use('/room', roomRoutes);
app.use('/ai', aiRoutes);

const roomUsers = {};

// Socket.IO authentication: every connection must present a valid JWT.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const payload = verifyToken(token);
    socket.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log('user connected', socket.id, socket.user.username);
  socket.data.joinedRooms = new Set();
  socket.data.pendingUpdates = new Map();

  socket.on('join-room', async ({ roomId }) => {
    // Identity comes from the verified token, never the client payload.
    const username = socket.user.username;

    // Access control: if the room is persisted, require owner/member role.
    if (mongoose.connection.readyState === 1) {
      const room = await Room.findOne({ roomId });
      if (room && !roleFor(room, socket.user.id)) {
        return socket.emit('access-denied', { roomId, message: 'You do not have access to this room' });
      }
    }

    // Load the authoritative document before this socket can send or receive
    // room updates, preventing bootstrap updates from racing initialization.
    const doc = await getYDoc(roomId);
    const pendingUpdates = socket.data.pendingUpdates.get(roomId) || [];
    for (const update of pendingUpdates) applyUpdate(roomId, update);
    socket.data.pendingUpdates.delete(roomId);
    socket.join(roomId);
    socket.data.joinedRooms.add(roomId);
    cancelCleanup(roomId); // rejoin: abort any pending cleanup for this room

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    if (!roomUsers[roomId].some(u => u.socketId === socket.id)) {
      roomUsers[roomId].push({ socketId: socket.id, username });
    }

    socket.to(roomId).emit('user-joined', { username });
    io.to(roomId).emit('room-users', roomUsers[roomId].map(u => u.username));

    // Push the authoritative CRDT state to the newly joined client.
    socket.emit('yjs-sync-state', encodeState(doc));

    console.log(`${username} joined room ${roomId}`);
  });

  // Client requests a fresh full-state sync (initial load / reconnect resync).
  socket.on('yjs-sync-request', async ({ roomId }) => {
    const doc = await getYDoc(roomId);
    socket.emit('yjs-sync-state', encodeState(doc));
    for (const update of pendingUpdates) socket.to(roomId).emit('yjs-update', update);
  });

  // Binary CRDT update from a client: apply to authoritative doc, then relay.
  // Ensures the doc exists first so updates that race ahead of join aren't lost.
  socket.on('yjs-update', async ({ roomId, update }) => {
    if (!socket.data.joinedRooms.has(roomId)) {
      const pending = socket.data.pendingUpdates.get(roomId) || [];
      pending.push(update);
      socket.data.pendingUpdates.set(roomId, pending);
      return;
    }
    await getYDoc(roomId);
    applyUpdate(roomId, update);
    socket.to(roomId).emit('yjs-update', update);
  });

  socket.on('language-change', ({ roomId, language }) => {
    socket.to(roomId).emit('language-update', { language });
  });

  socket.on('send-message', ({ roomId, message, time }) => {
    socket.to(roomId).emit('chat-message', { username: socket.user.username, message, time });
  });

  socket.on('disconnect', () => {
    socket.data.joinedRooms.clear();
    for (const roomId in roomUsers) {
      const user = roomUsers[roomId].find(u => u.socketId === socket.id);
      if (user) {
        socket.to(roomId).emit('user-left', { username: user.username });
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
        io.to(roomId).emit('room-users', roomUsers[roomId].map(u => u.username));
        if (roomUsers[roomId].length === 0) {
          delete roomUsers[roomId];
          scheduleCleanup(roomId, () => !roomUsers[roomId] || roomUsers[roomId].length === 0);
        }
      }
    }
    console.log('user disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});