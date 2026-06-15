import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username is required';
    else if (username.trim().length < 2) e.username = 'Min 2 characters';
    if (tab === 'join' && !roomId.trim()) e.roomId = 'Room ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300)); // subtle loading feel
    const id = tab === 'create' ? uuidv4() : roomId.trim();
    navigate(`/editor/${id}`, { state: { username: username.trim() } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={s.root}>
      {/* Background grid + blobs */}
      <div style={s.grid} />
      <div style={s.blob1} />
      <div style={s.blob2} />

      <div style={s.layout}>

        {/* ── LEFT: Hero ── */}
        <div style={s.hero}>
          {/* Logo */}
          <div style={s.logoRow}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span style={s.logoText}>CodeSync</span>
          </div>

          {/* Badge */}
          <div style={s.badge}>✦ AI-Powered Collaboration</div>

          {/* Headline */}
          <h1 style={s.headline}>
            Code together.<br />
            <span style={s.accent}>Ship faster.</span>
          </h1>

          <p style={s.sub}>
            A real-time collaborative editor with an AI pair programmer built in.
            Share a room, write code, get instant AI reviews — together.
          </p>

          {/* Feature pills */}
          <div style={s.pills}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ ...s.pill, borderColor: f.color + '40' }}>
                <span style={{ color: f.color }}>{f.icon}</span>
                <span style={s.pillLabel}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={s.proof}>
            <div style={s.proofAvatars}>
              {['S', 'A', 'R', 'M'].map((c, i) => (
                <div key={i} style={{
                  ...s.proofAvatar,
                  backgroundColor: FEATURES[i % FEATURES.length].color,
                  marginLeft: i ? '-6px' : 0,
                }}>
                  {c}
                </div>
              ))}
            </div>
            <span style={s.proofText}>Developers coding right now</span>
          </div>
        </div>

        {/* ── RIGHT: Auth Card ── */}
        <div style={s.card}>

          {/* Tabs */}
          <div style={s.tabs}>
            {['create', 'join'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              >
                {t === 'create' ? '+ New Room' : '→ Join Room'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={s.form}>
            {/* Username */}
            <div style={s.fieldWrap}>
              <label style={s.label}>Your name</label>
              <input
                style={{ ...s.input, ...(errors.username ? s.inputError : {}) }}
                placeholder="e.g. Sid"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                onFocus={e => e.target.style.borderColor = 'var(--brand-500)'}
                onBlur={e => e.target.style.borderColor = errors.username ? 'var(--error)' : 'var(--border-default)'}
              />
              {errors.username && <span style={s.errText}>{errors.username}</span>}
            </div>

            {/* Room ID — only in join tab */}
            {tab === 'join' && (
              <div style={s.fieldWrap}>
                <label style={s.label}>Room ID</label>
                <input
                  style={{ ...s.input, ...(errors.roomId ? s.inputError : {}) }}
                  placeholder="Paste the room ID"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={e => e.target.style.borderColor = 'var(--brand-500)'}
                  onBlur={e => e.target.style.borderColor = errors.roomId ? 'var(--error)' : 'var(--border-default)'}
                />
                {errors.roomId && <span style={s.errText}>{errors.roomId}</span>}
              </div>
            )}

            {/* Submit */}
            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? 'Starting...'
                : tab === 'create' ? '+ Create Room' : '→ Join Room'
              }
            </button>
          </div>

          <p style={s.cardNote}>No sign-up required · Rooms expire after 7 days</p>
        </div>

      </div>
    </div>
  );
}

// ── Data ──
const FEATURES = [
  { icon: '👥', label: 'Real-time sync',      color: '#6366f1' },
  { icon: '🤖', label: 'AI pair programmer',  color: '#ec4899' },
  { icon: '⚡', label: '<100ms latency',       color: '#f59e0b' },
  { icon: '💻', label: '7 languages',          color: '#10b981' },
];

// ── Styles ──
const s = {
  root: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-canvas)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  grid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
  },
  blob1: {
    position: 'absolute', top: '-20%', left: '-10%',
    width: '600px', height: '600px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-20%', right: '-10%',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  layout: {
    display: 'flex',
    alignItems: 'center',
    gap: '72px',
    width: '100%',
    maxWidth: '960px',
    position: 'relative',
    zIndex: 1,
  },

  // Hero
  hero: { flex: 1, display: 'flex', flexDirection: 'column', gap: '22px', minWidth: 0 },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoMark: {
    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
  },
  logoText: { fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' },
  badge: {
    display: 'inline-flex', width: 'fit-content',
    padding: '5px 12px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid rgba(99,102,241,0.35)',
    backgroundColor: 'rgba(99,102,241,0.08)',
    fontSize: '12px', fontWeight: 600,
    color: 'var(--brand-400)', letterSpacing: '0.04em',
  },
  headline: {
    fontSize: 'clamp(30px, 4vw, 46px)',
    fontWeight: 800, lineHeight: 1.15,
    letterSpacing: '-1.5px',
    color: 'var(--text-primary)',
  },
  accent: {
    background: 'linear-gradient(135deg, var(--brand-400), #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: {
    fontSize: '15px', color: 'var(--text-secondary)',
    lineHeight: 1.65, maxWidth: '420px',
  },
  pills: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  pill: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 11px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid',
    backgroundColor: 'rgba(255,255,255,0.03)',
    fontSize: '12px', color: 'var(--text-secondary)',
  },
  pillLabel: { whiteSpace: 'nowrap' },
  proof: { display: 'flex', alignItems: 'center', gap: '10px' },
  proofAvatars: { display: 'flex', alignItems: 'center' },
  proofAvatar: {
    width: 22, height: 22, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, color: '#fff',
    border: '1.5px solid var(--bg-canvas)',
    position: 'relative',
  },
  proofText: { fontSize: '12px', color: 'var(--text-muted)' },

  // Card
  card: {
    width: '380px', flexShrink: 0,
    background: 'rgba(17,17,19,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  tabs: {
    display: 'flex',
    backgroundColor: 'var(--bg-canvas)',
    borderRadius: 'var(--radius-md)',
    padding: '3px', marginBottom: '24px',
    border: '1px solid var(--border-subtle)',
  },
  tab: {
    flex: 1, padding: '8px',
    background: 'none', border: 'none',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', transition: 'all var(--transition)',
    fontFamily: 'var(--font-sans)',
  },
  tabActive: {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize: '11px', fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  input: {
    height: '42px', padding: '0 14px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '14px', outline: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color var(--transition)',
    width: '100%',
  },
  inputError: { borderColor: 'var(--error)' },
  errText: { fontSize: '11px', color: 'var(--error)' },
  btn: {
    height: '44px', marginTop: '4px',
    background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
    color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', width: '100%',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
    transition: 'opacity var(--transition)',
  },
  cardNote: {
    marginTop: '18px', textAlign: 'center',
    fontSize: '11px', color: 'var(--text-muted)',
  },
};