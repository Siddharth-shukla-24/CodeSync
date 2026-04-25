import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // Naya room create karo — random ID generate hogi
  const createRoom = () => {
    const newRoomId = uuidv4();
    if (!username) {
      alert('Enter the Username');
      return;
    }
    navigate(`/editor/${newRoomId}`, { state: { username } });
  };

  // Existing room join karo
  const joinRoom = () => {
    if (!roomId || !username) {
      alert('Enter RoomId and Username');
      return;
    }
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>CodeSync</h1>
        <p style={styles.subtitle}>Real-time collaborative code editor</p>

        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Room ID(to join a room)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button style={styles.btnPrimary} onClick={joinRoom}>
          Join Room
        </button>

        <button style={styles.btnSecondary} onClick={createRoom}>
          Create New Room
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63,#24243e)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter:'blur(10px)',
    padding: '48px 40px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '380px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    border:'1px solid rgba(255,255,255,0.1',
  },
  title: {
    color: '#ffffff',
    margin: 0,
    fontSize: '32px',
    textAlign: 'center',
    fontWeight:'700',
    letterSpacing:'-0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 8px 0',
    textAlign: 'center',
    fontSize: '14px',
  },
  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.07) ',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
  },
  btnPrimary: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop:'8px',
  },
  btnSecondary: {
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default Home;