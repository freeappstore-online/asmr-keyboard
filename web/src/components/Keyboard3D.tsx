import { useCallback, useRef } from "react";
import type { KeyboardTheme } from "./KeyboardThemes";
import { Key3D } from "./Key3D";
import type { KeyType } from "./AudioEngine";

interface KeyDef {
  label: string;
  display?: string;
  type?: KeyType;
  width?: number;
  colorIndex?: number;
}

const ROW1: KeyDef[] = [
  { label: "`", display: "`", colorIndex: 0 },
  { label: "1", colorIndex: 1 }, { label: "2", colorIndex: 2 }, { label: "3", colorIndex: 3 },
  { label: "4", colorIndex: 4 }, { label: "5", colorIndex: 5 }, { label: "6", colorIndex: 6 },
  { label: "7", colorIndex: 7 }, { label: "8", colorIndex: 8 }, { label: "9", colorIndex: 9 },
  { label: "0", colorIndex: 0 }, { label: "-", colorIndex: 1 }, { label: "=", colorIndex: 2 },
  { label: "Backspace", display: "⌫", type: "backspace", width: 1.8, colorIndex: 3 },
];

const ROW2: KeyDef[] = [
  { label: "Tab", display: "⇥", type: "shift", width: 1.4, colorIndex: 4 },
  { label: "Q", colorIndex: 5 }, { label: "W", colorIndex: 6 }, { label: "E", colorIndex: 7 },
  { label: "R", colorIndex: 8 }, { label: "T", colorIndex: 9 }, { label: "Y", colorIndex: 0 },
  { label: "U", colorIndex: 1 }, { label: "I", colorIndex: 2 }, { label: "O", colorIndex: 3 },
  { label: "P", colorIndex: 4 }, { label: "[", colorIndex: 5 }, { label: "]", colorIndex: 6 },
  { label: "\\", colorIndex: 7, width: 1.4 },
];

const ROW3: KeyDef[] = [
  { label: "CapsLock", display: "⇪", type: "caps", width: 1.7, colorIndex: 8 },
  { label: "A", colorIndex: 9 }, { label: "S", colorIndex: 0 }, { label: "D", colorIndex: 1 },
  { label: "F", colorIndex: 2 }, { label: "G", colorIndex: 3 }, { label: "H", colorIndex: 4 },
  { label: "J", colorIndex: 5 }, { label: "K", colorIndex: 6 }, { label: "L", colorIndex: 7 },
  { label: ";", colorIndex: 8 }, { label: "'", colorIndex: 9 },
  { label: "Enter", display: "↵", type: "enter", width: 2.1, colorIndex: 0 },
];

const ROW4: KeyDef[] = [
  { label: "Shift", display: "⇧", type: "shift", width: 2.3, colorIndex: 1 },
  { label: "Z", colorIndex: 2 }, { label: "X", colorIndex: 3 }, { label: "C", colorIndex: 4 },
  { label: "V", colorIndex: 5 }, { label: "B", colorIndex: 6 }, { label: "N", colorIndex: 7 },
  { label: "M", colorIndex: 8 }, { label: ",", colorIndex: 9 }, { label: ".", colorIndex: 0 },
  { label: "/", colorIndex: 1 },
  { label: "Shift", display: "⇧", type: "shift", width: 2.7, colorIndex: 2 },
];

const ROW5: KeyDef[] = [
  { label: "Ctrl", display: "Ctrl", type: "shift", width: 1.3, colorIndex: 3 },
  { label: "Alt", display: "Alt", type: "shift", width: 1.1, colorIndex: 4 },
  { label: " ", display: "", type: "space", width: 6.5, colorIndex: 5 },
  { label: "Alt", display: "Alt", type: "shift", width: 1.1, colorIndex: 6 },
  { label: "Ctrl", display: "Ctrl", type: "shift", width: 1.3, colorIndex: 7 },
];

const ALL_ROWS = [ROW1, ROW2, ROW3, ROW4, ROW5];

interface Keyboard3DProps {
  theme: KeyboardTheme;
  volume: number;
  rgbEnabled: boolean;
  onKeyPress?: (key: string) => void;
}

export function Keyboard3D({ theme, volume, rgbEnabled, onKeyPress }: Keyboard3DProps) {
  const lastKey = useRef<string>("");

  const handlePress = useCallback((label: string) => {
    lastKey.current = label;
    onKeyPress?.(label);
  }, [onKeyPress]);

  return (
    <div
      style={{
        background: theme.boardBg,
        border: `2px solid ${theme.boardBorder}`,
        borderRadius: "1rem",
        padding: "1.2rem 1rem",
        display: "inline-flex",
        flexDirection: "column",
        gap: "0.35rem",
        boxShadow: theme.hasGlow
          ? `0 0 40px ${theme.keyGlow}, 0 20px 60px rgba(0,0,0,0.8)`
          : "0 20px 60px rgba(0,0,0,0.7)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Board shine */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "30%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
        pointerEvents: "none",
        borderRadius: "1rem 1rem 0 0",
      }} />

      {ALL_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: "flex", gap: "0.22rem", alignItems: "center" }}>
          {row.map((key, keyIdx) => (
            <Key3D
              key={`${rowIdx}-${keyIdx}-${key.label}`}
              label={key.label}
              displayLabel={key.display ?? key.label}
              keyType={key.type ?? "letter"}
              theme={theme}
              width={key.width ?? 1}
              volume={volume}
              onPress={handlePress}
              colorIndex={key.colorIndex ?? keyIdx}
              rgbEnabled={rgbEnabled}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
