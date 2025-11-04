const canvas = document.getElementById('stars');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, deviceRatio = Math.min(window.devicePixelRatio || 1, 2);

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

  function drawHarmonicLobes(time) {
    const focus = typeof window !== 'undefined' ? window.ambroiseLobeFocus : null;
    if (!focus || !Number.isFinite(focus.x) || !Number.isFinite(focus.y)) return; // only on hover
    const cx = focus.x, cy = focus.y;

    const base = Math.min(width, height) * 0.19;
    const phaseX = time * 0.10; // slow
    const phaseY = time * 0.08; // slow
    const energy = 0.16; // subtle amplitude

    const configs = [
      { n: 3, m: 2, k: 0.32 * energy },
      { n: 4, m: 1, k: 0.22 * energy },
      { n: 5, m: 3, k: 0.16 * energy },
    ];
    const scales = [0.92, 1.0, 1.08];

    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const cfg of configs) {
      for (const scale of scales) {
        // Set 1
        ctx.beginPath();
        let first = true;
        for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.010) {
          const r = base * scale * (1 + cfg.k * Math.sin(cfg.n * t + phaseX) * Math.cos(cfg.m * t + phaseY));
          const x = cx + r * Math.cos(t);
          const y = cy + r * Math.sin(t);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(136,165,255,0.20)';
        ctx.stroke();

        // Set 2 (quarter turn phase offset)
        ctx.beginPath();
        first = true;
        for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.010) {
          const r = base * scale * (1 + cfg.k * Math.sin(cfg.n * (t + Math.PI * 0.25) + phaseY) * Math.cos(cfg.m * (t + Math.PI * 0.25) + phaseX));
          const x = cx + r * Math.cos(t);
          const y = cy + r * Math.sin(t);
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(136,165,255,0.16)';
        ctx.stroke();
      }
    }

    // Meridian arcs
    for (let k = 0; k < 4; k++) {
      const rot = (k / 4) * Math.PI;
      ctx.beginPath();
      for (let t = -base * 1.2; t <= base * 1.2; t += 6) {
        const x = cx + Math.cos(rot) * t;
        const y = cy + Math.sin(rot) * t * 0.55;
        if (t === -base * 1.2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(136,165,255,0.06)';
      ctx.stroke();
    }
  }

  function step() {
    const immersive = isImmersive();
    // Solid clear; star background disabled for clean look
    ctx.clearRect(0, 0, width, height);
    if (immersive) {
      const time = performance.now() * 0.001;
      drawHarmonicLobes(time);
    }
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  resize();
  step();
}


