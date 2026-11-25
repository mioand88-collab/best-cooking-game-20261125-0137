// audio.js — every sound is synthesized with WebAudio: no audio files.
// Short blips for pickups, a noise burst for chopping, a sizzle loop while
// the grill is busy, a ding for a served dish, and a tiny bassline that
// keeps the shift moving. Nothing here loads over the network.

export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    musicOn: true,
    sizzleNode: null,
    nextNoteAt: 0,
    noteIndex: 0,
  };
}

function ensureCtx(audio) {
  if (audio.ctx) return audio.ctx;
  const Ctor = window.AudioContext ?? window.webkitAudioContext;
  if (!Ctor) return null;
  audio.ctx = new Ctor();
  return audio.ctx;
}

export function unlockAudio(audio) {
  const ctx = ensureCtx(audio);
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function tone(audio, freq, dur, type, gainValue, when = 0) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(audio, dur, gainValue, filterFreq) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

export const sfx = {
  pickup(audio) { tone(audio, 520, 0.09, 'triangle', 0.16); tone(audio, 780, 0.08, 'triangle', 0.1, 0.05); },
  place(audio) { tone(audio, 340, 0.08, 'triangle', 0.14); },
  chop(audio) { noiseBurst(audio, 0.07, 0.5, 1800); tone(audio, 180, 0.05, 'square', 0.08); },
  chopped(audio) { tone(audio, 660, 0.1, 'sine', 0.18); tone(audio, 880, 0.12, 'sine', 0.14, 0.07); },
  sizzleStart(audio) { noiseBurst(audio, 0.25, 0.25, 5200); },
  serve(audio) { tone(audio, 880, 0.14, 'sine', 0.2); tone(audio, 1174, 0.2, 'sine', 0.18, 0.1); },
  wrong(audio) { tone(audio, 220, 0.18, 'sawtooth', 0.1); tone(audio, 165, 0.24, 'sawtooth', 0.1, 0.12); },
  expired(audio) { tone(audio, 392, 0.15, 'triangle', 0.14); tone(audio, 311, 0.22, 'triangle', 0.14, 0.13); },
  tick(audio) { tone(audio, 1200, 0.04, 'square', 0.05); },
  newOrder(audio) { tone(audio, 587, 0.1, 'triangle', 0.14); tone(audio, 740, 0.12, 'triangle', 0.12, 0.08); },
  start(audio) { [523, 659, 784].forEach((f, i) => tone(audio, f, 0.14, 'triangle', 0.16, i * 0.09)); },
  gameOver(audio) { [392, 330, 262, 196].forEach((f, i) => tone(audio, f, 0.22, 'triangle', 0.16, i * 0.16)); },
};

// A cheerful loop: a walking bassline under a plucky two-note figure.
// Called once per frame; it schedules notes only when their time has come.
const BASS = [130.8, 0, 164.8, 0, 196.0, 0, 164.8, 0, 146.8, 0, 196.0, 0, 220.0, 0, 196.0, 0];
const PLUCK = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 880.0, 698.5];

export function musicStep(audio) {
  if (!audio.musicOn || audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx || ctx.state !== 'running') return;
  const stepDur = 0.21;
  if (audio.nextNoteAt === 0) audio.nextNoteAt = ctx.currentTime + 0.1;
  while (audio.nextNoteAt < ctx.currentTime + 0.15) {
    const i = audio.noteIndex;
    const bass = BASS[i % BASS.length];
    if (bass) tone(audio, bass, stepDur * 0.9, 'triangle', 0.07, audio.nextNoteAt - ctx.currentTime);
    if (i % 2 === 0) {
      const pluck = PLUCK[(i / 2 | 0) % PLUCK.length];
      tone(audio, pluck, stepDur * 0.7, 'sine', 0.045, audio.nextNoteAt - ctx.currentTime);
    }
    audio.nextNoteAt += stepDur;
    audio.noteIndex += 1;
  }
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (muted && audio.ctx) void audio.ctx.suspend();
  if (!muted && audio.ctx) void audio.ctx.resume();
}
