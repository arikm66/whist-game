const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let connectedPlayers = [];

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function shuffleDeck() {
    let deck = [];
    suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v })));
    return deck.sort(() => Math.random() - 0.5);
}

io.on('connection', (socket) => {
    console.log('A player joined:', socket.id);

    if (connectedPlayers.length < 4) {
        connectedPlayers.push(socket.id);
        io.emit('player_count', connectedPlayers.length);
    }

    if (connectedPlayers.length === 4) {
        const deck = shuffleDeck();
        connectedPlayers.forEach((id, index) => {
            const hand = deck.slice(index * 13, (index + 1) * 13);
            io.to(id).emit('deal_cards', { hand, playerNumber: index + 1 });
        });
    }

    socket.on('disconnect', () => {
        connectedPlayers = connectedPlayers.filter(id => id !== socket.id);
        io.emit('player_count', connectedPlayers.length);
    });
});

// Serve React build files for production (Render)
app.use(express.static(path.join(__dirname, 'client/dist')));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
