class GravitySnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tiltDot = document.getElementById('tiltDot');
        this.activeKeysElement = document.getElementById('activeKeys');
        
        // Game state
        this.gameRunning = false;
        this.score = 0;
        this.snake = [];
        this.food = [];
        this.holes = [];
        
        // Physics - Much easier for kids
        this.gravity = 0.05; // Much lighter gravity
        this.friction = 0.95; // Less friction for smoother movement
        this.bounce = 0.8; // Better bounce
        
        // Wall bump mechanics
        this.wallBumpSpeed = 0.5; // Speed when bumped
        this.normalSpeed = 1.0; // Normal speed
        this.currentSpeed = this.normalSpeed;
        this.isBumped = false;
        this.bumpTimer = 0;
        
        // Controls
        this.tiltX = 0;
        this.tiltY = 0;
        this.keys = {};
        
        // Snake properties - Kid-friendly
        this.snakeRadius = 15; // Bigger for kids
        this.segmentDistance = 30;
        this.maxSpeed = 4; // 50% slower
        
        // Game state
        this.level = 1;
        this.tylenol = [];
        this.animations = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.resetGame();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Device orientation for mobile
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (this.gameRunning) {
                    this.tiltX = Math.max(-1, Math.min(1, e.gamma / 30)); // Left/Right
                    this.tiltY = Math.max(-1, Math.min(1, e.beta / 30));  // Forward/Back
                    this.updateTiltIndicator();
                }
            });
        }
        
        // Keyboard controls for desktop
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // Map arrow keys to our key system
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down', 
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
                'w': 'up',
                's': 'down',
                'a': 'left', 
                'd': 'right'
            };
            
            const mappedKey = keyMap[e.key] || e.key.toLowerCase();
            this.keys[mappedKey] = true;
            
            if (e.key === ' ' && !this.gameRunning) {
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left', 
                'ArrowRight': 'right',
                'w': 'up',
                's': 'down',
                'a': 'left',
                'd': 'right'
            };
            
            const mappedKey = keyMap[e.key] || e.key.toLowerCase();
            this.keys[mappedKey] = false;
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning) {
                this.startGame();
            }
        });
    }
    
    updateTiltIndicator() {
        const dotX = 50 + (this.tiltX * 40);
        const dotY = 50 + (this.tiltY * 40);
        this.tiltDot.style.left = `${Math.max(5, Math.min(85, dotX))}px`;
        this.tiltDot.style.top = `${Math.max(5, Math.min(85, dotY))}px`;
    }
    
    resetGame() {
        this.score = 0;
        this.level = 1;
        this.snake = [{
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            vx: 0,
            vy: 0,
            radius: this.snakeRadius
        }];
        
        this.food = [];
        this.tylenol = [];
        this.holes = [];
        this.animations = [];
        this.isBumped = false;
        this.currentSpeed = this.normalSpeed;
        this.bumpTimer = 0;
        
        this.generateHoles();
        this.generateFood();
        this.updateUI();
    }
    
    generateHoles() {
        // No more holes for cleaner look
    }
    
    generateFood() {
        // Premium fruits and vegetables - fewer, higher quality
        const fruits = [
            { name: 'apple', emoji: '🍎', color: '#ff4757', points: 15 },
            { name: 'banana', emoji: '🍌', color: '#ffa502', points: 12 },
            { name: 'orange', emoji: '🍊', color: '#ff6348', points: 15 },
            { name: 'strawberry', emoji: '🍓', color: '#ff3838', points: 18 }
        ];
        
        const vegetables = [
            { name: 'carrot', emoji: '🥕', color: '#ffa502', points: 20 },
            { name: 'broccoli', emoji: '🥦', color: '#2ed573', points: 25 },
            { name: 'tomato', emoji: '🍅', color: '#ff4757', points: 15 }
        ];
        
        // Only add 1-2 food items at a time for healthy eating
        const foodCount = Math.random() < 0.5 ? 1 : 2;
        
        for (let i = 0; i < foodCount; i++) {
            const isFruit = Math.random() < 0.6; // Slightly favor fruits
            const items = isFruit ? fruits : vegetables;
            const item = items[Math.floor(Math.random() * items.length)];
            
            this.food.push({
                x: 100 + Math.random() * (this.canvas.width - 200),
                y: 100 + Math.random() * (this.canvas.height - 200),
                radius: 25, // Much bigger for kids
                holeId: -1,
                collected: false,
                type: 'fruit_vegetable',
                ...item
            });
        }
        
        // Add sick emoji occasionally
        if (Math.random() < 0.2) { // 20% chance
            this.food.push({
                x: 100 + Math.random() * (this.canvas.width - 200),
                y: 100 + Math.random() * (this.canvas.height - 200),
                radius: 20,
                holeId: -1,
                collected: false,
                type: 'sick',
                emoji: '🤢',
                color: '#ff6b6b',
                points: 0
            });
        }
        
        // Add Tylenol when sick
        if (this.isBumped) {
            this.tylenol.push({
                x: 100 + Math.random() * (this.canvas.width - 200),
                y: 100 + Math.random() * (this.canvas.height - 200),
                radius: 15,
                collected: false,
                type: 'tylenol',
                emoji: '💊',
                color: '#ffffff'
            });
        }
    }
    
    startGame() {
        this.gameRunning = true;
        document.getElementById('gameOver').style.display = 'none';
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.updateControls();
        this.updateSnake();
        this.checkCollisions();
        this.updateAnimations();
        this.updateUI();
    }
    
    updateAnimations() {
        // Update all animations
        this.animations = this.animations.filter(anim => {
            anim.timer++;
            return anim.timer < anim.maxTimer;
        });
    }
    
    updateControls() {
        // Handle keyboard input with proper key mapping
        if (this.keys['left']) this.tiltX = -0.8;
        else if (this.keys['right']) this.tiltX = 0.8;
        else this.tiltX *= 0.85;
        
        if (this.keys['up']) this.tiltY = -0.8;
        else if (this.keys['down']) this.tiltY = 0.8;
        else this.tiltY *= 0.85;
        
        // Update key indicator for desktop
        this.updateKeyIndicator();
    }
    
    updateKeyIndicator() {
        const activeKeys = [];
        if (this.keys['up']) activeKeys.push('↑');
        if (this.keys['down']) activeKeys.push('↓');
        if (this.keys['left']) activeKeys.push('←');
        if (this.keys['right']) activeKeys.push('→');
        
        this.activeKeysElement.textContent = activeKeys.length > 0 ? activeKeys.join(' ') : 'None';
    }
    
    updateSnake() {
        const head = this.snake[0];
        
        // Apply tilt forces (much more responsive for kids)
        head.vx += this.tiltX * 0.8 * this.currentSpeed;
        head.vy += this.tiltY * 0.8 * this.currentSpeed;
        
        // Apply gravity
        head.vy += this.gravity * this.currentSpeed;
        
        // Apply friction
        head.vx *= this.friction;
        head.vy *= this.friction;
        
        // Limit speed based on bump status
        const maxSpeed = this.maxSpeed * this.currentSpeed;
        const speed = Math.sqrt(head.vx * head.vx + head.vy * head.vy);
        if (speed > maxSpeed) {
            head.vx = (head.vx / speed) * maxSpeed;
            head.vy = (head.vy / speed) * maxSpeed;
        }
        
        // Update position
        head.x += head.vx;
        head.y += head.vy;
        
        // Wall collisions - lose a piece instead of game over
        if (head.x - head.radius < 0) {
            head.x = head.radius;
            head.vx *= -this.bounce;
            this.loseSnakePiece();
        }
        if (head.x + head.radius > this.canvas.width) {
            head.x = this.canvas.width - head.radius;
            head.vx *= -this.bounce;
            this.loseSnakePiece();
        }
        if (head.y - head.radius < 0) {
            head.y = head.radius;
            head.vy *= -this.bounce;
            this.loseSnakePiece();
        }
        if (head.y + head.radius > this.canvas.height) {
            head.y = this.canvas.height - head.radius;
            head.vy *= -this.bounce;
            this.loseSnakePiece();
        }
        
        // Update snake body segments
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const prevSegment = this.snake[i - 1];
            
            // Calculate distance to previous segment
            const dx = prevSegment.x - segment.x;
            const dy = prevSegment.y - segment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If too far, move towards previous segment
            if (distance > this.segmentDistance) {
                const moveX = (dx / distance) * (distance - this.segmentDistance);
                const moveY = (dy / distance) * (distance - this.segmentDistance);
                
                segment.x += moveX;
                segment.y += moveY;
            }
        }
    }
    
    checkCollisions() {
        const head = this.snake[0];
        
        // Check food collisions (fruits, vegetables, and sick emojis)
        this.food.forEach((food, index) => {
            if (food.collected) return;
            
            const dx = head.x - food.x;
            const dy = head.y - food.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < head.radius + food.radius) {
                if (food.type === 'sick') {
                    this.collectSick(food, index);
                } else {
                    this.collectFood(food, index);
                }
            }
        });
        
        // Check Tylenol collisions
        this.tylenol.forEach((tylenol, index) => {
            if (tylenol.collected) return;
            
            const dx = head.x - tylenol.x;
            const dy = head.y - tylenol.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < head.radius + tylenol.radius) {
                this.collectTylenol(tylenol, index);
            }
        });
        
        // Check self-collision - lose a piece instead of game over
        for (let i = 3; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const dx = head.x - segment.x;
            const dy = head.y - segment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < head.radius + segment.radius) {
                this.loseSnakePiece();
                return;
            }
        }
    }
    
    collectFood(food, index) {
        food.collected = true;
        this.score += food.points;
        
        // Add eating animation
        this.animations.push({
            type: 'eat',
            x: food.x,
            y: food.y,
            emoji: food.emoji,
            timer: 0,
            maxTimer: 20
        });
        
        // Add new segment
        const lastSegment = this.snake[this.snake.length - 1];
        this.snake.push({
            x: lastSegment.x,
            y: lastSegment.y,
            vx: 0,
            vy: 0,
            radius: this.snakeRadius * 0.8
        });
        
        // Remove collected food
        this.food.splice(index, 1);
        
        // Check for level advancement
        if (this.snake.length % 5 === 0) {
            this.advanceLevel();
        }
        
        // Generate new food if needed - only 1-2 items for healthy eating
        if (this.food.length < 2) {
            this.generateFood();
        }
    }
    
    collectSick(food, index) {
        food.collected = true;
        
        // Make snake sick
        this.isBumped = true;
        this.currentSpeed = this.wallBumpSpeed;
        this.bumpTimer = 0;
        
        // Add sick animation
        this.animations.push({
            type: 'sick',
            x: food.x,
            y: food.y,
            emoji: '🤢',
            timer: 0,
            maxTimer: 30
        });
        
        // Generate Tylenol
        this.generateFood();
        
        // Remove collected sick emoji
        this.food.splice(index, 1);
    }
    
    collectTylenol(tylenol, index) {
        tylenol.collected = true;
        this.score += 10;
        
        // Heal the snake
        this.isBumped = false;
        this.currentSpeed = this.normalSpeed;
        this.bumpTimer = 0;
        
        // Add big celebration animation
        this.animations.push({
            type: 'tylenol_celebration',
            x: tylenol.x,
            y: tylenol.y,
            emoji: '🎉',
            timer: 0,
            maxTimer: 60
        });
        
        // Remove collected Tylenol
        this.tylenol.splice(index, 1);
    }
    
    loseSnakePiece() {
        if (this.snake.length > 1) {
            // Remove last segment
            this.snake.pop();
            
            // Add ouch animation
            const head = this.snake[0];
            this.animations.push({
                type: 'ouch',
                x: head.x,
                y: head.y,
                emoji: '😵',
                timer: 0,
                maxTimer: 25
            });
        } else {
            // If only head left, game over
            this.gameOver();
        }
    }
    
    advanceLevel() {
        this.level++;
        
        // Add celebration animation
        this.animations.push({
            type: 'celebration',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            emoji: '🎉',
            timer: 0,
            maxTimer: 60
        });
        
        // Generate more food for next level
        this.generateFood();
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.snake.length;
        document.getElementById('level').textContent = this.level;
        document.getElementById('health').textContent = this.isBumped ? '😵' : '😊';
    }
    
    render() {
        // Clean blue gradient background like Fruit Ninja
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#667eea');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw fruits and vegetables with modern shadows
        this.food.forEach(food => {
            if (!food.collected) {
                this.drawFood(food);
            }
        });
        
        // Draw Tylenol
        this.tylenol.forEach(tylenol => {
            if (!tylenol.collected) {
                this.drawTylenol(tylenol);
            }
        });
        
        // Draw snake with modern style
        this.snake.forEach((segment, index) => {
            this.drawSnakeSegment(segment, index === 0);
        });
        
        // Draw animations
        this.animations.forEach(anim => {
            this.drawAnimation(anim);
        });
        
        // Draw start message with modern typography
        if (!this.gameRunning && this.snake.length === 1) {
            this.ctx.fillStyle = '#2c2c54';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🍎 Healthy Snake 🥕', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#40407a';
            this.ctx.fillText('Use Arrow Keys to Move', this.canvas.width / 2, this.canvas.height / 2 + 10);
        }
    }
    
    drawHole(hole) {
        // Hole shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(hole.x + 2, hole.y + 2, hole.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hole rim - kid-friendly brown
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Hole interior - earth colors
        const gradient = this.ctx.createRadialGradient(
            hole.x, hole.y, 0,
            hole.x, hole.y, hole.radius
        );
        gradient.addColorStop(0, '#cd853f');
        gradient.addColorStop(hole.depth, '#8b4513');
        gradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFood(food) {
        // Food glow
        this.ctx.shadowColor = food.color;
        this.ctx.shadowBlur = 8;
        
        // Food background circle
        this.ctx.fillStyle = food.color;
        this.ctx.beginPath();
        this.ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw emoji
        this.ctx.font = `${food.radius * 1.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(food.emoji, food.x, food.y);
        
        // Food highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(food.x - 3, food.y - 3, food.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTylenol(tylenol) {
        // Tylenol glow
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 6;
        
        // Tylenol background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(tylenol.x - tylenol.radius, tylenol.y - tylenol.radius, 
                         tylenol.radius * 2, tylenol.radius * 2);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw emoji
        this.ctx.font = `${tylenol.radius * 1.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tylenol.emoji, tylenol.x, tylenol.y);
        
        // Border
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(tylenol.x - tylenol.radius, tylenol.y - tylenol.radius, 
                           tylenol.radius * 2, tylenol.radius * 2);
    }
    
    drawSnakeSegment(segment, isHead) {
        if (isHead) {
            // Head glow - green for healthy snake
            this.ctx.shadowColor = this.isBumped ? '#ff6b6b' : '#4ecdc4';
            this.ctx.shadowBlur = 12;
        }
        
        // Segment body - different colors for head vs body
        if (isHead) {
            this.ctx.fillStyle = this.isBumped ? '#ff6b6b' : '#4ecdc4'; // Red when bumped, teal when healthy
        } else {
            this.ctx.fillStyle = this.isBumped ? '#ffb3b3' : '#a8e6cf'; // Light red when bumped, light green when healthy
        }
        
        this.ctx.beginPath();
        this.ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        if (isHead) {
            // Eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(segment.x - 6, segment.y - 6, 5, 0, Math.PI * 2);
            this.ctx.arc(segment.x + 6, segment.y - 6, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eye pupils - expression based on health
            this.ctx.fillStyle = '#2c2c54';
            this.ctx.beginPath();
            if (this.isBumped) {
                // Sad eyes
                this.ctx.arc(segment.x - 6, segment.y - 4, 3, 0, Math.PI * 2);
                this.ctx.arc(segment.x + 6, segment.y - 4, 3, 0, Math.PI * 2);
            } else {
                // Happy eyes
                this.ctx.arc(segment.x - 6, segment.y - 6, 3, 0, Math.PI * 2);
                this.ctx.arc(segment.x + 6, segment.y - 6, 3, 0, Math.PI * 2);
            }
            this.ctx.fill();
            
            // Mouth - expression based on health
            this.ctx.strokeStyle = '#2c2c54';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            if (this.isBumped) {
                // Sad mouth
                this.ctx.arc(segment.x, segment.y + 3, 8, Math.PI, 0);
            } else {
                // Happy mouth
                this.ctx.arc(segment.x, segment.y + 3, 8, 0, Math.PI);
            }
            this.ctx.stroke();
        }
    }
    
    drawAnimation(anim) {
        const progress = anim.timer / anim.maxTimer;
        const alpha = 1 - progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        if (anim.type === 'bump') {
            // Bump animation - stars around head
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💥', anim.x, anim.y - progress * 30);
        } else if (anim.type === 'eat') {
            // Eating animation - food emoji with sparkles
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 20);
            this.ctx.fillText('✨', anim.x + 15, anim.y - progress * 25);
            this.ctx.fillText('✨', anim.x - 15, anim.y - progress * 25);
        } else if (anim.type === 'sick') {
            // Sick animation - sick emoji with green cloud
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 25);
            this.ctx.fillText('💨', anim.x + 20, anim.y - progress * 30);
        } else if (anim.type === 'ouch') {
            // Ouch animation - dizzy stars
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 20);
            this.ctx.fillText('💫', anim.x + 10, anim.y - progress * 25);
            this.ctx.fillText('💫', anim.x - 10, anim.y - progress * 25);
        } else if (anim.type === 'tylenol_celebration') {
            // Big Tylenol celebration - multiple party emojis
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 50);
            this.ctx.fillText('🎊', anim.x + 40, anim.y - progress * 45);
            this.ctx.fillText('🎊', anim.x - 40, anim.y - progress * 45);
            this.ctx.fillText('✨', anim.x + 20, anim.y - progress * 55);
            this.ctx.fillText('✨', anim.x - 20, anim.y - progress * 55);
            this.ctx.fillText('🎉', anim.x, anim.y - progress * 60);
        } else if (anim.type === 'heal') {
            // Healing animation - sparkles
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 30);
        } else if (anim.type === 'celebration') {
            // Celebration animation - party emojis
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(anim.emoji, anim.x, anim.y - progress * 40);
            this.ctx.fillText('🎊', anim.x + 30, anim.y - progress * 35);
            this.ctx.fillText('🎊', anim.x - 30, anim.y - progress * 35);
        }
        
        this.ctx.restore();
    }
}

// Global functions
function restartGame() {
    game.resetGame();
    game.startGame();
}

// Initialize game
const game = new GravitySnake();
