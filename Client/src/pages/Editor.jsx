import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import socket from '../socket';
import toast from 'react-hot-toast';

function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Anonymous';

  const [code, setCode] = useState('// Start coding here...\n');
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState('javascript'); // language selector
  const isRemoteUpdate = useRef(false);

useEffect(() => {
const init = async () => {
  socket.emit('join-room', { roomId, username });
  
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  const res = await fetch(`${serverUrl}/room/${roomId}`);
  const data = await res.json();
  if (data.room?.lastCode) {
    setCode(data.room.lastCode);
  }
};
  
  init();

    socket.on('user-joined', ({ username: joinedUser }) => {
      toast.success(`${joinedUser} joined the room`);
    });

    socket.on('user-left',({username:leftUser})=>{
      toast.error(`${leftUser} left the room`);
    }); 

    socket.on('code-update', ({ code: newCode }) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
    });

    // ✅ Andar hai ab
    socket.on('room-users', (userList) => {
      setUsers(userList.filter(u => u !== username));
    });

    return () => {
      socket.off('user-joined');
      socket.off('code-update');
      socket.off('room-users');
    };
  }, [roomId, username]);

  const handleCodeChange = (newCode) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    setCode(newCode);
    socket.emit('code-change', { roomId, code: newCode });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={styles.logo}>CodeSync</h3>
        <p style={styles.roomLabel}>Room ID:</p>
        <p style={styles.roomId}>{roomId}</p>
        <button
          style={styles.copyBtn}
          onClick={() => navigator.clipboard.writeText(roomId)}
        >
          Copy Room ID
        </button>

        {/* Language Selector */}
        <p style={styles.roomLabel}>Language:</p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={styles.select}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <p style={styles.usersLabel}>👥 Connected Users:</p>
        <p style={styles.user}>• {username} (you)</p>
        {users.map((u, i) => (
          <p key={i} style={styles.user}>• {u}</p>
        ))}
        <button style={styles.leaveBtn} onClick={() => navigate('/')}>
          Leave Room
        </button>
      </div>

      <div style={styles.editorContainer}>
        <Editor
          height="100vh"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#1e1e1e',
  },
  sidebar: {
    width: '220px',
    backgroundColor: '#252526',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderRight: '1px solid #333',
  },
  logo: {
    color: '#fff',
    margin: '0 0 16px 0',
    fontSize: '18px',
  },
  roomLabel: {
    color: '#888',
    margin: 0,
    fontSize: '12px',
  },
  roomId: {
    color: '#4CAF50',
    margin: 0,
    fontSize: '11px',
    wordBreak: 'break-all',
  },
  copyBtn: {
    padding: '8px',
    backgroundColor: '#3a3a3a',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '4px',
  },
  select: {
    padding: '8px',
    backgroundColor: '#3a3a3a',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  usersLabel: {
    color: '#888',
    margin: '16px 0 4px 0',
    fontSize: '12px',
  },
  user: {
    color: '#4CAF50',
    margin: 0,
    fontSize: '13px',
  },
  leaveBtn: {
    marginTop: 'auto',
    padding: '10px',
    backgroundColor: '#c0392b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editorContainer: {
    flex: 1,
    height: '100vh',
  },
};

export default EditorPage;