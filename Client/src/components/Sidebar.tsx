import type { User } from '../types';

interface SidebarProps {
  roomId: string;
  allUsers: User[];
}

export default function Sidebar({ roomId, allUsers }: SidebarProps) {
  return (
    <div style={s.sidebar}>
      <div style={s.section}>
        <div style={s.sectionLabel}>Room</div>
        <div style={s.roomBox}>
          <div style={s.roomDot} />
          <span style={s.roomIdText}>{roomId.slice(0, 12)}...</span>
        </div>
      </div>

      <div style={s.divider} />

      <div style={s.section}>
        <div style={s.sectionLabel}>Collaborators ({allUsers.length})</div>
        <div style={s.userList}>
          {allUsers.map((u, i) => (
            <div key={i} style={s.userRow}>
              <div style={{ ...s.userAvatar, backgroundColor: getColor(u.name) }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span style={s.userName}>{u.name}{u.isYou ? ' (you)' : ''}</span>
              <div style={s.onlineDot} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
const getColor = (name: string): string => COLORS[name.charCodeAt(0) % COLORS.length];

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px', flexShrink: 0,
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    padding: '16px 14px',
    display: 'flex', flexDirection: 'column', gap: '0',
    fontFamily: 'var(--font-sans)',
    overflowY: 'auto',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' },
  sectionLabel: {
    fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  roomBox: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
  },
  roomDot: { width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 },
  roomIdText: { fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' },
  divider: { height: '1px', backgroundColor: 'var(--border-subtle)', margin: '8px 0' },
  userList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  userRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 8px', borderRadius: 'var(--radius-sm)',
  },
  userAvatar: {
    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 700, color: '#fff',
  },
  userName: { fontSize: '13px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  onlineDot: { width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--success)', flexShrink: 0 },
};