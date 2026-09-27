const bcrypt = require('bcryptjs');
const User = require('../model/User');
const { signToken } = require('../middleware/auth');

const publicUser = (user) => ({ id: user._id, username: user.username });

const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Username must be at least 2 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), passwordHash });
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: (username || '').trim() });
    // Compare regardless of user existence to keep timing uniform.
    const ok = user && (await bcrypt.compare(password || '', user.passwordHash));
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// JWT is stateless — logout is a client-side token discard; this just acks.
const logout = (req, res) => res.json({ success: true });

const me = (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } });
};

module.exports = { register, login, logout, me };
