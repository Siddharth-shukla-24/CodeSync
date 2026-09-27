import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuth } from '../auth';

// Combined login / register. On success stores the JWT + user and returns the
// user to wherever they were headed (ProtectedRoute passes it via state.from).
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

  const submit = async () => {
    setError('');
    if (username.trim().length < 2) return setError('Username must be at least 2 characters');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      setAuth(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.blob1} />

      <div style={s.card}>
        <div style={s.brand}>
          <div style={s.logoMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span style={s.brandText}>CodeSync</span>
        </div>

        <h1 style={s.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p style={s.sub}>
          {mode === 'login' ? 'Log in to your rooms and collaborators.' : 'Sign up to create and join private rooms.'}
        </p>

        <div style={s.tabs}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{ ...s.tab, ...(mode === m ? s.tabActive : {}) }}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div style={s.form}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Username</label>
            <input
              style={s.input}
              placeholder="e.g. sid"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKey}
              autoFocus
            />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
            />
          </div>

          {error && <span style={s.errText}>{error}</span>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>

        <p style={s.switchNote}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span style={s.linkText} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)', overflow: 'hidden', fontFamily: 'var(--font-sans)', padding: '20px' },
  grid: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: '48px 48px' },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none' },

  card: { position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: 'rgba(17,17,19,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  logoMark: { width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  brandText: { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  title: { fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: '0 0 6px' },
  sub: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 22px' },

  tabs: { display: 'flex', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', padding: '3px', marginBottom: '20px', border: '1px solid var(--border-subtle)' },
  tab: { flex: 1, padding: '8px', background: 'none', border: 'none', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  tabActive: { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' },

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { height: '42px', padding: '0 14px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', width: '100%' },
  errText: { fontSize: '12px', color: 'var(--error)' },
  btn: { height: '44px', marginTop: '4px', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  switchNote: { marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' },
  linkText: { color: 'var(--brand-400)', cursor: 'pointer', fontWeight: 600 },
};
