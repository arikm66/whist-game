import React from 'react';

export default function Lobby({ playerCount }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Whist: Connecting...</h1>
      <div style={{ fontSize: '24px', margin: '20px' }}>
        Lobby: <strong>{playerCount} / 4</strong>
      </div>
      <div className="loader">Waiting for {4 - playerCount} more players to join...</div>
    </div>
  );
}
