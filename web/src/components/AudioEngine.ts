// Web Audio API synthesizer — realistic ASMR keyboard sounds per theme

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export type KeyType = "letter" | "space" | "enter" | "backspace" | "shift" | "caps";
export type ThemeId = "honey" | "candy" | "cloud" | "crystal" | "mystery" | "pastel";

// ─── Noise buffer helper ──────────────────────────────────────────────────────

function makeNoise(ac: AudioContext, seconds: number): AudioBufferSourceNode {
  const len = Math.ceil(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

// Coloured noise: run white noise through a cascade of filters
function makeFilteredNoise(
  ac: AudioContext,
  seconds: number,
  type: BiquadFilterType,
  freq: number,
  Q: number
): { src: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const src = makeNoise(ac, seconds);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = Q;
  src.connect(filter);
  return { src, filter };
}

// ─── 🍯 HONEY — satisfying mechanical clicker. Crisp tactile snap + low thock body ──

function playHoney(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Initial click transient — very short, high-freq burst
  {
    const { src, filter } = makeFilteredNoise(ac, 0.008, "bandpass", 6000, 8);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 1.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.007);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.009);
  }

  // ② Thock body — low-mid resonant thud
  {
    const osc = ac.createOscillator();
    osc.type = "sine";
    const base = keyType === "space" ? 60 : keyType === "enter" ? 75 : 95 + Math.random() * 15;
    osc.frequency.setValueAtTime(base * 2.2, t);
    osc.frequency.exponentialRampToValueAtTime(base, t + 0.025);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.09);
  }

  // ③ Mid crunch — the "meat" of the click
  {
    const { src, filter } = makeFilteredNoise(ac, 0.022, "bandpass", 2800, 3.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.85, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
    filter.connect(g); g.connect(ac.destination);
    src.start(t + 0.001); src.stop(t + 0.024);
  }

  // ④ Subtle release click (key up feel)
  {
    const { src, filter } = makeFilteredNoise(ac, 0.006, "highpass", 4500, 5);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.35, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.046);
    filter.connect(g); g.connect(ac.destination);
    src.start(t + 0.04); src.stop(t + 0.048);
  }
}

// ─── ☁️ CLOUD — airy, bushy, cotton-candy soft. Breathy filtered noise, no hard edges ──

function playCloud(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Main airy breath — low-passed white noise, very soft attack
  {
    const { src, filter } = makeFilteredNoise(ac, 0.35, "lowpass", 700 + Math.random() * 200, 0.4);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.42, t + 0.022);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.36);
  }

  // ② Cottony mid layer — bandpass around 300 Hz, very gentle
  {
    const { src, filter } = makeFilteredNoise(ac, 0.28, "bandpass", 300, 0.6);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.28, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.3);
  }

  // ③ Barely-there sine sigh — gives it a faint tonal warmth
  {
    const osc = ac.createOscillator();
    osc.type = "sine";
    const freq = keyType === "space" ? 110 : 160 + Math.random() * 40;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.78, t + 0.25);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.12, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.26);
  }
}

// ─── 🔮 MYSTERY — soft, glowy, whispery. Warm filtered hum with a faint ethereal shimmer ──

function playMystery(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Whispery noise — narrow bandpass, like a breath through velvet
  {
    const { src, filter } = makeFilteredNoise(ac, 0.26, "bandpass", 500 + Math.random() * 300, 1.4);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.3, t + 0.016);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.28);
  }

  // ② Warm glowing tone — sine with slow fade
  {
    const freq = keyType === "space" ? 150 : 190 + Math.random() * 70;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.84, t + 0.22);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.28, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.24);
  }

  // ③ Ethereal shimmer — triangle wave an octave up, very faint
  {
    const freq = keyType === "space" ? 300 : 380 + Math.random() * 140;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t + 0.01);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.2);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t + 0.01);
    g.gain.linearRampToValueAtTime(vol * 0.1, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t + 0.01); osc.stop(t + 0.2);
  }
}

// ─── ❄️ CRYSTAL — cold, glassy crackle. Icy high-freq snap + long ringing tone ──

function playCrystal(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Hard icy crack — very high freq, extremely short
  {
    const { src, filter } = makeFilteredNoise(ac, 0.018, "bandpass", 9000 + Math.random() * 2000, 9);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 1.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.02);
  }

  // ② Second crackle layer — slightly lower, gives texture
  {
    const { src, filter } = makeFilteredNoise(ac, 0.012, "bandpass", 5500 + Math.random() * 1500, 7);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.7, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
    filter.connect(g); g.connect(ac.destination);
    src.start(t + 0.003); src.stop(t + 0.016);
  }

  // ③ Glassy ring — high sine, long decay like a crystal glass
  {
    const freq = keyType === "space" ? 1100 : 1400 + Math.random() * 700;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.4);
  }

  // ④ Harmonic overtone — 2× freq, shorter
  {
    const freq = keyType === "space" ? 2200 : 2800 + Math.random() * 1400;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.22);
  }

  // ⑤ High noise crunch tail
  {
    const { src, filter } = makeFilteredNoise(ac, 0.04, "highpass", 8000, 2);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.3, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    filter.connect(g); g.connect(ac.destination);
    src.start(t + 0.005); src.stop(t + 0.045);
  }
}

// ─── 🍬 CANDY — crunchy, crisp, snappy. Like biting hard candy — bright pop + crunch ──

function playCandy(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Hard crunch — wide bandpass noise, punchy
  {
    const { src, filter } = makeFilteredNoise(ac, 0.03, "bandpass", 4000 + Math.random() * 2000, 3.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 1.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.032);
  }

  // ② Bright high crunch layer
  {
    const { src, filter } = makeFilteredNoise(ac, 0.018, "highpass", 7000, 4);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.75, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
    filter.connect(g); g.connect(ac.destination);
    src.start(t + 0.002); src.stop(t + 0.02);
  }

  // ③ Bright tonal pop — square wave, very short
  {
    const freq = keyType === "space" ? 350 : 480 + Math.random() * 220;
    const osc = ac.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.025);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.03);
  }

  // ④ Mid crunch body
  {
    const { src, filter } = makeFilteredNoise(ac, 0.022, "bandpass", 1800, 2.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.025);
  }
}

// ─── 🌸 PASTEL — clean, normal keyboard feel. Soft thock, balanced, pleasant ──

function playPastel(ac: AudioContext, vol: number, keyType: KeyType) {
  const t = ac.currentTime;

  // ① Clean click transient
  {
    const { src, filter } = makeFilteredNoise(ac, 0.01, "bandpass", 3500, 5);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.009);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.011);
  }

  // ② Balanced thock body
  {
    const osc = ac.createOscillator();
    osc.type = "sine";
    const base = keyType === "space" ? 70 : keyType === "enter" ? 85 : 105 + Math.random() * 20;
    osc.frequency.setValueAtTime(base * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(base, t + 0.03);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.11);
  }

  // ③ Soft mid noise body
  {
    const { src, filter } = makeFilteredNoise(ac, 0.025, "bandpass", 1600, 2);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.024);
    filter.connect(g); g.connect(ac.destination);
    src.start(t); src.stop(t + 0.026);
  }

  // ④ Gentle bell overtone — gives it a slightly floral warmth
  {
    const freq = keyType === "space" ? 500 : 640 + Math.random() * 160;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol * 0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let currentTheme: ThemeId = "honey";

export function setTheme(theme: ThemeId) {
  currentTheme = theme;
}

export function playKeySound(keyType: KeyType, volume: number, theme?: ThemeId) {
  try {
    const ac = getCtx();
    const th = theme ?? currentTheme;
    switch (th) {
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
    ambienceGain.gain.linearRampToValueAtTime(volume * 0.055, ac.currentTime + 1.5);
    ambienceGain.connect(ac.destination);

    ambienceNode = ac.createOscillator();
    ambienceNode.type = "sine";
    ambienceNode.frequency.value =
      theme === "cloud"   ? 55  :
      theme === "crystal" ? 220 :
      theme === "mystery" ? 70  :
      theme === "pastel"  ? 160 :
      theme === "candy"   ? 380 : 90;
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
