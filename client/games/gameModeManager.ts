// @ts-nocheck
import { API_BASE } from '../utils/apiClient.js';
import cogniFX from '../utils/cogniFX.js';
import useCogniStore from '../store/useCogniStore.ts';
import { saveTelemetry, getTelemetryQueue, deleteTelemetryItems } from '../utils/indexedDB.js';

declare global {
    interface Window {
        currentGameMode: string;
        reduceFlashes?: boolean;
        audioDda?: any;
    }
}

// Initialize global game mode tracking variable
window.currentGameMode = 'timed';

let lastUsedApiUrlBase: string = API_BASE;

function extractApiUrlBase(url) {
    if (typeof url === 'string' && url.includes('/api/')) {
        lastUsedApiUrlBase = url.substring(0, url.indexOf('/api/'));
    }
    return lastUsedApiUrlBase;
}

// Queue metrics to IndexedDB if offline or connection fails
async function queueOfflineTelemetry(url, options) {
    try {
        const body = JSON.parse(options.body);
        let metricsToQueue = [];
        if (url.includes('/batch')) {
            metricsToQueue = body.telemetry || body.metrics || [];
        } else {
            metricsToQueue = [body];
        }
        
        if (metricsToQueue.length === 0) return;
        
        for (const metric of metricsToQueue) {
            metric.is_offline_sync = true;
            await saveTelemetry(metric);
        }
        console.log(`[gameModeManager] Queued ${metricsToQueue.length} metrics to IndexedDB offline storage.`);
    } catch (e) {
        console.error('[gameModeManager] Failed to queue offline telemetry:', e);
    }
}

// Flush offline IndexedDB queue metrics to batch endpoint
async function flushOfflineTelemetry() {
    if (!navigator.onLine) return;
    const existing = await getTelemetryQueue();
    if (existing.length === 0) return;
    
    const base = lastUsedApiUrlBase;
    console.log(`[gameModeManager] Connection restored. Flushing ${existing.length} offline metrics...`);
    
    // Extract keys and strip _id before sending to server
    const keys = existing.map(item => item._id);
    const payloads = existing.map(item => {
        const { _id, ...rest } = item;
        return rest;
    });
    
    const token = useCogniStore.getState().token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await originalFetch(`${base}/api/submit-metrics/batch`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ telemetry: payloads })
        });
        
        if (response.ok) {
            await deleteTelemetryItems(keys);
            console.log('[gameModeManager] Offline telemetry successfully synced to server.');
            window.dispatchEvent(new CustomEvent('telemetry-sync-success'));
        } else {
            console.warn('[gameModeManager] Failed to sync offline telemetry to server, keeping in IndexedDB.');
        }
    } catch (err) {
        console.warn('[gameModeManager] Connection failed during offline sync, will retry later.');
    }
}

// Periodically flush offline telemetry
setInterval(flushOfflineTelemetry, 5000);
window.addEventListener('online', flushOfflineTelemetry);

// Global Fetch Interceptor
const originalFetch = window.fetch;
window.fetch = async function (url, options) {
    if (typeof url !== 'string') {
        return originalFetch.apply(this, arguments);
    }
    
    // Track base API URL dynamically
    extractApiUrlBase(url);

    // Flush offline buffer on session start, evaluate, or compliance logging to guarantee completion writes
    if (url.includes('/api/start-session') || url.includes('/api/evaluate') || url.includes('/api/iso-evaluations')) {
        await flushOfflineTelemetry();
    }

    // 1. Intercept Session Startup
    if (url.includes('/api/start-session') && options && options.method === 'POST') {
        try {
            const body = JSON.parse(options.body);
            body.game_mode = window.currentGameMode || 'timed';
            options.body = JSON.stringify(body);
            console.log('[gameModeManager] Injected game_mode into start-session:', body.game_mode);
        } catch (e) {
            console.error('[gameModeManager] Error parsing start-session body:', e);
        }
    }

    // 2. Intercept Individual Telemetry Metrics (Buffer & Batch)
    if (url.includes('/api/submit-metrics') && !url.includes('/batch') && options && options.method === 'POST') {
        try {
            const metric = JSON.parse(options.body);
            await saveTelemetry(metric);
            console.log('[gameModeManager] Metric saved to IndexedDB pipeline directly.');
            
            // Return immediate mock success to Phaser scene
            return new Response(JSON.stringify({ status: "success", message: "Metric buffered locally" }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.error('[gameModeManager] Error buffering metric:', e);
        }
    }

    // 3. Intercept Batch Telemetry Metrics (Inject Offline Caching)
    if (url.includes('/api/submit-metrics/batch') && options && options.method === 'POST') {
        try {
            if (!navigator.onLine) {
                queueOfflineTelemetry(url, options);
                return new Response(JSON.stringify({ status: "success", message: "Metrics cached offline" }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            const response = await originalFetch.apply(this, arguments);
            if (!response.ok) {
                queueOfflineTelemetry(url, options);
                return new Response(JSON.stringify({ status: "success", message: "Metrics cached offline due to server error" }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            try {
                const data = await response.clone().json();
                if (data && data.rewards && data.rewards.newly_unlocked && data.rewards.newly_unlocked.length > 0) {
                    const event = new CustomEvent('achievements-unlocked', { detail: data.rewards.newly_unlocked });
                    window.dispatchEvent(event);
                }
            } catch (e) {
                console.error('[gameModeManager] Error parsing direct batch rewards:', e);
            }
            
            return response;
        } catch (err) {
            queueOfflineTelemetry(url, options);
            return new Response(JSON.stringify({ status: "success", message: "Metrics cached offline due to fetch error" }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // 4. Intercept DDA Adaptation requests (Flush buffer first, handle offline fallbacks)
    if (url.includes('/api/dda') && options && options.method === 'POST') {
        // Flush offline telemetry first so the server has the latest trials for difficulty adjustment
        await flushOfflineTelemetry();
        
        try {
            if (!navigator.onLine) {
                console.log('[gameModeManager] Offline DDA fallback triggered.');
                return new Response(JSON.stringify({ status: "success", message: "DDA offline fallback", dda_parameters: null }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            const response = await originalFetch.apply(this, arguments);
            if (!response.ok) {
                console.log('[gameModeManager] Server error DDA fallback triggered.');
                return new Response(JSON.stringify({ status: "success", message: "DDA server error fallback", dda_parameters: null }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return response;
        } catch (err) {
            console.log('[gameModeManager] Fetch error DDA fallback triggered.', err);
            return new Response(JSON.stringify({ status: "success", message: "DDA connection error fallback", dda_parameters: null }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    return originalFetch.apply(this, arguments);
};

// Global Phaser.Game class wrap to intercept and decorate scene classes
let localPhaser = null;

export function applyPhaserOverrides(PhaserInstance) {
    if (localPhaser) return;
    localPhaser = PhaserInstance;

    const OriginalGame = localPhaser.Game;
    localPhaser.Game = class extends OriginalGame {
        constructor(config) {
        if (config) {
            // Apply High-Performance configuration overrides
            
            // 1. Optimize WebGL/Canvas rendering pipeline
            config.render = {
                powerPreference: 'high-performance', // Request high performance GPU context
                roundPixels: true,                   // Force pixel rounding to prevent costly sub-pixel anti-aliasing interpolation
                antialias: false,                    // Disable antialias for raw canvas speed
                batchSize: 4096,                     // Increase batch size for draw calls
                ...(config.render || {})
            };

            // 2. Lock to stable target framerate
            config.fps = {
                target: 60,                          // Frame-rate target
                forceSetTimeOut: false,              // Use requestAnimationFrame where possible
                ...(config.fps || {})
            };

            // 3. Disable internal Phaser Audio to save CPU/Memory (React handles synth audio directly)
            config.audio = {
                noAudio: true,
                ...(config.audio || {})
            };

            // 4. Input pipeline optimizations
            config.input = {
                activePointers: 1,                   // Limit pointer tracking to a single finger/mouse cursor
                disableContextMenu: true,             // Prevent context menu overhead
                ...(config.input || {})
            };

            // 5. Intercept and decorate the game scenes
            if (config.scene) {
                const scenes = Array.isArray(config.scene) ? config.scene : [config.scene];
                scenes.forEach(sceneClass => {
                    decorateSceneClass(sceneClass);
                });
            }
        }
        super(config);
    }
    };
}

function decorateSceneClass(SceneClass) {
    // Avoid double decoration
    if (SceneClass.prototype._isDecorated) return;
    SceneClass.prototype._isDecorated = true;

    console.log('[gameModeManager] Decorating Phaser Scene class:', SceneClass.name);

    // 1. Wrap Scene init()
    const originalInit = SceneClass.prototype.init;
    SceneClass.prototype.init = function (data) {
        // Read game mode from global window or boot config
        this.gameMode = window.currentGameMode || (data && data.gameMode) || 'timed';
        console.log(`[gameModeManager] Scene initializing with mode: ${this.gameMode}`);

        // Set up variables depending on the gameMode
        if (this.gameMode === 'zen') {
            this.gameDuration = Infinity;
            this.timeLeft = Infinity;
            this.elapsedTime = 0;
        } else if (this.gameMode === 'survival') {
            this.lives = 3;
        } else if (this.gameMode === 'target') {
            this.gameDuration = Infinity;
            this.timeLeft = Infinity;
            this.elapsedTime = 0;
            this.targetGoal = 10;
            this.trialsCompleted = 0;
        } else if (this.gameMode === 'time_attack') {
            this.gameDuration = Infinity;
            this.timeLeft = Infinity;
            this.elapsedTime = 0;
            this.correctHitGoal = 10;
            this.correctHitsCount = 0;
        } else if (this.gameMode === 'endurance') {
            this.gameDuration = 20000; // Start with 20 seconds
            this.timeLeft = this.gameDuration;
        }

        // Call the original init()
        if (originalInit) {
            originalInit.call(this, data);
        }

        // Re-enforce these configurations in case originalInit overwrote them
        if (this.gameMode === 'zen' || this.gameMode === 'target' || this.gameMode === 'time_attack') {
            this.gameDuration = Infinity;
            this.timeLeft = Infinity;
        } else if (this.gameMode === 'endurance') {
            this.gameDuration = 20000;
            this.timeLeft = 20000;
        }

        // Intercept onGameOver callback to pass custom stats back to React UI
        if (this.onGameOver) {
            const originalOnGameOver = this.onGameOver;
            this.onGameOver = (stats) => {
                stats.gameMode = this.gameMode;
                if (this.elapsedTime !== undefined) {
                    stats.elapsedTimeMs = this.elapsedTime;
                    stats.elapsedTimeSec = Math.round(this.elapsedTime / 1000);
                }
                stats.remainingLives = this.lives !== undefined ? this.lives : null;
                stats.trialsCompleted = this.trialsCompleted !== undefined ? this.trialsCompleted : null;
                stats.correctHitsCount = this.correctHitsCount !== undefined ? this.correctHitsCount : null;
                
                originalOnGameOver.call(this, stats);
            };
        }
    };



    // Helper function to create floating texts for time alterations (+2s / -5s)
    const showFloatingTimeText = (scene, text, color) => {
        const x = scene.scale.width / 2;
        const y = scene.scale.height / 2 - 100;
        const txt = scene.add.text(x, y, text, {
            fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
            fontSize: '32px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        // Simple elegant fade-up float animation
        scene.tweens.add({
            targets: txt,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    };

    // Cognitive domain → particle tint color mapping
    const DOMAIN_PARTICLE_COLOR = {
        'reflexes_and_focus':  0xa855f7, // vivid purple
        'spatial_visual_memory': 0x38bdf8, // cyan
        'logical_mathematical': 0x10b981, // emerald
        'executive_strategy':  0xf59e0b, // amber
    };

    // Helper: resolve scene's domain tint (falls back to cyan)
    function getSceneTint(scene) {
        const domainMap = {
            SpeedTapScene: 'reflexes_and_focus',
            FocusFinderScene: 'reflexes_and_focus',
            StroopShiftScene: 'reflexes_and_focus',
            MemoryMatchScene: 'spatial_visual_memory',
            MatrixRecallScene: 'spatial_visual_memory',
            NeuralNBackScene: 'spatial_visual_memory',
            NexusMapperScene: 'spatial_visual_memory',
            SynapseSpinScene: 'spatial_visual_memory',
            LogicLinkScene: 'logical_mathematical',
            EquationBalanceScene: 'logical_mathematical',
            SequenceDecoderScene: 'logical_mathematical',
            RouteOptimizerScene: 'logical_mathematical',
            MazeEscapeScene: 'executive_strategy',
            NeuroMazeScene: 'executive_strategy',
            MentalFlexScene: 'executive_strategy',
            PriorityQueueScene: 'executive_strategy',
        };
        const domain = domainMap[scene.constructor.name] || 'reflexes_and_focus';
        return DOMAIN_PARTICLE_COLOR[domain] || 0x38bdf8;
    }

    // 2. Wrap Scene create() to render custom glassmorphic HUD components + bootstrap particles
    const originalCreate = SceneClass.prototype.create;
    SceneClass.prototype.create = function () {
        if (originalCreate) {
            originalCreate.call(this);
        }
        
        if (typeof this.setupPauseHandling === 'function') {
            this.setupPauseHandling();
        }

        // --- SCREEN JUICE: DDA Vignette ---
        const { width, height } = this.scale;
        this.ddaVignette = this.add.rectangle(width/2, height/2, width, height, 0xff0000, 0);
        this.ddaVignette.setDepth(9998); // just under UI
        this.ddaVignette.setBlendMode(localPhaser.BlendModes.MULTIPLY);

        // --- Particle Emitter Bootstrap ---
        // Use Phaser 3.60+ particle API (particles manager with emitter config)
        try {
            const tint = getSceneTint(this);

            // Build a small radial dot texture for particles
            const gfx = this.add.graphics();
            gfx.fillStyle(0xffffff, 1);
            gfx.fillCircle(4, 4, 4);
            gfx.generateTexture('_cogni_particle_dot', 8, 8);
            gfx.destroy();

            this._cogniParticles = this.add.particles(0, 0, '_cogni_particle_dot', {
                speed: { min: 80, max: 220 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.95, end: 0 },
                lifespan: { min: 350, max: 550 },
                tint: tint,
                quantity: 0,          // emit on demand only
                emitting: false,
                blendMode: 'ADD',
                gravityY: 60,
            });
            this._cogniParticles.setDepth(100);
            this._cogniParticleTint = tint;
        } catch (e) {
            // Phaser version or WebGL not available — silently skip particles
            this._cogniParticles = null;
        }

        // Track last pointer down position for particle origin
        this._lastPointerX = this.scale.width / 2;
        this._lastPointerY = this.scale.height / 2;
        this.input.on('pointerdown', (ptr) => {
            this._lastPointerX = ptr.x;
            this._lastPointerY = ptr.y;
        });

        // Draw custom HUD overlay
        if (this.gameMode === 'survival') {
            this.livesText = this.add.text(20, 110, `LIVES: ${this.lives}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#ef4444' // Crimson Neon
            });
        } else if (this.gameMode === 'target') {
            this.targetGoalText = this.add.text(20, 110, `TRIALS: 0 / ${this.targetGoal}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#e2e8f0' // Premium Slate
            });
        } else if (this.gameMode === 'time_attack') {
            this.targetGoalText = this.add.text(20, 110, `TARGETS: 0 / ${this.correctHitGoal}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#10b981' // Neon Emerald
            });
        } else if (this.gameMode === 'zen') {
            this.zenModeText = this.add.text(20, 110, `ZEN TRAINING MODE`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontWeight: 'bold',
                fill: '#38bdf8' // Cyber Punk Cyan
            });
        }
    };

    // 3. Wrap updateHUD() to detect correct hits or errors + trigger FX
    const originalUpdateHUD = SceneClass.prototype.updateHUD;
    SceneClass.prototype.updateHUD = function () {
        if (originalUpdateHUD) {
            originalUpdateHUD.call(this);
        }

        // Skip tracking check on the very first updateHUD call to avoid initial noise
        if (this._prevHits === undefined) {
            this._prevHits = this.hits || 0;
            this._prevMisses = this.misses || 0;
            this._prevAttempts = this.totalAttempts || this.totalClicks || this.totalTrials || 0;
            this._consecutiveHitStreak = 0;
            return;
        }

        const currentHits = this.hits || 0;
        const currentMisses = this.misses || 0;
        const currentAttempts = this.totalAttempts || this.totalClicks || this.totalTrials || 0;

        const deltaHits = currentHits - this._prevHits;
        const deltaMisses = currentMisses - this._prevMisses;
        const deltaAttempts = currentAttempts - this._prevAttempts;
        
        // --- SMART SCORE MULTIPLIERS ---
        const currentScore = this.score || 0;
        const deltaScore = currentScore - (this._prevScore || 0);
        if (deltaScore > 0 && this.archetype) {
             let multiplier = 1.0;
             let bonusText = '';
             
             if (this.archetype === 'Fast Learner') {
                 multiplier = 1.5;
                 bonusText = 'SPEED BONUS!';
             } else if (this.archetype === 'High Fatigue') {
                 multiplier = 1.2; 
                 bonusText = 'CONSISTENCY BONUS!';
             } else if (this.archetype === 'Precision Expert') {
                 multiplier = 1.3;
                 bonusText = 'PRECISION BONUS!';
             }
             
             if (multiplier > 1.0) {
                 const bonus = Math.floor(deltaScore * (multiplier - 1.0));
                 this.score += bonus;
                 if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score}`);
                 
                 if (originalShowFloatingText) {
                     originalShowFloatingText.call(this, this.scale.width / 2, this.scale.height / 2 + 100, `+${bonus} ${bonusText}`, '#f59e0b');
                 }
             }
        }
        this._prevScore = this.score || 0;

        const isHit = deltaHits > 0;
        const isMiss = deltaMisses > 0 || (deltaAttempts > 0 && deltaHits === 0);

        // Store new baselines
        this._prevHits = currentHits;
        this._prevMisses = currentMisses;
        this._prevAttempts = currentAttempts;

        // ── HIT FX ────────────────────────────────────────────────────────────
        if (isHit) {
            this._consecutiveHitStreak = (this._consecutiveHitStreak || 0) + 1;

            // 1. WebGL particle burst at last pointer position
            if (this._cogniParticles) {
                try {
                    const px = this._lastPointerX || this.scale.width / 2;
                    const py = this._lastPointerY || this.scale.height / 2;
                    // Scale burst quantity with streak (base 18, +3 per 5 streak)
                    const qty = Math.min(40, 18 + Math.floor(this._consecutiveHitStreak / 5) * 3);
                    this._cogniParticles.emitParticleAt(px, py, qty);
                } catch (_) {}
            }

            // 2. Audio hit tone — pitch scales with difficulty + streak
            try {
                cogniFX.playHitTone(
                    this.difficultyLevel || 1,
                    this._consecutiveHitStreak
                );
            } catch (_) {}

            // ── Game mode logic ────────────────────────────────────────────────
            if (this.gameMode === 'time_attack') {
                this.correctHitsCount = (this.correctHitsCount || 0) + 1;
                if (this.targetGoalText) {
                    this.targetGoalText.setText(`TARGETS: ${this.correctHitsCount} / ${this.correctHitGoal}`);
                }
                if (this.correctHitsCount >= this.correctHitGoal) {
                    this.endGame();
                }
            } else if (this.gameMode === 'endurance') {
                this.timeLeft += 2000;
                showFloatingTimeText(this, '+2s', '#22c55e');
            }

            if (this.gameMode === 'target') {
                this.trialsCompleted = (this.trialsCompleted || 0) + 1;
                if (this.targetGoalText) {
                    this.targetGoalText.setText(`TRIALS: ${this.trialsCompleted} / ${this.targetGoal}`);
                }
                if (this.trialsCompleted >= this.targetGoal) {
                    this.endGame();
                }
            }
        }

        // ── MISS FX ───────────────────────────────────────────────────────────
        if (isMiss) {
            this._consecutiveHitStreak = 0; // reset streak on miss

            // 1. Proportional screen-shake (intensity scales with difficulty)
            try {
                if (!window.reduceFlashes) {
                    const shakeIntensity = 0.004 + (this.difficultyLevel || 1) * 0.0012;
                    this.cameras.main.shake(90, Math.min(0.012, shakeIntensity));
                }
            } catch (_) {}

            // 2. Audio miss tone
            try {
                cogniFX.playMissTone(this.difficultyLevel || 1);
            } catch (_) {}

            // ── Game mode logic ────────────────────────────────────────────────
            if (this.gameMode === 'survival') {
                this.lives = (this.lives !== undefined ? this.lives : 3) - 1;
                if (this.livesText) {
                    this.livesText.setText(`LIVES: ${this.lives}`);
                }
                if (this.lives <= 0) {
                    showFloatingTimeText(this, 'NO LIVES LEFT!', '#ef4444');
                    this.endGame();
                }
            } else if (this.gameMode === 'endurance') {
                this.timeLeft = Math.max(0, this.timeLeft - 5000);
                showFloatingTimeText(this, '-5s', '#ef4444');
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }

            if (this.gameMode === 'target') {
                this.trialsCompleted = (this.trialsCompleted || 0) + 1;
                if (this.targetGoalText) {
                    this.targetGoalText.setText(`TRIALS: ${this.trialsCompleted} / ${this.targetGoal}`);
                }
                if (this.trialsCompleted >= this.targetGoal) {
                    this.endGame();
                }
            }
        }
    };

    // 3b. Patch showFloatingText to also trigger DDA shift audio when difficulty text changes
    const originalShowFloatingText = SceneClass.prototype.showFloatingText;
    if (originalShowFloatingText) {
        SceneClass.prototype.showFloatingText = function(x, y, textStr, color) {
            originalShowFloatingText.call(this, x, y, textStr, color);
            if (typeof textStr === 'string' && textStr.includes('DIFFICULTY')) {
                const isUp = textStr.includes('INCREASED') || textStr.includes('UP');
                try { cogniFX.playDDAShift(isUp ? 'up' : 'down'); } catch (_) {}
                
                // --- SCREEN JUICE & AUDIO BPM ---
                if (window.audioDda) {
                    window.audioDda.setDifficulty(this.difficultyLevel || 1);
                    window.audioDda.setFrustration(this.archetype === 'High Fatigue');
                }
                
                if (this.ddaVignette) {
                    let targetColor = 0xff0000;
                    let targetAlpha = 0;
                    
                    if (this.archetype === 'High Fatigue') {
                        targetColor = 0x3b82f6; // calming blue
                        targetAlpha = 0.2;
                    } else if (this.difficultyLevel >= 4) {
                        targetColor = 0xef4444; // intense red
                        targetAlpha = 0.3;
                    }
                    
                    if (targetAlpha > 0) {
                        this.ddaVignette.fillColor = targetColor;
                        if (!window.reduceFlashes) {
                            this.tweens.add({
                                targets: this.ddaVignette,
                                alpha: targetAlpha,
                                duration: 1000,
                                yoyo: true, // Pulse it
                                repeat: this.difficultyLevel >= 4 ? -1 : 1
                            });
                        } else {
                            // Static low alpha instead of flashing for seizure-safe mode
                            this.ddaVignette.alpha = targetAlpha * 0.5; 
                        }
                    }
                }
            }
        };
    }

    // 4. Overwrite standard 1-second countdown timers to count UP or count DOWN depending on mode
    const customTimerCallback = function () {
        if (this.gameMode === 'zen' || this.gameMode === 'target' || this.gameMode === 'time_attack') {
            // Count UP
            this.elapsedTime = (this.elapsedTime || 0) + 1000;
            const s = Math.floor(this.elapsedTime / 1000);
            const m = Math.floor(s / 60);
            const displaySec = s % 60;
            const displayMin = m;
            const timeStr = `${displayMin < 10 ? '0' : ''}${displayMin}:${displaySec < 10 ? '0' : ''}${displaySec}`;
            if (this.timerText) {
                this.timerText.setText(timeStr);
            }
            this.timeLeft = Infinity; // Enforce infinite time
        } else {
            // Count DOWN (timed, survival, endurance modes)
            this.timeLeft = (this.timeLeft || 0) - 1000;
            const s = Math.ceil(this.timeLeft / 1000);
            if (s <= 0) {
                this.endGame();
                return;
            }
            const m = Math.floor(s / 60);
            const displaySec = s % 60;
            const displayMin = m;
            const timeStr = `${displayMin < 10 ? '0' : ''}${displayMin}:${displaySec < 10 ? '0' : ''}${displaySec}`;
            if (this.timerText) {
                this.timerText.setText(timeStr);
            }
        }
    };

    // Wrap the three standard timing loop callback names
    if (SceneClass.prototype.updateTimer) SceneClass.prototype.updateTimer = customTimerCallback;
    if (SceneClass.prototype.updateOverallTimer) SceneClass.prototype.updateOverallTimer = customTimerCallback;
    if (SceneClass.prototype.updateCountdown) SceneClass.prototype.updateCountdown = customTimerCallback;
}
