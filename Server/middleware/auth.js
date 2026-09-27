const jwt = require('jsonwebtoken');

// A single shared secret drives both REST and Socket.IO auth. Verification is
// stateless (no DB hit), so tokens work even when persistence is disabled.
const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const EXPIRES_IN = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired
}

// Express middleware: require a valid `Authorization: Bearer <token>`.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { signToken, verifyToken, requireAuth, SECRET };
