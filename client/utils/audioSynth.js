class AcousticDdaEngine {
  constructor() {
    this.ctx = null;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.filterNode = null;
    this.tempoInterval = null;
    this.isPlaying = false;
    this.currentDifficulty = 1;
    this.isCalmingMode = false;
    this.isMuted = localStorage.getItem('cognicore_audio_muted') === 'true';
  }

  init() {
    try {
      if (this.ctx) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("[Audio Synth] Web Audio API is not supported in this browser.");
        return;
      }
      
      this.ctx = new AudioContextClass();
      
      // Create filter node for calming low-pass effect
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime); // default focus cutoff
      this.filterNode.Q.setValueAtTime(1, this.ctx.currentTime);
      
      // Ambient sound gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // keep it soft in background
      
      // Route ambient loop through filter to destination
      this.filterNode.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      
      this.isPlaying = true;
      this.startAmbientPulse();
      console.log("[Audio Synth] Acoustic DDA Engine initialized successfully. Muted:", this.isMuted);
    } catch (e) {
      console.error("[Audio Synth] Failed to initialize AudioContext", e);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('cognicore_audio_muted', String(muted));
    console.log("[Audio Synth] Audio set to", muted ? "MUTED" : "UNMUTED");
  }

  startAmbientPulse() {
    const playTick = () => {
      try {
        if (this.isMuted) return;
        if (!this.ctx || this.ctx.state === 'suspended') return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // Pitch scales slightly with difficulty
        const baseFreq = 110 + (this.currentDifficulty * 10); // low A-ish focus hum
        osc.frequency.setValueAtTime(baseFreq, t);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(this.isCalmingMode ? 0.04 : 0.08, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        
        osc.connect(gain);
        gain.connect(this.filterNode);
        
        osc.start(t);
        osc.stop(t + 0.4);
      } catch (err) {
        console.warn("[Audio Synth] Error playing tick:", err);
      }
    };

    const resetInterval = () => {
      if (this.tempoInterval) clearInterval(this.tempoInterval);
      if (!this.isPlaying) return;
      
      const bpm = 60 + (this.currentDifficulty - 1) * 15; // 60, 75, 90, 105, 120 BPM
      const intervalMs = (60 / bpm) * 1000;
      
      this.tempoInterval = setInterval(() => {
        playTick();
      }, intervalMs);
    };

    resetInterval();
    this.resetTempo = resetInterval;
  }

  setDifficulty(level) {
    this.currentDifficulty = level;
    if (this.resetTempo) {
      this.resetTempo();
    }
  }

  setFrustration(isFrustrated) {
    try {
      if (!this.ctx || !this.filterNode) return;
      this.isCalmingMode = isFrustrated;
      const t = this.ctx.currentTime;
      
      if (isFrustrated) {
        // Calming lowpass sweep down to 220Hz
        this.filterNode.frequency.exponentialRampToValueAtTime(220, t + 0.8);
        this.playCalmingHum();
      } else {
        // Focus lowpass sweep back up to 1000Hz
        this.filterNode.frequency.exponentialRampToValueAtTime(1000, t + 1.2);
      }
    } catch (e) {
      console.warn("[Audio Synth] Error setting frustration:", e);
    }
  }

  playCalmingHum() {
    try {
      if (this.isMuted) return;
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165, t); // E3 soothing tone
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t);
      osc.stop(t + 1.6);
    } catch (e) {
      console.warn("[Audio Synth] Error playing calming hum:", e);
    }
  }

  playFeedback(success) {
    try {
      if (this.isMuted) return;
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (success) {
        // High C5 synth pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.2);
      } else {
        // Lower flat tone (F3) representing miss
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(174.61, t); // F3
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.45);
      }
    } catch (e) {
      console.warn("[Audio Synth] Error playing feedback:", e);
    }
  }

  stop() {
    try {
      this.isPlaying = false;
      if (this.tempoInterval) {
        clearInterval(this.tempoInterval);
      }
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      console.log("[Audio Synth] Acoustic DDA Engine stopped.");
    } catch (e) {
      console.warn("[Audio Synth] Error stopping engine:", e);
    }
  }
}

export const audioDda = new AcousticDdaEngine();
