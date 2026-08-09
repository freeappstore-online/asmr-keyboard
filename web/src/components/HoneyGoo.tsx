import { useEffect, useRef } from "react";

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
  radius: number;
  targetRadius: number;
  y: number;
}

export function HoneyGoo({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    drops: Drop[];
    pools: Pool[];
    frame: number;
    raf: number;
    active: boolean;
    initialized: boolean;
  }>({ drops: [], pools: [], frame: 0, raf: 0, active: false, initialized: false });

  useEffect(() => {
    stateRef.current.active = active;
  }, [active]);

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

    // ── Pre-fill goo on load ──────────────────────────────────────────────
    function prefill() {
      const W = canvas!.width;
      const H = canvas!.height;
      // Spawn a dense layer of pools along the bottom
      const poolCount = 22;
      for (let i = 0; i < poolCount; i++) {
        const x = 20 + (i / (poolCount - 1)) * (W - 40) + (Math.random() - 0.5) * 30;
        const r = 28 + Math.random() * 32;
        state.pools.push({ x, radius: r * 0.9, targetRadius: r, y: H - 14 });
      }
      // A few mid-drip drops already on screen
      for (let i = 0; i < 10; i++) {
        const x = 30 + Math.random() * (W - 60);
        const y = H * 0.15 + Math.random() * H * 0.65;
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
        // Give each a pre-built tail
        const tailLen = 8 + Math.floor(Math.random() * 10);
        for (let t = tailLen; t >= 0; t--) {
          d.tail.push({ x: d.x + (Math.random() - 0.5) * 2, y: d.y - t * 7 });
        }
        state.drops.push(d);
      }
    }

    function spawnDrop() {
      const W = canvas!.width;
      const x = 30 + Math.random() * (W - 60);
      state.drops.push({
        x,
        y: -10,
        vy: 0.4 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        radius: 6 + Math.random() * 8,
        tail: [],
        settled: false,
        alpha: 0.82 + Math.random() * 0.15,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.04,
      });
      if (state.drops.length > 28) state.drops.splice(0, 1);
    }

    function addToPool(x: number, r: number) {
      const near = state.pools.find((p) => Math.abs(p.x - x) < 60);
      if (near) {
        near.targetRadius = Math.min(near.targetRadius + r * 0.6, 62);
      } else {
        const H = canvas!.height;
        state.pools.push({ x, radius: r * 0.5, targetRadius: r + 8, y: H - 14 });
        if (state.pools.length > 28) state.pools.splice(0, 1);
      }
    }

    function drawDrop(drop: Drop) {
      ctx.save();
      ctx.globalAlpha = drop.alpha;

      // Tail streak
      if (drop.tail.length > 1) {
        const grad = ctx.createLinearGradient(
          drop.tail[0].x, drop.tail[0].y,
          drop.x, drop.y
        );
        grad.addColorStop(0, "rgba(230,160,0,0)");
        grad.addColorStop(1, "rgba(255,185,0,0.55)");
        ctx.beginPath();
        ctx.moveTo(drop.tail[0].x, drop.tail[0].y);
        for (let i = 1; i < drop.tail.length; i++) {
          const t = drop.tail[i];
          const prev = drop.tail[i - 1];
          const cx = (prev.x + t.x) / 2;
          const cy = (prev.y + t.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
        }
        ctx.quadraticCurveTo(
          drop.tail[drop.tail.length - 1].x,
          drop.tail[drop.tail.length - 1].y,
          drop.x, drop.y
        );
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
        drop.x + wobX,
        drop.y + wobY + drop.radius * 0.15,
        drop.radius * 0.82,
        drop.radius,
        0, 0, Math.PI * 2
      );
      ctx.fillStyle = grd;
      ctx.fill();

      // Specular
      ctx.beginPath();
      ctx.ellipse(
        drop.x + wobX - drop.radius * 0.22,
        drop.y + wobY - drop.radius * 0.28,
        drop.radius * 0.22,
        drop.radius * 0.14,
        -0.5, 0, Math.PI * 2
      );
      ctx.fillStyle = "rgba(255,255,220,0.55)";
      ctx.fill();

      ctx.restore();
    }

    function drawPools() {
      const H = canvas!.height;
      for (const pool of state.pools) {
        if (pool.radius < pool.targetRadius) {
          pool.radius += (pool.targetRadius - pool.radius) * 0.035;
        }

        ctx.save();
        ctx.globalAlpha = 0.82;

        const grd = ctx.createRadialGradient(
          pool.x, pool.y - pool.radius * 0.2, pool.radius * 0.1,
          pool.x, pool.y, pool.radius
        );
        grd.addColorStop(0, "#ffe066");
        grd.addColorStop(0.5, "#f5a800");
        grd.addColorStop(1, "rgba(160,90,0,0.25)");

        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.radius, pool.radius * 0.38, 0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.ellipse(
          pool.x - pool.radius * 0.2,
          pool.y - pool.radius * 0.08,
          pool.radius * 0.3,
          pool.radius * 0.1,
          -0.3, 0, Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,200,0.4)";
        ctx.fill();

        ctx.restore();
        void H;
      }
    }

    // Pre-fill after first paint so canvas has correct size
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

      // Continuously spawn new drops
      spawnTimer++;
      if (spawnTimer > 42 + Math.random() * 45) {
        spawnDrop();
        spawnTimer = 0;
      }

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

        if (d.y + d.radius >= H - 10) {
          d.settled = true;
          addToPool(d.x, d.radius);
          state.drops.splice(i, 1);
          continue;
        }

        drawDrop(d);
      }

      drawPools();

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
