import Phaser from 'phaser';
import { CogniTheme } from '../utils/theme';
import { applyPhaserOverrides } from './gameModeManager';

// Inject high-performance optimizations and DDA decorators when Phaser is actually loaded
applyPhaserOverrides(Phaser);

export default class BaseCognitiveScene extends Phaser.Scene {
    createStandardBackground() {
        const width = this.scale.width;
        const height = this.scale.height;
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            CogniTheme.colors.background[0], 
            CogniTheme.colors.background[0], 
            CogniTheme.colors.background[1], 
            CogniTheme.colors.background[1], 
            1
        );
        bg.fillRect(0, 0, width, height);
        
        // Premium tech grid overlay
        const grid = this.add.grid(width / 2, height / 2, width, height, 80, 80, 0x000000, 0, CogniTheme.colors.primary, 0.03);
        grid.setOrigin(0.5);
    }

    constructor(key) {
        super(key);
        this.pauseStartTime = 0;
    }

    setupPauseHandling() {
        this.events.on('pause', this.handlePause, this);
        this.events.on('resume', this.handleResume, this);
        this.events.once('shutdown', this.handleShutdown, this);
    }

    handleShutdown() {
        // Aggressive Garbage Collection to prevent memory leaks during rapid game switching
        if (this.textures) this.textures.removeAll();
        if (this.sound) this.sound.removeAll();
        if (this.cache) {
            this.cache.audio.clear();
            this.cache.video.clear();
        }
    }

    handlePause() {
        this.pauseStartTime = this.sys.game.loop.time;
    }

    handleResume() {
        if (this.pauseStartTime > 0) {
            const pauseDuration = this.sys.game.loop.time - this.pauseStartTime;
            this.shiftTimers(pauseDuration);
            this.pauseStartTime = 0;
        }
    }

    shiftTimers(duration) {
        if (this.stimulusSpawnTime) this.stimulusSpawnTime += duration;
        if (this.puzzleStartTime) this.puzzleStartTime += duration;
        if (this.roundStartTime) this.roundStartTime += duration;
        if (this.lastSwitchTime) this.lastSwitchTime += duration;
        if (this.lastMissTime) this.lastMissTime += duration;
    }

    showFloatingFeedback(text, color) {
        const width = this.scale.width;
        const txt = this.add.text(width / 2, 135, text, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontWeight: 'bold',
            fill: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: 110,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }

    registerFirstInteraction() {
        if (!this.firstInteractionRegistered && this.stimulusSpawnTime > 0) {
            this.firstInteractionLatency = this.time.now - this.stimulusSpawnTime;
            this.firstInteractionRegistered = true;
        }
    }

    showParticleBurst(x, y, colorHex) {
        // Create a simple circular particle texture on the fly if it doesn't exist
        if (!this.textures.exists('particle')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('particle', 8, 8);
        }

        const particles = this.add.particles(0, 0, 'particle', {
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            scale: { start: 0.8, end: 0 },
            blendMode: 'ADD',
            tint: colorHex,
            lifespan: 800,
            gravityY: 150,
            quantity: 12
        });

        // Automatically destroy the emitter after particles fade
        this.time.delayedCall(1000, () => {
            if (particles && particles.active) {
                particles.destroy();
            }
        });
    }
}
