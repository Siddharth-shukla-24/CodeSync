import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const socket = io(URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
});

export default socket;