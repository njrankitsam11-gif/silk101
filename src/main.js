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
const entryAnimation = { scale: 5.0 };

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
  document.getElementById('audio-toggle').setAttribute('aria-pressed', 'true');
  document.getElementById('audio-toggle').setAttribute('aria-label', 'Turn ambient audio off');
  document.querySelector('#audio-toggle .audio-text').textContent = 'AUDIO ON';
  gsap.to(entryAnimation, {
    scale: 1.0,
    duration: 2.2,
    ease: 'power4.out'
  });
});

document.getElementById('btn-sound-off').addEventListener('click', () => {
  document.getElementById('audio-modal').classList.add('hidden');
  document.getElementById('audio-toggle').classList.remove('playing');
  document.getElementById('audio-toggle').setAttribute('aria-pressed', 'false');
  document.getElementById('audio-toggle').setAttribute('aria-label', 'Turn ambient audio on');
  gsap.to(entryAnimation, {
    scale: 1.0,
    duration: 2.2,
    ease: 'power4.out'
  });
});

document.getElementById('audio-toggle').addEventListener('click', () => {
  const toggle = document.getElementById('audio-toggle');
  if (isAudioPlaying) {
    isAudioPlaying = false;
    toggle.classList.remove('playing');
    toggle.querySelector('.audio-text').textContent = 'AUDIO OFF';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Turn ambient audio on');
    if (synthNode) synthNode.padGain.gain.setValueAtTime(0, audioCtx.currentTime);
  } else {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isAudioPlaying = true;
    toggle.classList.add('playing');
    toggle.querySelector('.audio-text').textContent = 'AUDIO ON';
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', 'Turn ambient audio off');
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

    // 0. Nandighosa Chariot Parallax Background
    if (scrollProgress > 0.01) {
      const chariotY = canvas.height - (scrollProgress * 400);
      ctx.save();
      
      // Draw background red-yellow layered canopy
      ctx.fillStyle = 'rgba(211, 47, 47, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx - 180, canvas.height);
      ctx.lineTo(cx - 100, chariotY + 80);
      ctx.lineTo(cx, chariotY - 60);
      ctx.lineTo(cx + 100, chariotY + 80);
      ctx.lineTo(cx + 180, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 199, 44, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx - 120, canvas.height);
      ctx.lineTo(cx - 60, chariotY + 120);
      ctx.lineTo(cx, chariotY);
      ctx.lineTo(cx + 60, chariotY + 120);
      ctx.lineTo(cx + 120, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Top Kalasa spire dome
      ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, chariotY - 60, 10, 0, Math.PI, true);
      ctx.fill();

      // Left Chariot Wheel (Rotates clockwise)
      ctx.save();
      ctx.translate(cx - 240, canvas.height - 100 + (scrollProgress * 80));
      ctx.rotate(scrollProgress * Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 16; s++) {
        const ang = (s * Math.PI) / 8;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 90, Math.sin(ang) * 90);
      }
      ctx.stroke();
      ctx.restore();

      // Right Chariot Wheel (Rotates counter-clockwise)
      ctx.save();
      ctx.translate(cx + 240, canvas.height - 100 + (scrollProgress * 80));
      ctx.rotate(-scrollProgress * Math.PI * 1.5);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 2);
      ctx.stroke();
      for (let s = 0; s < 16; s++) {
        const ang = (s * Math.PI) / 8;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 90, Math.sin(ang) * 90);
      }
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
    
    const scale = (1 - scrollProgress * 0.75) * entryAnimation.scale;
    
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

    // 1B. Sacred Triad Face Silhouette (Fades in on scroll)
    if (scrollProgress > 0.05) {
      ctx.save();
      ctx.translate(0, driftY - 100);
      
      const triadAlpha = Math.min((scrollProgress - 0.05) * 2, 0.45);
      
      // Draw Central deity (Jagannath: large black round face, circular eyes)
      ctx.fillStyle = `rgba(10, 10, 10, ${triadAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      
      // Left eye
      ctx.fillStyle = `rgba(255, 255, 255, ${triadAlpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(-16, -5, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(195, 27, 27, ${triadAlpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(-16, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(10, 10, 10, ${triadAlpha * 2})`;
      ctx.beginPath();
      ctx.arc(-16, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye
      ctx.fillStyle = `rgba(255, 255, 255, ${triadAlpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(16, -5, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(195, 27, 27, ${triadAlpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(16, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(10, 10, 10, ${triadAlpha * 2})`;
      ctx.beginPath();
      ctx.arc(16, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Tilaka
      ctx.fillStyle = `rgba(212, 175, 55, ${triadAlpha * 2})`;
      ctx.beginPath();
      ctx.arc(0, -18, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
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
    x: '-500vw',
    ease: 'none',
    scrollTrigger: {
      trigger: '#artisan-pulse',
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=3000',
    }
  });

  ScrollTrigger.create({
    trigger: '#artisan-pulse',
    start: 'top top',
    end: '+=3000',
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;
      const bg = document.querySelector('.patta-bg');
      const mid = document.querySelector('.patta-mid');
      const fore = document.querySelector('.patta-fore');
      if (bg && mid && fore) {
        bg.style.transform = `translateX(${-progress * 250}px)`;
        mid.style.transform = `translateX(${-progress * 550}px)`;
        fore.style.transform = `translateX(${-progress * 950}px)`;
      }
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
        
        if (val === 1) {
          if (borderPattern === 'lotus') {
            ctxRight.fillStyle = 'rgba(224, 17, 95, 0.65)';
            ctxRight.beginPath();
            ctxRight.moveTo(cx, dy - 6);
            ctxRight.quadraticCurveTo(cx - 6, dy - 2, cx - 2, dy + 6);
            ctxRight.quadraticCurveTo(cx, dy + 2, cx + 2, dy + 6);
            ctxRight.quadraticCurveTo(cx + 6, dy - 2, cx, dy - 6);
            ctxRight.fill();
          } else if (borderPattern === 'temple') {
            ctxRight.fillStyle = 'rgba(212, 175, 55, 0.65)';
            ctxRight.beginPath();
            ctxRight.moveTo(cx, dy - 6);
            ctxRight.lineTo(cx - 6, dy + 6);
            ctxRight.lineTo(cx + 6, dy + 6);
            ctxRight.closePath();
            ctxRight.fill();
          } else if (borderPattern === 'grid') {
            const odiaChars = ["ଅ", "ଇ", "ଉ", "କ", "ଖ", "ଗ", "ଘ", "ଚ", "ଛ", "ଜ", "ଝ", "ଟ", "ଠ", "ଡ", "ତ", "ଥ", "ଦ", "ଧ", "ନ", "ପ", "ଫ", "ବ", "ଭ", "ମ", "ଯ", "ର", "ଲ", "ଶ", "ସ", "ହ"];
            const charIndex = Math.abs(Math.floor(cx + dy)) % odiaChars.length;
            ctxRight.fillStyle = 'rgba(212, 175, 55, 0.75)';
            ctxRight.font = "bold 11px sans-serif";
            ctxRight.textAlign = "center";
            ctxRight.textBaseline = "middle";
            ctxRight.fillText(odiaChars[charIndex], cx, dy);
          } else {
            ctxRight.fillStyle = 'rgba(212, 175, 55, 0.4)';
            ctxRight.beginPath();
            ctxRight.arc(cx, dy, 5, 0, Math.PI * 2);
            ctxRight.fill();
          }
        } else {
          ctxRight.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctxRight.beginPath();
          ctxRight.arc(cx, dy, 2, 0, Math.PI * 2);
          ctxRight.fill();
        }
        
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
   SECTION 2.5: CUSTOM WEAVING COMMISSION STUDIO
========================================================== */
function setupCustomCommissionStudio() {
  const canvas = document.getElementById('canvas-custom-saree');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const selectArtisan = document.getElementById('comm-artisan');
  const sliderBodyHue = document.getElementById('comm-body-hue');
  const sliderBorderHue = document.getElementById('comm-border-hue');
  const selectMotif = document.getElementById('comm-motif');
  const selectDensity = document.getElementById('comm-density');

  const elEstTime = document.getElementById('comm-est-time');
  const elEstPrice = document.getElementById('comm-est-price');
  const formCommission = document.getElementById('form-custom-commission');

  function getSettings() {
    if (!selectArtisan) return { artisanId: 1, bodyHue: 340, borderHue: 45, motif: 'lotus', density: 4200, time: 34, price: 136000 };
    const artisanId = parseInt(selectArtisan.value);
    const bodyHue = parseInt(sliderBodyHue.value);
    const borderHue = parseInt(sliderBorderHue.value);
    const motif = selectMotif.value;
    const density = parseInt(selectDensity.value);

    let time = 24;
    if (density === 4200) time = 34;
    else if (density === 6000) time = 48;

    let motifAdd = 4;
    if (motif === 'peacock') motifAdd = 8;
    else if (motif === 'elephant') motifAdd = 12;
    else if (motif === 'temple') motifAdd = 6;
    time += motifAdd;

    let price = density * 30;
    let motifCost = 10000;
    if (motif === 'peacock') motifCost = 18000;
    else if (motif === 'elephant') motifCost = 25000;
    else if (motif === 'temple') motifCost = 14000;
    price += motifCost;

    return { artisanId, bodyHue, borderHue, motif, density, time, price };
  }

  function updateEstimates() {
    const settings = getSettings();
    if (elEstTime) elEstTime.textContent = `${settings.time} Days`;
    if (elEstPrice) elEstPrice.textContent = `₹${settings.price.toLocaleString('en-IN')}`;
  }

  function draw() {
    if (!canvas) return;
    const settings = getSettings();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.0015;
    
    ctx.save();
    
    ctx.fillStyle = `hsl(${settings.bodyHue}, 75%, 22%)`;
    ctx.strokeStyle = `hsl(${settings.bodyHue}, 80%, 40%)`;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(30, 40);
    ctx.bezierCurveTo(120, 20 + Math.sin(time) * 10, 320, 50, canvas.width - 30, 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 70);
    ctx.bezierCurveTo(320, canvas.height - 60 + Math.cos(time) * 10, 120, canvas.height - 80, 30, canvas.height - 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `hsla(${settings.bodyHue}, 80%, 30%, 0.15)`;
    ctx.lineWidth = 0.5;
    for (let y = 50; y < canvas.height - 80; y += 4) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(canvas.width - 32, y + Math.sin(time + y * 0.05) * 2);
      ctx.stroke();
    }

    ctx.fillStyle = `hsl(${settings.borderHue}, 80%, 35%)`;
    ctx.strokeStyle = `hsl(${settings.borderHue}, 90%, 55%)`;
    ctx.lineWidth = 2;
    
    ctx.fillRect(30, 40, 25, canvas.height - 110);
    ctx.strokeRect(30, 40, 25, canvas.height - 110);
    
    ctx.fillRect(canvas.width - 55, 40, 25, canvas.height - 110);
    ctx.strokeRect(canvas.width - 55, 40, 25, canvas.height - 110);

    ctx.fillStyle = `hsl(${settings.borderHue}, 90%, 55%)`;
    for (let y = 60; y < canvas.height - 90; y += 30) {
      if (settings.motif === 'temple') {
        ctx.beginPath();
        ctx.moveTo(55, y);
        ctx.lineTo(65, y + 10);
        ctx.lineTo(55, y + 20);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(canvas.width - 55, y);
        ctx.lineTo(canvas.width - 65, y + 10);
        ctx.lineTo(canvas.width - 55, y + 20);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(60, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(canvas.width - 60, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.shadowColor = `hsl(${settings.borderHue}, 80%, 50%)`;
    ctx.shadowBlur = 15;
    ctx.fillStyle = `hsl(${settings.borderHue}, 70%, 30%)`;
    ctx.strokeStyle = `hsl(${settings.borderHue}, 90%, 60%)`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = `hsl(${settings.borderHue}, 90%, 65%)`;
    ctx.lineWidth = 1.5;
    if (settings.motif === 'lotus') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 28, 0, 0, Math.PI*2);
      ctx.ellipse(cx, cy, 28, 14, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    } else if (settings.motif === 'peacock') {
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 15, 0, Math.PI*2);
      ctx.moveTo(cx, cy + 5);
      ctx.bezierCurveTo(cx - 20, cy + 20, cx + 20, cy + 40, cx, cy + 45);
      ctx.stroke();
    } else if (settings.motif === 'elephant') {
      ctx.beginPath();
      ctx.arc(cx - 8, cy, 12, 0, Math.PI*2);
      ctx.moveTo(cx - 8, cy);
      ctx.quadraticCurveTo(cx + 15, cy - 20, cx + 22, cy);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 35);
      ctx.lineTo(cx - 30, cy + 25);
      ctx.lineTo(cx + 30, cy + 25);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  if (selectArtisan) {
    selectArtisan.addEventListener('change', updateEstimates);
    sliderBodyHue.addEventListener('input', updateEstimates);
    sliderBorderHue.addEventListener('input', updateEstimates);
    selectMotif.addEventListener('change', updateEstimates);
    selectDensity.addEventListener('change', updateEstimates);
  }

  if (formCommission) {
    formCommission.onsubmit = async (e) => {
      e.preventDefault();
      const settings = getSettings();
      
      const customerName = prompt("Enter your Name to reserve the commission loom slot:");
      if (!customerName) return;
      const customerEmail = prompt("Enter your Email for design verification updates:");
      if (!customerEmail || !customerEmail.includes('@')) {
        alert("Valid email required.");
        return;
      }

      const message = `Bespoke Saree Commission Request: Main Motif: ${settings.motif.toUpperCase()}, Thread Density: ${settings.density} threads, Body Hue: ${settings.bodyHue}°, Border Hue: ${settings.borderHue}°. Assigned to Weaver ID: ${settings.artisanId}.`;

      try {
        const response = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: null,
            customer_name: customerName,
            customer_email: customerEmail,
            message: message
          })
        });
        const data = await response.json();
        if (response.ok) {
          alert(`✨ Commission Submitted Successfully! Your reservation code: COM-${data.id}. Our master weaver cooperative will reach out to you within 24 hours.`);
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch(err) {
        alert(`✨ Commission Reserved offline! Your reservation code: COM-MOCK. We will register this to local storage.`);
      }
    };
  }

  updateEstimates();
  draw();
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
    
    const physDrift = -scrollProgress * 240;
    const digiDrift = scrollProgress * 220;
    const time = Date.now() * 0.001;
    
    // ==========================================
    // 1. TRADITIONAL SIDE (Puri Spire & Jagannath Netranayana)
    // ==========================================
    ctx.save();
    ctx.translate(cx + physDrift - (window.innerWidth < 768 ? 0 : 150), cy);
    ctx.scale(scale * 0.75, scale * 0.75);
    
    // A. Sacred Temple Spire (Deula) Silhouette in background
    ctx.fillStyle = 'rgba(128, 0, 32, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-160, 240);
    ctx.quadraticCurveTo(-100, -100, -50, -160);
    ctx.quadraticCurveTo(-10, -220, 0, -250); // top spire point
    ctx.quadraticCurveTo(10, -220, 50, -160);
    ctx.quadraticCurveTo(100, -100, 160, 240);
    ctx.closePath();
    ctx.fill();

    // Spire steps
    ctx.fillStyle = 'rgba(128, 0, 32, 0.2)';
    for(let sy = -120; sy < 200; sy += 40) {
      ctx.fillRect(-100 + (sy+120)*0.2, sy, 200 - (sy+120)*0.4, 6);
    }
    
    // B. Jagannath Eyes (Netranayana)
    const eyeRadius = 60;
    const eyeSpacing = 75;
    
    // Draw Left and Right Eyes
    [-1, 1].forEach(side => {
      const ex = side * eyeSpacing;
      const ey = 40;
      
      // Outer border (Black rim)
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius + 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer White
      ctx.fillStyle = '#f7f4eb';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Red ring
      ctx.fillStyle = '#b31b1b';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Yellow ring
      ctx.fillStyle = '#e5a93b';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner Black Pupil
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // White reflection dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 4, ey - 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Eye lashes/rays (Traditional painting details)
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        ctx.beginPath();
        ctx.moveTo(ex + Math.cos(a) * eyeRadius, ey + Math.sin(a) * eyeRadius);
        ctx.lineTo(ex + Math.cos(a) * (eyeRadius + 6), ey + Math.sin(a) * (eyeRadius + 6));
        ctx.stroke();
      }
    });
    
    // C. Forehead Tilaka (Crescent and Dot)
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI, true);
    ctx.lineTo(0, -35);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, -45, 6, 0, Math.PI * 2);
    ctx.fill();

    // D. Silk grid threads overlay
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let d = -200; d <= 200; d += 10) {
      ctx.moveTo(d, -200);
      ctx.lineTo(d, 200);
      ctx.moveTo(-200, d);
      ctx.lineTo(200, d);
    }
    ctx.stroke();
    
    ctx.restore();
    
    // ==========================================
    // 2. DIGITAL SIDE (Holographic Konark Wheel & Kumbha Borders)
    // ==========================================
    ctx.save();
    ctx.translate(cx + digiDrift + (window.innerWidth < 768 ? 0 : 150), cy);
    ctx.scale(scale * 0.75, scale * 0.75);
    
    const latticeAlpha = Math.min(scrollProgress * 1.5, 0.95);
    
    // A. Digital Kumbha (Temple border triangles) along the sides
    ctx.fillStyle = `rgba(224, 17, 95, ${latticeAlpha * 0.12})`;
    ctx.strokeStyle = `rgba(224, 17, 95, ${latticeAlpha * 0.5})`;
    ctx.lineWidth = 1;
    
    for (let i = -3; i <= 3; i++) {
      const ty = i * 60;
      // Left Kumbha triangle pointing right
      ctx.beginPath();
      ctx.moveTo(-180, ty - 20);
      ctx.lineTo(-140, ty);
      ctx.lineTo(-180, ty + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Kumbha triangle pointing left
      ctx.beginPath();
      ctx.moveTo(180, ty - 20);
      ctx.lineTo(140, ty);
      ctx.lineTo(180, ty + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    // B. Holographic Konark Sun Wheel rotating
    ctx.save();
    ctx.rotate(time * 0.12);
    
    ctx.strokeStyle = `rgba(212, 175, 55, ${latticeAlpha * 0.6})`;
    ctx.lineWidth = 1.5;
    
    // Outer Wheel Rim
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner Wheel Rim
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.stroke();
    
    // Hub
    ctx.fillStyle = `rgba(212, 175, 55, ${latticeAlpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // 8 spokes
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.rotate(angle);
      
      // Main spoke vector line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -85);
      ctx.stroke();
      
      // Spoke vertex point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -85, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Spoke decorative wheel details
      ctx.strokeStyle = `rgba(255, 255, 255, ${latticeAlpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, -45, 8, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.rotate(-angle);
    }
    ctx.restore();

    // C. Binary Weaving Data Matrix
    ctx.font = "8px monospace";
    ctx.fillStyle = `rgba(212, 175, 55, ${latticeAlpha * 0.35})`;
    for (let col = -120; col <= 120; col += 40) {
      for (let row = -120; row <= 120; row += 30) {
        const binVal = Math.round(Math.random()) ? "1" : "0";
        ctx.fillText(binVal, col + Math.sin(time + row)*2, row);
      }
    }
    
    ctx.restore();
    
    requestAnimationFrame(draw);
  }
  draw();
}


/* ==========================================================
   SECTION 4: THE VAULT (Z-Axis Parallax & Gold Shader)
========================================================== */
let sareeCollection = [];

const FALLBACK_INVENTORY = [
  {
    id: 1,
    name: 'Nuapatana Khandua Ikat Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 150000,
    stock_status: 'available',
    material: '100% Pure Mulberry Silk',
    weaving_time_days: 28,
    description: 'A masterpiece of Nuapatna, tie-dyed with organic crimson and gold. Highlights a stylized geometric gold elephant Zari motif on the Pallu.',
    color_hue: 0,
    color_saturation: 1.0
  },
  {
    id: 2,
    name: 'Sambalpuri Lotus Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 135000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 24,
    description: 'Traditional Sambalpuri Lotus. Bold raspberry red background with gold-plated silver thread Zari portraying organic lotus petals.',
    color_hue: 320,
    color_saturation: 1.2
  },
  {
    id: 3,
    name: 'Kotpad Temple Border Saree',
    category_id: 2,
    category_name: 'Chanderi',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 125000,
    stock_status: 'available',
    material: 'Organic Cotton',
    weaving_time_days: 35,
    description: 'Kotpad tribal style, featuring deep forest green with ocher oad-tree roots temple borders. Colored using local organic tree barks.',
    color_hue: 165,
    color_saturation: 1.2
  },
  {
    id: 4,
    name: 'Konark Sundial Relic Saree',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Tussar Silk',
    weaving_time_days: 30,
    description: 'Dedicated to the Sun God of Konark. The Pallu features a highly detailed, procedurally woven stone relief wheel representing time divisions.',
    color_hue: 260,
    color_saturation: 1.3
  },
  {
    id: 5,
    name: 'Lord Jagannath Provenance Saree',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Puri, Odisha',
    price_fiat: 205000,
    stock_status: 'available',
    material: 'Khandua Silk',
    weaving_time_days: 42,
    description: 'Sacred Khandua style. Features Balabhadra, Subhadra, and Lord Jagannath in holy shrine, with vertical lotus borders. Woven with ocher and vermilion silk.',
    color_hue: 45,
    color_saturation: 0.8
  },
  {
    id: 6,
    name: 'Maniabandha Grid Saree',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Puri, Odisha',
    price_fiat: 185000,
    stock_status: 'available',
    material: 'Fine Silk Blend',
    weaving_time_days: 28,
    description: 'Classic Maniabandha grid layout. Geometric diamonds and checkerboard squares representing mathematical symmetry in handloom.',
    color_hue: 30,
    color_saturation: 1.1
  }
];

const FALLBACK_ARTICLES = [
  {
    id: 1,
    slug: 'buy-khandua-silk-sarees-online',
    title: 'Buy Khandua Silk Sarees Online — A Global Buyer’s Guide',
    meta_description: 'Are you looking to buy authentic Khandua Silk sarees online from USA, UK, Canada or UAE? Read our comprehensive 2026 handloom checklist, price guides, and weaver certificate verification.',
    content_html: `<article>
      <h1>Buy Khandua Silk Sarees Online — A Global Buyer’s Guide</h1>
      <p class="intro">For the global Indian diaspora, holding a piece of home is a feeling beyond words. The Khandua Silk saree, originating from the ancient village of Nuapatna in Odisha, represents over eight centuries of sacred weaving heritage.</p>
      <h2>Why Khandua Silk is Sacred</h2>
      <p>Traditionally woven for the deities of the Jagannath Temple in Puri, Khandua silk incorporates shlokas from Gita Govinda directly into its weave. Known as the "Loom of Devotion", this fabric uses tie-dyed mulberry silk threads, dyed with local organic turmeric, indigo, and madder root extracts.</p>
      <h2>How to Verify Authentic Handloom Silk Online</h2>
      <ul>
        <li><strong>Look for the Silk Mark Certification:</strong> Authentic pieces carry a government-certified label with a unique hologram.</li>
        <li><strong>Inspect the Zari Weft:</strong> Genuine gold and silver plated copper threads feel heavy and display a subtle, elegant gleam rather than a harsh metallic shine.</li>
        <li><strong>Identify Warp Variations:</strong> Unlike powerlooms, handlooms have organic irregularities in thread count and tension, reflecting human craftsmanship.</li>
      </ul>
      <h2>Global Shipping and Custom Sizing Details</h2>
      <p>Our platform delivers directly from Tigiria and Maniabandha weaving cooperatives to international destinations like New York, London, Toronto, Dubai, and Sydney. All custom blouse stitching requests are handled by expert traditional tailors in Odisha.</p>
    </article>`,
    topic_keyword: 'buy Khandua silk online',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    slug: 'odisha-handloom-heritage-diaspora',
    title: 'Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora',
    meta_description: 'Discover the legacy of double-Ikat patterns, Sambalpuri Lotus motifs, and Maniabandha weaves. Why global Indian diaspora collectors trust pure handloom drapes.',
    content_html: `<article>
      <h1>Odisha Handloom Heritage: Sambalpuri Ikat for the Indian Diaspora</h1>
      <p class="intro">From the mathematical geometry of Maniabandha grids to the spectacular floral complexity of Sambalpuri Lotus sarees, Odisha's handloom stands as a testament to the country's ancient craftsmanship.</p>
      <h2>The Art of Ikat</h2>
      <p>Ikat, or "Bandha", is a resist dyeing technique where the warp and weft threads are tied and dyed prior to weaving. In double-Ikat, both warp and weft are dyed with mathematical precision so they align perfectly on the loom to form motifs of elephants, conch shells, and lotus blooms.</p>
      <h2>Preserving Heritage Abroad</h2>
      <p>For Indians residing in countries like Australia, the UK, and the USA, owning an authentic Sambalpuri saree is a way to celebrate cultural pride at festivals, family weddings, and religious gatherings. Powerloom counterfeits have flooded mass marketplaces, which is why sourcing directly from weaver cooperatives remains paramount.</p>
    </article>`,
    topic_keyword: 'authentic Sambalpuri saree',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    slug: 'how-to-style-patta-silk-wedding-abroad',
    title: 'How to Style a Patta Silk Saree for Wedding Season Abroad',
    meta_description: 'Learn how to style traditional Odisha Patta and Khandua Silk sarees for modern wedding celebrations in the USA, UK, Canada, and Australia.',
    content_html: `<article>
      <h1>How to Style a Patta Silk Saree for Wedding Season Abroad</h1>
      <p class="intro">Odisha Patta Silk is famous for its heavy weight, structural drape, and rich temple borders. Styling it for an international destination wedding requires balancing traditional elegance with modern comfort.</p>
      <h2>1. The Classic Royal Drape</h2>
      <p>Drape the saree with a neat, pleated pallu over the left shoulder to highlight the detailed craftsmanship of the Zari-work temple motifs. This drape works best with heavy gold jewelry or high-neck blouses.</p>
      <h2>2. The Contemporary Jacket Blouse</h2>
      <p>In colder regions like the UK or Canada, pair your Patta silk with a tailored velvet jacket or brocade crop blouse. This adds structural modern elegance while keeping you warm during winter receptions.</p>
      <h2>3. Minimalist Modern Styling</h2>
      <p>Keep accessories minimal with simple diamond studs and a sleek watch. Let the vibrant organic dyes and bold geometric prints of Maniabandha silk occupy center stage.</p>
    </article>`,
    topic_keyword: 'traditional Indian saree online',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    slug: 'how-to-identify-real-handloom-silk',
    title: 'Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom',
    meta_description: 'The ultimate guide to distinguishing pure zero-electricity handloom silk sarees from cheap machine-made duplicates. Key checks for Zari, borders, and weave.',
    content_html: `<article>
      <h1>Authentication Checklist: How to Identify Real Handloom Silk vs. Powerloom</h1>
      <p class="intro">As the global demand for Indian handlooms rises, cheap machine duplicates have flooded the market. Use this five-step checklist to ensure you are buying real heritage craft.</p>
      <h2>1. The Temple Border Joint</h2>
      <p>On a handloom, the transition border where the body meets the border (often called "Phoda Kumbha" or temple spikes) is woven by interlocking the threads. This leaves a unique hand-joined edge. Powerlooms mimic this with print or loose threads.</p>
      <h2>2. The Thread Burning Test</h2>
      <p>Real mulberry silk threads burn with a smell similar to burning hair, leaving behind a crumbly black ash. Synthetic fibers melt, smell like plastic, and form a hard bead.</p>
      <h2>3. The Reverse Side Check</h2>
      <p>Look at the reverse side of the pallu. Handloom sarees feature clean, hand-threaded knots and floats. Powerlooms will show mass-clipped, fuzzy loose threads from automated shuttle cutters.</p>
    </article>`,
    topic_keyword: 'handloom silk saree Odisha',
    target_locale: 'global',
    status: 'published',
    created_at: new Date().toISOString()
  }
];

function initializeLocalStorage() {
  try {
    const inv = localStorage.getItem('saree_inventory');
    if (!inv || JSON.parse(inv).length === 0) {
      localStorage.setItem('saree_inventory', JSON.stringify(FALLBACK_INVENTORY));
    }
  } catch (e) {
    localStorage.setItem('saree_inventory', JSON.stringify(FALLBACK_INVENTORY));
  }
  
  try {
    const arts = localStorage.getItem('saree_artisans');
    if (!arts || JSON.parse(arts).length === 0) {
      localStorage.setItem('saree_artisans', JSON.stringify([
        { id: 1, name: 'Smt. Sebati Mohanty', location: 'Nuapatna, Odisha', experience_years: 32, bio: 'Master weaver specializing in sacred Khandua scripture patterns.', status: 'active' },
        { id: 2, name: 'Shri Ranjan Meher', location: 'Maniabandha, Odisha', experience_years: 28, bio: 'Expert in mathematical geometric double-Ikat patterns.', status: 'active' },
        { id: 3, name: 'Shri Kailash Meher', location: 'Puri, Odisha', experience_years: 40, bio: 'Renowned for complex mythological and temple architecture drapes.', status: 'active' }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_artisans', JSON.stringify([
      { id: 1, name: 'Smt. Sebati Mohanty', location: 'Nuapatna, Odisha', experience_years: 32, bio: 'Master weaver specializing in sacred Khandua scripture patterns.', status: 'active' },
      { id: 2, name: 'Shri Ranjan Meher', location: 'Maniabandha, Odisha', experience_years: 28, bio: 'Expert in mathematical geometric double-Ikat patterns.', status: 'active' },
      { id: 3, name: 'Shri Kailash Meher', location: 'Puri, Odisha', experience_years: 40, bio: 'Renowned for complex mythological and temple architecture drapes.', status: 'active' }
    ]));
  }

  try {
    const cats = localStorage.getItem('saree_categories');
    if (!cats || JSON.parse(cats).length === 0) {
      localStorage.setItem('saree_categories', JSON.stringify([
        { id: 1, name: 'Ikat', description: 'Tie-dyed warp and weft patterns' },
        { id: 2, name: 'Chanderi', description: 'Sheer texture and gold border' },
        { id: 3, name: 'Kanjivaram', description: 'Heavy silk and wide borders' },
        { id: 4, name: 'Tissue Silk', description: 'Woven with metallic gold threads' }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_categories', JSON.stringify([
      { id: 1, name: 'Ikat', description: 'Tie-dyed warp and weft patterns' },
      { id: 2, name: 'Chanderi', description: 'Sheer texture and gold border' },
      { id: 3, name: 'Kanjivaram', description: 'Heavy silk and wide borders' },
      { id: 4, name: 'Tissue Silk', description: 'Woven with metallic gold threads' }
    ]));
  }

  try {
    const enqs = localStorage.getItem('saree_enquiries');
    if (!enqs || JSON.parse(enqs).length === 0) {
      localStorage.setItem('saree_enquiries', JSON.stringify([
        { id: 1, item_id: 1, item_name: 'Nuapatana Khandua Ikat Saree', customer_name: 'Aditi Rao', customer_email: 'aditi@example.com', message: 'I would love to schedule a custom sizing enquiry for the Khandua Saree.', status: 'pending', created_at: new Date().toISOString() }
      ]));
    }
  } catch (e) {
    localStorage.setItem('saree_enquiries', JSON.stringify([
      { id: 1, item_id: 1, item_name: 'Nuapatana Khandua Ikat Saree', customer_name: 'Aditi Rao', customer_email: 'aditi@example.com', message: 'I would love to schedule a custom sizing enquiry for the Khandua Saree.', status: 'pending', created_at: new Date().toISOString() }
    ]));
  }

  try {
    const articles = localStorage.getItem('saree_articles');
    if (!articles || JSON.parse(articles).length === 0) {
      localStorage.setItem('saree_articles', JSON.stringify(FALLBACK_ARTICLES));
    }
  } catch (e) {
    localStorage.setItem('saree_articles', JSON.stringify(FALLBACK_ARTICLES));
  }
}

async function fetchInventory() {
  try {
    const response = await fetch('/api/inventory');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem('saree_inventory', JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    }
  } catch (e) {
    console.warn('API fetch failed, falling back to localStorage:', e);
  }
  
  try {
    initializeLocalStorage();
    const stored = localStorage.getItem('saree_inventory');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
  }
  
  return FALLBACK_INVENTORY;
}

// Dynamic Currency Conversion Utility
function getLocaleDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang') || 'en-IN';
  
  const currencies = {
    'en-US': { rate: 0.012, symbol: '$', code: 'USD' },
    'en-GB': { rate: 0.0094, symbol: '£', code: 'GBP' },
    'en-CA': { rate: 0.016, symbol: '$', code: 'CAD' },
    'en-AU': { rate: 0.018, symbol: '$', code: 'AUD' },
    'en-AE': { rate: 0.044, symbol: 'AED ', code: 'AED' },
    'en-SG': { rate: 0.016, symbol: '$', code: 'SGD' },
    'en-IN': { rate: 1.0, symbol: '₹', code: 'INR' },
    'hi-IN': { rate: 1.0, symbol: '₹', code: 'INR' }
  };
  
  return currencies[lang] || currencies['en-IN'];
}

function formatSareePrice(inrPrice) {
  const details = getLocaleDetails();
  const converted = inrPrice * details.rate;
  return `${details.symbol}${Math.round(converted).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

async function setupVaultTunnel() {
  const stage = document.getElementById('tunnel-stage');
  if (!stage) return;
  stage.innerHTML = '<div style="color:var(--color-zari); font-family:\'Outfit\'; font-size:1.1rem; text-align:center; padding:100px 0;">Weaving loom connection...</div>';

  try {
    sareeCollection = await fetchInventory();
    
    stage.innerHTML = ''; // Clear loading indicator
    
    sareeCollection.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'saree-card';
      card.dataset.id = item.id;
      
      const shadow = document.createElement('div');
      shadow.className = 'saree-layer layer-shadow';
      
      const silk = document.createElement('div');
      silk.className = 'saree-layer layer-silk';
      
      // Model draped in saree layer
      const model = document.createElement('div');
      model.className = 'saree-layer layer-model';
      
      const modelLook = ((Number(item.id) - 1) % 5) + 1;
      const modelSources = {
        1: '/avatars/frame_front.png',
        2: '/avatars/navy_front.png',
        3: '/avatars/green_front.png',
        4: '/avatars/purple_front.png',
        5: '/avatars/golden_front.png'
      };
      const modelImgSrc = modelSources[modelLook];
      model.style.backgroundImage = `url(${modelImgSrc})`;
      
      const zari = document.createElement('div');
      zari.className = 'saree-layer layer-zari';
      
      // Dynamic Canvas Shading using database HSL colors
      const silkCanvas = document.createElement('canvas');
      silkCanvas.width = 420;
      silkCanvas.height = 580;
      drawSilkTexture(silkCanvas.getContext('2d'), item.color_hue || 0, item.color_saturation || 1.0);
      silk.style.backgroundImage = `url(${silkCanvas.toDataURL()})`;
      
      const zariCanvas = document.createElement('canvas');
      zariCanvas.width = 420;
      zariCanvas.height = 580;
      drawZariPattern(zariCanvas.getContext('2d'), item);
      zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
      
      const isSold = item.stock_status === 'sold';
      const isReserved = item.stock_status === 'reserved';
      const statusLabel = isSold ? 'SOLD' : isReserved ? 'RESERVED' : '1-OF-1 COLLECTION';
      
      const info = document.createElement('div');
      info.className = 'saree-info';
      info.innerHTML = `
        <span class="saree-num">${statusLabel} / #${String(item.id).padStart(4, '0')}</span>
        <h4 class="saree-name">${item.name}</h4>
        <span class="saree-action">${isSold ? 'Archived Masterpiece' : 'Enter 3D Showcase'}</span>
      `;
      
      card.appendChild(shadow);
      card.appendChild(silk);
      card.appendChild(model);
      card.appendChild(zari);
      card.appendChild(info);
      
      stage.appendChild(card);
      
      // Dynamic gold light shader reflection on mouse move
      card.addEventListener('mousemove', (e) => {
        const cardRect = card.getBoundingClientRect();
        const mx = e.clientX - cardRect.left;
        const my = e.clientY - cardRect.top;
        
        const zariCtx = zariCanvas.getContext('2d');
        zariCtx.clearRect(0, 0, 420, 580);
        
        drawZariPattern(zariCtx, item);
        
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
      
      card.addEventListener('mouseleave', () => {
        const zariCtx = zariCanvas.getContext('2d');
        zariCtx.clearRect(0, 0, 420, 580);
        drawZariPattern(zariCtx, item);
        zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
      });
      
      card.addEventListener('click', () => {
        openUnweaveModal(item, sareeCollection);
      });
    });
    
    // Bind scroll parallax timeline trigger
    setupVaultScrollParallax();
  } catch (error) {
    console.error('Vault API load failed:', error);
    stage.innerHTML = '<div style="color:#ff6b6b; font-family:\'Outfit\'; text-align:center; padding:100px 0;">Error loading collection from database.</div>';
  }
}

// Separate ScrollTrigger binding for dynamic cards length
function setupVaultScrollParallax() {
  const cards = document.querySelectorAll('.saree-card');
  if (cards.length === 0) return;
  
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
}

function drawSilkTexture(ctx, hue, sat) {
  const grad = ctx.createLinearGradient(0, 0, 420, 580);
  grad.addColorStop(0, `hsl(${hue}, ${Math.floor(sat * 90)}%, 22%)`);
  grad.addColorStop(0.5, `hsl(${hue}, ${Math.floor(sat * 100)}%, 32%)`);
  grad.addColorStop(1, `hsl(${hue}, ${Math.floor(sat * 90)}%, 14%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 420, 580);
  
  // Draw fuzzy vertical tie-dye ikat spots on borders
  ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
  for (let y = 10; y < 580; y += 15) {
    const fuzz1 = Math.random() * 8;
    const fuzz2 = Math.random() * 8;
    ctx.fillRect(20 + fuzz1, y, 15 + fuzz2, 8);
    ctx.fillRect(380 - fuzz1, y, 15 + fuzz2, 8);
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < 420; x += 3) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 580); ctx.stroke();
  }
  for (let y = 0; y < 580; y += 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(420, y); ctx.stroke();
  }
}

function drawZariPattern(ctx, itemOrId, category_name) {
  let name = '';
  let cat = '';
  
  if (itemOrId && typeof itemOrId === 'object') {
    name = (itemOrId.name || '').toLowerCase();
    cat = (itemOrId.category_name || '').toLowerCase();
  } else {
    const cardId = parseInt(itemOrId);
    const item = sareeCollection.find(s => s.id === cardId);
    if (item) {
      name = (item.name || '').toLowerCase();
      cat = (item.category_name || '').toLowerCase();
    } else {
      cat = (category_name || '').toLowerCase();
    }
  }
  
  if (name.includes('lotus')) {
    // Sambalpuri Lotus pattern
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
  } else if (name.includes('temple') || name.includes('border') || cat.includes('chanderi')) {
    // Kotpad Temple Border pattern
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
  } else if (name.includes('grid') || name.includes('checkerboard') || cat.includes('kanjivaram')) {
    // Maniabandha Grid pattern
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
  } else if (name.includes('sundial') || name.includes('konark') || name.includes('relic') || cat.includes('tissue')) {
    // Konark Sundial Relic Pattern
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(210, 290);
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 100, Math.sin(angle) * 100);
      ctx.stroke();
    }
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
  } else if (name.includes('jagannath') || name.includes('provenance') || name.includes('shrine')) {
    // Lord Jagannath Provenance Pattern (The Holy Trinity)
    ctx.save();
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.beginPath();
    ctx.strokeRect(10, 20, 30, 540);
    ctx.strokeRect(380, 20, 30, 540);
    for (let y = 40; y < 560; y += 40) {
      ctx.beginPath(); ctx.arc(25, y, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(395, y, 6, 0, Math.PI * 2); ctx.stroke();
    }
    
    ctx.translate(210, 290);
    
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-150, 120);
    ctx.lineTo(-150, 0);
    ctx.quadraticCurveTo(-150, -110, 0, -110);
    ctx.quadraticCurveTo(150, -110, 150, 0);
    ctx.lineTo(150, 120);
    ctx.stroke();
    
    ctx.lineWidth = 1;
    ctx.strokeRect(-160, 0, 10, 120);
    ctx.strokeRect(150, 0, 10, 120);
    
    // Balabhadra
    ctx.save();
    ctx.translate(-75, 40);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-13, -2, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(13, -2, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.beginPath(); ctx.arc(-13, -2, 4, 0, Math.PI * 2); ctx.arc(13, -2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(0, -50); ctx.lineTo(22, -22); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-32, 10); ctx.lineTo(-45, 10); ctx.lineTo(-45, -5);
    ctx.moveTo(32, 10); ctx.lineTo(45, 10); ctx.lineTo(45, -5); ctx.stroke();
    ctx.restore();
    
    // Subhadra
    ctx.save();
    ctx.translate(0, 50);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(-9, -2, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(9, -2, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.beginPath(); ctx.arc(-9, -2, 3, 0, Math.PI * 2); ctx.arc(9, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, -24); ctx.lineTo(0, -48); ctx.lineTo(16, -24); ctx.closePath(); ctx.stroke();
    ctx.restore();
    
    // Jagannath
    ctx.save();
    ctx.translate(75, 40);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-13, -2, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(13, -2, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.95)';
    ctx.beginPath(); ctx.arc(-13, -2, 4, 0, Math.PI * 2); ctx.arc(13, -2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(0, -50); ctx.lineTo(22, -22); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-32, 10); ctx.lineTo(-45, 10); ctx.lineTo(-45, -5);
    ctx.moveTo(32, 10); ctx.lineTo(45, 10); ctx.lineTo(45, -5); ctx.stroke();
    ctx.restore();
    
    ctx.restore();
  } else {
    // Default Nuapatana Khandua Saree Elephant Motif
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(210, 290);
    ctx.beginPath();
    ctx.arc(0, 0, 50, Math.PI, 0);
    ctx.lineTo(50, 40); ctx.lineTo(35, 40); ctx.lineTo(35, 10); ctx.lineTo(-35, 10); ctx.lineTo(-35, 40); ctx.lineTo(-50, 40);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(-55, -20, 20, Math.PI * 1.5, Math.PI * 0.5);
    ctx.bezierCurveTo(-75, 0, -80, 20, -75, 30);
    ctx.bezierCurveTo(-72, 30, -70, 20, -65, 0);
    ctx.stroke();
    
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-20, -25, 40, 25);
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

function setupShowroomDrape(initialItem, itemsList) {
  const canvas = document.getElementById('canvas-drape');
  const ctx = canvas.getContext('2d');
  
  canvas.width = canvas.parentElement.clientWidth || 450;
  canvas.height = canvas.parentElement.clientHeight || 420;
  
  let activeItem = initialItem;
  let mx = canvas.width / 2;
  let my = canvas.height / 2;
  let isHovered = false;
  let drapeStyle = 'nivi'; 
  let inspectMode = 'spotlight'; 
  let lightTheme = 'sunset'; 
  let viewAngle = 'front';
  let selectedModel = 1;

  function loadImg(src) { const i = new Image(); i.src = src; return i; }

  const avatarCollections = {
    // Style mappings based on indices
    1: { frames: [loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'), loadImg('/avatars/frame_side.png'), loadImg('/avatars/frame_back.png')] },
    2: { frames: [loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_side.png'), loadImg('/avatars/navy_side.png')] },
    3: { frames: [loadImg('/avatars/green_front.png'), loadImg('/avatars/green_front.png'), loadImg('/avatars/green_side.png'), loadImg('/avatars/green_side.png')] },
    4: { frames: [loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_side.png'), loadImg('/avatars/purple_side.png')] },
    5: { frames: [loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_side.png'), loadImg('/avatars/golden_side.png')] }
  };

  const baseFrames = [
    loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'),
    loadImg('/avatars/frame_side.png'),  loadImg('/avatars/frame_back.png')
  ];

  function getAvatarFrames() {
    return { frames: avatarCollections[selectedModel].frames };
  }

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

  // Build and bind dynamic sidebar collection thumbnails
  const thumbsContainer = document.querySelector('.avatar-thumbs');
  
  function updateActiveItem(selectedItem) {
    activeItem = selectedItem;
    const hue = Number(selectedItem.color_hue || 0);
    selectedModel = hue >= 180 && hue < 240 ? 2 : hue >= 100 && hue < 180 ? 3 : hue >= 240 && hue < 300 ? 4 : hue >= 40 && hue < 60 ? 5 : 1;
    document.querySelectorAll('.model-option').forEach(button => {
      button.classList.toggle('active', Number(button.dataset.model) === selectedModel);
    });
    
    // Update active thumbnail borders
    if (thumbsContainer) {
      thumbsContainer.querySelectorAll('.avatar-thumb').forEach(t => {
        if (parseInt(t.dataset.id) === selectedItem.id) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
    }

    document.getElementById('showroom-title').textContent = selectedItem.name;
    
    // Set artisan and location details dynamically
    const artisanName = selectedItem.artisan_name || 'Master Weaver';
    const loc = selectedItem.artisan_location || 'Odisha, India';
    document.getElementById('showroom-artisan-name').innerHTML = `${artisanName} &nbsp;·&nbsp; ${loc}`;
    
    // Update price dynamically with global currency converter
    document.getElementById('showroom-price-fiat').textContent = formatSareePrice(selectedItem.price_fiat);
    
    // Reset purchase success messages
    document.getElementById('btn-acquire-now').classList.remove('hidden');
    document.getElementById('reserve-success-message').classList.add('hidden');
    
    playShowroomSound(500, 0.04, 0.06);
  }

  // Populate thumbnails
  if (thumbsContainer && itemsList) {
    thumbsContainer.innerHTML = itemsList.map((itm, idx) => {
      const activeClass = itm.id === activeItem.id ? 'active' : '';
      const column = idx % 4;
      const row = Math.floor(idx / 4) % 3;
      return `<button class="avatar-thumb ${activeClass}" data-id="${itm.id}" aria-label="View ${itm.name}" style="background-image:url('/avatars/portraits_grid.png'); background-position:${column * 33.333}% ${row * 50}%;">${String(idx + 1).padStart(2, '0')}</button>`;
    }).join('');
    
    thumbsContainer.querySelectorAll('.avatar-thumb').forEach(thumb => {
      thumb.onclick = () => {
        const id = parseInt(thumb.dataset.id);
        const matched = itemsList.find(itm => itm.id === id);
        if (matched) updateActiveItem(matched);
      };
    });
  }

  // Designer Configurator Mode variables
  let isCustomMode = false;
  let customHue = 0;
  let customSat = 1.0;
  let customPattern = 'lotus';

  document.querySelectorAll('.model-option').forEach(option => {
    option.onclick = () => {
      selectedModel = Number(option.dataset.model);
      document.querySelectorAll('.model-option').forEach(button => button.classList.toggle('active', button === option));
      playShowroomSound(620, 0.035, 0.06);
    };
  });

  // Bind sidebar tab switching
  const tabCollection = document.getElementById('tab-collection');
  const tabCustomizer = document.getElementById('tab-customizer');
  const paneCollection = document.getElementById('pane-collection');
  const paneCustomizer = document.getElementById('pane-customizer');

  if (tabCollection && tabCustomizer && paneCollection && paneCustomizer) {
    tabCollection.onclick = () => {
      tabCollection.classList.add('active');
      tabCollection.style.borderBottom = '2px solid var(--color-zari)';
      tabCollection.style.color = '#fff';
      tabCustomizer.classList.remove('active');
      tabCustomizer.style.borderBottom = 'none';
      tabCustomizer.style.color = 'rgba(255,255,255,0.5)';
      paneCollection.style.display = 'block';
      paneCustomizer.style.display = 'none';
      isCustomMode = false;
      updateActiveItem(activeItem);
    };

    tabCustomizer.onclick = () => {
      tabCustomizer.classList.add('active');
      tabCustomizer.style.borderBottom = '2px solid var(--color-zari)';
      tabCustomizer.style.color = '#fff';
      tabCollection.classList.remove('active');
      tabCollection.style.borderBottom = 'none';
      tabCollection.style.color = 'rgba(255,255,255,0.5)';
      paneCollection.style.display = 'none';
      paneCustomizer.style.display = 'flex';
      isCustomMode = true;
      
      document.getElementById('showroom-title').textContent = `Custom ${customPattern.charAt(0).toUpperCase() + customPattern.slice(1)} Weave`;
      document.getElementById('showroom-artisan-name').innerHTML = `Designed by You &nbsp;·&nbsp; Tailored in Nuapatna`;
      document.getElementById('showroom-price-fiat').textContent = formatSareePrice(250000);
      playShowroomSound(540, 0.04, 0.05);
    };
  }

  // Bind designer customizer inputs
  const hueSlider = document.getElementById('custom-saree-hue');
  const satSlider = document.getElementById('custom-saree-sat');
  const patternSelect = document.getElementById('custom-saree-pattern');

  if (hueSlider) {
    hueSlider.oninput = (e) => {
      customHue = parseInt(e.target.value);
      document.getElementById('val-custom-hue').textContent = `${customHue}°`;
      playShowroomSound(150 + customHue, 0.01, 0.02);
    };
  }
  if (satSlider) {
    satSlider.oninput = (e) => {
      customSat = parseFloat(e.target.value);
      document.getElementById('val-custom-sat').textContent = `${customSat.toFixed(1)}x`;
      playShowroomSound(200 + customSat * 100, 0.01, 0.02);
    };
  }
  if (patternSelect) {
    patternSelect.onchange = (e) => {
      customPattern = e.target.value;
      if (isCustomMode) {
        document.getElementById('showroom-title').textContent = `Custom ${customPattern.charAt(0).toUpperCase() + customPattern.slice(1)} Weave`;
      }
      playShowroomSound(500, 0.04, 0.05);
    };
  }

  // Certificate generation binding
  const btnGenerateCertificate = document.getElementById('btn-generate-certificate');
  const certOverlay = document.getElementById('cert-overlay');
  const btnCloseCert = document.getElementById('btn-close-cert');

  if (btnGenerateCertificate && certOverlay) {
    btnGenerateCertificate.onclick = () => {
      const hueVal = isCustomMode ? customHue : (activeItem.color_hue || 0);
      const satVal = isCustomMode ? customSat : (activeItem.color_saturation || 1.0);
      const patternVal = isCustomMode ? customPattern : (activeItem.category_name || 'Ikat');

      document.getElementById('cert-display-hue').textContent = `${hueVal}° HSL`;
      document.getElementById('cert-display-sat').textContent = `${parseFloat(satVal).toFixed(2)}x`;
      document.getElementById('cert-display-pattern').textContent = patternVal.charAt(0).toUpperCase() + patternVal.slice(1);
      
      const uniqueId = `LOM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      document.getElementById('cert-display-id').textContent = `CERTIFICATE #${uniqueId}`;

      certOverlay.classList.remove('hidden');
      playShowroomSound(980, 0.08, 0.2);
    };
  }

  if (btnCloseCert && certOverlay) {
    btnCloseCert.onclick = () => {
      certOverlay.classList.add('hidden');
      playShowroomSound(440, 0.04, 0.05);
    };
  }

  const btnPrintCert = document.getElementById('btn-print-cert');
  if (btnPrintCert) {
    btnPrintCert.onclick = () => {
      window.print();
    };
  }

  // Live Loom Booking bindings
  const btnOpenBooking = document.getElementById('btn-open-loom-booking');
  const bookingModal = document.getElementById('booking-modal');
  const btnCloseBooking = document.getElementById('btn-close-booking');
  const formBooking = document.getElementById('form-loom-booking');

  if (btnOpenBooking && bookingModal) {
    btnOpenBooking.onclick = () => {
      bookingModal.style.display = 'flex';
      bookingModal.classList.remove('hidden');
    };
  }

  if (btnCloseBooking && bookingModal) {
    btnCloseBooking.onclick = () => {
      bookingModal.style.display = 'none';
      bookingModal.classList.add('hidden');
    };
  }

  if (formBooking) {
    formBooking.onsubmit = async (e) => {
      e.preventDefault();
      const dateVal = document.getElementById('book-date').value;
      const timeVal = document.getElementById('book-time').value;

      const customerName = prompt("Enter your Name for virtual tour booking confirmation:");
      if (!customerName) return;
      const customerEmail = prompt("Enter your Email for calendar invitation details:");
      if (!customerEmail || !customerEmail.includes('@')) {
        alert("Valid email required.");
        return;
      }

      const message = `Virtual Loom Video Tour Booking: Date: ${dateVal}, Time Slot: ${timeVal}. Saree Showroom Reference: ID ${activeItem.id || 'N/A'} - ${activeItem.name || 'Bespoke'}.`;

      try {
        const response = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: activeItem.id || null,
            customer_name: customerName,
            customer_email: customerEmail,
            message: message
          })
        });
        if (response.ok) {
          alert(`🗓 Weaving Loom Tour Scheduled! A calendar invite has been sent to ${customerEmail} for ${dateVal} at ${timeVal}.`);
          bookingModal.style.display = 'none';
          bookingModal.classList.add('hidden');
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch(err) {
        alert(`🗓 Weaving Loom Tour Scheduled (offline/local database)! Date: ${dateVal} at ${timeVal}.`);
        bookingModal.style.display = 'none';
        bookingModal.classList.add('hidden');
      }
    };
  }

  // Remove the static SELECT input binding if it exists
  const selectAvatar = document.getElementById('select-avatar-asset');
  if (selectAvatar) {
    selectAvatar.style.display = 'none';
  }
  
  const acquireBtn = document.getElementById('btn-acquire-now');
  const successMsg = document.getElementById('reserve-success-message');
  
  acquireBtn.onclick = async () => {
    try {
      const payload = {
        item_id: activeItem.id,
        customer_name: 'Global Loom Guest',
        customer_email: 'buyer@silk101.global',
        message: `Enquired interest in buying the "${activeItem.name}" (#${activeItem.id})`
      };
      
      let success = false;
      try {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) success = true;
      } catch (apiErr) {
        console.warn('API enquiry failed, using localStorage:', apiErr);
      }

      if (!success) {
        initializeLocalStorage();
        const enqList = JSON.parse(localStorage.getItem('saree_enquiries') || '[]');
        const newEnq = {
          id: enqList.length + 1,
          item_id: payload.item_id,
          item_name: activeItem.name,
          customer_name: payload.customer_name,
          customer_email: payload.customer_email,
          message: payload.message,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        enqList.push(newEnq);
        localStorage.setItem('saree_enquiries', JSON.stringify(enqList));
        success = true;
      }

      if (success) {
        acquireBtn.classList.add('hidden');
        successMsg.classList.remove('hidden');
        playShowroomSound(880, 0.08, 0.3);
      }
    } catch(e) {
      console.error('Enquiry failed:', e);
    }
  };
  
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
    } else if (e.key.toLowerCase() === 'q') {
      applyZoom(-0.2);
    } else if (e.key.toLowerCase() === 'e') {
      applyZoom(0.2);
    } else if (e.key === '0') {
      zoomTarget = 1.0;
    }
  };
  window.addEventListener('keydown', handleKeys);
  
  let rotation = 0;
  let isDragging = false;
  let startX = 0;
  let velocity = 0.012;
  let lastDx = 0;
  const FRICTION       = 0.955;
  const MAX_VELOCITY   = 0.12;
  const IDLE_SPIN      = 0.0012;
  let particles = [];

  let zoomLevel  = 1.0;
  let zoomTarget = 1.0;
  const ZOOM_MIN = 0.72;
  const ZOOM_MAX = 2.15;
  const ZOOM_SPRING = 0.16;

  let lastPinchDist = null;

  function applyZoom(delta) {
    zoomTarget = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomTarget + delta));
    playShowroomSound(zoomTarget > zoomLevel ? 880 : 440, 0.02, 0.06);
  }

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.12 : -0.12;
    applyZoom(factor);
  }, { passive: false });

  function attachZoomButtons() {
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    if (btnZoomIn)    btnZoomIn.onclick    = () => applyZoom(0.2);
    if (btnZoomOut)   btnZoomOut.onclick   = () => applyZoom(-0.2);
    if (btnZoomReset) btnZoomReset.onclick = () => { zoomTarget = 1.0; };
  }
  attachZoomButtons();

  function attachSpinButtons() {
    const spinLeft = document.getElementById('btn-spin-left');
    const spinRight = document.getElementById('btn-spin-right');
    const spinReset = document.getElementById('btn-spin-reset');
    if (spinLeft) spinLeft.onclick = () => { velocity = -0.045; playShowroomSound(410, 0.03, 0.05); };
    if (spinRight) spinRight.onclick = () => { velocity = 0.045; playShowroomSound(520, 0.03, 0.05); };
    if (spinReset) spinReset.onclick = () => { rotation = 0; velocity = IDLE_SPIN; playShowroomSound(600, 0.03, 0.05); };
  }
  attachSpinButtons();

  canvas.onmousedown = (e) => {
    isDragging = true;
    startX = e.clientX;
    lastDx = 0;
    canvas.style.cursor = 'grabbing';
  };

  window.onmouseup = () => {
    if (isDragging) {
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, lastDx * 0.006));
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
      rotation += dx * 0.007;
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
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, lastDx * 0.006));
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
      rotation += dx * 0.007;
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

    zoomLevel += (zoomTarget - zoomLevel) * ZOOM_SPRING;

    if (!isDragging) {
      rotation += velocity + IDLE_SPIN;
      velocity *= FRICTION;
    }

    const TAU = Math.PI * 2;
    const normRot = ((rotation % TAU) + TAU) % TAU;

    const FRAME_COUNT = 4;
    const segmentAngle = TAU / FRAME_COUNT;
    const frameIndex = Math.floor(normRot / segmentAngle) % FRAME_COUNT;
    const blendT = (normRot % segmentAngle) / segmentAngle;
    const nextFrameIndex = (frameIndex + 1) % FRAME_COUNT;

    const { frames } = getAvatarFrames();
    const currentFrame = frames[frameIndex];
    const nextFrame = frames[nextFrameIndex];

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.filter = 'none';

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, cw, ch);

    const vignette = ctx.createRadialGradient(cw/2, ch/2, ch*0.2, cw/2, ch/2, ch*0.82);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);

    if (currentFrame && currentFrame.complete) {
      const imgW = currentFrame.naturalWidth || cw;
      const imgH = currentFrame.naturalHeight || ch;
      const baseScale = Math.min(cw / imgW, ch / imgH) * 0.95;
      const scale = baseScale * zoomLevel;
      const dw = imgW * scale;
      const dh = imgH * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2 + ch * 0.01;

      ctx.globalAlpha = 1 - blendT;
      ctx.drawImage(currentFrame, dx, dy, dw, dh);

      if (nextFrame && nextFrame.complete) {
        ctx.globalAlpha = blendT;
        ctx.drawImage(nextFrame, dx, dy, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.filter = 'none';

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

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.012)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (let y = 0; y < ch; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }

    const zoomDisp = document.getElementById('zoom-display');
    if (zoomDisp) zoomDisp.textContent = `${zoomLevel.toFixed(2)}×`;

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
    ctx.fillText(`MODEL: NXS-${String(activeItem.id).padStart(3,'0')}-PATA`, cw - 20, 50);
    ctx.fillText(`LIGHT: ${lightTheme.toUpperCase()}`, cw - 20, 65);
    ctx.fillText(`STYLE: ${activeItem.category_name || 'SAREE'}`, cw - 20, 80);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.fillText('↔ CLICK & DRAG TO ROTATE · TOUCH SUPPORTED', cw / 2, ch - 18);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.angle += p.speedR;
      p.y += p.speedY;
      p.alpha -= 0.012;
      const swirlX = cw / 2 + Math.cos(p.angle) * p.radius;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
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
    }

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

function openUnweaveModal(item, itemsList) {
  if (!item) return;
  
  const modal = document.getElementById('unweave-modal');
  modal.classList.remove('hidden');
  
  document.getElementById('showroom-title').textContent = item.name;
  
  const artisanName = item.artisan_name || 'Master Weaver';
  const loc = item.artisan_location || 'Odisha, India';
  document.getElementById('showroom-artisan-name').innerHTML = `${artisanName} &nbsp;·&nbsp; ${loc}`;
  
  document.getElementById('showroom-price-fiat').textContent = formatSareePrice(item.price_fiat);
  
  document.getElementById('btn-acquire-now').classList.remove('hidden');
  document.getElementById('reserve-success-message').classList.add('hidden');
  
  setupShowroomDrape(item, itemsList);
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
  setupCustomCommissionStudio();
  setupMetamorphosis();
  setupVaultTunnel();
  setupCustomCursor();
  setupInteractiveExtensions();
  setupMythosAnimation();
  setupHeritageSoulSection();
});

function setupInteractiveExtensions() {
  // 1. SHUTTLE LOOM MINIGAME
  const btnToggleManual = document.getElementById('btn-toggle-manual-loom');
  const manualLoomPanel = document.getElementById('manual-loom-panel');
  const shuttleSlider = document.getElementById('shuttle-slider');
  const progressVal = document.getElementById('game-progress-val');
  const progressBar = document.getElementById('game-progress-bar');
  const successMsg = document.getElementById('game-success-message');
  
  let isManualActive = false;
  let weftProgress = 0;
  let lastSide = 'left';
  
  if (btnToggleManual && manualLoomPanel) {
    btnToggleManual.onclick = () => {
      isManualActive = !isManualActive;
      if (isManualActive) {
        btnToggleManual.textContent = "Deactivate Manual Shuttle Loom";
        manualLoomPanel.classList.remove('hidden');
        weftProgress = 0;
        lastSide = 'left';
        if (progressVal) progressVal.textContent = '0%';
        if (progressBar) progressBar.style.width = '0%';
        if (shuttleSlider) shuttleSlider.style.left = '0';
        if (successMsg) successMsg.classList.add('hidden');
      } else {
        btnToggleManual.textContent = "Activate Manual Shuttle Loom";
        manualLoomPanel.classList.add('hidden');
      }
    };
  }

  window.addEventListener('keydown', (e) => {
    if (!isManualActive || weftProgress >= 100) return;
    
    const key = e.key.toLowerCase();
    if (key === 'a' && lastSide === 'right') {
      weftProgress += 5;
      lastSide = 'left';
      if (shuttleSlider) shuttleSlider.style.left = '0';
      triggerShuttleSound(true);
      updateWeftProgress();
    } else if (key === 'd' && lastSide === 'left') {
      weftProgress += 5;
      lastSide = 'right';
      if (shuttleSlider) shuttleSlider.style.left = 'calc(100% - 20px)';
      triggerShuttleSound(false);
      updateWeftProgress();
    }
  });

  function triggerShuttleSound(isLeft) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isLeft ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(isLeft ? 220 : 330, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (err) {}
  }

  function updateWeftProgress() {
    if (weftProgress > 100) weftProgress = 100;
    if (progressVal) progressVal.textContent = `${weftProgress}%`;
    if (progressBar) progressBar.style.width = `${weftProgress}%`;
    
    if (weftProgress === 100) {
      if (successMsg) successMsg.classList.remove('hidden');
      playSuccessFanfare();
      
      // Seed a secret master design in localStorage!
      try {
        const localInv = JSON.parse(localStorage.getItem('saree_inventory') || '[]');
        const secretId = 99;
        if (!localInv.find(i => i.id === secretId)) {
          localInv.unshift({
            id: secretId,
            name: 'Artisan Golden Shuttle Saree',
            category_id: 4,
            category_name: 'Tissue Silk',
            artisan_id: 2,
            artisan_name: 'Shri Ranjan Meher',
            artisan_location: 'Maniabandha, Odisha',
            price_fiat: 280000,
            stock_status: 'available',
            material: 'Woven Golden Shuttle Thread',
            weaving_time_days: 50,
            description: 'Unlocks by completing the rhythm. Pure gold threads spun in traditional grid designs representing the sun deity.',
            color_hue: 50,
            color_saturation: 1.5
          });
          localStorage.setItem('saree_inventory', JSON.stringify(localInv));
          setTimeout(() => {
            setupVaultTunnel();
          }, 1500);
        }
      } catch (err) {}
    }
  }

  function playSuccessFanfare() {
    if (!audioCtx) return;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } catch (e) {}
      }, idx * 120);
    });
  }

  // 2. GEOGRAPHICAL WEAVING MAP
  const markers = document.querySelectorAll('.map-marker');
  const infoName = document.querySelector('.info-cluster-name');
  const infoDesc = document.querySelector('.info-cluster-desc');

  const CLUSTER_DATA = {
    nuapatna: {
      name: "Nuapatna Weavers Cluster",
      desc: "Famous for Khandua Ikat (Loom of Devotion) woven for Jagannath deities. Historically utilizes turmeric, madder root, and wild tassar silk threads."
    },
    maniabandha: {
      name: "Maniabandha Double-Ikat Cluster",
      desc: "Renowned for geometric mathematical grids and Lotus motif double-Ikat. Zero-electricity Pit Looms operated by Buddhist weavers."
    },
    puri: {
      name: "Puri Temple Architecture Weavers",
      desc: "Specializes in weaving temple borders and mythological patterns, featuring intricate details inspired by the stone carvings of Jagannath Temple."
    },
    kotpad: {
      name: "Kotpad Tribal Dye Cooperative",
      desc: "Woven using thick organic cotton yarn colored with organic root bark extracts from the Indian Madder tree (Aal tree). Deep crimson and ocher tones."
    }
  };

  let activeClusterKey = null;
  let audioTimer = null;
  let synthDrone = null;

  const audioPlayerWrap = document.getElementById('map-audio-player');
  const btnPlayOral = document.getElementById('btn-play-oral-audio');
  const visualizerWaves = document.getElementById('audio-waves');
  const transcriptBox = document.getElementById('audio-transcript-box');

  const ORAL_TRANSCRIPTS = {
    nuapatna: [
      "Om Sri Jagannathaya Namah...",
      "Woven with absolute devotion for the holy chariot.",
      "Nuapatna weavers chant Gita Govinda verses with every thread."
    ],
    maniabandha: [
      "Buddhist monks migrated here centuries ago...",
      "The math of tie-dye aligns warp and weft perfectly.",
      "Lotus petals reflect cosmic consciousness."
    ],
    puri: [
      "Inspired by Konark wheel stone reliefs...",
      "The Kumbha border tells stories of ancient temple flags.",
      "Every fold is a monument of history."
    ],
    kotpad: [
      "Boiled roots of the Aal tree produce natural deep ocher...",
      "Tribal geometry tells stories of forest paths and river streams.",
      "No electricity, only natural elements."
    ]
  };

  function stopOralAudio() {
    if (audioTimer) {
      clearTimeout(audioTimer);
      audioTimer = null;
    }
    if (synthDrone) {
      try {
        synthDrone.osc.stop();
        synthDrone.gain.disconnect();
      } catch(e) {}
      synthDrone = null;
    }
    if (visualizerWaves) {
      visualizerWaves.classList.add('hidden');
      visualizerWaves.style.display = 'none';
    }
    if (btnPlayOral) btnPlayOral.textContent = "▶ Listen to Oral Shloka";
    if (transcriptBox) transcriptBox.textContent = "";
  }

  function playOralAudio(clusterKey) {
    stopOralAudio();
    if (!CLUSTER_DATA[clusterKey]) return;

    if (btnPlayOral) btnPlayOral.textContent = "⏹ Stop Listening";
    if (visualizerWaves) {
      visualizerWaves.classList.remove('hidden');
      visualizerWaves.style.display = 'flex';
    }

    if (audioCtx) {
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(clusterKey === 'nuapatna' ? 110 : clusterKey === 'maniabandha' ? 130 : clusterKey === 'puri' ? 146 : 98, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        synthDrone = { osc, gain };
      } catch(e) {}
    }

    const lines = ORAL_TRANSCRIPTS[clusterKey] || ["Reciting oral history..."];
    let lineIdx = 0;

    function nextLine() {
      if (lineIdx < lines.length) {
        if (transcriptBox) transcriptBox.textContent = `"${lines[lineIdx]}"`;
        lineIdx++;
        audioTimer = setTimeout(nextLine, 3000);
      } else {
        stopOralAudio();
      }
    }
    nextLine();
  }

  if (btnPlayOral) {
    btnPlayOral.onclick = () => {
      if (synthDrone) {
        stopOralAudio();
      } else if (activeClusterKey) {
        playOralAudio(activeClusterKey);
      }
    };
  }

  markers.forEach(marker => {
    const clusterKey = marker.dataset.cluster;
    marker.onmouseenter = () => {
      const data = CLUSTER_DATA[clusterKey];
      if (data && infoName && infoDesc) {
        infoName.textContent = data.name;
        infoDesc.textContent = data.desc;
        marker.querySelector('circle').setAttribute('fill', '#ffd700');
        marker.querySelector('circle').setAttribute('r', '7');
        
        activeClusterKey = clusterKey;
        stopOralAudio();
        if (audioPlayerWrap) audioPlayerWrap.classList.remove('hidden');
      }
    };

    marker.onmouseleave = () => {
      marker.querySelector('circle').setAttribute('fill', '#d4af37');
      marker.querySelector('circle').setAttribute('r', '5');
    };

    marker.onclick = () => {
      activeClusterKey = clusterKey;
      playOralAudio(clusterKey);
    };
  });
}

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

function setupMythosAnimation() {
  // Tabs switcher
  const tabs = document.querySelectorAll('.mythos-tabs .btn');
  const storyPanes = document.querySelectorAll('.mythos-story-pane');
  let currentStory = 'gitagovinda';
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetStory = tab.getAttribute('data-story');
      currentStory = targetStory;
      
      storyPanes.forEach(pane => {
        if (pane.id === `story-${targetStory}`) {
          pane.classList.remove('hidden');
          pane.classList.add('active');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('active');
        }
      });
      
      // Play a subtle thread synth sound on tab change
      if (audioCtx && audioCtx.state === 'running') {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(targetStory === 'gitagovinda' ? 330 : 440, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } catch(e){}
      }
    });
  });

  const canvas = document.getElementById('canvas-mythos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Fixed coordinate system to prevent off-screen collapse and clipping bugs
  const width = 800;
  const height = 600;
  canvas.width = width;
  canvas.height = height;
  
  let shlokas = [
    { text: "कंसारिरपि संसार", x: width * 0.15, y: height * 0.3, tx: width * 0.15, ty: height * 0.3 },
    { text: "ललित लवङ्ग लता", x: width * 0.75, y: height * 0.25, tx: width * 0.75, ty: height * 0.25 },
    { text: "देହି ପଦ ପଲ୍ଲବମ", x: width * 0.2, y: height * 0.75, tx: width * 0.2, ty: height * 0.75 },
    { text: "ଗୀତ ଗୋବିନ୍ଦମ", x: width * 0.7, y: height * 0.7, tx: width * 0.7, ty: height * 0.7 }
  ];

  let motifs = [
    { text: "ଶଙ୍ଖ (Conch)", x: width * 0.15, y: height * 0.3, tx: width * 0.15, ty: height * 0.3 },
    { text: "ଚକ୍ର (Chakra)", x: width * 0.75, y: height * 0.25, tx: width * 0.75, ty: height * 0.25 },
    { text: "ପଦ୍ମ (Lotus)", x: width * 0.2, y: height * 0.75, tx: width * 0.2, ty: height * 0.75 },
    { text: "ହଳ (Plough)", x: width * 0.7, y: height * 0.7, tx: width * 0.7, ty: height * 0.7 }
  ];

  let mouse = { x: width / 2, y: height / 2, active: false };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mouse.x = (e.clientX - rect.left) * (width / rect.width);
      mouse.y = (e.clientY - rect.top) * (height / rect.height);
      mouse.active = true;
    }
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Tap/click triggers a flare
  let flares = [];
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const cxVal = (e.clientX - rect.left) * (width / rect.width);
      const cyVal = (e.clientY - rect.top) * (height / rect.height);
      
      // Add particle burst
      for (let i = 0; i < 24; i++) {
        flares.push({
          x: cxVal,
          y: cyVal,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          radius: Math.random() * 6 + 2,
          life: 1.0,
          decay: Math.random() * 0.04 + 0.02,
          color: currentStory === 'gitagovinda' ? 'rgba(212, 175, 55, 0.8)' : 'rgba(224, 17, 95, 0.8)'
        });
      }

      // Play high chime
      if (audioCtx && audioCtx.state === 'running') {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(660, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } catch(e){}
      }
    }
  });

  let rotation = 0;
  let rotationSpeed = 0.005;

  function animate() {
    // Clear
    ctx.fillStyle = 'rgba(10, 8, 12, 0.2)';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const activeTextSet = currentStory === 'gitagovinda' ? shlokas : motifs;

    // Smooth speed modulation on hover
    if (mouse.active) {
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 240) {
        rotationSpeed = 0.02; // spin faster
      } else {
        rotationSpeed = 0.005;
      }
    } else {
      rotationSpeed = 0.005;
    }
    rotation += rotationSpeed;

    // DRAW SACRED WHEEL (Chakra / Konark Wheel)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Styling colors
    const primaryColor = currentStory === 'gitagovinda' ? '#d4af37' : '#e0115f';
    const secondaryColor = currentStory === 'gitagovinda' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 94, 0, 0.4)';

    // Outer rim
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rim
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 136, 0, Math.PI * 2);
    ctx.stroke();

    // Small center hub
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Inner center axle details
    ctx.fillStyle = '#0a080c';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Spokes (8 spokes like Konark Wheel)
    for (let i = 0; i < 8; i++) {
      ctx.save();
      const angle = (i * Math.PI) / 4;
      ctx.rotate(angle);
      
      // Main spoke line
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -136);
      ctx.stroke();

      // Intricate spoke details (little circles or triangles)
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(0, -70, 8, 0, Math.PI * 2);
      ctx.fill();

      // spoke thread webbing
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.restore();
    }
    ctx.restore();

    // 2. Sundial Shadow Caster
    if (mouse.active) {
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 20) {
        const angle = Math.atan2(dy, dx);
        const oppAngle = angle + Math.PI;
        
        const shadowLength = Math.min(130, dist * 0.5 + 40);
        const shadowX = cx + Math.cos(oppAngle) * shadowLength;
        const shadowY = cy + Math.sin(oppAngle) * shadowLength;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(shadowX, shadowY);
        ctx.stroke();
        ctx.restore();

        const normalizedAngle = (oppAngle + Math.PI * 2) % (Math.PI * 2);
        const prahara = Math.floor((normalizedAngle / (Math.PI * 2)) * 8) + 1;
        const danda = Math.floor(((normalizedAngle / (Math.PI * 2)) * 60) % 7.5) + 1;

        ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Sundial Time: Prahara ${prahara} (ପ୍ରହର) • ${danda} Danda`, cx, cy + 190);
      }
    }

    // DRAW CONNECTING SACRED THREADS
    activeTextSet.forEach((item, index) => {
      item.x += Math.sin(Date.now() * 0.001 + index) * 0.3;
      item.y += Math.cos(Date.now() * 0.001 + index * 1.5) * 0.3;

      ctx.font = "600 22px 'Outfit', sans-serif";
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.fillText(item.text, item.x, item.y);

      let isPlucked = false;
      let waveAmp = 0;
      if (mouse.active) {
        const mx = mouse.x;
        const my = mouse.y;
        const midX = (cx + item.x) / 2;
        const midY = (cy + item.y) / 2;
        const dist = Math.sqrt((mx - midX)*(mx - midX) + (my - midY)*(my - midY));
        if (dist < 80) {
          isPlucked = true;
          waveAmp = (1 - dist / 80) * 24;
        }
      }

      const angleToText = Math.atan2(item.y - cy, item.x - cx);
      const startX = cx + Math.cos(angleToText) * 150;
      const startY = cy + Math.sin(angleToText) * 150;
      
      ctx.beginPath();
      ctx.strokeStyle = currentStory === 'gitagovinda' ? 'rgba(212, 175, 55, 0.22)' : 'rgba(224, 17, 95, 0.22)';
      ctx.lineWidth = isPlucked ? 2.8 : 1.6;
      
      ctx.moveTo(startX, startY);
      const segments = 20;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        let px = startX + (item.x - startX) * t;
        let py = startY + (item.y - 12 - startY) * t;
        
        const wave = Math.sin(t * Math.PI + Date.now() * 0.06) * (waveAmp + Math.sin(Date.now() * 0.002 + index) * 8);
        const dx = item.x - startX;
        const dy = item.y - 12 - startY;
        const len = Math.sqrt(dx*dx + dy*dy) || 0.001;
        const nx = -dy / len;
        const ny = dx / len;
        
        px += nx * wave;
        py += ny * wave;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = currentStory === 'gitagovinda' ? 'rgba(212, 175, 55, 0.45)' : 'rgba(224, 17, 95, 0.45)';
      ctx.lineWidth = 2;
      ctx.moveTo(item.x - 60, item.y + 8);
      ctx.bezierCurveTo(item.x - 30, item.y + 24 + waveAmp * 0.3, item.x + 30, item.y + 24 + waveAmp * 0.3, item.x + 60, item.y + 8);
      ctx.stroke();

      // Interactive mouse pull
      if (mouse.active) {
        const dx = mouse.x - item.x;
        const dy = mouse.y - item.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 160) {
          // Draw reactive golden cursor thread
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.0;
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(item.x, item.y - 12);
          ctx.stroke();
        }
      }
    });

    // DRAW FLARES / PARTICLES
    for (let i = flares.length - 1; i >= 0; i--) {
      const flare = flares[i];
      flare.x += flare.vx;
      flare.y += flare.vy;
      flare.life -= flare.decay;
      
      if (flare.life <= 0) {
        flares.splice(i, 1);
        continue;
      }

      ctx.fillStyle = flare.color;
      ctx.globalAlpha = flare.life;
      ctx.beginPath();
      ctx.arc(flare.x, flare.y, flare.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0; // reset

    requestAnimationFrame(animate);
  }

  // Start loop
  animate();
}

function setupHeritageSoulSection() {
  const tabs = document.querySelectorAll('.heritage-tabs .btn');
  const panes = document.querySelectorAll('.heritage-pane');
  let currentHeritage = 'food';

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-heritage');
      currentHeritage = target;

      panes.forEach(pane => {
        if (pane.id === `heritage-${target}`) {
          pane.classList.remove('hidden');
          pane.classList.add('active');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('active');
        }
      });

      // Play a quick synth chord on tab switch
      if (audioCtx && audioCtx.state === 'running') {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(target === 'food' ? 261.63 : target === 'maritime' ? 329.63 : 392.00, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        } catch(e){}
      }
    });
  });

  const canvas = document.getElementById('canvas-heritage-soul');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Fixed coordinate system to prevent off-screen collapse and clipping bugs
  const width = 800;
  const height = 800;
  canvas.width = width;
  canvas.height = height;

  let mouse = { x: width / 2, y: height / 2, active: false };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      mouse.x = (e.clientX - rect.left) * (width / rect.width);
      mouse.y = (e.clientY - rect.top) * (height / rect.height);
      mouse.active = true;
    }
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // Steam particles for Mahaprasad
  let steam = [];
  const dishLabels = ["ଅନ୍ନ (Rice)", "ଡାଲି (Dal)", "ଖେଚୁଡ଼ି", "କାନିକା", "ଖଜା", "ରସଗୋଲା", "ପିଠା"];

  // Floating paper boats for Bali Jatra
  let boats = [
    { x: width * 0.2, y: height * 0.72, size: 28, speed: 0.25 },
    { x: width * 0.5, y: height * 0.76, size: 20, speed: 0.18 },
    { x: width * 0.8, y: height * 0.74, size: 24, speed: 0.22 }
  ];

  // Dance sparkles for Odissi
  let sparkles = [];

  function draw() {
    ctx.fillStyle = '#09070b';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const time = Date.now() * 0.001;

    if (currentHeritage === 'food') {
      // ==========================================
      // MAHAPRASAD: Stacked Earthen Pots (Kudua) & Steam
      // ==========================================
      
      // 1. Draw single fire glow at base
      const fireGlow = ctx.createRadialGradient(cx, cy + 260, 20, cx, cy + 260, 160);
      fireGlow.addColorStop(0, 'rgba(255, 94, 0, 0.25)');
      fireGlow.addColorStop(1, 'rgba(255, 94, 0, 0)');
      ctx.fillStyle = fireGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + 260, 160, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render Stacked Pots (3 representative Kudua pots of decreasing size)
      const potConfigs = [
        { y: cy + 160, w: 180, h: 96, label: "Bottom Pot" },
        { y: cy + 30, w: 152, h: 84, label: "Middle Pot" },
        { y: cy - 90, w: 124, h: 72, label: "Top Pot" }
      ];

      potConfigs.forEach((pot, index) => {
        ctx.save();
        ctx.translate(cx, pot.y);
        
        // Shadow/glow
        ctx.shadowBlur = 24;
        ctx.shadowColor = 'rgba(128, 64, 16, 0.4)';

        // Clay pot base body
        const grad = ctx.createLinearGradient(-pot.w/2, 0, pot.w/2, 0);
        grad.addColorStop(0, '#5c2d18');
        grad.addColorStop(0.3, '#8b4513');
        grad.addColorStop(0.7, '#a0522d');
        grad.addColorStop(1, '#4a2512');
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.moveTo(-pot.w / 2, 0);
        ctx.bezierCurveTo(-pot.w / 2, pot.h, pot.w / 2, pot.h, pot.w / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Clay pot rim
        ctx.fillStyle = '#6e3519';
        ctx.beginPath();
        ctx.ellipse(0, -4, pot.w / 2 + 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3d1d0e';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      // 3. Emit Steam particles containing dish names
      if (Math.random() < 0.04) {
        const dishText = dishLabels[Math.floor(Math.random() * dishLabels.length)];
        steam.push({
          x: cx + (Math.random() - 0.5) * 120,
          y: cy - 140,
          text: dishText,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -Math.random() * 2.4 - 1.6,
          alpha: 1.0,
          size: Math.random() * 4 + 20
        });
      }

      // Draw and update steam
      for (let i = steam.length - 1; i >= 0; i--) {
        const p = steam[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.007;

        // Hover attraction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            p.x += dx * 0.05;
            p.y += dy * 0.05;
          }
        }

        if (p.alpha <= 0) {
          steam.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha * 0.85})`;
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(p.text, p.x, p.y);
      }

    } else if (currentHeritage === 'maritime') {
      // ==========================================
      // MARITIME: Bali Jatra Sailing Boitas
      // ==========================================

      // 1. Draw beautiful interactive waves
      ctx.strokeStyle = 'rgba(0, 119, 182, 0.4)';
      ctx.lineWidth = 3;
      const waveY = height * 0.75;
      
      // Starry Night Sky Background with Twinkling Constellations
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let s = 0; s < 30; s++) {
        const sx = (Math.sin(s * 73.13) * 0.5 + 0.5) * width;
        const sy = (Math.cos(s * 29.45) * 0.5 + 0.5) * (waveY - 80);
        const size = Math.abs(Math.sin(time * 2 + s)) * 4;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, waveY + w * 24);
        
        for (let x = 0; x <= width; x += 30) {
          // Wave height modifier based on mouse hover
          let hoverHeight = 0;
          if (mouse.active) {
            const dist = Math.abs(mouse.x - x);
            if (dist < 240) {
              hoverHeight = (1 - dist / 240) * (mouse.y - waveY) * 0.35;
            }
          }
          
          const y = waveY + w * 24 + Math.sin(x * 0.01 + time * 2.5 + w) * 16 + hoverHeight;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 2. Draw the primary stylized Merchant Boita (traditional ship)
      ctx.save();
      ctx.translate(cx, waveY - 40 + Math.sin(time * 2.0) * 8);
      ctx.rotate(Math.sin(time * 1.5) * 0.04);

      // Ship Hull (Earthen wood)
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.moveTo(-140, -20);
      ctx.lineTo(120, -20);
      ctx.quadraticCurveTo(170, -50, 190, -70); // stern
      ctx.lineTo(190, -10);
      ctx.quadraticCurveTo(0, 40, -180, -10); // bow curve
      ctx.closePath();
      ctx.fill();

      // Golden lines & details on Hull
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-160, -14);
      ctx.quadraticCurveTo(0, 24, 170, -14);
      ctx.stroke();

      // Main Mast
      ctx.strokeStyle = '#5c3a21';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, -180);
      ctx.stroke();

      // Secondary Mast
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(70, 10);
      ctx.lineTo(70, -140);
      ctx.stroke();

      // Traditional sails (Triangular crimson/gold cloth sails)
      ctx.fillStyle = 'rgba(195, 27, 27, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, -170);
      ctx.quadraticCurveTo(-50, -100, -80, -30);
      ctx.lineTo(0, -30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
      ctx.beginPath();
      ctx.moveTo(70, -130);
      ctx.quadraticCurveTo(30, -80, 10, -30);
      ctx.lineTo(70, -30);
      ctx.closePath();
      ctx.fill();

      // Sacred temple flag flying on top
      ctx.fillStyle = '#ff5e00';
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.lineTo(-40, -164);
      ctx.lineTo(0, -148);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 3. Draw smaller floating paper boats
      boats.forEach((b) => {
        b.x -= b.speed;
        if (b.x < -80) b.x = width + 80;

        ctx.save();
        ctx.translate(b.x, b.y + Math.sin(time * 3 + b.x * 0.05) * 6);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.moveTo(-b.size, 0);
        ctx.lineTo(b.size, 0);
        ctx.lineTo(b.size * 0.3, -b.size * 0.4);
        ctx.lineTo(0, -b.size * 0.8);
        ctx.lineTo(-b.size * 0.3, -b.size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Floating diya light
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -b.size * 0.5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

    } else if (currentHeritage === 'odissi') {
      // ==========================================
      // ODISSI: Dancer Silhouette & Mandalas
      // ==========================================

      // 1. Rotating background mandala halo
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.15);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.lineWidth = 2;
      
      // Draw circular geometric pattern
      for (let i = 0; i < 16; i++) {
        ctx.rotate(Math.PI / 8);
        ctx.beginPath();
        ctx.arc(0, 0, 220, 0, Math.PI * 0.25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(80, 0, 50, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw elegant silhouette of an Odissi Dancer in Tribhangi pose
      ctx.save();
      ctx.translate(cx, cy + 60);
      
      // Tahia (Odissi Crown decoration)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let a = -Math.PI * 0.65; a <= -Math.PI * 0.35; a += 0.15) {
        const tx = Math.cos(a) * 176;
        const ty = -200 + Math.sin(a) * 40;
        ctx.moveTo(0, -170);
        ctx.lineTo(tx, ty);
        ctx.arc(tx, ty, 6, 0, Math.PI*2);
      }
      ctx.stroke();
      ctx.fill();

      // Head & Hair
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(0, -140, 30, 0, Math.PI * 2);
      ctx.fill();

      // Body (Fluid Pose Morphing: Tribhangi -> Chauka -> Abhanga)
      const cycle = (time * 0.5) % 3;
      const currentPose = Math.floor(cycle);
      const blend = cycle - currentPose;
      
      let chestX, waistX, hipsX;
      
      if (currentPose === 0) {
        chestX = -10 + (0 - (-10)) * blend;
        waistX = 15 + (0 - 15) * blend;
        hipsX = -5 + (0 - (-5)) * blend;
      } else if (currentPose === 1) {
        chestX = 0 + (8 - 0) * blend;
        waistX = 0 + (-8 - 0) * blend;
        hipsX = 0 + (5 - 0) * blend;
      } else {
        chestX = 8 + (-10 - 8) * blend;
        waistX = -8 + (15 - (-8)) * blend;
        hipsX = 5 + (-5 - 5) * blend;
      }

      ctx.fillStyle = 'rgba(224, 17, 95, 0.8)';
      ctx.beginPath();
      ctx.moveTo(-8, -110);
      ctx.lineTo(8, -110);
      ctx.quadraticCurveTo(30, -80, chestX * 2, -50);
      ctx.quadraticCurveTo(chestX * 2 - 30, -20, waistX * 2, 20);
      ctx.quadraticCurveTo(waistX * 2 + 20, 50, hipsX * 2, 100);
      ctx.lineTo(-40, 100);
      ctx.lineTo(-40, 112);
      ctx.lineTo(40, 112);
      ctx.lineTo(40, 100);
      ctx.closePath();
      ctx.fill();

      // Arms doing a mudra
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Left arm curving upward
      ctx.beginPath();
      ctx.moveTo(-16, -84);
      ctx.lineTo(-56, -60);
      ctx.lineTo(-36, -20);
      ctx.stroke();

      // Right arm stretching out
      ctx.beginPath();
      ctx.moveTo(16, -84);
      ctx.lineTo(64, -72);
      ctx.lineTo(90, -40);
      ctx.stroke();

      // Ghungroo (feet bells) circles
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(-30, 104, 6, 0, Math.PI*2);
      ctx.arc(-16, 104, 6, 0, Math.PI*2);
      ctx.arc(16, 104, 6, 0, Math.PI*2);
      ctx.arc(30, 104, 6, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();

      // 3. Emit sparkles/flower petals from mudra points
      if (Math.random() < 0.08) {
        sparkles.push({
          x: cx + (Math.random() > 0.5 ? -50 : 90),
          y: cy + (Math.random() > 0.5 ? -20 : -40),
          size: Math.random() * 6 + 4,
          color: 'rgba(212, 175, 55, 0.85)',
          vy: -Math.random() * 3.0 - 1.0,
          vx: (Math.random() - 0.5) * 2.4,
          life: 1.0,
          decay: 0.02
        });
      }

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.y += s.vy;
        s.x += s.vx;
        s.life -= s.decay;

        if (s.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    requestAnimationFrame(draw);
  }

  // Start loop
  draw();
}
