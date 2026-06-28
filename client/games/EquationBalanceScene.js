import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class EquationBalanceScene extends BaseCognitiveScene {
    constructor() {
        super('EquationBalanceScene');
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || 'http://127.0.0.1:5000';
        this.onGameOver = data.onGameOver || null;

        // DDA variables (Reasoning & Problem Solving)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.numRange = dda.num_range || 10;
        this.operators = dda.operators || ['+', '-'];
        this.missingType = dda.missing_type || 'operator';
        this.roundTimeLimit = dda.time_limit || 10000;

        // Session variables
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalAttempts = 0;
        this.accuracy = 1.0;
        this.gameDuration = 45000; // 45 seconds total game duration
        this.timeLeft = this.gameDuration;

        this.gamePhase = 'PLAYING'; // PLAYING | FEEDBACK | GAMEOVER
        this.roundStartTime = 0;
        this.roundTimeRemaining = this.roundTimeLimit;

        // Active puzzle details
        this.activePuzzle = null;
        this.optionButtons = [];

        // Micro-behavior metrics
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Gradient dark violet/navy background
        this.createStandardBackground();// Circular background grid overlay
        const grid = this.add.grid(width / 2, height / 2, width, height, 60, 60, 0x000000, 0, 0xf59e0b, 0.02);
        grid.setOrigin(0.5);

        // HUD Elements
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#f59e0b' // gold color for math logic theme
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

        this.timerText = this.add.text(width / 2, 20, '00:45', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(width / 2, 90, 'BALANCE THE EQUATION!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '20px',
            fontWeight: '800',
            fill: '#e2e8f0',
            letterSpacing: '0.05em'
        }).setOrigin(0.5, 0);

        // Round timer progress bar (shrinks as time runs out)
        this.roundTimerBg = this.add.graphics();
        this.roundTimerBg.fillStyle(0x374151, 0.5);
        this.roundTimerBg.fillRoundedRect(width / 2 - 200, 130, 400, 10, 5);

        this.roundTimerBar = this.add.graphics();

        // Main glowing panel for equation
        this.equationPanel = this.add.graphics();
        this.equationPanel.fillStyle(0x1e293b, 0.4);
        this.equationPanel.lineStyle(2, 0xf59e0b, 0.45);
        this.equationPanel.fillRoundedRect(width / 2 - 280, 160, 560, 160, 16);
        this.equationPanel.strokeRoundedRect(width / 2 - 280, 160, 560, 160, 16);

        // Text display for equation
        this.equationTextDisplay = this.add.text(width / 2, 240, '', {
            fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
            fontSize: '44px',
            fontWeight: '800',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Setup ML HUD & Tutorial Overlay
        createMlHud(this, 0xf59e0b);
        createTutorialOverlay(this, {
            title: "EQUATION BALANCE",
            domain: "logical_mathematical",
            instructions: "• Balance the equation by choosing the correct missing operator/number.\n\n• Work quickly to gain larger time bonuses.\n\n• Incorrect answers shake screen and incur a score penalty.",
            themeColorHex: 0xf59e0b,
            onStart: () => this.startGameplay()
        });

        // Micro-behavior tracking listeners
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
    }

    update() {
        if (!this.isTutorialActive && this.gamePhase === 'PLAYING') {
            const elapsed = this.time.now - this.roundStartTime;
            this.roundTimeRemaining = Math.max(0, this.roundTimeLimit - elapsed);

            // Draw round timer progress bar
            const width = this.scale.width;
            this.roundTimerBar.clear();
            
            let color = 0xf59e0b; // gold/amber
            if (this.roundTimeRemaining / this.roundTimeLimit < 0.3) {
                color = 0xef4444; // red alert
            }
            this.roundTimerBar.fillStyle(color, 0.95);
            const fillWidth = (this.roundTimeRemaining / this.roundTimeLimit) * 400;
            if (fillWidth > 0) {
                this.roundTimerBar.fillRoundedRect(width / 2 - 200, 130, fillWidth, 10, 5);
            }

            if (this.roundTimeRemaining <= 0) {
                this.handleTimeout();
            }
        }
    }

    startGameplay() {
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateOverallTimer,
            callbackScope: this,
            loop: true
        });
        this.startNewPuzzle();
    }

    updateOverallTimer() {
        this.timeLeft -= 1000;
        const seconds = Math.ceil(this.timeLeft / 1000);
        this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    generateEquation() {
        const opSymbols = this.operators;
        const maxVal = this.numRange;

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randOp = () => opSymbols[Math.floor(Math.random() * opSymbols.length)];

        let equationText = '';
        let missingElement = '';
        let correctAnswer = '';
        let distractors = [];

        // Basic Equation Balance: Level 1 to 3
        if (this.difficultyLevel <= 3) {
            let op = randOp();
            let a, b, c;
            
            if (op === '+') {
                a = rand(1, maxVal - 2);
                b = rand(1, maxVal - a);
                c = a + b;
            } else if (op === '-') {
                a = rand(2, maxVal);
                b = rand(1, a - 1);
                c = a - b;
            } else if (op === '*') {
                a = rand(2, Math.floor(Math.sqrt(maxVal)) || 3);
                b = rand(2, Math.floor(maxVal / a) || 3);
                c = a * b;
            } else { // '/'
                b = rand(2, 6);
                c = rand(2, 8);
                a = b * c;
                op = '/';
            }

            let type = this.missingType;
            if (type === 'random') {
                type = Math.random() < 0.5 ? 'operator' : 'operand';
            }

            if (type === 'operator') {
                equationText = `${a}   ?   ${b}  =  ${c}`;
                missingElement = 'operator';
                correctAnswer = op;
                
                // standard mathematical symbols
                const mapOp = { '+': '+', '-': '-', '*': '×', '/': '÷' };
                correctAnswer = mapOp[op];
                distractors = Object.keys(mapOp).filter(o => o !== op).map(o => mapOp[o]);
            } else {
                // Hide B
                const displayOp = { '+': '+', '-': '-', '*': '×', '/': '÷' }[op];
                equationText = `${a}  ${displayOp}  ?  =  ${c}`;
                missingElement = 'operand';
                correctAnswer = b.toString();
                
                const dists = new Set();
                while (dists.size < 3) {
                    let d = b + rand(-4, 4);
                    if (d > 0 && d !== b) dists.add(d.toString());
                }
                distractors = Array.from(dists);
            }
        } 
        // Moderate Equation Balance: Level 4 (LHS = RHS)
        else if (this.difficultyLevel === 4) {
            let op1 = randOp();
            let op2 = randOp();
            let a, b, lhs_val;
            
            if (op1 === '+') { a = rand(1, 15); b = rand(1, 15); lhs_val = a + b; }
            else if (op1 === '-') { a = rand(10, 30); b = rand(1, 9); lhs_val = a - b; }
            else if (op1 === '*') { a = rand(2, 6); b = rand(2, 6); lhs_val = a * b; }
            else { b = rand(2, 5); lhs_val = rand(2, 6); a = b * lhs_val; }

            let c, d;
            if (op2 === '+') {
                c = rand(1, lhs_val - 1) || 1;
                d = lhs_val - c;
            } else if (op2 === '-') {
                d = rand(2, 10);
                c = lhs_val + d;
            } else if (op2 === '*') {
                const factors = [];
                for (let i = 1; i <= lhs_val; i++) {
                    if (lhs_val % i === 0) factors.push(i);
                }
                c = factors[Math.floor(Math.random() * factors.length)];
                d = lhs_val / c;
            } else { // '/'
                d = rand(2, 4);
                c = lhs_val * d;
            }

            const mapOp = { '+': '+', '-': '-', '*': '×', '/': '÷' };
            const dispOp1 = mapOp[op1];
            const dispOp2 = mapOp[op2];

            if (Math.random() < 0.5) {
                equationText = `${a} ${dispOp1} ${b}  =  ${c}   ?   ${d}`;
                missingElement = 'operator';
                correctAnswer = dispOp2;
                distractors = Object.keys(mapOp).filter(o => o !== op2).map(o => mapOp[o]);
            } else {
                equationText = `${a} ${dispOp1} ${b}  =  ${c} ${dispOp2} ?`;
                missingElement = 'operand';
                correctAnswer = d.toString();
                const dists = new Set();
                while (dists.size < 3) {
                    let distVal = d + rand(-3, 3);
                    if (distVal > 0 && distVal !== d) dists.add(distVal.toString());
                }
                distractors = Array.from(dists);
            }
        } 
        // Expert Equation Balance: Level 5 (Parenthesis Complex Balance)
        else {
            let op1 = randOp();
            let op2 = randOp();
            let a, b, mid_val;
            
            if (op1 === '+') { a = rand(1, 15); b = rand(1, 15); mid_val = a + b; }
            else if (op1 === '-') { a = rand(15, 40); b = rand(1, 10); mid_val = a - b; }
            else if (op1 === '*') { a = rand(2, 8); b = rand(2, 8); mid_val = a * b; }
            else { b = rand(2, 6); mid_val = rand(2, 8); a = b * mid_val; }

            let c, d;
            if (op2 === '+') {
                c = rand(1, 20);
                d = mid_val + c;
            } else if (op2 === '-') {
                c = rand(1, mid_val - 1) || 1;
                d = mid_val - c;
            } else if (op2 === '*') {
                c = rand(2, 5);
                d = mid_val * c;
            } else { // '/'
                const factors = [];
                for (let i = 2; i <= mid_val; i++) {
                    if (mid_val % i === 0) factors.push(i);
                }
                if (factors.length > 0) {
                    c = factors[Math.floor(Math.random() * factors.length)];
                } else {
                    c = 2;
                    mid_val = 6;
                    a = 3; b = 2; op1 = '*';
                }
                d = mid_val / c;
            }

            const mapOp = { '+': '+', '-': '-', '*': '×', '/': '÷' };
            const dispOp1 = mapOp[op1];
            const dispOp2 = mapOp[op2];

            if (Math.random() < 0.5) {
                equationText = `( ${a} ${dispOp1} ${b} )   ?   ${c}  =  ${d}`;
                missingElement = 'operator';
                correctAnswer = dispOp2;
                distractors = Object.keys(mapOp).filter(o => o !== op2).map(o => mapOp[o]);
            } else {
                equationText = `( ${a} ${dispOp1} ${b} )  ${dispOp2}  ?  =  ${d}`;
                missingElement = 'operand';
                correctAnswer = c.toString();
                const dists = new Set();
                while (dists.size < 3) {
                    let distVal = c + rand(-5, 5);
                    if (distVal > 0 && distVal !== c) dists.add(distVal.toString());
                }
                distractors = Array.from(dists);
            }
        }

        const options = [correctAnswer, ...distractors];
        Phaser.Utils.Array.Shuffle(options);

        return {
            equationText,
            missingElement,
            correctAnswer,
            options
        };
    }

    startNewPuzzle() {
        if (this.timeLeft <= 0) return;

        this.gamePhase = 'PLAYING';
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.statusText.setText('BALANCE THE EQUATION!').setFill('#e2e8f0');

        // Clean up previous buttons
        this.optionButtons.forEach(btn => {
            if (btn.bg) btn.bg.destroy();
            if (btn.txt) btn.txt.destroy();
        });
        this.optionButtons = [];

        // Generate new puzzle
        this.activePuzzle = this.generateEquation();
        this.equationTextDisplay.setText(this.activePuzzle.equationText);

        // Render options buttons dynamically
        const width = this.scale.width;
        const opts = this.activePuzzle.options;
        const btnSpacing = 30;
        const btnWidth = opts.length === 4 ? 110 : 130;
        const btnHeight = 65;
        const totalWidth = opts.length * btnWidth + (opts.length - 1) * btnSpacing;
        const startX = (width - totalWidth) / 2 + btnWidth / 2;

        opts.forEach((val, idx) => {
            const x = startX + idx * (btnWidth + btnSpacing);
            const y = 410;

            const bg = this.add.graphics();
            bg.setPosition(x, y);

            // Glassmorphic option style
            bg.fillStyle(0x1e293b, 0.6);
            bg.lineStyle(1.5, 0xffffff, 0.08);
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);

            const txt = this.add.text(x, y, val, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '26px',
                fontWeight: 'bold',
                fill: '#e2e8f0'
            }).setOrigin(0.5);

            // Click triggers
            bg.setInteractive(new Phaser.Geom.Rectangle(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
            bg.on('pointerdown', (pointer, localX, localY, event) => {
                if (this.isTutorialActive) return;
                if (event) event.stopPropagation();
                this.handleOptionClick(val, bg, txt);
            });

            // Hover triggers
            bg.on('pointerover', () => {
                if (this.gamePhase === 'PLAYING') {
                    bg.lineStyle(2.5, 0xf59e0b, 0.7); // golden outline
                    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
                    txt.setFill('#ffffff');
                }
            });

            bg.on('pointerout', () => {
                if (this.gamePhase === 'PLAYING') {
                    bg.lineStyle(1.5, 0xffffff, 0.08);
                    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
                    txt.setFill('#e2e8f0');
                }
            });

            this.optionButtons.push({ bg, txt, val, btnWidth, btnHeight });
        });

        this.roundStartTime = this.time.now;
        this.roundTimeRemaining = this.roundTimeLimit;
    }

    handleOptionClick(selectedVal, bg, txt) {
        if (this.gamePhase !== 'PLAYING') return;
        this.gamePhase = 'FEEDBACK';

        const isCorrect = (selectedVal === this.activePuzzle.correctAnswer);
        const solveTime = this.time.now - this.roundStartTime;
        const btnWidth = bg.geom ? bg.geom.width : 110;
        const btnHeight = bg.geom ? bg.geom.height : 65;

        if (isCorrect) {

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

            // Visual feedback: Green fill
            bg.clear();
            bg.fillStyle(0x064e3b, 0.7);
            bg.lineStyle(2.5, 0x10b981, 0.9);
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            txt.setFill('#4ade80');

            // Replace question mark in equation text with correct answer
            const solvedEq = this.activePuzzle.equationText.replace('?', selectedVal);
            this.equationTextDisplay.setText(solvedEq);

            // Add score
            const timeBonus = Math.max(0, Math.round((this.roundTimeLimit - solveTime) / 100));
            const roundScore = 100 * this.difficultyLevel + timeBonus;
            this.score += roundScore;

            this.showFloatingFeedback(`+${roundScore} CORRECT!`, '#10b981');
            this.statusText.setText('EQUATION BALANCED!').setFill('#10b981');
            this.cameras.main.flash(100, 16, 185, 129, 0.1); // soft green flash

            this.updateHUD();
            this.dispatchRoundTelemetry(solveTime, 1.0);
            this.scheduleNextRound();
        } else {
            this.misses++;
            this.totalAttempts++;

            // Visual feedback: Red fill
            bg.clear();
            bg.fillStyle(0x7f1d1d, 0.7);
            bg.lineStyle(2.5, 0xef4444, 0.9);
            bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10);
            txt.setFill('#f87171');

            // Find the correct button and outline in green to show the user
            this.optionButtons.forEach(btn => {
                if (btn.val === this.activePuzzle.correctAnswer) {
                    btn.bg.clear();
                    btn.bg.fillStyle(0x1e293b, 0.6);
                    btn.bg.lineStyle(3, 0x10b981, 0.9);
                    btn.bg.fillRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 10);
                    btn.bg.strokeRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 10);
                    btn.txt.setFill('#4ade80');
                }
            });

            this.cameras.main.shake(120, 0.007);
            this.showFloatingFeedback('INCORRECT PATH!', '#ef4444');
            this.statusText.setText('DEDUCTION CONFLICT!').setFill('#ef4444');

            this.updateHUD();
            this.dispatchRoundTelemetry(solveTime, 0.0);
            this.scheduleNextRound();
        }
    }

    handleTimeout() {
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.totalAttempts++;

        // Show correct answer by highlighting it green
        this.optionButtons.forEach(btn => {
            if (btn.val === this.activePuzzle.correctAnswer) {
                btn.bg.clear();
                btn.bg.fillStyle(0x1e293b, 0.6);
                btn.bg.lineStyle(3, 0x10b981, 0.9);
                btn.bg.fillRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 10);
                btn.bg.strokeRoundedRect(-btn.btnWidth / 2, -btn.btnHeight / 2, btn.btnWidth, btn.btnHeight, 10);
                btn.txt.setFill('#4ade80');
            }
        });

        this.showFloatingFeedback('TIME LIMIT EXPIRED!', '#ef4444');
        this.statusText.setText('TIME OUT!').setFill('#ef4444');

        this.updateHUD();
        this.dispatchRoundTelemetry(this.roundTimeLimit, 0.0);
        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(1600, () => {
            if (this.timeLeft <= 0) return;

            // Trigger DDA adjustment query every 3 attempts
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

    // ==========================================
    // DDA & TELEMETRY API COMMUNICATORS
    // ==========================================

    async dispatchRoundTelemetry(solveTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "logical_mathematical",
            game_type: "EquationBalance",
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        try {
            console.log('[Telemetry Dispatch] Sending equation balance metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Endpoint unreachable, local caching triggered.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        this.statusText.setText('SYNCING ADAPTATION...').setFill('#64748b');

        try {
            console.log('[DDA Bridge] Fetching Equation Balance difficulty configurations...');
            const response = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const params = data.dda_parameters;
                    const diffChanged = (this.difficultyLevel !== params.difficulty_level);

                    this.difficultyLevel = params.difficulty_level;
                    this.numRange = params.num_range;
                    this.operators = params.operators;
                    this.missingType = params.missing_type;
                    this.roundTimeLimit = params.time_limit;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (diffChanged) {
                        this.showFloatingFeedback(`DIFFICULTY LEVEL ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a855f7');
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed, keeping configurations.', e);
        }

        this.startNewPuzzle();
    }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();

        this.optionButtons.forEach(btn => {
            if (btn.bg) btn.bg.destroy();
            if (btn.txt) btn.txt.destroy();
        });
        this.optionButtons = [];

        console.log('[Equation Balance Game Over] Telemetry results:', {
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
