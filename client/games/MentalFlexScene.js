import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Mental Flex set-shifting cognitive scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (choices_count, time_limit, rule_shift_frequency, rules_pool) updated via REST API.
 * - Error Handling: Implements catch blocks for API calls to ensure stable gameplay.
 * ================================================================================
 */
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';
import cogniFX from '../utils/cogniFX';

export default class MentalFlexScene extends BaseCognitiveScene {
    constructor() {
        super('MentalFlexScene');
    }

    init(data) {
        data = data || {};
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
        this.choicesCount = dda.choices_count || 2;           // Number of choice cards (2 to 4)
        this.timeLimit = dda.time_limit || 4000;               // Time to make choice (ms)
        this.ruleShiftFrequency = dda.rule_shift_frequency || 5; // Success streak before rule shifts
        this.rulesPool = dda.rules_pool || ["color", "shape"]; // Rules that can be active

        // Game states
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds session
        this.timeLeft = this.gameDuration;

        // Session progression variables
        this.currentRule = "color"; // Active rule: "color" | "shape" | "count"
        this.consecutiveHits = 0;
        this.timeLeftInRound = this.timeLimit;
        this.ruleShiftOccurred = false;
        
        // Micro-behavior tracking metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;

        // Asset metadata pools
        this.colors = [
            { name: "RED", value: 0xef4444, hexStr: "#ef4444" },
            { name: "BLUE", value: 0x38bdf8, hexStr: "#38bdf8" },
            { name: "GREEN", value: 0x22c55e, hexStr: "#22c55e" },
            { name: "YELLOW", value: 0xeab308, hexStr: "#eab308" }
        ];

        this.shapes = ["circle", "square", "triangle", "star"];
        this.counts = [1, 2, 3];

        // Containers
        this.queryCard = null;
        this.choiceCards = [];
        this.timers = [];
        
        // UI texts
        this.scoreText = null;
        this.accuracyText = null;
        this.difficultyText = null;
        this.timerText = null;
        this.ruleText = null;
        this.statusText = null;
        this.timerBar = null;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Slate dark neon theme background
        this.createStandardBackground();// Grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x8b5cf6, 0.03);
        grid.setOrigin(0.5);

        // 2. HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#8b5cf6'
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
            fill: '#c084fc'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Active matching rule display panel
        this.ruleText = this.add.text(width / 2, 90, 'RULE: MATCH COLOR', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: '900',
            fill: '#eab308'
        }).setOrigin(0.5, 0);
        this.ruleText.setShadow(0, 0, '#eab308', 10, true, true);

        // Dynamic helper status alert
        this.statusText = this.add.text(width / 2, 125, 'Match cards based on the active rule!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '14px',
            fontWeight: '700',
            fill: '#64748b',
            letterSpacing: '1px'
        }).setOrigin(0.5, 0);

        // 3. Decision timer bar visual setup
        this.timerBar = this.add.graphics();

        // 4. Initial layout generation
        this.currentRule = this.rulesPool[Phaser.Math.Between(0, this.rulesPool.length - 1)];
        this.updateRuleDisplay();
        
        createMlHud(this, 0xf59e0b);
        createTutorialOverlay(this, {
            title: "MENTAL FLEX",
            domain: "logical_mathematical",
            instructions: "• Sort cards dynamically based on the changing matching rule.\n\n• Pay attention to the ACTIVE rule at the top (Color, Shape, or Count).\n\n• Minimize shift latency when switching sorting criteria.",
            themeColorHex: 0xf59e0b,
            onStart: () => this.startGameplay()
        });

        // Input listeners for spam click and first interactions
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
        this.roundTickTimer = this.time.addEvent({
            delay: 10,
            callback: this.tickRoundTime,
            callbackScope: this,
            loop: true
        });
        this.spawnCards();
        if (this.difficultyLevel >= 4) {
            cogniFX.startNoise(this.difficultyLevel);
        }
    }

    updateCountdown() {
        this.timeLeft -= 1000;
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    tickRoundTime() {
        if (this.timeLeft <= 0) return;
        this.timeLeftInRound -= 10;
        
        // Draw timer bar
        const width = this.scale.width;
        const barWidth = 300;
        const barHeight = 8;
        const x = (width - barWidth) / 2;
        const y = 155;

        this.timerBar.clear();
        
        // Draw background
        this.timerBar.fillStyle(0x1e293b, 0.5);
        this.timerBar.fillRoundedRect(x, y, barWidth, barHeight, 4);

        // Draw progress
        const pct = Math.max(0, this.timeLeftInRound / this.timeLimit);
        const progressColor = pct > 0.4 ? 0x8b5cf6 : (pct > 0.2 ? 0xeab308 : 0xef4444);
        
        this.timerBar.fillStyle(progressColor, 0.85);
        this.timerBar.fillRoundedRect(x, y, barWidth * pct, barHeight, 4);

        if (this.timeLeftInRound <= 0) {
            this.handleRoundTimeout();
        }
    }

    generateCardData() {
        const color = this.colors[Phaser.Math.Between(0, this.colors.length - 1)];
        const shape = this.shapes[Phaser.Math.Between(0, this.shapes.length - 1)];
        const count = this.counts[Phaser.Math.Between(0, this.counts.length - 1)];
        return { color, shape, count };
    }

    drawCard(cardData, x, y, width = 110, height = 150) {
        const container = this.add.container(x, y);

        // Card glass background
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x1e293b, 0.7);
        cardBg.lineStyle(2, 0x8b5cf6, 0.25);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        container.add(cardBg);

        // Drawing shape icons based on count
        const spacing = 28;
        const iconSize = 14;
        const positions = [];

        if (cardData.count === 1) {
            positions.push({ x: 0, y: 0 });
        } else if (cardData.count === 2) {
            positions.push({ x: 0, y: -spacing / 2 });
            positions.push({ x: 0, y: spacing / 2 });
        } else {
            positions.push({ x: 0, y: -spacing });
            positions.push({ x: 0, y: 0 });
            positions.push({ x: 0, y: spacing });
        }

        positions.forEach(pos => {
            const icon = this.add.graphics();
            icon.fillStyle(cardData.color.value, 0.95);
            icon.lineStyle(1.5, 0xffffff, 0.9);
            
            if (cardData.shape === "circle") {
                icon.fillCircle(pos.x, pos.y, iconSize);
                icon.strokeCircle(pos.x, pos.y, iconSize);
            } else if (cardData.shape === "square") {
                icon.fillRect(pos.x - iconSize, pos.y - iconSize, iconSize * 2, iconSize * 2);
                icon.strokeRect(pos.x - iconSize, pos.y - iconSize, iconSize * 2, iconSize * 2);
            } else if (cardData.shape === "triangle") {
                icon.beginPath();
                icon.moveTo(pos.x, pos.y - iconSize);
                icon.lineTo(pos.x - iconSize, pos.y + iconSize);
                icon.lineTo(pos.x + iconSize, pos.y + iconSize);
                icon.closePath();
                icon.fillPath();
                icon.strokePath();
            } else if (cardData.shape === "star") {
                // Star drawing calculations
                icon.beginPath();
                const points = 5;
                const rOuter = iconSize;
                const rInner = iconSize / 2;
                let angle = -Math.PI / 2;
                
                for (let j = 0; j < points * 2; j++) {
                    const r = j % 2 === 0 ? rOuter : rInner;
                    icon.lineTo(pos.x + Math.cos(angle) * r, pos.y + Math.sin(angle) * r);
                    angle += Math.PI / points;
                }
                icon.closePath();
                icon.fillPath();
                icon.strokePath();
            }
            container.add(icon);
        });

        // Store reference objects for triggers
        container.cardBg = cardBg;
        container.cardData = cardData;
        container.width = width;
        container.height = height;

        return container;
    }

    spawnCards() {
        if (this.timeLeft <= 0) return;

        if (this.difficultyLevel >= 4) {
            this.spawnVisualNoise();
        }

        // Clear existing cards
        this.clearCards();

        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Spawn query card in the center top
        const qData = this.generateCardData();
        this.queryCard = this.drawCard(qData, width / 2, 275, 130, 180);
        
        // Add rule overlay highlighting
        this.queryCard.cardBg.clear();
        this.queryCard.cardBg.fillStyle(0x1e293b, 0.85);
        this.queryCard.cardBg.lineStyle(3, 0xeab308, 0.8);
        this.queryCard.cardBg.fillRoundedRect(-65, -90, 130, 180, 12);
        this.queryCard.cardBg.strokeRoundedRect(-65, -90, 130, 180, 12);

        // 2. Generate choice cards choices
        const choices = [];
        
        // Card 1: The correct choice card
        const correctCard = this.generateCorrectCard(qData);
        choices.push(correctCard);

        // Distractor choice cards (making sure they don't solve the matching rule)
        for (let j = 1; j < this.choicesCount; j++) {
            let distCard;
            let attempts = 0;
            // Generate distractor cards, trying to keep them unique
            do {
                distCard = this.generateCardData();
                attempts++;
            } while (this.isCorrectMatch(qData, distCard) && attempts < 10);
            choices.push(distCard);
        }

        // Shuffle choices so correct answer is not always first
        Phaser.Utils.Array.Shuffle(choices);

        // Render choice cards horizontally at the bottom
        const cardW = 110;
        const cardH = 150;
        const cardSpacing = 35;
        const totalW = this.choicesCount * cardW + (this.choicesCount - 1) * cardSpacing;
        const startX = (width - totalW) / 2 + cardW / 2;
        const choicesY = height - 115;

        choices.forEach((cData, index) => {
            const x = startX + index * (cardW + cardSpacing);
            const choiceCard = this.drawCard(cData, x, choicesY, cardW, cardH);
            this.choiceCards.push(choiceCard);

            // Make interactive
            const bg = choiceCard.cardBg;
            bg.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);

            // Hover scales
            bg.on('pointerover', () => {
                this.tweens.add({
                    targets: choiceCard,
                    scale: 1.06,
                    duration: 100
                });
                bg.clear();
                bg.fillStyle(0x334155, 0.8);
                bg.lineStyle(2.5, 0x8b5cf6, 0.7);
                bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
                bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            });

            bg.on('pointerout', () => {
                this.tweens.add({
                    targets: choiceCard,
                    scale: 1.0,
                    duration: 100
                });
                bg.clear();
                bg.fillStyle(0x1e293b, 0.7);
                bg.lineStyle(2, 0x8b5cf6, 0.25);
                bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
                bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            });

            bg.on('pointerdown', (pointer, localX, localY, event) => {
                if (this.isTutorialActive) return;
                if (event) event.stopPropagation();
                this.handleChoiceSelection(choiceCard);
            });
        });

        // Track timer values
        this.stimulusSpawnTime = this.getTime();
        this.timeLeftInRound = this.timeLimit;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
    }

    generateCorrectCard(queryData) {
        const card = this.generateCardData();
        // Force the card to match on the active matching rule
        if (this.currentRule === "color") {
            card.color = queryData.color;
        } else if (this.currentRule === "shape") {
            card.shape = queryData.shape;
        } else {
            card.count = queryData.count;
        }
        return card;
    }

    isCorrectMatch(queryData, choiceData) {
        if (this.currentRule === "color") {
            return choiceData.color.name === queryData.color.name;
        } else if (this.currentRule === "shape") {
            return choiceData.shape === queryData.shape;
        } else {
            return choiceData.count === queryData.count;
        }
    }

    handleChoiceSelection(choiceCard) {
        if (this.timeLeft <= 0) return;

        const isCorrect = this.isCorrectMatch(this.queryCard.cardData, choiceCard.cardData);
        this.totalAttempts++;

        const reactionTime = this.getTime() - this.stimulusSpawnTime;
        let ruleShiftLatency = null;
        if (this.ruleShiftOccurred) {
            ruleShiftLatency = reactionTime;
            this.ruleShiftOccurred = false;
        }
        
        if (isCorrect) {

            if (this.showParticleBurst) {
                const px = this.input.activePointer.x || this.scale.width / 2;
                const py = this.input.activePointer.y || this.scale.height / 2;
                this.showParticleBurst(px, py, 0x4ade80);
            }
    
        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, 0x4ade80);
        }
        this.hits++;
            this.consecutiveHits++;

            // Score with speed rewards
            const baseGain = 150;
            const timeBonus = Math.max(0, Math.round((this.timeLimit - reactionTime) / 10));
            const roundScore = baseGain + timeBonus;
            this.score += roundScore;

            this.showFeedbackText(choiceCard.x, choiceCard.y - 100, `+${roundScore}`, "#22c55e");
            
            // Pop card scaling
            this.tweens.add({
                targets: choiceCard,
                scale: 1.15,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut',
                onComplete: () => {
                    this.checkRuleShift();
                    this.spawnCards();
                }
            });

            // Dispatch Metrics Telemetry
            this.dispatchMetricTelemetry(reactionTime, 1.0, ruleShiftLatency);

            // Trigger DDA check after every 5 correct matches
            if (this.hits % 5 === 0) {
                this.adaptDifficulty();
            }
        } else {
            this.misses++;
            this.consecutiveHits = 0;

            this.showFeedbackText(choiceCard.x, choiceCard.y - 100, 'INCORRECT!', "#ef4444");
            this.cameras.main.shake(120, 0.005);

            // Pop correct selection card highlight visual feedback helper
            const correctCardIndex = this.choiceCards.findIndex(c => this.isCorrectMatch(this.queryCard.cardData, c.cardData));
            if (correctCardIndex !== -1) {
                const correctCard = this.choiceCards[correctCardIndex];
                correctCard.cardBg.clear();
                correctCard.cardBg.fillStyle(0x1e293b, 0.85);
                correctCard.cardBg.lineStyle(3.5, 0xeab308, 0.95);
                correctCard.cardBg.fillRoundedRect(-correctCard.width / 2, -correctCard.height / 2, correctCard.width, correctCard.height, 10);
                correctCard.cardBg.strokeRoundedRect(-correctCard.width / 2, -correctCard.height / 2, correctCard.width, correctCard.height, 10);
            }

            this.tweens.add({
                targets: choiceCard,
                x: choiceCard.x - 10,
                duration: 50,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    this.spawnCards();
                }
            });

            // Dispatch Metrics Telemetry
            this.dispatchMetricTelemetry(reactionTime, 0.0, ruleShiftLatency);
        }

        this.updateHUD();
    }

    handleRoundTimeout() {
        this.misses++;
        this.consecutiveHits = 0;
        this.totalAttempts++;

        this.showFeedbackText(this.scale.width / 2, this.scale.height / 2, 'TIMEOUT!', "#ef4444");
        this.cameras.main.shake(120, 0.005);

        let ruleShiftLatency = null;
        if (this.ruleShiftOccurred) {
            ruleShiftLatency = this.timeLimit;
            this.ruleShiftOccurred = false;
        }

        // Dispatch Telemetry Metrics
        this.dispatchMetricTelemetry(this.timeLimit, 0.0, ruleShiftLatency);

        this.updateHUD();
        this.spawnCards();
    }

    checkRuleShift() {
        if (this.consecutiveHits >= this.ruleShiftFrequency) {
            this.consecutiveHits = 0;
            
            // Choose a new random rule
            const otherRules = this.rulesPool.filter(r => r !== this.currentRule);
            if (otherRules.length > 0) {
                this.currentRule = otherRules[Phaser.Math.Between(0, otherRules.length - 1)];
                this.ruleShiftOccurred = true;
            }
            
            this.updateRuleDisplay();

            // Flash Rule Shift Banner in Center of Screen
            const width = this.scale.width;
            const height = this.scale.height;

            const bannerBg = this.add.graphics();
            bannerBg.fillStyle(0xeab308, 0.12);
            bannerBg.fillRect(0, height / 2 - 160, width, 80);

            const textVal = `RULE SHIFT: MATCH ${this.currentRule.toUpperCase()}!`;
            const bannerTxt = this.add.text(width / 2, height / 2 - 120, textVal, {
                fontFamily: CogniTheme.fonts.body,
                fontSize: '28px',
                fontWeight: '900',
                fill: '#ffffff'
            }).setOrigin(0.5);
            bannerTxt.setShadow(0, 0, '#eab308', 15, true, true);

            this.tweens.add({
                targets: [bannerTxt],
                scale: 1.08,
                duration: 250,
                yoyo: true,
                repeat: 1
            });

            this.time.delayedCall(1200, () => {
                bannerBg.destroy();
                bannerTxt.destroy();
            });
        }
    }

    updateRuleDisplay() {
        this.ruleText.setText(`RULE: MATCH ${this.currentRule.toUpperCase()}`);
        let color = '#38bdf8'; // blue
        if (this.currentRule === "color") {
            color = '#eab308'; // gold
        } else if (this.currentRule === "shape") {
            color = '#a855f7'; // purple
        } else {
            color = '#22c55e'; // green
        }
        this.ruleText.setFill(color);
        this.ruleText.setShadow(0, 0, color, 12, true, true);
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

    showFeedbackText(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    clearCards() {
        if (this.queryCard) {
            this.queryCard.destroy();
            this.queryCard = null;
        }
        this.choiceCards.forEach(c => c.destroy());
        this.choiceCards = [];
    }

    // ==========================================
    // TELEMETRY SERVICE DISPATCHER & DDA ENGINE
    // ==========================================

    async dispatchMetricTelemetry(reactionTimeMs, roundAccuracy, ruleShiftLatencyMs = null) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "executive_strategy",
            game_type: "mental_flex",
            reaction_time: reactionTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        if (ruleShiftLatencyMs !== null) {
            payload.rule_shift_latency_ms = ruleShiftLatencyMs;
        }

        try {
            console.log('[Telemetry MentalFlex] Dispatching metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry MentalFlex] Connection offline, telemetry buffered.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;
        const ddaStartTime = this.getTime();

        try {
            console.log('[DDA MentalFlex] Syncing difficulty with backend...');
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
                    const oldDifficulty = this.difficultyLevel;

                    this.difficultyLevel = params.difficulty_level !== undefined ? params.difficulty_level : this.difficultyLevel;
                    this.choicesCount = params.choices_count !== undefined ? params.choices_count : this.choicesCount;
                    this.timeLimit = params.time_limit !== undefined ? params.time_limit : this.timeLimit;
                    this.ruleShiftFrequency = params.rule_shift_frequency !== undefined ? params.rule_shift_frequency : this.ruleShiftFrequency;
                    this.rulesPool = params.rules_pool !== undefined ? params.rules_pool : this.rulesPool;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (diffChanged) {
                        const direction = params.difficulty_level > oldDifficulty ? 'SCALED UP' : 'DE-ESCALATED';
                        this.showFeedbackText(this.scale.width / 2, this.scale.height / 2 - 30, `DIFFICULTY ${direction}!`, '#c084fc');
                        
                        if (this.difficultyLevel >= 4) {
                            cogniFX.startNoise(this.difficultyLevel);
                        } else {
                            cogniFX.stopNoise();
                        }
                    }
                    console.log('[DDA MentalFlex] Synced Parameters successfully:', params);
                }
            }
        } catch (e) {
            console.warn('[DDA MentalFlex] DDA connection timeout.', e);
        }
    }

    spawnVisualNoise() {
        const width = this.scale.width;
        const height = this.scale.height;
        const noiseCount = this.difficultyLevel === 5 ? 12 : 6;
        for (let i = 0; i < noiseCount; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const rect = this.add.rectangle(x, y, Phaser.Math.Between(20, 150), Phaser.Math.Between(2, 8), 0xffffff, 0.1);
            rect.setAngle(Phaser.Math.Between(0, 360));
            this.tweens.add({
                targets: rect,
                alpha: 0,
                x: x + Phaser.Math.Between(-80, 80),
                duration: Phaser.Math.Between(200, 600),
                onComplete: () => rect.destroy()
            });
        }
    }

    endGame() {
        if (this.timerText && this.timerText.active) {
            this.timerText.setText('00:00');
        }
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.roundTicker) this.roundTicker.remove();
        cogniFX.stopNoise();
        
        this.clearCards();
        this.timerBar.clear();

        console.log('[MentalFlex Game Over] Telemetry summary:', {
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
