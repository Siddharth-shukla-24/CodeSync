import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useState } from 'react';
// Custom theme built from your existing CSS variables
// Can't use var() inside a JS object that react-syntax-highlighter reads,
// so we use the actual hex values from your token sheet.
const codeTheme = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12.5px',
    lineHeight: '1.65',
  },
  'pre[class*="language-"]': {
    margin: 0,
    padding: '0',
    background: 'transparent',
    overflow: 'auto',
  },
  'comment':          { color: '#64748b', fontStyle: 'italic' },
  'prolog':           { color: '#64748b' },
  'keyword':          { color: '#c084fc' },   // purple — matches your brand
  'operator':         { color: '#94a3b8' },
  'number':           { color: '#fb923c' },
  'string':           { color: '#86efac' },
  'boolean':          { color: '#fb923c' },
  'function':         { color: '#60a5fa' },
  'class-name':       { color: '#34d399' },
  'parameter':        { color: '#e2e8f0' },
  'builtin':          { color: '#34d399' },
  'attr-name':        { color: '#60a5fa' },
  'attr-value':       { color: '#86efac' },
  'punctuation':      { color: '#94a3b8' },
  'tag':              { color: '#f87171' },
  'selector':         { color: '#c084fc' },
  'property':         { color: '#60a5fa' },
  'important':        { color: '#f87171', fontWeight: 'bold' },
  'atrule':           { color: '#c084fc' },
  'regex':            { color: '#fbbf24' },
  'variable':         { color: '#e2e8f0' },
  'inserted':         { color: '#86efac' },
  'deleted':          { color: '#f87171' },
};

export default function MarkdownRenderer({ content }) {
  return (
    <div style={s.root}>
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 style={s.h2}>{children}</h2>,
          h3: ({ children }) => <h3 style={s.h3}>{children}</h3>,
          p:  ({ children }) => <p  style={s.p}>{children}</p>,
          ul: ({ children }) => <ul style={s.ul}>{children}</ul>,
          ol: ({ children }) => <ol style={s.ol}>{children}</ol>,
          li: ({ children }) => <li style={s.li}>{children}</li>,
          strong: ({ children }) => <strong style={s.strong}>{children}</strong>,
          em:     ({ children }) => <em style={s.em}>{children}</em>,
          blockquote: ({ children }) => <blockquote style={s.blockquote}>{children}</blockquote>,
          hr: () => <hr style={s.hr} />,

          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && language) {
              // Fenced code block with a language tag — full syntax highlighting
              return (
                <div style={s.codeBlockWrap}>
                  <div style={s.codeBlockHeader}>
                    <span style={s.codeLang}>{language}</span>
                    <CopyCodeButton text={codeString} />
                  </div>
                  <SyntaxHighlighter
                    style={codeTheme}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '14px 16px',
                      backgroundColor: 'transparent',
                      fontSize: '12.5px',
                      lineHeight: '1.65',
                      overflowX: 'auto',
                    }}
                    codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (!inline && !language) {
              // Fenced block without language tag — styled but no highlighting
              return (
                <div style={s.codeBlockWrap}>
                  <pre style={s.codeBlockPlain}>
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }

            // Inline code
            return <code style={s.inlineCode} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CopyCodeButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button style={copied ? { ...s.copyBtn, color: '#86efac' } : s.copyBtn} onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

const s = {
  root: { display: 'flex', flexDirection: 'column', gap: '4px' },

  h2: {
    fontSize: '13px', fontWeight: 700,
    color: 'var(--brand-400)',
    margin: '18px 0 8px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--border-subtle)',
    letterSpacing: '-0.2px',
  },
  h3: {
    fontSize: '12.5px', fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '14px 0 6px',
  },
  p: {
    fontSize: '13px', color: 'var(--text-primary)',
    lineHeight: 1.7, margin: '0 0 10px',
  },
  ul: {
    margin: '0 0 12px', paddingLeft: '18px',
    display: 'flex', flexDirection: 'column', gap: '5px',
  },
  ol: {
    margin: '0 0 12px', paddingLeft: '18px',
    display: 'flex', flexDirection: 'column', gap: '5px',
  },
  li: {
    fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6,
  },
  strong: { color: 'var(--text-primary)', fontWeight: 700 },
  em:     { color: 'var(--text-secondary)', fontStyle: 'italic' },
  blockquote: {
    borderLeft: '3px solid var(--brand-500)',
    margin: '0 0 12px',
    padding: '4px 0 4px 12px',
    color: 'var(--text-secondary)',
    fontSize: '13px', fontStyle: 'italic',
  },
  hr: { border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '14px 0' },

  inlineCode: {
    backgroundColor: 'var(--bg-overlay)',
    color: '#f0abfc',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12px',
  },

  codeBlockWrap: {
    backgroundColor: '#0d0d10',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    margin: '4px 0 14px',
  },
  codeBlockHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    backgroundColor: '#111114',
  },
  codeLang: {
    fontSize: '10px', fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: "'JetBrains Mono', monospace",
  },
  copyBtn: {
    fontSize: '11px', padding: '2px 8px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-subtle)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'color 150ms ease',
  },
  codeBlockPlain: {
    margin: 0, padding: '14px 16px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12.5px', color: 'var(--text-primary)',
    lineHeight: 1.65, overflowX: 'auto',
    backgroundColor: 'transparent',
  },
};