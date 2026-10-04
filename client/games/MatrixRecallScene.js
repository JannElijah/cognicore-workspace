import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Matrix Recall spatial grid pattern scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (grid_cols, grid_rows, target_count, flash_duration) dynamically updated via REST API.
 * ================================================================================
 */
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class MatrixRecallScene extends BaseCognitiveScene {
    constructor() {
        super('MatrixRecallScene');
    }

    init(data) {
        // Core configuration passed from React
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        // DDA parameters (Spatial Visual Memory)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridCols = dda.grid_cols || 3;
        this.gridRows = dda.grid_rows || 3;
        this.targetCount = dda.target_count || 3;
        this.flashDuration = dda.flash_duration || 1200;

        // Cognitive Profile Archetype
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;

        // Game states
        this.score = 0;
        this.hits = 0; // successfully recalled matrices
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds session
        this.timeLeft = this.gameDuration;

        this.targets = []; // Stores indices of cells that are targets
        this.decoyTargets = []; // Stores indices of cell distractors (Visual Noise)
        this.playerSelections = []; // Stores indices clicked by player
        this.gamePhase = 'INTRO'; // INTRO | FLASHING | RECALL | FEEDBACK | GAMEOVER
        this.flashStartTime = 0; // Marks when the flash phase ended for timing

        this.gridCells = []; // Stores cell graphics reference
        this.countdownTimer = null;
        this.roundTimer = null;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
        this.ruleShiftLatency = 0;

        // Tutorial gating
        this.isTutorialActive = true;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Premium dark-mode tech background
        this.createStandardBackground();// Tech grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // 2. HUD Setup
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8') // neon blue
        });

        this.accuracyText = this.add.text(20, 50, 'ACCURACY: 100%', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(width - 20, 20, `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: (getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7') // neon purple
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Status instruction message
        this.statusText = this.add.text(width / 2, 90, 'PREPARING MATRIX...', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '22px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // 3. Draw grid (pre-draw cell visual blocks underneath)
        this.drawGrid();

        // 4. Pointer tracking
        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            if (gameObjects.length === 0) {
                const now = this.getTime();
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

        // Setup ML HUD & Tutorial Overlay
        createMlHud(this, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        createTutorialOverlay(this, {
            title: "MATRIX RECALL",
            domain: "spatial_visual_memory",
            instructions: "• Memorize the highlighted spatial nodes as they flash.\n\n• Click/tap the exact node sequence locations from memory.\n\n• DDA scales target grid sizing and decoy count.\n\n• Decoy cells flash red/coral at higher difficulty levels.",
            themeColorHex: parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16),
            onStart: () => this.startGameplay()
        });
    }

    drawGrid() {
        // Clear old cell containers if they exist
        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.glow) cell.glow.destroy();
        });
        this.gridCells = [];

        const width = this.scale.width;
        const height = this.scale.height;

        // Grid sizing details
        const gridAreaWidth = Math.min(380, width - 40);
        const gridAreaHeight = Math.min(380, width - 40);
        const spacing = 10;
        
        const totalSpacingX = spacing * (this.gridCols - 1);
        const totalSpacingY = spacing * (this.gridRows - 1);
        
        const cellWidth = (gridAreaWidth - totalSpacingX) / this.gridCols;
        const cellHeight = (gridAreaHeight - totalSpacingY) / this.gridRows;

        const startX = (width - gridAreaWidth) / 2 + cellWidth / 2;
        const startY = 160 + (gridAreaHeight - (cellHeight * this.gridRows + totalSpacingY)) / 2 + cellHeight / 2;

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const index = row * this.gridCols + col;
                const x = startX + col * (cellWidth + spacing);
                const y = startY + row * (cellHeight + spacing);

                // Base graphic: Dark glassmorphic square
                const cellBg = this.add.graphics();
                cellBg.setPosition(x, y);
                cellBg.fillStyle(0x1e293b, 0.45); // Glass grey
                cellBg.lineStyle(1.5, 0xffffff, 0.08); // Subtle border
                cellBg.fillRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                cellBg.strokeRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);

                // Glow graphic (overlay rendered during highlighting)
                const cellGlow = this.add.graphics();
                cellGlow.setPosition(x, y);
                cellGlow.setVisible(false);
                cellGlow.fillStyle(0xf59e0b, 0.6); // Gold/Orange highlight fill
                cellGlow.lineStyle(3, 0xfef08a, 0.9); // Brighter border
                cellGlow.fillRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                cellGlow.strokeRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);

                // Set Interactive area
                cellBg.setInteractive(new Phaser.Geom.Rectangle(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight), Phaser.Geom.Rectangle.Contains);

                // Click event
                cellBg.on('pointerdown', (pointer, localX, localY, event) => {
                    if (this.isTutorialActive) return;
                    if (event) event.stopPropagation();
                    this.handleCellInput(index);
                });

                // Hover micro-animations
                cellBg.on('pointerover', () => {
                    if (this.isTutorialActive) return;
                    if (this.gamePhase === 'RECALL' && !this.playerSelections.includes(index)) {
                        cellBg.clear();
                        cellBg.fillStyle(0x334155, 0.6);
                        cellBg.lineStyle(2, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16), 0.4);
                        cellBg.fillRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                        cellBg.strokeRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                    }
                });

                cellBg.on('pointerout', () => {
                    if (!this.playerSelections.includes(index)) {
                        cellBg.clear();
                        cellBg.fillStyle(0x1e293b, 0.45);
                        cellBg.lineStyle(1.5, 0xffffff, 0.08);
                        cellBg.fillRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                        cellBg.strokeRoundedRect(-cellWidth / 2, -cellHeight / 2, cellWidth, cellHeight, 6);
                    }
                });

                // Reference bindings
                const cellObj = {
                    index,
                    x,
                    y,
                    bg: cellBg,
                    glow: cellGlow,
                    cellWidth,
                    cellHeight
                };

                this.gridCells.push(cellObj);
            }
        }
    }

updateTimer() {
        if (!this.sessionStartTime || this.timeLeft <= 0) return;
        
        const elapsed = this.getTime() - this.sessionStartTime;
        this.timeLeft = Math.max(0, this.gameDuration - elapsed);
        const seconds = Math.ceil(this.timeLeft / 1000);
        
        if (this.timerText && this.timerText.active) {
            this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);
        }

        if (this.timeLeft <= 0 && !this.isGameOver) {
            this.isGameOver = true;
            this.endGame();
        }
    }

    startNewRound() {
        if (this.timeLeft <= 0) return;

        this.gamePhase = 'FLASHING';
        this.playerSelections = [];
        
        // Reset grid cells styling
        this.gridCells.forEach(cell => {
            cell.glow.setVisible(false);
            cell.bg.clear();
            cell.bg.fillStyle(0x1e293b, 0.45);
            cell.bg.lineStyle(1.5, 0xffffff, 0.08);
            cell.bg.fillRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
            cell.bg.strokeRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
        });

        this.statusText.setText('WATCH CAREFULLY!').setFill('#e9d5ff'); // light purple

        // Generate target cell indexes randomly
        this.targets = [];
        this.decoyTargets = [];
        const totalCells = this.gridCols * this.gridRows;
        const indices = Array.from({ length: totalCells }, (_, i) => i);
        Phaser.Utils.Array.Shuffle(indices);
        this.targets = indices.slice(0, this.targetCount);

        // Serious Game Improvement: Decoy grids for levels 3+
        if (this.difficultyLevel >= 3) {
            const remaining = indices.slice(this.targetCount);
            const decoyCount = Math.min(remaining.length, this.difficultyLevel - 1);
            this.decoyTargets = remaining.slice(0, decoyCount);
        }

        console.log('[Matrix Recall] Targets:', this.targets, 'Decoys:', this.decoyTargets);

        // Flash targets (Gold/Cyan) and decoys (Coral/Red) simultaneously
        this.targets.forEach(index => {
            this.highlightCell(index, 0xef4444, 0xfca5a5, this.flashDuration); // Red target glow
        });
        this.decoyTargets.forEach(index => {
            this.highlightCell(index, 0x38bdf8, 0xffffff, this.flashDuration); // Cyan decoy glow
        });

        // Transition to recall phase after the flash duration ends
        this.time.delayedCall(this.flashDuration, () => {
            if (this.gamePhase !== 'FLASHING') return;
            
            // Hide all glows
            this.gridCells.forEach(cell => {
                if (this.targets.includes(cell.index) || this.decoyTargets.includes(cell.index)) {
                    cell.glow.setVisible(false);
                }
            });

            this.gamePhase = 'RECALL';
            this.flashStartTime = this.getTime();
            this.stimulusSpawnTime = this.getTime();
            this.firstInteractionRegistered = false;
            this.firstInteractionLatency = 0;
            this.statusText.setText('RECALL PATTERN!').setFill((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8')); // neon blue
            
            this.tweens.add({
                targets: this.statusText,
                scale: 1.08,
                duration: 200,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
        });
    }

    highlightCell(index, fillColor, strokeColor, duration) {
        const cell = this.gridCells.find(c => c.index === index);
        if (!cell) return;

        const glow = cell.glow;
        glow.clear();
        glow.fillStyle(fillColor, 0.8);
        glow.lineStyle(3, strokeColor, 0.95);
        glow.fillRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
        glow.strokeRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
        glow.setVisible(true);

        this.tweens.add({
            targets: [cell.bg, cell.glow],
            scale: 1.08,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    handleCellInput(index) {
        if (this.gamePhase !== 'RECALL') return;
        if (this.playerSelections.includes(index)) return; // Prevent double-clicking same cell

        // Capture rule-shift latency (time since flash ended to first click)
        if (this.playerSelections.length === 0) {
            this.ruleShiftLatency = this.getTime() - this.flashStartTime;
        }

        this.playerSelections.push(index);

        const clickedCell = this.gridCells.find(c => c.index === index);
        if (clickedCell && clickedCell.hoverGlow) {
            clickedCell.hoverGlow.setVisible(false);
        }

        if (this.targets.includes(index)) {
            // Correct cell clicked
            const cell = this.gridCells.find(c => c.index === index);
            if (cell) {
                // Highlight block in neon green/teal
                cell.glow.clear();
                cell.glow.fillStyle(0x10b981, 0.7); // Emerald green
                cell.glow.lineStyle(3, 0xa7f3d0, 0.95);
                cell.glow.fillRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
                cell.glow.strokeRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
                cell.glow.setVisible(true);

                this.tweens.add({
                    targets: [cell.bg, cell.glow],
                    scale: 1.06,
                    duration: 100,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            }

            // If player clicked all correct targets
            const correctClicksCount = this.playerSelections.filter(x => this.targets.includes(x)).length;
            if (correctClicksCount === this.targets.length) {
                this.handleSuccessfulRecall();
            }
        } else {
            // Wrong cell clicked (Round Fail)
            this.handleFailedRecall(index);
        }
    }

    handleSuccessfulRecall() {
        this.gamePhase = 'FEEDBACK';

        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        }
        this.hits++;
        this.totalAttempts++;

        const recallTime = this.getTime() - this.flashStartTime;
        
        // Calculate dynamic reward score
        const baseReward = 100 * this.targetCount;
        const speedBonus = Math.max(0, Math.round((10000 - recallTime) / 10)); // faster yields more points
        const roundScore = baseReward + speedBonus;
        this.score += roundScore;

        this.showFloatingFeedback(`+${roundScore} PERFECT!`, '#10b981');
        this.statusText.setText('SUCCESS!').setFill('#10b981');
        this.cameras.main.flash(100, 16, 185, 129, 0.15); // soft green splash

        this.updateHUD();

        // Dispatch telemetry
        this.dispatchMetricTelemetry(recallTime, 1.0);

        // Trigger next round
        this.scheduleNextRound();
    }

    handleFailedRecall(wrongIndex) {
        this.gamePhase = 'FEEDBACK';
        this.totalAttempts++;

        const recallTime = this.getTime() - this.flashStartTime;

        // Highlight wrong tile in red
        const cell = this.gridCells.find(c => c.index === wrongIndex);
        if (cell) {
            cell.glow.clear();
            cell.glow.fillStyle(0xef4444, 0.7); // Red
            cell.glow.lineStyle(3, 0xfecaca, 0.95);
            cell.glow.fillRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
            cell.glow.strokeRoundedRect(-cell.cellWidth / 2, -cell.cellHeight / 2, cell.cellWidth, cell.cellHeight, 6);
            cell.glow.setVisible(true);
        }

        // Highlight the correct missing targets in gold/orange to guide feedback learning
        this.targets.forEach(idx => {
            if (!this.playerSelections.includes(idx)) {
                const targetCell = this.gridCells.find(c => c.index === idx);
                if (targetCell) {
                    targetCell.glow.clear();
                    targetCell.glow.fillStyle(0xf59e0b, 0.5); // Gold/Orange
                    targetCell.glow.lineStyle(2.5, 0xfef08a, 0.8);
                    targetCell.glow.fillRoundedRect(-targetCell.cellWidth / 2, -targetCell.cellHeight / 2, targetCell.cellWidth, targetCell.cellHeight, 6);
                    targetCell.glow.strokeRoundedRect(-targetCell.cellWidth / 2, -targetCell.cellHeight / 2, targetCell.cellWidth, targetCell.cellHeight, 6);
                    targetCell.glow.setVisible(true);
                }
            }
        });

        // Shake camera
        this.cameras.main.shake(150, 0.008);

        this.showFloatingFeedback('INCORRECT CELL', '#ef4444');
        this.statusText.setText('PATTERN BROKEN!').setFill('#ef4444');

        this.updateHUD();

        // Dispatch telemetry with 0 accuracy
        this.dispatchMetricTelemetry(recallTime, 0.0);

        // Trigger next round
        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(1650, () => {
            if (this.timeLeft <= 0) return;
            
            // Check with DDA after every 3 rounds
            if (this.totalAttempts % 3 === 0) {
                this.adaptDifficulty();
            } else {
                this.startNewRound();
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

    // ==========================================
    // CLOSED-LOOP DDA & TELEMETRY BRIDGE
    // ==========================================

    async dispatchMetricTelemetry(recallTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        // Calculate errors: in MatrixRecall, if they failed, the round error is 1. If succeeded, 0.
        const errorVal = roundAccuracy === 1.0 ? 0 : 1;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "spatial_visual_memory",
            game_type: "matrix_recall",
            reaction_time: recallTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: errorVal,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount,
            rule_shift_latency_ms: this.ruleShiftLatency || 0.0
        };

        try {
            console.log('[Telemetry Dispatch] Sending Matrix Recall metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Connection offline, telemetry buffered.', e);
        }
    }

    async adaptDifficulty() {
        this.startNewRound(); // Fire-and-forget: start next round immediately
        if (!this.sessionId) return;
this.statusText.setText('SYNCING ADAPTATION...').setFill('#64748b');

        try {
            console.log('[DDA Bridge] Checking Matrix Recall scaling profiles...');
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const params = data.dda_parameters;
                    const difficultyChanged = this.difficultyLevel !== params.difficulty_level;
                    const gridChanged = this.gridCols !== params.grid_cols || this.gridRows !== params.grid_rows;

                    this.difficultyLevel = params.difficulty_level !== undefined ? params.difficulty_level : this.difficultyLevel;
                    this.gridCols = params.grid_cols !== undefined ? params.grid_cols : this.gridCols;
                    this.gridRows = params.grid_rows !== undefined ? params.grid_rows : this.gridRows;
                    this.targetCount = params.target_count !== undefined ? params.target_count : this.targetCount;
                    this.flashDuration = params.flash_duration !== undefined ? params.flash_duration : this.flashDuration;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (difficultyChanged) {
                        this.showFloatingFeedback(`DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, (getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7'));
                    }

                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                        updateMlHud(this);
                    }

                    // Re-render grid layout dynamically if structure changed
                    if (gridChanged) {
                        console.log(`[DDA Scale] Re-drawing grid to cols: ${this.gridCols}, rows: ${this.gridRows}`);
                        this.drawGrid();
                    }
                }
            }
        }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.roundTimer) this.roundTimer.remove();

        this.gamePhase = 'GAMEOVER';

        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.glow) cell.glow.destroy();
        });
        this.gridCells = [];

        console.log('[Matrix Recall Game Over] Telemetry summary:', {
            score: this.score,
            hits: this.hits,
            misses: this.totalAttempts - this.hits,
            accuracy: this.accuracy
        });

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                hits: this.hits,
                misses: this.totalAttempts - this.hits,
                accuracy: this.accuracy,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms: this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount,
                rule_shift_latency_ms: this.ruleShiftLatency || 0.0
            });
        }
    }

    startGameplay() {
        this.sessionStartTime = this.getTime();
        this.isGameOver = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.time.delayedCall(800, () => {
            this.startNewRound();
        });
    }
}
