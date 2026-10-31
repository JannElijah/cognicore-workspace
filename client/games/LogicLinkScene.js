import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class LogicLinkScene extends BaseCognitiveScene {
    constructor() {
        super('LogicLinkScene');
    }

    init(data) {
        // Core configuration passed from React wrapper
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        // DDA variables (Hybrid Trail Making + Memory Masking)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.gridSize = dda.grid_size || 4;
        this.sequenceLength = dda.sequence_length || 4;
        this.distractorsCount = dda.distractors !== undefined ? dda.distractors : 3;
        this.sequenceMode = dda.sequence_mode || (this.difficultyLevel === 2 || this.difficultyLevel === 3 || this.difficultyLevel === 5 ? 'alternating' : 'numbers');
        this.memoryMask = dda.memory_mask !== undefined ? dda.memory_mask : (this.difficultyLevel >= 4);

        // Cognitive Profile Archetype
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.consecutiveHits = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds session
        this.timeLeft = this.gameDuration;

        this.gridCells = [];
        this.sequenceTokens = [];
        this.clickedSequence = [];
        this.isMasked = false;
        this.gamePhase = 'PLAYING';
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

        this.createStandardBackground();
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#f59e0b'
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
            fill: (getComputedStyle(document.body).getPropertyValue('--color-secondary').trim() || '#a855f7')
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Dynamic Status/Guidance Prompt
        this.statusText = this.add.text(width / 2, 80, 'INITIALIZING LOGIC PATHWAY...', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '20px',
            fontWeight: '800',
            fill: '#f59e0b',
            letterSpacing: '0.04em'
        }).setOrigin(0.5, 0);

        // Graphics Layer for drawing glowing paths
        this.lineGraphics = this.add.graphics();

        // Pointer tracking listeners
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
        createMlHud(this, 0xf59e0b);
        createTutorialOverlay(this, {
            title: "LOGIC LINK: HYBRID",
            domain: "logical_mathematical",
            instructions: "• Connect targets in strict sequence:\n  - Lvl 1: Numbers (1 -> 2 -> 3 -> 4)\n  - Lvl 2-3: Alternating Trail (1 -> A -> 2 -> B -> 3 -> C)\n  - Lvl 4-5: Memory Mask (memorize board, tiles turn to '?' on first click!)\n\n• Beware of Decoy Traps: Fake numbers and letters are scattered across the board — ignore them!\n\n• Speed Bonus: Plan your path before clicking to rack up huge combo points.",
            themeColorHex: 0xf59e0b,
            onStart: () => this.startGameplay()
        });

        // Bottom Legend (hidden until gameplay starts)
        this.createLegend(width, height);
    }

    createLegend(width, height) {
        const legendY = 625;
        this.legendContainer = this.add.container(width / 2, legendY);
        this.legendContainer.setVisible(false);

        const bg = this.add.graphics();
        bg.fillStyle(0x1e293b, 0.96);
        bg.lineStyle(2, 0x475569, 1.0);
        bg.fillRoundedRect(-410, -32, 820, 64, 14);
        bg.strokeRoundedRect(-410, -32, 820, 64, 14);
        this.legendContainer.add(bg);

        // 1. Target node legend
        const targetBg = this.add.graphics();
        targetBg.fillStyle(0x312e81, 1.0);
        targetBg.lineStyle(3, 0xf59e0b, 1.0);
        targetBg.fillCircle(-340, 0, 18);
        targetBg.strokeCircle(-340, 0, 18);
        const targetTxt = this.add.text(-340, 0, '1', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fontWeight: '900',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.legendTargetLbl = this.add.text(-310, 0, 'Target: 1 -> A -> 2 -> B', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fontWeight: '800',
            fill: '#fef08a'
        }).setOrigin(0, 0.5);

        // 2. Decoy trap legend
        const distractorBg = this.add.graphics();
        distractorBg.fillStyle(0x1e293b, 1.0);
        distractorBg.lineStyle(2, 0x64748b, 0.9);
        distractorBg.fillCircle(-50, 0, 17);
        distractorBg.strokeCircle(-50, 0, 17);
        const distractorTxt = this.add.text(-50, 0, 'X', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '15px',
            fontWeight: '900',
            fill: '#94a3b8'
        }).setOrigin(0.5);
        this.legendDecoyLbl = this.add.text(-22, 0, 'Decoys: Fake labels (Avoid)', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fontWeight: '800',
            fill: '#fca5a5'
        }).setOrigin(0, 0.5);

        // 3. Empty cell legend
        const emptyBg = this.add.graphics();
        emptyBg.fillStyle(0x0f172a, 0.9);
        emptyBg.lineStyle(1.5, 0x475569, 0.7);
        emptyBg.fillCircle(240, 0, 15);
        emptyBg.strokeCircle(240, 0, 15);
        const emptyLbl = this.add.text(268, 0, 'Empty: Skip', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fontWeight: '800',
            fill: '#cbd5e1'
        }).setOrigin(0, 0.5);

        this.legendContainer.add([
            targetBg, targetTxt, this.legendTargetLbl,
            distractorBg, distractorTxt, this.legendDecoyLbl,
            emptyBg, emptyLbl
        ]);
    }

    updateLegendLabels() {
        if (!this.legendTargetLbl || !this.legendDecoyLbl) return;
        if (this.memoryMask) {
            this.legendTargetLbl.setText('Mode: Memorize & Recall (?)');
            this.legendDecoyLbl.setText('Traps: Fake labels');
        } else if (this.sequenceMode === 'alternating') {
            this.legendTargetLbl.setText('Mode: Alternate (1 -> A -> 2)');
            this.legendDecoyLbl.setText('Decoys: Fake labels');
        } else {
            this.legendTargetLbl.setText('Mode: Numbers (1 -> 2 -> 3)');
            this.legendDecoyLbl.setText('Decoys: Fake numbers');
        }
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

    drawNodeCell(bg, cellSize, data, state = 'default') {
        bg.clear();
        const { isTarget, isDistractor } = data;

        if (state === 'hover') {
            if (isTarget) {
                bg.fillStyle(0x312e81, 0.95);
                bg.lineStyle(3.5, 0xfbbf24, 1.0);
                bg.fillCircle(0, 0, cellSize * 0.42);
                bg.strokeCircle(0, 0, cellSize * 0.42);
            } else if (isDistractor) {
                bg.fillStyle(0x1e293b, 0.7);
                bg.lineStyle(2, 0x64748b, 0.6);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);
            } else {
                bg.fillStyle(0x0f172a, 0.4);
                bg.lineStyle(1.5, 0x334155, 0.3);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);
            }
        } else if (state === 'connected') {
            bg.fillStyle(0x064e3b, 0.92);
            bg.lineStyle(3.5, 0x10b981, 1.0);
            bg.fillCircle(0, 0, cellSize * 0.42);
            bg.strokeCircle(0, 0, cellSize * 0.42);
        } else if (state === 'failed') {
            bg.fillStyle(0x7f1d1d, 0.92);
            bg.lineStyle(3.5, 0xef4444, 1.0);
            bg.fillCircle(0, 0, cellSize * 0.42);
            bg.strokeCircle(0, 0, cellSize * 0.42);
        } else if (state === 'masked') {
            bg.fillStyle(0x0a1024, 0.9);
            bg.lineStyle(2.5, 0x38bdf8, 0.85);
            bg.fillCircle(0, 0, cellSize * 0.4);
            bg.strokeCircle(0, 0, cellSize * 0.4);
        } else {
            // Default idle state
            if (isTarget) {
                bg.fillStyle(0x1e1b4b, 0.85);
                bg.lineStyle(2.5, 0xf59e0b, 0.95);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);
            } else if (isDistractor) {
                bg.fillStyle(0x1e293b, 0.6);
                bg.lineStyle(2, 0x475569, 0.5);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);
            } else {
                bg.fillStyle(0x0f172a, 0.35);
                bg.lineStyle(1.5, 0x334155, 0.2);
                bg.fillCircle(0, 0, cellSize * 0.4);
                bg.strokeCircle(0, 0, cellSize * 0.4);
            }
        }
    }

    startNewPuzzle() {
        if (this.timeLeft <= 0) return;

        this.gamePhase = 'PLAYING';
        this.clickedSequence = [];
        this.isMasked = false;
        this.lineGraphics.clear();

        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.puzzleClicksCount = 0;
        this.ruleShiftLatency = 0;

        const width = this.scale.width;

        // Generate Target Sequence Tokens
        if (this.sequenceMode === 'alternating') {
            const altPool = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
            this.sequenceTokens = altPool.slice(0, this.sequenceLength);
        } else {
            const numPool = ['1', '2', '3', '4', '5', '6', '7', '8'];
            this.sequenceTokens = numPool.slice(0, this.sequenceLength);
        }

        // Set Header Prompt & Legend
        const seqPreview = this.sequenceTokens.join(' -> ');
        if (this.memoryMask) {
            this.statusText.setText(`MEMORIZE: [ ${seqPreview} ] | TILES MASK ON FIRST CLICK!`).setFill('#38bdf8');
        } else if (this.sequenceMode === 'alternating') {
            this.statusText.setText(`ALTERNATE: [ ${seqPreview} ] | CLICK: [ ${this.sequenceTokens[0]} ]`).setFill('#f59e0b');
        } else {
            this.statusText.setText(`LINK IN ORDER: [ ${seqPreview} ] | CLICK: [ 1 ]`).setFill('#f59e0b');
        }
        this.updateLegendLabels();

        // Generate Decoy / Distractor Tokens
        const decoyPool = this.sequenceMode === 'alternating'
            ? ['X', 'Z', '9', '8', 'K', '7', 'W', 'M', 'Y', '6', 'J', 'Q']
            : ['8', '9', '7', '10', '12', '15', '18', '20', '25'];
        Phaser.Utils.Array.Shuffle(decoyPool);
        const activeDecoys = decoyPool.slice(0, this.distractorsCount);

        // Sizing logic
        const gridAreaSize = this.gridSize >= 5 ? Math.min(440, width - 60) : Math.min(410, width - 60);
        const spacing = this.gridSize >= 5 ? 10 : 14;
        const totalSpacing = spacing * (this.gridSize - 1);
        const cellSize = (gridAreaSize - totalSpacing) / this.gridSize;

        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 110 + cellSize / 2;

        // Clean up previous cells
        this.gridCells.forEach(cell => {
            if (cell.bg) cell.bg.destroy();
            if (cell.txt) cell.txt.destroy();
        });
        this.gridCells = [];

        // Pick available random positions on the grid
        const totalNodes = this.gridSize * this.gridSize;
        const availableIndexes = Array.from({ length: totalNodes }, (_, idx) => idx);
        Phaser.Utils.Array.Shuffle(availableIndexes);

        this.sequenceIndexes = availableIndexes.slice(0, this.sequenceLength);
        const distractorIndexes = availableIndexes.slice(this.sequenceLength, this.sequenceLength + this.distractorsCount);

        const cellDataMap = {};
        this.sequenceIndexes.forEach((gridIdx, seqIdx) => {
            cellDataMap[gridIdx] = {
                token: this.sequenceTokens[seqIdx],
                seqOrder: seqIdx,
                isTarget: true,
                isDistractor: false
            };
        });
        distractorIndexes.forEach((gridIdx, dIdx) => {
            cellDataMap[gridIdx] = {
                token: activeDecoys[dIdx] || '?',
                seqOrder: -1,
                isTarget: false,
                isDistractor: true
            };
        });

        // Draw grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                const x = startX + col * (cellSize + spacing);
                const y = startY + row * (cellSize + spacing);

                const bg = this.add.graphics();
                bg.setPosition(x, y);

                const data = cellDataMap[index] || {
                    token: '',
                    seqOrder: -1,
                    isTarget: false,
                    isDistractor: false
                };

                let txt = null;
                if (data.token) {
                    const fontSize = this.gridSize >= 5 ? `${cellSize * 0.38}px` : `${cellSize * 0.40}px`;
                    txt = this.add.text(x, y, data.token, {
                        fontFamily: CogniTheme.fonts.body,
                        fontSize: fontSize,
                        fontWeight: '900',
                        fill: data.isTarget ? '#ffffff' : '#94a3b8'
                    }).setOrigin(0.5);
                }

                this.drawNodeCell(bg, cellSize, data, 'default');

                // Interactive bounds
                bg.setInteractive(new Phaser.Geom.Circle(0, 0, cellSize * 0.45), Phaser.Geom.Circle.Contains);
                bg.on('pointerdown', (pointer, localX, localY, event) => {
                    if (this.isTutorialActive) return;
                    if (event) event.stopPropagation();
                    this.handleNodeClick(index, data, x, y, bg, txt, cellSize);
                });

                // Hover triggers
                bg.on('pointerover', () => {
                    if (this.isTutorialActive) return;
                    if (this.gamePhase === 'PLAYING') {
                        const isConnected = this.clickedSequence.some(item => item.index === index);
                        if (!isConnected) {
                            const hoverState = this.isMasked && !isConnected ? 'masked' : 'hover';
                            this.drawNodeCell(bg, cellSize, data, hoverState);
                            this.tweens.add({
                                targets: [bg, txt].filter(Boolean),
                                scale: 1.08,
                                duration: 80,
                                ease: 'Quad.easeOut'
                            });
                        }
                    }
                });

                bg.on('pointerout', () => {
                    if (this.isTutorialActive) return;
                    if (this.gamePhase === 'PLAYING') {
                        const isConnected = this.clickedSequence.some(item => item.index === index);
                        if (!isConnected) {
                            const idleState = this.isMasked ? 'masked' : 'default';
                            this.drawNodeCell(bg, cellSize, data, idleState);
                            this.tweens.add({
                                targets: [bg, txt].filter(Boolean),
                                scale: 1.0,
                                duration: 80,
                                ease: 'Quad.easeOut'
                            });
                        }
                    }
                });

                this.gridCells.push({
                    index,
                    x,
                    y,
                    bg,
                    txt,
                    data,
                    cellSize
                });
            }
        }

        this.puzzleStartTime = this.getTime();
    }

    handleNodeClick(index, data, x, y, bg, txt, cellSize) {
        if (this.gamePhase !== 'PLAYING') return;
        if (this.isTutorialActive) return;

        this.puzzleClicksCount++;
        if (this.puzzleClicksCount === 1) {
            this.ruleShiftLatency = this.getTime() - this.puzzleStartTime;
        }

        const expectedSeqIdx = this.clickedSequence.length;
        const isCorrectTarget = data.isTarget && data.seqOrder === expectedSeqIdx;

        if (isCorrectTarget) {
            this.clickedSequence.push({ x, y, index, bg, txt, cellSize, token: data.token });

            // Mark node green & restore real token
            this.drawNodeCell(bg, cellSize, data, 'connected');
            if (txt) {
                txt.setText(data.token);
                txt.setFill('#34d399');
            }

            this.redrawLines(0x10b981);

            this.tweens.add({
                targets: txt ? [bg, txt] : bg,
                scale: 1.12,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut'
            });

            // Trigger Memory Masking on first correct tap
            if (this.memoryMask && this.clickedSequence.length === 1 && !this.isMasked) {
                this.isMasked = true;
                this.cameras.main.flash(90, 56, 189, 248, 0.15);

                this.gridCells.forEach(cell => {
                    const isAlreadyConnected = this.clickedSequence.some(item => item.index === cell.index);
                    if (!isAlreadyConnected && cell.data.token) {
                        this.drawNodeCell(cell.bg, cell.cellSize, cell.data, 'masked');
                        if (cell.txt) {
                            cell.txt.setText('?').setFill('#7dd3fc');
                        }
                    }
                });
            }

            if (this.clickedSequence.length === this.sequenceLength) {
                this.handleSuccessfulPath();
            } else {
                const nextExpectedToken = this.sequenceTokens[this.clickedSequence.length];
                if (this.isMasked) {
                    this.statusText.setText(`RECALL: CLICK WHERE [ ${nextExpectedToken} ] WAS!`).setFill('#38bdf8');
                } else {
                    this.statusText.setText(`NEXT TARGET: [ ${nextExpectedToken} ]`).setFill('#38bdf8');
                }
            }
        } else {
            this.handleFailedPath(index, data, x, y, bg, txt, cellSize);
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

        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, 0xf59e0b);
        }
        this.hits++;
        this.consecutiveHits++;
        this.totalAttempts++;

        const solveTime = this.getTime() - this.puzzleStartTime;

        // Dynamic reward
        const baseReward = 180 * this.sequenceLength;
        const speedBonus = Math.max(0, Math.round((15000 - solveTime) / 10));
        const roundScore = baseReward + speedBonus;
        this.score += roundScore;

        this.showFloatingFeedback(`+${roundScore} PERFECT LINK!`, '#10b981');
        this.statusText.setText('PATHWAY SOLVED!').setFill('#10b981');
        this.cameras.main.flash(100, 16, 185, 129, 0.15);

        this.updateHUD();
        this.dispatchMetricTelemetry(solveTime, 1.0);
        this.scheduleNextPuzzle();
    }

    handleFailedPath(wrongIndex, data, x, y, bg, txt, cellSize) {
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.consecutiveHits = 0;
        this.totalAttempts++;

        const solveTime = this.getTime() - this.puzzleStartTime;

        this.redrawLines(0xef4444);
        this.drawNodeCell(bg, cellSize, data, 'failed');
        if (txt) txt.setFill('#f87171');

        // Reveal all masked tokens so player sees true positions
        if (this.isMasked) {
            this.gridCells.forEach(cell => {
                if (cell.data.token && cell.txt) {
                    cell.txt.setText(cell.data.token);
                    if (cell.data.isTarget) {
                        cell.txt.setFill('#fde047');
                    }
                }
            });
        }

        this.cameras.main.shake(140, 0.008);
        this.showFloatingFeedback('LINK BROKEN!', '#ef4444');
        this.statusText.setText('PATHWAY CONFLICT! WRONG NODE').setFill('#ef4444');

        this.updateHUD();
        this.dispatchMetricTelemetry(solveTime, 0.0);
        this.scheduleNextPuzzle();
    }

    scheduleNextPuzzle() {
        this.time.delayedCall(1200, async () => {
            if (this.timeLeft <= 0) return;

            // Fast-track DDA check: adapt after every 2 puzzles or on high streaks
            if (this.totalAttempts % 2 === 0 || this.consecutiveHits >= 2) {
                await this.adaptDifficulty();
            }
            this.startNewPuzzle();
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

    async dispatchMetricTelemetry(solveTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "logical_mathematical",
            game_type: "LogicLink",
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount,
            rule_shift_latency_ms: this.ruleShiftLatency || 0.0
        };

        try {
            console.log('[Telemetry Dispatch] Sending LogicLink metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`
                },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.warn('[Telemetry Dispatch Error]:', err);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        try {
            console.log('[DDA Bridge] Querying LogicLink DDA adaptation for session', this.sessionId);
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`
                },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const params = data.dda_parameters;
                    const oldLvl = this.difficultyLevel;
                    const newLvl = params.difficulty_level !== undefined ? params.difficulty_level : oldLvl;

                    this.difficultyLevel = newLvl;
                    this.gridSize = params.grid_size !== undefined ? params.grid_size : this.gridSize;
                    this.sequenceLength = params.sequence_length !== undefined ? params.sequence_length : this.sequenceLength;
                    this.distractorsCount = params.distractors !== undefined ? params.distractors : this.distractorsCount;
                    this.sequenceMode = params.sequence_mode !== undefined ? params.sequence_mode : (this.difficultyLevel === 2 || this.difficultyLevel === 3 || this.difficultyLevel === 5 ? 'alternating' : 'numbers');
                    this.memoryMask = params.memory_mask !== undefined ? params.memory_mask : (this.difficultyLevel >= 4);

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                        updateMlHud(this);
                    }

                    if (newLvl !== oldLvl) {
                        const direction = newLvl > oldLvl ? 'INCREASED' : 'ADAPTED';
                        this.showFloatingFeedback(`DIFFICULTY ${direction}! LEVEL ${this.difficultyLevel}`, '#a855f7');
                    }
                }
            }
        } catch (err) {
            console.warn('[DDA Adaptation Error]:', err);
        }
    }

    endGame() {
        if (this.timerText && this.timerText.active) {
            this.timerText.setText('00:00');
        }
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.legendContainer) this.legendContainer.destroy();

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

    startGameplay() {
        if (this.legendContainer) {
            this.legendContainer.setVisible(true);
        }
        this.sessionStartTime = this.getTime();
        this.isGameOver = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.startNewPuzzle();
    }
}
