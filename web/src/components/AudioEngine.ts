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

// ─── Per-theme sound synthesizers ────────────────────────────────────────────

function makeNoise(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const bufSize = Math.ceil(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

// 🍯 HONEY — thick, sticky thock. Deep low-mid thud with a slow gooey tail.
function playHoney(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;
  const gain = ac.createGain();
  gain.connect(ac.destination);

  // Thock body — low-mid thud
  const osc = ac.createOscillator();
  const oscGain = ac.createGain();
  osc.type = "sine";
  const baseFreq = keyType === "space" ? 55 : keyType === "enter" ? 70 : 90 + Math.random() * 20;
  osc.frequency.setValueAtTime(baseFreq * 1.8, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.04);
  oscGain.gain.setValueAtTime(0.0, now);
  oscGain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.003);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(oscGain);
  oscGain.connect(gain);
  osc.start(now);
  osc.stop(now + 0.2);

  // Sticky noise burst
  const noise = makeNoise(ac, 0.08);
  const noiseFilter = ac.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 1.2;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(gain);
  noise.start(now);
  noise.stop(now + 0.08);

  gain.gain.setValueAtTime(1, now);
}

// 🍬 CANDY — bright, crisp crunch. High-frequency snap with a short sharp attack.
function playCandy(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;

  // Sharp high-freq click
  const clickNoise = makeNoise(ac, 0.025);
  const clickFilter = ac.createBiquadFilter();
  clickFilter.type = "bandpass";
  clickFilter.frequency.value = 5500 + Math.random() * 1500;
  clickFilter.Q.value = 4.0;
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(volume * 1.1, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
  clickNoise.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(ac.destination);
  clickNoise.start(now);
  clickNoise.stop(now + 0.025);

  // Bright tonal pop
  const osc = ac.createOscillator();
  osc.type = "square";
  const freq = keyType === "space" ? 320 : 420 + Math.random() * 180;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.03);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(volume * 0.22, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.04);

  // Second crunch layer
  const crunch = makeNoise(ac, 0.015);
  const crunchFilter = ac.createBiquadFilter();
  crunchFilter.type = "highpass";
  crunchFilter.frequency.value = 7000;
  const crunchGain = ac.createGain();
  crunchGain.gain.setValueAtTime(volume * 0.6, now + 0.005);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
  crunch.connect(crunchFilter);
  crunchFilter.connect(crunchGain);
  crunchGain.connect(ac.destination);
  crunch.start(now + 0.005);
  crunch.stop(now + 0.02);
}

// ☁️ CLOUD — airy, soft, breathlike. Low-passed noise with a gentle sine sigh.
function playCloud(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;

  // Airy breath noise
  const noise = makeNoise(ac, 0.28);
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800 + Math.random() * 300;
  filter.Q.value = 0.5;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0, now);
  noiseGain.gain.linearRampToValueAtTime(volume * 0.38, now + 0.018);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.3);

  // Soft sine sigh
  const osc = ac.createOscillator();
  osc.type = "sine";
  const freq = keyType === "space" ? 130 : 180 + Math.random() * 60;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.linearRampToValueAtTime(freq * 0.75, now + 0.22);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.0, now);
  oscGain.gain.linearRampToValueAtTime(volume * 0.18, now + 0.012);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

// ❄️ CRYSTAL — cold, glassy crunch. Bright high-freq snap + icy ring.
function playCrystal(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;

  // Icy crack noise
  const noise = makeNoise(ac, 0.03);
  const crackFilter = ac.createBiquadFilter();
  crackFilter.type = "bandpass";
  crackFilter.frequency.value = 8000 + Math.random() * 2000;
  crackFilter.Q.value = 6.0;
  const crackGain = ac.createGain();
  crackGain.gain.setValueAtTime(volume * 0.9, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
  noise.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.03);

  // Glassy ring tone — high pitched, decays slowly
  const freq = keyType === "space" ? 900 : 1200 + Math.random() * 600;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(volume * 0.45, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.3);

  // Second harmonic shimmer
  const osc2 = ac.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2.01, now);
  const osc2Gain = ac.createGain();
  osc2Gain.gain.setValueAtTime(volume * 0.18, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc2.connect(osc2Gain);
  osc2Gain.connect(ac.destination);
  osc2.start(now);
  osc2.stop(now + 0.2);

  // High noise crunch layer
  const crunch = makeNoise(ac, 0.012);
  const crunchF = ac.createBiquadFilter();
  crunchF.type = "highpass";
  crunchF.frequency.value = 9000;
  const crunchG = ac.createGain();
  crunchG.gain.setValueAtTime(volume * 0.5, now + 0.002);
  crunchG.gain.exponentialRampToValueAtTime(0.001, now + 0.014);
  crunch.connect(crunchF);
  crunchF.connect(crunchG);
  crunchG.connect(ac.destination);
  crunch.start(now + 0.002);
  crunch.stop(now + 0.014);
}

// 🔮 MYSTERY — soft, ethereal, whispery. Gentle filtered noise with a warm low tone.
function playMystery(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;

  // Whispery noise
  const noise = makeNoise(ac, 0.22);
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 600 + Math.random() * 400;
  filter.Q.value = 1.2;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0, now);
  noiseGain.gain.linearRampToValueAtTime(volume * 0.28, now + 0.015);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.25);

  // Warm low tone
  const osc = ac.createOscillator();
  osc.type = "sine";
  const freq = keyType === "space" ? 160 : 200 + Math.random() * 80;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.82, now + 0.18);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.0, now);
  oscGain.gain.linearRampToValueAtTime(volume * 0.22, now + 0.01);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.22);

  // Sub shimmer
  const osc2 = ac.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 1.5, now);
  const osc2Gain = ac.createGain();
  osc2Gain.gain.setValueAtTime(volume * 0.1, now + 0.005);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc2.connect(osc2Gain);
  osc2Gain.connect(ac.destination);
  osc2.start(now + 0.005);
  osc2.stop(now + 0.16);
}

// 🌸 PASTEL — flowery, soft, delicate. Gentle bell-like tone with a soft noise puff.
function playPastel(ac: AudioContext, volume: number, keyType: KeyType) {
  const now = ac.currentTime;

  // Soft puff of noise
  const noise = makeNoise(ac, 0.15);
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800 + Math.random() * 600;
  filter.Q.value = 0.7;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.0, now);
  noiseGain.gain.linearRampToValueAtTime(volume * 0.22, now + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.16);

  // Floral bell tone
  const freq = keyType === "space" ? 420 : 520 + Math.random() * 200;
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.88, now + 0.12);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(volume * 0.32, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.24);

  // Soft harmonic overtone
  const osc2 = ac.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 1.5, now);
  const osc2Gain = ac.createGain();
  osc2Gain.gain.setValueAtTime(volume * 0.14, now);
  osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc2.connect(osc2Gain);
  osc2Gain.connect(ac.destination);
  osc2.start(now);
  osc2.stop(now + 0.18);
}

// ─── Public API ───────────────────────────────────────────────────────────────

let currentTheme: ThemeId = "honey";

export function setTheme(theme: ThemeId) {
  currentTheme = theme;
}

export function playKeySound(keyType: KeyType, volume: number, theme?: ThemeId) {
  try {
    const ac = getCtx();
    const t = theme ?? currentTheme;
    switch (t) {
      case "honey":   playHoney(ac, volume, keyType);   break;
      case "candy":   playCandy(ac, volume, keyType);   break;
      case "cloud":   playCloud(ac, volume, keyType);   break;
      case "crystal": playCrystal(ac, volume, keyType); break;
      case "mystery": playMystery(ac, volume, keyType); break;
      case "pastel":  playPastel(ac, volume, keyType);  break;
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// ─── Ambience ─────────────────────────────────────────────────────────────────

let ambienceNode: OscillatorNode | null = null;
let ambienceGain: GainNode | null = null;

export function startAmbience(theme: ThemeId, volume: number) {
  stopAmbience();
  try {
    const ac = getCtx();
    ambienceGain = ac.createGain();
    ambienceGain.gain.setValueAtTime(0, ac.currentTime);
    ambienceGain.gain.linearRampToValueAtTime(volume * 0.06, ac.currentTime + 1.5);
    ambienceGain.connect(ac.destination);

    ambienceNode = ac.createOscillator();
    ambienceNode.type = "sine";
    ambienceNode.frequency.value =
      theme === "cloud" ? 60 :
      theme === "crystal" ? 220 :
      theme === "mystery" ? 80 :
      theme === "pastel" ? 180 :
      theme === "candy" ? 440 : 100;
    ambienceNode.connect(ambienceGain);
    ambienceNode.start();
  } catch (e) {
    console.warn("Ambience error:", e);
  }
}

export function stopAmbience() {
  try {
    if (ambienceGain && ambienceNode) {
      const ac = getCtx();
      ambienceGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.8);
      ambienceNode.stop(ac.currentTime + 0.9);
    }
  } catch {}
  ambienceNode = null;
  ambienceGain = null;
}
