// Ember Drift — sound, synthesized, no audio files. One clear job: every
// sound the game makes, built from oscillators and filtered noise so the
// game ships no assets and plays offline. Muted until the first gesture.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, freq, delay = 0) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    click() { tone(660, 0.06, 'sine', 0.25, 880); },
    shoot() { tone(520, 0.09, 'square', 0.10, 240); },
    hit() { noise(0.06, 0.16, 1800); },
    explode() { noise(0.28, 0.35, 900); tone(160, 0.25, 'sine', 0.30, 50); },
    pickup(step = 0) { tone(620 + step * 40, 0.09, 'sine', 0.18, 940 + step * 40); },
    dash() { noise(0.16, 0.22, 3200); },
    hurt() { tone(220, 0.18, 'sawtooth', 0.28, 90); },
    wave() { tone(392, 0.16, 'triangle', 0.28); tone(523, 0.2, 'triangle', 0.28, null, 0.14); },
    upgrade() { [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.25, null, i * 0.08)); },
    victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.26, null, i * 0.12)); },
    gameover() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sine', 0.26, null, i * 0.16)); },
  };
}
