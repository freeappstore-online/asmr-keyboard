import { useState, useCallback, useRef } from "react";
import type { KeyboardTheme } from "./KeyboardThemes";
import { CANDY_COLORS, PASTEL_COLORS } from "./KeyboardThemes";
import { playKeySound } from "./AudioEngine";
import type { KeyType } from "./AudioEngine";

interface Key3DProps {
  label: string;
  displayLabel?: string;
  keyType?: KeyType;
  theme: KeyboardTheme;
  width?: number; // in units
  volume: number;
  onPress?: (label: string) => void;
  colorIndex?: number;
  rgbEnabled?: boolean;
  disabled?: boolean;
}

const RGB_COLORS = [
  "#ff4444", "#ff8844", "#ffcc44", "#44ff88", "#44ccff", "#4488ff", "#cc44ff", "#ff44cc",
];

export function Key3D({
  label,
  displayLabel,
  keyType = "letter",
  theme,
  width = 1,
  volume,
  onPress,
  colorIndex = 0,
  rgbEnabled = false,
  disabled = false,
}: Key3DProps) {
  const [pressed, setPressed] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    if (disabled) return;
    setPressed(true);
    setGlowing(true);
    playKeySound(theme.id, keyType, volume);
    onPress?.(label);

    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setPressed(false), 120);

    if (glowTimer.current) clearTimeout(glowTimer.current);
    glowTimer.current = setTimeout(() => setGlowing(false), 400);
  }, [disabled, theme.id, keyType, volume, onPress, label]);

  // Determine key face color
  let keyTopColor = theme.keyTop;
  let keyBg = theme.keyBg;
  let keySide = theme.keySide;
  let keyBorder = theme.keyBorder;

  if (theme.id === "candy") {
    const c = CANDY_COLORS[colorIndex % CANDY_COLORS.length];
    keyTopColor = c;
    keyBg = `linear-gradient(145deg, ${c}, ${shadeColor(c, -20)})`;
    keySide = shadeColor(c, -40);
    keyBorder = shadeColor(c, -30);
  } else if (theme.id === "pastel") {
    const c = PASTEL_COLORS[colorIndex % PASTEL_COLORS.length];
    keyTopColor = c;
    keyBg = `linear-gradient(145deg, ${c}, ${shadeColor(c, -15)})`;
    keySide = shadeColor(c, -35);
    keyBorder = shadeColor(c, -25);
  }

  const rgbColor = rgbEnabled ? RGB_COLORS[(colorIndex + Math.floor(Date.now() / 2000)) % RGB_COLORS.length] : null;
  const glowColor = rgbColor || (glowing ? theme.keyGlow : "transparent");

  const pressDepth = pressed ? 3 : 0;
  const shadowY = pressed ? 1 : 4;

  const baseWidth = 2.8; // rem per unit
  const keyWidth = `${baseWidth * width}rem`;
  const keyHeight = "2.6rem";

  return (
    <div
      className="relative select-none cursor-pointer"
      style={{
        width: keyWidth,
        height: keyHeight,
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
      }}
      onMouseDown={handlePress}
      onTouchStart={(e) => { e.preventDefault(); handlePress(); }}
    >
      {/* Side/depth layer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "2px",
          right: "2px",
          height: `${8}px`,
          background: keySide,
          borderRadius: "0 0 0.4rem 0.4rem",
          transition: "height 0.08s ease",
        }}
      />
      {/* Top face */}
      <div
        style={{
          position: "absolute",
          top: pressed ? `${pressDepth}px` : "0px",
          left: "1px",
          right: "1px",
          bottom: `${8 - pressDepth}px`,
          background: pressed ? (theme.keyBgPressed || theme.keyBg) : keyBg,
          borderRadius: "0.35rem",
          border: `1px solid ${keyBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: width >= 2 ? "0.7rem" : "0.72rem",
          fontWeight: "700",
          fontFamily: "Manrope, sans-serif",
          color: theme.keyText,
          letterSpacing: "0.02em",
          boxShadow: pressed
            ? `inset 0 2px 4px rgba(0,0,0,0.3), 0 0 ${glowing ? "12px" : "0"} ${glowColor}`
            : `inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2), 0 ${shadowY}px 0 ${keySide}, 0 0 ${glowing ? "14px" : "0"} ${glowColor}`,
          transition: "top 0.08s ease, bottom 0.08s ease, box-shadow 0.15s ease, background 0.08s ease",
          overflow: "hidden",
        }}
      >
        {/* Shine overlay */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "45%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
          borderRadius: "0.35rem 0.35rem 0 0",
          pointerEvents: "none",
        }} />
        {/* Crystal shimmer */}
        {theme.id === "crystal" && (
          <div style={{
            position: "absolute",
            top: "20%", left: "60%",
            width: "30%", height: "30%",
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
        )}
        {/* Honeycomb pattern hint for honey */}
        {theme.id === "honey" && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,220,100,0.3) 0%, transparent 50%)`,
            pointerEvents: "none",
          }} />
        )}
        <span style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
          {displayLabel || label}
        </span>
      </div>
    </div>
  );
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
