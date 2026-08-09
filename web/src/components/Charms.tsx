import { useEffect, useRef } from "react";
import type { ThemeId } from "./KeyboardThemes";

// ─── Charm types ─────────────────────────────────────────────────────────────
type CharmKind = "cloud" | "candy" | "snowflake" | "orb";

interface Charm {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  wobble: number;
  wobbleSpeed: number;
  kind: CharmKind;
  // orb pulse
  pulse: number;
  pulseSpeed: number;
  // candy color index
  colorIdx: number;
}

const CANDY_COLORS = ["#ff6eb4", "#ff4466", "#ffcc00", "#44ddff", "#88ff66", "#ff8833"];
const CANDY_STRIPE = ["#fff", "#ffeeee"];

function kindForTheme(themeId: ThemeId): CharmKind {
  if (themeId === "cloud") return "cloud";
  if (themeId === "candy") return "candy";
  if (themeId === "crystal") return "snowflake";
  if (themeId === "mystery") return "orb";
  return "cloud";
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function drawCloud(ctx: CanvasRenderingContext2D, c: Charm) {
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(c.x, c.y);

  const s = c.size;
  // Soft white/blue cloud shape from overlapping circles
  const gradient = ctx.createRadialGradient(0, 0, s * 0.1, 0, -s * 0.1, s * 1.1);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.6, "rgba(210,235,255,0.8)");
  gradient.addColorStop(1, "rgba(180,210,255,0)");

  ctx.fillStyle = gradient;

  // Main body
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();

  // Puffs
  ctx.beginPath();
  ctx.arc(-s * 0.65, s * 0.2, s * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(s * 0.65, s * 0.2, s * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-s * 0.3, -s * 0.3, s * 0.75, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(s * 0.3, -s * 0.35, s * 0.72, 0, Math.PI * 2);
  ctx.fill();

  // Tiny shine dot
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.25, s * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fill();

  ctx.restore();
}

function drawCandy(ctx: CanvasRenderingContext2D, c: Charm) {
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rotation);

  const s = c.size;
  const col = CANDY_COLORS[c.colorIdx % CANDY_COLORS.length];

  // Lollipop circle
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();

  // Stripe overlay (clip to circle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = -3; i <= 3; i++) {
    ctx.fillRect(i * s * 0.55 - s * 0.15, -s * 1.2, s * 0.28, s * 2.4);
  }
  ctx.restore();

  // Shine
  ctx.beginPath();
  ctx.arc(-s * 0.28, -s * 0.28, s * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  // Stick
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.5);
  ctx.lineTo(s * 1.6, s * 1.6);
  ctx.strokeStyle = "#d4a060";
  ctx.lineWidth = s * 0.22;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, c: Charm) {
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(c.x, c.y);
  ctx.rotate(c.rotation);

  const s = c.size;
  const arms = 6;

  ctx.strokeStyle = `rgba(180,230,255,0.9)`;
  ctx.lineWidth = s * 0.13;
  ctx.lineCap = "round";

  for (let i = 0; i < arms; i++) {
    ctx.save();
    ctx.rotate((i / arms) * Math.PI * 2);

    // Main arm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -s);
    ctx.stroke();

    // Side branches
    const branchPositions = [0.38, 0.65];
    for (const bp of branchPositions) {
      const by = -s * bp;
      const bl = s * 0.28;
      ctx.beginPath();
      ctx.moveTo(-bl, by);
      ctx.lineTo(bl, by);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(220,245,255,0.95)";
  ctx.fill();

  // Tip dots
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * s, Math.sin(angle) * s, s * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,240,255,0.85)";
    ctx.fill();
  }

  ctx.restore();
}

function drawOrb(ctx: CanvasRenderingContext2D, c: Charm) {
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.translate(c.x, c.y);

  const s = c.size * (1 + Math.sin(c.pulse) * 0.12);

  // Outer glow
  const outerGlow = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 1.8);
  outerGlow.addColorStop(0, "rgba(180,80,255,0.0)");
  outerGlow.addColorStop(0.4, "rgba(140,60,220,0.18)");
  outerGlow.addColorStop(1, "rgba(80,0,160,0)");
  ctx.beginPath();
  ctx.arc(0, 0, s * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // Core orb
  const grd = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.05, 0, 0, s);
  grd.addColorStop(0, "rgba(230,180,255,0.95)");
  grd.addColorStop(0.35, "rgba(160,60,255,0.85)");
  grd.addColorStop(0.75, "rgba(80,0,180,0.7)");
  grd.addColorStop(1, "rgba(30,0,80,0.3)");

  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Specular
  ctx.beginPath();
  ctx.arc(-s * 0.3, -s * 0.3, s * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  // Inner swirl lines
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(200,140,255,0.3)";
  ctx.lineWidth = s * 0.08;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(s * 0.1, s * 0.1, s * (0.3 + i * 0.22), 0.3 + i * 0.4, Math.PI * 1.2 + i * 0.4);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CharmsProps {
  themeId: ThemeId;
}

export function Charms({ themeId }: CharmsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ charms: Charm[]; frame: number; raf: number }>({
    charms: [],
    frame: 0,
    raf: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const state = stateRef.current;
    const kind = kindForTheme(themeId);

    function resize() {
      const parent = canvas!.parentElement!;
      canvas!.width = parent.clientWidth;
      canvas!.height = parent.clientHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    function spawnCharm() {
      const W = canvas!.width;
      const H = canvas!.height;
      const size =
        kind === "cloud" ? 12 + Math.random() * 14 :
        kind === "candy" ? 8 + Math.random() * 10 :
        kind === "snowflake" ? 10 + Math.random() * 12 :
        8 + Math.random() * 11;

      const maxLife = kind === "cloud"
        ? 280 + Math.random() * 200
        : kind === "orb"
        ? 220 + Math.random() * 180
        : 200 + Math.random() * 160;

      state.charms.push({
        x: size + Math.random() * (W - size * 2),
        y: H + size * 2,
        vx: (Math.random() - 0.5) * (kind === "cloud" ? 0.5 : 0.8),
        vy: -(0.4 + Math.random() * (kind === "cloud" ? 0.7 : 1.0)),
        size,
        alpha: 0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * (kind === "candy" ? 0.025 : kind === "snowflake" ? 0.008 : 0.004),
        life: 0,
        maxLife,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.02,
        kind,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.04 + Math.random() * 0.03,
        colorIdx: Math.floor(Math.random() * CANDY_COLORS.length),
      });

      if (state.charms.length > 40) state.charms.splice(0, 1);
    }

    // Spawn initial batch so the screen is already populated
    const initCount = kind === "cloud" ? 18 : kind === "orb" ? 14 : 16;
    for (let i = 0; i < initCount; i++) {
      const W = canvas.width;
      const H = canvas.height;
      const size =
        kind === "cloud" ? 12 + Math.random() * 14 :
        kind === "candy" ? 8 + Math.random() * 10 :
        kind === "snowflake" ? 10 + Math.random() * 12 :
        8 + Math.random() * 11;
      const maxLife = 280 + Math.random() * 200;
      const life = Math.floor(Math.random() * maxLife * 0.7);
      state.charms.push({
        x: size + Math.random() * (W - size * 2),
        y: H * 0.05 + Math.random() * H * 0.85,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.4 + Math.random() * 0.6),
        size,
        alpha: 0.55 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * (kind === "candy" ? 0.025 : 0.008),
        life,
        maxLife,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.02,
        kind,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.04 + Math.random() * 0.03,
        colorIdx: Math.floor(Math.random() * CANDY_COLORS.length),
      });
    }

    let spawnTimer = 0;
    const spawnInterval = kind === "cloud" ? 55 : kind === "orb" ? 65 : 50;

    function tick() {
      const W = canvas!.width;
      const H = canvas!.height;
      state.frame++;
      ctx.clearRect(0, 0, W, H);

      spawnTimer++;
      if (spawnTimer > spawnInterval + Math.random() * 30) {
        spawnCharm();
        spawnTimer = 0;
      }

      state.charms = state.charms.filter((c) => c.life < c.maxLife);

      for (const c of state.charms) {
        c.life++;
        c.wobble += c.wobbleSpeed;
        c.rotation += c.rotSpeed;
        c.pulse += c.pulseSpeed;
        c.x += c.vx + Math.sin(c.wobble) * (kind === "cloud" ? 0.35 : 0.2);
        c.y += c.vy;

        // Fade in / fade out
        const fadeIn = 30;
        const fadeOut = 50;
        if (c.life < fadeIn) {
          c.alpha = Math.min(c.alpha + 0.03, 0.85);
        } else if (c.life > c.maxLife - fadeOut) {
          c.alpha = Math.max(c.alpha - 0.018, 0);
        }

        switch (c.kind) {
          case "cloud":     drawCloud(ctx, c);     break;
          case "candy":     drawCandy(ctx, c);     break;
          case "snowflake": drawSnowflake(ctx, c); break;
          case "orb":       drawOrb(ctx, c);       break;
        }
      }

      state.raf = requestAnimationFrame(tick);
    }

    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      state.charms = [];
    };
  }, [themeId]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
        borderRadius: "inherit",
      }}
    />
  );
}
