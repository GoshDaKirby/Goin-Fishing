let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, startTime, duration, { type = 'sine', gain = 0.15, glideTo } = {}) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export const sfx = {
  cast() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(320, t, 0.12, { type: 'triangle', gain: 0.12, glideTo: 180 });
  },
  bite() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(660, t, 0.09, { type: 'square', gain: 0.14 });
    tone(880, t + 0.1, 0.09, { type: 'square', gain: 0.14 });
  },
  tick() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(500, audioCtx.currentTime, 0.03, { type: 'sine', gain: 0.05 });
  },
  success() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.18, { type: 'sine', gain: 0.13 }));
  },
  fail() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    tone(300, t, 0.35, { type: 'sawtooth', gain: 0.12, glideTo: 90 });
  },
  ui() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(440, audioCtx.currentTime, 0.05, { type: 'sine', gain: 0.08 });
  },
  chat() {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(720, audioCtx.currentTime, 0.06, { type: 'sine', gain: 0.08 });
  },
};
