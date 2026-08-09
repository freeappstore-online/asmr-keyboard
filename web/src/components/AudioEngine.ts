// Web Audio API synthesizer for ASMR keyboard sounds

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export type KeyType = "letter" | "space" | "enter" | "backspace" | "shift" | "caps";
export type ThemeId = "honey" | "candy" | "cloud" | "crystal" | "mystery" | "pastel";

interface SoundProfile {
  baseFreq: number;
  freqVariance: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  noiseAmount: number;
  toneAmount: number;
  clickAmount: number;
  filterFreq: number;
  filterQ: number;
  pitch: number;
}

const themeProfiles: Record<ThemeId, SoundProfile> = {
  honey: {
    // Sharp mechanical clicker — crisp, satisfying
    baseFreq: 2200, freqVariance: 200, attack: 0.0005, decay: 0.018, sustain: 0.0, release: 0.04,
    noiseAmount: 0.9, toneAmount: 0.35, clickAmount: 1.4, filterFreq: 7000, filterQ: 3.5, pitch: 1.0,
  },
  candy: {
    baseFreq: 280, freqVariance: 50, attack: 0.001, decay: 0.05, sustain: 0.05, release: 0.08,
    noiseAmount: 0.2, toneAmount: 0.4, clickAmount: 1.0, filterFreq: 5000, filterQ: 2.0, pitch: 1.3,
  },
  cloud: {
    baseFreq: 120, freqVariance: 20, attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.2,
    noiseAmount: 0.6, toneAmount: 0.3, clickAmount: 0.4, filterFreq: 1500, filterQ: 0.8, pitch: 0.8,
  },
  crystal: {
    baseFreq: 400, freqVariance: 60, attack: 0.001, decay: 0.06, sustain: 0.08, release: 0.15,
    noiseAmount: 0.1, toneAmount: 0.9, clickAmount: 0.5, filterFreq: 8000, filterQ: 3.0, pitch: 1.5,
  },
  mystery: {
    baseFreq: 200, freqVariance: 80, attack: 0.003, decay: 0.1, sustain: 0.15, release: 0.25,
    noiseAmount: 0.5, toneAmount: 0.6, clickAmount: 0.7, filterFreq: 2500, filterQ: 2.5, pitch: 0.9,
  },
  pastel: {
    baseFreq: 320, freqVariance: 40, attack: 0.002, decay: 0.07, sustain: 0.1, release: 0.12,
    noiseAmount: 0.3, toneAmount: 0.5, clickAmount: 0.8, filterFreq: 4000, filterQ: 1.8, pitch: 1.1,
  },
};

// ── Honey mechanical clicker ─────────────────────────────────────────────────
function playClickerSound(keyType: KeyType, volume: number) {
  const ac = getCtx();
  const now = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = Math.min(volume, 1.0);
  master.connect(ac.destination);

  // --- Click transient (noise burst through bandpass) ---
  const bufLen = ac.sampleRate * 0.025;
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

  const noiseNode = ac.createBufferSource();
  noiseNode.buffer = buf;

  // High bandpass → crisp click
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = keyType === "space" ? 900 : keyType === "enter" ? 1100 : 1600 + Math.random() * 400;
  bp.Q.value = 2.2;

  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(1.2 * volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

  noiseNode.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(master);
  noiseNode.start(now);
  noiseNode.stop(now + 0.025);

  // --- Tone body (short pitched thunk) ---
  const osc = ac.createOscillator();
  osc.type = "square";
  const baseFreq = keyType === "space" ? 160 : keyType === "enter" ? 200 : 320 + Math.random() * 80;
  osc.frequency.setValueAtTime(baseFreq * 1.8, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.012);

  const oscFilter = ac.createBiquadFilter();
  oscFilter.type = "lowpass";
  oscFilter.frequency.value = 3500;
  oscFilter.Q.value = 1.0;

  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.28 * volume, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(oscFilter);
  oscFilter.connect(oscGain);
  oscGain.connect(master);
  osc.start(now);
  osc.stop(now + 0.04);

  // --- Bottom thud (low sine punch) ---
  const thud = ac.createOscillator();
  thud.type = "sine";
  const thudFreq = keyType === "space" ? 55 : keyType === "enter" ? 70 : 90 + Math.random() * 20;
  thud.frequency.setValueAtTime(thudFreq * 2.5, now);
  thud.frequency.exponentialRampToValueAtTime(thudFreq, now + 0.015);

  const thudGain = ac.createGain();
  thudGain.gain.setValueAtTime(0.5 * volume, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  thud.connect(thudGain);
  thudGain.connect(master);
  thud.start(now);
  thud.stop(now + 0.045);

  // --- Release tick (upstroke click) ---
  setTimeout(() => {
    const ac2 = getCtx();
    const t = ac2.currentTime;
    const relBuf = ac2.createBuffer(1, Math.floor(ac2.sampleRate * 0.012), ac2.sampleRate);
    const rd = relBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = (Math.random() * 2 - 1);

    const relNoise = ac2.createBufferSource();
    relNoise.buffer = relBuf;

    const relBp = ac2.createBiquadFilter();
    relBp.type = "bandpass";
    relBp.frequency.value = 2400;
    relBp.Q.value = 3;

    const relGain = ac2.createGain();
    relGain.gain.setValueAtTime(0.35 * volume, t);
    relGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

    const relMaster = ac2.createGain();
    relMaster.gain.value = Math.min(volume, 1.0);
    relMaster.connect(ac2.destination);

    relNoise.connect(relBp);
    relBp.connect(relGain);
    relGain.connect(relMaster);
    relNoise.start(t);
    relNoise.stop(t + 0.013);
  }, 80 + Math.random() * 20);
}

// ── Generic theme sound ──────────────────────────────────────────────────────
function playThemeSound(themeId: ThemeId, keyType: KeyType, volume: number) {
  const ac = getCtx();
  const profile = themeProfiles[themeId];
  const now = ac.currentTime;

  const masterGain = ac.createGain();
  masterGain.gain.value = Math.min(volume, 1.0);
  masterGain.connect(ac.destination);

  const keyMultiplier =
    keyType === "space" ? 0.7 :
    keyType === "enter" ? 0.85 :
    keyType === "backspace" ? 0.9 :
    keyType === "shift" || keyType === "caps" ? 0.95 : 1.0;

  const freq = (profile.baseFreq + (Math.random() - 0.5) * profile.freqVariance) * profile.pitch * keyMultiplier;

  // Noise layer
  if (profile.noiseAmount > 0) {
    const bufferSize = ac.sampleRate * 0.15;
    const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const noiseSource = ac.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ac.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = profile.filterFreq;
    noiseFilter.Q.value = profile.filterQ;

    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(profile.noiseAmount * profile.clickAmount * volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + profile.decay + profile.release);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + profile.decay + profile.release + 0.05);
  }

  // Tone layer
  if (profile.toneAmount > 0) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + profile.decay);

    const oscFilter = ac.createBiquadFilter();
    oscFilter.type = "lowpass";
    oscFilter.frequency.value = profile.filterFreq * 0.8;

    const oscGain = ac.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(profile.toneAmount * volume, now + profile.attack);
    oscGain.gain.exponentialRampToValueAtTime(profile.sustain * profile.toneAmount * volume + 0.001, now + profile.attack + profile.decay);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + profile.attack + profile.decay + profile.release);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + profile.attack + profile.decay + profile.release + 0.05);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export function playKeySound(themeId: ThemeId, keyType: KeyType, volume: number) {
  try {
    if (themeId === "honey") {
      playClickerSound(keyType, volume);
    } else {
      playThemeSound(themeId, keyType, volume);
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// ── Ambience ─────────────────────────────────────────────────────────────────
let ambienceNode: AudioBufferSourceNode | null = null;
let ambienceGain: GainNode | null = null;

export function startAmbience(themeId: ThemeId, volume: number) {
  stopAmbience();
  try {
    const ac = getCtx();
    const bufferSize = ac.sampleRate * 4;
    const buffer = ac.createBuffer(2, bufferSize, ac.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.0362) / 7;
      }
    }

    const themeFreq: Record<ThemeId, number> = {
      honey: 400, candy: 800, cloud: 200, crystal: 1200, mystery: 300, pastel: 600,
    };

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = themeFreq[themeId];
    filter.Q.value = 0.5;

    ambienceGain = ac.createGain();
    ambienceGain.gain.value = volume * 0.08;

    ambienceNode = ac.createBufferSource();
    ambienceNode.buffer = buffer;
    ambienceNode.loop = true;

    ambienceNode.connect(filter);
    filter.connect(ambienceGain);
    ambienceGain.connect(ac.destination);
    ambienceNode.start();
  } catch (e) {
    console.warn("Ambience error:", e);
  }
}

export function stopAmbience() {
  try {
    ambienceNode?.stop();
    ambienceNode?.disconnect();
    ambienceGain?.disconnect();
  } catch {}
  ambienceNode = null;
  ambienceGain = null;
}
