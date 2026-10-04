import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Stroop Shift cognitive conflict scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (spawn_delay, conflict_probability, spin, rotation, flashes) updated via REST API.
 * - Error Handling: Implements catch blocks for API calls to ensure stable gameplay.
 * ================================================================================
 */
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class StroopShiftScene extends BaseCognitiveScene {
    constructor() {
        super('StroopShiftScene');
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        // Core configurations passed from React wrapper
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        // Dynamic Difficulty Adjustment (DDA) variables
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.spawnDelay = dda.spawn_delay || 2500;
        this.conflictProbability = dda.conflict_probability || 0.0;
        this.staticTextRotation = dda.static_text_rotation || false;
        this.dynamicTextSpin = dda.dynamic_text_spin || false;
        this.distractorFlashes = dda.distractor_flashes || false;

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalClicks = 0;
        this.accuracy = 1.0;
        this.gameDuration = 30000; // 30 seconds
        this.timeLeft = this.gameDuration;

        // Telemetry helpers
        this.recentReactionTimes = [];
        this.consecutiveHits = 0;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;

        // Game objects
        this.currentInkColor = null;
        this.currentWordText = '';
        this.stimulusText = null;
        this.spawnTimerEvent = null;
        this.countdownTimer = null;
        this.spinTween = null;

        // Color definitions
        this.colors = [
            { name: 'RED', value: 0xef4444, hexStr: '#ef4444' },
            { name: 'BLUE', value: 0x38bdf8, hexStr: '#38bdf8' },
            { name: 'GREEN', value: 0x22c55e, hexStr: '#22c55e' },
            { name: 'YELLOW', value: 0xeab308, hexStr: '#eab308' }
        ];
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Sleek Background with Gradient (Premium Tech Look)
        this.createStandardBackground();// Tech grid lines for design consistency
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // 2. HUD Setup
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#38bdf8'
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
            fill: '#a855f7'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:30', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Guide text below header
        this.add.text(width / 2, 95, 'SELECT THE FONT/INK COLOR (IGNORE THE WORD)', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '14px',
            fontWeight: '700',
            fill: '#64748b',
            letterSpacing: '1.5px'
        }).setOrigin(0.5);

        // 3. Option Selection Buttons (Laid out horizontally at the bottom)
        const btnWidth = 140;
        const btnHeight = 60;
        const spacing = 30;
        const totalBtnsWidth = 4 * btnWidth + 3 * spacing;
        const startX = (width - totalBtnsWidth) / 2 + btnWidth / 2;
        const buttonsY = height - 120;

        this.colors.forEach((color, idx) => {
            const x = startX + idx * (btnWidth + spacing);
            
            const btnContainer = this.add.container(x, buttonsY);
            const btnBg = this.add.graphics();
            
            // Standard state: Slate glass style with neon border matching color
            btnBg.lineStyle(2, color.value, 0.8);
            btnBg.fillStyle(0x1e293b, 0.6);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            
            const btnTxt = this.add.text(0, 0, color.name, {
                fontFamily: CogniTheme.fonts.body,
                fontSize: '18px',
                fontWeight: '800',
                fill: color.hexStr
            }).setOrigin(0.5);

            btnContainer.add(btnBg);
            btnContainer.add(btnTxt);

            // Make interactive
            btnBg.setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);

            // Hover micro-animations
            btnBg.on('pointerover', () => {
                this.tweens.add({
                    targets: btnContainer,
                    scale: 1.05,
                    duration: 100
                });
                btnBg.clear();
                btnBg.lineStyle(3, color.value, 1.0);
                btnBg.fillStyle(0x334155, 0.8);
                btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
                btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            });

            btnBg.on('pointerout', () => {
                this.tweens.add({
                    targets: btnContainer,
                    scale: 1.0,
                    duration: 100
                });
                btnBg.clear();
                btnBg.lineStyle(2, color.value, 0.8);
                btnBg.fillStyle(0x1e293b, 0.6);
                btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
                btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            });

            btnBg.on('pointerdown', () => {
                if (this.isTutorialActive) return;
                this.handleColorSelection(color.name);
            });
        });

        // 4. Global Input Listeners (Hesitation & Spam Clicks)
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

        createMlHud(this, 0xa855f7);
        createTutorialOverlay(this, {
            title: "STROOP SHIFT",
            domain: "reflexes_and_focus",
            instructions: "• Identify matching ink color vs word text meaning.\n\n• Respond according to the dynamic command rule on screen.\n\n• Shift attention quickly as rules invert in real-time.",
            themeColorHex: 0xa855f7,
            onStart: () => this.startGameplay()
        });
    }

    startGameplay() {
        this.sessionStartTime = this.getTime();
        this.isGameOver = false;
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateCountdown,
            callbackScope: this,
            loop: true
        });
        this.spawnWord();
    }

    updateCountdown() {
        this.timeLeft -= 1000;
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    spawnWord() {
        if (this.timeLeft <= 0) return;

        // Clear active stimulus/tweens
        if (this.stimulusText) {
            this.stimulusText.destroy();
            this.stimulusText = null;
        }
        if (this.spinTween) {
            this.spinTween.remove();
            this.spinTween = null;
        }

        const width = this.scale.width;
        const height = this.scale.height;

        // Choose random ink color index
        const inkColorIdx = Phaser.Math.Between(0, this.colors.length - 1);
        this.currentInkColor = this.colors[inkColorIdx];

        // Determine if word matches ink color or conflicts
        let wordColorIdx = inkColorIdx;
        if (Math.random() < this.conflictProbability) {
            // Mismatch: Pick different color text
            do {
                wordColorIdx = Phaser.Math.Between(0, this.colors.length - 1);
            } while (wordColorIdx === inkColorIdx);
        }
        this.currentWordText = this.colors[wordColorIdx].name;

        // Render Stimulus text in the center
        this.stimulusText = this.add.text(width / 2, height / 2 - 50, this.currentWordText, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '72px',
            fontWeight: '900',
            fill: this.currentInkColor.hexStr,
            stroke: '#0f172a',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Neon Glow Styling Effect
        this.stimulusText.setShadow(0, 0, this.currentInkColor.hexStr, 20, true, true);

        // Level 4/5: Static rotation distractor
        if (this.staticTextRotation) {
            const angle = Phaser.Math.Between(0, 1) === 0 
                ? Phaser.Math.Between(-30, -15) 
                : Phaser.Math.Between(15, 30);
            this.stimulusText.setAngle(angle);
        }

        // Level 5: Dynamic Spin distractor
        if (this.dynamicTextSpin) {
            this.spinTween = this.tweens.add({
                targets: this.stimulusText,
                angle: 360,
                duration: 2500,
                repeat: -1,
                ease: 'Linear'
            });
        }

        // Level 5: Strobe Distractor Flash
        if (this.distractorFlashes && Math.random() < 0.35) {
            const flashColors = [0xef4444, 0x38bdf8, 0x22c55e, 0xeab308, 0xffffff];
            const flashColor = flashColors[Phaser.Math.Between(0, flashColors.length - 1)];
            
            const flashOverlay = this.add.graphics();
            flashOverlay.fillStyle(flashColor, 0.12);
            flashOverlay.fillRect(0, 0, width, height);
            
            this.time.delayedCall(120, () => {
                flashOverlay.destroy();
            });
        }

        // Reset first interaction metric tracking
        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;

        // Schedule timeout/spawn delay cycle
        if (this.spawnTimerEvent) {
            this.spawnTimerEvent.remove();
        }
        this.spawnTimerEvent = this.time.delayedCall(this.spawnDelay, () => {
            this.handleTimeout();
        });
    }

    handleTimeout() {
        this.misses++;
        this.consecutiveHits = 0;
        this.totalClicks++;

        this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 130, 'TIMEOUT!', '#ef4444');
        
        // Shake screen on miss
        this.cameras.main.shake(100, 0.005);

        this.updateHUD();
        this.spawnWord();
    }

    handleColorSelection(selectedColorName) {
        if (this.timeLeft <= 0) return;

        // Cancel timeout timer
        if (this.spawnTimerEvent) {
            this.spawnTimerEvent.remove();
        }

        const isCorrect = (selectedColorName === this.currentInkColor.name);
        this.totalClicks++;

        const reactionTime = this.getTime() - this.stimulusSpawnTime;
        this.recentReactionTimes.push(reactionTime);

        if (isCorrect) {

            if (this.showParticleBurst) {
                const px = this.input.activePointer.x || this.scale.width / 2;
                const py = this.input.activePointer.y || this.scale.height / 2;
                this.showParticleBurst(px, py, 0xa855f7);
            }
    
        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, 0xa855f7);
        }
        this.hits++;
            this.consecutiveHits++;

            const scoreGain = Math.max(10, Math.round(1000 - reactionTime / 2));
            this.score += scoreGain;

            this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 130, `+${scoreGain}`, '#22c55e');

            // Dispatch Metrics Telemetry
            this.dispatchMetricTelemetry(reactionTime);

            // Pop animation on success
            this.tweens.add({
                targets: this.stimulusText,
                scale: 1.15,
                alpha: 0,
                duration: 100,
                onComplete: () => {
                    this.spawnWord();
                }
            });

            // Adapt difficulty level every 5 hits
            if (this.hits % 5 === 0) {
                this.adaptDifficulty();
            }
        } else {
            this.misses++;
            this.consecutiveHits = 0;

            this.showFloatingText(this.scale.width / 2, this.scale.height / 2 - 130, 'WRONG!', '#ef4444');
            this.cameras.main.shake(100, 0.005);

            // Dispatch Metrics Telemetry
            this.dispatchMetricTelemetry(reactionTime);

            this.tweens.add({
                targets: this.stimulusText,
                scale: 0.85,
                alpha: 0,
                duration: 100,
                onComplete: () => {
                    this.spawnWord();
                }
            });
        }

        this.updateHUD();
    }

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        
        if (this.totalClicks > 0) {
            this.accuracy = this.hits / this.totalClicks;
        } else {
            this.accuracy = 1.0;
        }
        
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    showFloatingText(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 600,
            onComplete: () => txt.destroy()
        });
    }

    // ==========================================
    // TELEMETRY SERVICE DISPATCHER & DDA ENGINE
    // ==========================================

    async dispatchMetricTelemetry(reactionTime) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "reflexes_and_focus",
            game_type: "stroop_shift",
            reaction_time: reactionTime,
            accuracy_rate: this.accuracy,
            difficulty: this.difficultyLevel,
            error_count: this.misses,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        try {
            console.log('[Telemetry StroopShift] Dispatching metrics...', payload);
            const response = await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('[Telemetry StroopShift] Connection issues. Telemetry stored locally.', error);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;
        const ddaStartTime = this.getTime();

        try {
            console.log('[DDA StroopShift] Adjusting gameplay challenge...');
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (!response.ok) {
                throw new Error(`DDA server returned HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success' && data.dda_parameters) {
                const params = data.dda_parameters;
                
                // Adjust level and flash notifications
                if (this.difficultyLevel !== params.difficulty_level) {
                    this.difficultyLevel = params.difficulty_level !== undefined ? params.difficulty_level : this.difficultyLevel;
                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    
                    const direction = params.difficulty_level > this.difficultyLevel ? 'UPGRADED' : 'ADJUSTED';
                    this.showFloatingText(this.scale.width / 2, this.scale.height / 2, `DIFFICULTY ${direction}!`, '#a855f7');
                }

                // Update gameplay parameters with safe fallbacks
                this.spawnDelay = params.spawn_delay || this.spawnDelay || 2500;
                this.conflictProbability = params.conflict_probability !== undefined ? params.conflict_probability : this.conflictProbability;
                this.staticTextRotation = params.static_text_rotation !== undefined ? params.static_text_rotation : this.staticTextRotation;
                this.dynamicTextSpin = params.dynamic_text_spin !== undefined ? params.dynamic_text_spin : this.dynamicTextSpin;
                this.distractorFlashes = params.distractor_flashes !== undefined ? params.distractor_flashes : this.distractorFlashes;
                
                if (data.cognitive_profile) {
                    this.archetype = data.cognitive_profile.archetype || this.archetype;
                    this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                }
                updateMlHud(this);
                console.log('[DDA StroopShift] Updated parameters:', params);
            }
        } catch (error) {
            console.warn('[DDA StroopShift] Failed to run DDA adjustment.', error);
        }
    }

    endGame() {
        if (this.timerText && this.timerText.active) {
            this.timerText.setText('00:00');
        }
        if (this.spawnTimerEvent) this.spawnTimerEvent.remove();
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.spinTween) this.spinTween.remove();

        if (this.stimulusText) {
            this.stimulusText.destroy();
        }

        console.log('[StroopShift] Ending Session...', {
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
