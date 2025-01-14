const socket = io();



// Fixed game world dimensions
const GAME_WIDTH = 1535;
const GAME_HEIGHT = 700;

// Canvas setup
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Scaling factor for different screen sizes
const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);

// Scale canvas on the screen
canvas.style.width = `${GAME_WIDTH * scale}px`;
canvas.style.height = `${GAME_HEIGHT * scale}px`;

let lastTime = performance.now();

// Game variables
const gravity = 0.5 * 60;
const playerSpeed = 7 * 60;
const jumpStrength = -11 * 60;

let players = {};
let keys = {};
const blocks = [];

// Starting position
const startingPosition = {
    x: 100,
    y: GAME_HEIGHT - 300,
};

// Camera setup
const camera = {
    x: 0,
    y: 0,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
};

// Initialize player object
const player = {
    id: null,
    ...startingPosition,
    width: 50,
    height: 50,
    color: "blue",
    dx: 0,
    dy: 0,
    onGround: false,
};

// Load background image
const background = new Image();
background.src = "https://gallery.yopriceville.com/downloadfullsize/send/17774"; // Replace with the path to your background image

// Key events
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Update player physics
function updatePlayer(deltaTime) {
    const scaledSpeed = playerSpeed * deltaTime;
    const scaledJumpStrength = jumpStrength * deltaTime;

    if (keys["ArrowLeft"]) player.dx = -scaledSpeed;
    else if (keys["ArrowRight"]) player.dx = scaledSpeed;
    else player.dx = 0;

    if (keys["ArrowUp"] && player.onGround) {
        player.dy = scaledJumpStrength;
        player.onGround = false;
    }

    // Apply gravity only if the player is not on the ground
    if (!player.onGround) {
        player.dy += gravity * deltaTime;
    }

    player.x += player.dx;
    player.y += player.dy;

    // Handle collisions with blocks
    player.onGround = false;
    blocks.forEach((block) => {
        if (
            player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y + player.height <= block.y &&
            player.y + player.height + player.dy >= block.y
        ) {
            if (block.type === "bad") {
                player.x = startingPosition.x;
                player.y = startingPosition.y;
                player.dy = 0;
            } else {
                player.dy = 0;
                player.y = block.y - player.height;
                player.onGround = true;
            }
        }

        if (
            player.x < block.x + block.width &&
            player.x + player.width > block.x &&
            player.y >= block.y + block.height &&
            player.y + player.dy <= block.y + block.height
        ) {
            player.dy = 0;
            player.y = block.y + block.height;
        }
    });

    if (player.y + player.height >= GAME_HEIGHT) {
        player.y = GAME_HEIGHT - player.height;
        player.dy = 0;
        player.onGround = true;
    }

    socket.emit("updatePosition", { x: player.x, y: player.y });
}

// Update the camera position
function updateCamera() {
    camera.x = player.x - camera.width / 2;
    camera.y = 0;

    camera.x = Math.max(0, camera.x);
}

// Draw the background
function drawBackground() {
    const parallaxFactor = 0.5; // Adjust for how much slower the background moves
    const backgroundX = -camera.x * parallaxFactor;
    const backgroundY = 0;

    // Tile the background image if the world is wider than the background
    ctx.drawImage(background, backgroundX, backgroundY, GAME_WIDTH * 2.2, GAME_HEIGHT);
    ctx.drawImage(background, backgroundX + GAME_WIDTH * 2.2, backgroundY, GAME_WIDTH * 2.2, GAME_HEIGHT);
}

// Draw players and blocks
function drawPlayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(scale, scale);

    // Draw the background
    drawBackground();

    // Draw floor
    ctx.fillStyle = "transparent";
    ctx.fillRect(0 - camera.x, GAME_HEIGHT - 20, GAME_WIDTH, 20);

    blocks.forEach((block) => {
        if (block.type === "good" || block.type === "bad") {
            // Glass blocks
            const gradient = ctx.createLinearGradient(
                block.x - camera.x,
                block.y - camera.y,
                block.x - camera.x + block.width,
                block.y - camera.y + block.height
            );
    
            if (block.type === "good") {
                // Glassy light green tint for "good" blocks
                gradient.addColorStop(0, "rgba(173, 216, 230, 0.4)"); // Light blue with transparency
                gradient.addColorStop(0.5, "rgba(144, 238, 144, 0.2)"); // Light green with more transparency
                gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)"); // Almost clear
            } else {
                // Glassy light red tint for "bad" blocks
                gradient.addColorStop(0, "rgba(240, 128, 128, 0.4)"); // Light coral with transparency
                gradient.addColorStop(0.5, "rgba(255, 182, 193, 0.2)"); // Light pink with more transparency
                gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)"); // Almost clear
            }
    
            ctx.fillStyle = gradient;
            ctx.fillRect(
                block.x - camera.x,
                block.y - camera.y,
                block.width,
                block.height
            );
    
            // Add a glossy border
            ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                block.x - camera.x,
                block.y - camera.y,
                block.width,
                block.height
            );
    
            // Inner reflection line
            ctx.beginPath();
            ctx.moveTo(block.x - camera.x + 5, block.y - camera.y + 5);
            ctx.lineTo(block.x - camera.x + block.width - 5, block.y - camera.y + 5);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
    
        } else if (block.type === "finish") {
            // Finish block with black and white grid
            const size = 10; // Grid square size
            for (let y = 0; y < block.height; y += size) {
                for (let x = 0; x < block.width; x += size) {
                    ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? "black" : "white";
                    ctx.fillRect(
                        block.x - camera.x + x,
                        block.y - camera.y + y,
                        size,
                        size
                    );
                }
            }
    
            // Add border for clarity
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                block.x - camera.x,
                block.y - camera.y,
                block.width,
                block.height
            );
    
        } else if (block.type === "wood") {
            // Wood block with gradient and lines
            const woodGradient = ctx.createLinearGradient(
                block.x - camera.x,
                block.y - camera.y,
                block.x - camera.x,
                block.y - camera.y + block.height
            );
    
            woodGradient.addColorStop(0, "rgba(139, 69, 19, 1)"); // Dark brown
            woodGradient.addColorStop(0.5, "rgba(160, 82, 45, 1)"); // Medium brown
            woodGradient.addColorStop(1, "rgba(210, 105, 30, 1)"); // Lighter brown
    
            ctx.fillStyle = woodGradient;
            ctx.fillRect(
                block.x - camera.x,
                block.y - camera.y,
                block.width,
                block.height
            );
    
            // Draw wood grain (lines)
            ctx.strokeStyle = "rgba(101, 67, 33, 0.8)"; // Slightly darker lines
            ctx.lineWidth = 1;
    
            for (let y = block.y - camera.y; y < block.y - camera.y + block.height; y += 5) {
                ctx.beginPath();
                ctx.moveTo(block.x - camera.x, y);
                ctx.bezierCurveTo(
                    block.x - camera.x + block.width / 4, y + 3,
                    block.x - camera.x + (3 * block.width) / 4, y - 3,
                    block.x - camera.x + block.width, y
                );
                ctx.stroke();
                ctx.closePath();
            }
    
            // Add border for clarity
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.strokeRect(
                block.x - camera.x,
                block.y - camera.y,
                block.width,
                block.height
            );
        }
    });
    


    // Draw players
    for (const id in players) {
        const p = players[id];
        ctx.fillStyle = p.color;
        ctx.fillRect(
            p.x - camera.x,
            p.y - camera.y,
            p.width,
            p.height
        );
    }

    ctx.restore();
}

function gameLoop() {
    const now = performance.now();
    const deltaTime = (now - lastTime) / 1000; // Time elapsed since the last frame in seconds
    lastTime = now;

    updatePlayer(deltaTime);
    updateCamera();
    drawPlayers();
    requestAnimationFrame(gameLoop);
}

socket.on("players", (serverPlayers) => {
    players = serverPlayers;
});

socket.on("blocks", (serverBlocks) => {
    blocks.length = 0;
    blocks.push(...serverBlocks);
});

socket.on("assignId", (id) => {
    player.id = id;
    players[id] = player;
});

// Chat functionality
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") {
        socket.emit("chatMessage", chatInput.value);
        chatInput.value = "";
    }
});

socket.on("chatMessage", (data) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${data.playerId}: ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

gameLoop();
