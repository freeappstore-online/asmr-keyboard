import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Drop {
  x: number;
  y: number;
  vy: number;
  vx: number;
  radius: number;
  tail: { x: number; y: number }[];
  settled: boolean;
  alpha: number;
  wobble: number;
  wobbleSpeed: number;
}

interface Pool {
  x: number;
  y: number;           // pools can appear at ANY y, not just bottom
  radius: number;
  targetRadius: number;
  angle: number;       // tilt for side pools
}

interface Streak {
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
  angle: number;
}

interface Blob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
  rotation: number;
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawDrop(ctx: CanvasRenderingContext2D, drop: Drop) {
  ctx.save();
  ctx.globalAlpha = drop.alpha;

  // Tail streak
  if (drop.tail.length > 1) {
    const grad = ctx.createLinearGradient(
      drop.tail[0].x, drop.tail[0].y,
      drop.x, drop.y
    );
    grad.addColorStop(0, "rgba(230,160,0,0)");
    grad.addColorStop(1, "rgba(255,185,0,0.5)");
    ctx.beginPath();
    ctx.moveTo(drop.tail[0].x, drop.tail[0].y);
    for (let i = 1; i < drop.tail.length; i++) {
      const t = drop.tail[i];
      const prev = drop.tail[i - 1];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + t.x) / 2, (prev.y + t.y) / 2);
    }
    ctx.lineTo(drop.x, drop.y);
    ctx.lineWidth = drop.radius * 0.55;
    ctx.strokeStyle = grad;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Blob body
  const wobX = Math.sin(drop.wobble) * drop.radius * 0.18;
  const wobY = Math.cos(drop.wobble * 1.3) * drop.radius * 0.12;
  const grd = ctx.createRadialGradient(
    drop.x + wobX - drop.radius * 0.25,
    drop.y + wobY - drop.radius * 0.3,
    drop.radius * 0.1,
    drop.x + wobX,
    drop.y + wobY,
    drop.radius
  );
  grd.addColorStop(0, "#ffe066");
  grd.addColorStop(0.45, "#f5a800");
  grd.addColorStop(1, "#b87000");

  ctx.beginPath();
  ctx.ellipse(
    drop.x + wobX, drop.y + wobY + drop.radius * 0.15,
    drop.radius * 0.82, drop.radius,
    0, 0, Math.PI * 2
  );
  ctx.fillStyle = grd;
  ctx.fill();

  // Specular
  ctx.beginPath();
  ctx.ellipse(
    drop.x + wobX - drop.radius * 0.22,
    drop.y + wobY - drop.radius * 0.28,
    drop.radius * 0.22, drop.radius * 0.14,
    -0.5, 0, Math.PI * 2
  );
  ctx.fillStyle = "rgba(255,255,220,0.55)";
  ctx.fill();

  ctx.restore();
}

function drawPool(ctx: CanvasRenderingContext2D, pool: Pool) {
  if (pool.radius < pool.targetRadius) {
    pool.radius += (pool.targetRadius - pool.radius) * 0.035;
  }
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.translate(pool.x, pool.y);
  ctx.rotate(pool.angle);

  const grd = ctx.createRadialGradient(
    -pool.radius * 0.2, -pool.radius * 0.15, pool.radius * 0.05,
    0, 0, pool.radius
  );
  grd.addColorStop(0, "#ffe066");
  grd.addColorStop(0.5, "#f5a800");
  grd.addColorStop(1, "rgba(160,90,0,0.18)");

  ctx.beginPath();
  ctx.ellipse(0, 0, pool.radius, pool.radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Highlight
  ctx.beginPath();
  ctx.ellipse(
    -pool.radius * 0.2, -pool.radius * 0.08,
    pool.radius * 0.3, pool.radius * 0.1,
    -0.3, 0, Math.PI * 2
  );
  ctx.fillStyle = "rgba(255,255,200,0.38)";
  ctx.fill();

  ctx.restore();
}

function drawStreak(ctx: CanvasRenderingContext2D, s: Streak) {
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);

  const grad = ctx.createLinearGradient(0, 0, 0, s.h);
  grad.addColorStop(0, "rgba(255,200,0,0.0)");
  grad.addColorStop(0.3, "rgba(240,165,0,0.55)");
  grad.addColorStop(0.7, "rgba(200,130,0,0.45)");
  grad.addColorStop(1, "rgba(180,110,0,0.0)");

  ctx.beginPath();
  ctx.roundRect(-s.w / 2, 0, s.w, s.h, s.w / 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

function drawBlob(ctx: CanvasRenderingContext2D, b: Blob) {
  ctx.save();
  ctx.globalAlpha = b.alpha;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rotation);

  const grd = ctx.createRadialGradient(
    -b.rx * 0.25, -b.ry * 0.25, b.rx * 0.05,
    0, 0, Math.max(b.rx, b.ry)
  );
  grd.addColorStop(0, "#ffe566");
  grd.addColorStop(0.5, "#f0a200");
  grd.addColorStop(1, "rgba(150,85,0,0.12)");

  ctx.beginPath();
  ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Specular
  ctx.beginPath();
  ctx.ellipse(-b.rx * 0.22, -b.ry * 0.22, b.rx * 0.28, b.ry * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,200,0.4)";
  ctx.fill();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HoneyGoo({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    drops: Drop[];
    pools: Pool[];
    streaks: Streak[];
    blobs: Blob[];
    frame: number;
    raf: number;
    initialized: boolean;
  }>({ drops: [], pools: [], streaks: [], blobs: [], frame: 0, raf: 0, initialized: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const state = stateRef.current;

    function resize() {
      const parent = canvas!.parentElement!;
      canvas!.width = parent.clientWidth;
      canvas!.height = parent.clientHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // ── Spawn helpers ─────────────────────────────────────────────────────

    function spawnDrop(fromTop = true) {
      const W = canvas!.width;
      const H = canvas!.height;
      const x = 20 + Math.random() * (W - 40);
      // Drops can start at various heights, not just top
      const startY = fromTop ? -10 : Math.random() * H * 0.5;
      state.drops.push({
        x, y: startY,
        vy: 0.5 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.3,
        radius: 5 + Math.random() * 9,
        tail: [],
        settled: false,
        alpha: 0.8 + Math.random() * 0.18,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
      });
      if (state.drops.length > 35) state.drops.splice(0, 1);
    }

    function addPool(x: number, y: number, r: number) {
      // Clamp y so pools don't go off screen — but allow any row
      const clampedY = Math.min(Math.max(y, 12), canvas!.height - 8);
      const near = state.pools.find(
        (p) => Math.abs(p.x - x) < 55 && Math.abs(p.y - clampedY) < 22
      );
      if (near) {
        near.targetRadius = Math.min(near.targetRadius + r * 0.55, 58);
      } else {
        state.pools.push({
          x, y: clampedY,
          radius: r * 0.4,
          targetRadius: r + 8,
          angle: (Math.random() - 0.5) * 0.3,
        });
        if (state.pools.length > 40) state.pools.splice(0, 1);
      }
    }

    // ── Pre-fill: cover the whole board ──────────────────────────────────

    function prefill() {
      const W = canvas!.width;
      const H = canvas!.height;

      // --- Pools spread across ALL rows (not just bottom) ---
      const rows = 6;
      for (let row = 0; row < rows; row++) {
        const y = (H / (rows - 1)) * row + (Math.random() - 0.5) * (H / rows * 0.5);
        const count = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
          const x = 18 + (i / (count - 1)) * (W - 36) + (Math.random() - 0.5) * 28;
          const r = 18 + Math.random() * 28;
          state.pools.push({
            x,
            y: Math.min(Math.max(y, 12), H - 8),
            radius: r * 0.85,
            targetRadius: r,
            angle: (Math.random() - 0.5) * 0.35,
          });
        }
      }

      // --- Streaks: vertical drips across the whole board ---
      const streakCount = 18;
      for (let i = 0; i < streakCount; i++) {
        const x = 10 + Math.random() * (W - 20);
        const y = Math.random() * H * 0.7;
        state.streaks.push({
          x, y,
          w: 3 + Math.random() * 6,
          h: 30 + Math.random() * H * 0.45,
          alpha: 0.35 + Math.random() * 0.45,
          angle: (Math.random() - 0.5) * 0.12,
        });
      }

      // --- Blobs: random goo splats all over the board ---
      const blobCount = 22;
      for (let i = 0; i < blobCount; i++) {
        const x = 10 + Math.random() * (W - 20);
        const y = 10 + Math.random() * (H - 20);
        const rx = 10 + Math.random() * 22;
        const ry = rx * (0.3 + Math.random() * 0.5);
        state.blobs.push({
          x, y, rx, ry,
          alpha: 0.4 + Math.random() * 0.45,
          rotation: Math.random() * Math.PI,
        });
      }

      // --- Mid-air drops already dripping ---
      for (let i = 0; i < 12; i++) {
        const x = 20 + Math.random() * (W - 40);
        const y = Math.random() * H * 0.85;
        const d: Drop = {
          x, y,
          vy: 0.5 + Math.random() * 0.8,
          vx: (Math.random() - 0.5) * 0.2,
          radius: 5 + Math.random() * 9,
          tail: [],
          settled: false,
          alpha: 0.75 + Math.random() * 0.2,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.03 + Math.random() * 0.04,
        };
        const tailLen = 6 + Math.floor(Math.random() * 10);
        for (let t = tailLen; t >= 0; t--) {
          d.tail.push({ x: d.x + (Math.random() - 0.5) * 2, y: d.y - t * 7 });
        }
        state.drops.push(d);
      }
    }

    // Run prefill after first frame so canvas has correct dimensions
    requestAnimationFrame(() => {
      if (!state.initialized) {
        state.initialized = true;
        prefill();
      }
    });

    let spawnTimer = 0;

    function tick() {
      const W = canvas!.width;
      const H = canvas!.height;
      state.frame++;
      ctx.clearRect(0, 0, W, H);

      // Spawn new drops continuously
      spawnTimer++;
      if (spawnTimer > 38 + Math.random() * 40) {
        spawnDrop(true);
        spawnTimer = 0;
      }

      // Draw static streaks (permanent)
      for (const s of state.streaks) {
        drawStreak(ctx, s);
      }

      // Draw static blobs (permanent)
      for (const b of state.blobs) {
        drawBlob(ctx, b);
      }

      // Draw pools
      for (const p of state.pools) {
        drawPool(ctx, p);
      }

      // Update & draw drops
      for (let i = state.drops.length - 1; i >= 0; i--) {
        const d = state.drops[i];
        if (d.settled) continue;

        d.wobble += d.wobbleSpeed;
        d.vy = Math.min(d.vy + 0.045, 3.2);
        d.y += d.vy;
        d.x += d.vx;
        d.vx *= 0.98;

        if (state.frame % 3 === 0) {
          d.tail.push({ x: d.x, y: d.y });
          if (d.tail.length > 18) d.tail.shift();
        }

        if (d.y + d.radius >= H - 8) {
          d.settled = true;
          addPool(d.x, H - 10, d.radius);
          state.drops.splice(i, 1);
          continue;
        }

        drawDrop(ctx, d);
      }

      state.raf = requestAnimationFrame(tick);
    }

    state.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        borderRadius: "inherit",
      }}
    />
  );
}
