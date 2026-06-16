import { useState } from 'react';
import { useAIReview } from '../hooks/useAIReview';

const TABS = [
  { id: 'review',   label: 'Review',   icon: '🔍', enabled: true },
  { id: 'explain',  label: 'Explain',  icon: '💡', enabled: false },
  { id: 'bugs',     label: 'Bugs',     icon: '🐛', enabled: false },
  { id: 'refactor', label: 'Suggest',  icon: '✨', enabled: false },
];

export default function AIPanel({ code, language, onClose }) {
  const [activeTab, setActiveTab] = useState('review');
  const { output, status, errorMsg, runReview, cancel } = useAIReview();

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.aiIcon}>✦</span>
          <span style={s.title}>AI Assistant</span>
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
            title={t.enabled ? '' : 'Coming soon'}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Body — Review tab content */}
      <div style={s.body}>
        {activeTab === 'review' && (
          <>
            {/* Action bar */}
            <div style={s.actionRow}>
              <button
                style={{ ...s.runBtn, opacity: status === 'loading' || status === 'streaming' ? 0.6 : 1 }}
                onClick={() => runReview(code, language)}
                disabled={status === 'loading' || status === 'streaming'}
              >
                {status === 'loading' || status === 'streaming' ? 'Reviewing...' : '▶ Run Review'}
              </button>
              {(status === 'loading' || status === 'streaming') && (
                <button style={s.cancelBtn} onClick={cancel}>Cancel</button>
              )}
            </div>

            {/* Empty state */}
            {status === 'idle' && (
              <div style={s.emptyState}>
                <span style={{ fontSize: '28px' }}>🔍</span>
                <p style={s.emptyText}>Click "Run Review" to get AI feedback on your current code.</p>
              </div>
            )}

            {/* Loading state (before first token arrives) */}
            {status === 'loading' && (
              <div style={s.emptyState}>
                <Spinner />
                <p style={s.emptyText}>Sending code to Gemini...</p>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div style={s.errorBox}>
                <span>⚠️</span>
                <p style={s.errorText}>{errorMsg || 'Something went wrong.'}</p>
              </div>
            )}

            {/* Streaming / done output */}
            {(status === 'streaming' || status === 'done') && output && (
              <div style={s.outputBox}>
                <pre style={s.outputText}>{output}</pre>
                {status === 'streaming' && <span style={s.cursorBlink}>▍</span>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="var(--border-default)" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--brand-500)" strokeWidth="3" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

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
    padding: '0 14px', height: '44px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  aiIcon: { fontSize: '14px', color: 'var(--brand-400)' },
  title: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '14px',
  },
  tabs: {
    display: 'flex', borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  tab: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
    padding: '10px 4px',
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  tabActive: {
    color: 'var(--brand-400)',
    borderBottom: '2px solid var(--brand-500)',
  },
  tabDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  body: { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' },
  actionRow: { display: 'flex', gap: '8px' },
  runBtn: {
    flex: 1, height: '36px',
    background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  cancelBtn: {
    padding: '0 14px', height: '36px',
    background: 'var(--bg-overlay)', color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
    fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '10px', padding: '40px 16px', textAlign: 'center',
  },
  emptyText: { fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px', backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)',
  },
  errorText: { fontSize: '12px', color: '#f87171' },
  outputBox: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
  },
  outputText: {
    fontSize: '12.5px', color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', lineHeight: 1.6, margin: 0,
  },
  cursorBlink: { color: 'var(--brand-400)', animation: 'blink 1s step-start infinite' },
};