import { useState, useRef, useEffect } from 'react';
import { useAIReview } from '../hooks/useAIReview';
import MarkdownRenderer from './MarkdownRenderer';

const TABS = [
  { id: 'review',   label: 'Review',  icon: '🔍', enabled: true  },
  { id: 'explain',  label: 'Explain', icon: '💡', enabled: true  },
  { id: 'bugs',     label: 'Bugs',    icon: '🐛', enabled: false },
  { id: 'refactor', label: 'Suggest', icon: '✨', enabled: false },
];

export default function AIPanel({ code, language, onClose }) {
  const [activeTab, setActiveTab] = useState('review');
  const outputRef  = useRef(null);
  const review     = useAIReview('/ai/review');
  const explain    = useAIReview('/ai/explain');

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [review.output, explain.output]);

  // ── shared renderers ──────────────────────────────────────────
  const renderLoading = () => (
    <div style={s.loadingWrap}>
      <SkeletonLoader />
      <p style={s.loadingText}>Gemini is working...</p>
    </div>
  );

  const renderError = (hook) => (
    <div style={s.errorBox}>
      <span>⚠️</span>
      <p style={s.errorText}>{hook.errorMsg || 'Something went wrong.'}</p>
      <button style={s.retryBtn} onClick={() => hook.runReview(code, language)}>
        Retry
      </button>
    </div>
  );

  const renderOutput = (hook) => (
    <div style={s.outputCard}>
      <div style={s.outputHeader}>
        <span style={s.outputStatus}>
          {hook.status === 'streaming'
            ? <><AnimatedDot /> Streaming...</>
            : <><span style={{ color: 'var(--success)' }}>✓</span> Complete</>}
        </span>
        {hook.status === 'done' && (
          <div style={s.outputActions}>
            <ActionBtn label="⧉ Copy"  onClick={() => navigator.clipboard.writeText(hook.output)} successLabel="✓ Copied" />
            <ActionBtn label="↻ Retry" onClick={hook.regenerate} />
            <ActionBtn label="✕ Clear" onClick={hook.clear} />
          </div>
        )}
      </div>
      <div ref={outputRef} style={s.outputScroll}>
        <MarkdownRenderer content={hook.output} />
        {hook.status === 'streaming' && <span style={s.cursorBlink}>▍</span>}
      </div>
    </div>
  );

  const renderActionRow = (hook, label, runLabel, busyLabel) => (
    <div style={s.actionRow}>
      <button
        style={{ ...s.runBtn, opacity: hook.status === 'loading' || hook.status === 'streaming' ? 0.6 : 1 }}
        onClick={() => hook.runReview(code, language)}
        disabled={hook.status === 'loading' || hook.status === 'streaming'}
      >
        {hook.status === 'loading' || hook.status === 'streaming' ? busyLabel : runLabel}
      </button>
      {(hook.status === 'loading' || hook.status === 'streaming') && (
        <button style={s.cancelBtn} onClick={hook.cancel}>Cancel</button>
      )}
    </div>
  );

  // ── tab body ──────────────────────────────────────────────────
  const renderTab = (hook, mode) => (
    <>
      {renderActionRow(
        hook,
        mode,
        mode === 'review' ? '▶ Run Review' : '▶ Explain Code',
        mode === 'review' ? 'Reviewing...' : 'Explaining...',
      )}
      {hook.status === 'idle'      && <AIOnboardingCard mode={mode} onRun={() => hook.runReview(code, language)} />}
      {hook.status === 'loading'   && renderLoading()}
      {hook.status === 'error'     && renderError(hook)}
      {(hook.status === 'streaming' || hook.status === 'done') && hook.output && renderOutput(hook)}
    </>
  );

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.aiIcon}>✦</span>
          <div>
            <div style={s.title}>AI Assistant</div>
            <div style={s.subtitle}>Powered by Gemini 2.5 Flash</div>
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => t.enabled && setActiveTab(t.id)}
            disabled={!t.enabled}
            style={{
              ...s.tab,
              ...(activeTab === t.id ? s.tabActive : {}),
              ...(t.enabled ? {} : s.tabDisabled),
            }}
          >
            <span>{t.icon}</span>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <span>{t.label}</span>
              {!t.enabled && <span style={s.comingSoonBadge}>Soon</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={s.body}>
        {activeTab === 'review'  && renderTab(review,  'review')}
        {activeTab === 'explain' && renderTab(explain, 'explain')}
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────

function SkeletonLoader() {
  return (
    <div style={s.skeletonWrap}>
      <div style={{ ...s.skeletonLine, width: '60%' }} />
      <div style={{ ...s.skeletonLine, width: '90%' }} />
      <div style={{ ...s.skeletonLine, width: '75%' }} />
      <div style={{ ...s.skeletonLine, width: '85%', marginTop: '10px' }} />
      <div style={{ ...s.skeletonLine, width: '50%' }} />
    </div>
  );
}

function AnimatedDot() {
  return <span style={s.pulseDot} />;
}

function ActionBtn({ label, onClick, successLabel }) {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    await onClick();
    if (successLabel) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <button
      style={{
        ...s.miniBtn,
        ...(showSuccess ? s.miniBtnSuccess : {}),
      }}
      onClick={handleClick}
    >
      {showSuccess ? successLabel : label}
    </button>
  );
}

function AIOnboardingCard({ onRun, mode = 'review' }) {
  const [hovered, setHovered] = useState(null);

  const prompts = mode === 'review'
    ? [
        { label: 'Review current code',          action: onRun,  active: true  },
        { label: 'Check for logic errors',        action: onRun,  active: true  },
        { label: 'Suggest improvements',          action: null,   active: false },
      ]
    : [
        { label: 'Explain current code',          action: onRun,  active: true  },
        { label: 'Break down step by step',       action: onRun,  active: true  },
        { label: 'Identify key concepts',         action: onRun,  active: true  },
      ];

  return (
    <div style={oc.wrap}>
      <div style={oc.header}>
        <span style={oc.sparkle}>✦</span>
        <span style={oc.headerText}>
          {mode === 'review' ? 'AI Code Review' : 'AI Code Explainer'}
        </span>
      </div>
      <p style={oc.desc}>
        {mode === 'review'
          ? 'Get instant feedback on quality, bugs, and complexity.'
          : 'Understand any code in plain language, step by step.'}
      </p>
      <div style={oc.promptList}>
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={p.active ? p.action : undefined}
            disabled={!p.active}
            onMouseEnter={() => p.active && setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...oc.prompt,
              ...(hovered === i ? oc.promptHover : {}),
              ...(!p.active ? oc.promptDisabled : {}),
            }}
          >
            <span style={oc.promptArrow}>{p.active ? '→' : '·'}</span>
            <span>{p.label}</span>
            {!p.active && <span style={oc.soon}>Soon</span>}
          </button>
        ))}
      </div>
      <div style={oc.footer}>
        <span style={oc.footerDot} />
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────

const s = {
  panel: {
    width: '340px', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    backgroundColor: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  aiIcon: { fontSize: '16px', color: 'var(--brand-400)', flexShrink: 0 },
  title: { fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 },
  subtitle: { fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '14px', padding: '4px',
    borderRadius: 'var(--radius-sm)', transition: 'color 150ms ease',
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    padding: '10px 4px',
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'color 150ms ease',
  },
  tabActive: {
    color: 'var(--brand-400)',
    borderBottom: '2px solid var(--brand-500)',
  },
  tabDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  comingSoonBadge: {
    position: 'absolute', top: '-7px', right: '-26px',
    fontSize: '8px', fontWeight: 800,
    color: 'var(--brand-400)',
    backgroundColor: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 'var(--radius-full)',
    padding: '1px 5px',
    letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '12px',
  },
  actionRow: { display: 'flex', gap: '8px' },
  runBtn: {
    flex: 1, height: '36px',
    background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-sans)', transition: 'opacity 150ms ease',
  },
  cancelBtn: {
    padding: '0 14px', height: '36px',
    background: 'var(--bg-overlay)', color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  loadingWrap: { display: 'flex', flexDirection: 'column', gap: '10px' },
  loadingText: { fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 },
  skeletonWrap: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' },
  skeletonLine: {
    height: '12px', borderRadius: '4px',
    backgroundColor: 'var(--bg-overlay)',
    animation: 'shimmer 1.5s ease-in-out infinite',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)',
  },
  errorText: { fontSize: '12px', color: '#f87171', flex: 1 },
  retryBtn: {
    fontSize: '12px', padding: '5px 12px', flexShrink: 0,
    backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)',
    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  outputCard: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    display: 'flex', flexDirection: 'column',
    maxHeight: '420px', overflow: 'hidden',
  },
  outputHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0, flexWrap: 'wrap', gap: '8px',
  },
  outputStatus: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
  },
  outputActions: { display: 'flex', gap: '6px' },
  miniBtn: {
    fontSize: '11px', padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-overlay)', color: 'var(--text-primary)',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
    transition: 'all 150ms ease',
  },
  miniBtnSuccess: { color: '#86efac', borderColor: 'rgba(134,239,172,0.3)' },
  outputScroll: { overflowY: 'auto', padding: '14px', flex: 1 },
  cursorBlink: { color: 'var(--brand-400)', animation: 'blink 1s step-start infinite' },
  pulseDot: {
    width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
    backgroundColor: 'var(--brand-500)',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
};

const oc = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)', marginTop: '4px',
  },
  header: { display: 'flex', alignItems: 'center', gap: '7px' },
  sparkle: { fontSize: '13px', color: 'var(--brand-400)' },
  headerText: { fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' },
  desc: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 },
  promptList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  prompt: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '9px 10px',
    backgroundColor: 'var(--bg-canvas)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)', fontSize: '12px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    fontFamily: 'var(--font-sans)',
    transition: 'all 150ms ease',
    transform: 'translateX(0)',
  },
  promptHover: {
    backgroundColor: 'var(--bg-overlay)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
    transform: 'translateX(3px)',
  },
  promptDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  promptArrow: { color: 'var(--brand-400)', fontSize: '12px', flexShrink: 0 },
  soon: {
    marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-overlay)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-full)',
    padding: '1px 6px', letterSpacing: '0.04em',
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '10px', color: 'var(--text-muted)',
    paddingTop: '10px', borderTop: '1px solid var(--border-subtle)',
  },
  footerDot: {
    width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
    backgroundColor: 'var(--brand-500)',
  },
};