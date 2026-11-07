/* ------------------------------------------------------------------ */
/*  Alarm tones generated with the Web Audio API                      */
/*  The alarm loops continuously until stopAllSounds() is called.     */
/* ------------------------------------------------------------------ */

let audioCtx: AudioContext | null = null;
let loopActive = false;
let loopTimer: ReturnType<typeof setTimeout> | null = null;
const activeOscs = new Set<OscillatorNode>();

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3, delay = 0) {
  const ctx = getCtx();
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  activeOscs.add(osc);
  osc.onended = () => activeOscs.delete(osc);
  osc.start(t);
  osc.stop(t + duration);
}

function playChord(freqs: number[], duration: number, volume = 0.2, delay = 0) {
  freqs.forEach((f) => playTone(f, duration, "sine", volume, delay));
}

/** Plays one full sequence. Returns its duration in milliseconds. */
function playSequence(sound: string, volume: number): number {
  if (sound === "classic") {
    // Repeating two-note alert
    for (let i = 0; i < 6; i++) {
      playTone(880, 0.25, "square", volume * 0.6, i * 0.45);
      playTone(660, 0.25, "square", volume * 0.6, i * 0.45 + 0.25);
    }
    return 2950;
  } else if (sound === "gentle") {
    // Ascending soft chimes
    playChord([523.25, 659.25, 783.99], 0.8, volume * 0.5, 0);
    playChord([659.25, 783.99, 1046.5], 0.8, volume * 0.4, 1.2);
    playChord([783.99, 1046.5, 1318.51], 1.2, volume * 0.5, 2.4);
    return 3600;
  } else if (sound === "calm") {
    // Soft low swell
    playTone(329.63, 1.5, "sine", volume * 0.4, 0);
    playTone(415.3, 1.5, "sine", volume * 0.35, 0.8);
    playTone(523.25, 2.0, "sine", volume * 0.4, 1.6);
    return 3600;
  } else {
    // beep fallback
    for (let i = 0; i < 5; i++) {
      playTone(900, 0.2, "square", volume * 0.7, i * 0.35);
    }
    return 1600;
  }
}

/**
 * Starts the alarm sound and keeps looping it until stopAllSounds()
 * is called (from "Detener" or "Posponer" on the active-alarm overlay).
 */
export function playAlarmSound(sound: string, volume: number) {
  const v = Math.max(0, Math.min(1, volume));
  stopAllSounds();
  loopActive = true;
  const loop = () => {
    if (!loopActive) return;
    const durationMs = playSequence(sound, v);
    loopTimer = setTimeout(loop, durationMs + 400);
  };
  loop();
}

export function stopAllSounds() {
  loopActive = false;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
  activeOscs.forEach((osc) => {
    try { osc.stop(); } catch { /* already stopped */ }
  });
  activeOscs.clear();
  try {
    void audioCtx?.close();
    audioCtx = null;
  } catch {
    // ignore
  }
}

export async function requestAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    // audio not available
  }
}
