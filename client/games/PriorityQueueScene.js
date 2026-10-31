import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createMlHud, updateMlHud } from './seriousGameOverlay';

// ─────────────────────────────────────────────────────────────
//  Everyday Eisenhower Priority Matrix Catalogue
//  Rule:
//    🚨 URGENT    → Immediate Danger / Crisis (< 1h) + Critical Impact
//    ⭐ IMPORTANT → High-Value Life Goals / Planning + Scheduled Deadline
//    📤 DELEGATE  → Low Impact, Routine Chores, Distractions & Traps
// ─────────────────────────────────────────────────────────────
const TASK_CATALOGUE = [
    // ── URGENT (Critical Emergencies: DO IT NOW!) ──
    { label: 'Kitchen Stove Fire',         icon: '🔥', domain: 'SAFETY',    deadline: 'DUE: NOW!',    impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: true },
    { label: 'Hospital Emergency Call',    icon: '🏥', domain: 'HEALTH',    deadline: 'DUE: NOW!',    impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: true },
    { label: 'Car Tire Blowout on Road',   icon: '🚗', domain: 'SAFETY',    deadline: 'DUE: NOW!',    impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: true },
    { label: 'Stolen Credit Card Alert',   icon: '💳', domain: 'FINANCE',   deadline: '< 5 MINS',     impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: false },
    { label: 'Water Pipe Burst in House',  icon: '💧', domain: 'HOME',      deadline: '< 10 MINS',    impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: false },
    { label: 'Final Exam in 15 Minutes',   icon: '⏰', domain: 'SCHOOL',    deadline: '< 15 MINS',    impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: false },
    { label: 'Laptop Shuts Down at 1%',    icon: '💻', domain: 'WORK',      deadline: '< 1 MIN',      impact: 'CRITICAL',   urgent: true,  important: true,  isCrisis: false },

    // ── IMPORTANT (High Value & Long-Term Goals: PLAN & SCHEDULE) ──
    { label: 'Study for Final Exams',      icon: '📚', domain: 'ACADEMICS', deadline: 'NEXT WEEK',    impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Exercise & Gym Workout',     icon: '🏋️', domain: 'HEALTH',    deadline: 'THIS WEEK',    impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Prepare Capstone Defense',   icon: '🎓', domain: 'CAREER',    deadline: 'IN 2 WEEKS',   impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Annual Medical Checkup',     icon: '🩺', domain: 'HEALTH',    deadline: 'NEXT MONTH',   impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Monthly Financial Budget',   icon: '💰', domain: 'FINANCE',   deadline: 'THIS MONTH',   impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Update Job Resume',          icon: '📄', domain: 'CAREER',    deadline: 'NEXT SPRINT',  impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },
    { label: 'Family Vacation Planning',   icon: '✈️', domain: 'FAMILY',    deadline: 'NEXT MONTH',   impact: 'HIGH VALUE', urgent: false, important: true,  isCrisis: false },

    // ── DELEGATE / TRAPS (Low Value, Distractions, Routine: DISMISS / DELEGATE) ──
    { label: 'Flash Sale: 50% Off Shoes',  icon: '👟', domain: 'SHOPPING',  deadline: 'ENDS TODAY!',  impact: 'LOW IMPACT', urgent: false, important: false, isCrisis: false },
    { label: 'Hot Office Gossip Chat',     icon: '💬', domain: 'CHAT',      deadline: 'JUST NOW!',    impact: 'LOW IMPACT', urgent: false, important: false, isCrisis: false },
    { label: 'Watch 2 Hours of TikTok',    icon: '📱', domain: 'MEDIA',     deadline: 'ANYTIME',      impact: 'TIME WASTER',urgent: false, important: false, isCrisis: false },
    { label: 'You Won $1,000,000 Scam',    icon: '🎣', domain: 'SPAM',      deadline: 'EXPIRING!',    impact: 'SPAM NOISE', urgent: false, important: false, isCrisis: false },
    { label: 'Water Living Room Plant',    icon: '🪴', domain: 'CHORE',     deadline: 'THIS WEEK',    impact: 'ROUTINE',    urgent: false, important: false, isCrisis: false },
    { label: 'Organize Old Sock Drawer',   icon: '🧦', domain: 'CHORE',     deadline: 'SOMEDAY',      impact: 'LOW IMPACT', urgent: false, important: false, isCrisis: false },
    { label: 'Pick a Movie for Tonight',   icon: '🎬', domain: 'LEISURE',   deadline: 'TONIGHT',      impact: 'TRIVIAL',    urgent: false, important: false, isCrisis: false },
    { label: 'Free Donut in Breakroom',    icon: '🍩', domain: 'FOOD',      deadline: 'RIGHT NOW!',   impact: 'LOW IMPACT', urgent: false, important: false, isCrisis: false },
];

function getCorrectBin(task) {
    if (task.urgent && task.important) return 'URGENT';
    if (!task.urgent && task.important) return 'IMPORTANT';
    return 'DELEGATE';
}

const BIN_CONFIG = {
    URGENT: {
        color: 0xef4444,
        glow: 0xff6b6b,
        label: 'URGENT',
        sublabel: 'DO IT NOW (CRISIS)',
        icon: '🚨'
    },
    IMPORTANT: {
        color: 0xf59e0b,
        glow: 0xfbbf24,
        label: 'IMPORTANT',
        sublabel: 'PLAN & SCHEDULE',
        icon: '⭐'
    },
    DELEGATE: {
        color: 0x22c55e,
        glow: 0x4ade80,
        label: 'DELEGATE',
        sublabel: 'DISMISS / DELEGATE',
        icon: '📤'
    },
};

export default class PriorityQueueScene extends BaseCognitiveScene {
    constructor() {
        super('PriorityQueueScene');
    }

    init(data) {
        data = data || {};
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.peakDifficulty = this.difficultyLevel;
        this.baseBeltSpeed = dda.belt_speed || 135;
        this.beltSpeed = this.baseBeltSpeed;
        this.spawnInterval = dda.spawn_interval || 2200;
        this.maxCards = dda.max_cards || 4;
        this.ambiguityLevel = dda.ambiguity_level || 0;
        this.gameDuration = dda.time_limit || 60000;

        // Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalDrops = 0;
        this.accuracy = 1.0;
        this.timeLeft = this.gameDuration;
        this.gamePhase = 'IDLE';

        // Dynamic Tempo & Streak Multipliers
        this.comboStreak = 0;
        this.maxCombo = 0;
        this.currentMultiplier = 1.0;

        // Cards on conveyor belt
        this.beltCards = [];
        this.dragCard = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Telemetry tracking
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
        this.roundStartTime = 0;

        // Shuffled deck
        this._catIdx = Phaser.Utils.Array.Shuffle([...Array(TASK_CATALOGUE.length).keys()]);
        this._catPtr = 0;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.createStandardBackground();

        // High-tech sci-fi cyber grid
        this.add.grid(W / 2, H / 2, W, H, 50, 50, 0, 0, 0x10b981, 0.04).setOrigin(0.5);

        // Conveyor Belt Setup
        this.beltY = 250;
        this._drawCyberBelt(W, this.beltY);

        // 3 High-contrast Receptacles (Bins)
        this.bins = {};
        const binW = 285;
        const binH = 135;
        const binY = 625; // 40px margin above ML HUD at 733

        const binPositions = {
            URGENT: 180,
            IMPORTANT: 512,
            DELEGATE: 844,
        };

        Object.entries(binPositions).forEach(([key, x]) => {
            this.bins[key] = this._drawCyberBin(key, x, binY, binW, binH);
        });

        // Large HUD
        this._setupHUD(W);

        // Pure Drag & Drop Input
        this.input.topOnly = false;
        this.input.on('pointerdown', this._onPointerDown, this);
        this.input.on('pointermove', this._onPointerMove, this);
        this.input.on('pointerup', this._onPointerUp, this);

        // Spam click detection
        this.input.on('pointerdown', (ptr, gos) => {
            if (this.isTutorialActive) return;
            this.registerFirstInteraction();
            if (gos.length === 0) {
                const now = this.getTime();
                if (now - this.lastMissTime < 200) this.spamClickCount++;
                this.lastMissTime = now;
            }
        });

        // ML HUD at bottom
        createMlHud(this, 0x10b981);

        // Briefing Overlay
        this._showLargeBriefingOverlay(W, H);
    }

    _showLargeBriefingOverlay(W, H) {
        this.isTutorialActive = true;

        this.briefingContainer = this.add.container(0, 0).setDepth(100);

        // Backdrop
        const bg = this.add.graphics();
        bg.fillStyle(0x020617, 0.94);
        bg.fillRect(0, 0, W, H);
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        this.briefingContainer.add(bg);

        // Modal Frame
        const mW = 860;
        const mH = 610;
        const mX = (W - mW) / 2;
        const mY = (H - mH) / 2;

        const modalG = this.add.graphics();
        modalG.fillStyle(0x0a1024, 0.98);
        modalG.lineStyle(2.5, 0x10b981, 0.95);
        modalG.fillRoundedRect(mX, mY, mW, mH, 18);
        modalG.strokeRoundedRect(mX, mY, mW, mH, 18);

        // Tech Corner Accents
        modalG.lineStyle(3, 0x00f0ff, 1);
        modalG.lineBetween(mX, mY + 16, mX, mY);
        modalG.lineBetween(mX, mY, mX + 16, mY);
        modalG.lineBetween(mX + mW - 16, mY, mX + mW, mY);
        modalG.lineBetween(mX + mW, mY, mX + mW, mY + 16);
        this.briefingContainer.add(modalG);

        // Header Title
        const title = this.add.text(W / 2, mY + 34, 'PRIORITY QUEUE // EVERYDAY LIFE TRIAGE', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '26px',
            fontStyle: 'bold',
            fill: '#10b981'
        }).setOrigin(0.5);
        this.briefingContainer.add(title);

        const sub = this.add.text(W / 2, mY + 64, 'EXECUTIVE STRATEGY · EISENHOWER MATRIX IN REAL-LIFE SITUATIONS', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            fill: '#00f0ff'
        }).setOrigin(0.5);
        this.briefingContainer.add(sub);

        // Rule Explanation
        const prompt = this.add.text(W / 2, mY + 102, 'Drag and drop each incoming card into the correct bin before it leaves the screen!\nEvaluate urgency and real-world value—don\'t fall for sales traps!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fontStyle: 'normal',
            fill: '#cbd5e1',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5, 0);
        this.briefingContainer.add(prompt);

        // 3 Visual Rule Cards
        const cardDefs = [
            {
                title: '🚨 URGENT',
                rule: 'CRITICAL EMERGENCIES\n(DUE RIGHT NOW)',
                desc: '🔥 Kitchen Stove Fire\n🚗 Car Tire Blowout\n💳 Stolen Credit Card',
                color: '#ef4444',
                x: mX + 155
            },
            {
                title: '⭐ IMPORTANT',
                rule: 'HIGH-VALUE GOALS\n(PLAN & SCHEDULE)',
                desc: '📚 Final Exam Study\n🏋️ Exercise & Health\n🎓 Capstone Defense',
                color: '#f59e0b',
                x: mX + 430
            },
            {
                title: '📤 DELEGATE',
                rule: 'DISTRACTIONS & CHORES\n(DISMISS / DELEGATE)',
                desc: '👟 50% Shoe Flash Sale\n💬 Office Gossip Chat\n📱 TikTok Scrolling',
                color: '#22c55e',
                x: mX + 705
            }
        ];

        cardDefs.forEach(c => {
            const cg = this.add.graphics();
            cg.fillStyle(0x0f172a, 0.95);
            cg.lineStyle(2, Phaser.Display.Color.HexStringToColor(c.color).color, 0.85);
            cg.fillRoundedRect(c.x - 120, mY + 180, 240, 195, 14);
            cg.strokeRoundedRect(c.x - 120, mY + 180, 240, 195, 14);
            this.briefingContainer.add(cg);

            const cTitle = this.add.text(c.x, mY + 208, c.title, {
                fontFamily: '"Segoe UI", "Segoe UI Emoji", system-ui, sans-serif',
                fontSize: '20px',
                fontStyle: 'bold',
                fill: c.color
            }).setOrigin(0.5);
            this.briefingContainer.add(cTitle);

            const cRule = this.add.text(c.x, mY + 252, c.rule, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center',
                lineSpacing: 3
            }).setOrigin(0.5);
            this.briefingContainer.add(cRule);

            const cDesc = this.add.text(c.x, mY + 322, c.desc, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '12px',
                fontStyle: 'normal',
                fill: '#94a3b8',
                align: 'center',
                lineSpacing: 4
            }).setOrigin(0.5);
            this.briefingContainer.add(cDesc);
        });

        // Warning Callout
        const callout = this.add.text(W / 2, mY + 420, '💡 PRO TIP: A "50% Shoe Sale" or "Office Gossip" may feel urgent, but its life impact is LOW!\nAlways send distractions and low-impact chores to the DELEGATE bin!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            fill: '#38bdf8',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5, 0);
        this.briefingContainer.add(callout);

        // Big Launch Button
        const btnW = 320;
        const btnH = 58;
        const btnX = W / 2;
        const btnY = mY + mH - 52;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x10b981, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
        this.briefingContainer.add(btnBg);

        const btnTxt = this.add.text(btnX, btnY, '▶  START TRIAGE SESSION', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
            fill: '#021814'
        }).setOrigin(0.5);
        this.briefingContainer.add(btnTxt);

        const hitBox = this.add.rectangle(btnX, btnY, btnW, btnH, 0x000000, 0);
        hitBox.setInteractive({ useHandCursor: true });
        this.briefingContainer.add(hitBox);

        const closeBriefing = () => {
            this.briefingContainer.destroy();
            this.startGameplay();
        };

        hitBox.on('pointerdown', closeBriefing);
    }

    _setupHUD(W) {
        // Score & Multiplier
        this.scoreText = this.add.text(28, 16, 'SCORE: 0', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '28px',
            fontStyle: 'bold',
            fill: '#00f0ff'
        });

        this.comboBadge = this.add.text(28, 52, 'STREAK: 0  |  1.0x', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#38bdf8'
        });

        // Level & Accuracy
        this.diffText = this.add.text(W - 28, 16, `LVL ${this.difficultyLevel} TRIAGE`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#10b981'
        }).setOrigin(1, 0);

        this.accText = this.add.text(W - 28, 52, 'ACCURACY: 100%', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#94a3b8'
        }).setOrigin(1, 0);

        // Center Countdown Timer
        this.timerText = this.add.text(W / 2, 16, '01:00', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '38px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Control Hint Subheader
        this.hintText = this.add.text(W / 2, this.beltY - 125, 'DRAG EACH LIFE EVENT INTO THE MATCHING EISENHOWER BIN', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#38bdf8'
        }).setOrigin(0.5);
    }

    _drawCyberBelt(W, beltY) {
        const trackH = 210;
        const g = this.add.graphics();

        // Dark track base
        g.fillStyle(0x060c18, 0.96);
        g.fillRect(0, beltY - trackH / 2, W, trackH);

        // Grid lines on track
        g.lineStyle(1.5, 0x00f0ff, 0.15);
        for (let x = 0; x <= W + 50; x += 50) {
            g.lineBetween(x, beltY - trackH / 2, x - 25, beltY + trackH / 2);
        }

        // Glowing neon rails
        g.lineStyle(3, 0x00f0ff, 0.7);
        g.lineBetween(0, beltY - trackH / 2, W, beltY - trackH / 2);
        g.lineBetween(0, beltY + trackH / 2, W, beltY + trackH / 2);

        // Red Hazard Breach Zone
        const hazardW = 95;
        const hazG = this.add.graphics();
        hazG.fillStyle(0xef4444, 0.22);
        hazG.fillRect(0, beltY - trackH / 2, hazardW, trackH);
        hazG.lineStyle(3, 0xef4444, 0.9);
        hazG.lineBetween(hazardW, beltY - trackH / 2, hazardW, beltY + trackH / 2);

        this.add.text(hazardW / 2, beltY, '🚨\nBREACH\nZONE', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            fill: '#ef4444',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Chevrons
        this.chevrons = [];
        for (let x = hazardW + 70; x < W; x += 150) {
            const ch = this.add.text(x, beltY + trackH / 2 - 16, '◄ ◄ ◄', {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '15px',
                fontStyle: 'bold',
                fill: '#00f0ff',
                alpha: 0.4
            }).setOrigin(0.5);
            this.chevrons.push(ch);
        }
    }

    _drawCyberBin(key, cx, cy, bW, bH) {
        const cfg = BIN_CONFIG[key];

        // 1. Background Graphics (Depth 5)
        const bg = this.add.graphics().setDepth(5);
        this._renderBinGraphics(bg, cfg, cx, cy, bW, bH, false);

        // 2. High-Contrast Title Text inside Header Bar (Depth 8)
        const titleText = this.add.text(cx, cy - bH / 2 + 22, `${cfg.icon}  ${cfg.label}`, {
            fontFamily: '"Segoe UI", "Segoe UI Emoji", system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(8);

        // 3. Clear Action Sublabel in Center (Depth 8)
        const subText = this.add.text(cx, cy + 4, cfg.sublabel, {
            fontFamily: '"Segoe UI", "Segoe UI Emoji", system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            fill: `#${cfg.glow.toString(16).padStart(6, '0')}`
        }).setOrigin(0.5).setDepth(8);

        // 4. Drop Zone Indicator Callout (Depth 8)
        const dropHint = this.add.text(cx, cy + bH / 2 - 20, '⤓  DROP CARD HERE  ⤓', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#64748b'
        }).setOrigin(0.5).setDepth(8);

        return {
            key,
            x: cx,
            y: cy,
            binW: bW,
            binH: bH,
            bg,
            titleText,
            subText,
            dropHint,
            cfg
        };
    }

    _renderBinGraphics(g, cfg, x, y, bW, bH, active) {
        g.clear();
        // Base Box
        g.fillStyle(active ? 0x142038 : 0x071120, 0.96);
        g.lineStyle(active ? 3.5 : 2, active ? cfg.glow : cfg.color, active ? 1.0 : 0.7);
        g.fillRoundedRect(x - bW / 2, y - bH / 2, bW, bH, 14);
        g.strokeRoundedRect(x - bW / 2, y - bH / 2, bW, bH, 14);

        // Colored Header Pill Bar
        g.fillStyle(cfg.color, active ? 0.45 : 0.22);
        g.fillRoundedRect(x - bW / 2 + 5, y - bH / 2 + 5, bW - 10, 34, 8);
        g.lineStyle(1.5, cfg.glow, active ? 0.9 : 0.5);
        g.strokeRoundedRect(x - bW / 2 + 5, y - bH / 2 + 5, bW - 10, 34, 8);

        // Inner Drop Target Well
        g.fillStyle(cfg.color, active ? 0.18 : 0.05);
        g.fillRoundedRect(x - bW / 2 + 8, y - bH / 2 + 43, bW - 16, bH - 51, 8);
        g.lineStyle(1, cfg.color, active ? 0.7 : 0.2);
        g.strokeRoundedRect(x - bW / 2 + 8, y - bH / 2 + 43, bW - 16, bH - 51, 8);

        // Tech Corner Brackets
        const cs = 14;
        g.lineStyle(2.5, cfg.glow, 0.95);
        // Top-left
        g.lineBetween(x - bW / 2, y - bH / 2 + cs, x - bW / 2, y - bH / 2);
        g.lineBetween(x - bW / 2, y - bH / 2, x - bW / 2 + cs, y - bH / 2);
        // Top-right
        g.lineBetween(x + bW / 2 - cs, y - bH / 2, x + bW / 2, y - bH / 2);
        g.lineBetween(x + bW / 2, y - bH / 2, x + bW / 2, y - bH / 2 + cs);
        // Bottom-left
        g.lineBetween(x - bW / 2, y + bH / 2 - cs, x - bW / 2, y + bH / 2);
        g.lineBetween(x - bW / 2, y + bH / 2, x - bW / 2 + cs, y + bH / 2);
        // Bottom-right
        g.lineBetween(x + bW / 2 - cs, y + bH / 2, x + bW / 2, y + bH / 2);
        g.lineBetween(x + bW / 2, y + bH / 2, x + bW / 2, y + bH / 2 - cs);
    }

    _highlightBin(key, active) {
        const bin = this.bins[key];
        if (!bin) return;
        this._renderBinGraphics(bin.bg, bin.cfg, bin.x, bin.y, bin.binW, bin.binH, active);
        if (active) {
            bin.titleText.setScale(1.06);
            bin.subText.setScale(1.06);
        } else {
            bin.titleText.setScale(1.0);
            bin.subText.setScale(1.0);
        }
    }

    startGameplay() {
        this.isTutorialActive = false;
        this.gamePhase = 'PLAYING';
        this.roundStartTime = this.getTime();
        this.stimulusSpawnTime = this.getTime();

        this._spawnTimer = this.time.addEvent({
            delay: this.spawnInterval,
            callback: this._spawnCard,
            callbackScope: this,
            loop: true
        });

        // Spawn first card immediately
        this._spawnCard();
    }

    update() {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;

        const elapsed = this.getTime() - this.roundStartTime;
        this.timeLeft = Math.max(0, this.gameDuration - elapsed);

        // Update timer
        const s = Math.ceil(this.timeLeft / 1000);
        const m = Math.floor(s / 60);
        this.timerText.setText(`${m < 10 ? '0' : ''}${m}:${(s % 60) < 10 ? '0' : ''}${s % 60}`);

        // Rush Hour / Final Overload Pressure in last 15s
        const isRushHour = this.timeLeft <= 15000;
        if (isRushHour) {
            this.timerText.setColor('#ef4444');
        } else {
            this.timerText.setColor('#ffffff');
        }

        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }

        const dt = this.game.loop.delta;
        
        // Balanced speed scaling
        const streakBonus = Math.min(40, this.comboStreak * 4);
        const effectiveSpeed = (this.beltSpeed + streakBonus) * (isRushHour ? 1.2 : 1.0);
        const pxPerMs = effectiveSpeed / 1000;

        // Animate chevrons
        this.chevrons.forEach(ch => {
            ch.x -= pxPerMs * dt * 0.7;
            if (ch.x < 110) ch.x = this.scale.width - 20;
        });

        // Move active cards on the belt
        for (let i = this.beltCards.length - 1; i >= 0; i--) {
            const card = this.beltCards[i];
            if (card === this.dragCard) continue;

            card.container.x -= pxPerMs * dt;

            // Fuse bar shrinks
            const lifeFrac = Math.max(0, (card.container.x - 95) / (this.scale.width - 95));
            if (card.timerBar) {
                card.timerBar.scaleX = lifeFrac;
            }

            // Hit breach zone
            if (card.container.x < 85) {
                this._recordMiss(card);
            }
        }

        // Highlight bin under cursor while dragging
        if (this.dragCard) {
            const px = this.input.activePointer.x;
            const py = this.input.activePointer.y;
            Object.keys(this.bins).forEach(k => {
                const hit = this._pointerOverBin(k, px, py);
                this._highlightBin(k, hit);
            });
        }
    }

    _spawnCard() {
        if (this.gamePhase !== 'PLAYING') return;
        if (this.beltCards.length >= this.maxCards) return;

        const W = this.scale.width;
        const spawnX = W + 100;
        const spawnY = this.beltY;

        if (this._catPtr >= this._catIdx.length) {
            this._catIdx = Phaser.Utils.Array.Shuffle([...Array(TASK_CATALOGUE.length).keys()]);
            this._catPtr = 0;
        }
        const task = TASK_CATALOGUE[this._catIdx[this._catPtr++]];
        const correctBin = getCorrectBin(task);

        // MASSIVE CARD DIMENSIONS (185 x 195 px)
        const cardW = 185;
        const cardH = 195;
        const container = this.add.container(spawnX, spawnY).setDepth(15);

        // Card Container Base
        const bg = this.add.graphics();
        bg.fillStyle(task.isCrisis ? 0x240606 : 0x091428, 0.98);
        bg.lineStyle(task.isCrisis ? 3 : 2, task.isCrisis ? 0xef4444 : 0x00f0ff, 0.85);
        bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
        bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
        container.add(bg);

        // Top Domain/Category Pill
        const catBadge = this.add.graphics();
        catBadge.fillStyle(task.isCrisis ? 0xef4444 : 0x0e2238, 0.9);
        catBadge.fillRoundedRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW - 16, 22, 6);
        container.add(catBadge);

        const catTitle = task.isCrisis ? '⚡ CRISIS // 2X PTS' : task.domain;
        const catText = this.add.text(0, -cardH / 2 + 19, catTitle, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            fill: task.isCrisis ? '#ffffff' : '#38bdf8'
        }).setOrigin(0.5);
        container.add(catText);

        // Giant Task Icon (46px)
        const iconText = this.add.text(0, -20, task.icon, {
            fontFamily: '"Segoe UI Emoji", "Segoe UI", system-ui, sans-serif',
            fontSize: '46px'
        }).setOrigin(0.5);
        container.add(iconText);

        // Large, Easy-to-Read Task Name (16px Bold White)
        const taskLabel = this.add.text(0, 24, task.label, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            fill: '#ffffff',
            wordWrap: { width: cardW - 16 },
            align: 'center',
            lineSpacing: 2
        }).setOrigin(0.5, 0);
        container.add(taskLabel);

        // Clear Eisenhower Clues (Deadline & Impact)
        const metaG = this.add.graphics();
        // Deadline Pill (Left)
        metaG.fillStyle(0x0f172a, 0.95);
        metaG.lineStyle(1, 0x334155, 0.8);
        metaG.fillRoundedRect(-cardW / 2 + 8, cardH / 2 - 32, 80, 22, 5);
        metaG.strokeRoundedRect(-cardW / 2 + 8, cardH / 2 - 32, 80, 22, 5);

        // Impact Pill (Right)
        metaG.fillRoundedRect(cardW / 2 - 88, cardH / 2 - 32, 80, 22, 5);
        metaG.strokeRoundedRect(cardW / 2 - 88, cardH / 2 - 32, 80, 22, 5);
        container.add(metaG);

        const dlTxt = this.add.text(-cardW / 2 + 48, cardH / 2 - 21, task.deadline, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '9px',
            fontStyle: 'bold',
            fill: '#cbd5e1'
        }).setOrigin(0.5);
        container.add(dlTxt);

        const impTxt = this.add.text(cardW / 2 - 48, cardH / 2 - 21, task.impact, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '9px',
            fontStyle: 'bold',
            fill: task.impact === 'CRITICAL' ? '#f87171' : (task.impact === 'HIGH VALUE' ? '#fbbf24' : '#94a3b8')
        }).setOrigin(0.5);
        container.add(impTxt);

        // Fuse / Urgency Timeline Bar
        const tbG = this.add.graphics();
        tbG.fillStyle(0x00f0ff, 0.8);
        tbG.fillRect(-cardW / 2 + 6, cardH / 2 - 5, cardW - 12, 3);
        container.add(tbG);

        const cardObj = {
            container,
            task,
            correctBin,
            bg,
            timerBar: tbG,
            spawnTime: this.getTime(),
            cardW,
            cardH
        };

        this.beltCards.push(cardObj);
        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
    }

    _onPointerDown(ptr) {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;
        this.registerFirstInteraction();

        for (const card of this.beltCards) {
            const lx = ptr.x - card.container.x;
            const ly = ptr.y - card.container.y;
            if (Math.abs(lx) < card.cardW / 2 && Math.abs(ly) < card.cardH / 2) {
                this.dragCard = card;
                this.dragOffsetX = lx;
                this.dragOffsetY = ly;
                card.container.setDepth(25);
                this.game.canvas.style.cursor = 'grabbing';
                this.tweens.add({
                    targets: card.container,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 60
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

        this.tweens.add({ targets: card.container, scaleX: 1, scaleY: 1, duration: 60 });

        let droppedBin = null;
        for (const [key] of Object.entries(this.bins)) {
            if (this._pointerOverBin(key, ptr.x, ptr.y)) {
                droppedBin = key;
                break;
            }
        }

        Object.keys(this.bins).forEach(k => this._highlightBin(k, false));

        if (!droppedBin) {
            // Return card back to belt level smoothly
            this.tweens.add({
                targets: card.container,
                y: this.beltY,
                duration: 180,
                ease: 'Back.easeOut'
            });
            return;
        }

        this._evaluateDrop(card, droppedBin);
    }

    _pointerOverBin(key, px, py) {
        const bin = this.bins[key];
        const bW2 = bin.binW / 2 + 15;
        const bH2 = bin.binH / 2 + 15;
        return px >= bin.x - bW2 && px <= bin.x + bW2 && py >= bin.y - bH2 && py <= bin.y + bH2;
    }

    _evaluateDrop(card, droppedBin) {
        const reactionTime = this.getTime() - card.spawnTime;
        const isCorrect = droppedBin === card.correctBin;
        this.totalDrops++;

        this._removeCard(card);

        if (isCorrect) {
            this.hits++;
            this.comboStreak++;
            if (this.comboStreak > this.maxCombo) this.maxCombo = this.comboStreak;

            if (this.comboStreak >= 8) this.currentMultiplier = 2.0;
            else if (this.comboStreak >= 5) this.currentMultiplier = 1.5;
            else if (this.comboStreak >= 3) this.currentMultiplier = 1.2;
            else this.currentMultiplier = 1.0;

            const basePoints = card.task.isCrisis ? 250 : 120;
            const speedBonus = Math.max(0, Math.round((4500 - reactionTime) / 25));
            const points = Math.round((basePoints + speedBonus) * this.currentMultiplier);

            this.score += points;

            const streakLabel = this.currentMultiplier > 1.0 ? ` (${this.currentMultiplier}x)` : '';
            this._floatText(`+${points}${streakLabel}`, card.container.x, card.container.y - 50, '#00f0ff');

            if (this.comboStreak >= 3 && this.comboStreak % 2 === 1) {
                this._floatText(`🔥 ${this.comboStreak}X STREAK!`, this.scale.width / 2, this.beltY - 50, '#f59e0b');
            }

            this.cameras.main.flash(70, 0, 240, 255, 0.08);
            this._pulseBin(droppedBin, true);
        } else {
            this.misses++;
            this.comboStreak = 0;
            this.currentMultiplier = 1.0;
            this.score = Math.max(0, this.score - 50);

            this._floatText('-50 WRONG BIN', card.container.x, card.container.y - 50, '#ef4444');
            this.cameras.main.shake(120, 0.009);
            this._pulseBin(droppedBin, false);
            this._showCorrectBin(card.correctBin);
        }

        this._updateHUD();
        this.dispatchTelemetry(reactionTime, isCorrect ? 1.0 : 0.0);

        // Adapt difficulty every 3 hits
        if (this.hits > 0 && this.hits % 3 === 0) {
            this.adaptDifficulty();
        }
    }

    _recordMiss(card) {
        this._removeCard(card);
        this.misses++;
        this.totalDrops++;
        this.comboStreak = 0;
        this.currentMultiplier = 1.0;
        this.score = Math.max(0, this.score - 60);

        this._floatText('🚨 ESCAPED BREACH! -60', this.scale.width / 2, this.beltY - 55, '#ef4444');
        this.cameras.main.shake(140, 0.010);
        this._updateHUD();
        this.dispatchTelemetry(this.gameDuration, 0.0);
    }

    _removeCard(card) {
        const idx = this.beltCards.indexOf(card);
        if (idx !== -1) this.beltCards.splice(idx, 1);
        if (this.dragCard === card) this.dragCard = null;
        card.container.destroy();
    }

    _pulseBin(key, success) {
        const bin = this.bins[key];
        if (!bin) return;
        this.tweens.add({
            targets: [bin.titleText, bin.subText],
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                bin.titleText.setScale(1.0);
                bin.subText.setScale(1.0);
                this._highlightBin(key, false);
            }
        });
    }

    _showCorrectBin(key) {
        const bin = this.bins[key];
        if (!bin) return;
        this._highlightBin(key, true);
        this.time.delayedCall(700, () => this._highlightBin(key, false));
    }

    _floatText(text, x, y, color) {
        const t = this.add.text(x, y, text, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            fill: color
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: t,
            y: y - 55,
            alpha: 0,
            duration: 850,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (t?.active) t.destroy();
            }
        });
    }

    _updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.accuracy = this.totalDrops > 0 ? this.hits / this.totalDrops : 1.0;
        this.accText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
        this.comboBadge.setText(`STREAK: ${this.comboStreak}  |  ${this.currentMultiplier.toFixed(1)}x`);
        this.comboBadge.setColor(this.comboStreak >= 5 ? '#f59e0b' : '#38bdf8');
    }

    async dispatchTelemetry(reactionTimeMs, roundAccuracy) {
        if (!this.sessionId) return;
        const payload = {
            session_id: this.sessionId,
            cognitive_domain: 'executive_strategy',
            game_type: 'PriorityQueue',
            reaction_time: reactionTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };
        try {
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`
                },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry] PriorityQueue offline.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;
        try {
            const resp = await fetch(`${this.apiUrl}/api/dda`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`
                },
                body: JSON.stringify({ session_id: this.sessionId })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.status === 'success' && data.dda_parameters) {
                    const p = data.dda_parameters;
                    this.difficultyLevel = p.difficulty_level;
                    this.peakDifficulty = Math.max(this.peakDifficulty || 1, this.difficultyLevel);
                    this.baseBeltSpeed = p.belt_speed;
                    this.beltSpeed = p.belt_speed;
                    this.spawnInterval = p.spawn_interval;
                    this.maxCards = p.max_cards;
                    this.ambiguityLevel = p.ambiguity_level;

                    if (this._spawnTimer) this._spawnTimer.remove();
                    this._spawnTimer = this.time.addEvent({
                        delay: this.spawnInterval,
                        callback: this._spawnCard,
                        callbackScope: this,
                        loop: true
                    });

                    this.diffText.setText(`LVL ${this.difficultyLevel} TRIAGE`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);
                }
            }
        } catch (e) {
            console.warn('[DDA] PriorityQueue adapt failed.', e);
        }
    }

    endGame() {
        if (this.timerText && this.timerText.active) {
            this.timerText.setText('00:00');
        }
        if (this._spawnTimer) this._spawnTimer.remove();
        this.gamePhase = 'FINISHED';

        this.time.delayedCall(400, () => {
            if (this.onGameOver) {
                this.onGameOver({
                    score: this.score,
                    accuracy: this.accuracy,
                    totalDrops: this.totalDrops,
                    hits: this.hits,
                    misses: this.misses,
                    maxCombo: this.maxCombo,
                    difficulty: this.difficultyLevel,
                    difficultyLevel: this.peakDifficulty || this.difficultyLevel || 1,
                    peakDifficulty: this.peakDifficulty || this.difficultyLevel || 1
                });
            }
        });
    }
}
