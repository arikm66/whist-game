const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    // A unique ID for the match, or just 'current_game' for now
    gameId: { type: String, default: 'main_lobby' },
    
    // The current status of the table
    gameState: {
        currentTrick: { type: Array, default: [] },
        turn: { type: Number, default: 0 },
        scores: { type: [Number], default: [0, 0] },
        trump: { type: String, default: '♠' },
        leadSuit: { type: String, default: null }
    },

    // The state of each player
    players: [{
        socketId: String,       // We will update this on refresh
        userId: String,         // A permanent ID from localStorage
        playerNumber: Number,   // 1, 2, 3, or 4
        hand: Array             // The 13 cards dealt to them
    }]
});

module.exports = mongoose.model('Game', GameSchema, 'games');
