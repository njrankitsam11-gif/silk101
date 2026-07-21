// ═══════════════════════════════════════════════════════════════
//   3D HYPER HERITAGE EFFECTS  —  IMMERSIVE WOW EDITION
//   hypereffects.js — auto-initializes on DOMContentLoaded
// ═══════════════════════════════════════════════════════════════

// ── A. MAGNETIC 3D CARD TILT WITH HOLOGRAPHIC SHEEN ────────────
function init3DCardMagneticTilt() {
  function applyTilt(card) {
    let shine = card.querySelector('.card-3d-shine');
    if (!shine) {
      shine = document.createElement('div');
      shine.className = 'card-3d-shine';
      card.style.position = card.style.position || 'relative';
      card.appendChild(shine);
    }
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * 14;
      const rotY = dx * 14;
      const brightness = 1 + (Math.abs(dx) + Math.abs(dy)) * 0.05;

      card.style.transition = 'transform 0.06s linear, box-shadow 0.06s, filter 0.06s';
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`;
      card.style.boxShadow = `
        ${-dx * 28}px ${-dy * 28}px 65px rgba(0,0,0,0.75),
        0 0 50px rgba(201,162,39,${0.05 + (Math.abs(dx) + Math.abs(dy)) * 0.1}),
        inset 0 0 0 1px rgba(201,162,39,${0.12 + Math.abs(dx) * 0.2})
      `;
      card.style.filter = `brightness(${brightness})`;

      // Prismatic sheen position
      const sx = ((dx + 1) / 2) * 100;
      const sy = ((dy + 1) / 2) * 100;
      shine.style.background = `radial-gradient(
        circle at ${sx}% ${sy}%,
        rgba(255,255,255,0.14) 0%,
        rgba(201,162,39,0.07) 28%,
        rgba(147,112,219,0.05) 55%,
        transparent 70%
      )`;
      shine.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.65s cubic-bezier(0.16,1,0.3,1), box-shadow 0.65s, filter 0.4s';
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.filter = '';
      shine.style.opacity = '0';
    });
  }

  const selectors = ['.meta-card', '.artisan-card', '.slide-content', '.entry-gate-card', '.secret-vault-card'];
  selectors.forEach(sel => document.querySelectorAll(sel).forEach(applyTilt));
}


// ── B. FLOATING 3D HERITAGE ARTIFACTS CANVAS ───────────────────
function initFloating3DHeritageArtifacts() {
  const target = document.getElementById('heritage-soul');
  if (!target) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-3d-artifacts';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.5;';
  target.style.position = 'relative';
  target.insertBefore(canvas, target.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, t = 0, mouseX = 0.5, mouseY = 0.5;

  function resize() { W = canvas.width = target.offsetWidth; H = canvas.height = target.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  target.addEventListener('mousemove', e => {
    const r = target.getBoundingClientRect();
    mouseX = (e.clientX - r.left) / r.width;
    mouseY = (e.clientY - r.top) / r.height;
  });

  function project(x, y, z, fov = 700) {
    const s = fov / (fov + z);
    return { sx: W / 2 + x * s, sy: H / 2 + y * s, s };
  }

  function drawLotus(x, y, z, r, angle, alpha) {
    if (alpha <= 0) return;
    const p = project(x, y, z);
    ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(angle + t * 0.25); ctx.scale(p.s, p.s);
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.rotate((i / 8) * Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.8, r * 0.25, r * 0.72, 0, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(0, -r * 1.5, 0, 0);
      g.addColorStop(0, `rgba(247,215,109,${alpha * 0.75})`);
      g.addColorStop(0.5, `rgba(201,162,39,${alpha * 0.35})`);
      g.addColorStop(1, `rgba(122,92,10,${alpha * 0.08})`);
      ctx.fillStyle = g; ctx.strokeStyle = `rgba(247,215,109,${alpha * 0.45})`; ctx.lineWidth = 0.5 / p.s;
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(247,215,109,${alpha})`; ctx.fill();
    ctx.restore();
  }

  function drawWheel3D(x, y, z, r, tilt, alpha) {
    if (alpha <= 0) return;
    const p = project(x, y, z);
    ctx.save(); ctx.translate(p.sx, p.sy); ctx.scale(p.s, p.s * (1 - Math.abs(tilt) * 0.45)); ctx.rotate(t * 0.18 + tilt);
    ctx.strokeStyle = `rgba(201,162,39,${alpha * 0.85})`; ctx.lineWidth = 1 / p.s;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.7 / p.s;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,162,39,${alpha * 0.55})`; ctx.fill();
    ctx.restore();
  }

  function drawPeacockFeather(x, y, z, len, angle, alpha) {
    if (alpha <= 0) return;
    const p = project(x, y, z);
    ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(angle + Math.sin(t * 0.6) * 0.12); ctx.scale(p.s, p.s);
    ctx.strokeStyle = `rgba(13,61,46,${alpha * 0.9})`; ctx.lineWidth = 1.5 / p.s;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(12, -len * 0.45, 0, -len); ctx.stroke();
    ctx.lineWidth = 0.6 / p.s;
    for (let i = 0; i < 20; i++) {
      const frac = i / 19; const sy2 = -len * (0.12 + frac * 0.72);
      const blen = len * 0.2 * Math.sin(frac * Math.PI);
      ctx.strokeStyle = `rgba(13,61,46,${alpha * 0.45})`;
      ctx.beginPath(); ctx.moveTo(0, sy2); ctx.lineTo(-blen, sy2 - blen * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, sy2); ctx.lineTo(blen, sy2 - blen * 0.25); ctx.stroke();
    }
    const eyeG = ctx.createRadialGradient(0, -len, 0, 0, -len, len * 0.16);
    eyeG.addColorStop(0, `rgba(13,61,46,${alpha})`);
    eyeG.addColorStop(0.5, `rgba(26,42,108,${alpha * 0.8})`);
    eyeG.addColorStop(0.8, `rgba(201,162,39,${alpha * 0.6})`);
    eyeG.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(0, -len, len * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = eyeG; ctx.fill();
    ctx.restore();
  }

  const artifacts = [
    { type: 'lotus',   bx: -280, by: -130, bz: 80,  ph: 0,   r: 55 },
    { type: 'wheel',   bx:  250,  by:  90,  bz: 100, ph: 1.2, r: 68 },
    { type: 'feather', bx: -200,  by:  190, bz: -30, ph: 2.1, len: 130, angle: -0.3 },
    { type: 'lotus',   bx:  310,  by: -210, bz: -90, ph: 0.8, r: 40 },
    { type: 'wheel',   bx: -350,  by:  -50, bz: 200, ph: 2.7, r: 46 },
    { type: 'feather', bx:  210,  by: -175, bz: 55,  ph: 1.6, len: 98, angle: 0.55 },
    { type: 'lotus',   bx:   60,  by:  260, bz: 160, ph: 3.2, r: 50 },
  ];

  function frame() {
    ctx.clearRect(0, 0, W, H); t += 0.006;
    const camX = (mouseX - 0.5) * 110;
    const camY = (mouseY - 0.5) * 75;

    artifacts.forEach(a => {
      const fy = Math.sin(t * 0.7 + a.ph) * 38;
      const fx = Math.cos(t * 0.5 + a.ph) * 22;
      const z  = a.bz + Math.sin(t * 0.4 + a.ph) * 65;
      const x  = a.bx + fx - camX * 0.3;
      const y  = a.by + fy - camY * 0.3;
      const alpha = Math.max(0, Math.min(1, (z + 400) / 600)) * 0.88;

      if (a.type === 'lotus')   drawLotus(x, y, z, a.r, a.ph + t * 0.22, alpha);
      else if (a.type === 'wheel')   drawWheel3D(x, y, z, a.r, mouseX - 0.5, alpha);
      else if (a.type === 'feather') drawPeacockFeather(x, y, z, a.len, a.angle, alpha);
    });

    requestAnimationFrame(frame);
  }
  frame();
}

// ── C. KINEMATIC SILK CLOTH SIMULATION ─────────────────────────
function initKinematicSilkCloth() {
  const genesis = document.getElementById('genesis');
  if (!genesis) return;

  const container = genesis.querySelector('.canvas-container');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-silk-cloth';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0.16;mix-blend-mode:screen;';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;
  const COLS = 20, ROWS = 13, GRAVITY = 0.38, DAMPING = 0.984, STIFFNESS = 0.93;
  let pts = [], prev = [], mX = -2000, mY = -2000, windT = 0;

  function initCloth() {
    pts = []; prev = [];
    const sX = W / (COLS - 1);
    const sY = H * 0.55 / (ROWS - 1);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * sX;
        const y = r * sY + H * 0.10;
        pts.push({ x, y, pinned: r === 0 });
        prev.push({ x, y });
      }
    }
  }

  function resize() {
    W = canvas.width  = genesis.offsetWidth  || window.innerWidth;
    H = canvas.height = genesis.offsetHeight || window.innerHeight;
    initCloth();
  }
  window.addEventListener('resize', resize);
  resize();

  genesis.addEventListener('mousemove', e => {
    const r = genesis.getBoundingClientRect();
    mX = e.clientX - r.left; mY = e.clientY - r.top;
  });
  genesis.addEventListener('mouseleave', () => { mX = -2000; mY = -2000; });

  function stepCloth() {
    windT += 0.014;
    const wind = Math.sin(windT) * 0.9 + Math.sin(windT * 2.5) * 0.4;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].pinned) continue;
      const { x, y } = pts[i];
      const vx = (x - prev[i].x) * DAMPING;
      const vy = (y - prev[i].y) * DAMPING;
      const dx = x - mX, dy = y - mY;
      const d = Math.sqrt(dx * dx + dy * dy);
      let mfx = 0, mfy = 0;
      if (d < 100) { const f = (100 - d) / 100 * 4; mfx = (dx / d) * f; mfy = (dy / d) * f; }
      prev[i].x = x; prev[i].y = y;
      pts[i].x = x + vx + wind * 0.35 + mfx;
      pts[i].y = y + vy + GRAVITY + mfy;
    }
    const sX = W / (COLS - 1);
    const sY = H * 0.55 / (ROWS - 1);
    for (let iter = 0; iter < 4; iter++) {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) {
        const a = r * COLS + c, b = r * COLS + c + 1;
        const dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const diff = (d - sX) / d * 0.5 * STIFFNESS;
        if (!pts[a].pinned) { pts[a].x += dx * diff; pts[a].y += dy * diff; }
        if (!pts[b].pinned) { pts[b].x -= dx * diff; pts[b].y -= dy * diff; }
      }
      for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS; c++) {
        const a = r * COLS + c, b = (r + 1) * COLS + c;
        const dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const diff = (d - sY) / d * 0.5 * STIFFNESS;
        if (!pts[a].pinned) { pts[a].x += dx * diff; pts[a].y += dy * diff; }
        if (!pts[b].pinned) { pts[b].x -= dx * diff; pts[b].y -= dy * diff; }
      }
    }
  }

  function drawCloth() {
    ctx.clearRect(0, 0, W, H);
    // Warp threads (vertical)
    for (let c = 0; c < COLS; c++) {
      ctx.beginPath();
      for (let r = 0; r < ROWS; r++) {
        const p = pts[r * COLS + c];
        r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `hsla(${32 + c * 1.5}, 80%, 62%, 0.55)`;
      ctx.lineWidth = 0.9; ctx.stroke();
    }
    // Weft threads (horizontal)
    for (let r = 0; r < ROWS; r++) {
      ctx.beginPath();
      for (let c = 0; c < COLS; c++) {
        const p = pts[r * COLS + c];
        c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      const al = 0.22 + (r / ROWS) * 0.38;
      ctx.strokeStyle = `rgba(247,215,109,${al})`; ctx.lineWidth = 0.8; ctx.stroke();
    }
    // Zari glow dots on top rows
    for (let r = 0; r < 5; r++) for (let c = 0; c < COLS; c++) {
      if (c % 3 === 0) {
        const p = pts[r * COLS + c];
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(247,215,109,${0.6 - r * 0.1})`; ctx.fill();
      }
    }
  }

  function loop() { stepCloth(); drawCloth(); requestAnimationFrame(loop); }
  loop();
}

// ── D. VOLUMETRIC GOLD DUST MOTES ──────────────────────────────
function initVolumetricGoldDust() {
  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-gold-dust';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:1;mix-blend-mode:screen;opacity:0.45;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

  const COUNT = 140;
  const motes = Array.from({ length: COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    z: Math.random() * 700,
    r: 0.8 + Math.random() * 2.8,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -0.06 - Math.random() * 0.25,
    phase: Math.random() * Math.PI * 2,
    hue: 30 + Math.random() * 25,
  }));

  function render() {
    ctx.clearRect(0, 0, W, H);
    motes.forEach(m => {
      m.phase += 0.01; m.x += m.vx + Math.sin(m.phase) * 0.28; m.y += m.vy;
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.x < -10) m.x = W + 10;
      if (m.x > W + 10) m.x = -10;
      const df = 1 - m.z / 700;
      const size = m.r * (0.3 + df * 1.3);
      const alpha = 0.08 + df * 0.55;
      ctx.beginPath(); ctx.arc(m.x, m.y, size, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, size * 2.8);
      g.addColorStop(0, `hsla(${m.hue}, 90%, 72%, ${alpha})`);
      g.addColorStop(1, `hsla(${m.hue}, 90%, 72%, 0)`);
      ctx.fillStyle = g; ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
}

// ── E. PRISMATIC HOLOGRAPHIC HEADING SHIFT ─────────────────────
function initPrismaticHeadings() {
  const targets = document.querySelectorAll(
    '.vault-title, .slide-heading, .meta-heading, .outro-logo'
  );
  if (!targets.length) return;

  let t = 0;
  function animate() {
    t += 0.4;
    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      const base = t + rect.top * 0.04;
      el.style.backgroundImage = `linear-gradient(
        135deg,
        hsl(${(base * 1.2 + 30) % 360}, 88%, 68%) 0%,
        hsl(${(base * 1.2 + 55) % 360}, 92%, 78%) 22%,
        hsl(${(base * 1.2 + 180) % 360}, 80%, 72%) 48%,
        hsl(${(base * 1.2 + 45) % 360}, 88%, 68%) 72%,
        hsl(${(base * 1.2 + 30) % 360}, 88%, 68%) 100%
      )`;
      el.style.backgroundSize = '300% 100%';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
      el.style.backgroundClip = 'text';
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ── F. SCROLL-DRIVEN PARALLAX DEPTH ────────────────────────────
function initScrollParallaxLayers() {
  const config = [
    { selector: '.vault-heading-wrap', depth: 0.09 },
    { selector: '.section-label',      depth: 0.13 },
    { selector: '.mudra-icon',         depth: 0.18 },
    { selector: '.slide-heading',      depth: 0.06 },
  ];

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      config.forEach(({ selector, depth }) => {
        document.querySelectorAll(selector).forEach(el => {
          const rect = el.getBoundingClientRect();
          const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * depth;
          el.style.transform = `translateY(${offset}px)`;
          el.style.willChange = 'transform';
        });
      });
      ticking = false;
    });
  });
}

// ── G. 3D SECTION REVEAL ON SCROLL ─────────────────────────────
function init3DSectionReveal() {
  const sections = document.querySelectorAll('.scroll-section');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transform = 'perspective(1200px) rotateX(0deg) translateY(0) scale(1)';
        entry.target.style.opacity = '1';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  sections.forEach(section => {
    if (section.id === 'genesis' || section.id === 'vault') return; // skip hero and pinned vault
    section.style.transform = 'perspective(1200px) rotateX(4deg) translateY(30px) scale(0.98)';
    section.style.opacity = '0.5';
    section.style.transition = 'transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 0.9s ease';
    obs.observe(section);
  });
}

// ── INITIALIZE ALL HYPEREFFECTS ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  init3DCardMagneticTilt();
  initFloating3DHeritageArtifacts();
  initKinematicSilkCloth();
  initVolumetricGoldDust();
  initPrismaticHeadings();
  initScrollParallaxLayers();
  init3DSectionReveal();
});
