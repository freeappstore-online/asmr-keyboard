import { useState, useEffect, useCallback, useRef } from "react";
import { THEMES, getTheme, CANDY_COLORS, PASTEL_COLORS } from "./components/KeyboardThemes";
import type { ThemeId, KeyboardTheme } from "./components/KeyboardThemes";
import { Keyboard3D } from "./components/Keyboard3D";
import { Particles } from "./components/Particles";
import { startAmbience, stopAmbience, playKeySound } from "./components/AudioEngine";

// ─── Persistence ────────────────────────────────────────────────────────────
interface AppState {
  favorites: ThemeId[];
  volume: number;
  ambienceOn: boolean;
  rgbEnabled: boolean;
  typedText: string;
}

const STORAGE_KEY = "asmr_keyboard_state";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch {}
  return defaultState();
}

function defaultState(): AppState {
  return {
    favorites: [],
    volume: 0.8,
    ambienceOn: false,
    rgbEnabled: false,
    typedText: "",
  };
}

function saveState(s: AppState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Screen = "home" | "play" | "favorites";

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [screen, setScreen] = useState<Screen>("home");
  const [activeTheme, setActiveTheme] = useState<ThemeId>("honey");
  const [showSettings, setShowSettings] = useState(false);
  const ambienceRef = useRef(false);

  const update = useCallback((patch: Partial<AppState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  // Ambience control
  useEffect(() => {
    if (screen === "play" && state.ambienceOn) {
      if (!ambienceRef.current) {
        startAmbience(activeTheme, 0.12);
        ambienceRef.current = true;
      }
    } else {
      if (ambienceRef.current) {
        stopAmbience();
        ambienceRef.current = false;
      }
    }
  }, [screen, state.ambienceOn, activeTheme]);

  useEffect(() => {
    return () => { stopAmbience(); };
  }, []);

  const theme = getTheme(activeTheme);

  // Physical keyboard support on play screen
  useEffect(() => {
    if (screen !== "play") return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const keyType =
        e.key === " " ? "space" as const :
        e.key === "Enter" ? "enter" as const :
        e.key === "Backspace" ? "backspace" as const :
        e.key === "Shift" ? "shift" as const :
        e.key === "CapsLock" ? "caps" as const : "letter" as const;
      playKeySound(activeTheme, keyType, state.volume);

      setState(prev => {
        let newText = prev.typedText;
        if (e.key === "Backspace") {
          newText = prev.typedText.slice(0, -1);
        } else if (e.key === "Enter") {
          newText = prev.typedText + "\n";
        } else if (e.key.length === 1) {
          newText = prev.typedText + e.key;
        }
        const next = { ...prev, typedText: newText };
        saveState(next);
        return next;
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, activeTheme, state.volume]);

  const handleVirtualKeyPress = useCallback((key: string) => {
    setState(prev => {
      let newText = prev.typedText;
      if (key === "Backspace") {
        newText = prev.typedText.slice(0, -1);
      } else if (key === "Enter") {
        newText = prev.typedText + "\n";
      } else if (key === " " || key.length === 1) {
        newText = prev.typedText + key;
      }
      const next = { ...prev, typedText: newText };
      saveState(next);
      return next;
    });
  }, []);

  const toggleFavorite = (id: ThemeId) => {
    const favs = state.favorites.includes(id)
      ? state.favorites.filter(f => f !== id)
      : [...state.favorites, id];
    update({ favorites: favs });
  };

  // ── Screens ────────────────────────────────────────────────────────────────
  if (screen === "play") {
    return (
      <PlayScreen
        theme={theme}
        state={state}
        onUpdate={update}
        onBack={() => setScreen("home")}
        onKeyPress={handleVirtualKeyPress}
        onToggleFavorite={() => toggleFavorite(activeTheme)}
        isFavorite={state.favorites.includes(activeTheme)}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
    );
  }

  return (
    <HomeScreen
      state={state}
      onUpdate={update}
      onSelectTheme={(id) => { setActiveTheme(id); setScreen("play"); }}
      onToggleFavorite={toggleFavorite}
      screen={screen}
      setScreen={setScreen}
    />
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({
  state, onUpdate, onSelectTheme, onToggleFavorite, screen, setScreen
}: {
  state: AppState;
  onUpdate: (p: Partial<AppState>) => void;
  onSelectTheme: (id: ThemeId) => void;
  onToggleFavorite: (id: ThemeId) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
}) {
  const displayThemes = screen === "favorites"
    ? THEMES.filter(t => state.favorites.includes(t.id))
    : THEMES;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0015 0%, #15002a 50%, #0a0015 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Manrope, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: "2.5rem 2rem 1rem",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "Fraunces, serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: "900",
          background: "linear-gradient(135deg, #fff 0%, #cc88ff 50%, #88aaff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
          lineHeight: 1.1,
        }}>
          ✨ ASMR Keyboard ✨
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "0.75rem", fontSize: "1rem" }}>
          Choose your keyboard. Feel the click.
        </p>
      </header>

      {/* Nav tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "0.5rem 1rem 1.5rem" }}>
        {([
          { id: "home" as Screen, label: "⌨️ All Keyboards" },
          { id: "favorites" as Screen, label: "⭐ Favorites" },
        ] as { id: Screen; label: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setScreen(tab.id)} style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "2rem",
            border: "1px solid rgba(255,255,255,0.15)",
            background: screen === tab.id ? "rgba(150,80,255,0.3)" : "rgba(255,255,255,0.05)",
            color: screen === tab.id ? "#cc88ff" : "rgba(255,255,255,0.6)",
            fontFamily: "Manrope, sans-serif",
            fontWeight: "600",
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      <div style={{
        flex: 1,
        padding: "0 1.5rem 2rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.2rem",
        maxWidth: "1100px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {displayThemes.length === 0 ? (
          <div style={{
            gridColumn: "1/-1",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            padding: "4rem",
          }}>
            <div style={{ fontSize: "3rem" }}>⭐</div>
            <p style={{ marginTop: "1rem" }}>No favorites yet. Star a keyboard to save it here!</p>
          </div>
        ) : displayThemes.map(t => (
          <ThemeCard
            key={t.id}
            theme={t}
            isFavorite={state.favorites.includes(t.id)}
            onSelect={() => onSelectTheme(t.id)}
            onToggleFavorite={() => onToggleFavorite(t.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "1rem", color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>
        <a href="https://freeappstore.online" target="_blank" rel="noopener noreferrer"
          style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
          Part of FreeAppStore — free forever
        </a>
      </footer>
    </div>
  );
}

// ─── Theme Card ───────────────────────────────────────────────────────────────
function ThemeCard({ theme, isFavorite, onSelect, onToggleFavorite }: {
  theme: KeyboardTheme;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: theme.boardBg,
        border: `1px solid ${theme.boardBorder}`,
        borderRadius: "1.25rem",
        padding: "1.5rem",
        cursor: "pointer",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered
          ? `0 16px 40px rgba(0,0,0,0.6), 0 0 30px ${theme.keyGlow}`
          : "0 8px 24px rgba(0,0,0,0.5)",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={onSelect}
    >
      {/* Mini keyboard preview */}
      <div style={{ marginBottom: "1rem" }}>
        <MiniKeyboardPreview theme={theme} />
      </div>

      {/* Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{theme.emoji}</div>
          <h3 style={{
            fontFamily: "Fraunces, serif",
            color: theme.titleColor,
            fontSize: "1.3rem",
            margin: 0,
            fontWeight: "700",
          }}>
            {theme.name} Keyboard
          </h3>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
            {theme.tagline}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.3rem",
            cursor: "pointer",
            padding: "0.25rem",
            opacity: isFavorite ? 1 : 0.35,
            transition: "opacity 0.2s, transform 0.15s",
            transform: isFavorite ? "scale(1.2)" : "scale(1)",
          }}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          ⭐
        </button>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.65rem",
          borderRadius: "0.75rem",
          border: `1px solid ${theme.boardBorder}`,
          background: "rgba(255,255,255,0.08)",
          color: theme.titleColor,
          fontFamily: "Manrope, sans-serif",
          fontWeight: "700",
          fontSize: "0.9rem",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        ▶ Play
      </button>
    </div>
  );
}

// ─── Mini Keyboard Preview ────────────────────────────────────────────────────
function MiniKeyboardPreview({ theme }: { theme: KeyboardTheme }) {
  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["Z","X","C","V","B","N","M"],
  ];

  return (
    <div style={{
      background: theme.boardBg,
      borderRadius: "0.6rem",
      padding: "0.5rem 0.4rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.18rem",
      border: `1px solid ${theme.boardBorder}`,
    }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.12rem",
          paddingLeft: `${ri * 0.2}rem`,
        }}>
          {row.map((k, ki) => {
            let bg = theme.keyTop;
            if (theme.id === "candy") bg = CANDY_COLORS[(ri * 3 + ki) % CANDY_COLORS.length];
            if (theme.id === "pastel") bg = PASTEL_COLORS[(ri * 3 + ki) % PASTEL_COLORS.length];
            return (
              <div key={k} style={{
                width: "1.4rem",
                height: "1.2rem",
                background: bg,
                borderRadius: "0.2rem",
                border: `1px solid ${theme.keyBorder}`,
                boxShadow: `0 2px 0 ${theme.keySide}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.45rem",
                fontWeight: "700",
                color: theme.keyText,
              }}>
                {k}
              </div>
            );
          })}
        </div>
      ))}
      {/* Space bar */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "0.1rem" }}>
        <div style={{
          width: "6rem",
          height: "1rem",
          background: theme.id === "candy" ? CANDY_COLORS[5] : theme.id === "pastel" ? PASTEL_COLORS[5] : theme.keyTop,
          borderRadius: "0.2rem",
          border: `1px solid ${theme.keyBorder}`,
          boxShadow: `0 2px 0 ${theme.keySide}`,
        }} />
      </div>
    </div>
  );
}

// ─── Play Screen ──────────────────────────────────────────────────────────────
function PlayScreen({
  theme, state, onUpdate, onBack, onKeyPress, onToggleFavorite, isFavorite, showSettings, setShowSettings
}: {
  theme: KeyboardTheme;
  state: AppState;
  onUpdate: (p: Partial<AppState>) => void;
  onBack: () => void;
  onKeyPress: (key: string) => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }
  }, [state.typedText]);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.appBg,
      display: "flex",
      flexDirection: "column",
      fontFamily: "Manrope, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Particles for mystery theme */}
      {theme.hasParticles && <Particles color={theme.particleColor} active={true} />}

      {/* Glow overlay for crystal/mystery */}
      {theme.hasGlow && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 80%, ${theme.keyGlow.replace("0.8", "0.08")} 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }} />
      )}

      {/* Top bar */}
      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "0.75rem",
          color: "rgba(255,255,255,0.8)",
          padding: "0.45rem 0.9rem",
          cursor: "pointer",
          fontFamily: "Manrope, sans-serif",
          fontWeight: "600",
          fontSize: "0.85rem",
        }}>
          ← Back
        </button>

        <h2 style={{
          fontFamily: "Fraunces, serif",
          color: theme.titleColor,
          fontSize: "1.2rem",
          margin: 0,
          fontWeight: "700",
        }}>
          {theme.emoji} {theme.name} Keyboard
        </h2>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? "Remove favorite" : "Add to favorites"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.75rem",
              color: isFavorite ? "#ffd700" : "rgba(255,255,255,0.5)",
              padding: "0.45rem 0.7rem",
              cursor: "pointer",
              fontSize: "1rem",
              transition: "all 0.2s",
            }}
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? "rgba(150,80,255,0.3)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.75rem",
              color: "rgba(255,255,255,0.8)",
              padding: "0.45rem 0.7rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0.85rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1.2rem",
          alignItems: "center",
          flexShrink: 0,
        }}>
          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: "600" }}>
              🔊 Volume
            </span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={state.volume}
              onChange={e => onUpdate({ volume: parseFloat(e.target.value) })}
              style={{ width: "110px", accentColor: theme.titleColor }}
            />
            <span style={{ color: theme.titleColor, fontSize: "0.8rem", fontWeight: "700", minWidth: "2.5rem" }}>
              {Math.round(state.volume * 100)}%
            </span>
          </div>

          {/* Ambience */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <ToggleSwitch
              value={state.ambienceOn}
              onChange={v => onUpdate({ ambienceOn: v })}
              color={theme.titleColor}
            />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: "600" }}>
              🎵 Ambience
            </span>
          </label>

          {/* RGB */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <ToggleSwitch
              value={state.rgbEnabled}
              onChange={v => onUpdate({ rgbEnabled: v })}
              color={theme.titleColor}
            />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: "600" }}>
              🌈 RGB Glow
            </span>
          </label>

          {/* Clear text */}
          <button
            onClick={() => onUpdate({ typedText: "" })}
            style={{
              background: "rgba(255,60,60,0.15)",
              border: "1px solid rgba(255,60,60,0.3)",
              borderRadius: "0.75rem",
              color: "#ff8888",
              padding: "0.4rem 0.9rem",
              cursor: "pointer",
              fontFamily: "Manrope, sans-serif",
              fontSize: "0.8rem",
              fontWeight: "600",
            }}
          >
            🗑️ Clear text
          </button>
        </div>
      )}

      {/* Text display */}
      <div style={{
        position: "relative",
        zIndex: 5,
        padding: "0.75rem 1.25rem 0.25rem",
        flexShrink: 0,
      }}>
        <textarea
          ref={textAreaRef}
          readOnly
          value={state.typedText}
          placeholder="Start typing… click the keys below or use your physical keyboard ⌨️"
          style={{
            width: "100%",
            minHeight: "3.5rem",
            maxHeight: "6rem",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.75rem",
            color: theme.titleColor,
            fontFamily: "Manrope, monospace",
            fontSize: "0.95rem",
            padding: "0.65rem 1rem",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: 1.6,
          }}
        />
      </div>

      {/* Keyboard area */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem 0.5rem 0.75rem",
        position: "relative",
        zIndex: 5,
        overflowX: "auto",
        overflowY: "hidden",
      }}>
        <div style={{
          transform: "perspective(900px) rotateX(7deg)",
          transformOrigin: "center bottom",
          filter: `drop-shadow(0 25px 50px rgba(0,0,0,0.9))`,
        }}>
          <Keyboard3D
            theme={theme}
            volume={state.volume}
            rgbEnabled={state.rgbEnabled}
            onKeyPress={onKeyPress}
          />
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "relative",
        zIndex: 5,
        textAlign: "center",
        padding: "0 1rem 0.75rem",
        color: "rgba(255,255,255,0.2)",
        fontSize: "0.72rem",
        flexShrink: 0,
      }}>
        Click keys or type on your physical keyboard · Mouse &amp; touch supported
      </div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onChange, color }: {
  value: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: "2.5rem",
        height: "1.4rem",
        borderRadius: "1rem",
        background: value ? color : "rgba(255,255,255,0.15)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{
        position: "absolute",
        top: "2px",
        left: value ? "calc(100% - 1.1rem - 2px)" : "2px",
        width: "1.1rem",
        height: "1.1rem",
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}
