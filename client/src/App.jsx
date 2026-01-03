import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Lobby from './components/lobby/Lobby';
import GameBoard from './components/game/GameBoard';

const socket = io(
  window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/'
);

// --- Helper for Sorting ---
const suitOrder = { '♠': 1, '♥': 2, '♣': 3, '♦': 4 };
const valueOrder = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

const sortCards = (cards) => {
  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return valueOrder[a.value] - valueOrder[b.value];
  });
};

export default function App() {
  const [playerCount, setPlayerCount] = useState(0);
  const [hand, setHand] = useState([]);
  const [playerNum, setPlayerNum] = useState(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('player_count', (count) => setPlayerCount(count));

    socket.on('deal_cards', (data) => {
      const organizedHand = sortCards(data.hand);
      setHand(organizedHand);
      setPlayerNum(data.playerNumber);
      setGameState(data.gameState);
    });

    socket.on('update_state', (newState) => {
      console.log('State updated, current turn:', newState.turn);
      setGameState(newState);
    });

    socket.on('trick_result', (data) => {
      console.log(`Player ${data.winner + 1} won the trick!`);
      alert(`Player ${data.winner + 1} took the trick!`);
    });

    return () => {
      socket.off('player_count');
      socket.off('deal_cards');
      socket.off('update_state');
      socket.off('trick_result');
    };
  }, []);

  const handlePlayCard = (card, index) => {
    if (gameState?.turn !== playerNum - 1) {
      alert("It's not your turn!");
      return;
    }
    socket.emit('play_card', card);
    // Locally remove the card to keep UI snappy
    setHand(hand.filter((_, i) => i !== index));
  };

  return (
    <div className="app-container">
      {!playerNum ? (
        <Lobby playerCount={playerCount} />
      ) : (
        <GameBoard
          playerNum={playerNum}
          hand={hand}
          gameState={gameState}
          onPlayCard={handlePlayCard}
        />
      )}
    </div>
  );
}
