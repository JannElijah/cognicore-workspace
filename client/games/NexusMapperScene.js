import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class NexusMapperScene extends BaseCognitiveScene {
    constructor() {
        super('NexusMapperScene');
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridSize = dda.grid_size || 3;
        this.targetCount = dda.target_count || 2;
        this.flashDuration = dda.flash_duration || 2000;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45s
        this.timeLeft = this.gameDuration;

        this.gridCells = []; // 2D array of cell graphics
        this.layout = []; // current items positions
        this.recallTargets = []; // list of items to recall
        this.currentRecallTarget = null;
        this.gamePhase = 'MEMORIZE'; // MEMORIZE | RECALL | FEEDBACK | GAMEOVER
        this.puzzleStartTime = 0;

        // Visual letters used as glyphs
        this.glyphsPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        // Timers
        this.countdownTimer = null;

        // Telemetry metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Deep cyber slate-blue gradient
        this.createStandardBackground();// Tech grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x0ea5e9, 0.03);
        grid.setOrigin(0.5);

        // HUD Text
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8') // light cyan
        });

        this.accuracyText = this.add.text(20, 50, 'ACCURACY: 100%', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '14px',
            fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(width - 20, 20, `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8')
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(width / 2, 90, 'MEMORIZE LETTER LOCATIONS!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: '900',
            fill: (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8'),
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // Background click spam check
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

        createMlHud(this, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        createTutorialOverlay(this, {
            title: "NEXUS MAPPER",
            domain: "spatial_visual_memory",
            instructions: "• Memorize the letter locations on the node map.\n\n• Reconstruct their positions from memory.\n\n• Accuracy and response times govern difficulty.",
            themeColorHex: parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16),
            onStart: () => this.startGameplay()
        });
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
        this.startNewPuzzle();
    }

updateTimer() {
        if (!this.sessionStartTime || this.isGameOver) return;
        
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

    startNewPuzzle() {
        if (this.timeLeft <= 0 || this.gamePhase === 'GAMEOVER') return;

        this.gamePhase = 'MEMORIZE';
        this.statusText.setText('MEMORIZE LETTER LOCATIONS!').setFill((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8'));

        // Cleanup previous layouts
        this.gridCells.forEach(row => {
            row.forEach(cell => {
                if (cell.bg) cell.bg.destroy();
                if (cell.text) cell.text.destroy();
            });
        });
        this.gridCells = [];
        this.layout = [];

        const width = this.scale.width;
        const gridAreaSize = Math.min(320, width - 40);
        const cellSize = gridAreaSize / this.gridSize;
        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 160 + cellSize / 2;

        // Build coordinate grid
        for (let r = 0; r < this.gridSize; r++) {
            const rowCells = [];
            for (let c = 0; c < this.gridSize; c++) {
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;

                const bg = this.add.graphics();
                bg.setPosition(x, y);
                bg.fillStyle(0x1e293b, 0.45);
                bg.lineStyle(1.5, 0x334155, 1);
                bg.fillRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                bg.strokeRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                bg.setInteractive(new Phaser.Geom.Rectangle(-cellSize / 2, -cellSize / 2, cellSize, cellSize), Phaser.Geom.Rectangle.Contains);

                const text = this.add.text(x, y, '', {
                    fontFamily: CogniTheme.fonts.body,
                    fontSize: `${cellSize * 0.35}px`,
                    fontWeight: 'bold',
                    fill: (getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8')
                }).setOrigin(0.5);

                rowCells.push({ c, r, x, y, bg, text, glyph: null });

                // Grid click interaction
                bg.on('pointerdown', (pointer, localX, localY, event) => {
                    if (this.isTutorialActive) return;
                    if (event) event.stopPropagation();
                    this.registerFirstInteraction();
                    this.handleCellClick(c, r);
                });

                bg.on('pointerover', () => {
                    if (this.gamePhase === 'RECALL') {
                        bg.lineStyle(2, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16), 0.85);
                        bg.strokeRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                    }
                });

                bg.on('pointerout', () => {
                    if (this.gamePhase === 'RECALL') {
                        bg.clear();
                        bg.fillStyle(0x1e293b, 0.45);
                        bg.lineStyle(1.5, 0x334155, 1);
                        bg.fillRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                        bg.strokeRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                    }
                });
            }
            this.gridCells.push(rowCells);
        }

        // Place distinct glyphs in random nodes
        const indices = Array.from({ length: this.gridSize * this.gridSize }, (_, i) => i);
        Phaser.Utils.Array.Shuffle(indices);

        const activeGlyphs = this.glyphsPool.slice(0, this.targetCount);
        activeGlyphs.forEach((glyph, index) => {
            const gridIndex = indices[index];
            const row = Math.floor(gridIndex / this.gridSize);
            const col = gridIndex % this.gridSize;

            const cell = this.gridCells[row][col];
            cell.glyph = glyph;
            cell.text.setText(glyph);

            this.layout.push({ col, row, glyph });
        });

        // Set stimulus spawn timestamps for hesitation checks
        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;

        // Hide glyphs after flashDuration
        this.time.delayedCall(this.flashDuration, () => {
            if (this.gamePhase === 'MEMORIZE') {
                this.gridCells.forEach(row => {
                    row.forEach(cell => {
                        cell.text.setText('');
                    });
                });
                this.gamePhase = 'RECALL';
                // Players expect alphabetical sequence. Reverse layout so pop() returns A -> B -> C
                this.recallTargets = [...this.layout].reverse();
                this.promptNextRecall();
            }
        });
    }

    promptNextRecall() {
        if (this.recallTargets.length === 0) {
            this.handleSuccess();
            return;
        }

        this.currentRecallTarget = this.recallTargets.pop();
        this.statusText.setText(`FIND THE EXACT LOCATION FOR: '${this.currentRecallTarget.glyph}'`).setFill('#0ea5e9');
        this.puzzleStartTime = this.getTime();
    }

    handleCellClick(c, r) {
        if (this.gamePhase !== 'RECALL' || !this.currentRecallTarget) return;

        const solveTime = this.getTime() - this.puzzleStartTime;
        const cell = this.gridCells[r][c];

        if (cell.glyph === this.currentRecallTarget.glyph) {
            // Hit (Correct position recall)

            if (this.showParticleBurst) {
                const px = this.input.activePointer.x || this.scale.width / 2;
                const py = this.input.activePointer.y || this.scale.height / 2;
                this.showParticleBurst(px, py, 0xf59e0b);
            }
    
        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, 0xf59e0b);
        }
        this.hits++;
            this.totalAttempts++;
            cell.text.setText(cell.glyph).setFill('#10b981'); // show green correct glyph
            
            const points = 100 * this.difficultyLevel + Math.max(0, Math.round((10000 - solveTime) / 10));
            this.score += points;
            this.showFloatingFeedback(`+${points} FOUND!`, '#10b981');
            this.dispatchMetricTelemetry(solveTime, 1.0);

            this.promptNextRecall();
        } else {
            // Miss (Incorrect position click)
            this.misses++;
            this.totalAttempts++;
            this.cameras.main.shake(100, 0.004);

            // Temporarily flash clicked box border red
            const bg = cell.bg;
            const cellSize = 320 / this.gridSize;
            bg.clear();
            bg.fillStyle(0x7f1d1d, 0.55);
            bg.lineStyle(2, 0xef4444, 1);
            bg.fillRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
            bg.strokeRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);

            this.time.delayedCall(500, () => {
                if (this.gamePhase === 'RECALL') {
                    bg.clear();
                    bg.fillStyle(0x1e293b, 0.45);
                    bg.lineStyle(1.5, 0x334155, 1);
                    bg.fillRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                    bg.strokeRoundedRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 6);
                }
            });

            this.showFloatingFeedback('WRONG POSITION!', '#ef4444');
            this.dispatchMetricTelemetry(solveTime, 0.0);
            
            // Re-queue the target to try again
            this.recallTargets.push(this.currentRecallTarget);
            this.promptNextRecall();
        }

        this.updateHUD();
    }

    handleSuccess() {
        this.gamePhase = 'FEEDBACK';
        this.statusText.setText('GRID SYNCHRONIZATION LOCKED!').setFill('#10b981');
        this.cameras.main.flash(120, 16, 185, 129, 0.12);

        this.time.delayedCall(1500, () => {
            if (this.timeLeft <= 0) return;
            
            // adapt difficulty every 3 puzzles
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

    async dispatchMetricTelemetry(solveTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "spatial_visual_memory",
            game_type: "NexusMapper",
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        try {
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Failed to send NexusMapper telemetry', e);
        }
    }

    async adaptDifficulty() {
        this.startNewPuzzle(); // Fire-and-forget: start next round immediately
        if (!this.sessionId) return;
try {
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
                    const diffChanged = this.difficultyLevel !== params.difficulty_level;

                    this.difficultyLevel = params.difficulty_level !== undefined ? params.difficulty_level : this.difficultyLevel;
                    this.gridSize = params.grid_size !== undefined ? params.grid_size : this.gridSize;
                    this.targetCount = params.target_count !== undefined ? params.target_count : this.targetCount;
                    this.flashDuration = params.flash_duration !== undefined ? params.flash_duration : this.flashDuration;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (diffChanged) {
                        this.showFloatingFeedback(`LEVEL ADJUSTED: LEVEL ${this.difficultyLevel}`, '#0ea5e9');
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed', e);
        }

        }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();

        this.gridCells.forEach(row => {
            row.forEach(cell => {
                if (cell.bg) cell.bg.destroy();
                if (cell.text) cell.text.destroy();
            });
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
