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
    baseFreq: 180, freqVariance: 30, attack: 0.002, decay: 0.08, sustain: 0.1, release: 0.12,
    noiseAmount: 0.3, toneAmount: 0.5, clickAmount: 0.8, filterFreq: 3000, filterQ: 1.5, pitch: 1.0,
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
    baseFreq: 400, freqVariance: 60, attack: 0.001, decay: 0.06, sustain: 0.05, release: 0.15,
    noiseAmount: 0.15, toneAmount: 0.7, clickAmount: 0.9, filterFreq: 6000, filterQ: 3.0, pitch: 1.5,
  },
  mystery: {
    baseFreq: 90, freqVariance: 20, attack: 0.003, decay: 0.1, sustain: 0.15, release: 0.25,
    noiseAmount: 0.5, toneAmount: 0.6, clickAmount: 0.7, filterFreq: 2000, filterQ: 2.5, pitch: 0.6,
  },
  pastel: {
    baseFreq: 220, freqVariance: 40, attack: 0.002, decay: 0.07, sustain: 0.1, release: 0.14,
    noiseAmount: 0.35, toneAmount: 0.45, clickAmount: 0.75, filterFreq: 3500, filterQ: 1.2, pitch: 1.1,
  },
};

const keyMultipliers: Record<KeyType, number> = {
  letter: 1.0,
  space: 0.55,
  enter: 0.75,
  backspace: 0.85,
  shift: 0.7,
  caps: 0.65,
};

export function playKeySound(theme: ThemeId, keyType: KeyType, volume: number = 1.0) {
  try {
    const ac = getCtx();
    const profile = themeProfiles[theme];
    const mult = keyMultipliers[keyType];
    const now = ac.currentTime;
    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(volume * 0.7, now);
    masterGain.connect(ac.destination);

    // Noise burst (the "click" transient)
    if (profile.noiseAmount > 0) {
      const bufferSize = ac.sampleRate * 0.05;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }
      const noise = ac.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ac.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(profile.filterFreq * mult, now);
      noiseFilter.Q.setValueAtTime(profile.filterQ, now);

      const noiseGain = ac.createGain();
      noiseGain.gain.setValueAtTime(profile.noiseAmount * profile.clickAmount, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + profile.decay * 2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + profile.decay * 2 + 0.01);
    }

    // Tonal component
    if (profile.toneAmount > 0) {
      const freq = (profile.baseFreq + (Math.random() - 0.5) * profile.freqVariance) * mult * profile.pitch;

      const osc = ac.createOscillator();
      osc.type = keyType === "space" ? "sine" : keyType === "crystal" ? "triangle" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + profile.decay);

      const toneFilter = ac.createBiquadFilter();
      toneFilter.type = "lowpass";
      toneFilter.frequency.setValueAtTime(profile.filterFreq * 1.5, now);

      const toneGain = ac.createGain();
      toneGain.gain.setValueAtTime(0.001, now);
      toneGain.gain.linearRampToValueAtTime(profile.toneAmount * 0.6, now + profile.attack);
      toneGain.gain.exponentialRampToValueAtTime(profile.toneAmount * profile.sustain, now + profile.attack + profile.decay);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + profile.attack + profile.decay + profile.release);

      osc.connect(toneFilter);
      toneFilter.connect(toneGain);
      toneGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + profile.attack + profile.decay + profile.release + 0.05);
    }

    // Sub thud for space/enter
    if (keyType === "space" || keyType === "enter") {
      const subOsc = ac.createOscillator();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(60 * mult, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

      const subGain = ac.createGain();
      subGain.gain.setValueAtTime(0.4, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.2);
    }

    // Mystery theme: add a shimmer
    if (theme === "mystery") {
      const shimOsc = ac.createOscillator();
      shimOsc.type = "sine";
      shimOsc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      shimOsc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      const shimGain = ac.createGain();
      shimGain.gain.setValueAtTime(0.15, now);
      shimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      shimOsc.connect(shimGain);
      shimGain.connect(masterGain);
      shimOsc.start(now);
      shimOsc.stop(now + 0.35);
    }

    // Crystal: add harmonic sparkle
    if (theme === "crystal") {
      const sparkOsc = ac.createOscillator();
      sparkOsc.type = "sine";
      sparkOsc.frequency.setValueAtTime(1200 + Math.random() * 600, now);

      const sparkGain = ac.createGain();
      sparkGain.gain.setValueAtTime(0.2, now);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      sparkOsc.connect(sparkGain);
      sparkGain.connect(masterGain);
      sparkOsc.start(now);
      sparkOsc.stop(now + 0.15);
    }

  } catch (e) {
    // Audio not supported
  }
}

// Ambient drone
let ambientSource: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export function startAmbience(theme: ThemeId, volume: number = 0.15) {
  stopAmbience();
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    const freqs: Record<ThemeId, number[]> = {
      honey: [55, 110, 165],
      candy: [220, 330, 440],
      cloud: [40, 80, 120],
      crystal: [440, 880, 1320],
      mystery: [30, 60, 90],
      pastel: [110, 220, 330],
    };

    ambientGain = ac.createGain();
    ambientGain.gain.setValueAtTime(0, now);
    ambientGain.gain.linearRampToValueAtTime(volume, now + 1.5);
    ambientGain.connect(ac.destination);

    const reverb = ac.createConvolver();
    const rLen = ac.sampleRate * 2;
    const rBuf = ac.createBuffer(2, rLen, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = rBuf.getChannelData(ch);
      for (let i = 0; i < rLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rLen, 2);
    }
    reverb.buffer = rBuf;
    reverb.connect(ambientGain);

    freqs[theme].forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.08 / (i + 1), now);
      osc.connect(g);
      g.connect(reverb);
      osc.start(now);
      // store ref for cleanup
      if (i === 0) ambientSource = osc;
    });
  } catch (e) {}
}

export function stopAmbience() {
  try {
    if (ambientGain) {
      const ac = getCtx();
      ambientGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.8);
    }
    setTimeout(() => {
      try { ambientSource?.stop(); } catch (e) {}
      ambientSource = null;
      ambientGain = null;
    }, 900);
  } catch (e) {}
}
