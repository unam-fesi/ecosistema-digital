/* ============================================================
 * DEU · Background animado "Ruta del Aval Académico" (tema claro)
 * Registro → Revisión → Validación → Aval
 *
 * Canvas decorativo sobre fondo BLANCO, sin librerías. Portable
 * a React (ver notas al final). Nodos conectados por líneas, con
 * palomitas de verificación, siluetas de documentos, parallax
 * sutil, ~30fps, responsive, respeta prefers-reduced-motion,
 * pausa en pestaña oculta, aria-hidden y pointer-events:none.
 *
 * Uso:
 *   <div id="deu-bg"></div>
 *   DEUBackground.mount(document.getElementById('deu-bg'));
 * ============================================================ */
(function (global) {
  "use strict";

  const P = {
    navy: "#062B5C", deep: "#031A38", navy2: "#0A4A87",
    gold: "#D5A021", goldLight: "#F0C75E", white: "#FFFFFF",
  };

  function create(container, opts) {
    opts = opts || {};
    const reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

    container.style.position = container.style.position || "fixed";
    if (container.id === "deu-bg" && !opts.inline) {
      Object.assign(container.style, { inset: "0", zIndex: "0", overflow: "hidden" });
    }
    container.setAttribute("aria-hidden", "true");
    container.style.pointerEvents = "none";
    // Fondo BLANCO institucional con tenues realces navy + oro
    container.style.background =
      "radial-gradient(1100px 680px at 10% -8%, rgba(10,74,135,.12), transparent 60%)," +
      "radial-gradient(1000px 760px at 110% 4%, rgba(213,160,33,.12), transparent 55%)," +
      "radial-gradient(900px 700px at 50% 120%, rgba(6,43,92,.06), transparent 60%)," +
      "linear-gradient(160deg, #ffffff 0%, #f4f8fd 55%, #eaf1f9 100%)";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", display: "block" });
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, DPR = 1;
    let nodes = [], docs = [], routePts = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let linkDist = 200;

    function countFor(w) {
      if (w < 560) return { n: 18, docs: 5, link: 140 };
      if (w < 960) return { n: 28, docs: 7, link: 175 };
      return { n: 42, docs: 10, link: 205 };
    }
    function rand(a, b) { return a + (b - a) * Math.random(); }

    function resize() {
      const r = container.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      DPR = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      const cfg = countFor(W);
      linkDist = cfg.link;
      nodes = [];
      for (let i = 0; i < cfg.n; i++) {
        nodes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-0.24, 0.24), vy: rand(-0.20, 0.20),
          r: rand(1.8, 3.6),
          depth: rand(0.25, 1),
          gold: Math.random() < 0.4,
          verifyT: 0,
          verifyCooldown: rand(2, 9),
          pulse: Math.random() * Math.PI * 2,
        });
      }
      docs = [];
      for (let i = 0; i < cfg.docs; i++) {
        docs.push({ x: rand(0, W), y: rand(0, H), w: rand(34, 62), vy: rand(-0.06, -0.025), depth: rand(0.2, 0.7), rot: rand(-0.12, 0.12) });
      }
      routePts = [];
      const steps = 5, marginX = W * 0.1, spanX = W * 0.8, baseY = H * 0.82, riseY = H * 0.5;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        routePts.push({ x: marginX + spanX * t, y: baseY - riseY * t + Math.sin(t * 3) * (H * 0.03) });
      }
    }

    function drawDoc(d, ox, oy) {
      const x = d.x + ox * d.depth, y = d.y + oy * d.depth;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(d.rot);
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = P.navy2; ctx.lineWidth = 1.1;
      const w = d.w, h = d.w * 1.3, fold = w * 0.28;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2 - fold, -h / 2);
      ctx.lineTo(w / 2, -h / 2 + fold); ctx.lineTo(w / 2, h / 2);
      ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 4; i++) {
        const ly = -h / 2 + h * 0.32 + i * (h * 0.14);
        ctx.beginPath(); ctx.moveTo(-w / 2 + 6, ly); ctx.lineTo(w / 2 - 6, ly); ctx.stroke();
      }
      ctx.restore();
    }

    function drawCheck(x, y, s, t) {
      const a1 = { x: x - s * 0.55, y: y + s * 0.05 };
      const a2 = { x: x - s * 0.15, y: y + s * 0.45 };
      const a3 = { x: x + s * 0.6, y: y - s * 0.5 };
      ctx.save();
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.globalAlpha = Math.min(1, t * 1.4);
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y);
      if (t < 0.5) { const k = t / 0.5; ctx.lineTo(a1.x + (a2.x - a1.x) * k, a1.y + (a2.y - a1.y) * k); }
      else { ctx.lineTo(a2.x, a2.y); const k = (t - 0.5) / 0.5; ctx.lineTo(a2.x + (a3.x - a2.x) * k, a2.y + (a3.y - a2.y) * k); }
      ctx.stroke();
      ctx.globalAlpha = (1 - Math.abs(t - 0.5) * 2) * 0.35;
      ctx.beginPath(); ctx.arc(x, y, s * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    }

    let routeT = 0;
    function drawRoute(ox, oy, dt) {
      routeT += dt * 0.07; if (routeT > 1.4) routeT = 0;
      ctx.save();
      ctx.globalAlpha = 0.16; ctx.strokeStyle = P.gold; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < routePts.length; i++) {
        const px = routePts[i].x + ox * 0.5, py = routePts[i].y + oy * 0.5;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      const seg = routeT * (routePts.length - 1);
      const i0 = Math.min(routePts.length - 2, Math.floor(seg));
      const f = seg - i0;
      if (i0 >= 0 && routeT <= 1) {
        const a = routePts[i0], b = routePts[i0 + 1];
        const px = a.x + (b.x - a.x) * f + ox * 0.5, py = a.y + (b.y - a.y) * f + oy * 0.5;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 24);
        g.addColorStop(0, P.gold); g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.8; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.7; ctx.fillStyle = P.gold;
        for (let k = 0; k <= i0; k++) { ctx.beginPath(); ctx.arc(routePts[k].x + ox * 0.5, routePts[k].y + oy * 0.5, 2.6, 0, Math.PI * 2); ctx.fill(); }
      }
      if (routeT > 1) {
        const last = routePts[routePts.length - 1];
        drawCheck(last.x + ox * 0.5, last.y + oy * 0.5, 13, Math.min(1, (routeT - 1) / 0.4));
      }
      ctx.restore();
    }

    let raf = 0, last = 0, running = true;
    const FRAME = 33;

    function step(now) {
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (now - last < FRAME) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const ox = (mouse.x - 0.5) * 46, oy = (mouse.y - 0.5) * 46;

      ctx.clearRect(0, 0, W, H);

      for (const d of docs) { d.y += d.vy; if (d.y < -80) { d.y = H + 60; d.x = rand(0, W); } drawDoc(d, ox, oy); }
      drawRoute(ox, oy, dt);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
        n.pulse += dt * 1.8;
        if (n.verifyT > 0) { n.verifyT += dt * 0.8; if (n.verifyT > 1.6) { n.verifyT = 0; n.verifyCooldown = rand(5, 15); } }
        else { n.verifyCooldown -= dt; if (n.verifyCooldown <= 0) n.verifyT = 0.001; }
      }

      // conexiones (líneas navy finas, visibles sobre blanco)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i], ax = a.x + ox * a.depth, ay = a.y + oy * a.depth;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], bx = b.x + ox * b.depth, by = b.y + oy * b.depth;
          const dx = ax - bx, dy = ay - by, dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const al = (1 - dist / linkDist) * 0.22;
            ctx.strokeStyle = "rgba(10,74,135," + al.toFixed(3) + ")";
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const x = n.x + ox * n.depth, y = n.y + oy * n.depth;
        if (n.verifyT > 0) {
          drawCheck(x, y, 7 + n.r, Math.min(1, n.verifyT / 1.1));
        } else {
          const tw = 0.5 + 0.5 * Math.sin(n.pulse);
          ctx.globalAlpha = 0.45 + tw * 0.4;
          ctx.fillStyle = n.gold ? P.gold : P.navy2;
          ctx.beginPath(); ctx.arc(x, y, n.r, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = (0.10 + tw * 0.12);
          ctx.beginPath(); ctx.arc(x, y, n.r * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = n.gold ? P.gold : P.navy2; ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      for (const d of docs) drawDoc(d, 0, 0);
      ctx.globalAlpha = 0.16; ctx.strokeStyle = P.gold; ctx.lineWidth = 1.4;
      ctx.beginPath(); routePts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDist) { ctx.globalAlpha = (1 - dist / linkDist) * 0.18; ctx.strokeStyle = P.navy2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (const n of nodes) { ctx.globalAlpha = 0.6; ctx.fillStyle = n.gold ? P.gold : P.navy2; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }

    function onMove(e) { const p = e.touches ? e.touches[0] : e; mouse.tx = p.clientX / global.innerWidth; mouse.ty = p.clientY / global.innerHeight; }
    function onVisibility() {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(step); }
    }
    let rt;
    function onResize() { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduce) drawStatic(); }, 180); }

    resize();
    if (reduce) { drawStatic(); }
    else { global.addEventListener("pointermove", onMove, { passive: true }); running = true; raf = requestAnimationFrame(step); }
    global.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return {
      destroy: function () {
        running = false; cancelAnimationFrame(raf);
        global.removeEventListener("pointermove", onMove);
        global.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  }

  const DEUBackground = { mount: function (el, opts) { return create(el || document.getElementById("deu-bg"), opts); } };
  if (document.readyState !== "loading") tryAuto(); else document.addEventListener("DOMContentLoaded", tryAuto);
  function tryAuto() { const el = document.getElementById("deu-bg"); if (el && !el.dataset.mounted) { el.dataset.mounted = "1"; create(el, {}); } }
  if (typeof module !== "undefined" && module.exports) module.exports = DEUBackground;
  global.DEUBackground = DEUBackground;
})(typeof window !== "undefined" ? window : this);

/* ── React ──
 * export function DEUBackground(){
 *   const ref = useRef(null);
 *   useEffect(() => { const bg = window.DEUBackground.mount(ref.current); return () => bg.destroy(); }, []);
 *   return <div ref={ref} aria-hidden="true" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}} />;
 * }
 */
