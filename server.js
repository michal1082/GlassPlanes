const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Static files
app.use(express.static("public"));

// Player data
let players = {};

// Blocks data
const blocks = [
    // bottom block
    { x: 0, y: 500, width: 200, height: 20, type: "wood" },

    // bottom death
    { x: 0, y: 590, width: 20000, height: 20, type: "bad" },

    { x: 200, y: 500, width: 100, height: 20, type: "good" },
    { x: 400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 600, y: 500, width: 100, height: 20, type: "good" },
    { x: 800, y: 500, width: 100, height: 20, type: "good" },
    { x: 1000, y: 500, width: 100, height: 20, type: "bad" },
    { x: 1200, y: 500, width: 100, height: 20, type: "good" },
    { x: 1400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 1600, y: 500, width: 100, height: 20, type: "good" },
    { x: 1800, y: 500, width: 100, height: 20, type: "good" },
    { x: 2000, y: 500, width: 100, height: 20, type: "bad" },
    { x: 2200, y: 500, width: 100, height: 20, type: "good" },
    { x: 2400, y: 500, width: 100, height: 20, type: "good" },
    { x: 2600, y: 500, width: 100, height: 20, type: "bad" },
    { x: 2800, y: 500, width: 100, height: 20, type: "good" },
    { x: 3000, y: 500, width: 100, height: 20, type: "good" },
    { x: 3200, y: 500, width: 100, height: 20, type: "bad" },
    { x: 3400, y: 500, width: 100, height: 20, type: "good" },
    { x: 3600, y: 500, width: 100, height: 20, type: "good" },
    { x: 3800, y: 500, width: 100, height: 20, type: "bad" },
    { x: 4000, y: 500, width: 100, height: 20, type: "good" },
    { x: 4200, y: 500, width: 100, height: 20, type: "bad" },
    { x: 4400, y: 500, width: 100, height: 20, type: "good" },
    { x: 4600, y: 500, width: 100, height: 20, type: "good" },
    { x: 4800, y: 500, width: 100, height: 20, type: "bad" },
    { x: 5000, y: 500, width: 100, height: 20, type: "good" },
    { x: 5200, y: 500, width: 100, height: 20, type: "bad" },
    { x: 5400, y: 500, width: 100, height: 20, type: "good" },
    { x: 5600, y: 500, width: 100, height: 20, type: "good" },
    { x: 5800, y: 500, width: 100, height: 20, type: "bad" },
    { x: 6000, y: 500, width: 100, height: 20, type: "good" },
    { x: 6200, y: 500, width: 100, height: 20, type: "good" },
    { x: 6400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 6600, y: 500, width: 100, height: 20, type: "good" },
    { x: 6800, y: 500, width: 100, height: 20, type: "bad" },
    { x: 7000, y: 500, width: 100, height: 20, type: "good" },
    { x: 7200, y: 500, width: 100, height: 20, type: "good" },
    { x: 7400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 7600, y: 500, width: 100, height: 20, type: "good" },
    { x: 7800, y: 500, width: 100, height: 20, type: "good" },
    { x: 8000, y: 500, width: 100, height: 20, type: "bad" },
    { x: 8200, y: 500, width: 100, height: 20, type: "good" },
    { x: 8400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 8600, y: 500, width: 100, height: 20, type: "good" },
    { x: 8800, y: 500, width: 100, height: 20, type: "good" },
    { x: 9000, y: 500, width: 100, height: 20, type: "bad" },
    { x: 9200, y: 500, width: 100, height: 20, type: "good" },
    { x: 9400, y: 500, width: 100, height: 20, type: "bad" },
    { x: 9600, y: 500, width: 100, height: 20, type: "good" },
    { x: 9800, y: 500, width: 100, height: 20, type: "good" },
    { x: 10000, y: 500, width: 100, height: 20, type: "bad" },

    { x: 10200, y: 500, width: 100, height: 20, type: "finish" },
];

// Socket.IO connections
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };

    socket.emit("assignId", socket.id);
    socket.emit("blocks", blocks);
    io.emit("players", players);

    socket.on("updatePosition", (position) => {
        if (players[socket.id]) {
            players[socket.id].x = position.x;
            players[socket.id].y = position.y;
        }
        io.emit("players", players);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit("players", players);
    });

    socket.on("chatMessage", (message) => {
        io.emit("chatMessage", { playerId: socket.id, message });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
