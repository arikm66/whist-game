import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/');

export default function App() {
  const [playerCount, setPlayerCount] = useState(0);
  const [hand, setHand] = useState([]);
  const [playerNum, setPlayerNum] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('player_count', (count) => {
      setPlayerCount(count);
    });

    // The server sends 'deal_cards' when the 4th player joins
    socket.on('deal_cards', (data) => {
        console.log("Cards received!", data);
        setHand(data.hand); // This will trigger the UI to switch from "Waiting" to the game table
        setPlayerNum(data.playerNumber);
        setGameState(data.gameState);
    });
      
    socket.on('update_state', (newState) => {
      setGameState(newState);
    });

    return () => {
      socket.off('player_count');
      socket.off('deal_cards');
      socket.off('update_state');
    };
  }, []);

  const playCard = (card, index) => {
    if (gameState?.turn !== (playerNum - 1)) {
        alert("It's not your turn!");
        return;
    }
    socket.emit('play_card', card);
    // Remove played card from UI hand immediately
    setHand(hand.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Whist: Player {playerNum || "Connecting..."}</h1>
      <p>Lobby: {playerCount} / 4</p>
      <hr />

      {hand.length > 0 ? (
        <div>
          <div style={{ marginBottom: '20px', background: '#f0f0f0', padding: '10px' }}>
            <h3>Table (Trick)</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', minHeight: '80px' }}>
              {gameState?.currentTrick.map((item, i) => (
                <div key={i} style={{ border: '1px solid #000', padding: '10px', borderRadius: '5px', background: 'white' }}>
                  P{item.player + 1}: {item.card.value}{item.card.suit}
                </div>
              ))}
            </div>
            <p><strong>Current Turn: Player {gameState ? gameState.turn + 1 : "?"}</strong></p>
          </div>

          <h3>Your Hand</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {hand.map((card, i) => (
              <button 
                key={i} 
                onClick={() => playCard(card, i)}
                style={{ 
                    padding: '10px', 
                    fontSize: '18px', 
                    cursor: 'pointer',
                    color: (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'
                }}
              >
                {card.value}{card.suit}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <h2>Waiting for {4 - playerCount} more players...</h2>
      )}
    </div>
  );
}
