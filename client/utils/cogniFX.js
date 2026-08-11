/**
 * ================================================================================
 * CogniFX - Web Audio API Synthesizer Engine
 * Provides DDA-driven audio feedback for all CogniCore Phaser games.
 * 
 * Design: Singleton pattern with lazy AudioContext initialization.
 * Respects browser autoplay policy by initializing AudioContext only on 
 * first user gesture (first game hit/miss event).
 * 
 * Features:
 * - playHitTone(level, streak): ascending pentatonic pitch scaled by DDA level + hit streak
 * - playMissTone(level): low descending buzz scaled by difficulty
 * - playDDAShift(direction): ascending/descending chord stab on difficulty change
 * ================================================================================
 */

class CogniFXEngine {
    constructor() {
        this._ctx = null;
        this._masterGain = null;
        this._enabled = true;
        this._masterVolume = 0.18;
        this._distractorsEnabled = true;
        this._noiseOsc = null;
        this._noiseGain = null;
        this._noiseLfo = null;

        // Pentatonic scale frequencies (A minor pentatonic — A, C, D, E, G across 3 octaves)
        // Indexed [difficulty 1-5][streak modifier 0-4]
        this._hitFreqs = [
            // Level 1 — calm, low
            [220.0, 246.9, 261.6, 293.7, 329.6],
            // Level 2
            [293.7, 329.6, 349.2, 392.0, 440.0],
            // Level 3 — mid-range energy
            [392.0, 440.0, 493.9, 523.3, 587.3],
            // Level 4
            [523.3, 587.3, 659.3, 698.5, 783.9],
            // Level 5 — high tension
            [659.3, 698.5, 783.9, 880.0, 987.8],
        ];

        // Miss buzz base frequencies (descending, darker)
        this._missFreqs = [120, 100, 90, 80, 70]; // levels 1-5

        // DDA chord pairs [low, high] for shift stabs
        this._ddaChord = {
            up: [523.3, 659.3, 783.9],
            down: [329.6, 261.6, 220.0],
        };
    }

    /**
     * Lazily initializes the Web Audio API context.
     * Must be called inside a user gesture handler.
     */
    _initCtx() {
        if (this._ctx) return;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._masterGain = this._ctx.createGain();
            this._masterGain.gain.setValueAtTime(this._enabled ? this._masterVolume : 0.0, this._ctx.currentTime);
            this._masterGain.connect(this._ctx.destination);
        } catch (e) {
            console.warn('[CogniFX] Web Audio API unavailable:', e);
            this._enabled = false;
        }
    }

    /**
     * Creates a short synthesized pluck/tone note.
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - OscillatorType ('sine'|'square'|'sawtooth'|'triangle')
     * @param {number} peakGain - Peak amplitude (0.0–1.0)
     */
    _playNote(frequency, duration, type = 'triangle', peakGain = 0.4) {
        if (!this._enabled || !this._ctx) return;
        const now = this._ctx.currentTime;

        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        // Fast attack, medium decay to zero (pluck envelope)
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this._masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);

        // Auto-cleanup
        osc.onended = () => {
            try { osc.disconnect(); gain.disconnect(); } catch (_) {}
        };
    }

    /**
     * Play a hit feedback tone.
     * @param {number} difficultyLevel - DDA difficulty level 1–5
     * @param {number} hitStreak - Current consecutive hit count (clamped to 0–4 for pitch variance)
     */
    playHitTone(difficultyLevel = 1, hitStreak = 0) {
        this._initCtx();
        if (!this._enabled) return;

        const levelIdx = Math.max(0, Math.min(4, difficultyLevel - 1));
        const streakIdx = Math.min(4, Math.floor(hitStreak / 3)); // every 3 hits, pitch rises
        const freq = this._hitFreqs[levelIdx][streakIdx];

        // Duration shortens as difficulty/streak increases (urgency feel)
        const duration = Math.max(0.07, 0.18 - levelIdx * 0.02 - streakIdx * 0.01);

        this._playNote(freq, duration, 'triangle', 0.35);

        // Harmonic overtone for higher streaks (shimmer effect)
        if (hitStreak >= 5) {
            this._playNote(freq * 2.0, duration * 0.7, 'sine', 0.12);
        }
    }

    /**
     * Play a miss feedback tone.
     * @param {number} difficultyLevel - DDA difficulty level 1–5
     */
    playMissTone(difficultyLevel = 1) {
        this._initCtx();
        if (!this._enabled) return;

        const levelIdx = Math.max(0, Math.min(4, difficultyLevel - 1));
        const baseFreq = this._missFreqs[levelIdx];

        const now = this._ctx.currentTime;

        // Descending buzz: freq sweeps down over 0.2s
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq * 1.3, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this._masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
        osc.onended = () => {
            try { osc.disconnect(); gain.disconnect(); } catch (_) {}
        };
    }

    /**
     * Play a DDA difficulty shift stab chord.
     * @param {'up'|'down'} direction - Direction of difficulty shift
     */
    playDDAShift(direction = 'up') {
        this._initCtx();
        if (!this._enabled) return;

        const freqs = this._ddaChord[direction] || this._ddaChord.up;
        const delays = [0, 0.04, 0.08];

        freqs.forEach((freq, i) => {
            const now = this._ctx.currentTime + delays[i];
            const osc = this._ctx.createOscillator();
            const gain = this._ctx.createGain();

            osc.type = direction === 'up' ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this._masterGain);

            osc.start(now);
            osc.stop(now + 0.35);
            osc.onended = () => {
                try { osc.disconnect(); gain.disconnect(); } catch (_) {}
            };
        });
    }

    /** Toggle audio on/off */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (this._masterGain) {
            this._masterGain.gain.setValueAtTime(enabled ? this._masterVolume : 0.0, this._ctx.currentTime);
        }
    }

    /** Set Master Volume */
    setMasterVolume(volume) {
        this._masterVolume = Math.max(0, Math.min(1, volume));
        if (this._masterGain && this._enabled) {
            this._masterGain.gain.setValueAtTime(this._masterVolume, this._ctx.currentTime);
        }
    }

    /** Toggle Distractors */
    setDistractorsEnabled(enabled) {
        this._distractorsEnabled = enabled;
        if (!enabled) this.stopNoise();
    }

    /** Start continuous background auditory distractor noise */
    startNoise(difficultyLevel = 1) {
        this._initCtx();
        if (!this._enabled || !this._distractorsEnabled || difficultyLevel < 4) {
            this.stopNoise();
            return;
        }

        if (this._noiseOsc) return; // already playing

        const now = this._ctx.currentTime;
        this._noiseOsc = this._ctx.createOscillator();
        this._noiseGain = this._ctx.createGain();

        // Low frequency square wave hum
        this._noiseOsc.type = 'square';
        this._noiseOsc.frequency.setValueAtTime(40 + (difficultyLevel * 10), now); 

        // Modulate frequency to create "cafeteria hum" / interference
        const lfo = this._ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(2 + difficultyLevel, now); 
        const lfoGain = this._ctx.createGain();
        lfoGain.gain.setValueAtTime(10 + difficultyLevel * 2, now); 
        
        lfo.connect(lfoGain);
        lfoGain.connect(this._noiseOsc.frequency);
        lfo.start(now);
        this._noiseLfo = lfo;

        const volume = difficultyLevel === 5 ? 0.08 : 0.04;
        this._noiseGain.gain.setValueAtTime(0.001, now);
        this._noiseGain.gain.linearRampToValueAtTime(volume, now + 1.0); // fade in

        this._noiseOsc.connect(this._noiseGain);
        this._noiseGain.connect(this._masterGain);

        this._noiseOsc.start(now);
    }

    /** Stop background noise */
    stopNoise() {
        if (this._noiseOsc && this._ctx) {
            const now = this._ctx.currentTime;
            this._noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.5); 
            this._noiseOsc.stop(now + 0.5);
            if (this._noiseLfo) this._noiseLfo.stop(now + 0.5);
            
            // Clean up
            const oscToClean = this._noiseOsc;
            const gainToClean = this._noiseGain;
            const lfoToClean = this._noiseLfo;
            setTimeout(() => {
                try {
                    if (oscToClean) oscToClean.disconnect();
                    if (gainToClean) gainToClean.disconnect();
                    if (lfoToClean) lfoToClean.disconnect();
                } catch(e) {}
            }, 600);

            this._noiseOsc = null;
            this._noiseGain = null;
            this._noiseLfo = null;
        }
    }
}

// Export as singleton
const cogniFX = new CogniFXEngine();
export default cogniFX;
