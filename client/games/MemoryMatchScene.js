import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Memory Match spatial sequence scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (grid_size, sequence_length, flash_duration) dynamically updated via REST API.
 * ================================================================================
 */
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class MemoryMatchScene extends BaseCognitiveScene {
    constructor() {
        super('MemoryMatchScene');
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        // Core configuration passed from React
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        // DDA parameters
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridSize = dda.grid_size || 3;             // 3x3, 4x4, 5x5 grid
        this.sequenceLength = dda.sequence_length || 3;   // sequence to remember
        this.flashDuration = dda.flash_duration || 1000;   // ms per flash

        // Game states
        this.score = 0;
        this.correctSequences = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds session
        this.timeLeft = this.gameDuration;

        this.sequence = [];
        this.playerSequence = [];
        this.gamePhase = 'INTRO'; // INTRO | FLASHING | RECALL | FEEDBACK | GAMEOVER
        this.sequenceEndTime = 0; // Marks when the flash phase ended

        this.gridCells = []; // Stores cell container objects
        this.countdownTimer = null;
        this.roundTimer = null;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
        this.telemetryBuffer = [];
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Premium dark-mode tech background
        this.createStandardBackground();// Tech grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // 2. HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#4ade80' // neon green
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
        this.statusText = this.add.text(width / 2, 90, 'PREPARING TRAINING...', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '22px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // 3. Draw grid and begin
        this.drawGrid();

        createMlHud(this, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        createTutorialOverlay(this, {
            title: "MEMORY MATCH",
            domain: "spatial_visual_memory",
            instructions: "• Click cards to flip them and reveal their symbols.\n\n• Find matching pairs in as few moves as possible.\n\n• DDA adapts grid sizes based on your memory recall speed.",
            themeColorHex: parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16),
            onStart: () => this.startGameplay()
        });

        // Micro-behavior tracking listeners
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
    }

    drawGrid() {
        // Object Pooling: Do not destroy cells. Reuse existing ones to prevent GC spikes.
        if (!this.gridCells) {
            this.gridCells = [];
        }
        const width = this.scale.width;
        const height = this.scale.height;

        // Grid sizing details
        const gridAreaSize = Math.min(380, width - 40);
        const spacing = 12;
        const totalSpacing = spacing * (this.gridSize - 1);
        const cellSize = (gridAreaSize - totalSpacing) / this.gridSize;

        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 160 + (gridAreaSize - cellSize * this.gridSize - totalSpacing) / 2 + cellSize / 2;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const x = startX + col * (cellSize + spacing);
                const y = startY + row * (cellSize + spacing);
                let cellObj;
                if (index < this.gridCells.length) {
                    // Reuse existing pooled cell
                    cellObj = this.gridCells[index];
                    cellObj.bg.setPosition(x, y);
                    cellObj.glow.setPosition(x, y);
                    cellObj.label.setPosition(x, y);
                    cellObj.bg.setVisible(true);
                    cellObj.label.setVisible(true);
                    
                    // Rebind interactive area since cell size might have changed
                    cellObj.bg.input.hitArea.setTo(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
                } else {
                    // Base graphic: Dark glassmorphic square
                    const cellBg = this.add.graphics();
                    cellBg.setPosition(x, y);
                    cellBg.fillStyle(0x1e293b, 0.45); // Glass grey
                    cellBg.lineStyle(1.5, 0xffffff, 0.08); // Subtle border
                    cellBg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
                    cellBg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);

                    // Glow graphic (overlay rendered during highlighting)
                    const cellGlow = this.add.graphics();
                    cellGlow.setPosition(x, y);
                    cellGlow.setVisible(false);
                    cellGlow.fillStyle(parseInt((getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7').replace('#', '0x'), 16), 0.6); // Purple highlight fill
                    cellGlow.lineStyle(3, 0xd8b4fe, 0.9); // Brighter border
                    cellGlow.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
                    cellGlow.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);

                    // Label showing row/col indexes in spatial terms
                    const cellLabel = this.add.text(x, y, '', {
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        fill: '#475569'
                    }).setOrigin(0.5);

                    // Set Interactive area
                    cellBg.setInteractive(new Phaser.Geom.Rectangle(-cellSize / 2, -cellSize / 2, cellSize, cellSize), Phaser.Geom.Rectangle.Contains);

                    // Click event
                    cellBg.on('pointerdown', (pointer, localX, localY, event) => {
                        if (this.isTutorialActive) return;
                        if (event) event.stopPropagation();
                        this.handleCellInput(cellObj.index);
                    });

                    // Hover micro-animations
                    cellBg.on('pointerover', () => {
                        if (this.gamePhase === 'RECALL') {
                            cellBg.clear();
                            cellBg.fillStyle(0x334155, 0.6);
                            cellBg.lineStyle(2, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16), 0.4);
                            cellBg.fillRoundedRect(-cellObj.cellSize / 2, -cellObj.cellSize / 2, cellObj.cellSize, cellObj.cellSize, 8);
                            cellBg.strokeRoundedRect(-cellObj.cellSize / 2, -cellObj.cellSize / 2, cellObj.cellSize, cellObj.cellSize, 8);
                        }
                    });

                    cellBg.on('pointerout', () => {
                        cellBg.clear();
                        cellBg.fillStyle(0x1e293b, 0.45);
                        cellBg.lineStyle(1.5, 0xffffff, 0.08);
                        cellBg.fillRoundedRect(-cellObj.cellSize / 2, -cellObj.cellSize / 2, cellObj.cellSize, cellObj.cellSize, 8);
                        cellBg.strokeRoundedRect(-cellObj.cellSize / 2, -cellObj.cellSize / 2, cellObj.cellSize, cellObj.cellSize, 8);
                    });

                    // Reference bindings
                    cellObj = {
                        index,
                        bg: cellBg,
                        glow: cellGlow,
                        label: cellLabel,
                        cellSize
                    };

                    this.gridCells.push(cellObj);
                }
                
                // Always update the cellSize reference
                cellObj.cellSize = cellSize;
                
                // Redraw graphics for the cell since size might have changed
                cellObj.bg.clear();
                cellObj.bg.fillStyle(0x1e293b, 0.45);
                cellObj.bg.lineStyle(1.5, 0xffffff, 0.08);
                cellObj.bg.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
                cellObj.bg.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
                
                cellObj.glow.clear();
                cellObj.glow.fillStyle(parseInt((getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7').replace('#', '0x'), 16), 0.6);
                cellObj.glow.lineStyle(3, 0xd8b4fe, 0.9);
                cellObj.glow.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
                cellObj.glow.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
            }
        }
        
        // Hide unused pooled cells
        const requiredCells = this.gridSize * this.gridSize;
        for (let i = requiredCells; i < this.gridCells.length; i++) {
            this.gridCells[i].bg.setVisible(false);
            this.gridCells[i].glow.setVisible(false);
            this.gridCells[i].label.setVisible(false);
        }
    }

    startGameplay() {
        this.sessionStartTime = this.getTime();
        this.isGameOver = false;
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        this.startNewRound();
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
        this.playerSequence = [];
        this.statusText.setText('WATCH CAREFULLY!').setAlpha(1).setFill('#c084fc');

        // Generate target sequence
        this.sequence = [];
        const totalTilesCount = this.gridSize * this.gridSize;
        for (let i = 0; i < this.sequenceLength; i++) {
            const randIndex = Phaser.Math.Between(0, totalTilesCount - 1);
            this.sequence.push(randIndex);
        }

        console.log('[Memory Match] Generated Sequence:', this.sequence);

        // Flash sequence in order
        this.flashSequence();
    }

    flashSequence() {
        let delayOffset = 500; // brief pause before starting
        const stepDelay = this.flashDuration;

        this.sequence.forEach((cellIndex, step) => {
            this.time.delayedCall(delayOffset, () => {
                if (this.gamePhase !== 'FLASHING') return;
                this.highlightCell(cellIndex, parseInt((getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7').replace('#', '0x'), 16), stepDelay * 0.7); // purple flash
            });
            delayOffset += stepDelay;
        });

        // Wait until all flashes are complete to transition to player input
        this.time.delayedCall(delayOffset - 100, () => {
            if (this.gamePhase !== 'FLASHING') return;
            this.gamePhase = 'RECALL';
            this.sequenceEndTime = this.getTime();
            this.stimulusSpawnTime = this.getTime();
            this.firstInteractionRegistered = false;
            this.firstInteractionLatency = 0;
            this.statusText.setText('REPEAT SEQUENCE!').setFill((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8'));
            
            // Micro-pulsing scale animation on status text
            this.tweens.add({
                targets: this.statusText,
                scale: 1.08,
                duration: 200,
                yoyo: true,
                ease: 'Quad.easeInOut'
            });
        });
    }

    highlightCell(index, color, duration = 400) {
        const cell = this.gridCells.find(c => c.index === index);
        if (!cell) return;

        const glow = cell.glow;
        const cellSize = cell.cellSize;

        glow.clear();
        glow.fillStyle(color, 0.75);
        glow.lineStyle(3.5, 0xffffff, 0.95);
        glow.fillRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
        glow.strokeRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 8);
        glow.setVisible(true);

        // Tween pop scaling
        this.tweens.add({
            targets: [cell.bg, cell.glow, cell.label],
            scale: 1.12,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                glow.setVisible(false);
            }
        });

        // Safeguard visibility reset
        this.time.delayedCall(duration, () => {
            glow.setVisible(false);
        });
    }

    handleCellInput(index) {
        if (this.gamePhase !== 'RECALL') return;

        const stepIdx = this.playerSequence.length;
        const expectedIndex = this.sequence[stepIdx];
        this.playerSequence.push(index);

        if (index === expectedIndex) {
            // Correct click
            this.highlightCell(index, 0x06b6d4, 250); // Neon blue flash
            
            // If the user has matched the full sequence
            if (this.playerSequence.length === this.sequence.length) {
                this.handleSuccessfulSequence();
            }
        } else {
            // Mismatch clicked (Failure)
            this.handleFailedSequence(index);
        }
    }

    handleSuccessfulSequence() {
        this.gamePhase = 'FEEDBACK';

        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        }
        this.correctSequences++;
        this.totalAttempts++;

        const recallTime = this.getTime() - this.sequenceEndTime;
        
        // Calculate dynamic reward score
        const baseReward = 100 * this.sequenceLength;
        const speedBonus = Math.max(0, Math.round((12000 - recallTime) / 10)); // faster yields more points
        const roundScore = baseReward + speedBonus;
        this.score += roundScore;

        this.showFloatingFeedback(`+${roundScore} PERFECT!`, '#22c55e');
        this.statusText.setText('SUCCESS!').setFill('#22c55e');

        this.updateHUD();

        // Dispatch telemetry
        this.dispatchMetricTelemetry(recallTime, 1.0);

        // Trigger next round
        this.scheduleNextRound();
    }

    handleFailedSequence(wrongIndex) {
        this.gamePhase = 'FEEDBACK';
        this.totalAttempts++;

        const recallTime = this.getTime() - this.sequenceEndTime;
        
        // Highlight wrong tile in red
        this.highlightCell(wrongIndex, 0xef4444, 500);
        
        // Flash the correct tile in gold to guide user feedback learning
        const correctIndex = this.sequence[this.playerSequence.length - 1];
        this.time.delayedCall(250, () => {
            this.highlightCell(correctIndex, 0xf59e0b, 500); // Gold helper highlight
        });

        // Shake camera
        this.cameras.main.shake(150, 0.008);

        this.showFloatingFeedback('INCORRECT RECALL', '#ef4444');
        this.statusText.setText('SEQUENCE BROKEN!').setFill('#ef4444');

        this.updateHUD();

        // Dispatch telemetry with 0 accuracy for this sequence mismatch
        this.dispatchMetricTelemetry(recallTime, 0.0);

        // Trigger next round
        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(1600, () => {
            if (this.timeLeft <= 0) return;
            
            // Check with DDA after every 3 sequences
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
            this.accuracy = this.correctSequences / this.totalAttempts;
        } else {
            this.accuracy = 1.0;
        }
        
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    // ==========================================
    // CLOSED-LOOP DDA & TELEMETRY BRIDGE
    // ==========================================

    dispatchMetricTelemetry(recallTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "spatial_visual_memory",
            game_type: "memory_match",
            reaction_time: recallTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        if (!this.telemetryBuffer) {
            this.telemetryBuffer = [];
        }
        this.telemetryBuffer.push(payload);
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        this.statusText.setText('SYNCING ADAPTATION...').setFill('#64748b');

        // Flush telemetry in batch before querying DDA updates
        await this.flushGlobalTelemetry();

        try {
            console.log('[DDA Bridge] Checking memory scaling profiles...');
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
                    const gridSizeChanged = this.gridSize !== params.grid_size;

                    this.difficultyLevel = params.difficulty_level;
                    this.gridSize = params.grid_size;
                    this.sequenceLength = params.sequence_length;
                    this.flashDuration = params.flash_duration;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (difficultyChanged) {
                        const direction = difficultyChanged && params.difficulty_level > this.difficultyLevel ? 'INCREASED' : 'ADJUSTED';
                        this.showFloatingFeedback(`DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, (getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7'));
                    }

                    // Re-render grid mapping dynamically if size scales (e.g. 3x3 -> 4x4)
                    if (gridSizeChanged) {
                        console.log(`[DDA Scale] Re-drawing grid to grid size: ${this.gridSize}`);
                        this.drawGrid();
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection timeout, keeping current config.', e);
        }

        // Start next round
        this.startNewRound();
    }

    async endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.roundTimer) this.roundTimer.remove();

        this.gamePhase = 'GAMEOVER';

        // Flush remaining telemetry before closing session
        await this.flushGlobalTelemetry();

        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.glow) cell.glow.destroy();
            if (cell.label) cell.label.destroy();
        });
        this.gridCells = [];

        console.log('[Memory Match Game Over] Telemetry summary:', {
            score: this.score,
            hits: this.correctSequences,
            misses: this.totalAttempts - this.correctSequences,
            accuracy: this.accuracy
        });

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                hits: this.correctSequences,
                misses: this.totalAttempts - this.correctSequences,
                accuracy: this.accuracy,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms: this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount
            });
        }
    }
}
