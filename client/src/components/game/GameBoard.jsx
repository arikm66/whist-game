import React from 'react';

export default function GameBoard({ playerNum, hand, gameState, onPlayCard }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Whist: Player {playerNum}</h1>
      
      {/* Table Area */}
      <div style={{ background: '#2e7d32', color: 'white', padding: '20px', borderRadius: '15px', margin: '20px auto', maxWidth: '600px' }}>
        <h3>Table</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', minHeight: '100px', alignItems: 'center' }}>
          {gameState?.currentTrick.map((item, i) => (
            <div key={i} style={{ background: 'white', color: 'black', padding: '10px', borderRadius: '5px', border: '2px solid #000' }}>
              <strong>P{item.player + 1}:</strong> {item.card.value}{item.card.suit}
            </div>
          ))}
        </div>
        <p>Current Turn: <strong>Player {gameState ? gameState.turn + 1 : "?"}</strong></p>
      </div>

      {/* Player Hand */}
      <h3>Your Hand</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {hand.map((card, i) => (
          <button 
            key={i} 
            onClick={() => onPlayCard(card, i)}
            style={{ 
              padding: '10px 15px', 
              fontSize: '20px', 
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black'
            }}
          >
            {card.value}{card.suit}
          </button>
        ))}
      </div>
    </div>
  );
}
