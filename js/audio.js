// audio.js — lightweight WebAudio synth for SFX and background music
class AudioManager{
  constructor(){
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicOsc = null; this.musicGain = null;
  }

  _playTone(freq, duration=0.1, type='sine', gain=0.12){
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + duration);
  }

  playGunshot(){
    // short noise burst using oscillator frequency sweep + slight detune
    const detune = (Math.random()-0.5)*50;
    this._playTone(800 + detune, 0.06, 'square', 0.16 + Math.random()*0.04);
  }
  playReload(){ this._playTone(220, 0.25, 'sawtooth', 0.12); }
  playEnemyHit(){ this._playTone(440, 0.08, 'triangle', 0.08); }
  playEnemyDie(){ this._playTone(120, 0.25, 'sine', 0.12); }
  playPlayerHit(){ this._playTone(180, 0.12, 'sine', 0.12); }

  playExplosion(){
    // layered low tones for explosion feeling
    this._playTone(60, 0.18, 'sawtooth', 0.18);
    setTimeout(()=>{ this._playTone(40, 0.28, 'sine', 0.14); }, 30);
  }

  playMusic(){
    if(this.musicOsc) return;
    this.musicOsc = this.ctx.createOscillator();
    this.musicGain = this.ctx.createGain();
    this.musicOsc.type = 'sine';
    this.musicOsc.frequency.value = 110;
    this.musicOsc.connect(this.musicGain); this.musicGain.connect(this.ctx.destination);
    this.musicGain.gain.value = 0.03;
    this.musicOsc.start();
  }
}

export { AudioManager };
