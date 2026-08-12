import useCogniStore from '../store/useCogniStore';
import { API_BASE } from '../utils/apiClient.js';
/**
 * ================================================================================
 * Chapter 2 Methodology Compliance: Software Engineering Architecture Patterns
 * - Pattern: Model-View-Controller (MVC) / Client-Server Communication (Bridge Pattern)
 * - Component: View & Controller (Phaser Game Loop) / Data Dispatcher (Service Bridge)
 * - Modular Independence: Self-contained Focus Finder attention search scene.
 * - Dynamic Difficulty Adjustment (DDA): Implements hot-swapping game variables
 *   (distractors count, movement speed, visual similarity) updated via REST API.
 * ================================================================================
 */
import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import BaseCognitiveScene from './BaseCognitiveScene';
import { createTutorialOverlay, createMlHud, updateMlHud } from './seriousGameOverlay';
import cogniFX from '../utils/cogniFX';

export default class FocusFinderScene extends BaseCognitiveScene {
    constructor() {
        super('FocusFinderScene');
    }

    preload() {
        // Pre-generate GPU-cached textures for all 25 shape×color combos.
        // At runtime, spawnTargetObject/spawnDistractorObject use sprite lookups
        // instead of Graphics draw calls, cutting per-wave GPU overhead.
        const shapesList = ['circle', 'square', 'triangle', 'star', 'hexagon'];
        const colorsMap = {
            'teal':   0x06b6d4,
            'purple': 0xa855f7,
            'yellow': 0xf59e0b,
            'coral':  0xf97316,
            'green':  0x10b981
        };
        const TEX_SIZE = 64; // texture canvas size (pixels)
        const r = TEX_SIZE / 2;

        const drawToGfx = (gfx, shapeType, colorHex) => {
            gfx.clear();
            gfx.fillStyle(colorHex, 0.45);
            gfx.lineStyle(2.5, colorHex, 0.95);

            if (shapeType === 'circle') {
                gfx.fillCircle(r, r, r - 3);
                gfx.strokeCircle(r, r, r - 3);
                gfx.lineStyle(1.5, 0xffffff, 0.5);
                gfx.strokeCircle(r, r, (r - 3) * 0.55);
            } else if (shapeType === 'square') {
                gfx.fillRoundedRect(3, 3, TEX_SIZE - 6, TEX_SIZE - 6, 8);
                gfx.strokeRoundedRect(3, 3, TEX_SIZE - 6, TEX_SIZE - 6, 8);
                gfx.lineStyle(1.5, 0xffffff, 0.5);
                const inner = (TEX_SIZE - 6) * 0.4;
                gfx.strokeRoundedRect(r - inner / 2, r - inner / 2, inner, inner, 4);
            } else if (shapeType === 'triangle') {
                gfx.beginPath();
                gfx.moveTo(r, 3);
                gfx.lineTo(TEX_SIZE - 3, TEX_SIZE - 3);
                gfx.lineTo(3, TEX_SIZE - 3);
                gfx.closePath();
                gfx.fillPath();
                gfx.strokePath();
                gfx.lineStyle(1.5, 0xffffff, 0.5);
                gfx.beginPath();
                gfx.moveTo(r, r * 0.6);
                gfx.lineTo(r + r * 0.55, TEX_SIZE - 3 - (r * 0.6));
                gfx.lineTo(r - r * 0.55, TEX_SIZE - 3 - (r * 0.6));
                gfx.closePath();
                gfx.strokePath();
            } else if (shapeType === 'star') {
                const spikes = 5;
                const outerR = r - 3;
                const innerR = (r - 3) * 0.4;
                let rot = (Math.PI / 2) * 3;
                const step = Math.PI / spikes;
                gfx.beginPath();
                for (let i = 0; i < spikes; i++) {
                    gfx.lineTo(r + Math.cos(rot) * outerR, r + Math.sin(rot) * outerR);
                    rot += step;
                    gfx.lineTo(r + Math.cos(rot) * innerR, r + Math.sin(rot) * innerR);
                    rot += step;
                }
                gfx.closePath();
                gfx.fillPath();
                gfx.strokePath();
                gfx.lineStyle(1.5, 0xffffff, 0.6);
                gfx.strokeCircle(r, r, 4);
            } else if (shapeType === 'hexagon') {
                gfx.beginPath();
                for (let s = 0; s < 6; s++) {
                    const ang = (Math.PI / 3) * s;
                    const px = r + Math.cos(ang) * (r - 3);
                    const py = r + Math.sin(ang) * (r - 3);
                    if (s === 0) gfx.moveTo(px, py);
                    else gfx.lineTo(px, py);
                }
                gfx.closePath();
                gfx.fillPath();
                gfx.strokePath();
                gfx.lineStyle(1.5, 0xffffff, 0.5);
                gfx.beginPath();
                for (let s = 0; s < 6; s++) {
                    const ang = (Math.PI / 3) * s;
                    const px = r + Math.cos(ang) * (r - 3) * 0.6;
                    const py = r + Math.sin(ang) * (r - 3) * 0.6;
                    if (s === 0) gfx.moveTo(px, py);
                    else gfx.lineTo(px, py);
                }
                gfx.closePath();
                gfx.strokePath();
            }
        };

        // Draw each combination and generate a named texture
        const gfx = this.add.graphics();
        shapesList.forEach(shape => {
            Object.entries(colorsMap).forEach(([colorName, colorHex]) => {
                const key = `ff_${shape}_${colorName}`;
                if (!this.textures.exists(key)) {
                    drawToGfx(gfx, shape, colorHex);
                    gfx.generateTexture(key, TEX_SIZE, TEX_SIZE);
                }
            });
        });
        gfx.destroy();
    }

    init(data) {
        const profile = data.cognitiveProfile || {};
        this.archetype = profile.archetype || 'Initializing...';
        this.archetypeConfidence = profile.confidence_score || 0.0;
        this.isTutorialActive = true;
        // Core configuration passed from React
        this.sessionId = data.sessionId || null;
        this.apiUrl = data.apiUrl || API_BASE;
        this.onGameOver = data.onGameOver || null;

        // DDA variables (Attention & Concentration)
        const dda = data.ddaParameters || {};
        this.difficultyLevel = dda.difficulty_level || 1;
        this.distractorCount = dda.distractors || 5;
        this.movementSpeed = dda.speed || 0;
        this.visualSimilarity = dda.similarity || 'low'; // low | medium | high

        // Session Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalClicks = 0;
        this.accuracy = 1.0;
        this.gameDuration = 30000; // 30 seconds
        this.timeLeft = this.gameDuration;

        // Micro-behavior metrics
        this.stimulusSpawnTime = 0;
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;
        this.spamClickCount = 0;
        this.lastMissTime = 0;
        this.telemetryBuffer = [];

        // Shapes & Colors dictionaries
        this.shapesList = ['circle', 'square', 'triangle', 'star', 'hexagon'];
        this.colorsMap = {
            'teal': 0x06b6d4,
            'purple': 0xa855f7,
            'yellow': 0xf59e0b,
            'coral': 0xf97316,
            'green': 0x10b981
        };
        this.colorsList = Object.keys(this.colorsMap);

        // Target settings
        this.targetShape = '';
        this.targetColor = '';
        this.targetSpawnTime = 0;

        // Active game objects
        this.spawnedObjects = [];
        this.countdownTimer = null;
        this.targetGraphicPreview = null;
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Sleek Background with Gradient (Premium Tech Look)
        this.createStandardBackground();// Tech grid lines
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, 0x3b82f6, 0.03);
        grid.setOrigin(0.5);

        // Set physics bounds (prevent elements floating off screen, account for header/HUD)
        this.physics.world.setBounds(20, 100, width - 40, height - 120);

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

        this.timerText = this.add.text(width / 2 - 120, 20, '00:30', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        // Target panel header (instruction banner)
        this.instructionPanel = this.add.graphics();
        this.instructionPanel.fillStyle(0x1e293b, 0.6);
        this.instructionPanel.lineStyle(1.5, 0xffffff, 0.1);
        this.instructionPanel.fillRoundedRect(width / 2 - 80, 12, 170, 76, 8);
        this.instructionPanel.strokeRoundedRect(width / 2 - 80, 12, 170, 76, 8);

        this.instructionText = this.add.text(width / 2 + 5, 26, 'FIND:', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '11px',
            fontWeight: 'bold',
            fill: '#94a3b8'
        }).setOrigin(0.5);

        this.targetNameText = this.add.text(width / 2 + 5, 46, '', {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '13px',
            fontWeight: '900',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 3. Spawning Loops
        createMlHud(this, 0xa855f7);
        createTutorialOverlay(this, {
            title: "FOCUS FINDER",
            domain: "reflexes_and_focus",
            instructions: "• Locate and click the target shape matching the top preview window.\n\n• Ignore distracting shape/color combinations.\n\n• Maintain accuracy: misses and false clicks degrade score.",
            themeColorHex: 0xa855f7,
            onStart: () => this.startGameplay()
        });

        // Micro-behavior tracking listeners
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
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        this.generateWave();
        if (this.difficultyLevel >= 4) {
            cogniFX.startNoise(this.difficultyLevel);
        }
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

    generateWave() {
        // Handle visual noise at high difficulties
        if (this.difficultyLevel >= 4) {
            this.spawnVisualNoise();
        }

        // Clear existing wave items
        this.spawnedObjects.forEach(obj => obj.destroy());
        this.spawnedObjects = [];

        this.stimulusSpawnTime = this.getTime();
        this.firstInteractionRegistered = false;
        this.firstInteractionLatency = 0;

        // 1. Pick a random target shape and color
        this.targetShape = Phaser.Utils.Array.GetRandom(this.shapesList);
        this.targetColor = Phaser.Utils.Array.GetRandom(this.colorsList);

        // Update target HUD display
        const colorLabel = this.targetColor.toUpperCase();
        const shapeLabel = this.targetShape.toUpperCase();
        this.targetNameText.setText(`${colorLabel} ${shapeLabel}`).setFill(this.colorsMap[this.targetColor]);

        // Draw HUD target graphic preview
        if (this.targetGraphicPreview) this.targetGraphicPreview.destroy();
        this.targetGraphicPreview = this.add.graphics();
        this.targetGraphicPreview.setPosition(this.scale.width / 2 - 50, 50);
        this.drawShapeGraphic(this.targetGraphicPreview, this.targetShape, this.colorsMap[this.targetColor], 28);

        // 2. Spawn correct target
        this.spawnTargetObject();

        // 3. Spawn distractors based on DDA count & similarity rules
        for (let i = 0; i < this.distractorCount; i++) {
            this.spawnDistractorObject();
        }

        // Mark target spawn time for search metrics calculations
        this.targetSpawnTime = this.getTime();
    }

    spawnTargetObject() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Keep position clear of HUD overlay
        const x = Phaser.Math.Between(60, width - 60);
        const y = Phaser.Math.Between(130, height - 60);

        const container = this.add.container(x, y);
        const size = 52;

        // Use pre-cached GPU texture sprite
        const texKey = `ff_${this.targetShape}_${this.targetColor}`;
        let sprite;
        if (this.textures.exists(texKey)) {
            sprite = this.add.image(0, 0, texKey);
            // Normalize to match 52px display size (texture is 64px)
            sprite.setScale(size / 64);
        } else {
            // Fallback: draw live if texture wasn't cached (shouldn't happen)
            sprite = this.add.graphics();
            this.drawShapeGraphic(sprite, this.targetShape, this.colorsMap[this.targetColor], size);
        }
        container.add(sprite);

        // Setup interaction - center the hit area correctly for sprite texture bounds
        const hitArea = (sprite.width && sprite.width > 0)
            ? new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2)
            : new Phaser.Geom.Circle(0, 0, size / 2);
        if (sprite.setInteractive) {
            sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        }
        sprite.on('pointerdown', () => {
            this.handleTargetClick(container);
        });

        // Enable Arcade Physics for movement
        this.physics.add.existing(container);
        container.body.setSize(size, size);
        container.body.setOffset(-size / 2, -size / 2);
        container.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            container.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            container.body.setBounce(1, 1);
        }

        container.setData('isTarget', true);
        this.spawnedObjects.push(container);
    }

    spawnVisualNoise() {
        const width = this.scale.width;
        const height = this.scale.height;
        const noiseCount = this.difficultyLevel === 5 ? 15 : 8;

        for (let i = 0; i < noiseCount; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            
            const rect = this.add.rectangle(x, y, Phaser.Math.Between(10, 100), Phaser.Math.Between(2, 5), 0xffffff, 0.15);
            rect.setAngle(Phaser.Math.Between(0, 360));
            
            this.tweens.add({
                targets: rect,
                alpha: 0,
                x: x + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(300, 800),
                onComplete: () => rect.destroy()
            });
        }
    }

    spawnDistractorObject() {
        const width = this.scale.width;
        const height = this.scale.height;

        const x = Phaser.Math.Between(60, width - 60);
        const y = Phaser.Math.Between(130, height - 60);

        let dShape = '';
        let dColor = '';

        // Apply visual similarity matrices (low | medium | high search interference)
        if (this.visualSimilarity === 'low') {
            // Distractors have completely different shapes AND colors
            dShape = Phaser.Utils.Array.GetRandom(this.shapesList.filter(s => s !== this.targetShape));
            dColor = Phaser.Utils.Array.GetRandom(this.colorsList.filter(c => c !== this.targetColor));
        } else if (this.visualSimilarity === 'medium') {
            // Distractors share either target shape OR target color, but not both
            if (Math.random() < 0.5) {
                dShape = this.targetShape;
                dColor = Phaser.Utils.Array.GetRandom(this.colorsList.filter(c => c !== this.targetColor));
            } else {
                dShape = Phaser.Utils.Array.GetRandom(this.shapesList.filter(s => s !== this.targetShape));
                dColor = this.targetColor;
            }
        } else {
            // High similarity: distractors share shapes, colors, or extremely close hues
            if (Math.random() < 0.6) {
                // Same shape, close color tint (Coral looks like yellow/orange)
                dShape = this.targetShape;
                const closeColors = {
                    'teal': ['green', 'purple'],
                    'purple': ['teal', 'coral'],
                    'yellow': ['coral', 'green'],
                    'coral': ['yellow', 'purple'],
                    'green': ['teal', 'yellow']
                };
                dColor = Phaser.Utils.Array.GetRandom(closeColors[this.targetColor] || this.colorsList);
            } else {
                // Similar complex shapes (hexagon vs circle), same color
                const complexShapes = {
                    'star': ['hexagon', 'triangle'],
                    'circle': ['hexagon', 'square'],
                    'hexagon': ['circle', 'star'],
                    'square': ['hexagon', 'circle'],
                    'triangle': ['star', 'hexagon']
                };
                dShape = Phaser.Utils.Array.GetRandom(complexShapes[this.targetShape] || this.shapesList);
                dColor = this.targetColor;
            }
        }

        const container = this.add.container(x, y);
        const size = 52;

        // Use pre-cached GPU texture sprite
        const texKey = `ff_${dShape}_${dColor}`;
        let sprite;
        if (this.textures.exists(texKey)) {
            sprite = this.add.image(0, 0, texKey);
            sprite.setScale(size / 64);
        } else {
            sprite = this.add.graphics();
            this.drawShapeGraphic(sprite, dShape, this.colorsMap[dColor], size);
        }
        container.add(sprite);

        // Setup interaction - center the hit area correctly for sprite texture bounds
        const hitArea = (sprite.width && sprite.width > 0)
            ? new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2)
            : new Phaser.Geom.Circle(0, 0, size / 2);
        if (sprite.setInteractive) {
            sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        }
        sprite.on('pointerdown', () => {
            this.handleDistractorClick(container);
        });

        // Enable Arcade Physics
        this.physics.add.existing(container);
        container.body.setSize(size, size);
        container.body.setOffset(-size / 2, -size / 2);
        container.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            container.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            container.body.setBounce(1, 1);
        }

        container.setData('isTarget', false);
        this.spawnedObjects.push(container);
    }

    handleTargetClick(container) {
        if (this.isTutorialActive) return;
        this.totalClicks++;

        if (this.showParticleBurst) {
            const px = this.input.activePointer.x || this.scale.width / 2;
            const py = this.input.activePointer.y || this.scale.height / 2;
            this.showParticleBurst(px, py, 0xa855f7);
        }
        this.hits++;

        const searchTime = this.getTime() - this.targetSpawnTime;
        const waveScore = Math.max(100, Math.round(1500 - searchTime / 2));
        this.score += waveScore;

        this.showFloatingText(container.x, container.y, `+${waveScore} FOUND!`, '#22c55e');
        this.cameras.main.flash(100, 34, 197, 94, 0.15); // gentle green screen pop

        this.updateHUD();

        // Dispatch telemetry
        this.dispatchMetricTelemetry(searchTime, 1.0);

        // Periodically scale difficulty every 5 targets
        if (this.hits % 5 === 0) {
            this.adaptDifficulty();
        } else {
            this.generateWave();
        }
    }

    handleDistractorClick(container) {
        if (this.isTutorialActive) return;
        this.totalClicks++;
        this.misses++;

        const searchTime = this.getTime() - this.targetSpawnTime;
        this.score = Math.max(0, this.score - 50); // score penalty

        this.showFloatingText(container.x, container.y, 'FALSE ALARM!', '#ef4444');
        this.cameras.main.shake(100, 0.005); // shake on mistake

        this.updateHUD();

        // Dispatch telemetry with 0 accuracy for distractor selection
        this.dispatchMetricTelemetry(searchTime, 0.0);

        // Fade distractor out
        this.tweens.add({
            targets: container,
            alpha: 0,
            scale: 0.2,
            duration: 200,
            onComplete: () => {
                this.spawnedObjects = this.spawnedObjects.filter(obj => obj !== container);
                container.destroy();
            }
        });
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
        const txt = this.add.text(x, y - 20, text, {
            fontFamily: CogniTheme.fonts.body,
            fontSize: '16px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => txt.destroy()
        });
    }

    // ==========================================
    // GEOMETRIC SHAPES VECTOR DRAWING SERVICES
    // ==========================================

    drawShapeGraphic(graphic, shapeType, colorHex, size) {
        graphic.clear();
        graphic.fillStyle(colorHex, 0.45);
        graphic.lineStyle(2.5, colorHex, 0.95);

        const r = size / 2;

        if (shapeType === 'circle') {
            graphic.fillCircle(0, 0, r);
            graphic.strokeCircle(0, 0, r);
            // inner ring decoration
            graphic.lineStyle(1.5, 0xffffff, 0.5);
            graphic.strokeCircle(0, 0, r * 0.55);
        } 
        else if (shapeType === 'square') {
            graphic.fillRoundedRect(-r, -r, size, size, 8);
            graphic.strokeRoundedRect(-r, -r, size, size, 8);
            
            graphic.lineStyle(1.5, 0xffffff, 0.5);
            graphic.strokeRoundedRect(-r * 0.6, -r * 0.6, size * 0.6, size * 0.6, 4);
        } 
        else if (shapeType === 'triangle') {
            // Draw equilateral triangle
            graphic.beginPath();
            graphic.moveTo(0, -r);
            graphic.lineTo(r * 1.1, r);
            graphic.lineTo(-r * 1.1, r);
            graphic.closePath();
            graphic.fillPath();
            graphic.strokePath();

            graphic.lineStyle(1.5, 0xffffff, 0.5);
            graphic.beginPath();
            graphic.moveTo(0, -r * 0.5);
            graphic.lineTo(r * 0.55, r * 0.5);
            graphic.lineTo(-r * 0.55, r * 0.5);
            graphic.closePath();
            graphic.strokePath();
        } 
        else if (shapeType === 'star') {
            // 5-pointed star
            const points = [];
            const spikes = 5;
            const outerRadius = r;
            const innerRadius = r * 0.4;
            
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;

            for (let i = 0; i < spikes; i++) {
                points.push(new Phaser.Math.Vector2(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius));
                rot += step;
                points.push(new Phaser.Math.Vector2(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius));
                rot += step;
            }

            graphic.beginPath();
            graphic.moveTo(points[0].x, points[0].y);
            for (let k = 1; k < points.length; k++) {
                graphic.lineTo(points[k].x, points[k].y);
            }
            graphic.closePath();
            graphic.fillPath();
            graphic.strokePath();

            // inner star dot
            graphic.lineStyle(1.5, 0xffffff, 0.6);
            graphic.strokeCircle(0, 0, 4);
        } 
        else if (shapeType === 'hexagon') {
            // 6-sided hexagon
            graphic.beginPath();
            for (let side = 0; side < 6; side++) {
                const angle = (Math.PI / 3) * side;
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (side === 0) graphic.moveTo(px, py);
                else graphic.lineTo(px, py);
            }
            graphic.closePath();
            graphic.fillPath();
            graphic.strokePath();

            graphic.lineStyle(1.5, 0xffffff, 0.5);
            graphic.beginPath();
            for (let side = 0; side < 6; side++) {
                const angle = (Math.PI / 3) * side;
                const px = Math.cos(angle) * r * 0.6;
                const py = Math.sin(angle) * r * 0.6;
                if (side === 0) graphic.moveTo(px, py);
                else graphic.lineTo(px, py);
            }
            graphic.closePath();
            graphic.strokePath();
        }
    }

    // ==========================================
    // CLOSED-LOOP DDA & TELEMETRY BRIDGE
    // ==========================================

    dispatchMetricTelemetry(searchTimeMs, clickAccuracy) {
        if (!this.sessionId) return;

        const payload = {
            session_id: this.sessionId,
            cognitive_domain: "reflexes_and_focus",
            game_type: "focus_finder",
            reaction_time: searchTimeMs,
            accuracy_rate: clickAccuracy,
            difficulty: this.difficultyLevel,
            error_count: clickAccuracy === 1.0 ? 0 : 1,
            hesitation_ms: this.firstInteractionLatency || 0,
            spam_click_count: this.spamClickCount
        };

        if (!this.telemetryBuffer) {
            this.telemetryBuffer = [];
        }
        this.telemetryBuffer.push(payload);
    }

    async flushTelemetry() {
        if (!this.sessionId || !this.telemetryBuffer || this.telemetryBuffer.length === 0) return;
        const payloadBatch = { metrics: this.telemetryBuffer };
        this.telemetryBuffer = [];
        
        try {
            console.log('[Telemetry Dispatch] Sending batched metrics...', payloadBatch);
            await fetch(`${this.apiUrl}/api/submit-metrics/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useCogniStore.getState().token}`},
                body: JSON.stringify(payloadBatch)
            });
        } catch (e) {
            console.warn('[Telemetry Dispatch] Connection offline, telemetry buffered.', e);
        }
    }

    async adaptDifficulty() {
        if (!this.sessionId) return;

        // Flush telemetry in batch before querying DDA updates
        await this.flushTelemetry();

        try {
            console.log('[DDA Bridge] Checking focus scaling profiles...');
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
                    const difficultyChanged = this.difficultyLevel !== params.difficulty_level;

                    this.difficultyLevel = params.difficulty_level;
                    this.distractorCount = params.distractors;
                    this.movementSpeed = params.speed;
                    this.visualSimilarity = params.similarity;

                    this.difficultyText.setText(`DIFFICULTY: LEVEL ${this.difficultyLevel}`);
                    if (data.cognitive_profile) {
                        this.archetype = data.cognitive_profile.archetype || this.archetype;
                        this.archetypeConfidence = data.cognitive_profile.confidence_score || this.archetypeConfidence;
                    }
                    updateMlHud(this);

                    if (difficultyChanged) {
                        const direction = params.difficulty_level > this.difficultyLevel ? 'INCREASED' : 'ADJUSTED';
                        this.showFloatingText(this.scale.width / 2, this.scale.height / 2, `DIFFICULTY ${direction}! LEVEL ${this.difficultyLevel}`, '#a855f7');
                        
                        if (this.difficultyLevel >= 4) {
                            cogniFX.startNoise(this.difficultyLevel);
                        } else {
                            cogniFX.stopNoise();
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[DDA Bridge] Connection failed, using current configurations.', e);
        }

        // Generate next wave
        this.generateWave();
    }

    async endGame() {
        if (this.countdownTimer) this.countdownTimer.remove();
        cogniFX.stopNoise();

        // Flush remaining telemetry before closing session
        await this.flushTelemetry();

        this.spawnedObjects.forEach(obj => obj.destroy());
        this.spawnedObjects = [];
        if (this.targetGraphicPreview) this.targetGraphicPreview.destroy();

        console.log('[Focus Finder Game Over] Telemetry summary:', {
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
