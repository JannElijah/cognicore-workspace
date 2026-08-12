import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

// ─────────────────────────────────────────────────────────────
//  Task card catalogue  (category, urgency, importance)
//  Correct bin determined by urgency × importance matrix:
//    Urgent   + High importance → URGENT
//    Urgent   + Low importance  → DELEGATE
//    !Urgent  + High importance → IMPORTANT
//    !Urgent  + Low importance  → DELEGATE
// ─────────────────────────────────────────────────────────────
const TASK_CATALOGUE = [
    { label: 'Server Down',       icon: '⚠️',  cat: 'OPS',      urgent: true,  important: true  },
    { label: 'Team Standup',      icon: '💬',  cat: 'MEETING',  urgent: true,  important: true  },
    { label: 'Client Bug Report', icon: '🐛',  cat: 'BUG',      urgent: true,  important: true  },
    { label: 'Security Patch',    icon: '🔐',  cat: 'OPS',      urgent: true,  important: true  },
    { label: 'Deploy Hotfix',     icon: '🚀',  cat: 'DEV',      urgent: true,  important: true  },
    { label: 'Code Review',       icon: '📋',  cat: 'DEV',      urgent: false, important: true  },
    { label: 'Q3 Roadmap',        icon: '🗺️',  cat: 'STRATEGY', urgent: false, important: true  },
    { label: 'Skill Training',    icon: '📚',  cat: 'LEARNING', urgent: false, important: true  },
    { label: 'Architecture Doc',  icon: '📐',  cat: 'DEV',      urgent: false, important: true  },
    { label: 'Team 1:1 Prep',     icon: '🤝',  cat: 'PEOPLE',   urgent: false, important: true  },
    { label: 'Newsletter',        icon: '📧',  cat: 'EMAIL',    urgent: true,  important: false },
    { label: 'Office Supplies',   icon: '📎',  cat: 'ADMIN',    urgent: false, important: false },
    { label: 'Status Update',     icon: '📊',  cat: 'REPORT',   urgent: false, important: false },
    { label: 'Meeting Minutes',   icon: '📝',  cat: 'ADMIN',    urgent: false, important: false },
    { label: 'Social Post',       icon: '📣',  cat: 'MARKETING',urgent: true,  important: false },
    { label: 'Printer Jam',       icon: '🖨️',  cat: 'ADMIN',    urgent: true,  important: false },
    { label: 'Filing Receipts',   icon: '🗄️',  cat: 'ADMIN',    urgent: false, important: false },
    { label: 'Vendor Invoice',    icon: '💵',  cat: 'FINANCE',  urgent: false, important: false },
];

function getCorrectBin(task) {
    if (task.urgent && task.important)   return 'URGENT';
    if (!task.urgent && task.important)  return 'IMPORTANT';
    return 'DELEGATE';
}

// Bin colours and accents
const BIN_CONFIG = {
    URGENT:    { color: 0xef4444, glow: 0xff6b6b, label: '🔴  URGENT',    sublabel: 'Do it NOW',      icon: '🚨' },
    IMPORTANT: { color: 0xf59e0b, glow: 0xfbbf24, label: '🟡  IMPORTANT', sublabel: 'Schedule it',    icon: '⭐' },
    DELEGATE:  { color: 0x22c55e, glow: 0x4ade80, label: '🟢  DELEGATE',  sublabel: 'Assign or drop', icon: '📤' },
};

export default class PriorityQueueScene extends BaseCognitiveScene {
    constructor() { super('PriorityQueueScene'); }

    // ── init ────────────────────────────────────────────────
    init(data) {
        data = data || {};
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl    = data.apiUrl    || API_BASE;
        this.onGameOver = data.onGameOver || null;

        const dda = data.ddaParameters || {};
        this.difficultyLevel  = dda.difficulty_level  || 1;
        this.beltSpeed        = dda.belt_speed        || 140;  // px/sec card travels left
        this.spawnInterval    = dda.spawn_interval    || 1200; // ms between cards
        this.maxCards         = dda.max_cards         || 3;
        this.ambiguityLevel   = dda.ambiguity_level   || 0;   // 0=clear labels, 1=no labels
        this.gameDuration     = dda.time_limit        || 75000;

        // Stats
        this.score       = 0;
        this.hits        = 0;
        this.misses      = 0;
        this.totalDrops  = 0;
        this.accuracy    = 1.0;
        this.timeLeft    = this.gameDuration;
        this.gamePhase   = 'IDLE';

        // Cards on belt
        this.beltCards   = [];
        this.dragCard    = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Micro-behaviour
        this.stimulusSpawnTime           = 0;
        this.firstInteractionRegistered  = false;
        this.firstInteractionLatency     = 0;
        this.spamClickCount              = 0;
        this.lastMissTime                = 0;
        this.roundStartTime              = 0;

        // Catalogue index rotation (avoid repeats)
        this._catIdx = Phaser.Utils.Array.Shuffle([...Array(TASK_CATALOGUE.length).keys()]);
        this._catPtr = 0;
    }

    // ── create ──────────────────────────────────────────────
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background
        this.createStandardBackground();// Subtle grid
        this.add.grid(W / 2, H / 2, W, H, 64, 64, 0, 0, 0x16a34a, 0.025).setOrigin(0.5);

        // ── Belt track ──────────────────────────────────────
        this.beltY = H * 0.38;
        this._drawBelt(W, this.beltY);

        // ── Three bins ──────────────────────────────────────
        this.bins = {};
        const binW = 158, binH = 105;
        const binY = H - 80;
        const binPositions = {
            URGENT:    W * 0.18,
            IMPORTANT: W * 0.50,
            DELEGATE:  W * 0.82,
        };
        Object.entries(binPositions).forEach(([key, x]) => {
            this.bins[key] = this._drawBin(key, x, binY, binW, binH);
        });

        // ── HUD ─────────────────────────────────────────────
        this.scoreText = this.add.text(20, 16, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body, fontSize: '22px',
            fontStyle: 'bold', fill: '#22c55e'
        });
        this.accText = this.add.text(20, 44, 'ACCURACY: 100%', {
            fontFamily: CogniTheme.fonts.body, fontSize: '14px', fill: '#94a3b8'
        });
        this.diffText = this.add.text(W - 18, 16, `DIFFICULTY: LVL ${this.difficultyLevel}`, {
            fontFamily: CogniTheme.fonts.body, fontSize: '22px',
            fontStyle: 'bold', fill: '#4ade80'
        }).setOrigin(1, 0);

        this.timerText = this.add.text(W / 2, 16, '01:15', {
            fontFamily: CogniTheme.fonts.body, fontSize: '30px',
            fontStyle: 'bold', fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.statusText = this.add.text(W / 2, this.beltY - 52, 'DRAG TASKS INTO THE CORRECT BIN', {
            fontFamily: CogniTheme.fonts.body, fontSize: '12px',
            fontStyle: '700', fill: '#4b5563', letterSpacing: '0.08em'
        }).setOrigin(0.5);

        // ── Input ────────────────────────────────────────────
        this.input.topOnly = false;
        this.input.on('pointerdown', this._onPointerDown, this);
        this.input.on('pointermove', this._onPointerMove, this);
        this.input.on('pointerup',   this._onPointerUp,   this);

        // Spam-click tracking on empty areas
        this.input.on('pointerdown', (ptr, gos) => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            if (gos.length === 0) {
                const now = this.getTime();
                if (now - this.lastMissTime < 200) this.spamClickCount++;
                this.lastMissTime = now;
            }
        });

        // ── ML HUD + Tutorial ────────────────────────────────
        createMlHud(this, 0x22c55e);
        createTutorialOverlay(this, {
            title: 'PRIORITY QUEUE',
            domain: 'executive_strategy',
            instructions: '• Tasks flow across the belt from right to left.\n\n• DRAG each task card into the correct bin before it leaves the screen.\n\n• 🔴 URGENT — do immediately (urgent + important).\n\n• 🟡 IMPORTANT — schedule it (not urgent, but important).\n\n• 🟢 DELEGATE — assign or drop (low importance).\n\n• Speed and accuracy both earn points. Don\'t let cards escape!',
            themeColorHex: 0x22c55e,
            onStart: () => this.startGameplay()
        });
    }

    // ── Belt visual ─────────────────────────────────────────
    _drawBelt(W, beltY) {
        const trackH = 148;
        const g = this.add.graphics();

        // Track shadow
        g.fillStyle(0x000000, 0.6);
        g.fillRect(0, beltY - trackH / 2 + 4, W, trackH);

        // Track body
        g.fillStyle(0x0f172a, 0.95);
        g.fillRect(0, beltY - trackH / 2, W, trackH);

        // Belt stripes (animated via tween later)
        g.lineStyle(1, 0x1e293b, 0.8);
        for (let x = 0; x <= W + 60; x += 60) {
            g.lineBetween(x, beltY - trackH / 2, x - 20, beltY + trackH / 2);
        }

        // Top & bottom rails
        g.lineStyle(2.5, 0x22c55e, 0.22);
        g.lineBetween(0, beltY - trackH / 2, W, beltY - trackH / 2);
        g.lineBetween(0, beltY + trackH / 2, W, beltY + trackH / 2);

        // "IN" arrow at right edge
        const arrX = W - 16;
        const arrY = beltY;
        const arrG = this.add.graphics();
        arrG.fillStyle(0x22c55e, 0.4);
        arrG.fillTriangle(arrX, arrY - 12, arrX, arrY + 12, arrX - 22, arrY);

        // "MISSED" warning zone at left
        const warnG = this.add.graphics();
        warnG.fillStyle(0xef4444, 0.06);
        warnG.fillRect(0, beltY - trackH / 2, 55, trackH);
        this.add.text(28, beltY, 'MISS\nZONE', {
            fontFamily: CogniTheme.fonts.body, fontSize: '9px',
            fill: '#ef4444', align: 'center'
        }).setOrigin(0.5);
    }

    // ── Bin visual ──────────────────────────────────────────
    _drawBin(key, cx, cy, bW, bH) {
        const cfg = BIN_CONFIG[key];
        const container = this.add.container(cx, cy);

        const bg = this.add.graphics();
        bg.fillStyle(cfg.color, 0.08);
        bg.lineStyle(2, cfg.color, 0.5);
        bg.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, 10);
        bg.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, 10);
        container.add(bg);

        const label = this.add.text(0, -16, cfg.label, {
            fontFamily: CogniTheme.fonts.body, fontSize: '13px',
            fontStyle: 'bold', fill: `#${cfg.color.toString(16).padStart(6, '0')}`
        }).setOrigin(0.5);
        container.add(label);

        const sub = this.add.text(0, 8, cfg.sublabel, {
            fontFamily: CogniTheme.fonts.body, fontSize: '10px', fill: '#475569'
        }).setOrigin(0.5);
        container.add(sub);

        // Store for hit-testing
        container.binKey = key;
        container.binW   = bW;
        container.binH   = bH;
        container.binBg  = bg;
        container.cfg    = cfg;

        return container;
    }

    // ── Bin glow on hover/drag ──────────────────────────────
    _highlightBin(key, active) {
        const c = this.bins[key];
        if (!c) return;
        const cfg = c.cfg;
        c.binBg.clear();
        if (active) {
            c.binBg.fillStyle(cfg.color, 0.22);
            c.binBg.lineStyle(3, cfg.glow, 0.9);
        } else {
            c.binBg.fillStyle(cfg.color, 0.08);
            c.binBg.lineStyle(2, cfg.color, 0.5);
        }
        c.binBg.fillRoundedRect(-c.binW / 2, -c.binH / 2, c.binW, c.binH, 10);
        c.binBg.strokeRoundedRect(-c.binW / 2, -c.binH / 2, c.binW, c.binH, 10);
    }

    // ── Gameplay start ──────────────────────────────────────
    startGameplay() {
        this.isTutorialActive  = false;
        this.gamePhase         = 'PLAYING';
        this.roundStartTime    = this.getTime();
        this.stimulusSpawnTime = this.getTime();

        // Belt spawn timer
        this._spawnTimer = this.time.addEvent({
            delay:         this.spawnInterval,
            callback:      this._spawnCard,
            callbackScope: this,
            loop:          true
        });

        // Spawn first card immediately
        this._spawnCard();
    }

    // ── update loop ─────────────────────────────────────────
    update() {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;

        const elapsed  = this.getTime() - this.roundStartTime;
        this.timeLeft  = Math.max(0, this.gameDuration - elapsed);

        // Update timer display
        const s = Math.ceil(this.timeLeft / 1000);
        const m = Math.floor(s / 60);
        this.timerText.setText(`${m < 10 ? '0' : ''}${m}:${(s % 60) < 10 ? '0' : ''}${s % 60}`);
        if (this.timeLeft <= 0) { this.endGame(); return; }

        // Move all belt cards left
        const dt = this.game.loop.delta;
        const pxPerMs = this.beltSpeed / 1000;

        for (let i = this.beltCards.length - 1; i >= 0; i--) {
            const card = this.beltCards[i];
            if (card === this.dragCard) continue;  // being dragged, skip movement
            card.container.x -= pxPerMs * dt;

            // Timer indicator on card shrinks
            const elapsed2 = this.getTime() - card.spawnTime;
            const travelTime = (this.scale.width + 120) / pxPerMs;
            const frac = Math.max(0, 1 - elapsed2 / travelTime);
            card.timerBar?.scaleX !== undefined && (card.timerBar.scaleX = frac);

            // Miss zone — card left the screen
            if (card.container.x < -70) {
                this._recordMiss(card);
            }
        }

        // Hover: highlight bin under dragged card
        if (this.dragCard) {
            const px = this.input.activePointer.x;
            const py = this.input.activePointer.y;
            Object.keys(this.bins).forEach(k => {
                const hit = this._pointerOverBin(k, px, py);
                this._highlightBin(k, hit);
            });
        }
    }

    // ── Spawn a new belt card ───────────────────────────────
    _spawnCard() {
        if (this.gamePhase !== 'PLAYING') return;
        if (this.beltCards.length >= this.maxCards) return;

        const W = this.scale.width;
        const H = this.scale.height;
        const spawnX = W + 80;
        const spawnY = this.beltY;

        // Pick next task
        if (this._catPtr >= this._catIdx.length) {
            this._catIdx = Phaser.Utils.Array.Shuffle([...Array(TASK_CATALOGUE.length).keys()]);
            this._catPtr = 0;
        }
        const task = TASK_CATALOGUE[this._catIdx[this._catPtr++]];
        const correctBin = getCorrectBin(task);

        const cardW = 108, cardH = 128;
        const container = this.add.container(spawnX, spawnY);

        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.97);
        bg.lineStyle(2, 0x1e293b, 0.9);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        container.add(bg);

        // Category badge
        const cfg = BIN_CONFIG[correctBin];
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(cfg.color, 0.15);
        badgeBg.fillRoundedRect(-cardW / 2 + 6, -cardH / 2 + 6, cardW - 12, 18, 5);
        container.add(badgeBg);

        const catLabel = this.ambiguityLevel >= 1
            ? '???' : task.cat;
        const catText = this.add.text(0, -cardH / 2 + 15, catLabel, {
            fontFamily: CogniTheme.fonts.body, fontSize: '9px',
            fontStyle: 'bold', fill: `#${cfg.color.toString(16).padStart(6, '0')}`
        }).setOrigin(0.5);
        container.add(catText);

        // Icon
        const iconText = this.add.text(0, -12, task.icon, {
            fontSize: '26px'
        }).setOrigin(0.5);
        container.add(iconText);

        // Task label
        const taskLabel = this.add.text(0, 26, task.label, {
            fontFamily: CogniTheme.fonts.body, fontSize: '10px',
            fontStyle: '600', fill: '#cbd5e1', wordWrap: { width: cardW - 12 },
            align: 'center'
        }).setOrigin(0.5, 0);
        container.add(taskLabel);

        // Urgency / importance dots (hidden at high ambiguity)
        if (this.ambiguityLevel < 2) {
            const dotG = this.add.graphics();
            const urgColor  = task.urgent    ? 0xef4444 : 0x1e293b;
            const impColor  = task.important ? 0xf59e0b : 0x1e293b;
            dotG.fillStyle(urgColor, 0.9);
            dotG.fillCircle(-14, cardH / 2 - 14, 5);
            dotG.fillStyle(impColor, 0.9);
            dotG.fillCircle(14, cardH / 2 - 14, 5);
            container.add(dotG);
        }

        // Timer bar (top edge, shrinks as card travels)
        const tbG = this.add.graphics();
        tbG.fillStyle(cfg.color, 0.55);
        tbG.fillRect(-cardW / 2 + 4, -cardH / 2 + 28, cardW - 8, 3);
        container.add(tbG);

        // Make interactive
        bg.setInteractive(
            new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
            Phaser.Geom.Rectangle.Contains
        );

        // Hover glow
        bg.on('pointerover', () => {
            if (this.dragCard) return;
            bg.clear();
            bg.fillStyle(0x1e293b, 0.97);
            bg.lineStyle(2.5, cfg.color, 0.7);
            bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            this.game.canvas.style.cursor = 'grab';
        });
        bg.on('pointerout', () => {
            if (this.dragCard === cardObj) return;
            bg.clear();
            bg.fillStyle(0x0f172a, 0.97);
            bg.lineStyle(2, 0x1e293b, 0.9);
            bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
            this.game.canvas.style.cursor = 'default';
        });

        const cardObj = {
            container,
            task,
            correctBin,
            bg,
            timerBar: tbG,
            spawnTime: this.getTime(),
            cardW,
            cardH,
            cfg
        };
        this.beltCards.push(cardObj);
        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
    }

    // ── Pointer handlers ────────────────────────────────────
    _onPointerDown(ptr) {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;
        this.registerFirstInteraction();

        // Find which card was clicked
        for (const card of this.beltCards) {
            const lx = ptr.x - card.container.x;
            const ly = ptr.y - card.container.y;
            if (Math.abs(lx) < card.cardW / 2 && Math.abs(ly) < card.cardH / 2) {
                this.dragCard    = card;
                this.dragOffsetX = lx;
                this.dragOffsetY = ly;
                card.container.setDepth(10);
                this.game.canvas.style.cursor = 'grabbing';
                // Lift animation
                this.tweens.add({
                    targets: card.container,
                    scaleX: 1.06, scaleY: 1.06,
                    duration: 80
                });
                break;
            }
        }
    }

    _onPointerMove(ptr) {
        if (!this.dragCard) return;
        this.registerFirstInteraction();
        this.dragCard.container.x = ptr.x - this.dragOffsetX;
        this.dragCard.container.y = ptr.y - this.dragOffsetY;
    }

    _onPointerUp(ptr) {
        if (!this.dragCard) return;
        const card = this.dragCard;
        this.dragCard = null;
        this.game.canvas.style.cursor = 'default';

        // Reset card scale
        this.tweens.add({ targets: card.container, scaleX: 1, scaleY: 1, duration: 80 });

        // Check which bin the card was dropped on
        let droppedBin = null;
        for (const [key] of Object.entries(this.bins)) {
            if (this._pointerOverBin(key, ptr.x, ptr.y)) {
                droppedBin = key;
                break;
            }
            this._highlightBin(key, false);
        }

        Object.keys(this.bins).forEach(k => this._highlightBin(k, false));

        if (!droppedBin) {
            // No bin hit — return card to belt Y
            this.tweens.add({
                targets: card.container,
                y: this.beltY,
                duration: 220,
                ease: 'Back.easeOut'
            });
            return;
        }

        // Evaluate
        this._evaluateDrop(card, droppedBin);
    }

    _pointerOverBin(key, px, py) {
        const bin = this.bins[key];
        const bW2 = bin.binW / 2 + 18;
        const bH2 = bin.binH / 2 + 18;
        return (
            px >= bin.x - bW2 && px <= bin.x + bW2 &&
            py >= bin.y - bH2 && py <= bin.y + bH2
        );
    }

    // ── Drop evaluation ─────────────────────────────────────
    _evaluateDrop(card, droppedBin) {
        const reactionTime = this.getTime() - card.spawnTime;
        const isCorrect    = droppedBin === card.correctBin;
        this.totalDrops++;

        // Remove from belt
        this._removeCard(card);

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
            const speedBonus = Math.max(0, Math.round((8000 - reactionTime) / 25));
            const points = 120 + speedBonus;
            this.score += points;
            this._floatText(`+${points}`, card.container.x, card.container.y - 60, '#22c55e');
            this.cameras.main.flash(100, 34, 197, 94, 0.08);

            // Bin success pulse
            this._pulseBin(droppedBin, true);
        } else {
            this.misses++;
            this.score = Math.max(0, this.score - 50);
            this._floatText('-50 WRONG BIN', card.container.x, card.container.y - 60, '#ef4444');
            this.cameras.main.shake(120, 0.006);
            this._pulseBin(droppedBin, false);
            this._showCorrectBin(card.correctBin);
        }

        this._updateHUD();
        this.dispatchTelemetry(reactionTime, isCorrect ? 1.0 : 0.0);

        // DDA adaptation every 8 correct drops
        if (this.hits > 0 && this.hits % 8 === 0) this.adaptDifficulty();
    }

    _recordMiss(card) {
        this._removeCard(card);
        this.misses++;
        this.totalDrops++;
        this.score = Math.max(0, this.score - 30);
        this._floatText('MISSED! -30', this.scale.width / 2, this.beltY - 60, '#f59e0b');
        this.cameras.main.shake(90, 0.004);
        this._updateHUD();
        this.dispatchTelemetry(this.gameDuration, 0.0);
    }

    _removeCard(card) {
        const idx = this.beltCards.indexOf(card);
        if (idx !== -1) this.beltCards.splice(idx, 1);
        card.container.destroy();
    }

    // ── Visual helpers ──────────────────────────────────────
    _pulseBin(key, success) {
        const bin = this.bins[key];
        const col = success ? 0x22c55e : 0xef4444;
        this.tweens.add({
            targets: bin,
            scaleX: 1.08, scaleY: 1.08,
            duration: 90,
            yoyo: true,
            onComplete: () => {
                bin.setScale(1);
                this._highlightBin(key, false);
            }
        });
    }

    _showCorrectBin(key) {
        const bin = this.bins[key];
        this._highlightBin(key, true);
        this.time.delayedCall(900, () => this._highlightBin(key, false));
    }

    _floatText(text, x, y, color) {
        const t = this.add.text(x, y, text, {
            fontFamily: CogniTheme.fonts.body, fontSize: '16px',
            fontStyle: 'bold', fill: color
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: t, y: y - 55, alpha: 0, duration: 1100,
            onComplete: () => { if (t?.active) t.destroy(); }
        });
    }

    _updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.accuracy = this.totalDrops > 0 ? this.hits / this.totalDrops : 1.0;
        this.accText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    // ── Micro-behaviour ─────────────────────────────────────
    // ── Telemetry ────────────────────────────────────────────
    async dispatchTelemetry(reactionTimeMs, roundAccuracy) {
        if (!this.sessionId) return;
        const payload = {
            session_id:       this.sessionId,
            cognitive_domain: 'executive_strategy',
            game_type:        'PriorityQueue',
            reaction_time:    reactionTimeMs,
            accuracy_rate:    roundAccuracy,
            difficulty:       this.difficultyLevel,
            error_count:      roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms:    this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };
        try {
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payload)
            });
        } catch (e) { console.warn('[Telemetry] PriorityQueue offline.', e); }
    }

    // ── DDA ──────────────────────────────────────────────────
    async adaptDifficulty() {
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
                    this.difficultyLevel = p.difficulty_level;
                    this.beltSpeed       = p.belt_speed;
                    this.spawnInterval   = p.spawn_interval;
                    this.maxCards        = p.max_cards;
                    this.ambiguityLevel  = p.ambiguity_level;

                    // Restart spawn timer with new interval
                    if (this._spawnTimer) this._spawnTimer.remove();
                    this._spawnTimer = this.time.addEvent({
                        delay: this.spawnInterval,
                        callback: this._spawnCard,
                        callbackScope: this,
                        loop: true
                    });

                    this.diffText.setText(`DIFFICULTY: LVL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);
                }
            }
        } catch (e) { console.warn('[DDA] PriorityQueue adapt failed.', e); }
    }

    // ── Game over ────────────────────────────────────────────
    endGame() {
        if (this.gamePhase === 'FINISHED') return;
        this.gamePhase = 'FINISHED';

        if (this._spawnTimer) this._spawnTimer.remove();

        // Destroy remaining cards
        [...this.beltCards].forEach(c => c.container.destroy());
        this.beltCards = [];

        if (this.onGameOver) {
            this.onGameOver({
                score:           this.score,
                hits:            this.hits,
                misses:          this.misses,
                accuracy:        this.accuracy,
                difficultyLevel: this.difficultyLevel,
                hesitation_ms:   this.firstInteractionLatency || 0,
                spam_click_count: this.spamClickCount
            });
        }
    }
}
