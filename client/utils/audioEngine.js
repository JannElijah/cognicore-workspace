class AudioEngine {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
  }

  playTone(freq, type, duration, vol) {
    try {
      if (!this.audioCtx) this.init();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch(e) {
      console.warn('AudioEngine error:', e);
    }
  }

  playHover() {
    this.playTone(600, 'sine', 0.1, 0.02);
  }

  playClick() {
    this.playTone(800, 'square', 0.05, 0.03);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.03), 50);
  }

  playSuccess() {
    // Chime: C5, E5, G5
    this.playTone(523.25, 'sine', 0.2, 0.05);
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.05), 100);
    setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.05), 200);
  }

  playLevelUp() {
    // Arpeggio up
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.3, 0.05), i * 120);
    });
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.3, 0.05);
    setTimeout(() => this.playTone(120, 'sawtooth', 0.4, 0.05), 150);
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;
