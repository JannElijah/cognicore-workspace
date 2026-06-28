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
    this.oscillatorType = localStorage.getItem('cognicore_osc_type') || 'sine';
    this.bpmMultiplier = parseFloat(localStorage.getItem('cognicore_bpm_mult') || '1.0');
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
      console.log("[Audio Synth] Acoustic DDA Engine initialized successfully. Muted:", this.isMuted, "Osc:", this.oscillatorType, "BpmMult:", this.bpmMultiplier);
    } catch (e) {
      console.error("[Audio Synth] Failed to initialize AudioContext", e);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('cognicore_audio_muted', String(muted));
    console.log("[Audio Synth] Audio set to", muted ? "MUTED" : "UNMUTED");
  }

  setOscillatorType(type) {
    this.oscillatorType = type;
    localStorage.setItem('cognicore_osc_type', type);
    console.log("[Audio Synth] Oscillator type set to", type);
  }

  setBpmMultiplier(mult) {
    this.bpmMultiplier = parseFloat(mult) || 1.0;
    localStorage.setItem('cognicore_bpm_mult', String(this.bpmMultiplier));
    console.log("[Audio Synth] BPM multiplier set to", this.bpmMultiplier);
    if (this.resetTempo) {
      this.resetTempo();
    }
  }

  startAmbientPulse() {
    const playTick = () => {
      try {
        if (this.isMuted) return;
        if (!this.ctx || this.ctx.state === 'suspended') return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = this.oscillatorType;
        // Pitch scales slightly with difficulty
        const baseFreq = 110 + (this.currentDifficulty * 10); // low A-ish focus hum
        osc.frequency.setValueAtTime(baseFreq, t);
        
        // Scale down square/triangle waves to avoid loudness spikes
        const volScale = this.oscillatorType === 'square' ? 0.25 : this.oscillatorType === 'triangle' ? 0.7 : 1.0;
        const targetGain = (this.isCalmingMode ? 0.04 : 0.08) * volScale;
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(targetGain, t + 0.05);
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
      
      const baseBpm = 60 + (this.currentDifficulty - 1) * 15; // 60, 75, 90, 105, 120 BPM
      const bpm = baseBpm * this.bpmMultiplier;
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

      if (success) {
        // Modern "coin pickup" double-beep arpeggio
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        const gain2 = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // Note 1: E5 (659.25 Hz)
        osc1.frequency.setValueAtTime(659.25, t);
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

        // Note 2: G#5 (830.61 Hz) played slightly after
        osc2.frequency.setValueAtTime(830.61, t + 0.08);
        gain2.gain.setValueAtTime(0, t + 0.08);
        gain2.gain.linearRampToValueAtTime(0.08, t + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.ctx.destination);
        gain2.connect(this.ctx.destination);

        osc1.start(t);
        osc1.stop(t + 0.15);
        osc2.start(t + 0.08);
        osc2.stop(t + 0.3);

      } else {
        // Deep low-pass failure thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        
        // Fast pitch sweep down
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

        // Filter sweep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
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

// Bind to window for global access by gameModeManager
window.audioDda = audioDda;
