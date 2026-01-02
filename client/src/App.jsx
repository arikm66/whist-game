import { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connects to the same host as the website
const socket = io();

function App() {
  const [status, setStatus] = useState("Connecting to server...");

  useEffect(() => {
    socket.on('connect', () => setStatus("Connected! Waiting for players..."));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Whist Online</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;