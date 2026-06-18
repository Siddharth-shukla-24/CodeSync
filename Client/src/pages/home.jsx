import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('create');
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
    await new Promise(r => setTimeout(r, 300));
    const id = tab === 'create' ? uuidv4() : roomId.trim();
    navigate(`/editor/${id}`, { state: { username: username.trim() } });
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.blob1} />
      <div style={s.blob2} />

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.logoMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span style={s.navLogoText}>CodeSync</span>
        </div>
        <a href="#features" style={s.navLink}>Features</a>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.badge}>✦ AI-Powered Collaboration</div>

        <h1 style={s.headline}>
          Code together.<br />
          <span style={s.accent}>Ship faster.</span>
        </h1>

        <p style={s.sub}>
          A real-time collaborative editor with an AI pair programmer built in.
          Share a room, write code, get instant AI reviews — together.
        </p>

        <div style={s.heroCtas}>
          <button style={s.ctaPrimary} onClick={() => document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' })}>
            Start Coding Free →
          </button>
          <a href="#features" style={s.ctaGhost}>See Features</a>
        </div>

        {/* PRODUCT MOCKUP */}
        <div style={s.mockupWrap}>
          <div style={s.mockup}>
            <div style={s.mockupBar}>
              <div style={s.mockupDots}>
                <span style={{ ...s.dot, background: '#ef4444' }} />
                <span style={{ ...s.dot, background: '#f59e0b' }} />
                <span style={{ ...s.dot, background: '#22c55e' }} />
              </div>
              <span style={s.mockupRoomId}>room-7f3a91...</span>
              <div style={s.mockupAvatars}>
                {['S', 'A', 'R'].map((c, i) => (
                  <div key={i} style={{ ...s.mockupAvatar, background: ['#6366f1','#ec4899','#10b981'][i], marginLeft: i ? '-6px' : 0 }}>{c}</div>
                ))}
              </div>
            </div>
            <div style={s.mockupBody}>
              <div style={s.mockupCode}>
                <div style={s.codeLine}><span style={s.kw}>function</span> <span style={s.fn}>reviewPR</span>() {'{'}</div>
                <div style={s.codeLine}>&nbsp;&nbsp;<span style={s.kw}>const</span> result = ai.analyze(code);</div>
                <div style={s.codeLine}>&nbsp;&nbsp;<span style={s.kw}>return</span> result.suggestions;</div>
                <div style={s.codeLine}>{'}'}</div>
                <div style={s.cursorLine}>
                  <span style={s.liveCursor} />
                  <span style={s.cursorLabel}>Aman is typing...</span>
                </div>
              </div>
              <div style={s.mockupAiPanel}>
                <div style={s.aiPanelHeader}>✦ AI Review</div>
                <div style={s.aiPanelLine}>✓ No critical issues found</div>
                <div style={s.aiPanelLine}>💡 Consider memoizing this call</div>
                <div style={s.aiPanelLine}>⚡ O(n) complexity — looks good</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTH CARD */}
      <section id="start" style={s.startSection}>
        <div style={s.card}>
          <div style={s.tabs}>
            {['create', 'join'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); }}
                style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
                {t === 'create' ? '+ New Room' : '→ Join Room'}
              </button>
            ))}
          </div>
          <div style={s.form}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Your name</label>
              <input style={{ ...s.input, ...(errors.username ? s.inputError : {}) }}
                placeholder="e.g. Sid" value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown} autoFocus
                onFocus={e => e.target.style.borderColor = 'var(--brand-500)'}
                onBlur={e => e.target.style.borderColor = errors.username ? 'var(--error)' : 'var(--border-default)'} />
              {errors.username && <span style={s.errText}>{errors.username}</span>}
            </div>
            {tab === 'join' && (
              <div style={s.fieldWrap}>
                <label style={s.label}>Room ID</label>
                <input style={{ ...s.input, ...(errors.roomId ? s.inputError : {}) }}
                  placeholder="Paste the room ID" value={roomId} onChange={e => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={e => e.target.style.borderColor = 'var(--brand-500)'}
                  onBlur={e => e.target.style.borderColor = errors.roomId ? 'var(--error)' : 'var(--border-default)'} />
                {errors.roomId && <span style={s.errText}>{errors.roomId}</span>}
              </div>
            )}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Starting...' : tab === 'create' ? '+ Create Room' : '→ Join Room'}
            </button>
          </div>
          <p style={s.cardNote}>No sign-up required · Rooms expire after 7 days</p>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" style={s.featuresSection}>
        <h2 style={s.featuresTitle}>Everything you need to ship together</h2>
        <div style={s.featureGrid}>
          {FEATURES_FULL.map(f => (
            <div key={f.title} style={s.featureCard}
              onMouseEnter={e => e.currentTarget.style.borderColor = f.color + '50'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
              <div style={{ ...s.featureIconBox, background: f.color + '15', color: f.color }}>{f.icon}</div>
              <h3 style={s.featureCardTitle}>{f.title}</h3>
              <p style={s.featureCardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={s.statsSection}>
        <div style={s.statsGrid}>
          {STATS.map(st => (
            <div key={st.label} style={s.statBox}>
              <div style={s.statNum}>{st.num}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerLeft}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span style={s.footerText}>CodeSync — Built for developers who ship together.</span>
        </div>
        <span style={s.footerText}>© 2026 CodeSync</span>
      </footer>
    </div>
  );
}

const FEATURES_FULL = [
  { icon: '👥', title: 'Real-time collaboration', desc: 'Multiple developers editing the same file with <100ms sync latency.', color: '#6366f1' },
  { icon: '🔍', title: 'AI Code Review', desc: 'Gemini-powered streaming reviews — bugs, complexity, and suggestions instantly.', color: '#ec4899' },
  { icon: '🐛', title: 'AI Bug Detection', desc: 'Catch issues before you commit, surfaced inline in the editor.', color: '#f59e0b' },
  { icon: '💻', title: 'Multi-language support', desc: 'JavaScript, Python, C++, Java, and more — out of the box.', color: '#10b981' },
  { icon: '🔒', title: 'Secure room sharing', desc: 'Private rooms with unique IDs. No accounts, no friction.', color: '#3b82f6' },
  { icon: '⚡', title: 'Instant sync', desc: 'WebSocket-powered code and chat sync across every collaborator.', color: '#8b5cf6' },
];

const STATS = [
  { num: '<100ms', label: 'Sync latency' },
  { num: '7+', label: 'Languages supported' },
  { num: '95%', label: 'Fewer DB writes (debounced)' },
  { num: '24/7', label: 'Live AI assistant' },
];

const s = {
  page: { position: 'relative', backgroundColor: 'var(--bg-canvas)', overflow: 'hidden', minHeight: '100vh', fontFamily: 'var(--font-sans)' },
  grid: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`, backgroundSize: '48px 48px' },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'absolute', top: '20%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', pointerEvents: 'none' },

  nav: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(20px, 5vw, 64px)', maxWidth: '1280px', margin: '0 auto' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoMark: { width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  navLogoText: { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  navLink: { fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' },

  hero: { position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: 'clamp(40px,8vh,80px) clamp(20px,5vw,40px) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '22px' },
  badge: { display: 'inline-flex', padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(99,102,241,0.35)', backgroundColor: 'rgba(99,102,241,0.08)', fontSize: '12px', fontWeight: 600, color: 'var(--brand-400)', letterSpacing: '0.04em' },
  headline: { fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', color: 'var(--text-primary)' },
  accent: { background: 'linear-gradient(135deg, var(--brand-400), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  sub: { fontSize: 'clamp(14px,1.6vw,16px)', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '540px' },
  heroCtas: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' },
  ctaPrimary: { padding: '13px 26px', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.35)', fontFamily: 'var(--font-sans)', transition: 'transform 150ms ease' },
  ctaGhost: { padding: '13px 26px', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' },

  mockupWrap: { width: '100%', maxWidth: '820px', marginTop: '32px', padding: '0 8px' },
  mockup: { borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', overflow: 'hidden' },
  mockupBar: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' },
  mockupDots: { display: 'flex', gap: '6px' },
  dot: { width: 9, height: 9, borderRadius: '50%' },
  mockupRoomId: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flex: 1, textAlign: 'center' },
  mockupAvatars: { display: 'flex' },
  mockupAvatar: { width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', border: '1.5px solid var(--bg-elevated)' },
  mockupBody: { display: 'flex', minHeight: '220px' },
  mockupCode: { flex: 1.4, padding: '18px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.8, color: 'var(--text-secondary)', textAlign: 'left', borderRight: '1px solid var(--border-subtle)' },
  kw: { color: '#c084fc' },
  fn: { color: '#60a5fa' },
  codeLine: {},
  cursorLine: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' },
  liveCursor: { width: '2px', height: '14px', backgroundColor: '#ec4899', display: 'inline-block', animation: 'blink 1s step-start infinite' },
  cursorLabel: { fontSize: '11px', color: '#ec4899', fontFamily: 'var(--font-sans)' },
  mockupAiPanel: { flex: 1, padding: '18px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' },
  aiPanelHeader: { fontSize: '12px', fontWeight: 700, color: 'var(--brand-400)', marginBottom: '4px' },
  aiPanelLine: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 },

  startSection: { position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', padding: 'clamp(48px,8vh,90px) 20px' },
  card: { width: '100%', maxWidth: '380px', background: 'rgba(17,17,19,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
  tabs: { display: 'flex', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', padding: '3px', marginBottom: '24px', border: '1px solid var(--border-subtle)' },
  tab: { flex: 1, padding: '8px', background: 'none', border: 'none', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  tabActive: { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { height: '42px', padding: '0 14px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)', width: '100%' },
  inputError: { borderColor: 'var(--error)' },
  errText: { fontSize: '11px', color: 'var(--error)' },
  btn: { height: '44px', marginTop: '4px', background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: '100%', fontFamily: 'var(--font-sans)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  cardNote: { marginTop: '18px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' },

  featuresSection: { position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(20px,5vw,40px) clamp(60px,8vh,100px)' },
  featuresTitle: { fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '40px', letterSpacing: '-1px' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' },
  featureCard: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '22px', transition: 'border-color 200ms ease, transform 200ms ease' },
  featureIconBox: { width: '40px', height: '40px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' },
  featureCardTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' },
  featureCardDesc: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 },

  statsSection: { position: 'relative', zIndex: 1, borderTop: '1px solid var(--border-subtle)', padding: 'clamp(40px,6vh,60px) 20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' },
  statBox: { display: 'flex', flexDirection: 'column', gap: '6px' },
  statNum: { fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, color: 'var(--brand-400)' },
  statLabel: { fontSize: '12px', color: 'var(--text-muted)' },

  footer: { position: 'relative', zIndex: 1, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', padding: '24px clamp(20px,5vw,40px)' },
  footerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  footerText: { fontSize: '12px', color: 'var(--text-muted)' },
};