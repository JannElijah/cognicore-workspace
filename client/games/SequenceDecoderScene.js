import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

export default class SequenceDecoderScene extends BaseCognitiveScene {
    constructor() {
        super('SequenceDecoderScene');
    }

    init(data) {
        data = data || {};
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId   = data.sessionId  || null;
        this.apiUrl      = data.apiUrl     || API_BASE;
        this.onGameOver  = data.onGameOver || null;

        // DDA variables
        const dda = data.ddaParameters || {};
        this.difficultyLevel  = dda.difficulty_level  || 1;
        this.sequenceLength   = dda.sequence_length   || 4;   // how many tiles shown (incl. ?)
        this.patternTypes     = dda.pattern_types     || ['arithmetic'];
        this.missingPosition  = dda.missing_position  || 'last'; // 'last' | 'second_last'
        this.roundTimeLimit   = dda.time_limit        || 12000;

        // Session tracking
        this.score          = 0;
        this.hits           = 0;
        this.misses         = 0;
        this.totalAttempts  = 0;
        this.accuracy       = 1.0;
        this.gameDuration   = 60000; // 60 seconds
        this.timeLeft       = this.gameDuration;

        this.gamePhase    = 'PLAYING'; // PLAYING | FEEDBACK | GAMEOVER
        this.roundStartTime    = 0;
        this.roundTimeRemaining = this.roundTimeLimit;

        // Active puzzle
        this.activePuzzle     = null;
        this.optionButtons    = [];
        this.sequenceTiles    = [];
        this.pulseTween       = null;

        // Micro-behaviour
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency    = 0;
        this.spamClickCount = 0;
        this.lastMissTime   = 0;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Background: deep teal-navy gradient
        this.createStandardBackground();// Subtle dot-grid overlay
        const dots = this.add.graphics();
        for (let x = 20; x < W; x += 40) {
            for (let y = 20; y < H; y += 40) {
                dots.fillStyle(0x06b6d4, 0.04);
                dots.fillCircle(x, y, 1.5);
            }
        }

        // ── HUD
        this.scoreText = this.add.text(20, 18, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '22px', fontWeight: 'bold', fill: '#06b6d4'
        });

        this.accuracyText = this.add.text(20, 46, 'ACCURACY: 100%', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '15px', fill: '#94a3b8'
        });

        this.difficultyText = this.add.text(W - 20, 18,
            `DIFFICULTY: LEVEL ${this.difficultyLevel}`, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '22px', fontWeight: 'bold', fill: '#a78bfa'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(W / 2, 18, '01:00', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '30px', fontWeight: 'bold', fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(W / 2, 82, 'FIND THE PATTERN!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '18px', fontWeight: '800', fill: '#e2e8f0',
            letterSpacing: '0.08em'
        }).setOrigin(0.5, 0);

        // ── Round timer bar
        this.roundTimerBg = this.add.graphics();
        this.roundTimerBg.fillStyle(0x1e293b, 0.7);
        this.roundTimerBg.fillRoundedRect(W / 2 - 220, 112, 440, 8, 4);

        this.roundTimerBar = this.add.graphics();

        // ── Pattern hint label (shows rule type at level 1 briefly)
        this.patternHintText = this.add.text(W / 2, 135, '', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '13px', fill: '#475569'
        }).setOrigin(0.5, 0);

        // ── Sequence tile container area (tiles rendered dynamically)
        // Tiles will be placed at y ≈ 270 center
        this.tileContainer = this.add.container(0, 0);

        // ── Answer options container
        this.optionContainer = this.add.container(0, 0);

        // ── Instruction text below sequence
        this.instructionText = this.add.text(W / 2, 382, 'Select the value that correctly continues the pattern:', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '14px', fill: '#64748b'
        }).setOrigin(0.5, 0);

        createMlHud(this, 0xf59e0b);
        createTutorialOverlay(this, {
            title: "SEQUENCE DECODER",
            domain: "logical_mathematical",
            instructions: "• Unravel numerical logic patterns in the sequence.\n\n• Click or enter the next number in the pattern progression.\n\n• Speed bonuses scale with rapid logical inference times.",
            themeColorHex: 0xf59e0b,
            onStart: () => this.startGameplay()
        });

        // Micro-behaviour listeners
        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            if (gameObjects.length === 0) {
                const now = this.getTime();
                if (now - this.lastMissTime < 200) this.spamClickCount++;
                this.lastMissTime = now;
            }
        });
        this.input.on('pointermove', () => this.registerFirstInteraction());
    }

    update() {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;

        const elapsed = this.getTime() - this.roundStartTime;
        this.roundTimeRemaining = Math.max(0, this.roundTimeLimit - elapsed);

        // Redraw round timer bar
        const W = this.scale.width;
        this.roundTimerBar.clear();
        const ratio = this.roundTimeRemaining / this.roundTimeLimit;
        let barColor = 0x06b6d4;
        if (ratio < 0.3) barColor = 0xef4444;
        else if (ratio < 0.6) barColor = 0xf59e0b;

        this.roundTimerBar.fillStyle(barColor, 0.95);
        const fillW = ratio * 440;
        if (fillW > 0) {
            this.roundTimerBar.fillRoundedRect(W / 2 - 220, 112, fillW, 8, 4);
        }

        if (this.roundTimeRemaining <= 0) this.handleTimeout();
    }

    startGameplay() {
        this.sessionStartTime = this.getTime();
        this.isGameOver = false;
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateOverallTimer,
            callbackScope: this,
            loop: true
        });
        this.startNewPuzzle();
    }

    // ══════════════════════════════════════════
    //  OVERALL TIMER
    // ══════════════════════════════════════════
    updateOverallTimer() {
        this.timeLeft -= 1000;
        const totalSec = Math.ceil(this.timeLeft / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        this.timerText.setText(
            `0${mins}:${secs < 10 ? '0' : ''}${secs}`
        );
        if (this.timeLeft <= 0) this.endGame();
    }

    // ══════════════════════════════════════════
    //  PATTERN GENERATORS
    // ══════════════════════════════════════════

    /**
     * Generates a sequence puzzle based on current difficulty.
     * Returns: { sequence[], missingIndex, correctAnswer, options[], ruleLabel }
     */
    generateSequence() {
        const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const pick   = arr => arr[Math.floor(Math.random() * arr.length)];

        const availableTypes = this.patternTypes;
        const type = pick(availableTypes);
        const len  = this.sequenceLength; // total tiles including ?

        let full = [];       // complete sequence (len+1 so we have the answer too)
        let ruleLabel = '';

        // ────────────────────────────────
        // 1. ARITHMETIC  (+d) — always increasing to guarantee positive answers
        // ────────────────────────────────
        if (type === 'arithmetic') {
            const a = rand(1, 20);
            const d = pick([2, 3, 4, 5, 6, 7, 8, 10]);
            for (let i = 0; i <= len; i++) full.push(a + d * i);
            ruleLabel = `Arithmetic +${d}`;
        }

        // ────────────────────────────────
        // 2. GEOMETRIC  (×r)
        // ────────────────────────────────
        else if (type === 'geometric') {
            const a = rand(1, 4);
            const r = pick([2, 3]);
            for (let i = 0; i <= len; i++) full.push(a * Math.pow(r, i));
            ruleLabel = `Geometric ×${r}`;
        }

        // ────────────────────────────────
        // 3. ALTERNATING DELTA  (+a, +b, +a, +b …)
        // ────────────────────────────────
        else if (type === 'alternating') {
            const start = rand(2, 15);
            const d1 = pick([2, 3, 5, 7]);
            const d2 = pick([1, 4, 6, 8]);
            full.push(start);
            for (let i = 0; i <= len; i++) {
                const last = full[full.length - 1];
                full.push(last + (i % 2 === 0 ? d1 : d2));
            }
            full = full.slice(0, len + 1);
            ruleLabel = `Alternating +${d1}/+${d2}`;
        }

        // ────────────────────────────────
        // 4. FIBONACCI-LIKE  (each = prev two)
        // ────────────────────────────────
        else if (type === 'fibonacci') {
            const a = rand(1, 5);
            const b = rand(1, 5);
            full = [a, b];
            for (let i = 2; i <= len; i++) {
                full.push(full[i - 1] + full[i - 2]);
            }
            ruleLabel = `Each = sum of previous two`;
        }

        // ────────────────────────────────
        // 5. DUAL-RULE  (two interleaved sequences)
        //    odd indices follow rule A, even follow rule B
        // ────────────────────────────────
        else if (type === 'dual_rule') {
            const aStart = rand(2, 10);
            const dA     = pick([2, 4, 6]);
            const bStart = rand(1, 5);
            const rB     = 2; // second sequence doubles
            const seqA   = [aStart];
            const seqB   = [bStart];
            for (let i = 1; i <= Math.ceil(len / 2) + 1; i++) {
                seqA.push(seqA[seqA.length - 1] + dA);
                seqB.push(seqB[seqB.length - 1] * rB);
            }
            // Interleave: A, B, A, B …
            for (let i = 0; i <= len; i++) {
                full.push(i % 2 === 0 ? seqA[Math.floor(i / 2)] : seqB[Math.floor(i / 2)]);
            }
            full = full.slice(0, len + 1);
            ruleLabel = `Dual interleaved: +${dA} / ×${rB}`;
        }

        // Determine missing position
        let missingIndex;
        if (this.missingPosition === 'second_last') {
            missingIndex = len - 2;
        } else {
            missingIndex = len - 1; // last shown (index len-1 of the display, which is index len-1 in full)
        }

        const correctAnswer = full[missingIndex];
        const displaySeq    = full.slice(0, len); // shown sequence (len items, one is ?)

        // Build 3 plausible distractors
        const distractors = this._buildDistractors(correctAnswer, type, full, missingIndex);

        const options = Phaser.Utils.Array.Shuffle([correctAnswer, ...distractors]);

        return {
            displaySeq,
            missingIndex,
            correctAnswer,
            options,
            ruleLabel,
            patternType: type
        };
    }

    _buildDistractors(correct, type, full, missingIdx) {
        const dists = new Set();
        const nudges = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];
        let attempts = 0;
        while (dists.size < 3 && attempts < 80) {
            attempts++;
            let candidate;
            const nudge = nudges[Math.floor(Math.random() * nudges.length)];
            const sign  = Math.random() < 0.5 ? 1 : -1;
            candidate   = correct + sign * nudge;

            // Avoid: exact match, negatives, duplicates in sequence
            if (
                candidate !== correct &&
                candidate > 0 &&
                !full.includes(candidate) &&
                !dists.has(candidate) &&
                candidate !== 0
            ) {
                dists.add(candidate);
            }
        }
        // Fallback if set is still short
        let offset = 1;
        while (dists.size < 3) {
            const cand = correct + offset * 7;
            if (!dists.has(cand) && cand !== correct) dists.add(cand);
            offset++;
        }
        return Array.from(dists);
    }

    // ══════════════════════════════════════════
    //  PUZZLE RENDERING
    // ══════════════════════════════════════════

    startNewPuzzle() {
        if (this.timeLeft <= 0) return;

        this.gamePhase = 'PLAYING';
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency    = 0;
        this.statusText.setText('FIND THE PATTERN!').setFill('#e2e8f0');
        this.patternHintText.setText('');

        // Destroy previous tiles and buttons
        this._clearTiles();
        this._clearOptions();

        // Generate new puzzle
        this.activePuzzle = this.generateSequence();
        this._renderSequenceTiles();
        this._renderOptionButtons();

        this.roundStartTime     = this.getTime();
        this.roundTimeRemaining = this.roundTimeLimit;
    }

    _clearTiles() {
        if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }
        this.tileContainer.removeAll(true);
        this.sequenceTiles = [];
    }

    _clearOptions() {
        this.optionContainer.removeAll(true);
        this.optionButtons = [];
    }

    _renderSequenceTiles() {
        const W = this.scale.width;
        const { displaySeq, missingIndex } = this.activePuzzle;
        const n = displaySeq.length;

        const TILE_W   = Math.min(90, Math.floor((W - 80) / n) - 10);
        const TILE_H   = 80;
        const GAP      = 12;
        const ARROW_W  = 20;
        const totalW   = n * TILE_W + (n - 1) * (GAP + ARROW_W);
        const startX   = (W - totalW) / 2;
        const centerY  = 260;

        displaySeq.forEach((val, idx) => {
            const tileX = startX + idx * (TILE_W + GAP + ARROW_W);
            const isMissing = idx === missingIndex;

            // Tile background
            const bg = this.add.graphics();
            bg.setPosition(tileX, centerY - TILE_H / 2);

            if (isMissing) {
                // Glowing ? tile
                bg.fillStyle(0x083344, 0.9);
                bg.lineStyle(2, 0x06b6d4, 0.9);
                bg.fillRoundedRect(0, 0, TILE_W, TILE_H, 10);
                bg.strokeRoundedRect(0, 0, TILE_W, TILE_H, 10);
            } else {
                bg.fillStyle(0x0f172a, 0.8);
                bg.lineStyle(1.5, 0x1e3a5f, 0.6);
                bg.fillRoundedRect(0, 0, TILE_W, TILE_H, 10);
                bg.strokeRoundedRect(0, 0, TILE_W, TILE_H, 10);
            }
            this.tileContainer.add(bg);

            // Tile value text
            const label = isMissing ? '?' : val.toString();
            const txt = this.add.text(tileX + TILE_W / 2, centerY, label, {
                fontFamily: CogniTheme.fonts.body,
                fontSize: isMissing ? '36px' : (label.length > 4 ? '18px' : '28px'),
                fontWeight: 'bold',
                fill: isMissing ? '#06b6d4' : '#e2e8f0'
            }).setOrigin(0.5);
            this.tileContainer.add(txt);

            // Arrow between tiles
            if (idx < n - 1) {
                const arrowX = tileX + TILE_W + GAP / 2;
                const arrow = this.add.text(arrowX, centerY, '→', {
                    fontFamily: CogniTheme.fonts.body,
                    fontSize: '18px',
                    fill: '#334155'
                }).setOrigin(0.5);
                this.tileContainer.add(arrow);
            }

            if (isMissing) {
                // Pulsing glow on the ? tile
                this.pulseTween = this.tweens.add({
                    targets: txt,
                    alpha: { from: 1, to: 0.4 },
                    yoyo: true,
                    repeat: -1,
                    duration: 700,
                    ease: 'Sine.easeInOut'
                });
            }

            // Animate tiles in from above
            const origY = bg.y;
            bg.setAlpha(0);
            bg.y = origY - 20;
            this.tweens.add({
                targets: bg,
                y: origY,
                alpha: 1,
                duration: 300,
                delay: idx * 70,
                ease: 'Back.easeOut'
            });

            this.sequenceTiles.push({ bg, txt, isMissing });
        });
    }

    _renderOptionButtons() {
        const W = this.scale.width;
        const { options } = this.activePuzzle;
        const n = options.length; // always 4

        const BTN_W   = 140;
        const BTN_H   = 58;
        const GAP     = 18;
        const totalW  = n * BTN_W + (n - 1) * GAP;
        const startX  = (W - totalW) / 2;
        const ROW_Y   = 440;

        options.forEach((val, idx) => {
            const x = startX + idx * (BTN_W + GAP);

            const bg = this.add.graphics();
            bg.setPosition(x, ROW_Y);
            bg.fillStyle(0x0f172a, 0.7);
            bg.lineStyle(1.5, 0x1e3a5f, 0.5);
            bg.fillRoundedRect(0, 0, BTN_W, BTN_H, 10);
            bg.strokeRoundedRect(0, 0, BTN_W, BTN_H, 10);
            this.optionContainer.add(bg);

            const txt = this.add.text(x + BTN_W / 2, ROW_Y + BTN_H / 2, val.toString(), {
                fontFamily: CogniTheme.fonts.body,
                fontSize: val.toString().length > 5 ? '16px' : '24px',
                fontWeight: 'bold',
                fill: '#cbd5e1'
            }).setOrigin(0.5);
            this.optionContainer.add(txt);

            // Animate in from below
            const origY = bg.y;
            bg.y = origY + 30;
            bg.setAlpha(0);
            this.tweens.add({
                targets: bg,
                y: origY,
                alpha: 1,
                duration: 280,
                delay: 300 + idx * 60,
                ease: 'Back.easeOut'
            });

            // Interactivity
            bg.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, BTN_W, BTN_H),
                Phaser.Geom.Rectangle.Contains
            );

            bg.on('pointerover', () => {
                if (this.gamePhase !== 'PLAYING') return;
                bg.clear();
                bg.fillStyle(0x164e63, 0.8);
                bg.lineStyle(2, 0x06b6d4, 0.8);
                bg.fillRoundedRect(0, 0, BTN_W, BTN_H, 10);
                bg.strokeRoundedRect(0, 0, BTN_W, BTN_H, 10);
                txt.setFill('#ffffff');
                this.tweens.add({ targets: txt, scaleX: 1.08, scaleY: 1.08, duration: 100 });
            });

            bg.on('pointerout', () => {
                if (this.gamePhase !== 'PLAYING') return;
                bg.clear();
                bg.fillStyle(0x0f172a, 0.7);
                bg.lineStyle(1.5, 0x1e3a5f, 0.5);
                bg.fillRoundedRect(0, 0, BTN_W, BTN_H, 10);
                bg.strokeRoundedRect(0, 0, BTN_W, BTN_H, 10);
                txt.setFill('#cbd5e1');
                this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 100 });
            });

            bg.on('pointerdown', (pointer, lx, ly, event) => {
                if (this.isTutorialActive) return;
                if (event) event.stopPropagation();
                this.handleOptionClick(val, bg, txt, BTN_W, BTN_H);
            });

            this.optionButtons.push({ bg, txt, val, BTN_W, BTN_H });
        });
    }

    // ══════════════════════════════════════════
    //  ANSWER HANDLING
    // ══════════════════════════════════════════

    handleOptionClick(selectedVal, bg, txt, BTN_W, BTN_H) {
        if (this.gamePhase !== 'PLAYING') return;
        this.gamePhase = 'FEEDBACK';

        const isCorrect = (selectedVal === this.activePuzzle.correctAnswer);
        const solveTime = this.getTime() - this.roundStartTime;

        // Stop ? pulse
        if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }

        if (isCorrect) {
            this.hits++;
            this.totalAttempts++;

            // Green button
            bg.clear();
            bg.fillStyle(0x064e3b, 0.8);
            bg.lineStyle(2.5, 0x10b981, 0.95);
            bg.fillRoundedRect(0, 0, BTN_W, BTN_H, 10);
            bg.strokeRoundedRect(0, 0, BTN_W, BTN_H, 10);
            txt.setFill('#4ade80');

            // Reveal correct tile
            this._revealMissingTile(selectedVal, true);

            const timeBonus = Math.max(0, Math.round((this.roundTimeLimit - solveTime) / 80));
            const roundScore = 120 * this.difficultyLevel + timeBonus;
            this.score += roundScore;

            this.showFloatingFeedback(`+${roundScore} PATTERN SOLVED!`, '#10b981');
            this.statusText.setText('PATTERN IDENTIFIED!').setFill('#10b981');
            this.cameras.main.flash(100, 6, 182, 212, 0.12);
            this.showParticleBurst(this.input.activePointer.x, this.input.activePointer.y, 0xf59e0b);

            this.updateHUD();
            this.dispatchRoundTelemetry(solveTime, 1.0);
            this.scheduleNextRound();

        } else {
            this.misses++;
            this.totalAttempts++;

            // Red button
            bg.clear();
            bg.fillStyle(0x7f1d1d, 0.8);
            bg.lineStyle(2.5, 0xef4444, 0.95);
            bg.fillRoundedRect(0, 0, BTN_W, BTN_H, 10);
            bg.strokeRoundedRect(0, 0, BTN_W, BTN_H, 10);
            txt.setFill('#f87171');

            // Highlight correct answer
            this.optionButtons.forEach(btn => {
                if (btn.val === this.activePuzzle.correctAnswer) {
                    btn.bg.clear();
                    btn.bg.fillStyle(0x0f172a, 0.7);
                    btn.bg.lineStyle(3, 0x10b981, 0.95);
                    btn.bg.fillRoundedRect(0, 0, btn.BTN_W, btn.BTN_H, 10);
                    btn.bg.strokeRoundedRect(0, 0, btn.BTN_W, btn.BTN_H, 10);
                    btn.txt.setFill('#4ade80');
                }
            });

            // Reveal correct value in sequence
            this._revealMissingTile(this.activePuzzle.correctAnswer, false);

            this.cameras.main.shake(130, 0.007);
            this.showFloatingFeedback('WRONG PATTERN!', '#ef4444');
            this.statusText.setText('PATTERN MISMATCH!').setFill('#ef4444');

            this.updateHUD();
            this.dispatchRoundTelemetry(solveTime, 0.0);
            this.scheduleNextRound();
        }
    }

    _revealMissingTile(value, correct) {
        const tile = this.sequenceTiles.find(t => t.isMissing);
        if (!tile) return;

        tile.txt.setText(value.toString());
        tile.txt.setFill(correct ? '#4ade80' : '#f87171');

        this.tweens.add({
            targets: tile.txt,
            scaleX: 1.2, scaleY: 1.2,
            yoyo: true,
            duration: 200,
            ease: 'Sine.easeOut'
        });
    }

    handleTimeout() {
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.totalAttempts++;

        if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }

        // Reveal correct answer in options
        this.optionButtons.forEach(btn => {
            if (btn.val === this.activePuzzle.correctAnswer) {
                btn.bg.clear();
                btn.bg.fillStyle(0x0f172a, 0.7);
                btn.bg.lineStyle(3, 0x10b981, 0.95);
                btn.bg.fillRoundedRect(0, 0, btn.BTN_W, btn.BTN_H, 10);
                btn.bg.strokeRoundedRect(0, 0, btn.BTN_W, btn.BTN_H, 10);
                btn.txt.setFill('#4ade80');
            }
        });

        this._revealMissingTile(this.activePuzzle.correctAnswer, false);

        this.showFloatingFeedback('TIME EXPIRED!', '#ef4444');
        this.statusText.setText('TOO SLOW!').setFill('#ef4444');

        this.updateHUD();
        this.dispatchRoundTelemetry(this.roundTimeLimit, 0.0);
        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(1800, () => {
            if (this.timeLeft <= 0) return;
            if (this.totalAttempts % 3 === 0) {
                this.adaptDifficulty();
            } else {
                this.startNewPuzzle();
            }
        });
    }

    // ══════════════════════════════════════════
    //  HUD & FEEDBACK
    // ══════════════════════════════════════════

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.accuracy = this.totalAttempts > 0
            ? this.hits / this.totalAttempts : 1.0;
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    // ══════════════════════════════════════════
    //  DDA & TELEMETRY
    // ══════════════════════════════════════════

    async dispatchRoundTelemetry(solveTimeMs, roundAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: 'logical_mathematical',
            game_type: 'SequenceDecoder',
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        try {
            console.log('[Telemetry] SequenceDecoder metrics...', payload);
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry] Endpoint unreachable.', e);
        }
    }

    async adaptDifficulty() {
        this.startNewPuzzle(); // Fire-and-forget: start next round immediately
        if (!this.sessionId) return;
try {
            const resp = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const p = data.dda_parameters;
                    const changed = this.difficultyLevel !== p.difficulty_level;

                    this.difficultyLevel  = p.difficulty_level;
                    this.sequenceLength   = p.sequence_length;
                    this.patternTypes     = p.pattern_types;
                    this.missingPosition  = p.missing_position;
                    this.roundTimeLimit   = p.time_limit;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (changed) {
                        this.showFloatingFeedback(
                            `DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a78bfa'
                        );
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA] Connection failed, keeping current config.', e);
        }

        }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        if (this.pulseTween)    { this.pulseTween.stop(); this.pulseTween = null; }

        this._clearTiles();
        this._clearOptions();

        console.log('[SequenceDecoder] Game Over:', {
            score: this.score, hits: this.hits,
            misses: this.misses, accuracy: this.accuracy
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
