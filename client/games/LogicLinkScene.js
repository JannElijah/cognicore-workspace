/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Logic Link sequencing game scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (grid_size, sequence_length, distractors count) updated via REST API.
 * ================================================================================
 */
import Phaser from 'phaser';

export default class LogicLinkScene extends Phaser.Scene {
    constructor() {
        super('LogicLinkScene');
    }

    init(data) {
        // Core configuration passed from React wrapper
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || 'http://127.0.0.1:5000';
        this.onGameOver = data.onGameOver || null;

        // DDA variables (Reasoning & Problem Solving)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridSize = dda.grid_size || 3;
        this.sequenceLength = dda.sequence_length || 3;
        this.distractorsCount = dda.distractors || 0;

        // Cognitive Profile Archetype
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds
        this.timeLeft = this.gameDuration;

        this.gridCells = [];      // Stores container grid nodes
        this.sequenceNodes = [];   // Stores correct sequence node indexes in order
        this.clickedSequence = []; // Stores node coordinates clicked by user
        this.gamePhase = 'PLAYING'; // PLAYING | FEEDBACK | GAMEOVER
        this.puzzleStartTime = 0;
        
        this.countdownTimer = null;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
        this.puzzleClicksCount = 0;
        this.ruleShiftLatency = 0;

        // Tutorial state
        this.isTutorialActive = true;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Gradient dark background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x09090b, 0x09090b, 0x1e1b4b, 0x1e1b4b, 1);
        bg.fillRect(0, 0, width, height);

        // Grid lines decoration
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#f59e0b' // gold color for logic theme
        });

        this.accuracyText = this.add.text(20, 50, 'ACCURACY: 100%', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
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

        this.statusText = this.add.text(width / 2, 90, 'LINK IN ASCENDING ORDER!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // Graphics Layer for drawing glowing paths
        this.lineGraphics = this.add.graphics();

        // 3. Pointer tracking
        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (this.isTutorialActive) return;
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
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
        });

        // 4. ML Feedback HUD setup
        this.mlHudText = this.add.text(20, height - 35, '', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            fill: '#f59e0b'
        });
        this.updateMlHud();

        // 5. Build and gate with Tutorial Overlay
        this.drawTutorialOverlay(width, height);
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
        this.clickedSequence = [];
        this.lineGraphics.clear();

        this.stimulusSpawnTime = this.time.now;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.puzzleClicksCount = 0;
        this.ruleShiftLatency = 0;
        this.statusText.setText('LINK IN ASCENDING ORDER!').setFill('#e2e8f0');

        const width = this.scale.width;
        const height = this.scale.height;

        // Sizing logic
        const gridAreaSize = 360;
        const spacing = 12;
        const totalSpacing = spacing * (this.gridSize - 1);
        const cellSize = (gridAreaSize - totalSpacing) / this.gridSize;

        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 160 + (gridAreaSize - cellSize * this.gridSize - totalSpacing) / 2 + cellSize / 2;

        // Clean up previous cells
        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.txt) cell.txt.destroy();
        });
        this.gridCells = [];

        // Generate indexes list
        const totalNodes = this.gridSize * this.gridSize;
        const availableIndexes = Array.from({ length: totalNodes }, (_, idx) => idx);
        Phaser.Utils.Array.Shuffle(availableIndexes);

        // Pick sequence cells
        this.sequenceNodes = availableIndexes.slice(0, this.sequenceLength);
        
        // Pick distractor cells
        const distractorNodes = availableIndexes.slice(this.sequenceLength, this.sequenceLength + this.distractorsCount);

        // Draw grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const x = startX + col * (cellSize + spacing);
                const y = startY + row * (cellSize + spacing);

                const bg = this.add.graphics();
                bg.setPosition(x, y);

                // Default empty style
                bg.fillStyle(0x1e293b, 0.45);
                bg.lineStyle(1.5, 0xffffff, 0.08);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);

                let numberVal = 0;
                let txt = null;
                
                // If it is in the sequence list
                if (this.sequenceNodes.includes(index)) {
                    numberVal = this.sequenceNodes.indexOf(index) + 1;

                    // Redraw active numbered node style
                    bg.clear();
                    bg.fillStyle(0x1e1b4b, 0.7);
                    bg.lineStyle(2.5, 0xf59e0b, 0.8); // Glowing gold border
                    bg.fillCircle(0, 0, cellSize * 0.4);
                    bg.strokeCircle(0, 0, cellSize * 0.4);

                    // Add label
                    txt = this.add.text(x, y, numberVal.toString(), {
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: `${cellSize * 0.35}px`,
                        fontWeight: '900',
                        fill: '#ffffff'
                    }).setOrigin(0.5);
                } 
                // If it is a distractor
                else if (distractorNodes.includes(index)) {
                    numberVal = -1; // -1 represents distractor

                    bg.clear();
                    bg.fillStyle(0x334155, 0.5); // flat gray
                    bg.lineStyle(1.5, 0xffffff, 0.1);
                    bg.fillCircle(0, 0, cellSize * 0.4);
                    bg.strokeCircle(0, 0, cellSize * 0.4);
                }

                // Interactive click bounds
                bg.setInteractive(new Phaser.Geom.Circle(0, 0, cellSize * 0.45), Phaser.Geom.Circle.Contains);
                bg.on('pointerdown', (pointer, localX, localY, event) => {
                    if (this.isTutorialActive) return;
                    if (event) event.stopPropagation();
                    this.handleNodeClick(index, numberVal, x, y, bg, txt, cellSize);
                });

                // Hover triggers (visual magnetic snapping expansion)
                bg.on('pointerover', () => {
                    if (this.isTutorialActive) return;
                    if (this.gamePhase === 'PLAYING') {
                        this.tweens.add({
                            targets: [bg, txt].filter(Boolean),
                            scale: 1.15,
                            duration: 100,
                            ease: 'Back.easeOut'
                        });
                        bg.lineStyle(3.5, numberVal > 0 ? 0xf59e0b : 0xef4444, 0.95);
                        bg.strokeCircle(0, 0, cellSize * 0.45);
                    }
                });

                bg.on('pointerout', () => {
                    if (this.isTutorialActive) return;
                    if (this.gamePhase === 'PLAYING') {
                        this.tweens.add({
                            targets: [bg, txt].filter(Boolean),
                            scale: 1.0,
                            duration: 100,
                            ease: 'Power1'
                        });
                        bg.lineStyle(
                            numberVal > 0 ? 2.5 : 1.5, 
                            numberVal > 0 ? 0xf59e0b : 0xffffff, 
                            numberVal > 0 ? 0.8 : 0.08
                        );
                        bg.strokeCircle(0, 0, cellSize * 0.45);
                    }
                });

                const cellObj = {
                    index,
                    x,
                    y,
                    bg,
                    txt,
                    numberVal,
                    cellSize
                };
                this.gridCells.push(cellObj);
            }
        }

        this.puzzleStartTime = this.time.now;
    }

    handleNodeClick(index, value, x, y, bg, txt, cellSize) {
        if (this.gamePhase !== 'PLAYING') return;
        if (this.isTutorialActive) return;

        this.puzzleClicksCount++;

        // Track latency from puzzle start to first node interaction
        if (this.puzzleClicksCount === 1) {
            this.ruleShiftLatency = this.time.now - this.puzzleStartTime;
        }

        const correctNextVal = this.clickedSequence.length + 1;

        if (value === correctNextVal) {
            // Correct click in sequence
            this.clickedSequence.push({ x, y, index, bg, txt, cellSize });

            // Animate node green border pop
            bg.clear();
            bg.fillStyle(0x064e3b, 0.7);
            bg.lineStyle(3, 0x10b981, 0.95); // Green border
            bg.fillCircle(0, 0, cellSize * 0.4);
            bg.strokeCircle(0, 0, cellSize * 0.4);

            // Re-draw glowing path connection line
            this.redrawLines(0x10b981);

            // Pop scaling animation
            this.tweens.add({
                targets: txt ? [bg, txt] : bg,
                scale: 1.1,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeOut'
            });

            // If sequence completed successfully
            if (this.clickedSequence.length === this.sequenceLength) {
                this.handleSuccessfulPath();
            }
        } else {
            // Mistake clicked (clicked distractor or wrong order node)
            this.handleFailedPath(index, x, y, bg, txt, cellSize);
        }
    }

    redrawLines(colorHex) {
        this.lineGraphics.clear();
        if (this.clickedSequence.length < 2) return;

        this.lineGraphics.lineStyle(4, colorHex, 0.85);
        for (let i = 0; i < this.clickedSequence.length - 1; i++) {
            const a = this.clickedSequence[i];
            const b = this.clickedSequence[i + 1];
            this.lineGraphics.lineBetween(a.x, a.y, b.x, b.y);
        }
    }

    handleSuccessfulPath() {
        this.gamePhase = 'FEEDBACK';
        this.hits++;
        this.totalAttempts++;

        const solveTime = this.time.now - this.puzzleStartTime;
        
        // Calculate dynamic reward
        const baseReward = 150 * this.sequenceLength;
        const speedBonus = Math.max(0, Math.round((15000 - solveTime) / 10));
        const roundScore = baseReward + speedBonus;
        this.score += roundScore;

        this.showFloatingFeedback(`+${roundScore} PERFECT LINK!`, '#10b981');
        this.statusText.setText('LOGIC SOLVED!').setFill('#10b981');
        this.cameras.main.flash(100, 16, 185, 129, 0.15); // soft green splash

        this.updateHUD();

        // Dispatch telemetry
        this.dispatchMetricTelemetry(solveTime, 1.0);

        // Schedule next round
        this.scheduleNextPuzzle();
    }

    handleFailedPath(wrongIndex, x, y, bg, txt, cellSize) {
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.totalAttempts++;

        const solveTime = this.time.now - this.puzzleStartTime;

        // Turn line connections red
        this.redrawLines(0xef4444);

        // Highlight clicked wrong node in red
        bg.clear();
        bg.fillStyle(0x7f1d1d, 0.7);
        bg.lineStyle(3, 0xef4444, 0.95);
        bg.fillCircle(0, 0, cellSize * 0.4);
        bg.strokeCircle(0, 0, cellSize * 0.4);

        // Shake camera
        this.cameras.main.shake(150, 0.008);

        this.showFloatingFeedback('LINK BROKEN!', '#ef4444');
        this.statusText.setText('PATHWAY CONFLICT!').setFill('#ef4444');

        this.updateHUD();

        // Dispatch telemetry with 0 accuracy
        this.dispatchMetricTelemetry(solveTime, 0.0);

        // Schedule next round
        this.scheduleNextPuzzle();
    }

    scheduleNextPuzzle() {
        this.time.delayedCall(1600, () => {
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
        
        if (this.totalAttempts > 0) {
            this.accuracy = this.hits / this.totalAttempts;
        } else {
            this.accuracy = 1.0;
        }
        
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
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
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }

    // ==========================================
    // CLOSED-LOOP DDA & TELEMETRY BRIDGE
    // ==========================================

    async dispatchMetricTelemetry(solveTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const efficiency = this.puzzleClicksCount > 0 ? Math.min(1.0, this.sequenceLength / this.puzzleClicksCount) : 1.0;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "logical_mathematical",
            game_type: "logic_link",
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount,
            path_efficiency: efficiency,
            rule_shift_latency_ms: this.ruleShiftLatency || 0.0
        };

        try {
            console.log('[Telemetry Dispatch] Sending logic metrics...', payload);
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
            console.log('[DDA Bridge] Checking logic scaling profiles...');
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
                    this.sequenceLength = params.sequence_length;
                    this.distractorsCount = params.distractors;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);

                    if (difficultyChanged) {
                        this.showFloatingFeedback(`DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a855f7');
                    }

                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                        this.updateMlHud();
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

        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.txt) cell.txt.destroy();
        });
        this.gridCells = [];
        this.lineGraphics.clear();

        console.log('[Logic Link Game Over] Telemetry summary:', {
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
                spam_click_count: this.spamClickCount,
                rule_shift_latency_ms: this.ruleShiftLatency || 0.0
            });
        }
    }

    drawTutorialOverlay(width, height) {
        // Semi-transparent blocking panel
        const overlayBg = this.add.graphics();
        overlayBg.fillStyle(0x09090b, 0.88);
        overlayBg.fillRect(0, 0, width, height);
        overlayBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        const modal = this.add.graphics();
        const modalW = 550;
        const modalH = 400;
        const modalX = (width - modalW) / 2;
        const modalY = (height - modalH) / 2;

        modal.lineStyle(2.5, 0xf59e0b, 0.95);
        modal.fillStyle(0x0f172a, 0.96);
        modal.fillRoundedRect(modalX, modalY, modalW, modalH, 16);
        modal.strokeRoundedRect(modalX, modalY, modalW, modalH, 16);

        const title = this.add.text(width / 2, modalY + 40, 'LOGIC LINK', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#f59e0b',
            letterSpacing: '0.1em'
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, modalY + 80, 'COGNITIVE DOMAIN: LOGICAL-MATHEMATICAL REASONING', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontWeight: '700',
            fill: '#a855f7'
        }).setOrigin(0.5);

        const divider = this.add.graphics();
        divider.lineStyle(1.5, 0x1e293b, 1);
        divider.lineBetween(modalX + 40, modalY + 110, modalX + modalW - 40, modalY + 110);

        const instructions = this.add.text(width / 2, modalY + 140, 
            "• Connect the glowing numbered nodes in ascending order (1 → 2 → 3).\n\n" +
            "• Hover close to nodes to visually trigger the magnetic snapping scale-up.\n\n" +
            "• Click/tap the correct next node in the sequence to draw connections.\n\n" +
            "• Mismatch clicks or incorrect sequencing breaks the logic pathway.", {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fill: '#94a3b8',
            lineSpacing: 8
        }).setOrigin(0.5, 0);

        const btnW = 220;
        const btnH = 50;
        const btnX = width / 2;
        const btnY = modalY + modalH - 60;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xf59e0b, 0.85);
        btnBg.lineStyle(2, 0xffffff, 0.9);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

        const btnText = this.add.text(btnX, btnY, 'LAUNCH MODULE', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);

        btnBg.setInteractive(new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains);
        
        btnBg.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xd97706, 1);
            btnBg.lineStyle(2.5, 0xffffff, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        });

        btnBg.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xf59e0b, 0.85);
            btnBg.lineStyle(2, 0xffffff, 0.9);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        });

        btnBg.on('pointerdown', () => {
            overlayBg.destroy();
            modal.destroy();
            title.destroy();
            subtitle.destroy();
            divider.destroy();
            instructions.destroy();
            btnBg.destroy();
            btnText.destroy();

            this.isTutorialActive = false;
            this.startGameplay();
        });
    }

    startGameplay() {
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.startNewPuzzle();
    }

    updateMlHud() {
        if (this.mlHudText) {
            const conf = Math.round(this.archetypeConfidence * 100);
            this.mlHudText.setText(
                `ML FEEDBACK HUD | COGNITIVE ARCHETYPE: ${this.archetype.toUpperCase()} (${conf}% CONFIDENCE) | DDA: LVL ${this.difficultyLevel.toFixed(1)}`
            );
        }
    }
}
