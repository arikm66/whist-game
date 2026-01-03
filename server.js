require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const Game = require('./models/Game');
const passport = require('passport');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whist')
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

app.use(passport.initialize());

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const cardValueMap = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14 };

function shuffleDeck() {
    let deck = [];
    suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v })));
    return deck.sort(() => Math.random() - 0.5);
}

function determineTrickWinner(trick, trump) {
    let winner = trick[0];
    for (let i = 1; i < trick.length; i++) {
        const current = trick[i];
        if (current.card.suit === trump && winner.card.suit !== trump) {
            winner = current;
        } 
        else if (current.card.suit === winner.card.suit) {
            if (cardValueMap[current.card.value] > cardValueMap[winner.card.value]) {
                winner = current;
            }
        }
    }
    return winner;
}

io.on('connection', async (socket) => {
    // Find the current game or create a new one if it doesn't exist
    let game = await Game.findOne({ gameId: 'main_lobby' });
    if (!game) {
        game = new Game({ gameId: 'main_lobby', players: [], gameState: { scores: [0, 0], turn: 0, trump: '♠' } });
    }

    // Check if player is already in the game (e.g., refreshing)
    let player = game.players.find(p => p.socketId === socket.id);

    if (!player && game.players.length < 4) {
        const playerNumber = game.players.length + 1;
        game.players.push({ socketId: socket.id, playerNumber, hand: [] });
        await game.save();
        console.log(`Player joined: ${game.players.length}/4 (ID: ${socket.id})`);
    }

    io.emit('player_count', game.players.length);

    // Start game logic
    if (game.players.length === 4 && game.players[0].hand.length === 0) {
        const deck = shuffleDeck();
        game.players.forEach((p, index) => {
            p.hand = deck.slice(index * 13, (index + 1) * 13);
        });
        game.gameState.turn = 0;
        await game.save();

        game.players.forEach((p) => {
            io.to(p.socketId).emit('deal_cards', { 
                hand: p.hand, 
                playerNumber: p.playerNumber,
                gameState: game.gameState 
            });
        });
    }

    socket.on('play_card', async (card) => {
        const currentGame = await Game.findOne({ gameId: 'main_lobby' });
        const playerIdx = currentGame.players.findIndex(p => p.socketId === socket.id);
        
        if (playerIdx !== currentGame.gameState.turn) return;

        if (currentGame.gameState.currentTrick.length === 0) currentGame.gameState.leadSuit = card.suit;
        currentGame.gameState.currentTrick.push({ card, player: playerIdx });
        
        currentGame.gameState.turn = (currentGame.gameState.turn + 1) % 4;

        if (currentGame.gameState.currentTrick.length === 4) {
            const winnerData = determineTrickWinner(currentGame.gameState.currentTrick, currentGame.gameState.trump);
            const teamIndex = winnerData.player % 2;
            currentGame.gameState.scores[teamIndex]++;
            currentGame.gameState.turn = winnerData.player;

            io.emit('trick_result', {
                winner: winnerData.player,
                trick: currentGame.gameState.currentTrick,
                scores: currentGame.gameState.scores
            });

            currentGame.gameState.currentTrick = [];
            currentGame.gameState.leadSuit = null;
        }

        // Update player's hand in DB
        currentGame.players[playerIdx].hand = currentGame.players[playerIdx].hand.filter(
            c => !(c.suit === card.suit && c.value === card.value)
        );

        await currentGame.save();
        io.emit('update_state', currentGame.gameState);
    });

    socket.on('disconnect', async () => {
        const currentGame = await Game.findOne({ gameId: 'main_lobby' });
        if (currentGame) {
            const playerIndex = currentGame.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex !== -1) {
                console.log(`Player ${playerIndex + 1} (ID: ${socket.id}) has left.`);
                // Note: In a persistent game, you might not want to remove them immediately 
                // so they can reconnect. For now, we update the count.
                io.emit('player_count', currentGame.players.length);
            }
        }
    });
});

// Serve Frontend
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
