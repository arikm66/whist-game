const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Game State Management
let connectedPlayers = [];
let gameState = {
    currentTrick: [], // Cards played in the current round
    turn: 0,          // Index of the player whose turn it is (0-3)
    scores: [0, 0],   // Team 1 (Players 1&3), Team 2 (Players 2&4)
    trump: '♠',       // Default trump suit
    leadSuit: null    // The suit that started the trick
};

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const cardValueMap = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };

function shuffleDeck() {
    let deck = [];
    suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v })));
    return deck.sort(() => Math.random() - 0.5);
}

// Logic to determine the winner of a trick
function determineTrickWinner(trick) {
    let winner = trick[0];
    for (let i = 1; i < trick.length; i++) {
        const current = trick[i];
        // If current card is trump and winner isn't, trump wins
        if (current.card.suit === gameState.trump && winner.card.suit !== gameState.trump) {
            winner = current;
        } 
        // If both are same suit (trump or lead), higher value wins
        else if (current.card.suit === winner.card.suit) {
            if (cardValueMap[current.card.value] > cardValueMap[winner.card.value]) {
                winner = current;
            }
        }
    }
    return winner;
}

io.on('connection', (socket) => {
    // Only add and log if we have room for more players
    if (connectedPlayers.length < 4) {
        connectedPlayers.push(socket.id);
        
        // Log the player number (1-4) out of four
        console.log(`Player joined: ${connectedPlayers.length}/4 (ID: ${socket.id})`);
        
        // Notify all clients of the current count
        io.emit('player_count', connectedPlayers.length);
    } else {
        console.log(`Connection rejected: Server full (ID: ${socket.id})`);
    }

    // Start Game once 4 players join
    if (connectedPlayers.length === 4) {
        const deck = shuffleDeck();
        gameState.turn = 0;
        connectedPlayers.forEach((id, index) => {
            const hand = deck.slice(index * 13, (index + 1) * 13);
            io.to(id).emit('deal_cards', {  // <--- Check this event name
                hand, 
                playerNumber: index + 1,
                gameState 
            });
        });
    }

    // Handle playing a card
    socket.on('play_card', (card) => {
        const playerIdx = connectedPlayers.indexOf(socket.id);
        
        // Validation: Turn check
        if (playerIdx !== gameState.turn) return;

        // Set lead suit if it's the first card of the trick
        if (gameState.currentTrick.length === 0) gameState.leadSuit = card.suit;

        gameState.currentTrick.push({ card, player: playerIdx });
        
        // Move to next player
        gameState.turn = (gameState.turn + 1) % 4;

        // Check if trick is complete
        if (gameState.currentTrick.length === 4) {
            const winnerData = determineTrickWinner(gameState.currentTrick);
            
            // Assign point to the winning team (Team 0: players 0 & 2 | Team 1: players 1 & 3)
            const teamIndex = winnerData.player % 2;
            gameState.scores[teamIndex]++;
            
            // Winner of the last trick starts the next one
            gameState.turn = winnerData.player;

            io.emit('trick_result', {
                winner: winnerData.player,
                trick: gameState.currentTrick,
                scores: gameState.scores
            });

            gameState.currentTrick = [];
            gameState.leadSuit = null;
        }

        io.emit('update_state', gameState);
    });

    socket.on('disconnect', () => {
        // Find which player number this was before removing them
        const playerIndex = connectedPlayers.indexOf(socket.id);
        
        if (playerIndex !== -1) {
            console.log(`Player left: ${playerIndex + 1} (ID: ${socket.id})`); // Log line added
            
            // Remove the player from the list
            connectedPlayers = connectedPlayers.filter(id => id !== socket.id);
            
            // Notify all remaining clients of the new player count
            io.emit('player_count', connectedPlayers.length);

            // Logic to handle game reset if a player leaves during a match
            if (connectedPlayers.length < 4) {
                console.log("Game interrupted: Not enough players to continue. Resetting state.");
                gameState.currentTrick = [];
                // You can add an io.emit('game_error', 'A player disconnected') here if you like
            }
        } else {
            console.log('An unassigned user disconnected.');
        }
    });
});

app.use(express.static(path.join(__dirname, 'client/dist')));
// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/dist')));

// Fallback for Single Page Application (SPA): Redirect all non-file requests to index.html
app.use((req, res, next) => {
    // If the request is for a file (has an extension), let it fail naturally
    if (path.extname(req.path).length > 0) {
        res.status(404).end();
    } else {
        // Otherwise, send the React index.html
        res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
