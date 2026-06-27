import Phaser from 'phaser';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class NeuralNBackScene extends BaseCognitiveScene {
    constructor() {
        super('NeuralNBackScene');
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || 'http://127.0.0.1:5000';
        this.onGameOver = data.onGameOver || null;

        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.nValue = dda.n_value || 1;
        this.stepDelay = dda.step_delay || 2000;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0; // total stimuli shown
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45s
        this.timeLeft = this.gameDuration;

        // Game state variables
        this.history = []; // tracks index of highlighted nodes
        this.currentStimulusIndex = -1;
        this.stimulusActive = false;
        this.hasRespondedThisStep = false;
        this.gamePhase = 'PLAYING'; // PLAYING | GAMEOVER
        
        this.gridNodes = []; // store visual circle components
        this.nodeCoordinates = [
            { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
            { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 },
            { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }
        ];

        // Timers
        this.countdownTimer = null;
        this.stimulusEvent = null;

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

        // Dark gradient background (Indigo/blue-grey theme)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
        bg.fillRect(0, 0, width, height);

        // Tech grid lines decoration
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // HUD Text
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#38bdf8' // light blue
        });

        this.nValText = this.add.text(20, 50, `TARGET: ${this.nValue}-BACK`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#a855f7' // purple
        });

        this.accuracyText = this.add.text(20, 80, 'ACCURACY: 100%', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(width - 20, 20, `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#38bdf8'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(width / 2, 110, 'MATCH VISUAL POSITIONS IN SEQUENCE!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // Draw 3x3 Grid of nodes
        const gridAreaSize = 240;
        const cellSize = gridAreaSize / 3;
        const startX = (width - gridAreaSize) / 2 + cellSize / 2;
        const startY = 200 + cellSize / 2;

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const x = startX + col * cellSize;
            const y = startY + row * cellSize;

            const bgCirc = this.add.graphics();
            bgCirc.fillStyle(0x1e293b, 0.45);
            bgCirc.lineStyle(2, 0x334155, 1);
            bgCirc.fillCircle(x, y, 24);
            bgCirc.strokeCircle(x, y, 24);

            const activeCirc = this.add.graphics();
            activeCirc.fillStyle(0x38bdf8, 1);
            activeCirc.fillCircle(x, y, 20);
            activeCirc.lineStyle(3, 0xffffff, 0.9);
            activeCirc.strokeCircle(x, y, 22);
            activeCirc.setVisible(false);

            this.gridNodes.push({ x, y, bg: bgCirc, active: activeCirc });
        }

        // Draw "MATCH" Button for Mobile Compatibility
        this.matchBtnBg = this.add.graphics();
        this.matchBtnBg.fillStyle(0x3b82f6, 0.8);
        this.matchBtnBg.lineStyle(2, 0x60a5fa, 1);
        this.matchBtnBg.fillRoundedRect(width / 2 - 120, 480, 240, 50, 10);
        this.matchBtnBg.strokeRoundedRect(width / 2 - 120, 480, 240, 50, 10);
        this.matchBtnBg.setInteractive(new Phaser.Geom.Rectangle(width / 2 - 120, 480, 240, 50), Phaser.Geom.Rectangle.Contains);

        this.matchBtnText = this.add.text(width / 2, 505, 'TAP TO MATCH', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Hover animations for Match Button
        this.matchBtnBg.on('pointerover', () => {
            if (this.gamePhase === 'PLAYING') {
                this.matchBtnBg.clear();
                this.matchBtnBg.fillStyle(0x60a5fa, 0.95);
                this.matchBtnBg.lineStyle(2, 0x93c5fd, 1);
                this.matchBtnBg.fillRoundedRect(width / 2 - 120, 480, 240, 50, 10);
                this.matchBtnBg.strokeRoundedRect(width / 2 - 120, 480, 240, 50, 10);
            }
        });

        this.matchBtnBg.on('pointerout', () => {
            if (this.gamePhase === 'PLAYING') {
                this.matchBtnBg.clear();
                this.matchBtnBg.fillStyle(0x3b82f6, 0.8);
                this.matchBtnBg.lineStyle(2, 0x60a5fa, 1);
                this.matchBtnBg.fillRoundedRect(width / 2 - 120, 480, 240, 50, 10);
                this.matchBtnBg.strokeRoundedRect(width / 2 - 120, 480, 240, 50, 10);
            }
        });

        this.matchBtnBg.on('pointerdown', (pointer, localX, localY, event) => {
            if (this.isTutorialActive) return;
            if (event) event.stopPropagation();
            this.registerFirstInteraction();
            this.handleMatchInput();
        });

        // Keyboard inputs
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            this.handleMatchInput();
        });

        // Background spam click checks
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

        createMlHud(this, 0x38bdf8);
        createTutorialOverlay(this, {
            title: "NEURAL N-BACK",
            domain: "spatial_visual_memory",
            instructions: "• Watch the glowing grid positions sequence.\n\n• Determine if the current position matches the one N steps back.\n\n• Press MATCH (keyboard or button) to register a hit.",
            themeColorHex: 0x38bdf8,
            onStart: () => this.startGameplay()
        });
    }

    startGameplay() {
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        this.stimulusEvent = this.time.addEvent({
            delay: this.stepDelay,
            callback: this.showNextStimulus,
            callbackScope: this,
            loop: true
        });
        this.showNextStimulus();
    }

    updateTimer() {
        this.timeLeft -= 1000;
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    showNextStimulus() {
        if (this.timeLeft <= 0 || this.gamePhase !== 'PLAYING') return;

        // If there was an active stimulus that was a MATCH and player missed it, log omission error
        if (this.currentStimulusIndex !== -1 && !this.hasRespondedThisStep) {
            const isMatch = this.checkMatchCondition();
            if (isMatch) {
                this.handleOmission();
            }
        }

        // Deactivate previous active circle
        if (this.currentStimulusIndex !== -1) {
            this.gridNodes[this.currentStimulusIndex].active.setVisible(false);
        }

        this.hasRespondedThisStep = false;
        this.stimulusActive = true;
        this.totalAttempts++;

        // Determine next highlighted node
        let nextIndex = 0;
        const matchesProbability = 0.35;
        const isMatchOpportunity = Math.random() < matchesProbability && this.history.length >= this.nValue;

        if (isMatchOpportunity) {
            // Force matching location
            nextIndex = this.history[this.history.length - this.nValue];
        } else {
            // Select random location
            nextIndex = Phaser.Math.Between(0, 8);
        }

        this.currentStimulusIndex = nextIndex;
        this.history.push(nextIndex);

        // Turn circle bright cyan
        const activeNode = this.gridNodes[nextIndex].active;
        activeNode.setVisible(true);
        activeNode.setScale(0.8);
        this.tweens.add({
            targets: activeNode,
            scale: 1,
            duration: 150,
            ease: 'Back.easeOut'
        });

        // Set stimulus spawn timestamps
        this.stimulusSpawnTime = this.time.now;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;

        // Auto fadeout circle after step_delay * 0.65
        this.time.delayedCall(this.stepDelay * 0.65, () => {
            if (this.gamePhase === 'PLAYING') {
                activeNode.setVisible(false);
                this.stimulusActive = false;
            }
        });
    }

    checkMatchCondition() {
        if (this.history.length <= this.nValue) return false;
        const currentVal = this.history[this.history.length - 1];
        const nBackVal = this.history[this.history.length - 1 - this.nValue];
        return currentVal === nBackVal;
    }

    handleMatchInput() {
        if (this.hasRespondedThisStep || this.gamePhase !== 'PLAYING') return;
        this.hasRespondedThisStep = true;

        const solveTime = this.time.now - this.stimulusSpawnTime;
        const isMatch = this.checkMatchCondition();

        if (isMatch) {
            // Hit (Correct match response)
            this.hits++;
            const points = 100 * this.difficultyLevel + Math.max(0, Math.round((this.stepDelay - solveTime) / 10));
            this.score += points;
            this.showFloatingFeedback(`+${points} MATCH!`, '#10b981');
            this.statusText.setText('CORRECT MATCH REGISTRATION!').setFill('#10b981');
            this.dispatchMetricTelemetry(solveTime, 1.0);
        } else {
            // Miss (False Alarm response)
            this.misses++;
            this.showFloatingFeedback('FALSE ALARM!', '#ef4444');
            this.statusText.setText('NO MATCH PRESET!').setFill('#ef4444');
            this.cameras.main.shake(80, 0.003);
            this.dispatchMetricTelemetry(solveTime, 0.0);
        }

        this.updateHUD();

        // Query DDA updates every 5 match trials
        if ((this.hits + this.misses) % 5 === 0) {
            this.adaptDifficulty();
        }
    }

    handleOmission() {
        this.misses++;
        this.showFloatingFeedback('OMISSION ERROR!', '#ef4444');
        this.statusText.setText('MISSED SEQUENCE MATCH!').setFill('#ef4444');
        this.updateHUD();
        this.dispatchMetricTelemetry(this.stepDelay, 0.0);
    }

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        const totalAnswers = this.hits + this.misses;
        if (totalAnswers > 0) {
            this.accuracy = this.hits / totalAnswers;
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
            game_type: "NeuralNBack",
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Failed to send NeuralNBack telemetry', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        this.statusText.setText('SYNCING DDA...').setFill('#64748b');

        try {
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const params = data.dda_parameters;
                    const diffChanged = this.difficultyLevel !== params.difficulty_level;

                    this.difficultyLevel = params.difficulty_level;
                    this.nValue = params.n_value;
                    this.stepDelay = params.step_delay;

                    this.nValText.setText(`TARGET: ${this.nValue}-BACK`);
                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    // Re-align step delay loop timer
                    if (this.stimulusEvent) {
                        this.stimulusEvent.reset({
                            delay: this.stepDelay,
                            callback: this.showNextStimulus,
                            callbackScope: this,
                            loop: true
                        });
                    }

                    if (diffChanged) {
                        this.showFloatingFeedback(`LEVEL ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a855f7');
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed', e);
        }

        this.statusText.setText('MATCH VISUAL POSITIONS IN SEQUENCE!').setFill('#e2e8f0');
    }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.stimulusEvent) this.stimulusEvent.remove();

        this.gridNodes.forEach(node => {
            if (node.bg) node.bg.destroy();
            if (node.active) node.active.destroy();
        });
        if (this.matchBtnBg) this.matchBtnBg.destroy();
        if (this.matchBtnText) this.matchBtnText.destroy();

        if (this.onGameOver) {
            const totalAnswers = this.hits + this.misses;
            this.onGameOver({
                score: this.score,
                hits: this.hits,
                misses: this.misses,
                accuracy: totalAnswers > 0 ? (this.hits / totalAnswers) : 1.0,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms: this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount
            });
        }
    }
}
