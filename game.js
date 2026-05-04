const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');

// Game variables
let score = 0;
let gameRunning = true;
let gameSpeed = 5;
let spawnRate = 0.015;

// Player object
const player = {
    x: 100,
    y: canvas.height - 80,
    width: 30,
    height: 40,
    velocityY: 0,
    jumping: false,
    color: '#CD853F',
    update() {
        // Gravity
        this.velocityY += 0.6;
        this.y += this.velocityY;

        // Ground collision
        if (this.y + this.height >= canvas.height - 20) {
            this.y = canvas.height - this.height - 20;
            this.jumping = false;
            this.velocityY = 0;
        }
    },
    jump() {
        if (!this.jumping) {
            this.velocityY = -12;
            this.jumping = true;
        }
    },
    draw() {
        // Body (blue shirt)
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x + 5, this.y + 12, 20, 20);

        // Head (skin tone)
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(this.x + 6, this.y, 18, 12);

        // Legs (brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 7, this.y + 32, 8, 8);
        ctx.fillRect(this.x + 15, this.y + 32, 8, 8);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y + 3, 3, 3);
        ctx.fillRect(this.x + 17, this.y + 3, 3, 3);
    }
};

// Obstacle object (blocks)
const obstacles = [];

class Block {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width;
        this.y = canvas.height - 60;
        this.color = '#90EE90';
        this.borderColor = '#228B22';
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        // Block
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Grass texture
        ctx.fillStyle = this.borderColor;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(this.x + i * 10, this.y, 8, 4);
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}

// Phantom object (flying enemies)
const phantoms = [];

class Phantom {
    constructor() {
        this.width = 35;
        this.height = 30;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 200) + 50;
        this.velocityY = (Math.random() - 0.5) * 2;
        this.color = '#8B7DB8';
        this.wingFlap = 0;
    }

    update() {
        this.x -= gameSpeed + 1;
        this.y += this.velocityY;
        this.wingFlap += 0.2;

        // Keep phantom on screen vertically
        if (this.y < 20) this.velocityY = 1;
        if (this.y + this.height > canvas.height - 80) this.velocityY = -1;
    }

    draw() {
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + 18, this.y + 15, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing)
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 24, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 18, this.y + 18, 4, 0, Math.PI);
        ctx.stroke();

        // Wings (flapping)
        const wingOffset = Math.sin(this.wingFlap) * 5;
        ctx.fillStyle = 'rgba(139, 125, 184, 0.6)';
        // Left wing
        ctx.beginPath();
        ctx.ellipse(this.x + 8, this.y + 15, 8, 6, -0.3 + wingOffset * 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.ellipse(this.x + 28, this.y + 15, 8, 6, 0.3 - wingOffset * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    collidesWith(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}

// Ground drawing
function drawGround() {
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Grass line
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 2);

    // Dirt pattern
    ctx.fillStyle = '#654321';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, canvas.height - 15, 10, 10);
    }
}

// Spawn obstacles
function spawnObstacle() {
    if (Math.random() < spawnRate) {
        obstacles.push(new Block());
    }
    // Less frequent phantom spawning
    if (Math.random() < spawnRate * 0.4) {
        phantoms.push(new Phantom());
    }
}

// Update game
function update() {
    player.update();
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        
        // Check collision
        if (obstacles[i].collidesWith(player)) {
            endGame();
        }

        // Remove off-screen obstacles
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    // Update phantoms
    for (let i = phantoms.length - 1; i >= 0; i--) {
        phantoms[i].update();
        
        // Check collision
        if (phantoms[i].collidesWith(player)) {
            endGame();
        }

        // Remove off-screen phantoms
        if (phantoms[i].isOffScreen()) {
            phantoms.splice(i, 1);
            score += 25;
        }
    }

    // Increase difficulty
    if (score > 0 && score % 500 === 0) {
        gameSpeed += 0.5;
        spawnRate += 0.002;
    }

    spawnObstacle();
    scoreDisplay.textContent = `Score: ${score}`;
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw parallax background
    ctx.fillStyle = '#E0F6FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    drawGround();

    // Draw all game objects
    player.draw();
    
    obstacles.forEach(block => block.draw());
    phantoms.forEach(phantom => phantom.draw());
}

// Game loop
function gameLoop() {
    update();
    draw();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// End game
function endGame() {
    gameRunning = false;
    gameOverScreen.classList.add('show');
    finalScoreDisplay.textContent = score;
}

// Input handling
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') && gameRunning) {
        player.jump();
    }
});

// Mobile touch support
canvas.addEventListener('click', () => {
    if (gameRunning) {
        player.jump();
    }
});

canvas.addEventListener('touchstart', () => {
    if (gameRunning) {
        player.jump();
    }
});

// Start the game
gameLoop();