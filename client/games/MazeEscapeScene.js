import Phaser from 'phaser';

export default class MazeEscapeScene extends Phaser.Scene {
    constructor() {
        super('MazeEscapeScene');
    }

    init(data) {
        // Core configuration passed from React wrapper
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || 'http://127.0.0.1:5000';
        this.onGameOver = data.onGameOver || null;

        // DDA variables (Problem Solving)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridSize = dda.grid_size || 6;
        this.maxMoves = dda.max_moves || 20;
        this.blockedRatio = dda.blocked_ratio || 0.1;

        // Session Stats
        this.score = 0;
        this.hits = 0; // successfully solved mazes
        this.misses = 0; // failed mazes (run out of moves/time)
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds session
        this.timeLeft = this.gameDuration;

        this.gridCells = [];       // 2D grid storing cell objects
        this.playerGridX = 0;
        this.playerGridY = 0;
        this.movesLeft = this.maxMoves;
        this.isMoving = false;
        this.gamePhase = 'PLAYING'; // PLAYING | FEEDBACK | GAMEOVER
        this.puzzleStartTime = 0;
        this.optimalMoves = 0;
        this.actualMoves = 0;

        this.countdownTimer = null;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Dark gradient tech background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x09090b, 0x09090b, 0x1e1b4b, 0x1e1b4b, 1);
        bg.fillRect(0, 0, width, height);

        // Tech grid lines decoration
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#10b981' // emerald green for problem solving theme
        });

        this.movesText = this.add.text(20, 50, `ENERGY MOVES: ${this.movesLeft}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#38bdf8'
        });

        this.accuracyText = this.add.text(20, 80, 'SUCCESS RATE: 100%', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(width - 20, 20, `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#a855f7'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(width / 2, 90, 'ESCAPE THE LABYRINTH!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // Keyboard Controls
        this.input.keyboard.on('keydown', (event) => {
            if (this.gamePhase !== 'PLAYING' || this.isMoving) return;

            let dx = 0;
            let dy = 0;
            const key = event.key.toLowerCase();
            
            if (key === 'arrowup' || key === 'w') {
                dy = -1;
            } else if (key === 'arrowdown' || key === 's') {
                dy = 1;
            } else if (key === 'arrowleft' || key === 'a') {
                dx = -1;
            } else if (key === 'arrowright' || key === 'd') {
                dx = 1;
            }

            if (dx !== 0 || dy !== 0) {
                const nx = this.playerGridX + dx;
                const ny = this.playerGridY + dy;

                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                    const cell = this.gridCells[ny][nx];
                    if (!cell.isBlocked) {
                        this.movePlayerAlongPath([[this.playerGridX, this.playerGridY], [nx, ny]]);
                    } else {
                        // Tiny shake to signal blocked
                        this.cameras.main.shake(50, 0.002);
                    }
                }
            }
        });

        // Start Countdown Timer
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // Draw first maze
        this.startNewPuzzle();

        // Micro-behavior tracking listeners
        this.input.on('pointerdown', (pointer, gameObjects) => {
            this.registerFirstInteraction();
            if (gameObjects.length === 0) {
                const now = this.time.now;
                if (now - this.lastMissTime < 200) {
                    this.spamClickCount++;
                }
                this.lastMissTime = now;
            }
        });

        this.input.on('pointermove', () => {
            this.registerFirstInteraction();
        });
    }

    updateTimer() {
        this.timeLeft -= 1000;
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    startNewPuzzle() {
        if (this.timeLeft <= 0) return;

        this.gamePhase = 'PLAYING';
        this.isMoving = false;
        this.playerGridX = 0;
        this.playerGridY = 0;
        this.movesLeft = this.maxMoves;
        this.statusText.setText('ESCAPE THE LABYRINTH!').setFill('#e2e8f0');
        this.updateHUD();

        this.stimulusSpawnTime = this.time.now;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;

        const width = this.scale.width;

        // Maze sizing & centering
        const gridAreaSize = 360;
        const cellSize = gridAreaSize / this.gridSize;
        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 160 + cellSize / 2;

        // Destroy previous maze grid
        this.gridCells.forEach(row => {
            row.forEach(cell => {
                if (cell.bg) cell.bg.destroy();
                if (cell.label) cell.label.destroy();
            });
        });
        this.gridCells = [];

        // 1. Generate guaranteed staircase walkway to goal (N-1, N-1)
        const walkSteps = [];
        for (let i = 0; i < this.gridSize - 1; i++) {
            walkSteps.push([1, 0]); // right
            walkSteps.push([0, 1]); // down
        }
        Phaser.Utils.Array.Shuffle(walkSteps);

        const guaranteedSet = new Set();
        guaranteedSet.add('0,0');
        let tempX = 0;
        let tempY = 0;
        for (const [dx, dy] of walkSteps) {
            tempX += dx;
            tempY += dy;
            guaranteedSet.add(`${tempX},${tempY}`);
        }

        // 2. Build grid cell data and draw
        for (let r = 0; r < this.gridSize; r++) {
            const rowCells = [];
            for (let c = 0; c < this.gridSize; c++) {
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;
                const key = `${c},${r}`;

                // Determine if blocked
                let isBlocked = false;
                if (key !== '0,0' && key !== `${this.gridSize-1},${this.gridSize-1}`) {
                    if (!guaranteedSet.has(key)) {
                        isBlocked = Math.random() < this.blockedRatio;
                    }
                }

                const bg = this.add.graphics();
                bg.setPosition(x, y);

                // Styling
                if (isBlocked) {
                    bg.fillStyle(0x7f1d1d, 0.45); // Dark red block
                    bg.lineStyle(1.5, 0xef4444, 0.2); // Red border
                    bg.fillRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                    bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                } else {
                    bg.fillStyle(0x1e293b, 0.35); // Walkable grey-blue
                    bg.lineStyle(1, 0xffffff, 0.05); // Subtle border
                    bg.fillRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                    bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                }

                // Add special elements for start and exit
                let labelText = '';
                if (c === 0 && r === 0) {
                    // Start Marker
                    bg.lineStyle(2, 0x10b981, 0.7); // Green ring
                    bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                } else if (c === this.gridSize - 1 && r === this.gridSize - 1) {
                    // Goal Exit Star
                    bg.lineStyle(2, 0xf59e0b, 0.8);
                    bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                    bg.fillStyle(0xf59e0b, 0.85);
                    bg.fillCircle(0, 0, cellSize * 0.22);
                    labelText = 'EXIT';
                }

                const label = this.add.text(x, y, labelText, {
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: `${cellSize * 0.22}px`,
                    fontWeight: 'bold',
                    fill: '#000000'
                }).setOrigin(0.5);

                // Enable pointer interactions on walkable cells
                if (!isBlocked) {
                    bg.setInteractive(new Phaser.Geom.Rectangle(-cellSize / 2, -cellSize / 2, cellSize, cellSize), Phaser.Geom.Rectangle.Contains);
                    bg.on('pointerdown', (pointer, localX, localY, event) => {
                        if (event) event.stopPropagation();
                        this.handleCellClick(c, r);
                    });

                    bg.on('pointerover', () => {
                        if (this.gamePhase === 'PLAYING' && !this.isMoving) {
                            bg.lineStyle(2, 0x38bdf8, 0.7); // Cyan highlight border
                            bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                        }
                    });

                    bg.on('pointerout', () => {
                        if (this.gamePhase === 'PLAYING') {
                            bg.clear();
                            bg.fillStyle(0x1e293b, 0.35);
                            bg.lineStyle(1, 0xffffff, 0.05);
                            bg.fillRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                            bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                            
                            // redraw start/goal boundary if unhovered
                            if (c === 0 && r === 0) {
                                bg.lineStyle(2, 0x10b981, 0.7);
                                bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                            } else if (c === this.gridSize - 1 && r === this.gridSize - 1) {
                                bg.lineStyle(2, 0xf59e0b, 0.8);
                                bg.strokeRoundedRect(-cellSize / 2 + 1, -cellSize / 2 + 1, cellSize - 2, cellSize - 2, 4);
                                bg.fillStyle(0xf59e0b, 0.85);
                                bg.fillCircle(0, 0, cellSize * 0.22);
                            }
                        }
                    });
                }

                rowCells.push({
                    col: c,
                    row: r,
                    x,
                    y,
                    bg,
                    label,
                    isBlocked
                });
            }
            this.gridCells.push(rowCells);
        }

        // Calculate optimal moves and reset actual moves
        const optimalPath = this.findBFSPath(0, 0, this.gridSize - 1, this.gridSize - 1);
        this.optimalMoves = optimalPath ? (optimalPath.length - 1) : 0;
        this.actualMoves = 0;

        // Draw Player Sprite Core (cyan-glowing orb)
        this.playerSprite = this.add.graphics();
        this.playerSprite.setPosition(startX, startY);
        this.playerSprite.fillStyle(0x06b6d4, 1); // inner core
        this.playerSprite.fillCircle(0, 0, cellSize * 0.25);
        this.playerSprite.lineStyle(3, 0x22d3ee, 0.85); // glowing border
        this.playerSprite.strokeCircle(0, 0, cellSize * 0.29);

        this.puzzleStartTime = this.time.now;
    }

    handleCellClick(tx, ty) {
        if (this.gamePhase !== 'PLAYING' || this.isMoving) return;

        // Pathfinder search
        const path = this.findBFSPath(this.playerGridX, this.playerGridY, tx, ty);
        if (path && path.length > 1) {
            const stepsCount = path.length - 1;
            if (stepsCount <= this.movesLeft) {
                this.movePlayerAlongPath(path);
            } else {
                this.showFloatingFeedback('NOT ENOUGH ENERGY!', '#ef4444');
                this.cameras.main.shake(100, 0.003);
            }
        } else {
            // Shake screen to indicate unreachable
            this.cameras.main.shake(100, 0.003);
        }
    }

    findBFSPath(startX, startY, endX, endY) {
        const queue = [[startX, startY, []]];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const [cx, cy, path] = queue.shift();

            if (cx === endX && cy === endY) {
                return [...path, [cx, cy]];
            }

            const dirs = [
                [0, 1],   // down
                [1, 0],   // right
                [0, -1],  // up
                [-1, 0]   // left
            ];

            for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                    const isBlocked = this.gridCells[ny][nx].isBlocked;
                    if (!isBlocked && !visited.has(key)) {
                        visited.add(key);
                        queue.push([nx, ny, [...path, [cx, cy]]]);
                    }
                }
            }
        }
        return null;
    }

    movePlayerAlongPath(path) {
        if (!path || path.length <= 1) return;
        this.isMoving = true;

        path.shift(); // remove current position node

        const moveNext = () => {
            if (path.length === 0 || this.gamePhase !== 'PLAYING') {
                this.isMoving = false;
                return;
            }

            const [nx, ny] = path.shift();
            this.movesLeft--;
            this.actualMoves++;
            this.updateHUD();

            const cell = this.gridCells[ny][nx];

            // Animate transition
            this.tweens.add({
                targets: this.playerSprite,
                x: cell.x,
                y: cell.y,
                duration: 120,
                onComplete: () => {
                    this.playerGridX = nx;
                    this.playerGridY = ny;

                    // Evaluate success/failure
                    if (nx === this.gridSize - 1 && ny === this.gridSize - 1) {
                        this.isMoving = false;
                        this.handleSuccessfulEscape();
                    } else if (this.movesLeft <= 0) {
                        this.isMoving = false;
                        this.handleFailedEscape();
                    } else {
                        moveNext();
                    }
                }
            });
        };

        moveNext();
    }

    handleSuccessfulEscape() {
        this.gamePhase = 'FEEDBACK';
        this.hits++;
        this.totalAttempts++;

        const solveTime = this.time.now - this.puzzleStartTime;
        
        // Dynamic reward score
        const baseReward = 200 * this.difficultyLevel;
        const movesBonus = this.movesLeft * 25;
        const speedBonus = Math.max(0, Math.round((20000 - solveTime) / 10));
        const roundScore = baseReward + movesBonus + speedBonus;
        this.score += roundScore;

        this.showFloatingFeedback(`+${roundScore} ESCAPED!`, '#10b981');
        this.statusText.setText('MAZE CLEARED!').setFill('#10b981');
        this.cameras.main.flash(120, 16, 185, 129, 0.15); // green splash

        this.updateHUD();

        // Dispatch telemetry
        const pathEfficiency = this.actualMoves > 0 ? (this.optimalMoves / this.actualMoves) : 0.0;
        this.dispatchMetricTelemetry(solveTime, 1.0, pathEfficiency);

        this.scheduleNextRound();
    }

    handleFailedEscape() {
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.totalAttempts++;

        const solveTime = this.time.now - this.puzzleStartTime;

        // Turn player core red
        this.playerSprite.clear();
        const cellSize = 360 / this.gridSize;
        this.playerSprite.fillStyle(0xef4444, 1);
        this.playerSprite.fillCircle(0, 0, cellSize * 0.25);
        this.playerSprite.lineStyle(3, 0xfca5a5, 0.85);
        this.playerSprite.strokeCircle(0, 0, cellSize * 0.29);

        // Shake camera
        this.cameras.main.shake(180, 0.008);

        this.showFloatingFeedback('ENERGY DRAINED!', '#ef4444');
        this.statusText.setText('MAZE ESCAPE FAILED!').setFill('#ef4444');

        this.updateHUD();

        // Dispatch telemetry with 0 accuracy
        this.dispatchMetricTelemetry(solveTime, 0.0, 0.0);

        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(1800, () => {
            if (this.timeLeft <= 0) return;

            // Query DDA adaptations every 3 puzzles
            if (this.totalAttempts % 3 === 0) {
                this.adaptDifficulty();
            } else {
                this.startNewPuzzle();
            }
        });
    }

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.movesText.setText(`ENERGY MOVES: ${this.movesLeft}`);
        
        if (this.totalAttempts > 0) {
            this.accuracy = this.hits / this.totalAttempts;
        } else {
            this.accuracy = 1.0;
        }
        
        this.accuracyText.setText(`SUCCESS RATE: ${Math.round(this.accuracy * 100)}%`);
    }

    showFloatingFeedback(text, color) {
        const width = this.scale.width;
        const txt = this.add.text(width / 2, 135, text, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: 110,
            alpha: 0,
            duration: 1200,
            onComplete: () => txt.destroy()
        });
    }

    async dispatchMetricTelemetry(solveTimeMs, roundAccuracy, pathEfficiency = 0.0) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "executive_strategy",
            game_type: "maze_escape",
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount,
            path_efficiency: pathEfficiency
        };

        try {
            console.log('[Telemetry Dispatch] Sending maze metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Connection failed, logging locally.', e);
        }
    }

    registerFirstInteraction() {
        if (!this.firstInteractionRegistered && this.stimulusSpawnTime > 0) {
            this.firstInteractionLatency = this.time.now - this.stimulusSpawnTime;
            this.firstInteractionRegistered = true;
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        this.statusText.setText('SYNCING ADAPTATION...').setFill('#64748b');

        try {
            console.log('[DDA Bridge] Checking maze scaling profiles...');
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const params = data.dda_parameters;
                    const difficultyChanged = this.difficultyLevel !== params.difficulty_level;

                    this.difficultyLevel = params.difficulty_level;
                    this.gridSize = params.grid_size;
                    this.maxMoves = params.max_moves;
                    this.blockedRatio = params.blocked_ratio;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);

                    if (difficultyChanged) {
                        this.showFloatingFeedback(`DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a855f7');
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed, using current configurations.', e);
        }

        this.startNewPuzzle();
    }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();

        this.gridCells.forEach(row => {
            row.forEach(cell => {
                if (cell.bg) cell.bg.destroy();
                if (cell.label) cell.label.destroy();
            });
        });
        this.gridCells = [];
        if (this.playerSprite) this.playerSprite.destroy();

        console.log('[Maze Escape Game Over] Telemetry summary:', {
            score: this.score,
            hits: this.hits,
            misses: this.misses,
            accuracy: this.accuracy
        });

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                hits: this.hits,
                misses: this.misses,
                accuracy: this.accuracy,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms: this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount
            });
        }
    }
}
