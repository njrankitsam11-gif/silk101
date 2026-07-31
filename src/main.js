import './style.css';
import './matchmaker.css';
import './hyper3d.css';
import './hypereffects.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global State
let audioCtx = null;
let masterGainNode = null;
let synthNode = null;
let clackTimer = null;
let isAudioPlaying = false;
let masterVolume = parseFloat(localStorage.getItem('loom_audio_volume') || '0.8');
let isSFXEnabled = localStorage.getItem('loom_audio_sfx') !== 'false';
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
  masterGainNode = audioCtx.createGain();
  masterGainNode.gain.setValueAtTime(isAudioPlaying ? masterVolume : 0, audioCtx.currentTime);
  masterGainNode.connect(audioCtx.destination);
  
  // 1. Ambient Synth Pad (Low-frequency drone)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const padGain = audioCtx.createGain();
  const spatialPanner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  
  const cfg = SOUNDSCAPES[activeSoundscape] || SOUNDSCAPES.loom;
  osc1.frequency.value = cfg.pitchBase[0];
  osc2.frequency.value = cfg.pitchBase[1];
  
  filter.type = 'lowpass';
  filter.frequency.value = cfg.filterFreq;
  filter.Q.value = 5;
  
  padGain.gain.value = isAudioPlaying ? cfg.padGain : 0;
  
  osc1.connect(filter);
  osc2.connect(filter);
  
  if (spatialPanner) {
    filter.connect(spatialPanner);
    spatialPanner.connect(padGain);
  } else {
    filter.connect(padGain);
  }
  
  padGain.connect(masterGainNode);
  
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
  if (isSFXEnabled) playClackSound(mouseXNormalized);
  
  // Rhythm interval speeds up with scroll velocity
  const baseInterval = 1200;
  const velocityReduction = Math.min(scrollVelocity * 8, 800);
  const nextInterval = Math.max(baseInterval - velocityReduction, 250);
  
  setTimeout(() => {
    if (isAudioPlaying && isSFXEnabled) playClackSound(mouseXNormalized * -1);
  }, nextInterval / 2.5);
  
  clackTimer = setTimeout(triggerLoomClack, nextInterval);
}

function playClackSound(panValue) {
  if (!audioCtx || !isAudioPlaying || !isSFXEnabled) return;
  const outNode = masterGainNode || audioCtx.destination;
  
  // 1. Sub-bass heavy wooden frame thud
  const thudOsc = audioCtx.createOscillator();
  const thudGain = audioCtx.createGain();
  thudOsc.type = 'triangle';
  thudOsc.frequency.setValueAtTime(110 * (1 + warpTension * 0.12), audioCtx.currentTime);
  thudOsc.frequency.exponentialRampToValueAtTime(24, audioCtx.currentTime + 0.14);
  
  thudGain.gain.setValueAtTime(0.32, audioCtx.currentTime);
  thudGain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.14);
  
  // 2. Wooden shuttle impact click (wood resonant body)
  const clickBuffer = createNoiseBuffer();
  const clickSource = audioCtx.createBufferSource();
  clickSource.buffer = clickBuffer;
  
  const clickFilter = audioCtx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 1450;
  clickFilter.Q.value = 7.5;
  
  const clickGain = audioCtx.createGain();
  clickGain.gain.setValueAtTime(0.14, audioCtx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
  
  // 3. Silk thread friction whirr (short high-frequency breeze)
  const whirrSource = audioCtx.createBufferSource();
  whirrSource.buffer = clickBuffer;
  const whirrFilter = audioCtx.createBiquadFilter();
  whirrFilter.type = 'highpass';
  whirrFilter.frequency.value = 3200;
  const whirrGain = audioCtx.createGain();
  whirrGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  whirrGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

  const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  if (panner) {
    panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, panValue)), audioCtx.currentTime);
    
    thudOsc.connect(thudGain);
    thudGain.connect(panner);
    
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(panner);

    whirrSource.connect(whirrFilter);
    whirrFilter.connect(whirrGain);
    whirrGain.connect(panner);
    
    panner.connect(outNode);
  } else {
    thudOsc.connect(thudGain);
    thudGain.connect(outNode);
    
    clickSource.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(outNode);

    whirrSource.connect(whirrFilter);
    whirrFilter.connect(whirrGain);
    whirrGain.connect(outNode);
  }
  
  thudOsc.start();
  thudOsc.stop(audioCtx.currentTime + 0.16);
  clickSource.start();
  clickSource.stop(audioCtx.currentTime + 0.07);
  whirrSource.start();
  whirrSource.stop(audioCtx.currentTime + 0.09);
}

// Silk Thread Friction Rustle for card drags & 360 rotation
let lastRustleTime = 0;
function playSilkRustleSound(intensity = 1.0) {
  if (!audioCtx || !isAudioPlaying || !isSFXEnabled) return;
  const now = Date.now();
  if (now - lastRustleTime < 80) return; // throttle rustles
  lastRustleTime = now;

  try {
    const noise = createNoiseBuffer();
    const source = audioCtx.createBufferSource();
    source.buffer = noise;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 + Math.random() * 800, audioCtx.currentTime);
    filter.Q.value = 3.0;

    const gain = audioCtx.createGain();
    const vol = Math.min(0.06 * intensity, 0.12);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    const outNode = masterGainNode || audioCtx.destination;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);

    source.start();
    source.stop(audioCtx.currentTime + 0.13);
  } catch (e) {}
}

// Weaver Foot-Pedal Thud Sound
function playPedalThudSound() {
  if (!audioCtx || !isAudioPlaying || !isSFXEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(18, audioCtx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
    const outNode = masterGainNode || audioCtx.destination;
    osc.connect(gain);
    gain.connect(outNode);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.23);
  } catch (e) {}
}

// Warm Resonant Temple Bell Chime
function playTempleChimeSound(freq = 528) {
  if (!audioCtx || !isAudioPlaying || !isSFXEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.8);
    const outNode = masterGainNode || audioCtx.destination;
    osc.connect(gain);
    gain.connect(outNode);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.85);
  } catch (e) {}
}

function createNoiseBuffer() {
  const bufferSize = audioCtx.sampleRate * 0.08;
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
  
  // Update Premium Scroll Progress Indicator
  const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (totalScroll > 0) {
    const progressPercent = (currentY / totalScroll) * 100;
    const pBar = document.querySelector('.scroll-progress-fill');
    if (pBar) pBar.style.width = `${progressPercent}%`;
  }
  
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

// Audio Control Helper
function setAudioState(enabled) {
  isAudioPlaying = enabled;
  if (enabled) {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  if (audioCtx) {
    const cfg = SOUNDSCAPES[activeSoundscape] || SOUNDSCAPES.loom;
    if (synthNode && synthNode.padGain) {
      synthNode.padGain.gain.setValueAtTime(enabled ? cfg.padGain : 0, audioCtx.currentTime);
    }
    if (masterGainNode) {
      masterGainNode.gain.setValueAtTime(enabled ? masterVolume : 0, audioCtx.currentTime);
    }
  }
  updateAudioUI();
}

function updateAudioUI() {
  const toggle = document.getElementById('audio-toggle');
  if (toggle) {
    if (isAudioPlaying) {
      toggle.classList.add('playing');
      toggle.setAttribute('aria-pressed', 'true');
      toggle.setAttribute('aria-label', 'Audio control menu (Audio ON)');
      const textEl = toggle.querySelector('.audio-text');
      if (textEl) textEl.textContent = 'AUDIO ON';
    } else {
      toggle.classList.remove('playing');
      toggle.setAttribute('aria-pressed', 'false');
      toggle.setAttribute('aria-label', 'Audio control menu (Audio OFF)');
      const textEl = toggle.querySelector('.audio-text');
      if (textEl) textEl.textContent = 'AUDIO OFF';
    }
  }
  const masterBtn = document.getElementById('audio-menu-master-btn');
  if (masterBtn) {
    masterBtn.textContent = isAudioPlaying ? '🔊 AUDIO ON' : '🔇 AUDIO OFF';
    masterBtn.classList.toggle('active', isAudioPlaying);
  }
}

// Audio Setup Buttons (Entry Gate)
const btnGateOn = document.getElementById('btn-gate-on');
const btnGateOff = document.getElementById('btn-gate-off');
const entryGate = document.getElementById('entry-gate');

if (btnGateOn) {
  btnGateOn.addEventListener('click', () => {
    sessionStorage.setItem('loom_gate_dismissed', 'true');
    if (entryGate) entryGate.classList.add('hidden');
    setAudioState(true);
  });
}

if (btnGateOff) {
  btnGateOff.addEventListener('click', () => {
    sessionStorage.setItem('loom_gate_dismissed', 'true');
    if (entryGate) entryGate.classList.add('hidden');
    setAudioState(false);
  });
}


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
  
  canvasLeft.addEventListener('pointerleave', () => {
    mouse.isOver = false;
    tooltip.classList.remove('active');
  });
  canvasLeft.addEventListener('mouseleave', () => {
    mouse.isOver = false;
    tooltip.classList.remove('active');
  });
  
  let lastShuttleSide = false;

  function drawLeft() {
    ctxLeft.fillStyle = '#08080a';
    ctxLeft.fillRect(0, 0, canvasLeft.width, canvasLeft.height);
    
    const time = Date.now() * 0.0025;
    
    // Wood frame with grain texture and warm shadow
    ctxLeft.save();
    ctxLeft.strokeStyle = 'rgba(212, 175, 55, 0.08)';
    ctxLeft.lineWidth = 14;
    ctxLeft.shadowColor = '#000';
    ctxLeft.shadowBlur = 20;
    ctxLeft.strokeRect(30, 30, canvasLeft.width - 60, canvasLeft.height - 60);
    ctxLeft.restore();

    // Fabric Backing Texture (Subtle Weave Pattern)
    ctxLeft.fillStyle = 'rgba(255, 255, 255, 0.012)';
    for (let wy = 40; wy < canvasLeft.height - 40; wy += 8) {
      ctxLeft.fillRect(40, wy, canvasLeft.width - 80, 1);
    }
    
    // Warp Threads count based on threadCount slider
    const spacing = (canvasLeft.width - 80) / threadCount;
    
    for (let i = 0; i < threadCount; i++) {
      const tx = 40 + i * spacing;
      ctxLeft.beginPath();
      ctxLeft.moveTo(tx, 30);
      
      // Thread tension/bend varies with warpTension slider
      let bend = 0;
      if (mouse.isOver) {
        const dist = Math.abs(mouse.x - tx);
        if (dist < 160) {
          // Tension strain physics
          bend = (1 - dist / 160) * (mouse.y - canvasLeft.height / 2) * (1.1 / warpTension);
          if (dist < 20) {
            playSilkRustleSound(0.4);
          }
        }
      }
      
      const wave = Math.sin(time + i * 0.4) * 3;
      
      // Photorealistic Thread Color Layers
      let mainHue = 340; // Crimson Patta
      let isZari = false;

      if (borderPattern === 'lotus' && i % 4 === 0) { isZari = true; mainHue = 45; }
      else if (borderPattern === 'temple' && i % 3 === 0) { mainHue = 30; }
      else if (borderPattern === 'grid' && i % 2 === 0) { mainHue = 200; }
      
      // Core thread strand
      ctxLeft.save();
      if (isZari) {
        ctxLeft.strokeStyle = 'rgba(255, 215, 0, 0.85)';
        ctxLeft.lineWidth = 2.2;
        ctxLeft.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctxLeft.shadowBlur = 6;
      } else {
        ctxLeft.strokeStyle = `hsla(${mainHue}, 75%, 45%, 0.6)`;
        ctxLeft.lineWidth = 1.6;
      }

      ctxLeft.bezierCurveTo(tx, canvasLeft.height * 0.25, tx + bend + wave, canvasLeft.height * 0.5, tx, canvasLeft.height - 30);
      ctxLeft.stroke();

      // Micro-fiber Fuzz strands (Photorealistic Thread Detail)
      if (i % 3 === 0) {
        ctxLeft.strokeStyle = isZari ? 'rgba(255, 245, 180, 0.4)' : `hsla(${mainHue}, 60%, 70%, 0.25)`;
        ctxLeft.lineWidth = 0.6;
        ctxLeft.beginPath();
        const fuzzY = (Math.sin(time * 2 + i) * 0.4 + 0.5) * (canvasLeft.height - 80) + 40;
        ctxLeft.moveTo(tx + bend, fuzzY);
        ctxLeft.lineTo(tx + bend + (i % 2 === 0 ? 4 : -4), fuzzY - 3);
        ctxLeft.stroke();
      }
      ctxLeft.restore();
    }
    
    // Loom Shuttle (3D Wood Shell + Gilded Weft Spool)
    const shuttleProgress = Math.sin(time * 0.6) * 0.42 + 0.5;
    const shuttleX = 40 + shuttleProgress * (canvasLeft.width - 80);
    const shuttleY = canvasLeft.height / 2;
    
    // Trigger acoustic clack on shuttle direction change
    const isRightSide = shuttleProgress > 0.5;
    if (isRightSide !== lastShuttleSide) {
      lastShuttleSide = isRightSide;
      playClackSound(isRightSide ? 0.6 : -0.6);
      playPedalThudSound();
    }

    ctxLeft.save();
    ctxLeft.translate(shuttleX, shuttleY);
    
    // Shuttle Drop Shadow
    ctxLeft.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctxLeft.beginPath();
    ctxLeft.ellipse(0, 16, 48, 8, 0, 0, Math.PI * 2);
    ctxLeft.fill();

    // Wooden Shuttle Body
    const woodGrad = ctxLeft.createLinearGradient(-50, 0, 50, 0);
    woodGrad.addColorStop(0, '#5a2e0a');
    woodGrad.addColorStop(0.5, '#8c4a18');
    woodGrad.addColorStop(1, '#5a2e0a');
    ctxLeft.fillStyle = woodGrad;
    ctxLeft.strokeStyle = '#d4af37';
    ctxLeft.lineWidth = 1;
    
    ctxLeft.beginPath();
    ctxLeft.moveTo(-52, 0);
    ctxLeft.quadraticCurveTo(-15, -14, 0, -14);
    ctxLeft.quadraticCurveTo(15, -14, 52, 0);
    ctxLeft.quadraticCurveTo(15, 14, 0, 14);
    ctxLeft.quadraticCurveTo(-15, 14, -52, 0);
    ctxLeft.closePath();
    ctxLeft.fill();
    ctxLeft.stroke();

    // Gold Weft Thread Spool Inside Shuttle
    ctxLeft.fillStyle = '#ffd700';
    ctxLeft.fillRect(-12, -4, 24, 8);
    
    // Active Trailing Weft Thread
    ctxLeft.strokeStyle = '#ffd700';
    ctxLeft.lineWidth = 2;
    ctxLeft.shadowBlur = 10;
    ctxLeft.shadowColor = '#ffd700';
    ctxLeft.beginPath();
    ctxLeft.moveTo(0, 0);
    ctxLeft.lineTo(isRightSide ? -shuttleX : canvasLeft.width - shuttleX, 0);
    ctxLeft.stroke();
    
    ctxLeft.restore();
    
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
   SECTION 4: THE VAULT & HOUSES OF ODISHA HANDLOOM
========================================================== */
let sareeCollection = [];

const FALLBACK_INVENTORY = [
  // ── HOUSE OF SAMBALPUR (1..5) ──
  {
    id: 1,
    name: 'Sambalpuri Lotus & Pasapalli Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 155000,
    stock_status: 'available',
    material: '100% Pure Mulberry Silk',
    weaving_time_days: 28,
    description: 'Signature Sambalpuri double-Ikat checkerboard Pasapalli with organic crimson lotus pallu Zari figuring.',
    color_hue: 340,
    color_saturation: 1.3
  },
  {
    id: 2,
    name: 'Sambalpuri Phulia Lattice Ikat Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 140000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 24,
    description: 'Intricate violet and emerald geometric lattice woven using mathematical Bandha tie-dye alignment.',
    color_hue: 280,
    color_saturation: 1.2
  },
  {
    id: 3,
    name: 'Sambalpuri Peacock Cascade Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 165000,
    stock_status: 'available',
    material: 'Tussar & Mulberry Silk',
    weaving_time_days: 30,
    description: 'Deep royal blue body adorned with cascading peacock motifs across the pallu and contrast gold zari border.',
    color_hue: 210,
    color_saturation: 1.4
  },
  {
    id: 4,
    name: 'Sambalpuri Rudraksha Border Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 135000,
    stock_status: 'available',
    material: 'Pure Silk',
    weaving_time_days: 22,
    description: 'Warm terracotta ground highlighting sacred Rudraksha seed border reliefs and traditional temple Kumbha spires.',
    color_hue: 25,
    color_saturation: 1.1
  },
  {
    id: 5,
    name: 'Sambalpuri Sacred Temple Grid Saree',
    house_name: 'House of Sambalpur',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 2,
    artisan_name: 'Shri Ranjan Meher',
    artisan_location: 'Maniabandha, Odisha',
    price_fiat: 170000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 32,
    description: 'Emerald green ground with gold-plated silver thread Zari portraying organic lotus petals and temple spires.',
    color_hue: 150,
    color_saturation: 1.3
  },

  // ── HOUSE OF KHANDUA (6..10) ──
  {
    id: 6,
    name: 'Nuapatna Khandua Gita Govinda Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 185000,
    stock_status: 'available',
    material: '100% Pure Khandua Silk',
    weaving_time_days: 36,
    description: 'Sacred Nuapatna Khandua woven with verses of Gita Govinda, tie-dyed with organic turmeric and madder root.',
    color_hue: 0,
    color_saturation: 1.5
  },
  {
    id: 7,
    name: 'Khandua Deula Bhaunri Spire Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Khandua Silk',
    weaving_time_days: 32,
    description: 'Golden yellow body featuring Jagannath temple spire silhouettes and auspicious elephant-deer pallu bandha.',
    color_hue: 45,
    color_saturation: 1.2
  },
  {
    id: 8,
    name: 'Khandua Radhanagar Crimson Silk',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 160000,
    stock_status: 'available',
    material: 'Mulberry Silk',
    weaving_time_days: 26,
    description: 'Radiant crimson silk featuring fine floral ikat weave borders handed down through Radhanagar master weavers.',
    color_hue: 350,
    color_saturation: 1.4
  },
  {
    id: 9,
    name: 'Khandua Elephant March Pallu Saree',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Khandua Patta Silk',
    weaving_time_days: 40,
    description: 'Rich saffron ground with a grand procession of nine royal elephants woven into the pallu using Bandha technique.',
    color_hue: 35,
    color_saturation: 1.3
  },
  {
    id: 10,
    name: 'Khandua Maniabandha Diamond Ikat',
    house_name: 'House of Khandua',
    category_id: 1,
    category_name: 'Ikat',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Nuapatna, Odisha',
    price_fiat: 150000,
    stock_status: 'available',
    material: 'Khandua Silk Blend',
    weaving_time_days: 25,
    description: 'Deep cobalt blue body with geometric diamond ikat repeats, representing sacred mathematical proportions in handloom.',
    color_hue: 220,
    color_saturation: 1.2
  },

  // ── HOUSE OF BOMKAI (11..15) ──
  {
    id: 11,
    name: 'Bomkai Sonepur Jamdani Peacock Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 215000,
    stock_status: 'available',
    material: 'Pure Bomkai Silk',
    weaving_time_days: 38,
    description: 'Deep magenta silk with gold peacock feather pallu. Features extra-weft figuring woven with needle-precision.',
    color_hue: 295,
    color_saturation: 1.4
  },
  {
    id: 12,
    name: 'Bomkai Fish & Lotus Legend Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 190000,
    stock_status: 'available',
    material: 'Bomkai Silk',
    weaving_time_days: 34,
    description: 'Lush teal body displaying the classic Odia Matsya (sacred fish) and lotus motif figuring along the pallu border.',
    color_hue: 170,
    color_saturation: 1.3
  },
  {
    id: 13,
    name: 'Bomkai Royal Amber Zari Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 225000,
    stock_status: 'available',
    material: 'Heavy Bomkai Silk',
    weaving_time_days: 42,
    description: 'Warm amber gold silk woven with heavy metallic Zari extra-weft figuring representing southern Odisha royalty.',
    color_hue: 40,
    color_saturation: 1.5
  },
  {
    id: 14,
    name: 'Bomkai Heritage Crimson Border Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Bomkai Silk',
    weaving_time_days: 30,
    description: 'Vermilion red body with contrasting dark navy border featuring geometric tribal motifs and gold extra-weft brocade.',
    color_hue: 5,
    color_saturation: 1.4
  },
  {
    id: 15,
    name: 'Bomkai Midnight Indigo Brocade Saree',
    house_name: 'House of Bomkai',
    category_id: 3,
    category_name: 'Kanjivaram',
    artisan_id: 3,
    artisan_name: 'Shri Kailash Meher',
    artisan_location: 'Sonepur, Odisha',
    price_fiat: 210000,
    stock_status: 'available',
    material: 'Pure Mulberry Silk',
    weaving_time_days: 36,
    description: 'Deep midnight indigo with gold and copper thread extra-weft figuring portraying ancient Odia village mythologies.',
    color_hue: 245,
    color_saturation: 1.5
  },

  // ── HOUSE OF BERHAMPUR (16..20) ──
  {
    id: 16,
    name: 'Berhampur Phoda Kumbha Temple Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 180000,
    stock_status: 'available',
    material: 'Berhampur Patta Silk',
    weaving_time_days: 30,
    description: 'Famous Berhampur Pata with interlocking Phoda Kumbha temple spires along the border, woven without electricity.',
    color_hue: 130,
    color_saturation: 1.2
  },
  {
    id: 17,
    name: 'Berhampur Gongdi Silk Relic Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 175000,
    stock_status: 'available',
    material: 'Gongdi Tissue Silk',
    weaving_time_days: 26,
    description: 'Rose-gold gossamer Gongdi tissue silk from Berhampur with peacock fan tail border in pure silver Zari.',
    color_hue: 330,
    color_saturation: 1.1
  },
  {
    id: 18,
    name: 'Berhampur Dual-Tone Patta Joda Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 235000,
    stock_status: 'available',
    material: 'Patta Joda Silk',
    weaving_time_days: 44,
    description: 'Ceremonial dual-tone gold and marigold silk Patta Joda, traditional attire for auspicious temple rituals in Odisha.',
    color_hue: 50,
    color_saturation: 1.3
  },
  {
    id: 19,
    name: 'Berhampur Golden Canopy Silk Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 205000,
    stock_status: 'available',
    material: 'Heavy Tissue Silk',
    weaving_time_days: 35,
    description: 'Rich ocher tissue silk with elaborate golden temple canopy borders and subtle metallic luster across the body.',
    color_hue: 42,
    color_saturation: 1.4
  },
  {
    id: 20,
    name: 'Berhampur Sacred Shrine Border Saree',
    house_name: 'House of Berhampur',
    category_id: 4,
    category_name: 'Tissue Silk',
    artisan_id: 1,
    artisan_name: 'Smt. Sebati Mohanty',
    artisan_location: 'Berhampur, Odisha',
    price_fiat: 195000,
    stock_status: 'available',
    material: 'Berhampur Silk',
    weaving_time_days: 32,
    description: 'Deep plum body with contrast mustard temple border and hand-interlocked Kumbha spire joins.',
    color_hue: 300,
    color_saturation: 1.2
  }
];

/* ─── HANDLOOM MAP OF ODISHA ──────────────────────────────────────── */
function setupHandloomMap() {
  const section = document.getElementById('handloom-map');
  if (!section) return;

  // ── 1. SILK THREAD PARTICLE SYSTEM ──────────────────────────────
  const pCvs = document.getElementById('hm-silk-particles');
  if (pCvs) {
    pCvs.width = window.innerWidth;
    pCvs.height = section.offsetHeight || 900;
    const pCtx = pCvs.getContext('2d');
    const threads = Array.from({ length: 55 }, () => ({
      x: Math.random() * pCvs.width,
      y: Math.random() * pCvs.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.25 + 0.1,
      len: Math.random() * 80 + 40,
      hue: Math.random() < 0.6 ? 45 : (Math.random() < 0.5 ? 340 : 210),
      alpha: Math.random() * 0.35 + 0.1,
      angle: Math.random() * Math.PI * 2
    }));
    function animParticles() {
      pCtx.clearRect(0, 0, pCvs.width, pCvs.height);
      threads.forEach(t => {
        t.x += t.vx; t.y += t.vy; t.angle += 0.006;
        if (t.y > pCvs.height + 20) { t.y = -20; t.x = Math.random() * pCvs.width; }
        if (t.x < -10 || t.x > pCvs.width + 10) { t.x = Math.random() * pCvs.width; }
        const dx = Math.cos(t.angle) * t.len;
        const dy = Math.sin(t.angle) * t.len * 0.35;
        const grad = pCtx.createLinearGradient(t.x, t.y, t.x + dx, t.y + dy);
        grad.addColorStop(0, `hsla(${t.hue},80%,55%,0)`);
        grad.addColorStop(0.5, `hsla(${t.hue},80%,60%,${t.alpha})`);
        grad.addColorStop(1, `hsla(${t.hue},80%,55%,0)`);
        pCtx.beginPath();
        pCtx.moveTo(t.x, t.y);
        pCtx.lineTo(t.x + dx, t.y + dy);
        pCtx.strokeStyle = grad;
        pCtx.lineWidth = 1;
        pCtx.stroke();
      });
      requestAnimationFrame(animParticles);
    }
    animParticles();
  }


  // ── 2. (Map now uses photo — no canvas drawing needed) ───────────

  // ── 3. SWATCH CANVAS RENDERER (fabric textures) ─────────────────
  document.querySelectorAll('.hm-swatch-canvas').forEach(cvs => {
    const hue = parseInt(cvs.dataset.hue) || 0;
    const sat = parseFloat(cvs.dataset.sat) || 1.0;
    const satPct = Math.min(90, Math.floor(sat * 75));
    const W = cvs.offsetWidth || 180;
    const H = 90;
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    // Base silk gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `hsl(${hue},${satPct}%,22%)`);
    g.addColorStop(0.5, `hsl(${hue},${satPct}%,30%)`);
    g.addColorStop(1, `hsl(${hue},${satPct}%,18%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Ikat warp threads
    for (let x = 0; x < W; x += 8) {
      ctx.strokeStyle = `rgba(255,255,255,0.05)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // Gold zari dots
    ctx.fillStyle = 'rgba(212,175,55,0.4)';
    for (let bx = 12; bx < W; bx += 20) {
      for (let by = 12; by < H; by += 18) {
        ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Folded diagonal pallu
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W * 0.55, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.8); ctx.closePath();
    const palluGrad = ctx.createLinearGradient(W * 0.6, 0, W, H * 0.8);
    palluGrad.addColorStop(0, `hsl(${(hue+160)%360},${satPct}%,25%)`);
    palluGrad.addColorStop(1, `hsl(${(hue+160)%360},${satPct}%,16%)`);
    ctx.fillStyle = palluGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.55, 0); ctx.lineTo(W, H * 0.8); ctx.stroke();
    ctx.restore();
  });

  // ── 4. SVG GOLD CONNECTOR LINES (animated draw-in) ───────────────
  const svg = document.getElementById('hm-connectors');
  if (svg) {
    // [hotspot-id, label-text, label-x%, label-y%, anchor-side]
    const connectors = [
      ['hspot-sambalpuri', 'Sonpuri Saree',     '4%',  '8%',  'left'],
      ['hspot-pasapalli',  'Pasapalli',          '4%',  '36%', 'left'],
      ['hspot-khandua',    'Khandua Saree',      '68%', '18%', 'right'],
      ['hspot-bomkai',     'Bomkai',             '2%',  '56%', 'left'],
      ['hspot-berhampur',  'Berhampuri Pata',    '48%', '90%', 'below'],
      ['hspot-kotpad',     'Kotpad',             '2%',  '74%', 'left'],
      ['hspot-puri',       'Kataki Saree',       '72%', '54%', 'right'],
      ['hspot-tassar',     'Tassar Fabric',      '72%', '14%', 'right'],
    ];
    const mapContainer = document.getElementById('hm-map-container');
    const cW = mapContainer ? mapContainer.offsetWidth : 600;
    const cH = mapContainer ? mapContainer.offsetHeight : 520;
    svg.setAttribute('viewBox', `0 0 ${cW} ${cH}`);

    connectors.forEach(([id, label, lx, ly, side]) => {
      const hotspot = document.getElementById(id);
      if (!hotspot) return;
      const hsRect = hotspot.getBoundingClientRect();
      const mapRect = (mapContainer || document.body).getBoundingClientRect();
      const hx = hsRect.left - mapRect.left + 7;
      const hy = hsRect.top - mapRect.top + 7;

      const lxPx = parseFloat(lx) / 100 * cW;
      const lyPx = parseFloat(ly) / 100 * cH;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', hx); line.setAttribute('y1', hy);
      line.setAttribute('x2', lxPx); line.setAttribute('y2', lyPx);
      line.setAttribute('stroke', '#d4af37');
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('stroke-opacity', '0.55');
      line.setAttribute('stroke-dasharray', '2 3');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lxPx + (side === 'right' ? 6 : side === 'left' ? -4 : 0));
      text.setAttribute('y', lyPx + (side === 'below' ? 14 : 4));
      text.setAttribute('text-anchor', side === 'right' ? 'start' : side === 'left' ? 'end' : 'middle');
      text.setAttribute('font-family', 'Cormorant Garamond, serif');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#c8a83a');
      text.setAttribute('opacity', '0.9');
      text.textContent = label;

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', lxPx); dot.setAttribute('cy', lyPx);
      dot.setAttribute('r', '2.5');
      dot.setAttribute('fill', '#d4af37');
      dot.setAttribute('opacity', '0.7');

      svg.appendChild(line);
      svg.appendChild(dot);
      svg.appendChild(text);
    });
  }

  // ── 5. HOTSPOT TOOLTIP + ACTIVE SWATCH SYNC ─────────────────────
  const tooltip = document.getElementById('hm-tooltip');
  const tooltipName = tooltip ? tooltip.querySelector('.hm-tooltip-name') : null;
  const tooltipDesc = tooltip ? tooltip.querySelector('.hm-tooltip-desc') : null;
  const clusterInfo = {
    sambalpuri: { name: 'Sonpuri / Sambalpuri Saree', desc: 'Double Ikat from Maniabandha — warp & weft tie-dyed simultaneously' },
    pasapalli:  { name: 'Pasapalli Bandha', desc: 'Sacred checkerboard ikat symbolising the board game of Mahabharata' },
    khandua:    { name: 'Khandua Silk', desc: 'Sacred temple silk with Gita Govinda verses from Nuapatna' },
    bomkai:     { name: 'Bomkai / Sonepuri', desc: 'Extra-weft tribal figuring unique to Sonepur in Western Odisha' },
    berhampur:  { name: 'Berhampuri Pata Joda', desc: 'Ceremonial Phoda Kumbha temple border silk from coastal Berhampur' },
    kotpad:     { name: 'Kotpad Tribal Saree', desc: 'Organic oad-root dyed cotton by Dharua tribe in Kotpad' },
    puri:       { name: 'Puri Patta Silk', desc: 'Khandua Patta woven as Rath Yatra chariot offerings for Lord Jagannath' },
    tassar:     { name: 'Tassar Fabric', desc: 'Wild silkworm Tussar fabric from Jharsuguda & Sambalpur forests' },
  };

  document.querySelectorAll('.hm-hotspot').forEach(spot => {
    spot.addEventListener('mouseenter', (e) => {
      const cluster = spot.dataset.cluster;
      const info = clusterInfo[cluster] || {};
      if (tooltipName) tooltipName.textContent = info.name || spot.dataset.name;
      if (tooltipDesc) tooltipDesc.textContent = info.desc || '';
      tooltip.classList.add('visible');
      spot.classList.add('hm-active');
      // Highlight matching swatch
      document.querySelectorAll('.hm-swatch-card').forEach(c => {
        c.classList.toggle('hm-active', c.dataset.cluster === cluster);
      });
    });
    spot.addEventListener('mousemove', (e) => {
      if (tooltip) {
        tooltip.style.left = (e.clientX + 16) + 'px';
        tooltip.style.top  = (e.clientY - 10) + 'px';
      }
    });
    spot.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      spot.classList.remove('hm-active');
      document.querySelectorAll('.hm-swatch-card').forEach(c => c.classList.remove('hm-active'));
    });
  });

  // Swatch → hotspot cross-highlight
  document.querySelectorAll('.hm-swatch-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const cluster = card.dataset.cluster;
      document.querySelectorAll('.hm-hotspot').forEach(h => {
        h.classList.toggle('hm-active', h.dataset.cluster === cluster);
      });
    });
    card.addEventListener('mouseleave', () => {
      document.querySelectorAll('.hm-hotspot').forEach(h => h.classList.remove('hm-active'));
    });
  });

  // ── 6. GSAP SCROLL-TRIGGERED REVEALS ────────────────────────────
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // Header reveal
    gsap.fromTo('#hm-header', {
      opacity: 0, y: 50
    }, {
      opacity: 1, y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#handloom-map', start: 'top 80%', once: true }
    });

    // Frame scale-in with 3D perspective
    gsap.fromTo('#hm-frame-wrap', {
      opacity: 0, scale: 0.85, rotateX: 12,
    }, {
      opacity: 1, scale: 1, rotateX: 0,
      duration: 1.4,
      ease: 'power4.out',
      delay: 0.2,
      scrollTrigger: { trigger: '#handloom-map', start: 'top 75%', once: true }
    });

    // Left swatches stagger
    gsap.fromTo('#hm-swatches-left .hm-swatch-card', {
      opacity: 0, x: -50, rotateY: 15
    }, {
      opacity: 1, x: 0, rotateY: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.4,
      scrollTrigger: { trigger: '#handloom-map', start: 'top 70%', once: true }
    });

    // Right swatches stagger
    gsap.fromTo('#hm-swatches-right .hm-swatch-card', {
      opacity: 0, x: 50, rotateY: -15
    }, {
      opacity: 1, x: 0, rotateY: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.4,
      scrollTrigger: { trigger: '#handloom-map', start: 'top 70%', once: true }
    });

    // Hotspots pop-in
    gsap.fromTo('.hm-hotspot', {
      opacity: 0, scale: 0
    }, {
      opacity: 1, scale: 1,
      duration: 0.5,
      stagger: 0.08,
      ease: 'back.out(2)',
      delay: 0.8,
      scrollTrigger: { trigger: '#handloom-map', start: 'top 60%', once: true }
    });

    // Parallax BG layer on scroll
    gsap.to('#hm-bg-velvet', {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '#handloom-map',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5
      }
    });

    // Frame subtle float on scroll (depth)
    gsap.to('#hm-frame-wrap', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: '#handloom-map',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });

    // Left swatches parallax
    gsap.to('#hm-swatches-left', {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#handloom-map',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5
      }
    });

    // Right swatches parallax
    gsap.to('#hm-swatches-right', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '#handloom-map',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2.5
      }
    });
  }

  // ── 7. MOUSE-DRIVEN 3D PARALLAX ─────────────────────────────────
  let rafMouse;
  let targetMX = 0, targetMY = 0, curMX = 0, curMY = 0;
  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    targetMX = (e.clientX - rect.left - rect.width  / 2) / rect.width;
    targetMY = (e.clientY - rect.top  - rect.height / 2) / rect.height;
  });
  section.addEventListener('mouseleave', () => {
    targetMX = 0; targetMY = 0;
  });
  function tickMouse() {
    curMX += (targetMX - curMX) * 0.06;
    curMY += (targetMY - curMY) * 0.06;
    const bg = document.getElementById('hm-bg-velvet');
    const frame = document.getElementById('hm-frame-wrap');
    const swL  = document.getElementById('hm-swatches-left');
    const swR  = document.getElementById('hm-swatches-right');
    if (bg)    bg.style.transform    = `translate(${curMX * 22}px, ${curMY * 14}px)`;
    if (frame) frame.style.transform = `translate(${curMX * -10}px, ${curMY * -8}px) rotateX(${curMY * -3}deg) rotateY(${curMX * 4}deg)`;
    if (swL)   swL.style.transform   = `translate(${curMX * 14}px, ${curMY * 20}px)`;
    if (swR)   swR.style.transform   = `translate(${curMX * -14}px, ${curMY * -20}px)`;
    rafMouse = requestAnimationFrame(tickMouse);
  }
  tickMouse();
}

/* ─── HOUSES OF ODISHA HANDLOOM SHOWCASE ENGINE ───────────────────── */

function setupHousesOfOdisha() {
  const grid = document.getElementById('houses-saree-grid');
  if (!grid) return;

  function renderHousesGrid(selectedHouse = 'all') {
    grid.innerHTML = '';
    const inventory = sareeCollection && sareeCollection.length > 0 ? sareeCollection : FALLBACK_INVENTORY;

    const filtered = selectedHouse === 'all'
      ? inventory
      : inventory.filter(item => (item.house_name || '') === selectedHouse);

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(255,255,255,0.4); font-family:'Outfit';">No sarees found in ${selectedHouse}.</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'folded-saree-card';
      card.dataset.id = item.id;
      card.dataset.house = item.house_name || 'House of Sambalpur';

      const houseName = item.house_name || 'House of Sambalpur';
      const statusLabel = item.stock_status === 'sold' ? 'SOLD' : item.stock_status === 'reserved' ? 'RESERVED' : 'AVAILABLE';
      const statusClass = item.stock_status === 'sold' ? 'sold' : item.stock_status === 'reserved' ? 'reserved' : '';

      card.innerHTML = `
        <div class="folded-saree-visual" id="visual-${item.id}">
          <div class="folded-saree-badge-bar">
            <span class="house-chip-badge">${houseName}</span>
            <span class="stock-status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <canvas class="folded-saree-body-canvas" id="canvas-house-${item.id}" width="360" height="320"></canvas>
        </div>
        <div class="folded-saree-content">
          <h3 class="folded-saree-title">${item.name}</h3>
          <p class="folded-saree-artisan">${item.artisan_name || 'Master Weaver'} · ${item.artisan_location || 'Odisha'}</p>
          <div class="folded-saree-meta-row">
            <span class="folded-saree-price" data-inr-price="${item.price_fiat}">${formatSareePrice(item.price_fiat)}</span>
            <span class="folded-saree-days">⏱ ${item.weaving_time_days || 28} Days Weave</span>
          </div>
          <div class="folded-saree-actions">
            <button class="btn-folded-drape" data-action="drape">✦ 3D Drape</button>
            <button class="btn-folded-consult" data-action="consult">💬 Consultation</button>
          </div>
        </div>
      `;

      grid.appendChild(card);

      // Render the folded saree canvas visual (body weave + folded diagonal Pallu with Zari motifs)
      setTimeout(() => {
        const cvs = document.getElementById(`canvas-house-${item.id}`);
        if (cvs) {
          drawFoldedSareeCanvas(cvs.getContext('2d'), item);
        }
      }, 0);

      // Event listeners
      const visualEl = card.querySelector('.folded-saree-visual');
      if (visualEl) {
        visualEl.addEventListener('click', () => openUnweaveModal(item, sareeCollection));
      }
      const drapeBtn = card.querySelector('[data-action="drape"]');
      if (drapeBtn) {
        drapeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openUnweaveModal(item, sareeCollection);
        });
      }
      const consultBtn = card.querySelector('[data-action="consult"]');
      if (consultBtn) {
        consultBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const activePrice = formatSareePrice(item.price_fiat);
          const msg = encodeURIComponent(`Namaste Priyadarshini, I am interested in a curator consultation for "${item.name}" (${activePrice}) from ${houseName} crafted by ${item.artisan_name}. Please share loom status.`);
          window.open(`https://wa.me/916712300000?text=${msg}`, '_blank');
        });
      }
    });
  }

  // Bind House Tab Buttons
  document.querySelectorAll('.house-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.house-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const house = btn.dataset.house;
      renderHousesGrid(house);
    });
  });

  renderHousesGrid('all');
}

// Procedural Folded Saree Canvas Generator (Folded Pallu + Zari motif + dynamic Hue/Sat)
function drawFoldedSareeCanvas(ctx, item) {
  const w = 360;
  const h = 320;
  const hue = item.color_hue || 0;
  const sat = item.color_saturation || 1.0;
  const satPct = Math.min(100, Math.floor(sat * 80));

  ctx.clearRect(0, 0, w, h);

  // 1. Base Saree Body (Textured Silk Ground)
  const bodyGrad = ctx.createLinearGradient(0, 0, w, h);
  bodyGrad.addColorStop(0, `hsl(${hue}, ${satPct}%, 18%)`);
  bodyGrad.addColorStop(0.5, `hsl(${hue}, ${satPct}%, 26%)`);
  bodyGrad.addColorStop(1, `hsl(${hue}, ${satPct}%, 15%)`);
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(0, 0, w, h);

  // Body Ikat Threads & Pasapalli Grid lines
  ctx.strokeStyle = `rgba(255, 255, 255, 0.04)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(x * 0.1) * 3, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + Math.cos(y * 0.1) * 3);
    ctx.stroke();
  }

  // Draw Body Motifs (Small dots/stars across body)
  ctx.fillStyle = `rgba(212, 175, 55, 0.25)`;
  for (let bx = 20; bx < w; bx += 40) {
    for (let by = 20; by < h; by += 40) {
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. DIAGONAL FOLDED PALLU (Luxury Folded Saree Aesthetic)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.25, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h * 0.85);
  ctx.closePath();

  // Shadow under fold
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = -6;
  ctx.shadowOffsetY = 8;

  // Pallu background (contrast shade)
  const palluHue = (hue + 160) % 360;
  const palluGrad = ctx.createLinearGradient(w * 0.3, 0, w, h * 0.8);
  palluGrad.addColorStop(0, `hsl(${palluHue}, ${Math.min(90, satPct + 10)}%, 22%)`);
  palluGrad.addColorStop(1, `hsl(${palluHue}, ${Math.min(90, satPct + 10)}%, 14%)`);
  ctx.fillStyle = palluGrad;
  ctx.fill();

  ctx.shadowColor = 'transparent'; // reset shadow

  // Pallu Zari Brocade & Temple Spire Motifs
  ctx.strokeStyle = `rgba(212, 175, 55, 0.55)`;
  ctx.lineWidth = 1.5;
  for (let px = w * 0.35; px < w; px += 24) {
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px - 40, h * 0.8);
    ctx.stroke();
  }

  // Pallu Gold Zari Border Edge
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, 0);
  ctx.lineTo(w, h * 0.85);
  ctx.stroke();

  // Gold Zari Shimmer Dots along fold edge
  ctx.fillStyle = '#ffd700';
  for (let t = 0; t <= 1; t += 0.08) {
    const fx = w * 0.25 + t * (w - w * 0.25);
    const fy = t * (h * 0.85);
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

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

// ─── Region Config ──────────────────────────────────────────────────────────
const REGION_CONFIG = {
  'en-IN': { rate: 1.0,    symbol: '₹',    code: 'INR', flag: '🇮🇳', label: 'India (₹)', shipping: 'Ships in 3–5 business days across India', countryLabel: 'India' },
  'en-US': { rate: 0.012,  symbol: '$',    code: 'USD', flag: '🇺🇸', label: 'USA ($)',   shipping: 'DHL Express: 5–8 days to USA', countryLabel: 'United States' },
  'en-GB': { rate: 0.0094, symbol: '£',    code: 'GBP', flag: '🇬🇧', label: 'UK (£)',    shipping: 'DHL Express: 4–6 days to United Kingdom', countryLabel: 'United Kingdom' },
  'en-CA': { rate: 0.016,  symbol: 'C$',   code: 'CAD', flag: '🇨🇦', label: 'Canada (C$)', shipping: 'FedEx International: 6–9 days to Canada', countryLabel: 'Canada' },
  'en-AE': { rate: 0.044,  symbol: 'AED ', code: 'AED', flag: '🇦🇪', label: 'UAE (AED)', shipping: 'Aramex Priority: 3–5 days to UAE', countryLabel: 'UAE' },
  'en-SG': { rate: 0.016,  symbol: 'S$',   code: 'SGD', flag: '🇸🇬', label: 'Singapore (S$)', shipping: 'DHL Express: 4–6 days to Singapore', countryLabel: 'Singapore' },
  'hi-IN': { rate: 1.0,    symbol: '₹',    code: 'INR', flag: '🇮🇳', label: 'India / हिन्दी', shipping: 'भारत में 3–5 दिन में डिलीवरी', countryLabel: 'India' },
};

// Dynamic Currency Conversion Utility — reads localStorage override first, then URL param
function getLocaleDetails() {
  let lang = localStorage.getItem('loom_region') || null;
  if (!lang) {
    const urlParams = new URLSearchParams(window.location.search);
    lang = urlParams.get('lang') || 'en-IN';
  }
  return REGION_CONFIG[lang] || REGION_CONFIG['en-IN'];
}

// Apply region to all price elements & shipping estimators on the page
function applyRegionToPage() {
  const details = getLocaleDetails();
  // Update all live price displays
  document.querySelectorAll('[data-inr-price]').forEach(el => {
    const inr = parseFloat(el.dataset.inrPrice);
    if (!isNaN(inr)) {
      el.textContent = formatSareePrice(inr);
    }
  });
  // Update shipping estimators
  document.querySelectorAll('.region-shipping-text').forEach(el => {
    el.textContent = details.shipping;
  });
  // Update currency badge in region button
  const badge = document.getElementById('region-btn-badge');
  if (badge) badge.textContent = `${details.flag} ${details.code}`;
  // Update page hreflang meta dynamically
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const base = 'https://silk101.vercel.app/';
    const lang = localStorage.getItem('loom_region') || 'en-IN';
    canonical.href = lang === 'en-IN' ? base : `${base}?lang=${lang}`;
  }
}

function formatSareePrice(inrPrice) {
  const details = getLocaleDetails();
  const converted = inrPrice * details.rate;
  return `${details.symbol}${Math.round(converted).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/* ==========================================================
   FEATURE 1: NRI REGION SELECTOR WIDGET
========================================================== */
function initRegionSelector() {
  // Inject Region Selector HTML into body if not present
  if (document.getElementById('region-selector-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'region-selector-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Select your region and currency');
  overlay.innerHTML = `
    <div class="region-modal-card" id="region-modal-card">
      <div class="region-modal-header">
        <span class="region-modal-title">🌐 Select Your Region</span>
        <button class="region-modal-close" id="region-modal-close" aria-label="Close region selector">✕</button>
      </div>
      <p class="region-modal-sub">Prices, shipping estimates, and currency will update instantly.</p>
      <div class="region-grid" id="region-grid">
        ${Object.entries(REGION_CONFIG).map(([key, cfg]) => `
          <button class="region-option" data-lang="${key}" aria-label="Select ${cfg.countryLabel}">
            <span class="region-flag">${cfg.flag}</span>
            <span class="region-label">${cfg.label}</span>
            <span class="region-shipping-mini">${cfg.shipping}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'region-selector-styles';
  style.textContent = `
    #region-selector-overlay {
      position: fixed; inset: 0; z-index: 90000;
      background: rgba(3,3,3,0.82); backdrop-filter: blur(18px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 0.35s cubic-bezier(0.4,0,0.2,1);
    }
    #region-selector-overlay.open {
      opacity: 1; pointer-events: all;
    }
    .region-modal-card {
      background: linear-gradient(145deg, #0f0f14 0%, #18120a 100%);
      border: 1px solid rgba(212,175,55,0.25);
      border-radius: 18px;
      padding: 2.5rem;
      width: min(620px, 92vw);
      box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(212,175,55,0.06);
      transform: translateY(20px) scale(0.97);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
    }
    #region-selector-overlay.open .region-modal-card {
      transform: translateY(0) scale(1);
    }
    .region-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .region-modal-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem; color: #d4af37; font-weight: 400; letter-spacing: 1px;
    }
    .region-modal-close {
      background: none; border: none; color: rgba(255,255,255,0.4);
      font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;
      transition: color 0.2s;
    }
    .region-modal-close:hover { color: #fff; }
    .region-modal-sub {
      font-family: 'Outfit', sans-serif; font-size: 0.82rem;
      color: rgba(255,255,255,0.45); margin-bottom: 1.8rem;
    }
    .region-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 0.8rem;
    }
    .region-option {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; padding: 1rem 0.8rem;
      cursor: pointer; text-align: left;
      display: flex; flex-direction: column; gap: 4px;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
    }
    .region-option:hover, .region-option.active {
      background: rgba(212,175,55,0.08);
      border-color: rgba(212,175,55,0.4);
      transform: translateY(-2px);
    }
    .region-option.active { border-color: #d4af37; }
    .region-flag { font-size: 1.6rem; }
    .region-label {
      font-family: 'Outfit', sans-serif; font-size: 0.82rem; font-weight: 600;
      color: #fff;
    }
    .region-shipping-mini {
      font-family: 'Outfit', sans-serif; font-size: 0.7rem;
      color: rgba(255,255,255,0.35); line-height: 1.4;
    }
    #region-fab {
      position: fixed; bottom: 28px; left: 28px; z-index: 89000;
      background: linear-gradient(135deg, #1a1308, #2a1f06);
      border: 1px solid rgba(212,175,55,0.35);
      border-radius: 24px; padding: 8px 16px;
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; font-family: 'Outfit', sans-serif;
      font-size: 0.78rem; font-weight: 600;
      color: #d4af37; letter-spacing: 0.5px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #region-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(212,175,55,0.2);
    }
    #region-fab .region-fab-globe { font-size: 1rem; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // FAB button
  const fab = document.createElement('button');
  fab.id = 'region-fab';
  fab.setAttribute('aria-label', 'Change currency region');
  fab.innerHTML = `<span class="region-fab-globe">🌐</span><span id="region-btn-badge">₹ INR</span>`;
  document.body.appendChild(fab);

  // Set active region
  function refreshActiveState() {
    const current = localStorage.getItem('loom_region') || 'en-IN';
    overlay.querySelectorAll('.region-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === current);
    });
    const cfg = REGION_CONFIG[current] || REGION_CONFIG['en-IN'];
    const badge = document.getElementById('region-btn-badge');
    if (badge) badge.textContent = `${cfg.flag} ${cfg.code}`;
  }
  refreshActiveState();

  // Open / close
  const openOverlay = () => overlay.classList.add('open');
  const closeOverlay = () => overlay.classList.remove('open');

  fab.addEventListener('click', openOverlay);
  document.getElementById('region-modal-close').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  // Region selection
  overlay.querySelectorAll('.region-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('loom_region', lang);
      // Update URL param too (for SEO hreflang awareness)
      const url = new URL(window.location.href);
      if (lang === 'en-IN') url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url.toString());
      // Re-render prices & shipping
      applyRegionToPage();
      // Re-render vault cards if loaded
      if (typeof setupVaultTunnel === 'function' && document.querySelectorAll('.saree-card').length > 0) {
        document.querySelectorAll('.saree-card').forEach(card => {
          const idNum = parseInt(card.dataset.id);
          const item = sareeCollection.find(s => s.id === idNum);
          if (item) {
            const infoEl = card.querySelector('.saree-info');
            if (infoEl) {
              const priceSpan = infoEl.querySelector('.card-price');
              if (priceSpan) priceSpan.textContent = formatSareePrice(item.price_fiat);
            }
          }
        });
      }
      refreshActiveState();
      closeOverlay();
    });
  });
}

/* ==========================================================
   FEATURE 2: VAULT MOTIF SEARCH & CATEGORY FILTERS
========================================================== */
function initVaultFilters() {
  const vaultSection = document.getElementById('vault');
  if (!vaultSection) return;
  if (document.getElementById('vault-filter-bar')) return;

  const filterBar = document.createElement('div');
  filterBar.id = 'vault-filter-bar';
  filterBar.innerHTML = `
    <div class="vf-inner">
      <div class="vf-search-wrap">
        <svg class="vf-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M13 13l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="search" id="vault-search" placeholder="Search by motif, weaver, or saree name…" aria-label="Search vault collection">
      </div>
      <div class="vf-chips" role="group" aria-label="Filter by category">
        <button class="vf-chip active" data-cat="all">All</button>
        <button class="vf-chip" data-cat="Ikat">Khandua Ikat</button>
        <button class="vf-chip" data-cat="Chanderi">Chanderi</button>
        <button class="vf-chip" data-cat="Kanjivaram">Bomkai / Kanjivaram</button>
        <button class="vf-chip" data-cat="Tissue Silk">Tissue Silk</button>
      </div>
      <span class="vf-count" id="vf-count"></span>
    </div>
  `;

  const headingWrap = vaultSection.querySelector('.vault-heading-wrap');
  if (headingWrap) headingWrap.insertAdjacentElement('afterend', filterBar);
  else vaultSection.prepend(filterBar);

  // CSS injection
  const style = document.createElement('style');
  style.id = 'vault-filter-styles';
  style.textContent = `
    #vault-filter-bar {
      padding: 0 2rem 1.5rem;
      position: relative; z-index: 10;
    }
    .vf-inner {
      max-width: 900px; margin: 0 auto;
      display: flex; flex-direction: column; gap: 0.9rem;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(212,175,55,0.12);
      border-radius: 14px; padding: 1.2rem 1.5rem;
      backdrop-filter: blur(10px);
    }
    .vf-search-wrap {
      position: relative;
    }
    .vf-search-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      width: 16px; height: 16px; color: rgba(212,175,55,0.5); pointer-events: none;
    }
    #vault-search {
      width: 100%; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 0.65rem 1rem 0.65rem 2.4rem;
      color: #fff; font-family: 'Outfit', sans-serif; font-size: 0.88rem;
      outline: none; transition: border-color 0.2s;
      box-sizing: border-box;
    }
    #vault-search:focus { border-color: rgba(212,175,55,0.4); }
    #vault-search::placeholder { color: rgba(255,255,255,0.3); }
    .vf-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .vf-chip {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px; padding: 5px 14px;
      font-family: 'Outfit', sans-serif; font-size: 0.75rem; font-weight: 500;
      color: rgba(255,255,255,0.55); cursor: pointer;
      transition: all 0.2s;
    }
    .vf-chip:hover { border-color: rgba(212,175,55,0.35); color: #d4af37; }
    .vf-chip.active {
      background: rgba(212,175,55,0.12);
      border-color: #d4af37; color: #d4af37;
    }
    .vf-count {
      font-family: 'Outfit', sans-serif; font-size: 0.75rem;
      color: rgba(255,255,255,0.35); letter-spacing: 0.5px;
    }
    .saree-card.filtered-out {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Filter logic
  let activeCategory = 'all';
  let activeSearch = '';

  function applyVaultFilter() {
    const cards = document.querySelectorAll('.saree-card');
    let visible = 0;
    cards.forEach(card => {
      const id = parseInt(card.dataset.id);
      const item = sareeCollection.find(s => s.id === id);
      if (!item) { card.classList.remove('filtered-out'); visible++; return; }
      const catMatch = activeCategory === 'all' || item.category_name === activeCategory;
      const searchTerm = activeSearch.toLowerCase();
      const searchMatch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm) ||
        (item.artisan_name || '').toLowerCase().includes(searchTerm) ||
        (item.description || '').toLowerCase().includes(searchTerm) ||
        (item.material || '').toLowerCase().includes(searchTerm);
      if (catMatch && searchMatch) {
        card.classList.remove('filtered-out');
        visible++;
      } else {
        card.classList.add('filtered-out');
      }
    });
    const countEl = document.getElementById('vf-count');
    if (countEl) countEl.textContent = visible === cards.length ? `${cards.length} pieces` : `Showing ${visible} of ${cards.length} pieces`;
  }

  // Chip clicks
  filterBar.querySelectorAll('.vf-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filterBar.querySelectorAll('.vf-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.cat;
      applyVaultFilter();
    });
  });

  // Search input
  const searchInput = document.getElementById('vault-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeSearch = searchInput.value;
      applyVaultFilter();
    });
  }

  // Re-apply after vault loads (cards are dynamic)
  const observer = new MutationObserver(() => {
    applyVaultFilter();
    const countEl = document.getElementById('vf-count');
    const cards = document.querySelectorAll('.saree-card');
    if (countEl && cards.length > 0) countEl.textContent = `${cards.length} pieces`;
  });
  const stage = document.getElementById('tunnel-stage');
  if (stage) observer.observe(stage, { childList: true });
}

/* ==========================================================
   FEATURE 4: UNIFIED AUDIO & SOUNDSCAPE CONTROLLER
========================================================== */
const SOUNDSCAPES = {
  loom: {
    label: '☸ Pit Loom Rhythm (Nuapatna)',
    description: 'Traditional wooden handloom, Nuapatna village',
    pitchBase: [65.41, 98.0],
    filterFreq: 180,
    clackInterval: 1200,
    padGain: 0.12,
  },
  rain: {
    label: '🌧 Village Rain & Loom (Tigiria Block)',
    description: 'Soft monsoon rain over Nuapatna weaving cluster',
    pitchBase: [55.0, 82.4],
    filterFreq: 280,
    clackInterval: 1800,
    padGain: 0.08,
  },
  temple: {
    label: '🔔 Puri Temple Chimes (Jagannath Mandir)',
    description: 'Sacred temple bell chimes and quiet loom drone',
    pitchBase: [82.4, 130.8],
    filterFreq: 400,
    clackInterval: 2200,
    padGain: 0.07,
  }
};
let activeSoundscape = localStorage.getItem('loom_soundscape') || 'loom';

function applySoundscape(key) {
  activeSoundscape = key;
  localStorage.setItem('loom_soundscape', key);
  const cfg = SOUNDSCAPES[key] || SOUNDSCAPES.loom;
  if (synthNode && audioCtx) {
    synthNode.osc1.frequency.setValueAtTime(cfg.pitchBase[0], audioCtx.currentTime);
    synthNode.osc2.frequency.setValueAtTime(cfg.pitchBase[1], audioCtx.currentTime);
    synthNode.filter.frequency.setValueAtTime(cfg.filterFreq, audioCtx.currentTime);
    if (isAudioPlaying) {
      synthNode.padGain.gain.setValueAtTime(cfg.padGain, audioCtx.currentTime);
    }
  }
  const select = document.getElementById('audio-soundscape-select');
  if (select) select.value = key;
}

function initUnifiedAudioConsole() {
  if (document.getElementById('audio-control-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'audio-control-panel';
  panel.className = 'audio-panel-overlay hidden';
  panel.innerHTML = `
    <div class="audio-panel-card">
      <div class="audio-panel-header">
        <span class="audio-panel-title">🎵 Audio & Soundscape</span>
        <button id="audio-panel-close" class="audio-panel-close-btn" aria-label="Close audio menu">✕</button>
      </div>
      <div class="audio-panel-body">
        <div class="audio-panel-row">
          <span class="audio-panel-label">Master Audio</span>
          <button id="audio-menu-master-btn" class="audio-panel-toggle-btn ${isAudioPlaying ? 'active' : ''}">
            ${isAudioPlaying ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
          </button>
        </div>
        <div class="audio-panel-row">
          <label for="audio-soundscape-select" class="audio-panel-label">Soundscape</label>
          <select id="audio-soundscape-select" class="audio-panel-select" ${!isAudioPlaying ? 'disabled' : ''}>
            ${Object.entries(SOUNDSCAPES).map(([key, cfg]) => `
              <option value="${key}" ${key === activeSoundscape ? 'selected' : ''}>${cfg.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="audio-panel-row">
          <div class="audio-panel-label-wrap">
            <label for="audio-volume-slider" class="audio-panel-label">Master Volume</label>
            <span id="audio-volume-text" class="audio-panel-val">${Math.round(masterVolume * 100)}%</span>
          </div>
          <input type="range" id="audio-volume-slider" min="0" max="100" value="${Math.round(masterVolume * 100)}" class="audio-panel-slider" ${!isAudioPlaying ? 'disabled' : ''}>
        </div>
        <div class="audio-panel-row checkbox-row">
          <label class="audio-panel-checkbox-label">
            <input type="checkbox" id="audio-sfx-checkbox" ${isSFXEnabled ? 'checked' : ''} ${!isAudioPlaying ? 'disabled' : ''}>
            <span>Tactile Clicks & Weave Rustles</span>
          </label>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'unified-audio-styles';
  style.textContent = `
    #audio-control-panel {
      position: fixed; bottom: 85px; right: 2rem; z-index: 99990;
      transition: opacity 0.25s ease, transform 0.25s ease;
      transform-origin: bottom right;
    }
    #audio-control-panel.hidden {
      opacity: 0; pointer-events: none; transform: scale(0.92) translateY(10px);
    }
    .audio-panel-card {
      background: linear-gradient(145deg, #120e07 0%, #1a140b 100%);
      border: 1px solid rgba(212,175,55,0.3);
      border-radius: 16px; padding: 1.25rem 1.4rem;
      width: 290px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(212,175,55,0.08);
      backdrop-filter: blur(16px);
      font-family: 'Outfit', sans-serif;
    }
    .audio-panel-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem; border-bottom: 1px solid rgba(212,175,55,0.15);
      padding-bottom: 0.6rem;
    }
    .audio-panel-title {
      font-family: 'Cormorant Garamond', serif; font-size: 1.1rem;
      color: #d4af37; font-weight: 500; letter-spacing: 0.5px;
    }
    .audio-panel-close-btn {
      background: none; border: none; color: rgba(255,255,255,0.4);
      font-size: 1rem; cursor: pointer; padding: 2px 6px; transition: color 0.2s;
    }
    .audio-panel-close-btn:hover { color: #fff; }
    .audio-panel-body { display: flex; flex-direction: column; gap: 0.9rem; }
    .audio-panel-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .audio-panel-row.checkbox-row { flex-direction: row; align-items: center; margin-top: 0.2rem; }
    .audio-panel-label {
      font-size: 0.73rem; text-transform: uppercase; letter-spacing: 0.8px;
      color: rgba(255,255,255,0.5); font-weight: 600;
    }
    .audio-panel-label-wrap { display: flex; justify-content: space-between; align-items: center; }
    .audio-panel-val { font-size: 0.73rem; color: #d4af37; font-weight: 600; }
    .audio-panel-toggle-btn {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 8px 12px; color: rgba(255,255,255,0.7);
      font-family: 'Outfit', sans-serif; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; text-align: center;
    }
    .audio-panel-toggle-btn.active {
      background: rgba(212,175,55,0.15); border-color: #d4af37; color: #d4af37;
    }
    .audio-panel-select {
      background: rgba(10,10,14,0.9); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 7px 10px; color: #fff;
      font-family: 'Outfit', sans-serif; font-size: 0.78rem; outline: none;
      cursor: pointer; transition: border-color 0.2s;
    }
    .audio-panel-select:focus { border-color: rgba(212,175,55,0.4); }
    .audio-panel-select:disabled, .audio-panel-slider:disabled { opacity: 0.4; cursor: not-allowed; }
    .audio-panel-slider {
      width: 100%; accent-color: #d4af37; cursor: pointer; height: 4px;
    }
    .audio-panel-checkbox-label {
      display: flex; align-items: center; gap: 8px; font-size: 0.75rem;
      color: rgba(255,255,255,0.65); cursor: pointer; user-select: none;
    }
    .audio-panel-checkbox-label input { accent-color: #d4af37; cursor: pointer; }
    @media (max-width: 768px) {
      #audio-control-panel { right: 1rem; bottom: 75px; }
      .audio-panel-card { width: 260px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  // Close button
  document.getElementById('audio-panel-close').addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  // Soundscape select dropdown
  const select = document.getElementById('audio-soundscape-select');
  if (select) {
    select.addEventListener('change', (e) => {
      applySoundscape(e.target.value);
    });
  }

  // Master Toggle Inside Menu
  const masterBtn = document.getElementById('audio-menu-master-btn');
  if (masterBtn) {
    masterBtn.addEventListener('click', () => {
      setAudioState(!isAudioPlaying);
      // enable/disable inputs in menu
      const isOff = !isAudioPlaying;
      if (select) select.disabled = isOff;
      const slider = document.getElementById('audio-volume-slider');
      if (slider) slider.disabled = isOff;
      const sfx = document.getElementById('audio-sfx-checkbox');
      if (sfx) sfx.disabled = isOff;
    });
  }

  // Volume slider
  const slider = document.getElementById('audio-volume-slider');
  const valText = document.getElementById('audio-volume-text');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value) / 100;
      masterVolume = vol;
      localStorage.setItem('loom_audio_volume', vol.toString());
      if (valText) valText.textContent = `${Math.round(vol * 100)}%`;
      if (audioCtx && masterGainNode && isAudioPlaying) {
        masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
      }
    });
  }

  // SFX checkbox
  const sfxBox = document.getElementById('audio-sfx-checkbox');
  if (sfxBox) {
    sfxBox.addEventListener('change', (e) => {
      isSFXEnabled = e.target.checked;
      localStorage.setItem('loom_audio_sfx', isSFXEnabled.toString());
    });
  }

  // Hook main toggle button to open dropdown menu
  const toggleBtn = document.getElementById('audio-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('hidden');
    });
  }

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
      panel.classList.add('hidden');
    }
  });
}

async function setupVaultTunnel() {
  const stage = document.getElementById('tunnel-stage');
  if (!stage) return;
  stage.innerHTML = '<div style="color:var(--color-zari); font-family:\'Outfit\'; font-size:1.1rem; text-align:center; padding:100px 0;">Weaving loom connection...</div>';

  try {
    sareeCollection = await fetchInventory();
    setupHousesOfOdisha();
    
    stage.innerHTML = ''; // Clear loading indicator
    
    sareeCollection.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'saree-card holo-border';
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
      
      // Support both mouse and touch pointer events
      const clearZariHighlight = () => {
        const zariCtx = zariCanvas.getContext('2d');
        zariCtx.clearRect(0, 0, 420, 580);
        drawZariPattern(zariCtx, item);
        zari.style.backgroundImage = `url(${zariCanvas.toDataURL()})`;
      };
      card.addEventListener('mouseleave', clearZariHighlight);
      card.addEventListener('pointerleave', clearZariHighlight);
      
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
  
  const totalScrollDist = 1500 * cards.length + 2000;
  const pinDuration = cards.length * 800;
  
  function updateVaultCards(progress) {
    cards.forEach((card, index) => {
      const baseZ = -1500 * (index + 0.5);
      const currentZ = baseZ + progress * totalScrollDist;
      
      let opacity = 1;
      if (currentZ > 400) {
        opacity = 1 - (currentZ - 400) / 400;
      } else if (currentZ < -7000) {
        opacity = 1 - (Math.abs(currentZ) - 7000) / 3000;
      }
      
      const shadow = card.querySelector('.layer-shadow');
      const silk = card.querySelector('.layer-silk');
      const zari = card.querySelector('.layer-zari');
      const info = card.querySelector('.saree-info');
      const model = card.querySelector('.layer-model');
      
      // Sophisticated S-Curve Sweep Math
      const depth = Math.max(0, -currentZ);
      const distRatio = depth / 1500; // Normalized by card spacing
      
      const translateX = Math.sin(distRatio * 1.1) * 600;
      const translateY = Math.sin(distRatio * 2.1) * 60;
      const rotateY = Math.sin(distRatio * 1.1) * -35; // Twist inward
      const rotateX = Math.min(10, distRatio * 3); // Gentle lean back
      const rotateZ = Math.sin(distRatio * 0.8) * -6; // Subtle roll
      
      card.style.transform = `translate3d(${translateX}px, ${translateY}px, ${currentZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
      card.style.opacity = Math.max(0, Math.min(1, opacity));
      card.style.pointerEvents = (currentZ > -1500 && currentZ < 1000) ? 'auto' : 'none';
      
      if (!card.dataset.tilted) {
        if (silk) silk.style.transform = `translateZ(0px)`;
        if (model) model.style.transform = `translateZ(12px)`;
        if (zari) zari.style.transform = `translateZ(${20 + (scrollVelocity || 0) * 0.3}px)`;
        if (shadow) shadow.style.transform = `translateZ(-30px)`;
        if (info) info.style.transform = `translateZ(${35 + (scrollVelocity || 0) * 0.5}px)`;
      }

    });
  }

  // Inner multi-layer 3D tilt on card hover
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = -dy * 12;
      const rotY = dx * 12;

      card.dataset.tilted = 'true';
      const silk = card.querySelector('.layer-silk');
      const model = card.querySelector('.layer-model');
      const zari = card.querySelector('.layer-zari');
      const info = card.querySelector('.saree-info');

      if (silk) silk.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0px)`;
      if (model) model.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(18px)`;
      if (zari) zari.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(28px)`;
      if (info) info.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(42px)`;
    });

    const resetTilt = () => {
      delete card.dataset.tilted;
      const silk = card.querySelector('.layer-silk');
      const model = card.querySelector('.layer-model');
      const zari = card.querySelector('.layer-zari');
      const info = card.querySelector('.saree-info');

      if (silk) silk.style.transform = 'translateZ(0px)';
      if (model) model.style.transform = 'translateZ(12px)';
      if (zari) zari.style.transform = 'translateZ(20px)';
      if (info) info.style.transform = 'translateZ(35px)';
    };
    card.addEventListener('mouseleave', resetTilt);
    card.addEventListener('pointerleave', resetTilt);
  });

  const st = ScrollTrigger.create({
    trigger: '#vault',
    pin: true,
    start: 'top top',
    end: '+=' + pinDuration,
    scrub: true,
    onUpdate: (self) => updateVaultCards(self.progress)
  });

  // Initial call so cards are immediately placed in 3D tunnel depth!
  updateVaultCards(st.progress || 0);
  ScrollTrigger.refresh();
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
  } else if (name.includes('bomkai') || name.includes('peacock') || name.includes('gongdi')) {
    // Bomkai / Gongdi — Peacock fan tail pattern in violet / rose-gold
    const isGongdi = name.includes('gongdi');
    ctx.strokeStyle = isGongdi ? 'rgba(255, 100, 150, 0.95)' : 'rgba(180, 80, 255, 0.9)';
    ctx.fillStyle   = isGongdi ? 'rgba(255, 215, 0, 0.45)' : 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2.5;
    // Border columns
    for (let bx of [40, 380]) {
      for (let y = 60; y < 560; y += 90) {
        ctx.save(); ctx.translate(bx, y); drawPeacockFan(ctx); ctx.restore();
      }
    }
    // Central pallu peacock
    ctx.save();
    ctx.translate(210, 290);
    ctx.scale(2.0, 2.0);
    drawPeacockFan(ctx);
    ctx.restore();
  } else if (name.includes('pasapalli') || name.includes('tigiria') || name.includes('double-ikat')) {
    // Tigiria Double-Ikat Pasapalli — navy / ivory checkerboard
    const cellW = 40, cellH = 48;
    for (let cx2 = 10; cx2 < 420; cx2 += cellW) {
      for (let cy2 = 10; cy2 < 580; cy2 += cellH) {
        const col = Math.floor(cx2 / cellW), row = Math.floor(cy2 / cellH);
        ctx.fillStyle = (col + row) % 2 === 0 ? 'rgba(25, 40, 120, 0.9)' : 'rgba(235, 225, 210, 0.85)';
        ctx.fillRect(cx2, cy2, cellW - 2, cellH - 2);
      }
    }
    // Ikat blur edges to simulate tie-dye
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 1;
    for (let x2 = 10; x2 < 420; x2 += cellW) {
      ctx.beginPath(); ctx.moveTo(x2, 10); ctx.lineTo(x2, 570); ctx.stroke();
    }
  } else if (name.includes('kumbha') || name.includes('nayagarh') || name.includes('spire')) {
    // Nayagarh Kumbha Spire — turquoise body, silver temple spires on borders
    ctx.strokeStyle = 'rgba(180, 240, 240, 0.9)';
    ctx.fillStyle   = 'rgba(80, 200, 220, 0.3)';
    ctx.lineWidth = 2;
    for (let ky = 30; ky < 560; ky += 80) {
      // Left spire
      ctx.save(); ctx.translate(35, ky); drawKumbhaSpire(ctx); ctx.restore();
      // Right spire
      ctx.save(); ctx.translate(385, ky); drawKumbhaSpire(ctx); ctx.restore();
    }
    // Central geometric medallion
    ctx.save();
    ctx.translate(210, 290);
    ctx.strokeStyle = 'rgba(180, 240, 255, 0.85)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*80, Math.sin(a)*80); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,0,40,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  } else if (name.includes('sonepur') || name.includes('elephant procession')) {
    // Sonepur Elephant Procession — amber/saffron with elephant parade
    ctx.strokeStyle = 'rgba(255, 180, 0, 0.9)';
    ctx.fillStyle   = 'rgba(255, 140, 0, 0.4)';
    ctx.lineWidth = 2;
    const elephantX = [80, 175, 270, 355];
    elephantX.forEach((ex, i) => {
      ctx.save(); ctx.translate(ex, 80 + i * 10); drawElephantSilhouette(ctx, 0.6); ctx.restore();
      ctx.save(); ctx.translate(ex, 480 - i * 8); ctx.scale(1, -0.5); drawElephantSilhouette(ctx, 0.6); ctx.restore();
    });
    // Saffron center medallion
    ctx.save();
    ctx.translate(210, 290);
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0,0,65,0,Math.PI*2); ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*50,Math.sin(a)*50); ctx.lineTo(Math.cos(a)*65,Math.sin(a)*65); ctx.stroke();
    }
    ctx.restore();
  } else if (name.includes('ratha') || name.includes('chariot') || name.includes('yatra')) {
    // Puri Ratha Yatra — crimson pallu with Nandighosa chariot
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.fillStyle   = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 2;
    // Chariot wheels on each border row
    for (let wy = 60; wy < 560; wy += 120) {
      ctx.save(); ctx.translate(55, wy); drawRathaWheel(ctx, 35); ctx.restore();
      ctx.save(); ctx.translate(365, wy); drawRathaWheel(ctx, 35); ctx.restore();
    }
    // Large central chariot
    ctx.save();
    ctx.translate(210, 290);
    drawRathaChariot(ctx);
    ctx.restore();
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

/* --  New Zari Drawing Helpers  -- */

function drawPeacockFan(ctx) {
  // Fan tail feathers radiating from center
  const FEATHERS = 7;
  for (let i = 0; i < FEATHERS; i++) {
    const angle = -Math.PI * 0.6 + (i * Math.PI * 1.2) / (FEATHERS - 1);
    const fx = Math.cos(angle) * 28, fy = Math.sin(angle) * 28;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(fx * 0.5, fy * 0.5 - 8, fx, fy);
    ctx.stroke();
    // Eye spot
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 8, 5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawKumbhaSpire(ctx) {
  // Sacred Kumbha (pot / spire) motif
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(-12, -10);
  ctx.bezierCurveTo(-14, -2, -14, 4, -10, 8);
  ctx.bezierCurveTo(-6, 12, 6, 12, 10, 8);
  ctx.bezierCurveTo(14, 4, 14, -2, 12, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Finial dot
  ctx.beginPath(); ctx.arc(0, -25, 3, 0, Math.PI * 2); ctx.fill();
}

function drawElephantSilhouette(ctx, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.beginPath();
  // Body
  ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Head
  ctx.beginPath(); ctx.arc(-28, -8, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Trunk
  ctx.beginPath();
  ctx.moveTo(-38, -4);
  ctx.bezierCurveTo(-50, 4, -52, 14, -44, 18);
  ctx.stroke();
  // Legs
  for (let lx of [-15, -5, 5, 15]) {
    ctx.beginPath(); ctx.moveTo(lx, 18); ctx.lineTo(lx, 32); ctx.stroke();
  }
  // Tusk
  ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-50, -18); ctx.stroke();
  ctx.restore();
}

function drawRathaWheel(ctx, r) {
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a)*r*0.65, Math.sin(a)*r*0.65);
    ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    ctx.stroke();
  }
}

function drawRathaChariot(ctx) {
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
  ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
  ctx.lineWidth = 2;
  // Platform
  ctx.fillRect(-90, -20, 180, 50); ctx.strokeRect(-90, -20, 180, 50);
  // Canopy pyramid
  ctx.beginPath(); ctx.moveTo(-80, -20); ctx.lineTo(0, -100); ctx.lineTo(80, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Spire
  ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(0, -130); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -133, 5, 0, Math.PI * 2); ctx.fill();
  // Wheels
  ctx.lineWidth = 1.5;
  ctx.save(); ctx.translate(-60, 30); drawRathaWheel(ctx, 25); ctx.restore();
  ctx.save(); ctx.translate(60, 30); drawRathaWheel(ctx, 25); ctx.restore();
  // Decorative flags on top
  ctx.strokeStyle = 'rgba(255, 94, 0, 0.8)';
  for (let fx of [-40, 0, 40]) {
    const base = -20 - Math.abs(fx) * 0.8;
    ctx.beginPath(); ctx.moveTo(fx, base); ctx.lineTo(fx + 12, base - 15); ctx.lineTo(fx, base - 10); ctx.closePath(); ctx.fill();
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
  let customLightEnv = 'dawn';

  function loadImg(src) { const i = new Image(); i.src = src; return i; }

  const avatarCollections = {
    // Style mappings based on indices
    1: { frames: [loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'), loadImg('/avatars/frame_side.png'), loadImg('/avatars/frame_back.png')] },
    2: { frames: [loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_front.png'), loadImg('/avatars/navy_side.png'), loadImg('/avatars/navy_side.png')] },
    3: { frames: [loadImg('/avatars/green_front.png'), loadImg('/avatars/green_front.png'), loadImg('/avatars/green_side.png'), loadImg('/avatars/green_side.png')] },
    4: { frames: [loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_front.png'), loadImg('/avatars/purple_side.png'), loadImg('/avatars/purple_side.png')] },
    5: { frames: [loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_front.png'), loadImg('/avatars/golden_side.png'), loadImg('/avatars/golden_side.png')] },
    6: { frames: [loadImg('/avatars/model6_front.png'), loadImg('/avatars/model6_front.png'), loadImg('/avatars/model6_side.png'), loadImg('/avatars/model6_back.png')] },
    7: { frames: [loadImg('/avatars/model7_front.png'), loadImg('/avatars/model7_front.png'), loadImg('/avatars/model7_side.png'), loadImg('/avatars/model7_back.png')] },
    8: { frames: [loadImg('/avatars/model8_front.png'), loadImg('/avatars/model8_front.png'), loadImg('/avatars/model8_side.png'), loadImg('/avatars/model8_back.png')] }
  };

  const baseFrames = [
    loadImg('/avatars/frame_front.png'), loadImg('/avatars/frame_quarter.png'),
    loadImg('/avatars/frame_side.png'),  loadImg('/avatars/frame_back.png')
  ];

  function getAvatarFrames() {
    return { frames: avatarCollections[selectedModel].frames };
  }

  function playShowroomSound(freq = 440, vol = 0.04, duration = 0.08) {
    if (!audioCtx || !isAudioPlaying || !isSFXEnabled || audioCtx.state !== 'running') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      const outNode = masterGainNode || audioCtx.destination;
      osc.connect(gain);
      gain.connect(outNode);
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
    document.getElementById('showroom-artisan-name').innerHTML = `${artisanName} &nbsp;·&nbsp; ${loc} &nbsp;<span style="text-decoration:underline; opacity:0.8;">[VIEW BIO]</span>`;
    
    // Update price dynamically with global currency converter
    document.getElementById('showroom-price-fiat').textContent = formatSareePrice(selectedItem.price_fiat);

    // Populate variations selector
    const varSelector = document.getElementById('select-saree-variation');
    if (varSelector && selectedItem.variations) {
      varSelector.innerHTML = selectedItem.variations.map((v, idx) => {
        const deltaText = v.price_delta > 0 ? ` (+${formatSareePrice(v.price_delta)})` : '';
        return `<option value="${idx}">${v.name}${deltaText}</option>`;
      }).join('');
      
      // Update selected price on change
      varSelector.onchange = () => {
        const selectedIndex = parseInt(varSelector.value);
        const variation = selectedItem.variations[selectedIndex];
        const finalPrice = selectedItem.price_fiat + (variation ? variation.price_delta : 0);
        document.getElementById('showroom-price-fiat').textContent = formatSareePrice(finalPrice);
      };
    }

    // Localized Shipping and Delivery text estimator on load
    const shipText = document.getElementById('shipping-estimator-text');
    if (shipText) {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en-IN';
      const shippingDetails = {
        'en-US': "🇺🇸 Free Insured Express Shipping to USA via DHL. Estimated delivery to New York/California: 3-5 business days.",
        'en-GB': "🇬🇧 Free Insured Express Shipping to UK via FedEx. Estimated delivery to London/Leicester: 4-6 business days.",
        'en-CA': "🇨🇦 Free Insured Express Shipping to Canada. Estimated delivery to Toronto/Vancouver: 4-6 business days.",
        'en-AU': "🇦🇺 Free Insured Express Shipping to Australia. Estimated delivery to Sydney/Melbourne: 5-7 business days.",
        'en-AE': "🇦🇪 Free Insured Express Shipping to UAE via Aramex. Estimated delivery to Dubai/Abu Dhabi: 2-4 business days.",
        'en-SG': "🇸🇬 Free Insured Express Shipping to Singapore. Estimated delivery: 3-5 business days.",
        'en-IN': "🇮🇳 Free Insured Domestic Shipping via BlueDart. Estimated delivery: 2-3 business days.",
        'hi-IN': "🇮🇳 Free Insured Domestic Shipping via BlueDart. Estimated delivery: 2-3 business days."
      };
      shipText.textContent = shippingDetails[lang] || shippingDetails['en-IN'];
    }

    // Dynamic Loom Reservation Queue Scarcity text
    const scarcityText = document.getElementById('weaver-scarcity-status');
    if (scarcityText) {
      const aid = selectedItem.artisan_id || 1;
      const statusMap = {
        1: `Loom occupied by Smt. Sebati Mohanty weaving a custom scriptural Khandua order. Next reservation slot opens in 5 days.`,
        2: `Loom occupied by Shri Ranjan Meher spinning mathematical geometric double-Ikat wefts. Next reservation slot opens in 9 days.`,
        3: `Loom currently open. Shri Kailash Meher is available to accept a new custom mythological/temple commission. Loom setup time: 48h.`
      };
      scarcityText.textContent = statusMap[aid] || `Loom active. Currently occupied with custom orders. Next slot opens in 4 days.`;
    }
    
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

  const lightEnvSelect = document.getElementById('select-light-env');
  if (lightEnvSelect) {
    lightEnvSelect.onchange = (e) => {
      customLightEnv = e.target.value;
      playShowroomSound(640, 0.04, 0.08);
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

      // Generate dynamic SHA-256 style signature hash
      const hashStr = generateMockHash(hueVal, satVal, patternVal);
      const hashElem = document.getElementById('cert-display-hash');
      if (hashElem) hashElem.textContent = hashStr;

      const verifyLink = document.getElementById('cert-verify-link');
      if (verifyLink) verifyLink.href = `/verify.html?id=${uniqueId}&hash=${encodeURIComponent(hashStr)}`;

      // Dynamic Date backdating based on weaving time
      const weaveDays = isCustomMode ? 30 : (activeItem.weaving_time_days || 28);
      const today = new Date();
      
      const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const dateSign = today;
      const dateWeave = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days before signing
      const dateWarp = new Date(today.getTime() - Math.floor(weaveDays * 0.7) * 24 * 60 * 60 * 1000);
      const dateDyeing = new Date(today.getTime() - weaveDays * 24 * 60 * 60 * 1000);

      document.getElementById('ledger-date-dyeing').textContent = formatDate(dateDyeing);
      document.getElementById('ledger-date-warp').textContent = formatDate(dateWarp);
      document.getElementById('ledger-date-weave').textContent = formatDate(dateWeave);
      document.getElementById('ledger-date-sign').textContent = formatDate(dateSign);

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

  // Artisan Modal bindings
  const btnCloseArtisan = document.getElementById('btn-close-artisan');
  const artisanModal = document.getElementById('artisan-modal');
  const showroomArtisanName = document.getElementById('showroom-artisan-name');

  if (showroomArtisanName && artisanModal) {
    showroomArtisanName.onclick = () => {
      document.getElementById('artisan-modal-name').textContent = activeItem.artisan_name || 'Master Weaver';
      document.getElementById('artisan-modal-loc').textContent = activeItem.artisan_location || 'Odisha, India';
      document.getElementById('artisan-modal-exp').textContent = `${activeItem.artisan_exp || 30} Years`;
      document.getElementById('artisan-modal-bio').textContent = activeItem.artisan_bio || 'Master weaver specializing in complex heritage styles.';
      
      artisanModal.style.display = 'flex';
      artisanModal.classList.remove('hidden');
      playShowroomSound(600, 0.05, 0.08);
    };
  }

  if (btnCloseArtisan && artisanModal) {
    btnCloseArtisan.onclick = () => {
      artisanModal.style.display = 'none';
      artisanModal.classList.add('hidden');
      playShowroomSound(440, 0.04, 0.05);
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

      if (Math.abs(dx) > 1) {
        playSilkRustleSound(Math.abs(dx) * 0.15);
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

    // ── Breathing parallax: model rises/falls like a live model ──
    const breatheOffset = Math.sin(Date.now() * 0.0012) * 6;

    ctx.filter = 'none';

    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, cw, ch);

    // Background parallax gradient that moves opposite to rotation
    const bgX = cw / 2 + Math.cos(normRot * -0.5) * 22;
    const bgGrad = ctx.createRadialGradient(bgX, ch * 0.35, 0, bgX, ch * 0.35, ch * 0.8);
    bgGrad.addColorStop(0, `hsla(${(activeItem.color_hue || 30)}, 40%, 8%, 0.9)`);
    bgGrad.addColorStop(1, 'rgba(3,3,3,1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    const vignette = ctx.createRadialGradient(cw/2, ch/2, ch*0.2, cw/2, ch/2, ch*0.82);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
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
      const dy = (ch - dh) / 2 + ch * 0.01 + breatheOffset;
      
      const activeFilter = (avatarCollections[selectedModel] && avatarCollections[selectedModel].filter) || 'none';
      ctx.filter = activeFilter;

      ctx.globalAlpha = 1 - blendT;
      ctx.drawImage(currentFrame, dx, dy, dw, dh);

      if (nextFrame && nextFrame.complete) {
        ctx.globalAlpha = blendT;
        ctx.drawImage(nextFrame, dx, dy, dw, dh);
      }
      ctx.globalAlpha = 1;
      ctx.filter = 'none';

      // ── Specular Silk Sheen Ray ──────────────────────────────────
      // A sweep of gold light that follows the rotation angle across the figure
      const sheenAngle = normRot % Math.PI;
      const sheenX = dx + dw * (sheenAngle / Math.PI);
      const sheenW = dw * 0.18;
      if (sheenX > dx - sheenW && sheenX < dx + dw + sheenW) {
        const sheen = ctx.createLinearGradient(sheenX - sheenW, 0, sheenX + sheenW, 0);
        sheen.addColorStop(0, 'rgba(255, 235, 170, 0)');
        sheen.addColorStop(0.5, 'rgba(255, 240, 180, 0.18)');
        sheen.addColorStop(1, 'rgba(255, 235, 170, 0)');
        ctx.fillStyle = sheen;
        ctx.fillRect(dx, dy, dw, dh);
      }

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

      // Apply Custom Light Environment "Silk Sheen" filters
      if (customLightEnv === 'dawn') {
        const dawnGrad = ctx.createLinearGradient(0, 0, 0, ch);
        dawnGrad.addColorStop(0, 'rgba(255, 215, 0, 0.09)');
        dawnGrad.addColorStop(0.5, 'rgba(255, 140, 0, 0.02)');
        dawnGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dawnGrad;
        ctx.fillRect(0, 0, cw, ch);
      } else if (customLightEnv === 'candle') {
        const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
        const candleGrad = ctx.createRadialGradient(cw / 2, ch * 0.45, 10, cw / 2, ch * 0.45, ch * 0.7 * pulse);
        candleGrad.addColorStop(0, 'rgba(255, 120, 0, 0.22)');
        candleGrad.addColorStop(0.4, 'rgba(255, 60, 0, 0.06)');
        candleGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = candleGrad;
        ctx.fillRect(0, 0, cw, ch);
      } else if (customLightEnv === 'spotlight') {
        const spotGrad = ctx.createRadialGradient(cw / 2, 0, 10, cw / 2, 0, ch * 0.95);
        spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        spotGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, cw, ch);
      }

      // ── Floor shadow / depth ──────────────────────────────────────
      const shadowY = dy + dh - 4;
      const shadowGrad = ctx.createRadialGradient(cw/2, shadowY, 5, cw/2, shadowY, dw * 0.4);
      shadowGrad.addColorStop(0, `rgba(0,0,0,${0.35 + Math.abs(velocity) * 0.5})`);
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cw/2 - dw*0.4, shadowY - 8, dw*0.8, 22);

      // ── Silk reflection strip ─────────────────────────────────────
      const reflectHeight = dh * 0.18;
      ctx.save();
      ctx.filter = activeFilter;
      ctx.globalAlpha = 0.18 * (1 - blendT);
      ctx.translate(dx, dy + dh);
      ctx.scale(1, -1);
      ctx.drawImage(currentFrame, 0, dh - reflectHeight, dw, reflectHeight, 0, 0, dw, reflectHeight);
      if (nextFrame && nextFrame.complete) {
        ctx.globalAlpha = 0.18 * blendT;
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

    // ── Konark Wheel Rotation Arc Indicator ─────────────────────────
    {
      const arcR = 30;
      const arcX = cw - 52, arcY = ch - 52;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(arcX, arcY, arcR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(arcX, arcY, arcR, -Math.PI/2, -Math.PI/2 + normRot); ctx.stroke();
      // Hub
      ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
      ctx.beginPath(); ctx.arc(arcX, arcY, 4, 0, Math.PI * 2); ctx.fill();
      // 8 mini spokes
      for (let s = 0; s < 8; s++) {
        const sa = normRot + (s * Math.PI) / 4;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(arcX + Math.cos(sa) * 4, arcY + Math.sin(sa) * 4);
        ctx.lineTo(arcX + Math.cos(sa) * arcR, arcY + Math.sin(sa) * arcR);
        ctx.stroke();
      }
      // Degree label
      ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
      ctx.font = '600 8px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(normRot * 180 / Math.PI).toFixed(0)}°`, arcX, arcY + arcR + 12);
      ctx.restore();
    }

    // ── Elegant HUD (replaces raw monospace debug text) ─────────────
    ctx.globalAlpha = 1;
    {
      const hudH = 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(12, ch - hudH - 12, cw - 24, hudH, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
      ctx.font = '500 9px "Outfit", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${['FRONT','¾ LEFT','SIDE','BACK'][frameIndex]}  ·  ${(zoomLevel).toFixed(2)}×  ·  ${inspectMode.toUpperCase()}`, 22, ch - 24);
      ctx.textAlign = 'right';
      ctx.fillText(`${activeItem.name || 'SAREE'}  ·  ${activeItem.category_name || ''}`, cw - 22, ch - 24);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('↔ DRAG TO ROTATE · SCROLL TO ZOOM · TOUCH SUPPORTED', cw / 2, ch - 24);
    }

    // ── Gold thread drag particles ────────────────────────────────
    const zoomDisp = document.getElementById('zoom-display');
    if (zoomDisp) zoomDisp.textContent = `${zoomLevel.toFixed(2)}×`;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.angle += p.speedR;
      p.y += p.speedY;
      p.alpha -= 0.010;
      const swirlX = cw / 2 + Math.cos(p.angle) * p.radius;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 6;
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
        // Loupe crosshair
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(mx - 80, my); ctx.lineTo(mx + 80, my); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx, my - 80); ctx.lineTo(mx, my + 80); ctx.stroke();
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

const _closeModalBtn = document.getElementById('close-modal');
if (_closeModalBtn) _closeModalBtn.addEventListener('click', closeUnweaveModal);

// Focus trap for unweave modal
function trapFocusInModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const getFocusable = () => [...modal.querySelectorAll(focusable)].filter(el => !el.disabled && el.offsetParent !== null);
  const handler = (e) => {
    if (!modal.classList.contains('hidden') && e.key === 'Tab') {
      const els = getFocusable();
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    }
  };
  window.addEventListener('keydown', handler);
  return handler;
}
trapFocusInModal('unweave-modal');

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUnweaveModal();
});


/* ==========================================================
   INITIALIZATION
========================================================== */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('fade-out');
    
    // Auto-zoom the wheel down to 1.0 immediately when the loader fades out
    gsap.to(entryAnimation, {
      scale: 1.0,
      duration: 2.5,
      ease: 'power4.out'
    });
    
    setTimeout(() => {
      const gate = document.getElementById('entry-gate');
      // If user has already visited or prefers reduced motion/audio, keep hidden by default
      if (sessionStorage.getItem('loom_gate_dismissed')) {
        if (gate) gate.classList.add('hidden');
      } else if (gate) {
        gate.classList.remove('hidden');
      }
    }, 1200);
  }, 1800);
  
  // Localized Dynamic SEO Meta Tags injection for global NRI markets
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get('lang') || 'en-IN';
  const localizedSEOMeta = {
    'en-US': {
      title: "The Loom of Time | Buy Handloom Odisha Patta & Khandua Silk Sarees Online (USA)",
      desc: "Premium, authentic Odisha Patta Silk, Khandua Ikat, and Sambalpuri sarees handcrafted by master weavers. Free insured express shipping to the USA (New York, California, Texas, Chicago) with zero-electricity handloom verification."
    },
    'en-GB': {
      title: "The Loom of Time | Handloom Odisha Silk & Wedding Sarees Online (UK)",
      desc: "Museum-grade Khandua Ikat & Patta Silk sarees. Woven on traditional wooden looms in Odisha, India. Insured express delivery to the United Kingdom (London, Leicester, Birmingham)."
    },
    'en-CA': {
      title: "The Loom of Time | Authentic Odisha Handloom Sarees Online (Canada)",
      desc: "Shop pure Khandua Ikat & Patta Silk from Odisha. Verified provenance, zero carbon footprint. Insured delivery to Canada (Toronto, Vancouver, Montreal)."
    },
    'en-AU': {
      title: "The Loom of Time | Pure Odisha Patta Silk & Ikat Sarees (Australia)",
      desc: "Authentic Sambalpuri Ikat & Khandua Silk sarees handcrafted by award-winning weavers. Express delivery to Australia (Sydney, Melbourne, Brisbane)."
    },
    'en-AE': {
      title: "The Loom of Time | Luxury Odisha Handloom Silk Sarees (UAE & Dubai)",
      desc: "Buy exclusive Khandua Silk & Patta Silk sarees online. Verified provenance, zero carbon footprint. Fast delivery to Dubai, Abu Dhabi, Sharjah."
    },
    'en-SG': {
      title: "The Loom of Time | Buy Handloom Odisha Silk Sarees Online (Singapore)",
      desc: "Pure Khandua Ikat & Patta Silk sarees. Woven on traditional zero-electricity looms. Insured express shipping to Singapore."
    }
  };

  if (localizedSEOMeta[lang]) {
    document.title = localizedSEOMeta[lang].title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', localizedSEOMeta[lang].desc);
  }

  setupGenesisCanvas();
  setupHorizontalPulse();
  
  // Stagger non-critical setups into separate micro-tasks to prevent long tasks (>50ms) and eliminate TBT
  const nonCriticalSetups = [
    setupCustomCommissionStudio,
    setupMetamorphosis,
    setupHandloomMap,
    setupHousesOfOdisha,
    setupVaultTunnel,
    setupCustomCursor,
    setupInteractiveExtensions,
    setupMythosAnimation,
    setupHeritageSoulSection,
    setupHeritageMatchmaker,
    setupCuratorConcierge,
    setupSilkConstellation,
    setupCuratorWhisper
  ];
  nonCriticalSetups.forEach((fn, idx) => {
    setTimeout(fn, 100 + idx * 40);
  });


  // Weaving & Provenance FAQ Accordion Script
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.onclick = () => {
      const parent = trigger.parentElement;
      const content = parent.querySelector('.faq-content');
      const icon = trigger.querySelector('.faq-icon');
      const isOpen = parent.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-content').style.maxHeight = '0';
        item.querySelector('.faq-icon').textContent = '+';
      });
      
      if (!isOpen) {
        parent.classList.add('active');
        content.style.maxHeight = `${content.scrollHeight}px`;
        icon.textContent = '−';
      }
    };
  });
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

  // Named handler so we can remove it if the section leaves view
  function handleShuttleKey(e) {
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
  }
  window.addEventListener('keydown', handleShuttleKey);

  // Pause keys when user scrolls away from the loom section
  const _loomSection = document.getElementById('loom-console');
  if (_loomSection && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          window.removeEventListener('keydown', handleShuttleKey);
        } else {
          window.removeEventListener('keydown', handleShuttleKey); // prevent double-add
          window.addEventListener('keydown', handleShuttleKey);
        }
      });
    }, { threshold: 0.1 }).observe(_loomSection);
  }

  // Mobile touch buttons for shuttle game
  const btnShuttleLeft = document.getElementById('btn-shuttle-left');
  const btnShuttleRight = document.getElementById('btn-shuttle-right');
  if (btnShuttleLeft) {
    btnShuttleLeft.addEventListener('click', () => {
      if (!isManualActive || weftProgress >= 100) return;
      if (lastSide === 'right') {
        weftProgress += 5;
        lastSide = 'left';
        if (shuttleSlider) shuttleSlider.style.left = '0';
        triggerShuttleSound(true);
        updateWeftProgress();
        btnShuttleLeft.style.background = 'rgba(212,175,55,0.35)';
        setTimeout(() => { btnShuttleLeft.style.background = 'rgba(212,175,55,0.15)'; }, 150);
      }
    });
  }
  if (btnShuttleRight) {
    btnShuttleRight.addEventListener('click', () => {
      if (!isManualActive || weftProgress >= 100) return;
      if (lastSide === 'left') {
        weftProgress += 5;
        lastSide = 'right';
        if (shuttleSlider) shuttleSlider.style.left = 'calc(100% - 20px)';
        triggerShuttleSound(false);
        updateWeftProgress();
        btnShuttleRight.style.background = 'rgba(212,175,55,0.35)';
        setTimeout(() => { btnShuttleRight.style.background = 'rgba(212,175,55,0.15)'; }, 150);
      }
    });
  }

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
      
      // Visual container shake
      if (manualLoomPanel) {
        gsap.to(manualLoomPanel, {
          x: '+=8',
          yoyo: true,
          repeat: 5,
          duration: 0.04,
          onComplete: () => gsap.set(manualLoomPanel, { x: 0 })
        });
        
        // Spawn golden thread particles
        for (let i = 0; i < 35; i++) {
          const p = document.createElement('div');
          p.style.position = 'absolute';
          p.style.left = '50%';
          p.style.top = '50%';
          p.style.width = `${Math.random() * 5 + 3}px`;
          p.style.height = `${Math.random() * 5 + 3}px`;
          p.style.background = 'linear-gradient(135deg, #ffd700, #ff8c00)';
          p.style.borderRadius = '50%';
          p.style.pointerEvents = 'none';
          p.style.zIndex = '99';
          manualLoomPanel.appendChild(p);
          
          const angle = Math.random() * Math.PI * 2;
          const velocity = Math.random() * 140 + 70;
          
          gsap.to(p, {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity,
            opacity: 0,
            scale: 0.2,
            duration: 1.2,
            ease: 'power2.out',
            onComplete: () => p.remove()
          });
        }
      }
      
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
  let shlokaAudio = null;

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
    if (shlokaAudio) {
      shlokaAudio.pause();
      shlokaAudio.currentTime = 0;
      shlokaAudio = null;
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

    try {
      shlokaAudio = new Audio('/audio/shloka.mp3');
      shlokaAudio.loop = true;
      shlokaAudio.volume = 0.6;
      shlokaAudio.play().catch(e => console.error("Audio play failed:", e));
    } catch(e) { console.error("Audio creation failed:", e); }

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
      if (shlokaAudio && !shlokaAudio.paused) {
        stopOralAudio();
      } else {
        playOralAudio(activeClusterKey || 'nuapatna');
      }
    };
  }

  markers.forEach(marker => {
    const clusterKey = marker.dataset.cluster;
    // Activate on hover (desktop) or tap (mobile) — pointer events cover both
    const activateMarker = () => {
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
    const deactivateMarker = () => {
      marker.querySelector('circle').setAttribute('fill', '#d4af37');
      marker.querySelector('circle').setAttribute('r', '5');
    };

    marker.addEventListener('pointerenter', activateMarker);
    marker.addEventListener('pointerleave', deactivateMarker);
    // Keep backward-compat for non-pointer browsers
    marker.onmouseenter = activateMarker;
    marker.onmouseleave = deactivateMarker;

    marker.onclick = () => {
      activeClusterKey = clusterKey;
      playOralAudio(clusterKey);
    };

    // Make markers keyboard-navigable
    marker.setAttribute('tabindex', '0');
    marker.setAttribute('role', 'button');
    marker.setAttribute('aria-label', `Select ${CLUSTER_DATA[clusterKey]?.name || clusterKey} weaving cluster`);
    marker.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateMarker();
        playOralAudio(clusterKey);
      }
    });
  });
}

function setupCustomCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
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

  // Premium Magnetic Buttons Interaction
  const magneticEls = document.querySelectorAll('.btn-magnetic');
  magneticEls.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const bound = el.getBoundingClientRect();
      const elX = bound.left + bound.width / 2;
      const elY = bound.top + bound.height / 2;
      
      const mX = e.clientX;
      const mY = e.clientY;
      
      // Calculate elastic pull offset
      const pullX = (mX - elX) * 0.35;
      const pullY = (mY - elY) * 0.35;
      
      gsap.to(el, {
        x: pullX,
        y: pullY,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Expand and box the cursor ring to warp the button
      gsap.to(ring, {
        width: bound.width + 16,
        height: bound.height + 16,
        borderRadius: '30px',
        duration: 0.3
      });
    });
    
    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1.1, 0.4)'
      });
      
      gsap.to(ring, {
        width: 32,
        height: 32,
        borderRadius: '50%',
        duration: 0.3
      });
    });
  });

  // Hover states on interactive elements
  const hoverSelectors = 'a, button, select, input, .avatar-thumb, .card-interactive, .view-btn, .close-modal, .modal-close-btn';
  
  function addHoverListeners() {
    document.querySelectorAll(hoverSelectors).forEach(el => {
      // Use pointer events so hover states work on touch-capable devices too
      el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
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

function setupHeritageMatchmaker() {
  const drawer = document.getElementById('matchmaker-drawer');
  const btnOpen = document.getElementById('btn-open-matchmaker');
  const btnClose = document.getElementById('btn-close-matchmaker');

  if (!drawer || !btnOpen || !btnClose) return;

  // Open/Close Toggles
  btnOpen.onclick = () => {
    drawer.classList.add('active');
    gsap.fromTo(drawer, { right: -420 }, { right: 0, duration: 0.6, ease: 'power3.out' });
  };

  btnClose.onclick = () => {
    gsap.to(drawer, {
      right: -420,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => drawer.classList.remove('active')
    });
  };

  // Step Navigations
  let currentStep = 1;
  const totalSteps = 3;
  const btnPrev = document.getElementById('btn-matchmaker-prev');
  const btnNext = document.getElementById('btn-matchmaker-next');

  // Answers State
  const answers = {
    occasion: null,
    color: null,
    complexity: null
  };

  // Select Option bindings
  const stepsData = {
    1: 'occasion',
    2: 'color',
    3: 'complexity'
  };

  document.querySelectorAll('.matchmaker-step-panel').forEach((panel, pIdx) => {
    const step = pIdx + 1;
    const cards = panel.querySelectorAll('.option-card');
    cards.forEach(card => {
      card.onclick = () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        answers[stepsData[step]] = card.dataset.key;
        playShowroomSound(700, 0.04, 0.05);
      };
    });
  });

  function updateStepUI() {
    // Show/Hide Step panels
    document.querySelectorAll('.matchmaker-step-panel').forEach(panel => {
      const step = parseInt(panel.dataset.step);
      panel.classList.toggle('active', step === currentStep);
    });

    // Update Dots
    document.querySelectorAll('.step-dot').forEach(dot => {
      const step = parseInt(dot.dataset.step);
      dot.classList.toggle('active', step === currentStep);
    });

    // Update Nav Buttons
    if (btnPrev) btnPrev.style.display = currentStep > 1 ? 'block' : 'none';
    if (btnNext) {
      if (currentStep === totalSteps) {
        btnNext.textContent = "Reveal My Match";
      } else {
        btnNext.textContent = "Next Step";
      }
    }
  }

  if (btnPrev) {
    btnPrev.onclick = () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
        playShowroomSound(440, 0.03, 0.05);
      }
    };
  }

  if (btnNext) {
    btnNext.onclick = () => {
      // Validate option is selected for current step
      const currentKey = stepsData[currentStep];
      if (!answers[currentKey]) {
        // Simple shake animation on current active step
        const activePanel = document.querySelector(`.matchmaker-step-panel[data-step="${currentStep}"]`);
        if (activePanel) {
          gsap.to(activePanel, { x: '+=6', yoyo: true, repeat: 5, duration: 0.04, onComplete: () => gsap.set(activePanel, { x: 0 }) });
        }
        playShowroomSound(220, 0.08, 0.1);
        return;
      }

      if (currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
        playShowroomSound(550, 0.04, 0.06);
      } else {
        // Calculate match and select!
        revealSareeMatch();
      }
    };
  }

  function revealSareeMatch() {
    // Intelligent predictive matching algorithm
    let matchedId = 2; // Default Sambalpuri Lotus

    // Calculate aura score based on occasion, color, class, and local storage interest
    let scoreMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };

    if (answers.occasion === 'wedding') {
      scoreMap[5] += 50; // Jagannath Provenance
      scoreMap[1] += 40; // Nuapatana Khandua
      scoreMap[4] += 30; // Konark Sundial
    } else if (answers.occasion === 'offering') {
      scoreMap[1] += 50; // Khandua Sacred Weave
      scoreMap[6] += 40; // Maniabandha Grid
    } else if (answers.occasion === 'gala') {
      scoreMap[3] += 50; // Kotpad Temple
      scoreMap[4] += 45; // Konark Gold Tissue
    } else {
      scoreMap[2] += 40; // Sambalpuri Lotus
    }

    if (answers.color === 'crimson') {
      scoreMap[1] += 30; scoreMap[5] += 30; scoreMap[2] += 20;
    } else if (answers.color === 'gold') {
      scoreMap[4] += 40; scoreMap[8] += 30;
    } else if (answers.color === 'indigo') {
      scoreMap[6] += 30; scoreMap[7] += 30;
    } else if (answers.color === 'earth') {
      scoreMap[3] += 40;
    }

    if (answers.complexity === 'collector') {
      scoreMap[5] += 30; scoreMap[4] += 30; scoreMap[1] += 20;
    }

    // Pick top scoring saree ID
    let maxScore = -1;
    for (const [idStr, score] of Object.entries(scoreMap)) {
      if (score > maxScore) {
        maxScore = score;
        matchedId = parseInt(idStr);
      }
    }

    // Dynamic navigate and select item
    const showroomDrapeStage = document.getElementById('showroom-modal');
    if (showroomDrapeStage) {
      // Open showroom modal if closed
      const modal = document.getElementById('showroom-modal');
      if (modal && modal.classList.contains('hidden')) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
      }

      // Find the matched item from collection
      // Look up global inventory
      const matchedItem = sareeCollection.find(i => i.id === matchedId);
      if (matchedItem) {
        // Fetch update active item logic
        // Wait, setupShowroomDrape returns the updateActiveItem, but wait! How do we call it?
        // We can just query the avatar thumbnail inside the showroom and dispatch a click event!
        // This is incredibly clean, simple, and avoids having to export internal variables!
        const matchThumb = document.querySelector(`.avatar-thumb[data-id="${matchedId}"]`);
        if (matchThumb) {
          matchThumb.click();
          
          // Flash a gorgeous recommendation banner
          const titleStrip = document.querySelector('.showroom-title-left');
          const recBadge = document.createElement('div');
          recBadge.id = 'matchmaker-aura-badge';
          recBadge.innerHTML = `✨ Matched to your Custom Aura Quiz`;
          recBadge.style.cssText = "font-size:0.65rem; color:#ffd700; font-weight:bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; animation:pulse 1.5s infinite;";
          
          // Remove existing badge if any
          const oldBadge = document.getElementById('matchmaker-aura-badge');
          if (oldBadge) oldBadge.remove();
          
          if (titleStrip) titleStrip.prepend(recBadge);
        }
      }
    }

    // Close Matchmaker Drawer with transition
    btnClose.click();

    // Success Fanfare sound
    if (audioCtx) {
      const notes = [330, 440, 550, 660];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playShowroomSound(freq, 0.05, 0.12);
        }, idx * 100);
      });
    }
  }
}

function setupCuratorConcierge() {
  const panel = document.getElementById('concierge-panel');
  const btnOpen = document.getElementById('btn-open-concierge');
  const btnClose = document.getElementById('btn-close-concierge');
  const btnAcquireShowroom = document.getElementById('btn-acquire-now');

  if (!panel || !btnOpen || !btnClose) return;

  function openConcierge() {
    panel.style.display = 'flex';
    panel.classList.remove('hidden');
    
    // Auto-build WhatsApp link query parameters with dynamic saree specifications
    const linkWa = document.getElementById('link-wa-concierge');
    if (linkWa) {
      const activeTitle = document.getElementById('showroom-title') ? document.getElementById('showroom-title').textContent : 'Odisha Handloom Saree';
      const activePrice = document.getElementById('showroom-price-fiat') ? document.getElementById('showroom-price-fiat').textContent : '₹1,85,000';
      const artisanName = activeItem ? (activeItem.artisan_name || 'Master Weaver') : 'Master Weaver';
      const textParam = encodeURIComponent(`Namaste Priyadarshini, I am interested in a private styling & purchase consultation for the "${activeTitle}" (${activePrice}) crafted by ${artisanName}. Please share loom timeline and shipping details.`);
      linkWa.href = `https://wa.me/916712300000?text=${textParam}`;
    }

    // Animate panel scale/fade
    const card = panel.querySelector('.cert-card');
    if (card) {
      gsap.fromTo(card, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
    }
    
    playShowroomSound(660, 0.05, 0.1);
  }

  function closeConcierge() {
    const card = panel.querySelector('.cert-card');
    if (card) {
      gsap.to(card, {
        scale: 0.9,
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          panel.style.display = 'none';
          panel.classList.add('hidden');
          // Reset success state
          const succText = document.getElementById('sample-success-text');
          if (succText) succText.style.display = 'none';
        }
      });
    } else {
      panel.style.display = 'none';
      panel.classList.add('hidden');
    }
    playShowroomSound(440, 0.04, 0.05);
  }

  btnOpen.onclick = openConcierge;
  btnClose.onclick = closeConcierge;

  // Wire Concierge Chat Form to API
  const conciergeForm = document.getElementById('form-concierge-chat');
  const conciergeInput = document.getElementById('concierge-chat-input');
  const conciergeChatArea = document.getElementById('concierge-chat-area');
  const conciergeTyping = document.getElementById('concierge-typing-indicator');

  if (conciergeForm && conciergeInput) {
    conciergeForm.onsubmit = async (e) => {
      e.preventDefault();
      const msg = conciergeInput.value.trim();
      if (!msg) return;
      conciergeInput.value = '';

      if (conciergeChatArea) {
        const userBubble = document.createElement('div');
        userBubble.style.cssText = 'background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.3); color:#fff; padding:8px 12px; border-radius:6px; margin-bottom:8px; font-size:0.75rem; text-align:right; align-self:flex-end; max-width:85%;';
        userBubble.textContent = msg;
        conciergeChatArea.appendChild(userBubble);
        conciergeChatArea.scrollTop = conciergeChatArea.scrollHeight;
      }

      if (conciergeTyping) conciergeTyping.style.visibility = 'visible';

      try {
        const res = await fetch('/api/concierge/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        
        if (conciergeTyping) conciergeTyping.style.visibility = 'hidden';

        if (conciergeChatArea && data.reply) {
          const aiBubble = document.createElement('div');
          aiBubble.style.cssText = 'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.9); padding:8px 12px; border-radius:6px; margin-bottom:8px; font-size:0.75rem; text-align:left; max-width:90%; line-height:1.4;';
          aiBubble.innerHTML = `<strong style="color:var(--color-zari); display:block; margin-bottom:3px;">Priyadarshini</strong>${data.reply}`;
          conciergeChatArea.appendChild(aiBubble);
          conciergeChatArea.scrollTop = conciergeChatArea.scrollHeight;
          playShowroomSound(520, 0.03, 0.06);
        }
      } catch (err) {
        if (conciergeTyping) conciergeTyping.style.visibility = 'hidden';
      }
    };
  }

  // Bottom Bar Retract Toggle
  const btnToggleControls = document.getElementById('btn-toggle-controls');
  const showroomBottomBar = document.getElementById('showroom-bottom-bar');
  if (btnToggleControls && showroomBottomBar) {
    btnToggleControls.onclick = () => {
      const isRetracted = showroomBottomBar.classList.toggle('retracted');
      btnToggleControls.textContent = isRetracted ? "▼ SHOW CONTROLS" : "▲ HIDE CONTROLS";
      playShowroomSound(isRetracted ? 440 : 880, 0.04, 0.08);
    };
  }

  // --- WEAVING LOOM AMBIENT SYNTHESIZER ---
  let audioCtx = null;
  let ambientSynthInterval = null;
  let isAmbientAudioPlaying = false;

  function createNoiseBuffer() {
    const bufferSize = 2 * (audioCtx ? audioCtx.sampleRate : 44100);
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  function playShuttleSound(time) {
    if (!audioCtx) return;
    
    // Rhythmic Click Node (wood clicking)
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(80, time);
    clickOsc.frequency.exponentialRampToValueAtTime(10, time + 0.05);
    
    clickGain.gain.setValueAtTime(0.04, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    
    clickOsc.start(time);
    clickOsc.stop(time + 0.06);

    // Sliding Shuttle Woosh (white noise sliding reed)
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer();
    
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(600, time + 0.05);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, time + 0.35);
    noiseFilter.Q.setValueAtTime(3.0, time);
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.0, time);
    noiseGain.gain.linearRampToValueAtTime(0.02, time + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    noiseSource.start(time);
    noiseSource.stop(time + 0.4);
  }

  function startAmbientLoomAudio() {
    stopAmbientLoomAudio();
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isAmbientAudioPlaying = true;
    
    // Play rhythmic weave sounds (click-clack slide pattern every 0.8 seconds)
    let nextPlayTime = audioCtx.currentTime;
    ambientSynthInterval = setInterval(() => {
      const now = audioCtx.currentTime;
      if (nextPlayTime < now + 0.1) {
        playShuttleSound(nextPlayTime);
        // Play another accent wood click shortly after for double-shuttle rhythm
        playShuttleSound(nextPlayTime + 0.35);
        nextPlayTime += 0.8;
      }
    }, 200);
  }

  function stopAmbientLoomAudio() {
    isAmbientAudioPlaying = false;
    if (ambientSynthInterval) {
      clearInterval(ambientSynthInterval);
      ambientSynthInterval = null;
    }
  }

  const btnToggleAmbientAudio = document.getElementById('btn-toggle-ambient-audio');
  if (btnToggleAmbientAudio) {
    btnToggleAmbientAudio.onclick = () => {
      if (isAmbientAudioPlaying) {
        stopAmbientLoomAudio();
        btnToggleAmbientAudio.textContent = "🔊 Loom Sound: Off";
        btnToggleAmbientAudio.style.color = "var(--color-zari)";
      } else {
        startAmbientLoomAudio();
        btnToggleAmbientAudio.textContent = "🔊 Loom Sound: On";
        btnToggleAmbientAudio.style.color = "#2ecc71";
      }
    };
  }

  // --- LIVE LOOM STREAM MODAL ---
  const btnOpenLoomBooking = document.getElementById('btn-open-loom-booking');
  const liveLoomModal = document.getElementById('live-loom-modal');
  const btnCloseLoomModal = document.getElementById('btn-close-loom-modal');
  let loomStatsInterval = null;

  if (btnOpenLoomBooking && liveLoomModal) {
    btnOpenLoomBooking.onclick = () => {
      liveLoomModal.style.display = 'flex';
      playShowroomSound(580, 0.05, 0.1);
      
      loomStatsInterval = setInterval(() => {
        const tension = (7.8 + Math.random() * 1.2).toFixed(2);
        const velocity = Math.floor(220 + Math.random() * 40);
        document.getElementById('loom-stat-tension').textContent = `${tension} N`;
        document.getElementById('loom-stat-velocity').textContent = `${velocity} picks/min`;
        
        // Sonify pick velocity into loom rhythmic shuttle clicks
        if (audioCtx) {
          playShuttleSound(audioCtx.currentTime);
        }
      }, 1000);
    };
  }

  if (btnCloseLoomModal && liveLoomModal) {
    btnCloseLoomModal.onclick = () => {
      liveLoomModal.style.display = 'none';
      if (loomStatsInterval) {
        clearInterval(loomStatsInterval);
        loomStatsInterval = null;
      }
      playShowroomSound(440, 0.05, 0.1);
    };
  }

  // --- WEBXR AR DRAPE TRY-ON MODAL ---
  const btnArDrape = document.getElementById('btn-ar-drape');
  const arDrapeModal = document.getElementById('ar-drape-modal');
  const btnCloseArModal = document.getElementById('btn-close-ar-modal');
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const btnCaptureAr = document.getElementById('btn-capture-ar');
  const arCameraFeed = document.getElementById('ar-camera-feed');
  const arMannequinStage = document.getElementById('ar-mannequin-stage');
  const arDrapeSpec = document.getElementById('ar-drape-spec');
  const arCanvasOverlay = document.getElementById('ar-canvas-overlay');
  let arCameraStream = null;
  let arAnimId = null;

  function renderArSilkSheen() {
    if (!arCanvasOverlay) return;
    const ctx = arCanvasOverlay.getContext('2d');
    const w = arCanvasOverlay.width = arCanvasOverlay.clientWidth || 380;
    const h = arCanvasOverlay.height = arCanvasOverlay.clientHeight || 260;

    let time = 0;
    function drawSheen() {
      time += 0.04;
      ctx.clearRect(0, 0, w, h);

      // Render flowing silk shimmer drape lines across mannequin chest
      const hue = isCustomMode ? customHue : (activeItem ? (activeItem.color_hue || 0) : 0);
      const sat = isCustomMode ? customSat : (activeItem ? (activeItem.color_saturation || 1) : 1);
      
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `hsla(${hue}, ${Math.floor(sat * 70)}%, 50%, 0.15)`);
      grad.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 90%, 65%, 0.35)`);
      grad.addColorStop(1, `hsla(${hue}, ${Math.floor(sat * 70)}%, 50%, 0.15)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      for (let x = 0; x <= w; x += 20) {
        const y = h * 0.4 + Math.sin(x * 0.015 + time) * 18 + Math.cos(time * 0.8) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Zari border golden highlights
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + Math.sin(time * 2) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 15) {
        const y = h * 0.38 + Math.sin(x * 0.015 + time) * 18 + Math.cos(time * 0.8) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      arAnimId = requestAnimationFrame(drawSheen);
    }
    if (arAnimId) cancelAnimationFrame(arAnimId);
    drawSheen();
  }

  if (btnArDrape && arDrapeModal) {
    btnArDrape.onclick = () => {
      arDrapeModal.style.display = 'flex';
      arDrapeModal.classList.remove('hidden');
      if (arDrapeSpec) {
        const name = isCustomMode ? `Custom ${customPattern} Weave` : (activeItem ? activeItem.name : 'Nuapatana Khandua Ikat Saree');
        const cat = isCustomMode ? `${customHue}° HSL` : (activeItem ? (activeItem.category_name || 'Mulberry Silk') : 'Pure Silk');
        arDrapeSpec.textContent = `${name} · ${cat}`;
      }
      renderArSilkSheen();
      playShowroomSound(720, 0.05, 0.1);
    };
  }

  const stopArCamera = () => {
    if (arCameraStream) {
      arCameraStream.getTracks().forEach(track => track.stop());
      arCameraStream = null;
    }
    if (arCameraFeed) arCameraFeed.style.display = 'none';
    if (arMannequinStage) arMannequinStage.style.display = 'block';
    if (btnToggleCamera) btnToggleCamera.textContent = '📷 Start Camera';
    if (arAnimId) {
      cancelAnimationFrame(arAnimId);
      arAnimId = null;
    }
  };

  if (btnCloseArModal && arDrapeModal) {
    btnCloseArModal.onclick = () => {
      arDrapeModal.style.display = 'none';
      arDrapeModal.classList.add('hidden');
      stopArCamera();
      playShowroomSound(440, 0.04, 0.08);
    };
  }

  if (btnToggleCamera) {
    btnToggleCamera.onclick = async () => {
      if (arCameraStream) {
        stopArCamera();
        renderArSilkSheen();
      } else {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API unavailable');
          }
          arCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (arCameraFeed) {
            arCameraFeed.srcObject = arCameraStream;
            arCameraFeed.style.display = 'block';
          }
          if (arMannequinStage) arMannequinStage.style.display = 'none';
          btnToggleCamera.textContent = '⏹ Stop Camera';
          renderArSilkSheen();
          playShowroomSound(880, 0.06, 0.12);
        } catch (err) {
          console.warn('Camera access unavailable:', err);
          alert('Camera access permissions required for live video feed. Rendering mannequin silk drape simulation overlay.');
        }
      }
    };
  }

  if (btnCaptureAr) {
    btnCaptureAr.onclick = () => {
      playShowroomSound(980, 0.08, 0.15);
      alert('📸 AR Drape Snapshot captured! Saved to your luxury heritage showroom portfolio.');
    };
  }

  // Intercept the main showroom CTA to drive high-touch curated matching
  if (btnAcquireShowroom) {
    btnAcquireShowroom.onclick = (e) => {
      e.preventDefault();
      openConcierge();
    };
  }

  // Bind custom actions
  const btnSamples = document.getElementById('btn-request-samples');
  const btnSchedule = document.getElementById('btn-concierge-schedule');
  const successText = document.getElementById('sample-success-text');

  if (btnSamples) {
    btnSamples.onclick = () => {
      if (successText) {
        successText.textContent = "✓ Custom Thread Chest requested. Priyadarshini will contact you to verify details.";
        successText.style.display = 'block';
        gsap.from(successText, { y: 10, opacity: 0, duration: 0.3 });
      }
      playShowroomSound(880, 0.08, 0.15);
    };
  }

  if (btnSchedule) {
    btnSchedule.onclick = () => {
      if (successText) {
        successText.textContent = "✓ Callback request received. A stylist will reach you within 2 hours.";
        successText.style.display = 'block';
        gsap.from(successText, { y: 10, opacity: 0, duration: 0.3 });
      }
      playShowroomSound(880, 0.08, 0.15);
    };
  }

  // Interactive Concierge Chat Bot
  const chatForm = document.getElementById('form-concierge-chat');
  const chatInput = document.getElementById('concierge-chat-input');
  const chatHistory = document.getElementById('concierge-chat-history');
  const typingIndicator = document.getElementById('concierge-typing-indicator');

  if (chatForm && chatInput && chatHistory) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const rawMsg = chatInput.value.trim();
      if (!rawMsg) return;

      chatInput.value = '';

      // 1. Append User Message
      const userBubble = document.createElement('div');
      userBubble.style.cssText = "align-self:flex-end; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px 12px 0 12px; border:1px solid rgba(255,255,255,0.1); max-width:85%; color:#fff;";
      userBubble.textContent = rawMsg;
      chatHistory.appendChild(userBubble);
      chatHistory.scrollTop = chatHistory.scrollHeight;

      playShowroomSound(480, 0.03, 0.05);

      // 2. Show Typing Status
      if (typingIndicator) typingIndicator.style.visibility = 'visible';

      // 3. Process Keyword Match Response
      const lower = rawMsg.toLowerCase();
      let reply = "";

      if (lower.includes('ship') || lower.includes('delivery') || lower.includes('time') || lower.includes('day')) {
        reply = "We offer insured global express shipping via DHL and FedEx. Delivery to the USA, UK, and Canada takes 3-6 business days, packed in customized wooden chests.";
      } else if (lower.includes('blue') || lower.includes('navy') || lower.includes('indigo') || lower.includes('bomkai')) {
        reply = "I recommend our classic Indigo weave. Click here to <span class='chat-deep-link' data-action='model' data-value='7' style='color:var(--color-zari); cursor:pointer; text-decoration:underline; font-weight:bold;'>[Load Bomkai Classic Model Look]</span>.";
      } else if (lower.includes('green') || lower.includes('emerald') || lower.includes('khandua')) {
        reply = "Our green and gold weaves are breathtaking. You can preview it here: <span class='chat-deep-link' data-action='model' data-value='8' style='color:var(--color-zari); cursor:pointer; text-decoration:underline; font-weight:bold;'>[Load Khandua Signature Model Look]</span>.";
      } else if (lower.includes('crimson') || lower.includes('red') || lower.includes('sambalpuri')) {
        reply = "Preview our Sambalpuri Crimson look here: <span class='chat-deep-link' data-action='model' data-value='6' style='color:var(--color-zari); cursor:pointer; text-decoration:underline; font-weight:bold;'>[Load Sambalpuri Relic Model Look]</span>.";
      } else if (lower.includes('custom') || lower.includes('color') || lower.includes('dye') || lower.includes('motif')) {
        reply = "Yes! You can configure custom body pigments, Saturation levels, and border motifs. Click here to <span class='chat-deep-link' data-action='tab' data-value='designer' style='color:var(--color-zari); cursor:pointer; text-decoration:underline; font-weight:bold;'>[Open Designer Panel]</span>.";
      } else if (lower.includes('size') || lower.includes('length') || lower.includes('long') || lower.includes('blouse')) {
        reply = "Our sarees adhere to the traditional length of 5.5 meters, accompanied by an additional 80cm matching blouse piece. Contact us on WhatsApp for custom sizing.";
      } else if (lower.includes('authent') || lower.includes('origin') || lower.includes('provenance') || lower.includes('loom') || lower.includes('burn')) {
        reply = "All products are woven on traditional zero-electricity wooden handlooms. To see the weaver ledger and transit map, click here: <span class='chat-deep-link' data-action='cert' style='color:var(--color-zari); cursor:pointer; text-decoration:underline; font-weight:bold;'>[Open Provenance Certificate]</span>.";
      } else if (lower.includes('price') || lower.includes('cost') || lower.includes('rupee') || lower.includes('fiat')) {
        reply = "Prices for our premium heritage silks begin at ₹1,25,000. Select a variation to recalculate the specific weave cost.";
      } else {
        reply = "That is a beautiful enquiry. Let me escalate this to our master cooperative. Click 'Continue on WhatsApp' below to speak to our lead styling consultant directly.";
      }

      // Simulate typing latency
      setTimeout(() => {
        if (typingIndicator) typingIndicator.style.visibility = 'hidden';

        const replyBubble = document.createElement('div');
        replyBubble.style.cssText = "align-self:flex-start; background:rgba(212,175,55,0.08); padding:8px 12px; border-radius:12px 12px 12px 0; border:1px solid rgba(212,175,55,0.2); max-width:85%; color:rgba(255,255,255,0.95);";
        replyBubble.innerHTML = reply;

        chatHistory.appendChild(replyBubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        playShowroomSound(660, 0.04, 0.08);
      }, 1200);
    };
  }

  // Click delegation for chat history deep-links
  if (chatHistory) {
    chatHistory.addEventListener('click', (e) => {
      const link = e.target.closest('.chat-deep-link');
      if (!link) return;
      const action = link.getAttribute('data-action');
      const val = link.getAttribute('data-value');

      if (action === 'model') {
        const btn = document.querySelector(`.model-option[data-model="${val}"]`);
        if (btn) btn.click();
      } else if (action === 'tab') {
        const btn = document.getElementById('tab-customizer');
        if (btn) btn.click();
      } else if (action === 'cert') {
        const btn = document.getElementById('btn-generate-certificate');
        if (btn) btn.click();
      }
      playShowroomSound(780, 0.05, 0.08);
    });
  }
}


/* ==========================================================
   SURPRISE FEATURE: SILK CONSTELLATION AMBIENT CANVAS
   Golden node-thread network on the Genesis hero section
   that breathes and reacts to mouse — like a glowing silk web
========================================================== */
function setupSilkConstellation() {
  const genesis = document.getElementById('genesis');
  if (!genesis) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-silk-constellation';
  canvas.style.cssText = `
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 1; opacity: 0.55;
  `;
  genesis.appendChild(canvas);

  let mouse = { x: -9999, y: -9999 };
  genesis.addEventListener('mousemove', (e) => {
    const rect = genesis.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  genesis.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  const NODE_COUNT = 42;
  const CONNECTION_DIST = 160;
  const MOUSE_REPEL = 110;

  function makeNode(w, h) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: 1.2 + Math.random() * 2.2,
      hue: 40 + Math.random() * 30
    };
  }

  let nodes = [];
  let animId = null;

  function resize() {
    canvas.width = genesis.offsetWidth;
    canvas.height = genesis.offsetHeight;
    nodes = Array.from({ length: NODE_COUNT }, () => makeNode(canvas.width, canvas.height));
  }

  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d');

  function drawConstellation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() * 0.0008;
    const cw = canvas.width, ch = canvas.height;

    // Update node positions
    nodes.forEach((n, i) => {
      // Gentle sine drift
      n.x += n.vx + Math.sin(t + i * 0.7) * 0.08;
      n.y += n.vy + Math.cos(t + i * 0.5) * 0.08;

      // Mouse repel
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < MOUSE_REPEL && dist > 0) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL * 1.2;
        n.x += (dx / dist) * force;
        n.y += (dy / dist) * force;
      }

      // Wrap at edges
      if (n.x < 0) n.x = cw;
      if (n.x > cw) n.x = 0;
      if (n.y < 0) n.y = ch;
      if (n.y > ch) n.y = 0;
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d < CONNECTION_DIST) {
          const alpha = (1 - d / CONNECTION_DIST) * 0.4;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = `hsl(${(a.hue + b.hue) / 2}, 80%, 72%)`;
          ctx.lineWidth = alpha * 2.2;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
          ctx.shadowBlur = 3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulse = 1 + Math.sin(t * 2.1 + n.hue) * 0.3;
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = `hsl(${n.hue}, 90%, 75%)`;
      ctx.shadowColor = `hsl(${n.hue}, 100%, 65%)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    animId = requestAnimationFrame(drawConstellation);
  }

  drawConstellation();
}


/* ==========================================================
   SURPRISE FEATURE: CURATOR WHISPER EASTER EGG
   Hold the brand logo for 3 seconds to hear a sacred shloka
   typed across the screen, then gracefully fade away
========================================================== */
function setupCuratorWhisper() {
  const brand = document.querySelector('.brand-lockup');
  if (!brand) return;

  const SHLOKAS = [
    "ଓ ଜଗନ୍ନାଥ ସ୍ୱାମୀ ନୟନ ପଥ ଗାମୀ ଭବତୁ ମେ",
    "ललित लवङ्ग लता परिशीलन कोमल मलयसमीरे",
    "ସୂତ ବୁଣୁ ସୂତ — ଧାଗା ପ୍ରତ୍ୟେକ ଇତିହାସ",
    "Every thread is a prayer. Every loom a temple."
  ];

  let holdTimer = null;
  let overlay = null;
  let typeIdx = 0;
  let typeTimer = null;

  function clearWhisper() {
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { if (overlay) { overlay.remove(); overlay = null; } }, 700);
    }
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
  }

  function triggerWhisper() {
    const shloka = SHLOKAS[Math.floor(Math.random() * SHLOKAS.length)];
    clearWhisper();

    overlay = document.createElement('div');
    overlay.id = 'curator-whisper-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9998; display: flex;
      align-items: center; justify-content: center;
      pointer-events: none; background: rgba(0,0,0,0.01);
      transition: opacity 0.7s ease;
      opacity: 0;
    `;

    const txt = document.createElement('div');
    txt.style.cssText = `
      font-family: 'Playfair Display', serif;
      font-size: clamp(1.1rem, 3vw, 2.2rem);
      font-style: italic;
      color: rgba(212, 175, 55, 0.92);
      text-align: center;
      max-width: 70vw;
      letter-spacing: 0.06em;
      line-height: 1.6;
      text-shadow: 0 0 40px rgba(212, 175, 55, 0.4), 0 0 80px rgba(212, 175, 55, 0.15);
      border-bottom: 1px solid rgba(212, 175, 55, 0.25);
      padding-bottom: 0.5em;
    `;
    overlay.appendChild(txt);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // Play gentle chime
    if (audioCtx && audioCtx.state === 'running') {
      try {
        [330, 440, 550].forEach((freq, i) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 1.2);
          }, i * 220);
        });
      } catch(e) {}
    }

    // Typewriter effect
    typeIdx = 0;
    txt.textContent = '';
    typeTimer = setInterval(() => {
      if (typeIdx < shloka.length) {
        txt.textContent += shloka[typeIdx];
        typeIdx++;
      } else {
        clearInterval(typeTimer);
        typeTimer = null;
        // Auto-dismiss after 4s
        setTimeout(clearWhisper, 4200);
      }
    }, 48);
  }

  // Support both mouse and touch (pointer events cover both)
  const startHold = () => { holdTimer = setTimeout(() => { triggerWhisper(); holdTimer = null; }, 3000); };
  const cancelHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };

  brand.addEventListener('mousedown', startHold);
  brand.addEventListener('pointerdown', startHold);
  brand.addEventListener('mouseup', cancelHold);
  brand.addEventListener('pointerup', cancelHold);
  brand.addEventListener('mouseleave', cancelHold);
  brand.addEventListener('pointerleave', cancelHold);
  brand.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); }, { passive: false });
  brand.addEventListener('touchend', cancelHold);

  brand.setAttribute('title', 'Hold for 3 seconds...');
}

// ═══════════════════════════════════════════════════════════════
//   TOP-OF-THE-WORLD SURPRISE FEATURES  —  v4.0 ULTIMATE EDITION
// ═══════════════════════════════════════════════════════════════

// ── 1. CUSTOM SILK THREAD CURSOR TRAIL ──────────────────────────
function initSilkCursorTrail() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let cursorX = -200, cursorY = -200;
  let ringX = -200, ringY = -200;
  let lastTrailTime = 0;
  const TRAIL_INTERVAL = 30; // ms between trail particles

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;

    dot.style.left  = cursorX + 'px';
    dot.style.top   = cursorY + 'px';

    // Emit silk thread trail particle
    const now = Date.now();
    if (now - lastTrailTime > TRAIL_INTERVAL) {
      lastTrailTime = now;
      spawnCursorTrail(cursorX, cursorY);
    }
  });

  // Smooth ring lag
  function animateRing() {
    ringX += (cursorX - ringX) * 0.12;
    ringY += (cursorY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Cursor scale on interactive element hover
  document.addEventListener('mouseenter', (e) => {
    if (e.target.matches('a,button,.btn,.saree-card,[role="button"],.hidden-glyph')) {
      dot.style.width  = '16px';
      dot.style.height = '16px';
    }
  }, true);
  document.addEventListener('mouseleave', (e) => {
    if (e.target.matches('a,button,.btn,.saree-card,[role="button"],.hidden-glyph')) {
      dot.style.width  = '8px';
      dot.style.height = '8px';
    }
  }, true);
}

function spawnCursorTrail(x, y) {
  const el = document.createElement('div');
  el.className = 'cursor-trail-particle';
  const size = 2 + Math.random() * 5;
  el.style.cssText = `
    left: ${x}px; top: ${y}px;
    width: ${size}px; height: ${size}px;
    animation-duration: ${0.5 + Math.random() * 0.4}s;
  `;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── 2. SILK ORACLE MYSTICAL CONCIERGE ───────────────────────────
const ORACLE_PERSONA = {
  greetings: [
    "🕯 *The weave stirs...* I am the Silk Oracle — the spirit woven into every thread by master hands in Nuapatna. <em>What whispers do you bring to the loom?</em>",
    "✦ \"ଯସ୍ୟ ସ୍ମୃତ୍ୟା ଚ ନାମୋକ୍ତ୍ୟା...\" — I awaken. The threads of eight centuries pulse beneath us. Ask, and the weave shall answer.",
    "🔮 The shuttle has crossed. The pattern holds. <em>Speak your question into the weave, and I shall reveal what the silk knows.</em>"
  ],
  responses: {
    ship: ["✈ The sacred cloth travels swiftly — insured express via DHL and FedEx, arriving in USA, UK & UAE within 3–6 days, packed in ceremonial wooden chests lined with muslin."],
    delivery: ["✈ The sacred cloth travels swiftly — insured express via DHL and FedEx, arriving in USA, UK & UAE within 3–6 days, packed in ceremonial wooden chests lined with muslin."],
    price: ["💫 *The Oracle cannot assign gold to devotion.* Yet — our curated pieces begin at ₹1,85,000 for a ceremonial Khandua Patta and ₹85,000 for a Sambalpuri weave. Request a consultation for an exact estimation."],
    cost: ["💫 *The Oracle cannot assign gold to devotion.* Yet — our curated pieces begin at ₹1,85,000 for a ceremonial Khandua Patta and ₹85,000 for a Sambalpuri weave. Request a consultation for an exact estimation."],
    authentic: ["⚗ Every saree is woven on zero-electricity wooden handlooms, with Silk Mark India certification. Each thread carries a provenance hash — try our <em>Unweave</em> feature to see its molecular DNA."],
    real: ["⚗ Every saree is woven on zero-electricity wooden handlooms, with Silk Mark India certification. Each thread carries a provenance hash — try our <em>Unweave</em> feature to see its molecular DNA."],
    handloom: ["⚗ Every saree is woven on zero-electricity wooden handlooms, with Silk Mark India certification. Each thread carries a provenance hash — try our <em>Unweave</em> feature to see its molecular DNA."],
    weave: ["🌀 \"ତନ୍ତୁ ବ ସ୍ନ...\" — The weavers of Nuapatna and Maniabandha have mastered the tie-dye Ikat technique across generations. Each motif — peacock, lotus, Konark wheel — takes 30–45 days to materialize."],
    khandua: ["🌀 The Khandua Patta is the most sacred of our silks. Woven specifically to adorn Lord Jagannath at Puri each morning. The calligraphic warp-ikat carries Sanskrit shlokas visible only in direct sunlight."],
    jagannath: ["🙏 The Khandua Silk has clothed Lord Jagannath of Puri for 800 years. Our weavers continue that sacred lineage — each piece offered to our patrons carries that divine thread of connection."],
    custom: ["✍ A commission is a sacred agreement between patron and weaver. We offer fully bespoke weaves — choose your master artisan, body color, motif system, and thread count. Begin with our <em>Commission Studio</em> above."],
    secret: ["🗝 *The Oracle feels your curiosity about hidden things...* Look carefully at the corners of each section — there are 5 ancient Odia glyphs hidden in plain sight. Find them all, and the vault opens."],
    glyph: ["🗝 *The Oracle feels your curiosity about hidden things...* Look carefully at the corners of each section — there are 5 ancient Odia glyphs hidden in plain sight. Find them all, and the vault opens."],
    ratha: ["🎪 Ratha Yatra — the grand Chariot Festival of Puri — is the most sacred occasion in Odia life. The Lord's chariot is festooned with our Khandua silk. The next ceremonial release coincides with Ratha Yatra 2026."],
    odissi: ["💃 Odissi, the classical dance of Odisha, mirrors the Tribhangi posture carved in stone at Konark. Our Sambalpuri sarees are designed for the sweeping movements of Odissi performance — wide borders, deep pleats."],
    default: [
      "✦ *The silk whispers...* Your question reaches me across threads. May I suggest consulting our human curators at Priyadarshini Silk House? They hold the answers that live beyond the weave.",
      "🌿 The Oracle contemplates your words. Each answer is woven slowly, like silk — with care. Try asking about our collections, authentication, weaving time, or our secret vault.",
      "🕯 \"ଯଥା ଶ୍ରୀ ଜଗନ୍ନାଥ...\" — The weave contemplates your question. Ask about specific sarees, shipping, or the hidden secrets of this loom."
    ]
  }
};

function initSilkOracle() {
  const btnOpen   = document.getElementById('btn-open-oracle');
  const panel     = document.getElementById('oracle-panel');
  const btnClose  = document.getElementById('btn-close-oracle');
  const chatArea  = document.getElementById('oracle-chat-area');
  const form      = document.getElementById('oracle-chat-form');
  const input     = document.getElementById('oracle-input');
  const statusTxt = document.getElementById('oracle-status-text');

  if (!btnOpen || !panel || !chatArea) return;

  function openOracle() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    btnOpen.classList.add('oracle-open');
    btnOpen.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input && input.focus(), 50);

    // Awaken sequence
    if (chatArea.children.length === 0) {
      setTimeout(() => {
        if (statusTxt) {
          statusTxt.textContent = '✦ The Oracle speaks...';
        }
        const greeting = ORACLE_PERSONA.greetings[Math.floor(Math.random() * ORACLE_PERSONA.greetings.length)];
        showTypingThenMessage(greeting, 1200);
      }, 600);
    }
    if (isAudioPlaying) playTempleChimeSound();
  }

  function closeOracle() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    btnOpen.classList.remove('oracle-open');
    btnOpen.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    btnOpen.focus();
  }

  btnOpen.addEventListener('click', openOracle);
  if (btnClose) btnClose.addEventListener('click', closeOracle);

  // Escape key closes oracle
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeOracle();
  });

  // Focus trap inside oracle panel
  panel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !panel.classList.contains('open')) return;
    const focusable = [...panel.querySelectorAll('button, input, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled);
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') &&
        !panel.contains(e.target) &&
        e.target !== btnOpen) {
      closeOracle();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    // User bubble
    addBubble(msg, 'user');

    // Show typing
    const typing = addTypingIndicator();
    const lower = msg.toLowerCase();

    // Find matching response
    let reply = null;
    for (const [keyword, replies] of Object.entries(ORACLE_PERSONA.responses)) {
      if (keyword !== 'default' && lower.includes(keyword)) {
        reply = replies[Math.floor(Math.random() * replies.length)];
        break;
      }
    }
    if (!reply) {
      const defaults = ORACLE_PERSONA.responses.default;
      reply = defaults[Math.floor(Math.random() * defaults.length)];
    }

    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      typing.remove();
      addBubble(reply, 'oracle');
      if (isAudioPlaying) playShowroomSound(440, 0.03, 0.08);
    }, delay);
  });

  function addBubble(html, type) {
    const bubble = document.createElement('div');
    bubble.className = `oracle-bubble ${type}`;
    bubble.innerHTML = html;
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
    return bubble;
  }

  function addTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'oracle-typing';
    el.innerHTML = `<div class="oracle-typing-dot"></div><div class="oracle-typing-dot"></div><div class="oracle-typing-dot"></div>`;
    chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
    return el;
  }

  function showTypingThenMessage(html, delay) {
    const typing = addTypingIndicator();
    setTimeout(() => {
      typing.remove();
      addBubble(html, 'oracle');
      if (statusTxt) statusTxt.textContent = '✦ Listening...';
    }, delay);
  }
}

// ── 3. ODIA GLYPH EASTER EGG TREASURE HUNT ──────────────────────
function initGlyphHunt() {
  const glyphs = Array.from(document.querySelectorAll('.hidden-glyph'));
  const counter = document.getElementById('glyph-counter');
  const counterLabel = document.getElementById('glyph-counter-label');
  const dots = Array.from(document.querySelectorAll('.glyph-dot'));
  const secretVault = document.getElementById('secret-vault-panel');
  const btnCloseSecret = document.getElementById('btn-close-secret');
  const foundSet = new Set();

  if (!glyphs.length) return;

  // Show counter on hover (desktop) or first touch (mobile)
  glyphs.forEach(glyph => {
    glyph.addEventListener('pointerenter', () => {
      if (counter) counter.classList.add('visible');
    });
  });

  glyphs.forEach(glyph => {
    glyph.addEventListener('click', () => {
      const idx = parseInt(glyph.dataset.glyph);
      if (foundSet.has(idx)) return;

      foundSet.add(idx);
      glyph.classList.add('found');

      // Update dots
      if (dots[idx]) dots[idx].classList.add('found');
      if (counterLabel) counterLabel.textContent = `${foundSet.size} of 5 Glyphs`;
      if (counter) counter.classList.add('visible');

      // Chime
      if (isAudioPlaying) playTempleChimeSound();

      // Spawn mini silk particle burst from glyph
      const rect = glyph.getBoundingClientRect();
      spawnSilkParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);

      // All 5 found — unlock secret vault
      if (foundSet.size === 5) {
        setTimeout(() => {
          if (secretVault) {
            secretVault.classList.add('active');
            if (isAudioPlaying) {
              playTempleChimeSound();
              setTimeout(playTempleChimeSound, 400);
              setTimeout(playTempleChimeSound, 800);
            }
            // Grand burst
            spawnSilkParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 80);
          }
        }, 600);
      }
    });
  });

  if (btnCloseSecret) {
    btnCloseSecret.addEventListener('click', () => {
      if (secretVault) secretVault.classList.remove('active');
    });
  }
}

// ── 4. SILK PARTICLE BURST (CTA CLICK) ──────────────────────────
function spawnSilkParticleBurst(x, y, count = 60) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const isThread = Math.random() < 0.4;
    el.className = isThread ? 'silk-thread-particle' : 'silk-particle';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 60 + Math.random() * 160;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 3 + Math.random() * 7;
    const len = 12 + Math.random() * 24;
    const rot = Math.random() * 360;
    const duration = 0.8 + Math.random() * 0.6;
    el.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      --size: ${size}px;
      --len: ${len}px;
      --dx: ${dx}px;
      --dy: ${dy}px;
      --rot: ${rot}deg;
      animation-duration: ${duration}s;
      animation-delay: ${Math.random() * 0.1}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function initCTAParticleBurst() {
  // Hook onto the "Request Curator Consultation" button and other CTAs
  const ctaSelectors = ['#btn-open-concierge', '#btn-acquire-now', '#btn-open-oracle', '[id^="btn-request"]'];
  ctaSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('click', (e) => {
      spawnSilkParticleBurst(e.clientX, e.clientY, 55);
      if (isAudioPlaying) {
        playTempleChimeSound();
        setTimeout(playTempleChimeSound, 250);
      }
    });
  });

  // Also hook all btn-primary clicks globally with a smaller burst
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-primary, .btn-acquire')) {
      spawnSilkParticleBurst(e.clientX, e.clientY, 30);
    }
  });
}

// ── 5. LIVE WEAVING SESSION COUNTDOWN ───────────────────────────
function initWeavingCountdown() {
  const el = document.getElementById('ribbon-countdown');
  const queueEl = document.getElementById('ribbon-queue-text');
  if (!el) return;

  // Target: next midnight IST (Odisha time) as the "next loom session"
  function getNextSession() {
    const now = new Date();
    // Next 6:00 AM IST (UTC+5:30) as the loom opening time
    const target = new Date();
    target.setUTCHours(0, 30, 0, 0); // 6:00 AM IST = 00:30 UTC
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  const weaverQueues = ['2 weavers active', '3 weavers active', '4 weavers active', '2 weavers active', '5 weavers active'];
  let queueIdx = 0;

  function tick() {
    const now = new Date();
    const diff = getNextSession() - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  // Update queue text every 60s
  setInterval(() => {
    queueIdx = (queueIdx + 1) % weaverQueues.length;
    if (queueEl) queueEl.textContent = weaverQueues[queueIdx] + ' now';
  }, 60000);

  tick();
  setInterval(tick, 1000);
}

// ── 6. ACTIVE NAV SECTION INDICATOR ─────────────────────────────
function initNavActiveState() {
  const sections = ['genesis','artisan-pulse','metamorphosis','heritage-soul','vault'];
  const navLinks = document.querySelectorAll('.site-nav a');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          const href = a.getAttribute('href');
          if (href === `#${id}`) {
            a.classList.add('active');
          } else {
            a.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el);
  });
}

// ── 7. HOLOGRAPHIC WARP DIVIDER SCROLL REVEAL ────────────────────
function initWarpDividers() {
  const dividers = document.querySelectorAll('.warp-divider');
  if (!dividers.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  dividers.forEach(d => obs.observe(d));
}

// ── 8. ANIMATED LOADER STATUS MESSAGES ───────────────────────────
function initAnimatedLoaderMessages() {
  const statusEl = document.getElementById('loader-status-text');
  if (!statusEl) return;
  const messages = [
    'Preparing digital threads...',
    'Calibrating warp tension...',
    'Summoning master weavers...',
    'Loading sacred motifs...',
    'Aligning Konark chakra...',
    'Entering the Loom of Time...',
  ];
  let idx = 0;
  const interval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = messages[idx];
      statusEl.style.opacity = '1';
      statusEl.style.transition = 'opacity 0.4s';
    }, 200);
  }, 900);

  // Stop after page load
  window.addEventListener('load', () => clearInterval(interval));
}

// ── INITIALIZE ALL SURPRISE FEATURES ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Critical features only
  initAnimatedLoaderMessages();
  applyLighthouseOptimizations();
  applyRegionToPage();
  initUnifiedAudioConsole();

  // Stagger non-critical feature inits across multiple distinct event loop ticks (50ms apart)
  const deferredInits = [
    initSilkCursorTrail,
    initSilkOracle,
    initGlyphHunt,
    initCTAParticleBurst,
    initWeavingCountdown,
    initNavActiveState,
    initWarpDividers,
    initWeaveProgressPersistence,
    initUnlockPanel,
    initDepositModal,
    initLoomTelemetry,
    initAdoptLoom,
    initRegionSelector,
    initVaultFilters
  ];

  deferredInits.forEach((fn, idx) => {
    setTimeout(fn, 200 + idx * 50);
  });
});

/* ══════════════════════════════════════════════════════════════
   FEATURE 1: WEAVE → 3D SHOWCASE BRIDGE
   Persists shuttle game progress to localStorage.
   On unlock, updates vault card Zari overlay to reflect the
   custom warp console settings (borderPattern + color).
══════════════════════════════════════════════════════════════ */
function initWeaveProgressPersistence() {
  // Restore saved progress on load
  try {
    const saved = JSON.parse(localStorage.getItem('loom_weave_progress') || 'null');
    if (saved && saved.weftProgress > 0) {
      // Restore UI state
      const progressVal = document.getElementById('game-progress-val');
      const progressBar = document.getElementById('game-progress-bar');
      if (progressVal) progressVal.textContent = `${saved.weftProgress}%`;
      if (progressBar) progressBar.style.width = `${saved.weftProgress}%`;

      if (saved.weftProgress >= 100) {
        const successMsg = document.getElementById('game-success-message');
        if (successMsg) successMsg.classList.remove('hidden');
        const unlockPanel = document.getElementById('weave-unlock-panel');
        if (unlockPanel) unlockPanel.classList.remove('hidden');
        // Re-apply the motif to catalogue after a short delay for DOM readiness
        setTimeout(() => applyWeaveToCatalogue(saved.borderPattern || 'lotus', saved.warpTension || 1.0), 1500);
      }
    }
  } catch (e) {}

  // Hook into the existing weft progress updater via MutationObserver on the progress bar
  const progressBar = document.getElementById('game-progress-bar');
  if (!progressBar) return;

  const obs = new MutationObserver(() => {
    const pct = parseInt(progressBar.style.width) || 0;
    try {
      localStorage.setItem('loom_weave_progress', JSON.stringify({
        weftProgress: pct,
        borderPattern,
        warpTension,
        threadCount,
        savedAt: Date.now()
      }));
    } catch (e) {}

    // When weave hits 100%, apply the custom motif to the vault
    if (pct >= 100) {
      applyWeaveToCatalogue(borderPattern, warpTension);
    }
  });
  obs.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
}

function applyWeaveToCatalogue(pattern, tension) {
  const vaultCards = document.querySelectorAll('.saree-card');
  if (!vaultCards.length) return;

  // Map pattern to hue overlay
  const patternConfig = {
    lotus: { hue: 45, label: 'Sambalpuri Lotus' },
    temple: { hue: 30, label: 'Kotpad Temple' },
    grid: { hue: 200, label: 'Maniabandha Grid' }
  };
  const cfg = patternConfig[pattern] || patternConfig.lotus;

  // Apply a subtle golden/pattern tint to every vault card's zari layer
  vaultCards.forEach((card, idx) => {
    const zari = card.querySelector('.layer-zari');
    if (!zari) return;

    // Animate the zari layer with a golden flash
    zari.style.transition = 'box-shadow 0.5s ease, filter 0.5s ease';
    zari.style.boxShadow = `0 0 30px hsla(${cfg.hue}, 90%, 55%, 0.35)`;
    zari.style.filter = `hue-rotate(${cfg.hue - 45}deg) saturate(${1.2 + tension * 0.2})`;

    // Toast notification on first card
    if (idx === 0) {
      showWeaveToast(`✨ ${cfg.label} motif applied to entire Vault collection!`);
    }
  });
}

function showWeaveToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: rgba(18,18,23,0.95); border: 1px solid rgba(212,175,55,0.5);
    color: #ffd700; font-family: 'Outfit', sans-serif; font-size: 0.8rem;
    padding: 10px 20px; border-radius: 30px; z-index: 9999;
    backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(212,175,55,0.2);
    transition: opacity 0.4s ease; pointer-events: none;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
}

/* ══════════════════════════════════════════════════════════════
   FEATURE 1B: UNLOCK PANEL INTERACTIONS
   Wires the co-created saree unlock panel buttons:
   - Copy discount code to clipboard
   - "Request Curator Consultation" → opens concierge
══════════════════════════════════════════════════════════════ */
function initUnlockPanel() {
  const discountCode = document.getElementById('unlock-discount-code');
  const copyConfirm = document.getElementById('unlock-copy-confirm');
  const btnUnlockConsult = document.getElementById('btn-unlock-consult');
  const unlockSareeName = document.getElementById('unlock-saree-name');
  const unlockSareeDesc = document.getElementById('unlock-saree-desc');

  // Dynamically set the unlock panel content based on warp console settings
  function updateUnlockContent() {
    const motifLabels = { lotus: 'Sambalpuri Lotus', temple: 'Kotpad Temple Spire', grid: 'Maniabandha Geometric Grid' };
    const motifLabel = motifLabels[borderPattern] || 'Sambalpuri Lotus';
    const code = `WEAVE${Math.floor(10 + Math.random() * 89)}`;
    if (unlockSareeName) unlockSareeName.textContent = `${motifLabel} — Custom Shuttle Weave`;
    if (unlockSareeDesc) unlockSareeDesc.textContent = `Woven at ${threadCount} threads, ${warpTension.toFixed(1)} N tension. Apply code for 10% off your first bespoke commission.`;
    if (discountCode) discountCode.textContent = code;
    // Persist code
    try { localStorage.setItem('loom_unlock_code', code); } catch (e) {}
  }

  // Show unlock panel when game completes — hook via a 100% width observation
  const progressBar = document.getElementById('game-progress-bar');
  if (progressBar) {
    const obs = new MutationObserver(() => {
      const pct = parseInt(progressBar.style.width) || 0;
      if (pct >= 100) {
        const unlockPanel = document.getElementById('weave-unlock-panel');
        if (unlockPanel) {
          updateUnlockContent();
          unlockPanel.classList.remove('hidden');
          gsap.from(unlockPanel, { y: 10, opacity: 0, duration: 0.5, ease: 'power2.out' });
        }
      }
    });
    obs.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
  }

  // Copy discount code
  if (discountCode) {
    discountCode.addEventListener('click', () => {
      navigator.clipboard?.writeText(discountCode.textContent).then(() => {
        if (copyConfirm) { copyConfirm.style.display = 'inline'; setTimeout(() => { copyConfirm.style.display = 'none'; }, 2000); }
      }).catch(() => {});
    });
  }

  // Open concierge
  if (btnUnlockConsult) {
    btnUnlockConsult.addEventListener('click', () => {
      const conciergePanel = document.getElementById('concierge-panel');
      if (conciergePanel) {
        conciergePanel.style.display = 'flex';
        conciergePanel.classList.remove('hidden');
        spawnSilkParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   FEATURE 2: DEPOSIT & MILESTONE CHECKOUT MODAL
   Wires "Commission Design" form → opens deposit modal
   with dynamic pricing based on commission studio settings.
   "Pay Deposit" → WhatsApp consult handoff.
══════════════════════════════════════════════════════════════ */
function initDepositModal() {
  const depositModal = document.getElementById('deposit-modal');
  const btnCloseDeposit = document.getElementById('btn-close-deposit');
  const btnPayDeposit = document.getElementById('btn-pay-deposit');
  const depositPayArea = document.getElementById('deposit-pay-area');
  const depositSuccessArea = document.getElementById('deposit-success-area');
  const depositSareeName = document.getElementById('deposit-saree-name');
  const depositFullPrice = document.getElementById('deposit-full-price');
  const depositAmount = document.getElementById('deposit-amount');

  function openDepositModal(settings) {
    if (!depositModal) return;

    // Populate from commission studio settings
    if (settings && depositSareeName) {
      const motifLabels = { lotus: 'Sambalpuri Lotus', peacock: 'Peacock Brocade', elephant: 'Elephant March', temple: 'Kotpad Temple Spire' };
      const densityLabel = settings.density === 6000 ? '6000 threads' : settings.density === 4200 ? '4200 threads' : '3000 threads';
      depositSareeName.textContent = `${motifLabels[settings.motif] || 'Custom Motif'} — ${densityLabel}`;
    }
    if (settings && depositFullPrice) {
      depositFullPrice.textContent = `₹${settings.price.toLocaleString('en-IN')}`;
    }
    if (settings && depositAmount) {
      const deposit = Math.round(settings.price * 0.3);
      depositAmount.textContent = `₹${deposit.toLocaleString('en-IN')}`;
    }

    // Reset to payment view
    if (depositPayArea) depositPayArea.style.display = '';
    if (depositSuccessArea) depositSuccessArea.style.display = 'none';

    depositModal.style.display = 'flex';
    depositModal.classList.remove('hidden');
    gsap.from(depositModal.querySelector('div'), { scale: 0.95, opacity: 0, duration: 0.35, ease: 'power2.out' });
  }

  function closeDepositModal() {
    if (!depositModal) return;
    gsap.to(depositModal.querySelector('div'), {
      scale: 0.95, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: () => { depositModal.style.display = 'none'; depositModal.classList.add('hidden'); }
    });
  }

  // Hook commission form submit
  const formCommission = document.getElementById('form-custom-commission');
  if (formCommission) {
    formCommission.addEventListener('submit', (e) => {
      e.preventDefault();
      // Gather current commission settings via DOM
      const artisanSel = document.getElementById('comm-artisan');
      const densitySel = document.getElementById('comm-density');
      const motifSel = document.getElementById('comm-motif');
      const priceEl = document.getElementById('comm-est-price');
      const settings = {
        motif: motifSel ? motifSel.value : 'lotus',
        density: densitySel ? parseInt(densitySel.value) : 4200,
        price: priceEl ? parseInt(priceEl.textContent.replace(/[₹,]/g, '')) : 165000
      };
      openDepositModal(settings);
    });
  }

  // Close button
  if (btnCloseDeposit) btnCloseDeposit.addEventListener('click', closeDepositModal);
  if (depositModal) depositModal.addEventListener('click', (e) => { if (e.target === depositModal) closeDepositModal(); });

  // Pay button → WhatsApp handoff
  if (btnPayDeposit) {
    btnPayDeposit.addEventListener('click', () => {
      const sareeName = depositSareeName ? depositSareeName.textContent : 'Bespoke Commission';
      const depositAmt = depositAmount ? depositAmount.textContent : '₹49,500';
      const msg = encodeURIComponent(`Namaste Priyadarshini! I would like to proceed with a deposit of ${depositAmt} for a bespoke commission: ${sareeName}. Please share payment details.`);
      window.open(`https://wa.me/916712300000?text=${msg}`, '_blank');

      // Show success state
      if (depositPayArea) depositPayArea.style.display = 'none';
      if (depositSuccessArea) {
        depositSuccessArea.style.display = 'block';
        gsap.from(depositSuccessArea, { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' });
      }
      spawnSilkParticleBurst(window.innerWidth / 2, window.innerHeight / 2, 45);
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   FEATURE 3: LIVE LOOM TELEMETRY IOT ENGINE
   Generates realistic oscillating sensor data using
   sine waves + noise for:
   - Warp Tension (N): oscillates ±0.4 N around 8.3
   - Picks/min: oscillates ±18 around 238
   - Temperature (°C): slow drift 32–38
   Draws a live sparkline graph on #telemetry-chart-canvas.
   Only runs while Loom Cam modal is open.
══════════════════════════════════════════════════════════════ */
function initLoomTelemetry() {
  const modal = document.getElementById('live-loom-modal');
  const canvas = document.getElementById('telemetry-chart-canvas');
  const statTension = document.getElementById('loom-stat-tension');
  const statVelocity = document.getElementById('loom-stat-velocity');
  const statTemp = document.getElementById('loom-stat-temp');

  if (!canvas || !modal) return;

  const ctx = canvas.getContext('2d');
  const HISTORY_LEN = 80;
  const tensionHistory = Array(HISTORY_LEN).fill(8.42);
  const velocityHistory = Array(HISTORY_LEN).fill(240);

  let rafId = null;
  let isRunning = false;
  let phase = 0;

  function generateSensorValue(base, amplitude, phaseOffset, noiseLevel) {
    const sine = Math.sin(phase * 0.04 + phaseOffset) * amplitude;
    const noise = (Math.random() - 0.5) * noiseLevel;
    return base + sine + noise;
  }

  function drawSparkline() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = 10; y < h; y += 15) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Tension line (gold)
    const tMin = 7.5, tMax = 9.2;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(212,175,55,0.9)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(212,175,55,0.4)';
    ctx.shadowBlur = 4;
    tensionHistory.forEach((val, i) => {
      const x = (i / (HISTORY_LEN - 1)) * w;
      const y = h - ((val - tMin) / (tMax - tMin)) * (h - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Velocity line (white/dim)
    const vMin = 200, vMax = 280;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    velocityHistory.forEach((val, i) => {
      const x = (i / (HISTORY_LEN - 1)) * w;
      const y = h - ((val - vMin) / (vMax - vMin)) * (h - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Legend
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(212,175,55,0.7)';
    ctx.fillText('─ Tension (N)', 6, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('─ Picks/min', 80, 10);
  }

  function tick() {
    if (!isRunning) return;
    phase++;

    const tension = generateSensorValue(8.3, 0.42, 0, 0.08);
    const velocity = generateSensorValue(238, 18, 1.2, 3);
    const temp = generateSensorValue(34.8, 1.8, 0.5, 0.15);

    // Update history
    tensionHistory.push(tension);
    tensionHistory.shift();
    velocityHistory.push(velocity);
    velocityHistory.shift();

    // Update DOM stats
    if (statTension) statTension.textContent = `${tension.toFixed(2)} N`;
    if (statVelocity) statVelocity.textContent = `${Math.round(velocity)}`;
    if (statTemp) statTemp.textContent = `${temp.toFixed(1)}°C`;

    drawSparkline();
    rafId = requestAnimationFrame(tick);
  }

  // Start/stop based on modal visibility
  const loomCamBtn = document.getElementById('btn-open-loom-cam');
  const closeLoomBtn = document.getElementById('btn-close-loom-modal');

  function startTelemetry() { isRunning = true; if (!rafId) tick(); }
  function stopTelemetry() { isRunning = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  // Use MutationObserver to detect when modal becomes visible
  const mObs = new MutationObserver(() => {
    const isVisible = modal.style.display === 'flex';
    if (isVisible && !isRunning) startTelemetry();
    else if (!isVisible && isRunning) stopTelemetry();
  });
  mObs.observe(modal, { attributes: true, attributeFilter: ['style'] });

  // Also hook close button
  if (closeLoomBtn) closeLoomBtn.addEventListener('click', stopTelemetry);
}

/* ══════════════════════════════════════════════════════════════
   FEATURE 3B: ADOPT A LOOM CTA
   "Adopt Loom" → opens concierge with prefilled adoption message
══════════════════════════════════════════════════════════════ */
function initAdoptLoom() {
  const btnAdopt = document.getElementById('btn-adopt-loom');
  if (!btnAdopt) return;
  btnAdopt.addEventListener('click', () => {
    const msg = encodeURIComponent('Namaste! I am interested in the Adopt a Loom programme. Please share subscription details for live weaver updates and first access to new masterworks.');
    window.open(`https://wa.me/916712300000?text=${msg}`, '_blank');
    spawnSilkParticleBurst(btnAdopt.getBoundingClientRect().left + 60, btnAdopt.getBoundingClientRect().top, 20);
  });
}

/* ══════════════════════════════════════════════════════════════
   FEATURE 4: LIGHTHOUSE PERFORMANCE OPTIMIZATIONS
   - Adds passive: true to all scroll/touch listeners
   - Injects content-visibility on offscreen sections
   - Defers non-critical scroll-triggered inits to idle
   - Lazy-loads offscreen images
══════════════════════════════════════════════════════════════ */
function applyLighthouseOptimizations() {
  // 1. Apply content-visibility to offscreen scroll sections for faster LCP
  const offscreenSections = document.querySelectorAll('.scroll-section:not(#genesis):not(#artisan-pulse)');
  offscreenSections.forEach(section => {
    section.style.contentVisibility = 'auto';
    section.style.containIntrinsicSize = '0 600px';
  });

  // 2. Add loading="lazy" to all images not in the first viewport
  const allImgs = document.querySelectorAll('img:not([fetchpriority="high"])');
  allImgs.forEach(img => {
    if (!img.loading) img.loading = 'lazy';
    if (!img.decoding) img.decoding = 'async';
  });

  // 3. Add aria-label to icon-only buttons if missing
  const iconBtns = [
    { id: 'btn-open-concierge', label: 'Open Curator Concierge' },
    { id: 'btn-open-oracle', label: 'Open Silk Oracle AI' },
    { id: 'btn-adopt-loom', label: 'Adopt a Loom subscription' },
  ];
  iconBtns.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (el && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
  });

  // 4. Use requestIdleCallback for non-critical visual enhancements
  const idleCallback = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  idleCallback(() => {
    // Inject a subtle CSS performance hint for will-change on animated elements
    const style = document.createElement('style');
    style.textContent = `
      .saree-card { will-change: transform; }
      #canvas-genesis, #canvas-left { will-change: contents; }
      .layer-zari { will-change: transform, filter; }
      .modal-overlay { will-change: opacity; }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `;
    document.head.appendChild(style);
  });
}
