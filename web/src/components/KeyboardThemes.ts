export type ThemeId = "honey" | "candy" | "cloud" | "crystal" | "mystery" | "pastel";

export interface KeyboardTheme {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  locked: boolean;
  // Key cap colors
  keyBg: string;
  keyBgPressed: string;
  keyTop: string;
  keyTopPressed: string;
  keySide: string;
  keyText: string;
  keyGlow: string;
  keyBorder: string;
  // Board
  boardBg: string;
  boardBorder: string;
  // Background
  appBg: string;
  appBg2: string;
  titleColor: string;
  // Special effects
  hasGlow: boolean;
  hasParticles: boolean;
  hasRgb: boolean;
  particleColor: string;
}

export const THEMES: KeyboardTheme[] = [
  {
    id: "honey",
    name: "Honey",
    emoji: "🍯",
    tagline: "Warm golden sweetness",
    locked: false,
    keyBg: "linear-gradient(145deg, #f5c842, #e8a800)",
    keyBgPressed: "linear-gradient(145deg, #d4a800, #c49000)",
    keyTop: "#ffd84d",
    keyTopPressed: "#c8960a",
    keySide: "#b8850a",
    keyText: "#5c3a00",
    keyGlow: "rgba(255, 200, 0, 0.6)",
    keyBorder: "#c49000",
    boardBg: "linear-gradient(135deg, #3d2200 0%, #5c3800 50%, #3d2200 100%)",
    boardBorder: "#8b5e00",
    appBg: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)",
    appBg2: "#2d1a00",
    titleColor: "#ffd84d",
    hasGlow: false,
    hasParticles: false,
    hasRgb: false,
    particleColor: "#ffd84d",
  },
  {
    id: "candy",
    name: "Candy",
    emoji: "🍬",
    tagline: "Pop of sugary colour",
    locked: false,
    keyBg: "linear-gradient(145deg, #ff85c0, #c850a0)",
    keyBgPressed: "linear-gradient(145deg, #c850a0, #a03080)",
    keyTop: "#ff9dd0",
    keyTopPressed: "#c060a0",
    keySide: "#a03080",
    keyText: "#fff",
    keyGlow: "rgba(255, 100, 180, 0.6)",
    keyBorder: "#c850a0",
    boardBg: "linear-gradient(135deg, #2d0030 0%, #4a0050 50%, #2d0030 100%)",
    boardBorder: "#8b0070",
    appBg: "linear-gradient(135deg, #1a0020 0%, #2d0040 50%, #1a0020 100%)",
    appBg2: "#2d0040",
    titleColor: "#ff85c0",
    hasGlow: false,
    hasParticles: false,
    hasRgb: false,
    particleColor: "#ff85c0",
  },
  {
    id: "cloud",
    name: "Cloud",
    emoji: "☁️",
    tagline: "Soft and dreamy",
    locked: false,
    keyBg: "linear-gradient(145deg, #e8f4ff, #c8e0f8)",
    keyBgPressed: "linear-gradient(145deg, #b8d0e8, #a0c0d8)",
    keyTop: "#f0f8ff",
    keyTopPressed: "#b0c8e0",
    keySide: "#90b0cc",
    keyText: "#2a4a6a",
    keyGlow: "rgba(160, 200, 240, 0.5)",
    keyBorder: "#a0c0d8",
    boardBg: "linear-gradient(135deg, #1a2a3a 0%, #253545 50%, #1a2a3a 100%)",
    boardBorder: "#3a5570",
    appBg: "linear-gradient(135deg, #0a1520 0%, #152030 50%, #0a1520 100%)",
    appBg2: "#152030",
    titleColor: "#c8e0f8",
    hasGlow: false,
    hasParticles: false,
    hasRgb: false,
    particleColor: "#c8e0f8",
  },
  {
    id: "pastel",
    name: "Pastel",
    emoji: "🌸",
    tagline: "Gentle rainbow hues",
    locked: false,
    keyBg: "linear-gradient(145deg, #ffb3d9, #b3d9ff)",
    keyBgPressed: "linear-gradient(145deg, #e090c0, #90c0e8)",
    keyTop: "#ffc8e8",
    keyTopPressed: "#d0a0d0",
    keySide: "#c090c0",
    keyText: "#4a2060",
    keyGlow: "rgba(200, 150, 220, 0.5)",
    keyBorder: "#d0a0c8",
    boardBg: "linear-gradient(135deg, #1e0a2e 0%, #2e1040 50%, #1e0a2e 100%)",
    boardBorder: "#6a3080",
    appBg: "linear-gradient(135deg, #120018 0%, #200030 50%, #120018 100%)",
    appBg2: "#200030",
    titleColor: "#ffb3d9",
    hasGlow: false,
    hasParticles: false,
    hasRgb: false,
    particleColor: "#ffb3d9",
  },
  {
    id: "crystal",
    name: "Crystal",
    emoji: "🧊",
    tagline: "Transparent & radiant",
    locked: false,
    keyBg: "linear-gradient(145deg, rgba(180,230,255,0.7), rgba(120,180,240,0.5))",
    keyBgPressed: "linear-gradient(145deg, rgba(100,160,220,0.7), rgba(80,140,200,0.6))",
    keyTop: "rgba(220, 245, 255, 0.85)",
    keyTopPressed: "rgba(140, 190, 230, 0.8)",
    keySide: "rgba(80, 140, 200, 0.9)",
    keyText: "#001a33",
    keyGlow: "rgba(100, 200, 255, 0.8)",
    keyBorder: "rgba(120, 180, 240, 0.6)",
    boardBg: "linear-gradient(135deg, rgba(0,20,40,0.95) 0%, rgba(0,30,60,0.95) 50%, rgba(0,20,40,0.95) 100%)",
    boardBorder: "rgba(80,160,240,0.4)",
    appBg: "linear-gradient(135deg, #000a18 0%, #001428 50%, #000a18 100%)",
    appBg2: "#001428",
    titleColor: "#80d0ff",
    hasGlow: true,
    hasParticles: false,
    hasRgb: false,
    particleColor: "#80d0ff",
  },
  {
    id: "mystery",
    name: "Mystery",
    emoji: "🌌",
    tagline: "Dark & otherworldly",
    locked: false,
    keyBg: "linear-gradient(145deg, #3a1060, #1a0040)",
    keyBgPressed: "linear-gradient(145deg, #1a0040, #0a0020)",
    keyTop: "#4a1878",
    keyTopPressed: "#200050",
    keySide: "#0a0030",
    keyText: "#cc88ff",
    keyGlow: "rgba(150, 50, 255, 0.8)",
    keyBorder: "#5a1090",
    boardBg: "linear-gradient(135deg, #050010 0%, #0a0020 50%, #050010 100%)",
    boardBorder: "#3a0060",
    appBg: "linear-gradient(135deg, #020008 0%, #050015 50%, #020008 100%)",
    appBg2: "#050015",
    titleColor: "#bb66ff",
    hasGlow: true,
    hasParticles: true,
    hasRgb: false,
    particleColor: "#9933ff",
  },
];

export function getTheme(id: ThemeId): KeyboardTheme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

// Pastel candy key colors per column
export const CANDY_COLORS = [
  "#ff6eb4", "#ff9b6e", "#ffe06e", "#6edfff", "#6eb4ff",
  "#b46eff", "#ff6e6e", "#6eff9b", "#ff6ec8", "#6effdf",
];

export const PASTEL_COLORS = [
  "#ffb3d9", "#ffd4b3", "#fffab3", "#b3f0d9", "#b3d9ff",
  "#d4b3ff", "#ffb3b3", "#b3ffcc", "#f0b3ff", "#b3f0ff",
];
