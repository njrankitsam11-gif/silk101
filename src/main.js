import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global State
let audioCtx = null;
let synthNode = null;
let clackTimer = null;
let isAudioPlaying = false;
let scrollVelocity = 0;
let lastScrollY = 0;

// Loom Console Parameters
let warpTension = 1.0;
let threadCount = 45;
let borderPattern = 'lotus';
let liveHash = '0x8a92f7c00e199e52ff5dcd702c2f8832a839da49e0c1f191b7d517c5b61fa23e';

// Mouse spatial state
let mouseXNormalized = 0; // -1 to 1
let mouseYNormalized = 0; // 0 to 1

// Mock hashing helper
function generateMockHash(tension, density, pattern) {
  const input = `${tension}-${density}-${pattern}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}f7c00e199e52ff5dcd702c2f8832a${hex}`;
}

// Spatial Audio Engine (Web Audio API Synthesizers)
function initAudio() {
  if (audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 1. Ambient Synth Pad (Low-frequency drone)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const padGain = audioCtx.createGain();
  const spatialPanner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  
  osc1.frequency.value = 65.41; // C2
  osc2.frequency.value = 98.00; // G2
  
  filter.type = 'lowpass';
  filter.frequency.value = 180;
  filter.Q.value = 5;
  
  padGain.gain.value = 0.12;
  
  osc1.connect(filter);
  osc2.connect(filter);
  
  if (spatialPanner) {
    filter.connect(spatialPanner);
    spatialPanner.connect(padGain);
  } else {
    filter.connect(padGain);
  }
  
  padGain.connect(audioCtx.destination);
  
  osc1.start();
  osc2.start();
  
  synthNode = { osc1, osc2, padGain, filter, panner: spatialPanner };
  
  // 2. Loom Rhythmic Clack-Clack
  triggerLoomClack();
}

function triggerLoomClack() {
  if (!audioCtx || !isAudioPlaying) {
    clackTimer = setTimeout(triggerLoomClack, 1000);
    return;
  }
  
  // Shuttle clack panning follows mouse coordinate panning or shuttle position
  playClackSound(mouseXNormalized);
  
  // Rhythm interval speeds up with scroll velocity
  const baseInterval = 1200;
  const velocityReduction = Math.min(scrollVelocity * 8, 800);
  const nextInterval = Math.max(baseInterval - velocityReduction, 250);
  
  setTimeout(() => {
    if (isAudioPlaying) playClackSound(mouseXNormalized * -1);
  }, nextInterval / 2.5);
  
  clackTimer = setTimeout(triggerLoomClack, nextInterval);
}

function playClackSound(panValue) {
  if (!audioCtx) return;
  
  const thudOsc = audioCtx.createOscillator();
  const thudGain = audioCtx.createGain();
  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(90 * (1 + warpTension * 0.15), audioCtx.currentTime);
  thudOsc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.12);
  
  thudGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  thudGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  
  const clickBuffer = createNoiseBuffer();
  const clickSource = audioCtx.createBufferSource();
  clickSource.buffer = clickBuffer;
  
  const clickFilter = audioCtx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 1200;
  clickFilter.Q.value = 6;
  
  const clickGain = audioCtx.createGain();
  clickGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  
  const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  if (panner) {
    panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, panValue)), audioCtx.currentTime);
    
    thudOsc.connect(thudGain);
    thudGain.connect(panner);
    
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(panner);
    
    panner.connect(audioCtx.destination);
  } else {
    thudOsc.connect(thudGain);
    thudGain.connect(audioCtx.destination);
    
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(audioCtx.destination);
  }
  
  thudOsc.start();
  thudOsc.stop(audioCtx.currentTime + 0.15);
  clickSource.start();
  clickSource.stop(audioCtx.currentTime + 0.06);
}

function createNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 0.05;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Track Spatial Mouse Coordinates & Update Synth Parameters
window.addEventListener('mousemove', (e) => {
  mouseXNormalized = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
  mouseYNormalized = e.clientY / window.innerHeight;          // 0 to 1
  
  if (audioCtx && synthNode && isAudioPlaying) {
    // 3D panning of pad synth
    if (synthNode.panner) {
      synthNode.panner.pan.setValueAtTime(mouseXNormalized * 0.6, audioCtx.currentTime);
    }
    
    // Filter sweep: sweeping low-pass filter frequency based on mouse Y
    const filterFreq = 120 + (1 - mouseYNormalized) * 680;
    synthNode.filter.frequency.setValueAtTime(filterFreq, audioCtx.currentTime);
  }
});

// Track Scroll Velocity and Pitch shift drone
window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  scrollVelocity = Math.abs(currentY - lastScrollY);
  lastScrollY = currentY;
  
  if (audioCtx && synthNode && isAudioPlaying) {
    const pitchFactor = 1 + Math.min(scrollVelocity / 50, 0.4);
    synthNode.osc1.frequency.setValueAtTime(65.41 * pitchFactor, audioCtx.currentTime);
    synthNode.osc2.frequency.setValueAtTime(98.00 * pitchFactor, audioCtx.currentTime);
  }
});

// Decelerate scroll velocity representation
setInterval(() => {
  if (scrollVelocity > 0.5) {
    scrollVelocity *= 0.85;
  } else {
    scrollVelocity = 0;
  }
}, 50);

// Audio Setup Buttons
document.getElementById('btn-sound-on').addEventListener('click', () => {
  initAudio();
  isAudioPlaying = true;
  document.getElementById('audio-modal').classList.add('hidden');
  document.getElementById('audio-toggle').classList.add('playing');
});

document.getElementById('btn-sound-off').addEventListener('click', () => {
  document.getElementById('audio-modal').classList.add('hidden');
  document.getElementById('audio-toggle').classList.remove('playing');
});

document.getElementById('audio-toggle').addEventListener('click', () => {
  const toggle = document.getElementById('audio-toggle');
  if (isAudioPlaying) {
    isAudioPlaying = false;
    toggle.classList.remove('playing');
    toggle.querySelector('.audio-text').textContent = 'AUDIO OFF';
    if (synthNode) synthNode.padGain.gain.setValueAtTime(0, audioCtx.currentTime);
  } else {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isAudioPlaying = true;
    toggle.classList.add('playing');
    toggle.querySelector('.audio-text').textContent = 'AUDIO ON';
    if (synthNode) synthNode.padGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  }
});


/* ==========================================================
   CANVAS 1: GENESIS (Hero Drop)
========================================================== */
function setupGenesisCanvas() {
  const canvas = document.getElementById('canvas-genesis');
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  
  let scrollProgress = 0;
  ScrollTrigger.create({
    trigger: '#genesis',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      scrollProgress = self.progress;
    }
  });

  gsap.to('.embroidered-text', {
    scrollTrigger: {
      trigger: '#genesis',
      start: 'top top',
      end: '50% top',
      scrub: true
    },
    y: 0,
    opacity: 1,
    stagger: 0.1
  });

  function draw() {
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = 1 - scrollProgress * 0.75;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    const driftY = -scrollProgress * 250;
    ctx.strokeStyle = `rgba(212, 175, 55, ${0.05 + (1 - scale) * 0.15})`;
    ctx.lineWidth = 1;
    
    // 1. Konark Sun Temple Wheel Geometry (Rotates on scroll)
    ctx.save();
    ctx.translate(0, driftY - 100);
    ctx.rotate(scrollProgress * Math.PI * 0.45);
    
    ctx.strokeStyle = `rgba(212, 175, 55, ${0.28 + (1 - scale) * 0.25})`;
    ctx.lineWidth = 1;
    
    // Outer Rims
    ctx.beginPath();
    ctx.arc(0, 0, 310, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, 290, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rim teeth carvings (Sundial beads)
    const teethCount = 60;
    for (let t = 0; t < teethCount; t++) {
      const angle = (t * Math.PI * 2) / teethCount;
      const x1 = Math.cos(angle) * 290;
      const y1 = Math.sin(angle) * 290;
      const x2 = Math.cos(angle) * 310;
      const y2 = Math.sin(angle) * 310;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // 8 Main Broad Spokes
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Draw broad spoke outline
      ctx.fillStyle = `rgba(212, 175, 55, ${0.08 + (1 - scale) * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(cos * 80 - sin * 12, sin * 80 + cos * 12);
      ctx.lineTo(cos * 290 - sin * 8, sin * 290 + cos * 8);
      ctx.lineTo(cos * 290 + sin * 8, sin * 290 - cos * 8);
      ctx.lineTo(cos * 80 + sin * 12, sin * 80 - cos * 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Detailing inside broad spoke
      const midR = 185;
      ctx.beginPath();
      ctx.arc(cos * midR, sin * midR, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 8 Secondary Thin Spokes
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 80, Math.sin(angle) * 80);
      ctx.lineTo(Math.cos(angle) * 290, Math.sin(angle) * 290);
      ctx.stroke();
      
      const midR = 185;
      ctx.fillStyle = `rgba(212, 175, 55, ${0.22 + (1 - scale) * 0.18})`;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * midR, Math.sin(angle) * midR, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Inner Hubs & Center Axle
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // 2. Drawing Saree Border Geometry
    const borderProgress = Math.min(scrollProgress * 1.5, 1);
    if (borderProgress > 0.05) {
      ctx.strokeStyle = `rgba(128, 0, 32, ${borderProgress * 0.8})`; // Crimson
      ctx.lineWidth = 3;
      ctx.beginPath();
      const gridW = 500;
      const step = 20;
      for (let x = -gridW; x <= gridW; x += step) {
        ctx.moveTo(x, -250 * borderProgress);
        ctx.lineTo(x, 250 * borderProgress);
      }
      for (let y = -250; y <= 250; y += step) {
        ctx.moveTo(-gridW * borderProgress, y);
        ctx.lineTo(gridW * borderProgress, y);
      }
      ctx.stroke();
      
      ctx.fillStyle = `rgba(212, 175, 55, ${borderProgress * 0.9})`;
      for (let offset = -400; offset <= 400; offset += 200) {
        ctx.save();
        ctx.translate(offset, 0);
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.quadraticCurveTo(15, -10, 0, 10);
        ctx.quadraticCurveTo(-15, -10, 0, -30);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-25, -20, -30, 5);
        ctx.quadraticCurveTo(-10, 15, 0, 10);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(25, -20, 30, 5);
        ctx.quadraticCurveTo(10, 15, 0, 10);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // 3. The Central Vertical Thread
    const threadAlpha = 1 - scrollProgress * 0.9;
    if (threadAlpha > 0.01) {
      const gradient = ctx.createLinearGradient(0, -canvas.height * 2, 0, canvas.height * 2);
      gradient.addColorStop(0, 'rgba(212, 175, 55, 0.01)');
      gradient.addColorStop(0.5, `rgba(212, 175, 55, ${threadAlpha})`);
      gradient.addColorStop(1, 'rgba(212, 175, 55, 0.01)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + scrollVelocity * 0.15;
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
      
      ctx.beginPath();
      ctx.moveTo(0, -canvas.height * 1.5);
      
      const segments = 60;
      for (let i = 0; i <= segments; i++) {
        const py = -canvas.height * 1.5 + (canvas.height * 3 * i) / segments;
        const wave = Math.sin(py * 0.005 + Date.now() * 0.004) * (15 + scrollVelocity * 0.5);
        ctx.lineTo(wave, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
    
    requestAnimationFrame(draw);
  }
  draw();
}


/* ==========================================================
   SECTION 2: ARTISAN'S PULSE & INTERACTIVE LOOM CONSOLE
========================================================== */
function setupHorizontalPulse() {
  const scrollSection = document.querySelector('.horizontal-scroll-section');
  
  gsap.to(scrollSection, {
    x: '-200vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#artisan-pulse',
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=2000',
    }
  });
  
  // Left Canvas: Handloom operation simulation (Linked to sliders)
  const canvasLeft = document.getElementById('canvas-artisan');
  const ctxLeft = canvasLeft.getContext('2d');
  
  let rect = canvasLeft.getBoundingClientRect();
  let mouse = { x: rect.width / 2, y: rect.height / 2, isOver: false };
  
  function resizeLeft() {
    canvasLeft.width = canvasLeft.parentElement.clientWidth;
    canvasLeft.height = canvasLeft.parentElement.clientHeight;
    rect = canvasLeft.getBoundingClientRect();
  }
  window.addEventListener('resize', () => {
    resizeLeft();
    rect = canvasLeft.getBoundingClientRect();
  });
  resizeLeft();
  
  const tooltip = document.getElementById('artisan-tooltip');
  
  canvasLeft.addEventListener('mousemove', (e) => {
    const rx = e.clientX - rect.left;
    const ry = e.clientY - rect.top;
    mouse.x = rx;
    mouse.y = ry;
    mouse.isOver = true;
    
    tooltip.classList.add('active');
    tooltip.style.left = `${rx}px`;
    tooltip.style.top = `${ry}px`;
  });
  
  canvasLeft.addEventListener('mouseleave', () => {
    mouse.isOver = false;
    tooltip.classList.remove('active');
  });
  
  function drawLeft() {
    ctxLeft.fillStyle = '#060606';
    ctxLeft.fillRect(0, 0, canvasLeft.width, canvasLeft.height);
    
    const time = Date.now() * 0.0025;
    
    // Wood frame
    ctxLeft.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctxLeft.lineWidth = 10;
    ctxLeft.strokeRect(40, 40, canvasLeft.width - 80, canvasLeft.height - 80);
    
    // Threads count based on threadCount slider
    ctxLeft.lineWidth = 1;
    const spacing = canvasLeft.width / threadCount;
    
    for (let i = 0; i < threadCount; i++) {
      const tx = i * spacing;
      ctxLeft.beginPath();
      ctxLeft.moveTo(tx, 0);
      
      // Thread tension/bend varies with warpTension slider
      let bend = 0;
      if (mouse.isOver) {
        const dist = Math.abs(mouse.x - tx);
        if (dist < 150) {
          // Higher tension results in less warp deflection/bending
          bend = (1 - dist / 150) * (mouse.y - canvasLeft.height / 2) * (0.85 / warpTension);
        }
      }
      
      const wave = Math.sin(time + i * 0.5) * 4;
      // Thread color changes based on select-pattern motif
      let threadColor = 'rgba(128, 0, 32, 0.25)'; // Default crimson
      if (borderPattern === 'lotus' && i % 4 === 0) threadColor = 'rgba(212, 175, 55, 0.45)';
      else if (borderPattern === 'temple' && i % 3 === 0) threadColor = 'rgba(255, 255, 255, 0.35)';
      else if (borderPattern === 'grid' && i % 2 === 0) threadColor = 'rgba(100, 180, 255, 0.35)';
      
      ctxLeft.strokeStyle = threadColor;
      ctxLeft.bezierCurveTo(tx, canvasLeft.height * 0.25, tx + bend + wave, canvasLeft.height * 0.5, tx, canvasLeft.height);
      ctxLeft.stroke();
    }
    
    // Loom Shuttle
    const shuttleX = (Math.sin(time * 0.5) * 0.4 + 0.5) * canvasLeft.width;
    const shuttleY = canvasLeft.height / 2;
    
    ctxLeft.fillStyle = '#d4af37';
    ctxLeft.save();
    ctxLeft.translate(shuttleX, shuttleY);
    ctxLeft.beginPath();
    ctxLeft.moveTo(-45, 0);
    ctxLeft.lineTo(0, -12);
    ctxLeft.lineTo(45, 0);
    ctxLeft.lineTo(0, 12);
    ctxLeft.closePath();
    ctxLeft.fill();
    
    ctxLeft.strokeStyle = '#fff';
    ctxLeft.lineWidth = 2.5;
    ctxLeft.shadowBlur = 8;
    ctxLeft.shadowColor = 'rgba(255,255,255,0.8)';
    ctxLeft.beginPath();
    ctxLeft.moveTo(0, 0);
    ctxLeft.lineTo(-canvasLeft.width, 0);
    ctxLeft.stroke();
    ctxLeft.shadowBlur = 0;
    ctxLeft.restore();
    
    ctxLeft.strokeStyle = 'rgba(255,255,255,0.06)';
    ctxLeft.lineWidth = 2;
    ctxLeft.beginPath();
    ctxLeft.arc(shuttleX, shuttleY - 60, 20, 0, Math.PI * 2);
    ctxLeft.moveTo(shuttleX, shuttleY - 40);
    ctxLeft.lineTo(shuttleX, shuttleY - 10);
    ctxLeft.stroke();
    
    requestAnimationFrame(drawLeft);
  }
  drawLeft();
  
  // Right Canvas: Punchcard binary pattern matrix
  const canvasRight = document.getElementById('canvas-punchcard');
  const ctxRight = canvasRight.getContext('2d');
  
  function resizeRight() {
    canvasRight.width = canvasRight.parentElement.clientWidth;
    canvasRight.height = canvasRight.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeRight);
  resizeRight();
  
  const punchGrid = [];
  const rows = 18;
  const cols = 12;
  for (let r = 0; r < rows; r++) {
    const colData = [];
    for (let c = 0; c < cols; c++) {
      colData.push(Math.random() > 0.6 ? 1 : 0);
    }
    punchGrid.push(colData);
  }
  
  function drawRight() {
    ctxRight.fillStyle = '#000000';
    ctxRight.fillRect(0, 0, canvasRight.width, canvasRight.height);
    
    const time = Date.now() * 0.0006;
    const cw = canvasRight.width / cols;
    const rh = canvasRight.height / rows;
    
    for (let r = 0; r < rows; r++) {
      const dy = ((r * rh + time * 120) % canvasRight.height);
      for (let c = 0; c < cols; c++) {
        // Change pattern geometry of punch card based on select Motif
        let val = punchGrid[(r + Math.floor(time * 2)) % rows][c];
        if (borderPattern === 'temple') {
          val = (c + r) % 3 === 0 ? 1 : 0;
        } else if (borderPattern === 'grid') {
          val = c % 2 === 0 && r % 2 === 0 ? 1 : 0;
        }
        
        const cx = c * cw + cw / 2;
        
        ctxRight.fillStyle = val === 1 ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.03)';
        ctxRight.beginPath();
        ctxRight.arc(cx, dy, val === 1 ? 5 : 2, 0, Math.PI * 2);
        ctxRight.fill();
        
        if (val === 1) {
          ctxRight.strokeStyle = 'rgba(212, 175, 55, 0.1)';
          ctxRight.lineWidth = 0.5;
          ctxRight.beginPath();
          ctxRight.moveTo(cx, 0);
          ctxRight.lineTo(cx, canvasRight.height);
          ctxRight.stroke();
        }
      }
    }
    
    requestAnimationFrame(drawRight);
  }
  drawRight();

  // Listeners for Interactive Controls
  const sliderTension = document.getElementById('slider-tension');
  const sliderDensity = document.getElementById('slider-density');
  const selectPattern = document.getElementById('select-pattern');
  const liveHashEl = document.getElementById('console-live-hash');
  
  function updateConsoleSettings() {
    warpTension = parseFloat(sliderTension.value);
    threadCount = parseInt(sliderDensity.value);
    borderPattern = selectPattern.value;
    
    document.getElementById('val-tension').textContent = warpTension.toFixed(1);
    document.getElementById('val-density').textContent = threadCount;
    
    // Regenerate blockchain integrity hash
    liveHash = generateMockHash(warpTension, threadCount, borderPattern);
    liveHashEl.textContent = liveHash.substring(0, 10) + '...';
    
    // Re-render sarees in the Vault with the updated motif patterns!
    const vaultCards = document.querySelectorAll('.saree-card');
    vaultCards.forEach(card => {
      const cardId = parseInt(card.dataset.id);
      const zari = card.querySelector('.layer-zari');
      const zariCanvas = document.createElement('canvas');
      zariCanvas.width = 420;
      zariCanvas.height = 580;
      
      // Draw updated pattern reflecting slider settings
      drawZariPattern(zariCanvas.getContext('2d'), cardId);
      zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
    });
  }
  
  sliderTension.addEventListener('input', updateConsoleSettings);
  sliderDensity.addEventListener('input', updateConsoleSettings);
  selectPattern.addEventListener('change', updateConsoleSettings);
}


/* ==========================================================
   SECTION 3: METAMORPHOSIS (Physical Fabric to Digital Grid)
========================================================== */
function setupMetamorphosis() {
  const canvas = document.getElementById('canvas-meta');
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  
  let scrollProgress = 0;
  ScrollTrigger.create({
    trigger: '#metamorphosis',
    start: 'top top',
    end: 'bottom top',
    pin: true,
    scrub: true,
    onUpdate: (self) => {
      scrollProgress = self.progress;
      const card = document.querySelector('.meta-card');
      if (scrollProgress > 0.1 && scrollProgress < 0.95) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    }
  });
  
  function draw() {
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const zoom = Math.pow(scrollProgress, 3) * 6;
    const scale = 1 + zoom;
    
    const physDrift = -scrollProgress * 200;
    const digiDrift = scrollProgress * 180;
    
    // 1. Physical Saree
    ctx.save();
    ctx.translate(cx + physDrift, cy);
    ctx.scale(scale, scale);
    
    ctx.fillStyle = '#800020';
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.fill();
    
    const waveCount = 5;
    for (let w = 0; w < waveCount; w++) {
      ctx.fillStyle = `rgba(100, 0, 16, ${0.4 - w * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(-300, -200 + w * 60);
      ctx.bezierCurveTo(-100, -50 + w * 40, 100, -300 + w * 40, 300, -100 + w * 60);
      ctx.lineTo(300, 300);
      ctx.lineTo(-300, 300);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let d = -200; d <= 200; d += 8) {
      ctx.moveTo(d, -200);
      ctx.lineTo(d, 200);
      ctx.moveTo(-200, d);
      ctx.lineTo(200, d);
    }
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // 2. Cryptographic lattice
    ctx.save();
    ctx.translate(cx + digiDrift, cy);
    ctx.scale(scale, scale);
    
    const latticeAlpha = Math.min(scrollProgress * 1.5, 0.95);
    ctx.strokeStyle = `rgba(212, 175, 55, ${latticeAlpha * 0.55})`;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    const radius = 70;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      const nextAngle = ((i + 1) * Math.PI) / 3;
      ctx.lineTo(Math.cos(nextAngle) * radius, Math.sin(nextAngle) * radius);
    }
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.shadowBlur = 0;
    
    ctx.restore();
    
    requestAnimationFrame(draw);
  }
  draw();
}


/* ==========================================================
   SECTION 4: THE VAULT (Z-Axis Parallax & Gold Shader)
========================================================== */
const sareeCollection = [
  {
    id: 6,
    name: "Nuapatana Khandua Ikat Saree",
    num: "1-OF-1 COLLECTION / #3302",
    artisan: "Smt. Sebati Mohanty",
    coords: "20° 26' 18\" N, 85° 17' 55\" E",
    timestamp: "BLOCK #8297401 (10-July-2026 13:05:12)",
    hash: "0xf7c00e199e52ff5dcd702c2f8832a839da49e0c1f191b7d517c5b61fa23e8a92"
  },
  {
    id: 1,
    name: "Sambalpuri Lotus Saree",
    num: "1-OF-1 COLLECTION / #8291",
    artisan: "Shri Ranjan Meher",
    coords: "20° 27' 35\" N, 85° 18' 42\" E",
    timestamp: "BLOCK #8291884 (10-July-2026 12:47:37)",
    hash: "0x8a92f7c00e199e52ff5dcd702c2f8832a839da49e0c1f191b7d517c5b61fa23e"
  },
  {
    id: 2,
    name: "Kotpad Temple Border",
    num: "1-OF-1 COLLECTION / #4019",
    artisan: "Smt. Sebati Mohanty",
    coords: "19° 08' 22\" N, 82° 19' 11\" E",
    timestamp: "BLOCK #8292410 (10-July-2026 12:48:02)",
    hash: "0x3e1b7f0f670da288cd72ca1bc0a928ba948b8ca702cfef99aaefd688cf812903"
  },
  {
    id: 4,
    name: "Konark Sundial Relic Saree",
    num: "1-OF-1 COLLECTION / #1088",
    artisan: "Shri Ranjan Meher",
    coords: "19° 53' 15\" N, 86° 05' 41\" E",
    timestamp: "BLOCK #8295012 (10-July-2026 12:59:12)",
    hash: "0x7a39e80c1bf9c88ee940da28ff5dcd702c2f8832a839da49e0c1f191b7d517c5"
  },
  {
    id: 5,
    name: "Lord Jagannath Provenance Saree",
    num: "1-OF-1 COLLECTION / #7007",
    artisan: "Shri Kailash Meher",
    coords: "19° 48' 17\" N, 85° 49' 06\" E",
    timestamp: "BLOCK #8296184 (10-July-2026 13:02:40)",
    hash: "0x6f19e8c00e199e52ff5dcd702c2f8832a839da49e0c1f191b7d517c5b61fa23e"
  },
  {
    id: 3,
    name: "Maniabandha Grid Saree",
    num: "1-OF-1 COLLECTION / #9204",
    artisan: "Shri Kailash Meher",
    coords: "20° 29' 44\" N, 85° 21' 03\" E",
    timestamp: "BLOCK #8293991 (10-July-2026 12:48:15)",
    hash: "0x9d72c1c9e81f181c00fa6c88ee94cfdbac8f8dca712bfd98fa6c5188da91209e"
  }
];

function setupVaultTunnel() {
  const stage = document.getElementById('tunnel-stage');
  
  sareeCollection.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'saree-card';
    card.dataset.id = item.id;
    
    const shadow = document.createElement('div');
    shadow.className = 'saree-layer layer-shadow';
    
    const silk = document.createElement('div');
    silk.className = 'saree-layer layer-silk';
    
    const zari = document.createElement('div');
    zari.className = 'saree-layer layer-zari';
    
    // Textures & Shader layers
    const silkCanvas = document.createElement('canvas');
    silkCanvas.width = 420;
    silkCanvas.height = 580;
    drawSilkTexture(silkCanvas.getContext('2d'), item.id);
    silk.style.backgroundImage = `url(${silkCanvas.toDataURL()})`;
    
    const zariCanvas = document.createElement('canvas');
    zariCanvas.width = 420;
    zariCanvas.height = 580;
    drawZariPattern(zariCanvas.getContext('2d'), item.id);
    zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
    
    const info = document.createElement('div');
    info.className = 'saree-info';
    info.innerHTML = `
      <span class="saree-num">${item.num}</span>
      <h4 class="saree-name">${item.name}</h4>
      <span class="saree-action">Enter 3D Showcase</span>
    `;
    
    card.appendChild(shadow);
    card.appendChild(silk);
    card.appendChild(zari);
    card.appendChild(info);
    
    stage.appendChild(card);
    
    // Luminous Gold reflection shader on mouse move
    card.addEventListener('mousemove', (e) => {
      const cardRect = card.getBoundingClientRect();
      const mx = e.clientX - cardRect.left;
      const my = e.clientY - cardRect.top;
      
      const zariCtx = zariCanvas.getContext('2d');
      zariCtx.clearRect(0, 0, 420, 580);
      
      // Draw base pattern
      drawZariPattern(zariCtx, item.id);
      
      // Dynamic gold spotlight highlight (luminous shader effect)
      zariCtx.save();
      zariCtx.globalCompositeOperation = 'source-atop';
      
      const radGrad = zariCtx.createRadialGradient(mx, my, 5, mx, my, 180);
      radGrad.addColorStop(0, 'rgba(255, 235, 170, 0.95)');
      radGrad.addColorStop(0.3, 'rgba(212, 175, 55, 0.7)');
      radGrad.addColorStop(1, 'rgba(212, 175, 55, 0.1)');
      
      zariCtx.fillStyle = radGrad;
      zariCtx.fillRect(0, 0, 420, 580);
      zariCtx.restore();
      
      zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
    });
    
    // Reset shader reflection on leave
    card.addEventListener('mouseleave', () => {
      const zariCtx = zariCanvas.getContext('2d');
      zariCtx.clearRect(0, 0, 420, 580);
      drawZariPattern(zariCtx, item.id);
      zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
    });
  });
  
  const cards = document.querySelectorAll('.saree-card');
  
  ScrollTrigger.create({
    trigger: '#vault',
    pin: true,
    start: 'top top',
    end: '+=4800',
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      
      cards.forEach((card, index) => {
        const baseZ = -1500 * (index + 0.5);
        const currentZ = baseZ + progress * 10500;
        
        let opacity = 1;
        if (currentZ > 400) {
          opacity = 1 - (currentZ - 400) / 400;
        } else if (currentZ < -2000) {
          opacity = 0;
        }
        
        const shadow = card.querySelector('.layer-shadow');
        const silk = card.querySelector('.layer-silk');
        const zari = card.querySelector('.layer-zari');
        const info = card.querySelector('.saree-info');
        
        card.style.transform = `translate3d(-50%, -50%, ${currentZ}px)`;
        card.style.opacity = Math.max(0, Math.min(1, opacity));
        card.style.pointerEvents = (currentZ > -250 && currentZ < 400) ? 'auto' : 'none';
        
        if (currentZ > -1000 && currentZ < 600) {
          silk.style.transform = `translateZ(0px)`;
          zari.style.transform = `translateZ(${20 + scrollVelocity * 0.3}px)`;
          shadow.style.transform = `translateZ(-30px)`;
          info.style.transform = `translateZ(${35 + scrollVelocity * 0.5}px)`;
        }
      });
    }
  });

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      openUnweaveModal(id);
    });
  });
}

function drawSilkTexture(ctx, id) {
  if (id === 6) {
    // Nuapatana tie-dye Crimson & Gold grad
    const grad = ctx.createLinearGradient(0, 0, 420, 580);
    grad.addColorStop(0, '#7a0016');
    grad.addColorStop(0.5, '#ba1a08');
    grad.addColorStop(1, '#4a000b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 420, 580);
    
    // Draw fuzzy vertical tie-dye ikat spots on borders
    ctx.fillStyle = 'rgba(212, 175, 55, 0.22)';
    for (let y = 10; y < 580; y += 15) {
      const fuzz1 = Math.random() * 8;
      const fuzz2 = Math.random() * 8;
      ctx.fillRect(20 + fuzz1, y, 15 + fuzz2, 8);
      ctx.fillRect(380 - fuzz1, y, 15 + fuzz2, 8);
    }
  } else {
    ctx.fillStyle = id === 1 ? '#a80c34' : id === 2 ? '#14402a' : id === 3 ? '#40124c' : id === 4 ? '#122b52' : id === 5 ? '#800810' : '#151518';
    ctx.fillRect(0, 0, 420, 580);
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < 420; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 580);
    ctx.stroke();
  }
  for (let y = 0; y < 580; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(420, y);
    ctx.stroke();
  }
}

function drawZariPattern(ctx, id) {
  if (id === 1) {
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.95)';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.55)';
    ctx.lineWidth = 2.5;
    for (let y = 100; y < 580; y += 160) {
      ctx.save();
      ctx.translate(210, y);
      if (borderPattern === 'temple') drawTemplePath(ctx);
      else if (borderPattern === 'grid') drawGridPath(ctx);
      else drawLotusPath(ctx);
      ctx.restore();
    }
  } else if (id === 2) {
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.95)';
    ctx.fillStyle = 'rgba(186, 26, 8, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 30; x <= 390; x += 60) {
      ctx.moveTo(x, 50);
      ctx.lineTo(x + 30, 200);
      ctx.lineTo(x + 60, 50);
      
      ctx.moveTo(x, 530);
      ctx.lineTo(x + 30, 380);
      ctx.lineTo(x + 60, 530);
    }
    ctx.stroke();
  } else if (id === 3) {
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.95)';
    ctx.fillStyle = 'rgba(255, 0, 127, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 70; x < 420; x += 140) {
      for (let y = 100; y < 580; y += 180) {
        ctx.moveTo(x, y - 40);
        ctx.lineTo(x + 40, y);
        ctx.lineTo(x, y + 40);
        ctx.lineTo(x - 40, y);
        ctx.closePath();
      }
    }
    ctx.stroke();
  } else if (id === 4) {
    // Konark Sundial Relic Pattern
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(210, 290);
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.stroke();
    // 8 spokes
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 100, Math.sin(angle) * 100);
      ctx.stroke();
    }
    // Rim teeth
    for (let t = 0; t < 24; t++) {
      const angle = (t * Math.PI * 2) / 24;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 85, Math.sin(angle) * 85);
      ctx.lineTo(Math.cos(angle) * 100, Math.sin(angle) * 100);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (id === 5) {
    // Lord Jagannath Provenance Pattern (The Holy Trinity: Jagannath, Balabhadra, Subhadra)
    ctx.save();
    
    // Draw vertical lotus borders on the card edges
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    // Left border
    ctx.beginPath();
    ctx.strokeRect(10, 20, 30, 540);
    // Right border
    ctx.strokeRect(380, 20, 30, 540);
    // Tiny border lotus details
    for (let y = 40; y < 560; y += 40) {
      ctx.beginPath();
      ctx.arc(25, y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(395, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Move to the center of the card to draw the deities & shrine
    ctx.translate(210, 290);
    
    // 1. Temple Shrine / Archway above them
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-150, 120);
    ctx.lineTo(-150, 0);
    ctx.quadraticCurveTo(-150, -110, 0, -110);
    ctx.quadraticCurveTo(150, -110, 150, 0);
    ctx.lineTo(150, 120);
    ctx.stroke();
    
    // Decorative pillars
    ctx.lineWidth = 1;
    ctx.strokeRect(-160, 0, 10, 120);
    ctx.strokeRect(150, 0, 10, 120);
    
    // 2. Balabhadra (Left - White Face Deity)
    ctx.save();
    ctx.translate(-75, 40);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-13, -2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(13, -2, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.beginPath();
    ctx.arc(-13, -2, 4, 0, Math.PI * 2);
    ctx.arc(13, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(0, -50);
    ctx.lineTo(22, -22);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-32, 10);
    ctx.lineTo(-45, 10);
    ctx.lineTo(-45, -5);
    ctx.moveTo(32, 10);
    ctx.lineTo(45, 10);
    ctx.lineTo(45, -5);
    ctx.stroke();
    ctx.restore();
    
    // 3. Subhadra (Center - Yellow Face Deity)
    ctx.save();
    ctx.translate(0, 50);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-9, -2, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, -2, 8, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.beginPath();
    ctx.arc(-9, -2, 3, 0, Math.PI * 2);
    ctx.arc(9, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(0, -48);
    ctx.lineTo(16, -24);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // 4. Lord Jagannath (Right - Black Face Deity)
    ctx.save();
    ctx.translate(75, 40);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-13, -2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(13, -2, 10, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.beginPath();
    ctx.arc(-13, -2, 4, 0, Math.PI * 2);
    ctx.arc(13, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-22, -22);
    ctx.lineTo(0, -50);
    ctx.lineTo(22, -22);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-32, 10);
    ctx.lineTo(-45, 10);
    ctx.lineTo(-45, -5);
    ctx.moveTo(32, 10);
    ctx.lineTo(45, 10);
    ctx.lineTo(45, -5);
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();
  } else if (id === 6) {
    // Nuapatana Khandua Saree - Elephant Motif
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(210, 290);
    
    // Abstract geometric elephant outline
    ctx.beginPath();
    ctx.arc(0, 0, 50, Math.PI, 0);
    ctx.lineTo(50, 40);
    ctx.lineTo(35, 40);
    ctx.lineTo(35, 10);
    ctx.lineTo(-35, 10);
    ctx.lineTo(-35, 40);
    ctx.lineTo(-50, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Head & trunk
    ctx.beginPath();
    ctx.arc(-55, -20, 20, Math.PI * 1.5, Math.PI * 0.5);
    ctx.bezierCurveTo(-75, 0, -80, 20, -75, 30);
    ctx.bezierCurveTo(-72, 30, -70, 20, -65, 0);
    ctx.stroke();
    
    // Saddle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-20, -25, 40, 25);
    ctx.restore();
  }
}

function drawLotusPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.quadraticCurveTo(15, -15, 0, 15);
  ctx.quadraticCurveTo(-15, -15, 0, -35);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-30, -25, -35, 5);
  ctx.quadraticCurveTo(-15, 20, 0, 15);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(30, -25, 35, 5);
  ctx.quadraticCurveTo(15, 20, 0, 15);
  ctx.fill();
  ctx.stroke();
}

function drawTemplePath(ctx) {
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(30, 10);
  ctx.lineTo(-30, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawGridPath(ctx) {
  ctx.strokeRect(-25, -25, 50, 50);
  ctx.fillRect(-10, -10, 20, 20);
}


/* ==========================================================
   SIGNATURE UX FEATURE: THE BLOCKCHAIN UNWEAVE & BLOCK EXPLORER
========================================================== */
let unweaveAnimationId = null;
let drapeAnimationId = null;

function setupShowroomDrape(item) {
  const canvas = document.getElementById('canvas-drape');
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth || 450;
  canvas.height = canvas.parentElement.clientHeight || 420;
  
  let mx = canvas.width / 2;
  let my = canvas.height / 2;
  let isHovered = false;
  let drapeStyle = 'nivi'; 
  let inspectMode = 'spotlight'; 
  let lightTheme = 'sunset'; 
  let viewAngle = 'front';

  // ── Avatar Image Collections ──────────────────────────────────────────────
  // Each collection: [front, side] photos. Others use hue-rotate on base set.
  function loadImg(src) { const i = new Image(); i.src = src; return i; }

  const avatarCollections = {
    // Style 1: Crimson Pata (4 full frames)
    1: { frames: [loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'), loadImg('/avatars/frame_side.png'), loadImg('/avatars/frame_back.png')], hue: 0, sat: 1 },
    // Style 2: Navy Sambalpuri (2 frames, mirrored for back)
    2: { frames: [loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_side.png'), loadImg('/avatars/navy_side.png')], hue: 0, sat: 1 },
    // Style 3: Green Chanderi (2 frames)
    3: { frames: [loadImg('/avatars/green_front.png'), loadImg('/avatars/green_front.png'), loadImg('/avatars/green_side.png'), loadImg('/avatars/green_side.png')], hue: 0, sat: 1 },
    // Style 4: Royal Purple Kanjivaram (2 frames)
    4: { frames: [loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_side.png'), loadImg('/avatars/purple_side.png')], hue: 0, sat: 1 },
    // Style 5: Golden Tissue (2 frames)
    5: { frames: [loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_side.png'), loadImg('/avatars/golden_side.png')], hue: 0, sat: 1 },
    // Styles 6-12: Crimson base with hue-rotate color tinting
    6:  { frames: null, hue: 30,  sat: 1.1 },  // orange/saffron
    7:  { frames: null, hue: 165, sat: 1.2 },  // teal
    8:  { frames: null, hue: 45,  sat: 0.8 },  // golden warm
    9:  { frames: null, hue: 200, sat: 0.7 },  // slate blue
    10: { frames: null, hue: 260, sat: 1.3 },  // electric indigo
    11: { frames: null, hue: 320, sat: 1.1 },  // magenta rose
    12: { frames: null, hue: 0,   sat: 0.1 },  // silver-grey
  };

  // Base crimson frames used for hue-rotated variants
  const baseFrames = [
    loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'),
    loadImg('/avatars/frame_side.png'),  loadImg('/avatars/frame_back.png')
  ];

  // Get the current avatar's frames & filter string
  function getAvatarFrames() {
    const col = avatarCollections[currentAvatarId] || avatarCollections[1];
    return { frames: col.frames || baseFrames, hue: col.hue, sat: col.sat };
  }

  // Update portrait thumbnails from the sprite sheet
  const gridImg = new Image();
  gridImg.src = '/avatars/portraits_grid.png';
  gridImg.onload = () => {
    const thumbs = document.querySelectorAll('.avatar-thumb');
    thumbs.forEach((thumb, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      // Since columns = 4 and rows = 3, CSS background percentage offsets are col/(4-1)*100 and row/(3-1)*100
      const pctX = (col / 3) * 100;
      const pctY = (row / 2) * 100;
      thumb.style.backgroundImage = `url('/avatars/portraits_grid.png')`;
      thumb.style.backgroundSize = '400% 300%';
      thumb.style.backgroundPosition = `${pctX}% ${pctY}%`;
      thumb.textContent = '';
    });
  };
  let currentAvatarId = 1;
  
  function playShowroomSound(freq = 440, vol = 0.04, duration = 0.08) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  const drapeBtns = document.querySelectorAll('.drape-btn');
  drapeBtns.forEach(btn => {
    btn.onclick = (e) => {
      drapeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      drapeStyle = e.target.dataset.style;
      playShowroomSound(480, 0.04, 0.05);
    };
  });
  
  const btnSpotlight = document.getElementById('btn-spotlight');
  const btnLoupe = document.getElementById('btn-loupe');
  const indicator = document.getElementById('loupe-indicator');
  
  btnSpotlight.onclick = () => {
    btnSpotlight.classList.add('active');
    btnLoupe.classList.remove('active');
    inspectMode = 'spotlight';
    indicator.textContent = 'Spotlight Active: Hover to pan illumination';
    playShowroomSound(600, 0.04, 0.05);
  };
  
  btnLoupe.onclick = () => {
    btnLoupe.classList.add('active');
    btnSpotlight.classList.remove('active');
    inspectMode = 'loupe';
    indicator.textContent = 'Loupe Active: Hover to magnify weave detail';
    playShowroomSound(720, 0.04, 0.05);
  };

  const lightBtns = document.querySelectorAll('.light-btn');
  lightBtns.forEach(btn => {
    btn.onclick = (e) => {
      lightBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      lightTheme = e.target.dataset.light;
      playShowroomSound(540, 0.04, 0.05);
    };
  });

  // View Angle controls
  const btnViewFront = document.getElementById('btn-view-front');
  const btnViewProfile = document.getElementById('btn-view-profile');

  btnViewFront.onclick = () => {
    btnViewFront.classList.add('active');
    btnViewProfile.classList.remove('active');
    viewAngle = 'front';
    playShowroomSound(440, 0.04, 0.05);
  };

  btnViewProfile.onclick = () => {
    btnViewProfile.classList.add('active');
    btnViewFront.classList.remove('active');
    viewAngle = 'profile';
    playShowroomSound(440, 0.04, 0.05);
  };

  // Avatar selector dropdown
  const selectAvatar = document.getElementById('select-avatar-asset');
  const avatarThumbs = document.querySelectorAll('.avatar-thumb');
  
  function updateActiveAvatar(id) {
    currentAvatarId = id;
    selectAvatar.value = id;
    
    avatarThumbs.forEach(t => {
      if (parseInt(t.dataset.id) === id) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });



    const names = {
      1: "Nuapatana Khandua Ikat Saree",
      2: "Sambalpuri Lotus Saree",
      3: "Kotpad Temple Border Saree",
      4: "Konark Sundial Relic Saree",
      5: "Lord Jagannath Provenance Saree",
      6: "Maniabandha Grid Saree",
      7: "Kataki Silk Wave Saree",
      8: "Mayurbhanj Tribal Stripe Saree",
      9: "Gopalpur Tussar Heritage Saree",
      10: "Bomkai Raj Mandala Saree",
      11: "Khandua Crimson Relic Saree",
      12: "Nilagiri Forest Border Saree"
    };
    const artisans = {
      1: "Smt. Sebati Mohanty",
      2: "Shri Ranjan Meher",
      3: "Smt. Sebati Mohanty",
      4: "Shri Ranjan Meher",
      5: "Shri Kailash Meher",
      6: "Shri Kailash Meher",
      7: "Smt. Sebati Mohanty",
      8: "Shri Ranjan Meher",
      9: "Shri Kailash Meher",
      10: "Shri Ranjan Meher",
      11: "Smt. Sebati Mohanty",
      12: "Shri Kailash Meher"
    };
    const locations = {
      1: "Nuapatna, Odisha",
      2: "Maniabandha, Odisha",
      3: "Nuapatna, Odisha",
      4: "Maniabandha, Odisha",
      5: "Puri, Odisha",
      6: "Puri, Odisha",
      7: "Nuapatna, Odisha",
      8: "Maniabandha, Odisha",
      9: "Puri, Odisha",
      10: "Maniabandha, Odisha",
      11: "Nuapatna, Odisha",
      12: "Puri, Odisha"
    };

    document.getElementById('showroom-title').textContent = names[currentAvatarId] || item.name;
    const artisanName = artisans[currentAvatarId] || item.artisan;
    const artisanLoc = locations[currentAvatarId] || (item.coords.includes('20° 26\'') ? 'Nuapatna, Odisha' : item.coords.includes('19° 48\'') ? 'Puri, Odisha' : 'Maniabandha, Odisha');
    document.getElementById('showroom-artisan-name').innerHTML = `${artisanName} &nbsp;·&nbsp; ${artisanLoc}`;
  }

  selectAvatar.onchange = (e) => {
    updateActiveAvatar(parseInt(e.target.value));
    playShowroomSound(500, 0.04, 0.06);
  };

  avatarThumbs.forEach(thumb => {
    thumb.onclick = (e) => {
      const id = parseInt(e.target.dataset.id);
      updateActiveAvatar(id);
      playShowroomSound(520, 0.04, 0.06);
    };
  });
  
  const acquireBtn = document.getElementById('btn-acquire-now');
  const successMsg = document.getElementById('reserve-success-message');
  
  acquireBtn.onclick = async () => {
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: currentAvatarId,
          customer_name: 'Walk-in Guest',
          customer_email: 'guest@antigravity.com',
          message: `Enquired interest in the "${document.getElementById('showroom-title').textContent}"`
        })
      });
      if (res.ok) {
        acquireBtn.classList.add('hidden');
        successMsg.classList.remove('hidden');
        playShowroomSound(880, 0.08, 0.3);
      }
    } catch(e) {
      console.error('Enquiry failed:', e);
    }
  };
  
  // Keyboard Accessibility spins
  const handleKeys = (e) => {
    if (document.getElementById('unweave-modal').classList.contains('hidden')) return;
    if (e.key === 'ArrowRight') {
      velocity = 0.12; 
      playShowroomSound(350, 0.02, 0.05);
    } else if (e.key === 'ArrowLeft') {
      velocity = -0.12;
      playShowroomSound(350, 0.02, 0.05);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (inspectMode === 'spotlight') {
        btnLoupe.click();
      } else {
        btnSpotlight.click();
      }
    }
  };
  window.addEventListener('keydown', handleKeys);
  
  // ── Refined Physics ────────────────────────────────────────────────────────
  let rotation = 0;
  let isDragging = false;
  let startX = 0;
  let velocity = 0.012;         // initial gentle auto-spin
  let lastDx = 0;               // for momentum flick
  const FRICTION       = 0.92;  // smooth deceleration
  const MAX_VELOCITY   = 0.35;  // cap speed on fast flick
  const MIN_AUTO_SPIN  = 0.0015;// idle micro-spin
  let particles = [];

  // ── Zoom System ───────────────────────────────────────────────────────────
  let zoomLevel  = 1.0;         // current zoom scale
  let zoomTarget = 1.0;         // target zoom (spring interpolated)
  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 3.2;
  const ZOOM_SPRING = 0.12;     // spring stiffness

  // Pinch-to-zoom state
  let lastPinchDist = null;

  function applyZoom(delta) {
    zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTarget + delta));
    playShowroomSound(zoomTarget > zoomLevel ? 880 : 440, 0.02, 0.06);
  }

  // Mouse wheel zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.15 : -0.15;
    applyZoom(factor);
  }, { passive: false });

  // Zoom buttons (injected below)
  function attachZoomButtons() {
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    if (btnZoomIn)    btnZoomIn.onclick    = () => applyZoom(0.3);
    if (btnZoomOut)   btnZoomOut.onclick   = () => applyZoom(-0.3);
    if (btnZoomReset) btnZoomReset.onclick = () => { zoomTarget = 1.0; };
  }
  attachZoomButtons();

  // Mouse drag rotation
  canvas.onmousedown = (e) => {
    isDragging = true;
    startX = e.clientX;
    lastDx = 0;
    canvas.style.cursor = 'grabbing';
  };

  window.onmouseup = () => {
    if (isDragging) {
      // Flick momentum: carry last delta as velocity
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, lastDx * 0.015));
    }
    isDragging = false;
    canvas.style.cursor = 'grab';
  };

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    isHovered = true;

    if (isDragging) {
      const dx = e.clientX - startX;
      lastDx = dx;
      const dv = dx * 0.008;  // sensitivity
      rotation += dv;
      startX = e.clientX;

      if (Math.abs(dx) > 2) {
        playShowroomSound(200 + Math.min(Math.abs(dx) * 10, 550), 0.01, 0.03);
      }
      if (Math.random() < 0.4) {
        particles.push({
          angle: rotation + (Math.random() - 0.5) * Math.PI,
          radius: 40 + Math.random() * 80,
          y: my + (Math.random() - 0.5) * 60,
          speedY: -1.0 - Math.random() * 1.8,
          speedR: (Math.random() + 0.3) * 0.025,
          alpha: 0.85, size: 1.0 + Math.random() * 2.2
        });
      }
    }
  };

  canvas.onmouseleave = () => { isHovered = false; isDragging = false; };

  // Touch drag + pinch-to-zoom
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      lastDx = 0;
      lastPinchDist = null;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, lastDx * 0.015));
      isDragging = false;
      lastPinchDist = null;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      const rect = canvas.getBoundingClientRect();
      mx = e.touches[0].clientX - rect.left;
      my = e.touches[0].clientY - rect.top;
      isHovered = true;
      const dx = e.touches[0].clientX - startX;
      lastDx = dx;
      rotation += dx * 0.008;
      startX = e.touches[0].clientX;
    } else if (e.touches.length === 2 && lastPinchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - lastPinchDist) * 0.005;
      applyZoom(delta);
      lastPinchDist = dist;
    }
  }, { passive: true });
  
  function drawDrape() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Spring-interpolated zoom ──
    zoomLevel += (zoomTarget - zoomLevel) * ZOOM_SPRING;

    // ── Refined inertial physics ──
    if (!isDragging) {
      rotation += velocity;
      velocity *= FRICTION;
      if (Math.abs(velocity) < MIN_AUTO_SPIN) {
        velocity = MIN_AUTO_SPIN; // gentle perpetual micro-spin
      }
    }

    // Normalize rotation to [0, 2PI]
    const TAU = Math.PI * 2;
    const normRot = ((rotation % TAU) + TAU) % TAU;

    // ── Frame blending ──
    const FRAME_COUNT = 4;
    const segmentAngle = TAU / FRAME_COUNT;
    const frameIndex = Math.floor(normRot / segmentAngle) % FRAME_COUNT;
    const blendT = (normRot % segmentAngle) / segmentAngle;
    const nextFrameIndex = (frameIndex + 1) % FRAME_COUNT;

    const { frames, hue, sat } = getAvatarFrames();
    const currentFrame = frames[frameIndex];
    const nextFrame = frames[nextFrameIndex];

    const cw = canvas.width;
    const ch = canvas.height;

    // Apply canvas hue-rotate + saturate filter for tinted variants
    if (hue !== 0 || sat !== 1) {
      ctx.filter = `hue-rotate(${hue}deg) saturate(${sat})`;
    } else {
      ctx.filter = 'none';
    }

    // Draw dark background
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle vignette
    const vignette = ctx.createRadialGradient(cw/2, ch/2, ch*0.2, cw/2, ch/2, ch*0.82);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);

    // Draw avatar image frames with cross-fade + zoom transform
    if (currentFrame && currentFrame.complete) {
      const imgW = currentFrame.naturalWidth || cw;
      const imgH = currentFrame.naturalHeight || ch;
      const baseScale = Math.min(cw / imgW, ch / imgH) * 0.95;
      const scale = baseScale * zoomLevel;
      const dw = imgW * scale;
      const dh = imgH * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2 + ch * 0.01;

      // Draw current frame at 1-blendT opacity
      ctx.globalAlpha = 1 - blendT;
      ctx.drawImage(currentFrame, dx, dy, dw, dh);

      // Draw next frame at blendT opacity for smooth crossfade
      if (nextFrame && nextFrame.complete) {
        ctx.globalAlpha = blendT;
        ctx.drawImage(nextFrame, dx, dy, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.filter = 'none'; // reset filter so HUD is uncoloured

      // Studio lighting color grade overlay based on light theme
      if (lightTheme === 'neon') {
        const neonGrad = ctx.createLinearGradient(0, 0, cw, 0);
        neonGrad.addColorStop(0, 'rgba(0, 200, 255, 0.08)');
        neonGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        neonGrad.addColorStop(1, 'rgba(255, 0, 128, 0.08)');
        ctx.fillStyle = neonGrad;
        ctx.fillRect(0, 0, cw, ch);
      } else if (lightTheme === 'zari') {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
        ctx.fillRect(0, 0, cw, ch);
      }

      // Floor reflection
      const reflectHeight = dh * 0.18;
      ctx.save();
      ctx.globalAlpha = 0.22 * (1 - blendT);
      ctx.translate(dx, dy + dh);
      ctx.scale(1, -1);
      ctx.drawImage(currentFrame, 0, dh - reflectHeight, dw, reflectHeight, 0, 0, dw, reflectHeight);
      if (nextFrame && nextFrame.complete) {
        ctx.globalAlpha = 0.22 * blendT;
        ctx.drawImage(nextFrame, 0, dh - reflectHeight, dw, reflectHeight, 0, 0, dw, reflectHeight);
      }
      ctx.restore();

      // Fade reflection with gradient
      ctx.globalAlpha = 1;
      const reflFade = ctx.createLinearGradient(0, dy + dh, 0, dy + dh + reflectHeight);
      reflFade.addColorStop(0, 'rgba(3,3,3,0.5)');
      reflFade.addColorStop(1, 'rgba(3,3,3,1)');
      ctx.fillStyle = reflFade;
      ctx.fillRect(dx, dy + dh, dw, reflectHeight + 4);
    } else {
      ctx.filter = 'none';
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(255,215,0,0.4)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOADING AVATAR MODEL...', cw / 2, ch / 2);
    }

    // Futuristic cyber grid overlay
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.012)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (let y = 0; y < ch; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }

    // Live zoom display element update
    const zoomDisp = document.getElementById('zoom-display');
    if (zoomDisp) zoomDisp.textContent = `${zoomLevel.toFixed(2)}×`;

    // HAPE HUD metrics
    ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SYS: NEXUS_ODISHI_v2.2`, 20, 35);
    ctx.fillText(`ROT: ${(normRot * (180 / Math.PI)).toFixed(1)}°`, 20, 50);
    ctx.fillText(`SPN: ${Math.abs(velocity * 60).toFixed(2)} rad/s`, 20, 65);
    ctx.fillText(`FRM: ${frameIndex + 1}/4 [${['FRONT','3Q-L','SIDE','BACK'][frameIndex]}]`, 20, 80);
    ctx.fillText(`ZOOM: ${zoomLevel.toFixed(2)}×`, 20, 95);

    ctx.textAlign = 'right';
    ctx.fillText(`LENS: ${inspectMode.toUpperCase()}`, cw - 20, 35);
    ctx.fillText(`MODEL: NXS-${String(currentAvatarId).padStart(3,'0')}-PATA`, cw - 20, 50);
    ctx.fillText(`LIGHT: ${lightTheme.toUpperCase()}`, cw - 20, 65);
    ctx.fillText(`STYLE: ${['PATA','IKAT','CHANDERI','KANJIVARAM','TISSUE','SAFFRON','TEAL','AMBER','SLATE','INDIGO','MAGENTA','SILVER'][currentAvatarId-1] || '---'}`, cw - 20, 80);

    // Center drag instruction
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.fillText('↔ CLICK & DRAG TO ROTATE · TOUCH SUPPORTED', cw / 2, ch - 18);

    // Update and draw swirl particles in 3D helix path
    particles.forEach((p, index) => {
      p.angle += p.speedR;
      p.y += p.speedY;
      p.alpha -= 0.012;
      const swirlX = cw / 2 + Math.cos(p.angle) * p.radius;
      if (p.alpha <= 0) {
        particles.splice(index, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(swirlX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Spotlight / Loupe inspect modes
    if (isHovered) {
      if (inspectMode === 'spotlight') {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mx, my, 75, 0, Math.PI * 2); ctx.stroke();
        const lightGrad = ctx.createRadialGradient(mx, my, 5, mx, my, 75);
        lightGrad.addColorStop(0, 'rgba(255, 235, 170, 0.3)');
        lightGrad.addColorStop(0.5, 'rgba(255, 183, 3, 0.06)');
        lightGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath(); ctx.arc(mx, my, 75, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (inspectMode === 'loupe') {
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2); ctx.clip();
        // Magnified region
        const srcX = mx - 33;
        const srcY = my - 33;
        ctx.drawImage(canvas, srcX, srcY, 66, 66, mx - 80, my - 80, 160, 160);
        ctx.restore();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2); ctx.stroke();
      }
    }

    drapeAnimationId = requestAnimationFrame(drawDrape);
  }

  if (drapeAnimationId) cancelAnimationFrame(drapeAnimationId);
  drawDrape();
}

function openUnweaveModal(id) {
  const item = sareeCollection.find(s => s.id === id);
  if (!item) return;
  
  const modal = document.getElementById('unweave-modal');
  modal.classList.remove('hidden');
  
  // Fill showroom data
  document.getElementById('showroom-title').textContent = item.name;
  
  const loc = item.coords.includes('20° 26\'') ? 'Nuapatna, Odisha' : item.coords.includes('19° 48\'') ? 'Puri, Odisha' : 'Maniabandha, Odisha';
  document.getElementById('showroom-artisan-name').innerHTML = `${item.artisan} &nbsp;·&nbsp; ${loc}`;
  
  const fiatPrices = { 1: "₹1,50,000", 2: "₹1,35,000", 3: "₹1,25,000", 4: "₹1,75,000", 5: "₹2,05,000", 6: "₹1,85,000" };
  document.getElementById('showroom-price-fiat').textContent = fiatPrices[item.id] || "₹1,50,000";
  
  document.getElementById('btn-acquire-now').classList.remove('hidden');
  document.getElementById('reserve-success-message').classList.add('hidden');
  
  // Start Drape Renderer
  setupShowroomDrape(item);
}

function closeUnweaveModal() {
  const modal = document.getElementById('unweave-modal');
  modal.classList.add('hidden');
  if (unweaveAnimationId) {
    cancelAnimationFrame(unweaveAnimationId);
    unweaveAnimationId = null;
  }
  if (drapeAnimationId) {
    cancelAnimationFrame(drapeAnimationId);
    drapeAnimationId = null;
  }
}

document.getElementById('close-modal').addEventListener('click', closeUnweaveModal);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUnweaveModal();
});


/* ==========================================================
   INITIALIZATION
========================================================== */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.classList.add('fade-out');
    
    setTimeout(() => {
      document.getElementById('audio-modal').classList.remove('hidden');
    }, 1200);
  }, 1800);
  
  setupGenesisCanvas();
  setupHorizontalPulse();
  setupMetamorphosis();
  setupVaultTunnel();
  setupCustomCursor();
});

function setupCustomCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
  });

  // Smooth trail spring interpolation
  function updateRing() {
    const dx = mouseX - ringX;
    const dy = mouseY - ringY;
    ringX += dx * 0.16; // lag/damping factor
    ringY += dy * 0.16;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(updateRing);
  }
  updateRing();

  // Hover states on interactive elements
  const hoverSelectors = 'a, button, select, input, .avatar-thumb, .card-interactive, .view-btn, .close-modal, .modal-close-btn';
  
  function addHoverListeners() {
    document.querySelectorAll(hoverSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  addHoverListeners();

  // Re-run listener attachment since content is dynamic
  const observer = new MutationObserver(() => addHoverListeners());
  observer.observe(document.body, { childList: true, subtree: true });

  // Drag states specifically for canvases
  const dragCanvases = document.querySelectorAll('canvas');
  dragCanvases.forEach(canvas => {
    canvas.addEventListener('mouseenter', () => {
      if (canvas.id === 'canvas-drape') {
        document.body.classList.add('cursor-drag');
      }
    });
    canvas.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-drag');
    });
  });
}
