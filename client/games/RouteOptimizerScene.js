import { API_BASE } from '../utils/apiClient.js';
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';

// ── Static topology templates per node count ──────────────────────────────
// Coordinates target 800x600 canvas. Graph area: roughly y 155–505.
// Edges are bidirectional. startId='S', endId='E'.
const TOPOLOGIES = {
    4: {
        nodes: [
            { id: 'S', x: 160, y: 330 },
            { id: 'A', x: 390, y: 210 },
            { id: 'B', x: 390, y: 450 },
            { id: 'E', x: 640, y: 330 }
        ],
        edges: [['S','A'], ['S','B'], ['A','E'], ['B','E'], ['A','B']],
        startId: 'S', endId: 'E'
    },
    5: {
        nodes: [
            { id: 'S', x: 110, y: 330 },
            { id: 'A', x: 280, y: 210 },
            { id: 'B', x: 280, y: 450 },
            { id: 'C', x: 470, y: 330 },
            { id: 'E', x: 670, y: 330 }
        ],
        edges: [['S','A'], ['S','B'], ['A','C'], ['B','C'], ['C','E'], ['A','E']],
        startId: 'S', endId: 'E'
    },
    6: {
        nodes: [
            { id: 'S', x: 90,  y: 330 },
            { id: 'A', x: 250, y: 205 },
            { id: 'B', x: 430, y: 205 },
            { id: 'C', x: 250, y: 455 },
            { id: 'D', x: 430, y: 455 },
            { id: 'E', x: 620, y: 330 }
        ],
        edges: [['S','A'], ['S','C'], ['A','B'], ['A','D'], ['C','D'], ['B','E'], ['D','E']],
        startId: 'S', endId: 'E'
    },
    7: {
        nodes: [
            { id: 'S', x: 80,  y: 330 },
            { id: 'A', x: 210, y: 205 },
            { id: 'B', x: 360, y: 205 },
            { id: 'C', x: 210, y: 455 },
            { id: 'D', x: 360, y: 455 },
            { id: 'F', x: 510, y: 330 },
            { id: 'E', x: 660, y: 330 }
        ],
        edges: [['S','A'], ['S','C'], ['A','B'], ['A','D'], ['B','F'], ['C','D'], ['D','F'], ['F','E'], ['C','F'], ['B','E']],
        startId: 'S', endId: 'E'
    },
    8: {
        nodes: [
            { id: 'S', x: 70,  y: 330 },
            { id: 'A', x: 190, y: 210 },
            { id: 'B', x: 330, y: 190 },
            { id: 'C', x: 190, y: 450 },
            { id: 'D', x: 330, y: 450 },
            { id: 'F', x: 480, y: 235 },
            { id: 'G', x: 480, y: 430 },
            { id: 'E', x: 640, y: 330 }
        ],
        edges: [['S','A'], ['S','C'], ['A','B'], ['A','D'], ['B','F'], ['C','D'], ['C','G'], ['D','G'], ['F','G'], ['F','E'], ['G','E'], ['D','F']],
        startId: 'S', endId: 'E'
    }
};

const NODE_RADIUS  = 26;
const C_PRIMARY    = 0x22c55e;   // green-500
const C_WARN       = 0xef4444;   // red
const C_AMBER      = 0xf59e0b;

export default class RouteOptimizerScene extends BaseCognitiveScene {
    constructor() {
        super('RouteOptimizerScene');
    }

    init(data) {
        data = data || {};
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        this.sessionId  = data.sessionId  || null;
        this.apiUrl     = data.apiUrl     || API_BASE;
        this.onGameOver = data.onGameOver || null;

        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.nodeCount       = dda.node_count       || 4;
        this.minWeight       = dda.min_weight       || 1;
        this.maxWeight       = dda.max_weight       || 9;
        this.roundTimeLimit  = dda.time_limit       || 30000;

        this.score         = 0;
        this.hits          = 0;   // perfect optimal solutions
        this.misses        = 0;   // suboptimal / timeouts
        this.totalAttempts = 0;
        this.accuracy      = 1.0;
        this.gameDuration  = 90000; // 90 s — routes need thinking time
        this.timeLeft      = this.gameDuration;

        this.gamePhase          = 'PLAYING';
        this.roundStartTime     = 0;
        this.roundTimeRemaining = this.roundTimeLimit;

        // Graph state
        this.graph         = null;
        this.playerPath    = [];
        this.playerCost    = 0;
        this.nodeObjects   = {};   // id → { circle, label }
        this.edgeObjects   = [];
        this.graphContainer = null;
        this.pathGraphics   = null;

        // Micro-behaviour
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency    = 0;
        this.spamClickCount  = 0;
        this.lastMissTime    = 0;
        this.backtrackCount  = 0;
    }

    // ══════════════════════════════════════════════════════
    //  CREATE
    // ══════════════════════════════════════════════════════

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background – dark green-navy gradient
        this.createStandardBackground();// Dot grid
        const dots = this.add.graphics();
        for (let x = 35; x < W; x += 55) {
            for (let y = 35; y < H; y += 55) {
                dots.fillStyle(C_PRIMARY, 0.03);
                dots.fillCircle(x, y, 1.5);
            }
        }

        // ── HUD
        this.scoreText = this.add.text(20, 18, 'SCORE: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '22px', fontWeight: 'bold', fill: '#22c55e'
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
        this.timerText = this.add.text(W / 2, 18, '01:30', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '30px', fontWeight: 'bold', fill: '#ffffff'
        }).setOrigin(0.5, 0);
        this.statusText = this.add.text(W / 2, 76, 'FIND THE CHEAPEST ROUTE!', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '17px', fontWeight: '800', fill: '#e2e8f0'
        }).setOrigin(0.5, 0);

        // Round timer bar
        this.roundTimerBg = this.add.graphics();
        this.roundTimerBg.fillStyle(0x1e293b, 0.7);
        this.roundTimerBg.fillRoundedRect(W / 2 - 220, 106, 440, 8, 4);
        this.roundTimerBar = this.add.graphics();

        // Cost / route display
        this.costLabel = this.add.text(W / 2, 506, 'ROUTE: S   |   COST: 0', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '15px', fontWeight: '600', fill: '#22c55e'
        }).setOrigin(0.5, 0);

        // ── Reset button (fixed center-bottom)
        this.resetBtnGfx = this.add.graphics();
        this._drawResetBtn(false);
        this.resetBtnGfx.setInteractive(
            new Phaser.Geom.Rectangle(W / 2 - 75, 534, 150, 36),
            Phaser.Geom.Rectangle.Contains
        );
        this.resetBtnGfx.on('pointerover', () => this._drawResetBtn(true));
        this.resetBtnGfx.on('pointerout',  () => this._drawResetBtn(false));
        this.resetBtnGfx.on('pointerdown', () => {
            if (this.isTutorialActive) return;
            this.resetPath();
        });
        this.resetBtnLabel = this.add.text(W / 2, 552, 'RESET PATH', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '12px', fontWeight: '700', fill: '#22c55e'
        }).setOrigin(0.5);

        // Legend
        this.add.circle(72, 558, 7, 0x052e16).setStrokeStyle(2, C_PRIMARY);
        this.add.text(84, 558, 'START', {
            fontFamily: 'system-ui', fontSize: '10px', fill: '#64748b'
        }).setOrigin(0, 0.5);
        this.add.circle(155, 558, 7, 0x431407).setStrokeStyle(2, 0xf97316);
        this.add.text(167, 558, 'END', {
            fontFamily: 'system-ui', fontSize: '10px', fill: '#64748b'
        }).setOrigin(0, 0.5);
        this.add.text(W - 20, 558,
            'Click adjacent nodes to build your route', {
            fontFamily: 'system-ui', fontSize: '10px', fill: '#334155'
        }).setOrigin(1, 0.5);

        // Graph & overlay containers
        this.graphContainer = this.add.container(0, 0);
        this.pathGraphics   = this.add.graphics();

        // Micro-behaviour
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

        createMlHud(this, 0x10b981);
        createTutorialOverlay(this, {
            title: "ROUTE OPTIMIZER",
            domain: "executive_strategy",
            instructions: "• Connect all terminal hubs using the shortest possible path network.\n\n• DDA scales node cluster sizes dynamically.\n\n• Track your path efficiency to optimize routing performance.",
            themeColorHex: 0x10b981,
            onStart: () => this.startGameplay()
        });
    }

    update() {
        if (this.isTutorialActive || this.gamePhase !== 'PLAYING') return;

        const elapsed = this.time.now - this.roundStartTime;
        this.roundTimeRemaining = Math.max(0, this.roundTimeLimit - elapsed);

        const W = this.scale.width;
        this.roundTimerBar.clear();
        const ratio = this.roundTimeRemaining / this.roundTimeLimit;
        const color = ratio < 0.3 ? C_WARN : ratio < 0.6 ? C_AMBER : C_PRIMARY;
        this.roundTimerBar.fillStyle(color, 0.9);
        const fw = ratio * 440;
        if (fw > 0) this.roundTimerBar.fillRoundedRect(W / 2 - 220, 106, fw, 8, 4);

        if (this.roundTimeRemaining <= 0) this.handleTimeout();
    }

    startGameplay() {
        this.isTutorialActive = false;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateOverallTimer,
            callbackScope: this,
            loop: true
        });
        this.startNewRound();
    }

    updateOverallTimer() {
        this.timeLeft -= 1000;
        const s = Math.ceil(this.timeLeft / 1000);
        const m = Math.floor(s / 60);
        this.timerText.setText(`0${m}:${(s % 60) < 10 ? '0' : ''}${s % 60}`);
        if (this.timeLeft <= 0) this.endGame();
    }

    // ══════════════════════════════════════════════════════
    //  GRAPH GENERATION (Dijkstra)
    // ══════════════════════════════════════════════════════

    generateGraph() {
        const topo = TOPOLOGIES[this.nodeCount] || TOPOLOGIES[4];
        const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

        const weightedEdges = topo.edges.map(([fId, tId]) => ({
            fromId: fId, toId: tId,
            weight: rand(this.minWeight, this.maxWeight)
        }));

        // Build adjacency list (bidirectional)
        const adjacency = {};
        topo.nodes.forEach(n => { adjacency[n.id] = []; });
        weightedEdges.forEach(({ fromId, toId, weight }) => {
            adjacency[fromId].push({ toId, weight });
            adjacency[toId].push({ toId: fromId, weight });
        });

        const nodeIds = topo.nodes.map(n => n.id);
        const { dist, prev } = this._dijkstra(nodeIds, adjacency, topo.startId);

        const optimalCost = dist[topo.endId];
        const optimalPath = this._reconstructPath(prev, topo.startId, topo.endId);

        return {
            nodes: topo.nodes,
            edges: weightedEdges,
            adjacency,
            optimalCost: isFinite(optimalCost) ? optimalCost : 999,
            optimalPath,
            startId: topo.startId,
            endId: topo.endId
        };
    }

    _dijkstra(nodeIds, adjacency, startId) {
        const dist = {}, prev = {};
        const unvisited = new Set(nodeIds);
        nodeIds.forEach(id => { dist[id] = Infinity; prev[id] = null; });
        dist[startId] = 0;

        while (unvisited.size > 0) {
            let u = null;
            unvisited.forEach(id => {
                if (u === null || dist[id] < dist[u]) u = id;
            });
            if (u === null || dist[u] === Infinity) break;
            unvisited.delete(u);
            adjacency[u].forEach(({ toId, weight }) => {
                const alt = dist[u] + weight;
                if (alt < dist[toId]) { dist[toId] = alt; prev[toId] = u; }
            });
        }
        return { dist, prev };
    }

    _reconstructPath(prev, startId, endId) {
        const path = [];
        let cur = endId;
        while (cur !== null) { path.unshift(cur); cur = prev[cur]; }
        return path[0] === startId ? path : [];
    }

    // ══════════════════════════════════════════════════════
    //  RENDERING
    // ══════════════════════════════════════════════════════

    startNewRound() {
        if (this.timeLeft <= 0) return;
        this.gamePhase = 'PLAYING';
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency    = 0;
        this.statusText.setText('FIND THE CHEAPEST ROUTE!').setFill('#e2e8f0');

        // Clear previous objects
        this.graphContainer.removeAll(true);
        this.pathGraphics.clear();
        this.nodeObjects = {};
        this.edgeObjects = [];

        // Generate graph and pre-select START
        this.graph = this.generateGraph();
        this.playerPath = [this.graph.startId];
        this.playerCost = 0;

        this._renderGraph();
        this._updatePathVisual();
        this._updateCostDisplay();

        this.roundStartTime     = this.time.now;
        this.roundTimeRemaining = this.roundTimeLimit;
    }

    _renderGraph() {
        const { nodes, edges, startId, endId } = this.graph;

        // ── Draw edges first (underneath nodes)
        edges.forEach(({ fromId, toId, weight }) => {
            const from = nodes.find(n => n.id === fromId);
            const to   = nodes.find(n => n.id === toId);

            const line = this.add.graphics();
            line.lineStyle(2, 0x334155, 0.5);
            line.beginPath();
            line.moveTo(from.x, from.y);
            line.lineTo(to.x, to.y);
            line.strokePath();
            this.graphContainer.add(line);

            // Weight label background pill
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const pill = this.add.graphics();
            pill.fillStyle(0x020617, 0.88);
            pill.fillRoundedRect(mx - 14, my - 10, 28, 20, 5);
            this.graphContainer.add(pill);

            const wLbl = this.add.text(mx, my, weight.toString(), {
                fontFamily: CogniTheme.fonts.body,
                fontSize: '13px', fontWeight: '700', fill: '#475569'
            }).setOrigin(0.5);
            this.graphContainer.add(wLbl);

            this.edgeObjects.push({ fromId, toId, weight, line, wLbl, pill });
        });

        // ── Draw nodes
        nodes.forEach(({ id, x, y }) => {
            const isStart = id === startId;
            const isEnd   = id === endId;

            const fillColor   = isStart ? 0x052e16 : isEnd ? 0x431407 : 0x0f172a;
            const borderColor = isStart ? C_PRIMARY : isEnd ? 0xf97316 : 0x334155;

            const circle = this.add.circle(x, y, NODE_RADIUS, fillColor);
            circle.setStrokeStyle(2.5, borderColor);
            circle.setInteractive();
            this.graphContainer.add(circle);

            const textFill = isStart ? '#4ade80' : isEnd ? '#fb923c' : '#94a3b8';
            const lbl = this.add.text(x, y, id, {
                fontFamily: CogniTheme.fonts.body,
                fontSize: '17px', fontWeight: '800', fill: textFill
            }).setOrigin(0.5);
            this.graphContainer.add(lbl);

            if (isStart || isEnd) {
                const roleLbl = this.add.text(x, y + NODE_RADIUS + 9,
                    isStart ? 'START' : 'END', {
                    fontFamily: CogniTheme.fonts.body,
                    fontSize: '9px', fontWeight: '700',
                    fill: isStart ? '#22c55e' : '#f97316'
                }).setOrigin(0.5, 0);
                this.graphContainer.add(roleLbl);
            }

            // Interaction
            circle.on('pointerover', () => {
                if (this.gamePhase !== 'PLAYING') return;
                if (this._isClickable(id)) {
                    circle.setStrokeStyle(3.5, C_PRIMARY);
                    this.game.canvas.style.cursor = 'pointer';
                }
            });
            circle.on('pointerout', () => {
                this.game.canvas.style.cursor = 'default';
                if (this.gamePhase === 'PLAYING') this._updatePathVisual();
            });
            circle.on('pointerdown', () => {
                if (this.isTutorialActive) return;
                if (this.gamePhase !== 'PLAYING') return;
                this.handleNodeClick(id);
            });

            this.nodeObjects[id] = { circle, lbl };
        });
    }

    _updatePathVisual() {
        if (!this.graph) return;
        const { nodes, startId, endId } = this.graph;

        // ── Update node appearances
        nodes.forEach(({ id }) => {
            const obj = this.nodeObjects[id];
            if (!obj) return;
            const isStart   = id === startId;
            const isEnd     = id === endId;
            const inPath    = this.playerPath.includes(id);
            const isCurrent = this.playerPath[this.playerPath.length - 1] === id;
            const clickable = this._isClickable(id);

            let fill, border, textFill;
            if (inPath) {
                fill     = isCurrent ? 0x166534 : 0x14532d;
                border   = isCurrent ? C_PRIMARY : 0x4ade80;
                textFill = '#4ade80';
            } else if (isStart) {
                fill = 0x052e16; border = C_PRIMARY; textFill = '#4ade80';
            } else if (isEnd) {
                fill = 0x431407; border = 0xf97316; textFill = '#fb923c';
            } else {
                fill     = 0x0f172a;
                border   = clickable ? 0x166534 : 0x334155;
                textFill = clickable ? '#64748b' : '#475569';
            }

            obj.circle.setFillStyle(fill);
            obj.circle.setStrokeStyle(inPath ? 3 : 2.5, border);
            obj.lbl.setFill(textFill);
        });

        // ── Redraw player path overlay
        this.pathGraphics.clear();
        for (let i = 0; i < this.playerPath.length - 1; i++) {
            const nodeA = nodes.find(n => n.id === this.playerPath[i]);
            const nodeB = nodes.find(n => n.id === this.playerPath[i + 1]);
            if (!nodeA || !nodeB) continue;

            // Glow (wide, dim)
            this.pathGraphics.lineStyle(7, C_PRIMARY, 0.18);
            this.pathGraphics.beginPath();
            this.pathGraphics.moveTo(nodeA.x, nodeA.y);
            this.pathGraphics.lineTo(nodeB.x, nodeB.y);
            this.pathGraphics.strokePath();

            // Core line
            this.pathGraphics.lineStyle(3, C_PRIMARY, 0.9);
            this.pathGraphics.beginPath();
            this.pathGraphics.moveTo(nodeA.x, nodeA.y);
            this.pathGraphics.lineTo(nodeB.x, nodeB.y);
            this.pathGraphics.strokePath();

            // Arrow head direction
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len, uy = dy / len;
            const midX = (nodeA.x + nodeB.x) / 2;
            const midY = (nodeA.y + nodeB.y) / 2;
            const arrowLen = 8;
            this.pathGraphics.lineStyle(2, C_PRIMARY, 0.8);
            this.pathGraphics.beginPath();
            this.pathGraphics.moveTo(midX - uy * arrowLen * 0.5, midY + ux * arrowLen * 0.5);
            this.pathGraphics.lineTo(midX + ux * arrowLen, midY + uy * arrowLen);
            this.pathGraphics.lineTo(midX + uy * arrowLen * 0.5, midY - ux * arrowLen * 0.5);
            this.pathGraphics.strokePath();
        }
    }

    _updateCostDisplay() {
        const routeStr = this.playerPath.join(' → ');
        this.costLabel.setText(`ROUTE: ${routeStr}   |   COST: ${this.playerCost}`);
    }

    // ══════════════════════════════════════════════════════
    //  INTERACTION
    // ══════════════════════════════════════════════════════

    _isClickable(nodeId) {
        if (!this.graph) return false;
        if (this.playerPath.includes(nodeId)) return false;
        const last = this.playerPath[this.playerPath.length - 1];
        return this.graph.adjacency[last]?.some(e => e.toId === nodeId) || false;
    }

    handleNodeClick(nodeId) {
        if (this.gamePhase !== 'PLAYING') return;
        this.registerFirstInteraction();

        if (!this._isClickable(nodeId)) {
            this.cameras.main.shake(60, 0.003);
            return;
        }

        // Find weight of edge last→nodeId
        const last   = this.playerPath[this.playerPath.length - 1];
        const edge   = this.graph.adjacency[last].find(e => e.toId === nodeId);
        const weight = edge ? edge.weight : 0;

        this.playerPath.push(nodeId);
        this.playerCost += weight;

        this._updatePathVisual();
        this._updateCostDisplay();

        // Bounce animation on added node
        const obj = this.nodeObjects[nodeId];
        if (obj) {
            this.tweens.add({
                targets: obj.circle,
                scaleX: 1.3, scaleY: 1.3,
                yoyo: true, duration: 140, ease: 'Back.easeOut'
            });
        }

        // Reached end?
        if (nodeId === this.graph.endId) {
            this.time.delayedCall(350, () => this.evaluatePath());
        }
    }

    resetPath() {
        if (this.gamePhase !== 'PLAYING') return;
        this.backtrackCount++;
        this.playerPath = [this.graph.startId];
        this.playerCost = 0;
        this._updatePathVisual();
        this._updateCostDisplay();
        this._showFloat('PATH RESET', '#64748b');
    }

    // ══════════════════════════════════════════════════════
    //  EVALUATION
    // ══════════════════════════════════════════════════════

    evaluatePath() {
        if (this.gamePhase !== 'PLAYING') return;
        this.gamePhase = 'FEEDBACK';
        this.totalAttempts++;

        const pCost = this.playerCost;
        const oCost = this.graph.optimalCost;
        const solveTime = this.time.now - this.roundStartTime;
        const ratio = pCost / oCost;

        let isHit = false, scorePoints = 0;

        if (ratio === 1.0) {
            // ✅ Perfect — found the exact optimal route
            isHit = true;

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
            const timeBonus = Math.max(0, Math.round((this.roundTimeLimit - solveTime) / 100));
            scorePoints = 160 * this.difficultyLevel + timeBonus;
            this._showFloat(`+${scorePoints}  OPTIMAL ROUTE!  (COST: ${pCost})`, '#4ade80');
            this.statusText.setText('OPTIMAL ROUTE FOUND!').setFill('#4ade80');
            this.cameras.main.flash(120, 34, 197, 94, 0.13);
        } else if (ratio <= 1.3) {
            // ⚡ Near-optimal (within 30%)
            this.misses++;
            scorePoints = Math.round(90 * this.difficultyLevel);
            this._showFloat(`+${scorePoints}  NEAR OPTIMAL  (Your: ${pCost} / Best: ${oCost})`, '#f59e0b');
            this.statusText.setText('GOOD — BUT NOT OPTIMAL').setFill('#f59e0b');
        } else {
            // ❌ Suboptimal
            this.misses++;
            scorePoints = Math.round(30 * this.difficultyLevel);
            this._showFloat(`+${scorePoints}  SUBOPTIMAL  (Your: ${pCost} / Best: ${oCost})`, '#ef4444');
            this.statusText.setText('ROUTE NOT OPTIMAL').setFill('#ef4444');
            this.cameras.main.shake(100, 0.005);
        }

        this.score += scorePoints;
        this.updateHUD();
        const pathEfficiency = this.playerCost > 0 ? (this.graph.optimalCost / this.playerCost) : 0.0;
        this.dispatchRoundTelemetry(solveTime, isHit ? 1.0 : ratio <= 1.3 ? 0.5 : 0.0, pathEfficiency);

        // Reveal optimal path after brief pause
        this.time.delayedCall(500, () => this._showOptimalPath());
        this.scheduleNextRound();
    }

    _showOptimalPath() {
        const { nodes, optimalPath, endId, optimalCost } = this.graph;
        if (!optimalPath || optimalPath.length < 2) return;

        // Draw optimal path in bright lime green dashes
        for (let i = 0; i < optimalPath.length - 1; i++) {
            const nA = nodes.find(n => n.id === optimalPath[i]);
            const nB = nodes.find(n => n.id === optimalPath[i + 1]);
            if (!nA || !nB) continue;
            this.pathGraphics.lineStyle(4, 0x4ade80, 0.6);
            this.pathGraphics.beginPath();
            this.pathGraphics.moveTo(nA.x, nA.y);
            this.pathGraphics.lineTo(nB.x, nB.y);
            this.pathGraphics.strokePath();
        }

        // Label near END node
        const endNode = nodes.find(n => n.id === endId);
        if (endNode) {
            const lbl = this.add.text(endNode.x, endNode.y - 48,
                `OPTIMAL: ${optimalCost}`, {
                fontFamily: 'system-ui', fontSize: '12px',
                fontWeight: '700', fill: '#4ade80'
            }).setOrigin(0.5);
            this.time.delayedCall(2000, () => { if (lbl && lbl.active) lbl.destroy(); });
        }
    }

    handleTimeout() {
        if (this.gamePhase !== 'PLAYING') return;
        this.gamePhase = 'FEEDBACK';
        this.misses++;
        this.totalAttempts++;

        this._showFloat(`TIME OUT!  Optimal was: ${this.graph.optimalCost}`, '#ef4444');
        this.statusText.setText('TIME EXPIRED!').setFill('#ef4444');
        this.cameras.main.shake(110, 0.007);

        this.updateHUD();
        this.dispatchRoundTelemetry(this.roundTimeLimit, 0.0, 0.0);
        this.time.delayedCall(500, () => this._showOptimalPath());
        this.scheduleNextRound();
    }

    scheduleNextRound() {
        this.time.delayedCall(2400, () => {
            if (this.timeLeft <= 0) return;
            if (this.totalAttempts % 3 === 0) {
                this.adaptDifficulty();
            } else {
                this.startNewRound();
            }
        });
    }

    // ══════════════════════════════════════════════════════
    //  HUD & UI HELPERS
    // ══════════════════════════════════════════════════════

    updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.accuracy = this.totalAttempts > 0 ? this.hits / this.totalAttempts : 1.0;
        this.accuracyText.setText(`ACCURACY: ${Math.round(this.accuracy * 100)}%`);
    }

    _showFloat(text, color) {
        const W = this.scale.width;
        const ft = this.add.text(W / 2, 488, text, {
            fontFamily: 'system-ui', fontSize: '14px', fontWeight: 'bold', fill: color
        }).setOrigin(0.5);
        this.tweens.add({
            targets: ft, y: 462, alpha: 0, duration: 1300,
            onComplete: () => { if (ft && ft.active) ft.destroy(); }
        });
    }

    _drawResetBtn(hover) {
        const W = this.scale.width;
        this.resetBtnGfx.clear();
        this.resetBtnGfx.fillStyle(hover ? 0x052e16 : 0x020617, 0.9);
        this.resetBtnGfx.lineStyle(1.5, C_PRIMARY, hover ? 0.8 : 0.4);
        this.resetBtnGfx.fillRoundedRect(W / 2 - 75, 534, 150, 36, 8);
        this.resetBtnGfx.strokeRoundedRect(W / 2 - 75, 534, 150, 36, 8);
    }

    // ══════════════════════════════════════════════════════
    //  DDA & TELEMETRY
    // ══════════════════════════════════════════════════════

    async dispatchRoundTelemetry(solveTimeMs, roundAccuracy, pathEfficiency = 0.0) {
        if (!this.sessionId) return;
        const payload = {
            session_id: this.sessionId,
            cognitive_domain: 'logical_mathematical',
            game_type: 'RouteOptimizer',
            reaction_time: solveTimeMs,
            accuracy_rate: roundAccuracy,
            difficulty: this.difficultyLevel,
            error_count: roundAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount + this.backtrackCount,
            path_efficiency: pathEfficiency
        };
        try {
            await fetch(`${this.apiUrl}/api/submit-metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[Telemetry] RouteOptimizer unreachable.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;
        this.statusText.setText('ADAPTING DIFFICULTY...').setFill('#64748b');
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
                    const changed = this.difficultyLevel !== p.difficulty_level;
                    this.difficultyLevel = p.difficulty_level;
                    this.nodeCount       = p.node_count;
                    this.minWeight       = p.min_weight;
                    this.maxWeight       = p.max_weight;
                    this.roundTimeLimit  = p.time_limit;
                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);
                    if (changed) this._showFloat(`DIFFICULTY ADJUSTED: LEVEL ${this.difficultyLevel}`, '#a78bfa');
                }
            }
        } catch (e) {
            console.warn('[DDA] RouteOptimizer connection failed.', e);
        }
        this.startNewRound();
    }

    endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        this.graphContainer.removeAll(true);
        this.pathGraphics.clear();
        console.log('[RouteOptimizer] Game Over:', {
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
                spam_click_count: this.spamClickCount,
                backtrack_count: this.backtrackCount
            });
        }
    }
}
