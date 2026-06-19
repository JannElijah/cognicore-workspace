import Phaser from 'phaser';

// Initialize global game mode tracking variable
window.currentGameMode = 'timed';

// Global Fetch Interceptor to inject game_mode on session creation
const originalFetch = window.fetch;
window.fetch = async function (url, options) {
    if (typeof url === 'string' && url.includes('/api/start-session') && options && options.method === 'POST') {
        try {
            const body = JSON.parse(options.body);
            body.game_mode = window.currentGameMode || 'timed';
            options.body = JSON.stringify(body);
            console.log('[gameModeManager] Injected game_mode into start-session POST:', body.game_mode);
        } catch (e) {
            console.error('[gameModeManager] Error parsing fetch body in interceptor:', e);
        }
    }
    return originalFetch.apply(this, arguments);
};

// Global Phaser.Game class wrap to intercept and decorate scene classes
const OriginalGame = Phaser.Game;
Phaser.Game = class extends OriginalGame {
    constructor(config) {
        if (config && config.scene) {
            const scenes = Array.isArray(config.scene) ? config.scene : [config.scene];
            scenes.forEach(sceneClass => {
                decorateSceneClass(sceneClass);
            });
        }
        super(config);
    }
};

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

    // 2. Wrap Scene create() to render custom glassmorphic HUD components
    const originalCreate = SceneClass.prototype.create;
    SceneClass.prototype.create = function () {
        if (originalCreate) {
            originalCreate.call(this);
        }

        // Draw custom HUD overlay
        if (this.gameMode === 'survival') {
            this.livesText = this.add.text(20, 80, `LIVES: ${this.lives}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#ef4444' // Crimson Neon
            });
        } else if (this.gameMode === 'target') {
            this.targetGoalText = this.add.text(20, 80, `TRIALS: 0 / ${this.targetGoal}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#e2e8f0' // Premium Slate
            });
        } else if (this.gameMode === 'time_attack') {
            this.targetGoalText = this.add.text(20, 80, `TARGETS: 0 / ${this.correctHitGoal}`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '16px',
                fontWeight: 'bold',
                fill: '#10b981' // Neon Emerald
            });
        } else if (this.gameMode === 'zen') {
            this.zenModeText = this.add.text(20, 80, `ZEN TRAINING MODE`, {
                fontFamily: 'Outfit, system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontWeight: 'bold',
                fill: '#38bdf8' // Cyber Punk Cyan
            });
        }
    };

    // 3. Wrap updateHUD() to detect correct hits or errors
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
            return;
        }

        const currentHits = this.hits || 0;
        const currentMisses = this.misses || 0;
        const currentAttempts = this.totalAttempts || this.totalClicks || this.totalTrials || 0;

        const deltaHits = currentHits - this._prevHits;
        const deltaMisses = currentMisses - this._prevMisses;
        const deltaAttempts = currentAttempts - this._prevAttempts;

        const isHit = deltaHits > 0;
        const isMiss = deltaMisses > 0 || (deltaAttempts > 0 && deltaHits === 0);

        // Store new baselines
        this._prevHits = currentHits;
        this._prevMisses = currentMisses;
        this._prevAttempts = currentAttempts;

        if (isHit) {
            if (this.gameMode === 'time_attack') {
                this.correctHitsCount = (this.correctHitsCount || 0) + 1;
                if (this.targetGoalText) {
                    this.targetGoalText.setText(`TARGETS: ${this.correctHitsCount} / ${this.correctHitGoal}`);
                }
                if (this.correctHitsCount >= this.correctHitGoal) {
                    this.endGame();
                }
            } else if (this.gameMode === 'endurance') {
                // Correct inputs add +2 seconds
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

        if (isMiss) {
            if (this.gameMode === 'survival') {
                // Deduct a life
                this.lives = (this.lives !== undefined ? this.lives : 3) - 1;
                if (this.livesText) {
                    this.livesText.setText(`LIVES: ${this.lives}`);
                }
                if (this.lives <= 0) {
                    showFloatingTimeText(this, 'NO LIVES LEFT!', '#ef4444');
                    this.endGame();
                }
            } else if (this.gameMode === 'endurance') {
                // Incorrect inputs deduct -5 seconds
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
