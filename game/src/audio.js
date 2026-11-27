// GOBBLE DASH — every sound the game makes, synthesized live with WebAudio.
// No audio files: the game ships no network request and no sound asset.

export class SoundBoard {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  // The browser only lets audio start after a user gesture, so the first
  // click or keypress builds the context; every call before that is a no-op.
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
    } catch {
      this.context = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.context.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, lowpass) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime;
    const len = Math.max(1, Math.floor(this.context.sampleRate * dur));
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    let node = src;
    if (lowpass) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      src.connect(filter);
      node = filter;
    }
    node.connect(gain).connect(this.context.destination);
    src.start(t0);
  }

  // The turkey's own voice: two quick descending gobbles.
  gobble() {
    this.tone(320, 0.09, 'square', 0.12, 180);
    window.setTimeout(() => this.tone(280, 0.11, 'square', 0.12, 150), 90);
  }

  pickup() {
    this.tone(660, 0.09, 'sine', 0.14, 990);
  }

  dash() {
    this.noise(0.22, 0.16, 1800);
    this.tone(300, 0.18, 'sine', 0.08, 720);
  }

  // A heavy thud plus a low buzz: the turkey just hit something hard.
  hit() {
    this.noise(0.18, 0.28, 500);
    this.tone(140, 0.3, 'sawtooth', 0.16, 55);
  }

  click() {
    this.tone(520, 0.06, 'sine', 0.1, 700);
  }

  // The farmer's boots closing in: a short two-step stomp.
  stomp() {
    this.noise(0.08, 0.14, 300);
    window.setTimeout(() => this.noise(0.08, 0.14, 300), 140);
  }

  // Caught: a sad descending slide.
  caughtSting() {
    this.tone(392, 0.22, 'triangle', 0.16, 330);
    window.setTimeout(() => this.tone(330, 0.22, 'triangle', 0.16, 262), 200);
    window.setTimeout(() => this.tone(262, 0.45, 'triangle', 0.16, 131), 400);
  }

  // Escaped: a little rising fanfare.
  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      window.setTimeout(() => this.tone(freq, 0.22, 'triangle', 0.15), i * 130);
    });
  }
}
