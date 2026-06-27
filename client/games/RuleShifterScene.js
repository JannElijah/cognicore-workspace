import Phaser from 'phaser';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class RuleShifterScene extends BaseCognitiveScene {
    constructor() {
        super('RuleShifterScene');
    }

    init(data) {
        data = data || {};
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || 'http://127.0.0.1:5000';
        this.onGameOver = data.onGameOver || null;

        // DDA variables mapping
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.ruleSwitchInterval = dda.rule_switch_interval || 6;
        this.choiceCount = dda.choice_count || 3;
        this.explicitHint = dda.explicit_hint !== undefined ? dda.explicit_hint : true;
        this.gameDuration = dda.time_limit || 60000;
        this.timeLeft = this.gameDuration;

        // Core Game States
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.highConfidenceCount = 0;

        // Rule Switching State
        this.rulesList = ['color', 'shape', 'count'];
        this.currentRule = 'color';
        this.trialsSinceSwitch = 0;
        this.lastSwitchTime = 0;
        this.ruleShiftLatency = 0;

        // Micro-behavior Latency Tracking
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;

        // Card definitions
        this.colors = [
            { name: 'RED', value: 0xef4444 },
            { name: 'BLUE', value: 0x38bdf8 },
            { name: 'GREEN', value: 0x22c55e },
            { name: 'YELLOW', value: 0xeab308 }
        ];
        this.shapes = ['circle', 'square', 'triangle', 'star'];
        this.counts = [1, 2, 3, 4];

        // Phaser objects
        this.queryCard = null;
        this.choiceCards = [];
        this.selectedChoiceCard = null;
        
        // UI Components
        this.scoreText = null;
        this.accuracyText = null;
        this.difficultyText = null;
        this.timerText = null;
        this.rulePanelText = null;
        this.statusText = null;
        this.confidenceModal = null;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // 1. Dark purple-navy gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x02020a, 0x02020a, 0x0c071a, 0x0c071a, 1);
        bg.fillRect(0, 0, W, H);

        // Cyber Grid Lines
        const grid = this.add.grid(W / 2, H / 2, W, H, 80, 80, 0x000000, 0, 0xa855f7, 0.02);
        grid.setOrigin(0.5);

        // 2. HUD Setup
        this.scoreText = this.add.text(20, 18, 'SCORE: 0', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '22px', fontWeight: 'bold', fill: '#a855f7'
        });

        this.accuracyText = this.add.text(20, 46, 'ACCURACY: 100%', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px', fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(W - 20, 18, `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '22px', fontWeight: 'bold', fill: '#c084fc'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(W / 2, 18, '01:00', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '30px', fontWeight: 'bold', fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Matching Rule status bar
        const rPanelBg = this.add.graphics();
        rPanelBg.fillStyle(0x09090b, 0.75);
        rPanelBg.lineStyle(1.5, 0xa855f7, 0.4);
        rPanelBg.fillRoundedRect(W / 2 - 200, 80, 400, 42, 8);
        rPanelBg.strokeRoundedRect(W / 2 - 200, 80, 400, 42, 8);

        this.rulePanelText = this.add.text(W / 2, 101, 'RULE: MATCH COLOR', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px', fontWeight: '800', fill: '#c084fc', letterSpacing: '0.05em'
        }).setOrigin(0.5);

        this.statusText = this.add.text(W / 2, 136, 'CHOOSE THE CORRECT MATCH CARD BELOW', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px', fontWeight: '600', fill: '#64748b'
        }).setOrigin(0.5, 0);

        // 3. Create Confidence Modal (initially hidden)
        this._buildConfidenceModal();

        // 4. Input handling
        // topOnly = false so Graphics inside Containers receive pointer events
        this.input.topOnly = false;
        this.input.on('pointerdown', (ptr, gos) => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            if (gos.length === 0) {
                const now = this.time.now;
                if (now - this.lastMissTime < 200) this.spamClickCount++;
                this.lastMissTime = now;
            }
        });
        this.input.on('pointermove', () => this.registerFirstInteraction());

        // 5. Initialize shared HUD overlays & tutorial
        createMlHud(this, 0xa855f7);
        createTutorialOverlay(this, {
            title: "RULE SHIFTER",
            domain: "executive_strategy",
            instructions: "• Match choice cards to the target template at the top center.\n\n• The rule switches dynamically (Color, Shape, or Count).\n\n• Implicit switches require you to discover rules via choice feedback.\n\n• Rate your Decision Confidence to increase points risk/reward.",
            themeColorHex: 0xa855f7,
            onStart: () => this.startGameplay()
        });
    }

    update() {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;

        const elapsed = this.time.now - this.roundStartTime;
        this.timeLeft = Math.max(0, this.gameDuration - elapsed);

        const s = Math.ceil(this.timeLeft / 1000);
        const m = Math.floor(s / 60);
        this.timerText.setText(`${m < 10 ? '0' : ''}${m}:${(s % 60) < 10 ? '0' : ''}${s % 60}`);

        if (this.timeLeft <= 0) this.endGame();
    }

    startGameplay() {
        this.isTutorialActive = false;
        this.gamePhase = 'PLAYING';
        this.roundStartTime = this.time.now;
        this.lastSwitchTime = this.time.now;
        this.spawnCards();
    }

    // ══════════════════════════════════════════════════════
    //  CARD SPAWNING & LAYOUT
    // ══════════════════════════════════════════════════════

    spawnCards() {
        this.clearCards();
        this.selectedChoiceCard = null;

        const W = this.scale.width;
        
        // 1. Generate query card
        const qData = this._randomCard();
        this.queryCard = this.drawCard(qData, W / 2, 235, 125, 170, true);

        // 2. Generate Choice Cards
        const choices = [];
        
        // A. The Correct match
        const correctData = this._generateCorrectChoice(qData);
        choices.push(correctData);

        // B. Distractors (must not match target on current active rule)
        const attempts = 0;
        while (choices.length < this.choiceCount) {
            const dData = this._randomCard();
            
            // Enforce that it differs on current rule
            const isMatch = this._isMatch(qData, dData, this.currentRule);
            // Also ensure it is not exactly identical to any card already in choices
            const isDup = choices.some(c => c.color.name === dData.color.name && c.shape === dData.shape && c.count === dData.count);

            if (!isMatch && !isDup) {
                choices.push(dData);
            }
        }

        // Shuffle choices
        Phaser.Utils.Array.Shuffle(choices);

        // Draw Choices
        const spacing = this.choiceCount === 4 ? 150 : 185;
        const startX = W / 2 - (spacing * (this.choiceCount - 1)) / 2;
        const choiceY = 445;

        choices.forEach((cData, idx) => {
            const cardX = startX + idx * spacing;
            const card = this.drawCard(cData, cardX, choiceY, 110, 150, false);
            this.choiceCards.push(card);

            // Graphics objects require an explicit hit-area shape — setInteractive()
            // with no args silently fails on Graphics in Phaser 3.
            card.cardBg.setInteractive(
                new Phaser.Geom.Rectangle(-55, -75, 110, 150),
                Phaser.Geom.Rectangle.Contains
            );

            card.cardBg.on('pointerover', () => {
                if (this.confidenceModal.visible || this.gamePhase !== 'PLAYING') return;
                card.cardBg.clear();
                card.cardBg.fillStyle(0x1e293b, 0.75);
                card.cardBg.lineStyle(3, 0xa855f7, 0.9);
                card.cardBg.fillRoundedRect(-55, -75, 110, 150, 10);
                card.cardBg.strokeRoundedRect(-55, -75, 110, 150, 10);
                this.game.canvas.style.cursor = 'pointer';
            });
            card.cardBg.on('pointerout', () => {
                this.game.canvas.style.cursor = 'default';
                if (!this.confidenceModal.visible && this.gamePhase === 'PLAYING') {
                    card.cardBg.clear();
                    card.cardBg.fillStyle(0x1e293b, 0.6);
                    card.cardBg.lineStyle(1.5, 0x8b5cf6, 0.25);
                    card.cardBg.fillRoundedRect(-55, -75, 110, 150, 10);
                    card.cardBg.strokeRoundedRect(-55, -75, 110, 150, 10);
                }
            });
            card.cardBg.on('pointerdown', () => {
                if (this.confidenceModal.visible || this.gamePhase !== 'PLAYING') return;
                this.handleCardSelection(card);
            });
        });

        // Set stimulus timestamp
        this.stimulusSpawnTime = this.time.now;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
    }

    drawCard(cardData, x, y, width, height, isTarget = false) {
        const container = this.add.container(x, y);

        // Glassmorphic background
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x1e293b, 0.6);
        cardBg.lineStyle(1.5, isTarget ? 0xeab308 : 0x8b5cf6, isTarget ? 0.8 : 0.25);
        cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        container.add(cardBg);

        // Symbols spacing calculations
        const spacing = 28;
        const size = 13;
        const positions = [];

        if (cardData.count === 1) {
            positions.push({ x: 0, y: 0 });
        } else if (cardData.count === 2) {
            positions.push({ x: 0, y: -spacing / 2 });
            positions.push({ x: 0, y: spacing / 2 });
        } else if (cardData.count === 3) {
            positions.push({ x: 0, y: -spacing });
            positions.push({ x: 0, y: 0 });
            positions.push({ x: 0, y: spacing });
        } else {
            positions.push({ x: -spacing / 2, y: -spacing / 2 });
            positions.push({ x: spacing / 2, y: -spacing / 2 });
            positions.push({ x: -spacing / 2, y: spacing / 2 });
            positions.push({ x: spacing / 2, y: spacing / 2 });
        }

        positions.forEach(pos => {
            const sym = this.add.graphics();
            sym.fillStyle(cardData.color.value, 0.95);
            sym.lineStyle(1.5, 0xffffff, 0.95);

            if (cardData.shape === 'circle') {
                sym.fillCircle(pos.x, pos.y, size);
                sym.strokeCircle(pos.x, pos.y, size);
            } else if (cardData.shape === 'square') {
                sym.fillRect(pos.x - size, pos.y - size, size * 2, size * 2);
                sym.strokeRect(pos.x - size, pos.y - size, size * 2, size * 2);
            } else if (cardData.shape === 'triangle') {
                sym.beginPath();
                sym.moveTo(pos.x, pos.y - size);
                sym.lineTo(pos.x - size, pos.y + size);
                sym.lineTo(pos.x + size, pos.y + size);
                sym.closePath();
                sym.fillPath();
                sym.strokePath();
            } else if (cardData.shape === 'star') {
                sym.beginPath();
                const pts = 5;
                const rOut = size;
                const rIn = size / 2.2;
                let angle = -Math.PI / 2;
                for (let k = 0; k < pts * 2; k++) {
                    const r = k % 2 === 0 ? rOut : rIn;
                    sym.lineTo(pos.x + Math.cos(angle) * r, pos.y + Math.sin(angle) * r);
                    angle += Math.PI / pts;
                }
                sym.closePath();
                sym.fillPath();
                sym.strokePath();
            }
            container.add(sym);
        });

        // Store reference properties
        container.cardBg = cardBg;
        container.cardData = cardData;
        container.width = width;
        container.height = height;

        return container;
    }

    clearCards() {
        if (this.queryCard) {
            this.queryCard.destroy();
            this.queryCard = null;
        }
        this.choiceCards.forEach(c => c.destroy());
        this.choiceCards = [];
    }

    // ══════════════════════════════════════════════════════
    //  INTERACTION & DECISION CONFIDENCE
    // ══════════════════════════════════════════════════════

    handleCardSelection(choiceCard) {
        this.registerFirstInteraction();
        this.selectedChoiceCard = choiceCard;

        // Visual feedback selection outline
        choiceCard.cardBg.clear();
        choiceCard.cardBg.fillStyle(0x1e293b, 0.85);
        choiceCard.cardBg.lineStyle(3.5, 0xeab308, 0.95);
        choiceCard.cardBg.fillRoundedRect(-55, -75, 110, 150, 10);
        choiceCard.cardBg.strokeRoundedRect(-55, -75, 110, 150, 10);

        // Display decision confidence options overlay
        const targetY = choiceCard.y - 120;
        this.confidenceModal.setPosition(choiceCard.x, targetY);
        this.confidenceModal.setActive(true);
        this.confidenceModal.setVisible(true);

        this.statusText.setText('SELECT YOUR DECISION CONFIDENCE LEVEL').setFill('#eab308');
    }

    submitConfidence(level) {
        if (!this.selectedChoiceCard) return;

        this.confidenceModal.setVisible(false);
        this.confidenceModal.setActive(false);
        this.totalAttempts++;

        const isCorrect = this._isMatch(
            this.queryCard.cardData,
            this.selectedChoiceCard.cardData,
            this.currentRule
        );

        const latency = this.time.now - this.stimulusSpawnTime;
        let points = 0;

        if (level === 'HIGH') {
            this.highConfidenceCount++;
            if (isCorrect) {
                points = 200;
                this.hits++;
                this.statusText.setText('HIGH CONFIDENCE SUCCESS!').setFill('#22c55e');
                this.cameras.main.flash(120, 34, 197, 94, 0.1);
            } else {
                points = -100;
                this.misses++;
                this.statusText.setText('HIGH CONFIDENCE ERROR!').setFill('#ef4444');
                this.cameras.main.shake(120, 0.007);
            }
        } else {
            // LOW confidence
            if (isCorrect) {
                points = 50;
                this.hits++;
                this.statusText.setText('CORRECT MATCH!').setFill('#38bdf8');
            } else {
                points = -10;
                this.misses++;
                this.statusText.setText('INCORRECT MATCH.').setFill('#f59e0b');
                this.cameras.main.shake(80, 0.003);
            }
        }

        this.score = Math.max(0, this.score + points);
        this.updateHUD();

        // Reveal correct matching border if they were wrong
        if (!isCorrect) {
            const correctCard = this.choiceCards.find(c =>
                this._isMatch(this.queryCard.cardData, c.cardData, this.currentRule)
            );
            if (correctCard) {
                correctCard.cardBg.clear();
                correctCard.cardBg.fillStyle(0x1e293b, 0.65);
                correctCard.cardBg.lineStyle(3.5, 0x22c55e, 0.9);
                correctCard.cardBg.fillRoundedRect(-55, -75, 110, 150, 10);
                correctCard.cardBg.strokeRoundedRect(-55, -75, 110, 150, 10);
            }
        }

        // Floating points popup
        const color = isCorrect ? '#22c55e' : '#ef4444';
        const floatText = points >= 0 ? `+${points}` : `${points}`;
        this._showFloat(floatText, this.selectedChoiceCard.x, this.selectedChoiceCard.y - 120, color);

        // Handle rule switching progression
        this.trialsSinceSwitch++;
        
        let latencyOnSwitch = 0;
        if (this.trialsSinceSwitch === 1) {
            latencyOnSwitch = latency;
        }

        this.dispatchRoundTelemetry(latency, isCorrect ? 1.0 : 0.0, level, latencyOnSwitch);

        // Schedule next puzzle
        this.time.delayedCall(1600, () => {
            if (this.timeLeft <= 0) return;
            
            if (this.trialsSinceSwitch >= this.ruleSwitchInterval) {
                this.switchRule();
            } else {
                this.spawnCards();
            }
        });
    }

    switchRule() {
        this.trialsSinceSwitch = 0;
        const oldRule = this.currentRule;
        
        // Pick a different rule
        const candidates = this.rulesList.filter(r => r !== oldRule);
        this.currentRule = Phaser.Utils.Array.GetRandom(candidates);
        this.lastSwitchTime = this.time.now;

        // Visual flash message
        const W = this.scale.width;
        
        if (this.explicitHint) {
            this.rulePanelText.setText(`RULE: MATCH ${this.currentRule.toUpperCase()}`);
            this._showFloat(`RULE SWITCHED: MATCH ${this.currentRule.toUpperCase()}!`, W / 2, 275, '#c084fc');
        } else {
            this.rulePanelText.setText('RULE: MATCH BY [?]');
            this._showFloat('RULE SWITCHED! DISCOVER THE NEW MATCH PATTERN', W / 2, 275, '#c084fc');
        }

        this.cameras.main.flash(180, 168, 85, 247, 0.15);

        this.time.delayedCall(1000, () => {
            if (this.timeLeft <= 0) return;
            this.spawnCards();
        });
    }

    // ══════════════════════════════════════════════════════
    //  UI HELPERS & MODAL BUILDERS
    // ══════════════════════════════════════════════════════

    _buildConfidenceModal() {
        this.confidenceModal = this.add.container(0, 0);
        this.confidenceModal.setVisible(false);
        this.confidenceModal.setActive(false);

        // Backplate frame
        const plate = this.add.graphics();
        plate.fillStyle(0x0a0a0f, 0.95);
        plate.lineStyle(2, 0xa855f7, 0.85);
        plate.fillRoundedRect(-110, -50, 220, 100, 8);
        plate.strokeRoundedRect(-110, -50, 220, 100, 8);
        this.confidenceModal.add(plate);

        const heading = this.add.text(0, -38, 'CONFIDENCE LEVEL?', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px', fontWeight: '800', fill: '#a855f7'
        }).setOrigin(0.5);
        this.confidenceModal.add(heading);

        // HIGH confidence button
        const btnHigh = this.add.graphics();
        btnHigh.fillStyle(0x22c55e, 0.85);
        btnHigh.lineStyle(1.5, 0xffffff, 0.8);
        btnHigh.fillRoundedRect(-95, -18, 90, 42, 6);
        btnHigh.strokeRoundedRect(-95, -18, 90, 42, 6);
        btnHigh.setInteractive(new Phaser.Geom.Rectangle(-95, -18, 90, 42), Phaser.Geom.Rectangle.Contains);
        this.confidenceModal.add(btnHigh);

        const txtHigh = this.add.text(-50, 3, 'HIGH\n+200 / -100', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px', fontWeight: '700', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5);
        this.confidenceModal.add(txtHigh);

        // LOW confidence button
        const btnLow = this.add.graphics();
        btnLow.fillStyle(0xeab308, 0.85);
        btnLow.lineStyle(1.5, 0xffffff, 0.8);
        btnLow.fillRoundedRect(5, -18, 90, 42, 6);
        btnLow.strokeRoundedRect(5, -18, 90, 42, 6);
        btnLow.setInteractive(new Phaser.Geom.Rectangle(5, -18, 90, 42), Phaser.Geom.Rectangle.Contains);
        this.confidenceModal.add(btnLow);

        const txtLow = this.add.text(50, 3, 'LOW\n+50 / -10', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px', fontWeight: '700', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5);
        this.confidenceModal.add(txtLow);

        // Handlers
        btnHigh.on('pointerover', () => {
            btnHigh.clear();
            btnHigh.fillStyle(0x22c55e, 1.0);
            btnHigh.lineStyle(2, 0xffffff, 1.0);
            btnHigh.fillRoundedRect(-95, -18, 90, 42, 6);
            btnHigh.strokeRoundedRect(-95, -18, 90, 42, 6);
            this.game.canvas.style.cursor = 'pointer';
        });
        btnHigh.on('pointerout', () => {
            btnHigh.clear();
            btnHigh.fillStyle(0x22c55e, 0.85);
            btnHigh.lineStyle(1.5, 0xffffff, 0.8);
            btnHigh.fillRoundedRect(-95, -18, 90, 42, 6);
            btnHigh.strokeRoundedRect(-95, -18, 90, 42, 6);
            this.game.canvas.style.cursor = 'default';
        });
        btnHigh.on('pointerdown', () => this.submitConfidence('HIGH'));

        btnLow.on('pointerover', () => {
            btnLow.clear();
            btnLow.fillStyle(0xeab308, 1.0);
            btnLow.lineStyle(2, 0xffffff, 1.0);
            btnLow.fillRoundedRect(5, -18, 90, 42, 6);
            btnLow.strokeRoundedRect(5, -18, 90, 42, 6);
            this.game.canvas.style.cursor = 'pointer';
        });
        btnLow.on('pointerout', () => {
            btnLow.clear();
            btnLow.fillStyle(0xeab308, 0.85);
            btnLow.lineStyle(1.5, 0xffffff, 0.8);
            btnLow.fillRoundedRect(5, -18, 90, 42, 6);
            btnLow.strokeRoundedRect(5, -18, 90, 42, 6);
            this.game.canvas.style.cursor = 'default';
        });
        btnLow.on('pointerdown', () => this.submitConfidence('LOW'));
    }

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.accuracy = this.totalAttempts > 0 ? this.hits / this.totalAttempts : 1.0;
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    _showFloat(text, x, y, color) {
        const ft = this.add.text(x, y, text, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px', fontWeight: 'bold', fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: ft,
            y: y - 50,
            alpha: 0,
            duration: 1200,
            onComplete: () => { if (ft && ft.active) ft.destroy(); }
        });
    }

    // ══════════════════════════════════════════════════════
    //  GENERATORS & MATCH CHECKERS
    // ══════════════════════════════════════════════════════

    _randomCard() {
        const c = Phaser.Utils.Array.GetRandom(this.colors);
        const s = Phaser.Utils.Array.GetRandom(this.shapes);
        const ct = Phaser.Utils.Array.GetRandom(this.counts);
        return { color: c, shape: s, count: ct };
    }

    _generateCorrectChoice(queryData) {
        // Generates a card that matches the query card by the CURRENT active rule
        // but differs by the other two rules.
        const c = queryData.color;
        const s = queryData.shape;
        const ct = queryData.count;

        let resColor = c;
        let resShape = s;
        let resCount = ct;

        if (this.currentRule === 'color') {
            resShape = Phaser.Utils.Array.GetRandom(this.shapes.filter(x => x !== s));
            resCount = Phaser.Utils.Array.GetRandom(this.counts.filter(x => x !== ct));
        } else if (this.currentRule === 'shape') {
            resColor = Phaser.Utils.Array.GetRandom(this.colors.filter(x => x.name !== c.name));
            resCount = Phaser.Utils.Array.GetRandom(this.counts.filter(x => x !== ct));
        } else if (this.currentRule === 'count') {
            resColor = Phaser.Utils.Array.GetRandom(this.colors.filter(x => x.name !== c.name));
            resShape = Phaser.Utils.Array.GetRandom(this.shapes.filter(x => x !== s));
        }

        return { color: resColor, shape: resShape, count: resCount };
    }

    _isMatch(cardA, cardB, rule) {
        if (rule === 'color') {
            return cardA.color.name === cardB.color.name;
        } else if (rule === 'shape') {
            return cardA.shape === cardB.shape;
        } else if (rule === 'count') {
            return cardA.count === cardB.count;
        }
        return false;
    }

    // ══════════════════════════════════════════════════════
    //  DDA & TELEMETRY
    // ══════════════════════════════════════════════════════

    async dispatchRoundTelemetry(solveTimeMs, roundAccuracy, confidenceLevel, latencyOnSwitch = 0) {
        if (!this.sessionId) return;
        const payload = {
            session_id: this.sessionId,
            cognitive_domain: 'executive_strategy',
            game_type: 'RuleShifter',
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount,
            rule_shift_latency_ms: latencyOnSwitch > 0 ? latencyOnSwitch : null,
            // custom tracking inside payload
            decision_confidence: confidenceLevel === 'HIGH' ? 1.0 : 0.5
        };

        try {
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry] RuleShifter unreachable.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;
        this.statusText.setText('ADAPTING RULE SETTINGS...').setFill('#64748b');
        try {
            const resp = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const p = data.dda_parameters;
                    this.difficultyLevel = p.difficulty_level;
                    this.ruleSwitchInterval = p.rule_switch_interval;
                    this.choiceCount = p.choice_count;
                    this.explicitHint = p.explicit_hint !== undefined ? p.explicit_hint : this.explicitHint;
                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);
                }
            }
        } catch (e) {
            console.warn('[DDA] RuleShifter adaptive query failed.', e);
        }
    }

    endGame() {
        this.gamePhase = 'FINISHED';
        this.clearCards();
        console.log('[RuleShifter] Game Over:', {
            score: this.score, hits: this.hits,
            misses: this.misses, accuracy: this.accuracy
        });
        if (this.onGameOver) {
            const confidenceRate = this.totalAttempts > 0 ? this.highConfidenceCount / this.totalAttempts : 0.0;
            this.onGameOver({
                score: this.score,
                hits: this.hits,
                misses: this.misses,
                accuracy: this.accuracy,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms: this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount,
                confidenceRate: confidenceRate
            });
        }
    }
}
