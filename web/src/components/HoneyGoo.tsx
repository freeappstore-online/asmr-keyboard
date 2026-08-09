import { useEffect, useRef } from "react";

// A canvas-based honey goo drip simulation layered over the keyboard.
// Uses a particle/blob system: drops form at the top, drip down, pool at bottom.

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
  }>({ drops: [], pools: [], frame: 0, raf: 0, active: false });

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

    function spawnDrop() {
      const W = canvas!.width;
      const H = canvas!.height;
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
      // cap drops
      if (state.drops.length > 22) state.drops.splice(0, 1);
      _ = H; // suppress unused
    }
    let _: number;

    function addToPool(x: number, r: number) {
      // find nearby pool to merge into
      const near = state.pools.find((p) => Math.abs(p.x - x) < 60);
      if (near) {
        near.targetRadius = Math.min(near.targetRadius + r * 0.6, 55);
      } else {
        const H = canvas!.height;
        state.pools.push({ x, radius: r * 0.5, targetRadius: r + 8, y: H - 14 });
        if (state.pools.length > 18) state.pools.splice(0, 1);
      }
    }

    function drawDrop(drop: Drop) {
      const W = canvas!.width;
      const H = canvas!.height;
      _ = W;

      ctx.save();
      ctx.globalAlpha = drop.alpha;

      // Draw tail (drip streak)
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
        const tailW = drop.radius * 0.55;
        ctx.lineWidth = tailW;
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
      // teardrop shape: slightly elongated downward
      ctx.ellipse(
        drop.x + wobX,
        drop.y + wobY + drop.radius * 0.15,
        drop.radius * 0.82,
        drop.radius,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = grd;
      ctx.fill();

      // Specular highlight
      ctx.beginPath();
      ctx.ellipse(
        drop.x + wobX - drop.radius * 0.22,
        drop.y + wobY - drop.radius * 0.28,
        drop.radius * 0.22,
        drop.radius * 0.14,
        -0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255,255,220,0.55)";
      ctx.fill();

      ctx.restore();
      _ = H;
    }

    function drawPools() {
      const H = canvas!.height;
      for (const pool of state.pools) {
        // Grow toward target
        if (pool.radius < pool.targetRadius) {
          pool.radius += (pool.targetRadius - pool.radius) * 0.04;
        }

        ctx.save();
        ctx.globalAlpha = 0.78;

        // Pool blob
        const grd = ctx.createRadialGradient(
          pool.x, pool.y - pool.radius * 0.2, pool.radius * 0.1,
          pool.x, pool.y, pool.radius
        );
        grd.addColorStop(0, "#ffe066");
        grd.addColorStop(0.5, "#f5a800");
        grd.addColorStop(1, "rgba(160,90,0,0.3)");

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
          -0.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,200,0.4)";
        ctx.fill();

        ctx.restore();
        _ = H;
      }
    }

    let spawnTimer = 0;

    function tick() {
      const W = canvas!.width;
      const H = canvas!.height;
      state.frame++;
      ctx.clearRect(0, 0, W, H);

      // Spawn new drops when active
      if (state.active) {
        spawnTimer++;
        if (spawnTimer > 38 + Math.random() * 50) {
          spawnDrop();
          spawnTimer = 0;
        }
      }

      // Update & draw drops
      for (let i = state.drops.length - 1; i >= 0; i--) {
        const d = state.drops[i];
        if (d.settled) continue;

        d.wobble += d.wobbleSpeed;
        d.vy = Math.min(d.vy + 0.045, 3.2); // gravity, viscous
        d.y += d.vy;
        d.x += d.vx;
        d.vx *= 0.98;

        // Record tail every few frames
        if (state.frame % 3 === 0) {
          d.tail.push({ x: d.x, y: d.y });
          if (d.tail.length > 18) d.tail.shift();
        }

        // Hit bottom
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
