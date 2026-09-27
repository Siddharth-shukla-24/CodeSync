// Client-side auth state. JWT + minimal user profile live in localStorage;
// the token is attached to REST calls (Authorization header) and the socket.
const TOKEN_KEY = 'codesync_token';
const USER_KEY = 'codesync_user';

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function isAuthed() {
  return !!getToken();
}
