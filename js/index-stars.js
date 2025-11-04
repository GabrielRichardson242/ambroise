import { Config } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('rooms');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, deviceRatio = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let edges = [];
  let hoverIdx = -1;
  let focusIdx = -1;
  let zoom = 1;
  let zoomTarget = 1;
  let viewX = null, viewY = null; // smoothed pan center during zoom
  let becameImmersiveAt = null; // for pop-in animation timing
  let mouseX = -1, mouseY = -1, lerpX = 0, lerpY = 0;
  let startTime = performance.now();

  function isImmersive() {
    return document.body && document.body.hasAttribute('data-immersive');
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * deviceRatio);
    canvas.height = Math.floor(height * deviceRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
  }

  async function fetchRooms() {
    const endpoints = [
      `${Config.apiBaseUrl}/rooms/public`,
      `${Config.apiBaseUrl}/rooms`
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) return data;
          if (Array.isArray(data.items)) return data.items;
        }
      } catch (_) {}
    }
    return [
      { id: 'demo-1', title: 'Singularity', owner: 'Ambroise' },
      { id: 'demo-2', title: 'Event Horizon', owner: 'Ambroise' },
      { id: 'demo-3', title: 'Particle Drift', owner: 'Ambroise' },
      { id: 'demo-4', title: 'Quantum Foam', owner: 'Ambroise' },
      { id: 'demo-5', title: 'Neutrino Rain', owner: 'Ambroise' }
    ];
  }

  function seedRand(seed) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  function layoutNodes(rooms) {
    const rng = seedRand(42);
    const count = Math.min(rooms.length, 48);
    const margin = 48;
    nodes = [];
    for (let i = 0; i < count; i++) {
      const rx = rng();
      const ry = rng();
      const x = margin + rx * (width - margin * 2);
      const y = margin + ry * (height - margin * 2);
      const depth = 0.4 + rng() * 1.2;
      const r = 2.4 + rng() * 2.8;
      const room = rooms[i % rooms.length];
      nodes.push({ x, y, r, d: depth, id: room.id, title: room.title || 'Untitled', seed: rng() * 1000 });
    }
    edges = buildMST(nodes);
  }

  // Build a readable global network: minimum spanning tree over base positions
  function buildMST(list) {
    const n = list.length;
    if (n === 0) return [];
    const inTree = new Array(n).fill(false);
    const dist = new Array(n).fill(Infinity);
    const parent = new Array(n).fill(-1);
    dist[0] = 0; // start at 0
    for (let k = 0; k < n; k++) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!inTree[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u === -1) break;
      inTree[u] = true;
      for (let v = 0; v < n; v++) if (!inTree[v]) {
        const dx = list[u].x - list[v].x;
        const dy = list[u].y - list[v].y;
        const d2 = dx*dx + dy*dy;
        if (d2 < dist[v]) { dist[v] = d2; parent[v] = u; }
      }
    }
    const out = [];
    for (let v = 1; v < n; v++) if (parent[v] !== -1) out.push([parent[v], v]);
    return out;
  }

  function draw() {
    const immersive = isImmersive();
    if (immersive && becameImmersiveAt == null) becameImmersiveAt = performance.now();
    if (!immersive) becameImmersiveAt = null;
    lerpX += ((mouseX < 0 ? width * 0.5 : mouseX) - lerpX) * 0.06;
    lerpY += ((mouseY < 0 ? height * 0.5 : mouseY) - lerpY) * 0.06;

    ctx.clearRect(0, 0, width, height);
    if (!immersive) return requestAnimationFrame(draw);

    const offX = (lerpX - width * 0.5) * 0.03;
    const offY = (lerpY - height * 0.5) * 0.03;

    hoverIdx = -1;
    let focusX = null, focusY = null;

    // Subtle node jitter/oscillation (original slower setting)
    const t = (performance.now() - startTime) * 0.0006;
    function posForNode(n) {
      const ox = Math.sin(t * (0.6 + n.d * 0.3) + n.seed) * 1.0;
      const oy = Math.cos(t * (0.45 + n.d * 0.2) + n.seed * 1.3) * 1.0;
      return { x: n.x + offX * n.d + ox, y: n.y + offY * n.d + oy };
    }
    // Compute transform center if focused
    let focusCenterX = null, focusCenterY = null;
    if (focusIdx >= 0 && nodes[focusIdx]) {
      const fn = nodes[focusIdx];
      focusCenterX = fn.x + offX * fn.d;
      focusCenterY = fn.y + offY * fn.d;
      zoomTarget = 1.65;
    } else {
      zoomTarget = 1;
    }
    // Smooth zoom
    zoom += (zoomTarget - zoom) * 0.08;
    // Smooth pan towards focus center when zoomed
    if (focusCenterX != null && focusCenterY != null) {
      if (viewX == null) { viewX = focusCenterX; viewY = focusCenterY; }
      viewX += (focusCenterX - viewX) * 0.12;
      viewY += (focusCenterY - viewY) * 0.12;
    } else {
      viewX = null; viewY = null;
    }

    // Apply zoom transform for drawing
    if (zoom > 1.001 && viewX != null) {
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-viewX, -viewY);
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const osc = Math.sin(t * (0.5 + n.d * 0.4) + n.seed) * 2.5;
      const osc2 = Math.cos(t * (0.35 + n.d * 0.25) + n.seed * 1.3) * 2.5;
      const px = n.x + offX * n.d + osc;
      const py = n.y + offY * n.d + osc2;
      // Pop-in easing per node once immersive begins
      let pop = 1;
      if (becameImmersiveAt != null) {
        const elapsed = performance.now() - becameImmersiveAt - (n.seed % 1) * 420; // stagger by seed
        const d = Math.max(0, Math.min(1, elapsed / 450));
        pop = d * d * (3 - 2 * d);
      }
      const dist = Math.hypot(px - mouseX, py - mouseY);
      const hovering = immersive && mouseX >= 0 && dist < Math.max(12, n.r * 3);
      const isHover = focusIdx >= 0 ? (i === focusIdx) : hovering;
      if (isHover) {
        hoverIdx = i;
        focusX = n.x + offX * n.d; // stable focus (no jitter)
        focusY = n.y + offY * n.d;
      }
      
      // Core dot with subtle glow and pop ripple
      const baseR = n.r + 1.2;
      const dotR = baseR * (0.75 + 0.25 * pop);

      // Glow
      if (pop > 0.01) {
        ctx.save();
        ctx.globalAlpha = 0.35 * pop;
        ctx.shadowColor = 'rgba(143,155,255,0.65)';
        ctx.shadowBlur = 12 * pop;
        ctx.fillStyle = '#8f9bff';
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // White core
      ctx.beginPath();
      ctx.globalAlpha = Math.max(0.6, pop);
      ctx.fillStyle = '#ffffff';
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();

      // Pop-in ripple ring (during appearance only)
      if (becameImmersiveAt != null && pop < 1) {
        const ringAlpha = (1 - pop) * 0.5;
        const ringR = dotR + 6 + 8 * (1 - pop);
        ctx.beginPath();
        ctx.globalAlpha = ringAlpha;
        ctx.strokeStyle = 'rgba(143,155,255,0.8)';
        ctx.lineWidth = 1;
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (isHover) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#e8e8ea';
        ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.title, px + 10, py);
      }
    }

    // Publish lobe focus for starfield to read
    if (typeof window !== 'undefined') {
      if (focusIdx >= 0 && zoom > 1.05) {
        // In zoom mode we render a clean ring ourselves; disable stringy blueprint
        window.ambroiseLobeFocus = null;
      } else if (hoverIdx >= 0 && focusX != null && focusY != null) {
        window.ambroiseLobeFocus = { x: focusX, y: focusY };
      } else if (hoverIdx >= 0 && focusX != null && focusY != null) {
        window.ambroiseLobeFocus = { x: focusX, y: focusY };
      } else {
        window.ambroiseLobeFocus = null;
      }
    }

    // Background blue network appears on hover or while focused (with pop-in)
    const netPop = (becameImmersiveAt == null) ? 1 : Math.max(0, Math.min(1, (performance.now() - becameImmersiveAt - 180) / 520));
    if ((hoverIdx >= 0 || focusIdx >= 0) && netPop > 0.01) {
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 12]);
      ctx.lineDashOffset = -t * 6; // previous slow drift
      for (let e = 0; e < edges.length; e++) {
        const [i, j] = edges[e];
        const ni = nodes[i], nj = nodes[j];
        const ix = ni.x + offX * ni.d + Math.sin(t * (0.5 + ni.d * 0.4) + ni.seed) * 2.5;
        const iy = ni.y + offY * ni.d + Math.cos(t * (0.35 + ni.d * 0.25) + ni.seed * 1.3) * 2.5;
        const jx = nj.x + offX * nj.d + Math.sin(t * (0.5 + nj.d * 0.4) + nj.seed) * 2.5;
        const jy = nj.y + offY * nj.d + Math.cos(t * (0.35 + nj.d * 0.25) + nj.seed * 1.3) * 2.5;
        ctx.strokeStyle = `rgba(143,155,255,${(0.24*netPop).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(ix, iy);
        ctx.lineTo(jx, jy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // When zoomed: draw a clean tight ring around the focused star
    if (zoom > 1.05 && focusIdx >= 0) {
      const fn = nodes[focusIdx];
      const cx = fn.x + offX * fn.d; // stable center (no jitter)
      const cy = fn.y + offY * fn.d;
      const ringR = (fn.r + 6);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(143,155,255,0.65)';
      ctx.lineWidth = 1.6;
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (zoom > 1.001 && viewX != null) {
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function onClick() {
    if (!isImmersive()) return;
    // Prototype behavior: no navigation
    // First click: zoom into the hovered point
    if (focusIdx === -1 && hoverIdx >= 0) { focusIdx = hoverIdx; return; }
    // Second click: exit zoom (regardless of target)
    if (focusIdx >= 0) { focusIdx = -1; zoomTarget = 1; return; }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && focusIdx >= 0) {
      focusIdx = -1; zoomTarget = 1;
    }
  }

  window.addEventListener('resize', () => { resize(); layoutNodes(nodes.map(n => ({ id: n.id, title: n.title }))); });
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1; });
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKeyDown);

  (async function init() {
    resize();
    const rooms = await fetchRooms();
    layoutNodes(rooms);
    draw();
  })();
});


