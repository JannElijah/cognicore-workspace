import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class SynapseSpinScene extends BaseCognitiveScene {
    constructor() {
        super('SynapseSpinScene');
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
        this.verticesCount = dda.vertices || 4;
        this.rotationStep = dda.rotation_step !== undefined ? dda.rotation_step : 90;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45s
        this.timeLeft = this.gameDuration;

        this.gamePhase = 'PLAYING'; // PLAYING | FEEDBACK | GAMEOVER
        this.puzzleStartTime = 0;

        // Visual options
        this.optionsContainer = [];
        this.correctOptionIndex = -1;

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

        // Deep cyber navy/purple gradient
        this.createStandardBackground();// Tech grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x8b5cf6, 0.03);
        grid.setOrigin(0.5);

        // HUD Text
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#a78bfa' // purple-indigo
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
            fill: '#a78bfa'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(width / 2, 90, 'IDENTIFY THE SAME SHAPE (MENTALLY ROTATED)!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '18px',
            fontWeight: '800',
            fill: '#e2e8f0',
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

        createMlHud(this, 0x10b981);
        createTutorialOverlay(this, {
            title: "SYNAPSE SPIN",
            domain: "executive_strategy",
            instructions: "• Rotate synapses to guide signal sparks to matched color receptors.\n\n• Click/tap to rotate receptors and switch directions.\n\n• DDA accelerates spark velocity based on correct routing.",
            themeColorHex: 0x10b981,
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

    // Generate random asymmetrical shape
    generateShapePoints(vertices, radius) {
        const points = [];
        const angleStep = (Math.PI * 2) / vertices;

        for (let i = 0; i < vertices; i++) {
            const angle = i * angleStep + (Math.random() * angleStep * 0.4 - angleStep * 0.2);
            // vary the radius to create asymmetrical shape
            const r = radius * (0.6 + Math.random() * 0.6);
            points.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        return points;
    }

    // Clone and mirror points (for distractors)
    mirrorShapePoints(points) {
        return points.map(pt => ({ x: -pt.x, y: pt.y }));
    }

    startNewPuzzle() {
        if (this.timeLeft <= 0 || this.gamePhase !== 'PLAYING') return;

        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.puzzleStartTime = this.getTime();

        // Cleanup previous shapes
        if (this.referenceGraphic) this.referenceGraphic.destroy();
        this.optionsContainer.forEach(opt => {
            if (opt.bg) opt.bg.destroy();
            if (opt.shapeGraphic) opt.shapeGraphic.destroy();
            if (opt.labelText) opt.labelText.destroy();
        });
        this.optionsContainer = [];

        // 1. Generate core reference shape
        const shapeRadius = 70;
        const points = this.generateShapePoints(this.verticesCount, shapeRadius);

        // Draw reference shape panel
        this.referenceGraphic = this.add.graphics();
        this.referenceGraphic.setPosition(220, 320);
        this.drawCustomPolygon(this.referenceGraphic, points, 0x8b5cf6, 0xd8b4fe);

        // Option A, B, C coordinates
        const optionsX = 580;
        const optionYCoords = [190, 320, 450];
        this.correctOptionIndex = Phaser.Math.Between(0, 2);

        for (let i = 0; i < 3; i++) {
            const y = optionYCoords[i];
            
            // Draw container card
            const bg = this.add.graphics();
            bg.fillStyle(0x1e293b, 0.4);
            bg.lineStyle(1.5, 0x475569, 1);
            bg.fillRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
            bg.strokeRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
            bg.setInteractive(new Phaser.Geom.Rectangle(optionsX - 110, y - 55, 220, 110), Phaser.Geom.Rectangle.Contains);

            // Shape Graphic
            const shapeGraphic = this.add.graphics();
            shapeGraphic.setPosition(optionsX + 15, y);

            // Determine rotation angle
            let rotAngle = 0;
            if (this.rotationStep > 0) {
                rotAngle = Phaser.Math.Between(1, 3) * this.rotationStep;
            } else {
                rotAngle = Phaser.Math.Between(30, 330);
            }

            // Determine points (correct = reference shape rotated, wrong = mirror shape rotated)
            let drawPoints = [];
            if (i === this.correctOptionIndex) {
                drawPoints = points;
            } else {
                drawPoints = this.mirrorShapePoints(points);
            }

            // Draw option shape
            const radAngle = Phaser.Math.DegToRad(rotAngle);
            const rotatedPoints = drawPoints.map(pt => ({
                x: pt.x * Math.cos(radAngle) - pt.y * Math.sin(radAngle),
                y: pt.x * Math.sin(radAngle) + pt.y * Math.cos(radAngle)
            }));
            
            // Scale points down slightly for candidate window
            const scaledRotatedPoints = rotatedPoints.map(pt => ({ x: pt.x * 0.65, y: pt.y * 0.65 }));
            this.drawCustomPolygon(shapeGraphic, scaledRotatedPoints, 0x6366f1, 0x818cf8);

            // Label text (A, B, C)
            const labelText = this.add.text(optionsX - 80, y, String.fromCharCode(65 + i), {
                fontFamily: CogniTheme.fonts.body,
                fontSize: '28px',
                fontWeight: '900',
                fill: '#e2e8f0'
            }).setOrigin(0.5);

            this.optionsContainer.push({ bg, shapeGraphic, labelText, index: i });

            // Interactive behaviors (tap/click triggers selection)
            bg.on('pointerover', () => {
                if (this.gamePhase === 'PLAYING') {
                    bg.clear();
                    bg.fillStyle(0x2d3748, 0.65);
                    bg.lineStyle(2.5, 0xa78bfa, 1);
                    bg.fillRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
                    bg.strokeRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
                }
            });

            bg.on('pointerout', () => {
                if (this.gamePhase === 'PLAYING') {
                    bg.clear();
                    bg.fillStyle(0x1e293b, 0.4);
                    bg.lineStyle(1.5, 0x475569, 1);
                    bg.fillRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
                    bg.strokeRoundedRect(optionsX - 110, y - 55, 220, 110, 8);
                }
            });

            bg.on('pointerdown', (pointer, localX, localY, event) => {
                if (this.isTutorialActive) return;
                if (event) event.stopPropagation();
                this.registerFirstInteraction();
                this.handleSelection(i);
            });
        }
    }

    drawCustomPolygon(graphics, points, fillColor, strokeColor) {
        graphics.fillStyle(fillColor, 0.3);
        graphics.lineStyle(3, strokeColor, 0.95);
        
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        // draw small nodes on vertices
        points.forEach(pt => {
            graphics.fillStyle(strokeColor, 1);
            graphics.fillCircle(pt.x, pt.y, 4.5);
        });
    }

    handleSelection(selectedIndex) {
        if (this.gamePhase !== 'PLAYING') return;
        this.gamePhase = 'FEEDBACK';
        this.totalAttempts++;

        const solveTime = this.getTime() - this.puzzleStartTime;
        const isCorrect = selectedIndex === this.correctOptionIndex;

        if (isCorrect) {

            if (this.showParticleBurst) {
                const px = this.input.activePointer.x || this.scale.width / 2;
                const py = this.input.activePointer.y || this.scale.height / 2;
                this.showParticleBurst(px, py, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
            }
    
        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, parseInt((getComputedStyle(document.body).getPropertyValue('--color-primary').trim() || '#38bdf8').replace('#', '0x'), 16));
        }
        this.hits++;
            const points = 150 * this.difficultyLevel + Math.max(0, Math.round((12000 - solveTime) / 10));
            this.score += points;
            this.showFloatingFeedback(`+${points} CORRECT!`, '#10b981');
            this.statusText.setText('SPATIAL SYNC LOCK ACHIEVED!').setFill('#10b981');
            this.cameras.main.flash(100, 168, 85, 247, 0.15); // purple splash
            this.dispatchMetricTelemetry(solveTime, 1.0);
        } else {
            this.misses++;
            this.showFloatingFeedback('INCORRECT!', '#ef4444');
            this.statusText.setText('SHAPE MISMATCH DETECTED!').setFill('#ef4444');
            this.cameras.main.shake(120, 0.005);
            this.dispatchMetricTelemetry(solveTime, 0.0);
        }

        this.updateHUD();

        // Sync DDA parameters every 3 trials
        this.time.delayedCall(1600, () => {
            if (this.timeLeft <= 0) return;
            if (this.totalAttempts % 3 === 0) {
                this.adaptDifficulty();
            } else {
                this.gamePhase = 'PLAYING';
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
            game_type: "SynapseSpin",
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
            console.warn('[Telemetry Dispatch] Failed to send SynapseSpin telemetry', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        this.statusText.setText('SYNCING DDA...').setFill('#64748b');

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
                    this.verticesCount = params.vertices !== undefined ? params.vertices : this.verticesCount;
                    this.rotationStep = params.rotation_step !== undefined ? params.rotation_step : this.rotationStep;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (diffChanged) {
                        this.showFloatingFeedback(`LEVEL ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a78bfa');
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed', e);
        }

        this.gamePhase = 'PLAYING';
        this.startNewPuzzle();
    }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();

        if (this.referenceGraphic) this.referenceGraphic.destroy();
        this.optionsContainer.forEach(opt => {
            if (opt.bg) opt.bg.destroy();
            if (opt.shapeGraphic) opt.shapeGraphic.destroy();
            if (opt.labelText) opt.labelText.destroy();
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
