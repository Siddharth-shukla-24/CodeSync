import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import socket from '../socket';
import toast, { Toaster } from 'react-hot-toast';
import { Copy, LogOut, MessageSquare, X, Send } from 'lucide-react';

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Anonymous';

const [code, setCode] = useState('// Start coding here...\n');
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const isRemoteUpdate = useRef(false);
  const chatEndRef = useRef(null);

  const shortRoomId = roomId.slice(0, 8) + '...';
  const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#DB2777'];

  const getAvatarColor = (name) => {
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  useEffect(() => {
    const init = async () => {
      socket.emit('join-room', { roomId, username });
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      try {
        await fetch(`${serverUrl}/room/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, createdBy: username })
        });
      } catch {
        // Silently handle error
      }
      try {
        const res = await fetch(`${serverUrl}/room/${roomId}`);
        const data = await res.json();
        if (data.room?.lastCode) setCode(data.room.lastCode);
      } catch {
        // Silently handle error
      }
    };
    init();

    socket.on('user-joined', ({ username: joinedUser }) => {
      toast.success(`${joinedUser} joined the room`, {
        style: { background: '#1e1e2e', color: '#fff', border: '1px solid #7C3AED' }
      });
    });

    socket.on('user-left', ({ username: leftUser }) => {
      toast.error(`${leftUser} left the room`, {
        style: { background: '#1e1e2e', color: '#fff' }
      });
    });

    socket.on('code-update', ({ code: newCode }) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
    });

    socket.on('room-users', (userList) => {
      setUsers(userList.filter(u => u !== username));
    });

    socket.on('language-update', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    socket.on('chat-message', ({ username: sender, message, time }) => {
      setMessages(prev => [...prev, { sender, message, time }]);
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('code-update');
      socket.off('room-users');
      socket.off('language-update');
      socket.off('chat-message');
    };
  }, [roomId, username]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCodeChange = (newCode) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    setCode(newCode);
    socket.emit('code-change', { roomId, code: newCode });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit('language-change', { roomId, language: newLang });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied!', {
      style: { background: '#1e1e2e', color: '#fff', border: '1px solid #7C3AED' },
      duration: 1500
    });
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socket.emit('send-message', { roomId, username, message: messageInput, time });
    setMessages(prev => [...prev, { sender: username, message: messageInput, time, isMe: true }]);
    setMessageInput('');
  };

  const allUsers = [{ name: username, isYou: true }, ...users.map(u => ({ name: u, isYou: false }))];

  return (
    <div style={styles.root}>
      <Toaster position="top-right" />

      {/* ========== TOP BAR ========== */}
      <div style={styles.topBar}>
        {/* Left — Logo */}
        <div style={styles.topLeft}>
          <span style={styles.logo}>💻 CodeSync</span>
        </div>

        {/* Center — Room ID + Copy */}
        <div style={styles.topCenter}>
          <span style={styles.roomLabel}>Room:</span>
          <span style={styles.roomShort}>{shortRoomId}</span>
          <button style={styles.iconBtn} onClick={copyRoomId} title="Copy Room ID">
            <Copy size={14} />
          </button>
        </div>

        {/* Right — Language + Users + Theme + Leave */}
        <div style={styles.topRight}>
          <select value={language} onChange={handleLanguageChange} style={styles.langSelect}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          {/* User Avatars */}
          <div style={styles.avatarGroup}>
            {allUsers.slice(0, 4).map((u, i) => (
              <div
                key={i}
                title={u.name + (u.isYou ? ' (you)' : '')}
                style={{
                  ...styles.avatar,
                  backgroundColor: getAvatarColor(u.name),
                  marginLeft: i === 0 ? 0 : '-8px',
                  zIndex: allUsers.length - i,
                  border: u.isYou ? '2px solid #7C3AED' : '2px solid #1e1e2e'
                }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {allUsers.length > 4 && (
              <div style={{ ...styles.avatar, backgroundColor: '#444', marginLeft: '-8px' }}>
                +{allUsers.length - 4}
              </div>
            )}
          </div>

          <button
            style={{ ...styles.iconBtn, color: chatOpen ? '#7C3AED' : '#888' }}
            onClick={() => setChatOpen(!chatOpen)}
            title="Toggle Chat"
          >
            <MessageSquare size={16} />
          </button>

          <button
            style={styles.iconBtn}
            onClick={() => setTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')}
            title="Toggle Theme"
          >
            {theme === 'vs-dark' ? '☀️' : '🌙'}
          </button>

          <button style={styles.leaveBtn} onClick={() => navigate('/')}>
            <LogOut size={14} /> Leave
          </button>
        </div>
      </div>

      {/* ========== MAIN AREA ========== */}
      <div style={styles.main}>

        {/* Editor */}
        <div style={styles.editorWrap}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme={theme}
            onMount={(editor) => {
              editor.onDidChangeCursorPosition((e) => {
                setCursorPos({ line: e.position.lineNumber, col: e.position.column });
              });
            }}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              padding: { top: 12 }
            }}
          />

          {/* Status Bar */}
          <div style={styles.statusBar}>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{language.charAt(0).toUpperCase() + language.slice(1)}</span>
            <span style={{ color: '#7C3AED' }}>● {allUsers.length} user{allUsers.length > 1 ? 's' : ''} online</span>
          </div>
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div style={styles.chatPanel}>
            <div style={styles.chatHeader}>
              <span>💬 Chat</span>
              <button style={styles.iconBtn} onClick={() => setChatOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <div style={styles.chatMessages}>
              {messages.length === 0 && (
                <p style={styles.chatEmpty}>No messages yet. Say hi! 👋</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ ...styles.msgBubble, alignSelf: msg.isMe ? 'flex-end' : 'flex-start' }}>
                  {!msg.isMe && <span style={styles.msgSender}>{msg.sender}</span>}
                  <div style={{
                    ...styles.msgText,
                    backgroundColor: msg.isMe ? '#7C3AED' : '#2a2a3a',
                    borderRadius: msg.isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px'
                  }}>
                    {msg.message}
                  </div>
                  <span style={styles.msgTime}>{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={styles.chatInput}>
              <input
                style={styles.chatInputField}
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button style={styles.sendBtn} onClick={sendMessage}>
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0f0f1a',
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
  },

  // TOP BAR
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '48px',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #2a2a3a',
    flexShrink: 0,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' },
  logo: { fontSize: '15px', fontWeight: '700', color: '#fff' },
  topCenter: { display: 'flex', alignItems: 'center', gap: '8px' },
  roomLabel: { fontSize: '11px', color: '#666' },
  roomShort: { fontSize: '12px', color: '#7C3AED', fontFamily: 'monospace', fontWeight: '600' },
  topRight: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px', justifyContent: 'flex-end' },

  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },

  langSelect: {
    backgroundColor: '#252535',
    color: '#fff',
    border: '1px solid #3a3a4a',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    outline: 'none',
  },

  avatarGroup: { display: 'flex', alignItems: 'center' },
  avatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    cursor: 'default',
  },

  leaveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    backgroundColor: '#c0392b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },

  // MAIN
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  editorWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  statusBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '20px',
    padding: '3px 16px',
    backgroundColor: '#1a1a2e',
    borderTop: '1px solid #2a2a3a',
    fontSize: '11px',
    color: '#666',
    flexShrink: 0,
  },

  // CHAT
  chatPanel: {
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a2e',
    borderLeft: '1px solid #2a2a3a',
    flexShrink: 0,
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #2a2a3a',
    fontSize: '13px',
    fontWeight: '600',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  chatEmpty: { color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '20px' },
  msgBubble: { display: 'flex', flexDirection: 'column', maxWidth: '85%' },
  msgSender: { fontSize: '10px', color: '#7C3AED', marginBottom: '2px', fontWeight: '600' },
  msgText: { padding: '7px 10px', fontSize: '12px', color: '#fff', wordBreak: 'break-word' },
  msgTime: { fontSize: '9px', color: '#555', marginTop: '2px', alignSelf: 'flex-end' },
  chatInput: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #2a2a3a',
    gap: '6px',
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#252535',
    border: '1px solid #3a3a4a',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: '#7C3AED',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};

export default EditorPage;