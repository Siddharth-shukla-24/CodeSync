import { io } from 'socket.io-client';
import { getToken } from './auth';

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Not auto-connected: the editor calls socket.connect() once authenticated.
// `auth` is a function so the current JWT is read fresh on every (re)connect.
const socket = io(URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  auth: (cb) => cb({ token: getToken() }),
});

export default socket;
