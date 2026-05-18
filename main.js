/* ----- Klimaatklok 3D — carousel-of-clocks scene ----- */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {
  DATA, MAANDEN, MAANDEN_VOL,
  JAAR_MIN, JAAR_MAX, LAATSTE_GEMETEN_JAAR,
  HUIDIGE_MAAND_INDEX, HUIDIG_JAAR,
  isVoorspelling, maandReeks
} from './data.js';

// =====================================================
//  Renderer + scene + camera
// =====================================================
const canvas = document.getElementById('klok-canvas');
const labelLayer = document.getElementById('label-layer');

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 200);
const CAM_Z_FOCUSED = 14.8;
const CAM_Z_NAVIGATING = 17.5;
const CAM_Z_INTRO_START = 65;
// Off-axis position gives the 3D depth feel — slight 3/4 view of the clock
const CAM_X = -1.6;
const CAM_Y = 1.5;
const LOOK_AT = new THREE.Vector3(0, 0.5, 0);
camera.position.set(CAM_X, CAM_Y, CAM_Z_INTRO_START);
camera.lookAt(LOOK_AT);

// Intro state
const INTRO_DURATION = 2200;   // ms — snel start, lange zachte landing
const introStartTime = performance.now();
let introT = 0;

// =====================================================
//  Lights
// =====================================================
scene.add(new THREE.AmbientLight(0xfff0e8, 0.65));

const keyLight = new THREE.DirectionalLight(0xfff4e4, 1.1);
keyLight.position.set(6, 5, 7);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe8d8f0, 0.55);
fillLight.position.set(-6, -3, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xc8d8f0, 0.45);
rimLight.position.set(0, 2, -10);
scene.add(rimLight);

const accentLight = new THREE.PointLight(0xffffff, 1.2, 8, 2);
accentLight.position.set(0, 0, 5);
scene.add(accentLight);

// OrbitControls for 3D rotation of the focused clock; year navigation is via wheel/trackpad scroll
const controls = new OrbitControls(camera, canvas);
controls.enabled = false;          // enabled after intro
controls.enableDamping = true;
controls.dampingFactor = 0.10;
controls.rotateSpeed = 0.55;
controls.enablePan = false;
controls.enableZoom = false;       // wheel reserved for year navigation
controls.minPolarAngle = Math.PI * 0.05;
controls.maxPolarAngle = Math.PI * 0.95;
controls.target.copy(LOOK_AT);

// =====================================================
//  Carousel — arc-arranged clocks orbiting around a pivot below the viewport
// =====================================================
const ARC_PIVOT = new THREE.Vector3(0, -54.5, 0);   // pivot below viewport
const ARC_RADIUS = 55;                              // distance from pivot to clock
const ARC_DELTA = Math.PI / 22;                     // ~8.2° per year
const CAROUSEL_TOP_Y = ARC_PIVOT.y + ARC_RADIUS;    // ≈ 0.5

// Carousel group sits AT the pivot — rotating this group orbits all clocks around the pivot
const carousel = new THREE.Group();
carousel.position.copy(ARC_PIVOT);
scene.add(carousel);

// Geometric constants for each clock
const R = 3.3;
const SPIKE_BASE_R = R * 0.86;
const SCALE_FACTOR = 0.70;
const CONE_RADIUS = 0.11;
const MIN_SPIKE = 0.10;
const MAG_REF = 4.0;

// =====================================================
//  Kandinsky kleurkanon
// =====================================================
function _lerp(a, b, t) { return a + (b - a) * t; }

const C_BASE_WARM = [255, 240, 246];
const C_BASE_COOL = [240, 248, 255];
const C_PAST_WARM_LO = [255, 180, 210];
const C_PAST_WARM_HI = [200,  20,  90];
const C_FUT_WARM_LO  = [255, 130, 100];
const C_FUT_WARM_HI  = [220,   0,  30];
const C_COOL_LO      = [180, 220, 250];
const C_COOL_HI      = [ 40, 130, 220];

function spikeColors(anomaly, year) {
  const mag = Math.min(Math.abs(anomaly) / MAG_REF, 1);
  const isWarm = anomaly >= 0;
  const isFuture = year > LAATSTE_GEMETEN_JAAR;
  let baseCol, tipCol;
  if (isWarm) {
    baseCol = C_BASE_WARM;
    const tipLo = isFuture ? C_FUT_WARM_LO : C_PAST_WARM_LO;
    const tipHi = isFuture ? C_FUT_WARM_HI : C_PAST_WARM_HI;
    tipCol = [_lerp(tipLo[0], tipHi[0], mag), _lerp(tipLo[1], tipHi[1], mag), _lerp(tipLo[2], tipHi[2], mag)];
  } else {
    baseCol = C_BASE_COOL;
    tipCol = [_lerp(C_COOL_LO[0], C_COOL_HI[0], mag), _lerp(C_COOL_LO[1], C_COOL_HI[1], mag), _lerp(C_COOL_LO[2], C_COOL_HI[2], mag)];
  }
  return { baseCol, tipCol };
}

// =====================================================
//  Klok factory — build one full clock for a year
// =====================================================
function buildSpike(anomaly, year, monthIdx, isCurrentYearAndMonth) {
  const angle = -Math.PI / 2 + (monthIdx / 12) * Math.PI * 2;
  const length = Math.max(Math.abs(anomaly) * SCALE_FACTOR, MIN_SPIKE);
  const isWarm = anomaly >= 0;

  const { baseCol, tipCol } = spikeColors(anomaly, year);
  const geo = new THREE.ConeGeometry(CONE_RADIUS, length, 24);

  const baseColor3 = new THREE.Color().setRGB(baseCol[0]/255, baseCol[1]/255, baseCol[2]/255, THREE.SRGBColorSpace);
  const tipColor3  = new THREE.Color().setRGB(tipCol[0]/255,  tipCol[1]/255,  tipCol[2]/255,  THREE.SRGBColorSpace);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + length / 2) / length;
    const ease = t * t;
    const c = baseColor3.clone().lerp(tipColor3, ease);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const tipHex = (Math.round(tipCol[0]) << 16) | (Math.round(tipCol[1]) << 8) | Math.round(tipCol[2]);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true,
    transparent: false,
    roughness: 0.32, metalness: 0.0,
    clearcoat: 1.0, clearcoatRoughness: 0.10,
    emissive: tipHex,
    emissiveIntensity: isCurrentYearAndMonth ? 0.85 : 0.35
  });
  const cone = new THREE.Mesh(geo, mat);
  cone.rotation.x = isWarm ? Math.PI / 2 : -Math.PI / 2;
  cone.position.set(
    SPIKE_BASE_R * Math.cos(angle),
    SPIKE_BASE_R * Math.sin(angle),
    (isWarm ? 1 : -1) * length / 2
  );
  cone.userData = { year, monthIdx, anomaly, isWarm, isCurrent: isCurrentYearAndMonth };
  return cone;
}

function buildClock(year) {
  const group = new THREE.Group();
  group.userData = { year };

  // --- Concentric wireframe rings ---
  const RING_RADII = [R * 0.20, R * 0.42, R * 0.62, R * 0.82, R];
  RING_RADII.forEach((r, idx) => {
    const pts = [];
    const segs = 144;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
    }
    const isOuter = (idx === RING_RADII.length - 1);
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: isOuter ? 0.30 : 0.10 })
    ));
  });

  // --- 12 radial spokes ---
  for (let m = 0; m < 12; m++) {
    const a = -Math.PI/2 + (m/12) * Math.PI * 2;
    const pts = [
      new THREE.Vector3(R*0.20*Math.cos(a), R*0.20*Math.sin(a), 0),
      new THREE.Vector3(R*Math.cos(a), R*Math.sin(a), 0)
    ];
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 })
    ));
  }

  // --- Central hub + small ring ---
  const hub = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  hub.position.z = 0.001;
  group.add(hub);

  const hubRingPts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    hubRingPts.push(new THREE.Vector3(0.22 * Math.cos(a), 0.22 * Math.sin(a), 0));
  }
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(hubRingPts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  ));

  // --- Hand pointing to current real month (Mei) ---
  const handLen = R * 0.80;
  const handGeo = new THREE.BoxGeometry(0.025, handLen, 0.012);
  handGeo.translate(0, handLen / 2, 0);
  const hand = new THREE.Mesh(handGeo, new THREE.MeshBasicMaterial({ color: 0xff5544, transparent: true, opacity: 0.95 }));
  hand.position.z = 0.05;
  const HAND_BASE = -Math.PI/2 + (HUIDIGE_MAAND_INDEX/12) * Math.PI * 2;
  hand.rotation.z = HAND_BASE - Math.PI/2;
  hand.userData.handBase = HAND_BASE;
  group.add(hand);
  group.userData.hand = hand;

  const tipGeo = new THREE.SphereGeometry(0.05, 16, 16);
  tipGeo.translate(0, handLen + 0.05, 0);
  const tip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({ color: 0xff5544, transparent: true, opacity: 1.0 }));
  tip.position.copy(hand.position);
  tip.rotation.copy(hand.rotation);
  group.add(tip);
  group.userData.tip = tip;

  // --- Spikes for this year ---
  const spikeGroup = new THREE.Group();
  const values = DATA[year];
  if (values) {
    values.forEach((anomaly, m) => {
      if (anomaly == null || isNaN(anomaly)) return;
      const isCurrent = (year === HUIDIG_JAAR && m === HUIDIGE_MAAND_INDEX);
      spikeGroup.add(buildSpike(anomaly, year, m, isCurrent));
    });
  }
  group.add(spikeGroup);
  group.userData.spikeGroup = spikeGroup;

  return group;
}

// =====================================================
//  Bouw alle klokken (2015-2040) op de boog
// =====================================================
const clocks = new Map();

// Clocks are positioned relative to carousel (which sits at ARC_PIVOT)
// Top of arc = (0, ARC_RADIUS, 0). Each year offsets by ARC_DELTA radians.
function clockLocalPosition(offsetYears) {
  const angle = offsetYears * ARC_DELTA;
  return {
    pos: new THREE.Vector3(
      ARC_RADIUS * Math.sin(angle),
      ARC_RADIUS * Math.cos(angle),
      0
    ),
    rotZ: -angle
  };
}

for (let y = JAAR_MIN; y <= JAAR_MAX; y++) {
  const c = buildClock(y);
  const offset = y - HUIDIG_JAAR;
  const { pos, rotZ } = clockLocalPosition(offset);
  c.position.copy(pos);
  c.rotation.z = rotZ;
  carousel.add(c);
  clocks.set(y, c);
}

// Carousel rotation state — rotating around ARC_PIVOT (i.e., carousel's local origin)
let carouselRotation = 0;
let targetCarouselRotation = 0;
const DRAG_SENSITIVITY = ARC_DELTA / 210; // 210 px per jaar — rustig en controleerbaar

// =====================================================
//  Center sub-dial: jaar-gemiddelde under the hub
// =====================================================
const yearAvgEl = document.createElement('div');
yearAvgEl.className = 'year-avg-label';
yearAvgEl.innerHTML = '<span class="big">+0,0 °C</span><span class="small">JAARGEMIDDELDE</span>';
labelLayer.appendChild(yearAvgEl);
const yearAvgPos3d = new THREE.Vector3(0, -1.05, 0.06);

function updateYearAvg() {
  const focused = clocks.get(currentYear);
  if (!focused) {
    yearAvgEl.style.display = 'none';
    return;
  }
  const row = DATA[currentYear] || [];
  const valid = row.filter(v => v != null && !isNaN(v));
  if (valid.length === 0) {
    yearAvgEl.style.display = 'none';
    return;
  }
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const sign = avg >= 0 ? '+' : '−';
  const label = currentYear > LAATSTE_GEMETEN_JAAR
    ? `VOORSPELD GEMIDDELDE · ${currentYear}`
    : (valid.length < 12
      ? `GEMIDDELDE · ${currentYear} · ${valid.length}/12 MND`
      : `JAARGEMIDDELDE · ${currentYear}`);
  yearAvgEl.innerHTML = `<span class="big">${sign}${Math.abs(avg).toFixed(1).replace('.', ',')}&thinsp;°C</span><span class="small">${label}</span>`;

  const _vy = yearAvgPos3d.clone();
  focused.localToWorld(_vy);
  _vy.project(camera);
  const x = (_vy.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-_vy.y * 0.5 + 0.5) * window.innerHeight;
  yearAvgEl.style.left = x + 'px';
  yearAvgEl.style.top = y + 'px';
  yearAvgEl.style.opacity = (_vy.z < 1) ? '1' : '0';
  yearAvgEl.style.display = '';
}

// =====================================================
//  Month labels — overlay synced to currently focused clock
// =====================================================
const labelPoints = [];
const LABEL_R = R * 1.10;
for (let m = 0; m < 12; m++) {
  const angle = -Math.PI / 2 + (m / 12) * Math.PI * 2;
  const el = document.createElement('div');
  el.className = 'month-label';
  el.textContent = MAANDEN[m];
  if (m === HUIDIGE_MAAND_INDEX) el.classList.add('current');
  labelLayer.appendChild(el);
  labelPoints.push({
    el,
    pos3d: new THREE.Vector3(LABEL_R * Math.cos(angle), LABEL_R * Math.sin(angle), 0)
  });
}

const _v = new THREE.Vector3();
function updateLabels() {
  const focused = clocks.get(currentYear);
  if (!focused) return;
  const w = window.innerWidth, h = window.innerHeight;
  for (const lp of labelPoints) {
    _v.copy(lp.pos3d);
    focused.localToWorld(_v);
    _v.project(camera);
    const x = (_v.x * 0.5 + 0.5) * w;
    const y = (-_v.y * 0.5 + 0.5) * h;
    lp.el.style.left = x + 'px';
    lp.el.style.top = y + 'px';
    lp.el.style.opacity = (_v.z < 1) ? '0.85' : '0';
  }
}

// =====================================================
//  Year + era management
// =====================================================
let currentYear = HUIDIG_JAAR;
const yearDisplay = document.getElementById('year-display');
const yearMeta = document.getElementById('year-meta');

function eraClass(year) {
  if (year < HUIDIG_JAAR)       return 'era-past';
  if (year === HUIDIG_JAAR)     return 'era-now';
  if (year <= HUIDIG_JAAR + 7)  return 'era-future-near';
  return 'era-future-far';
}
function metaText(year) {
  if (year === HUIDIG_JAAR)  return '<span class="pulse"></span>Mei · nu';
  if (isVoorspelling(year))  return 'Voorspelling · ' + (year - HUIDIG_JAAR) + 'j vooruit';
  return 'Gemeten · ' + (HUIDIG_JAAR - year) + 'j geleden';
}
let isEditingYear = false;

function setYear(y) {
  y = Math.max(JAAR_MIN, Math.min(JAAR_MAX, y));
  currentYear = y;
  if (!isEditingYear) yearDisplay.textContent = y;
  yearMeta.innerHTML = metaText(y);
  // Preserve user-engaged class
  const engaged = document.body.classList.contains('user-engaged');
  document.body.className = eraClass(y) + (engaged ? ' user-engaged' : '');

  labelPoints.forEach((lp, m) => {
    lp.el.classList.toggle('current', y === HUIDIG_JAAR && m === HUIDIGE_MAAND_INDEX);
  });
  // Visibility/scale handled in animate loop for smooth fade
}

function setTargetYear(y) {
  y = Math.max(JAAR_MIN, Math.min(JAAR_MAX, y));
  const offset = y - HUIDIG_JAAR;
  targetCarouselRotation = offset * ARC_DELTA;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft')  { setTargetYear(currentYear - 1); markEngaged(); }
  if (e.key === 'ArrowRight') { setTargetYear(currentYear + 1); markEngaged(); }
  if (e.key === 'Escape')     closeDetail();
});

function markEngaged() {
  document.body.classList.add('user-engaged');
}

// --- Help toggle: re-show drag hint when ? clicked ---
const helpBtn = document.getElementById('help-btn');
let helpTimer = null;
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    document.body.classList.add('help-open');
    clearTimeout(helpTimer);
    helpTimer = setTimeout(() => document.body.classList.remove('help-open'), 4000);
  });
}

// --- Click year readout to type a specific jaar ---
yearDisplay.style.cursor = 'text';
yearDisplay.style.pointerEvents = 'auto';
yearDisplay.addEventListener('click', () => {
  if (isEditingYear) return;
  isEditingYear = true;
  markEngaged();

  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.maxLength = 4;
  input.value = currentYear;
  input.className = 'yr-input';

  yearDisplay.textContent = '';
  yearDisplay.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const v = parseInt(input.value, 10);
    isEditingYear = false;
    if (!isNaN(v)) {
      const clamped = Math.max(JAAR_MIN, Math.min(JAAR_MAX, v));
      setTargetYear(clamped);
    }
    yearDisplay.textContent = currentYear;
  }
  function cancel() {
    isEditingYear = false;
    yearDisplay.textContent = currentYear;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')   { e.preventDefault(); commit(); }
    if (e.key === 'Escape')  { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => {
    if (isEditingYear) commit();
  });
});

// =====================================================
//  Interaction: drag = 3D orbit (OrbitControls), wheel = year navigation
// =====================================================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function allSpikes() {
  const out = [];
  clocks.forEach(c => { for (const s of c.userData.spikeGroup.children) out.push(s); });
  return out;
}

// --- Click detection (no-drag → open detail) ---
let clickPressX = 0, clickPressY = 0, clickStarted = false;
canvas.addEventListener('pointerdown', (e) => {
  clickPressX = e.clientX;
  clickPressY = e.clientY;
  clickStarted = true;
});
canvas.addEventListener('pointerup', (e) => {
  if (!clickStarted) return;
  clickStarted = false;
  const dx = Math.abs(e.clientX - clickPressX);
  const dy = Math.abs(e.clientY - clickPressY);
  if (dx < 5 && dy < 5) {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(allSpikes(), false);
    if (hits.length) openDetail(hits[0].object.userData);
  }
});

// --- Wheel / trackpad scroll → navigate years ---
let wheelAccum = 0;
let lastWheelTime = 0;
const WHEEL_PX_PER_YEAR = 110;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  // Use whichever axis has more energy (trackpad horizontal, mouse vertical)
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  wheelAccum += d;
  lastWheelTime = performance.now();
  while (wheelAccum >= WHEEL_PX_PER_YEAR) {
    setTargetYear(currentYear + 1);
    markEngaged();
    wheelAccum -= WHEEL_PX_PER_YEAR;
  }
  while (wheelAccum <= -WHEEL_PX_PER_YEAR) {
    setTargetYear(currentYear - 1);
    markEngaged();
    wheelAccum += WHEEL_PX_PER_YEAR;
  }
}, { passive: false });

// =====================================================
//  Detail overlay
// =====================================================
const detailEl = document.getElementById('detail');
function openDetail({ year, monthIdx, anomaly, isWarm }) {
  document.getElementById('dt-year').textContent = year + (isVoorspelling(year) ? ' · voorspelling' : '');
  document.getElementById('dt-month').textContent = MAANDEN_VOL[monthIdx];
  const anomEl = document.getElementById('dt-anom');
  anomEl.textContent = (anomaly >= 0 ? '+' : '') + anomaly.toFixed(1).replace('.', ',') + ' °C';
  anomEl.className = 'dt-anom' + (anomaly < 0 ? ' cool' : '');
  document.getElementById('dt-label').textContent =
    isWarm ? 'warmer dan klimaatnorm 1991–2020' : 'kouder dan klimaatnorm 1991–2020';
  renderMonthChart(monthIdx, year);
  detailEl.hidden = false;
}
function closeDetail() { detailEl.hidden = true; }
document.getElementById('detail-close').addEventListener('click', closeDetail);

function renderMonthChart(monthIdx, highlightYear) {
  const series = maandReeks(monthIdx);
  const chart = document.getElementById('month-chart');
  chart.innerHTML = '';
  const W = chart.clientWidth || 800;
  const H = chart.clientHeight || 320;
  const pad = { top: 28, right: 24, bottom: 36, left: 50 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const vals = series.map(s => s.anomaly);
  const yMax = Math.max(4, Math.ceil(Math.max(...vals) + 0.5));
  const yMin = Math.min(-1, Math.floor(Math.min(...vals) - 0.5));
  const yScale = v => pad.top + plotH * (1 - (v - yMin) / (yMax - yMin));
  const xStep = plotW / series.length;
  const barW = xStep * 0.62;
  const xFor = i => pad.left + i * xStep + xStep / 2 - barW / 2;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Y-axis grid + labels (per integer degree)
  for (let v = yMin; v <= yMax; v++) {
    const gy = yScale(v);
    if (v !== 0) {
      const grid = document.createElementNS(NS, 'line');
      grid.setAttribute('x1', pad.left); grid.setAttribute('x2', W - pad.right);
      grid.setAttribute('y1', gy); grid.setAttribute('y2', gy);
      grid.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      svg.appendChild(grid);
    }
    const lbl = document.createElementNS(NS, 'text');
    lbl.setAttribute('x', pad.left - 10); lbl.setAttribute('y', gy + 3);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('fill', 'rgba(255,255,255,0.45)');
    lbl.setAttribute('font-size', '10');
    lbl.setAttribute('font-variant-numeric', 'tabular-nums');
    lbl.textContent = (v > 0 ? '+' : '') + v + '°';
    svg.appendChild(lbl);
  }

  // Zero baseline (highlighted)
  const zero = document.createElementNS(NS, 'line');
  zero.setAttribute('x1', pad.left); zero.setAttribute('x2', W - pad.right);
  zero.setAttribute('y1', yScale(0)); zero.setAttribute('y2', yScale(0));
  zero.setAttribute('stroke', 'rgba(255,255,255,0.32)');
  zero.setAttribute('stroke-dasharray', '2 3');
  svg.appendChild(zero);

  // Past/voorspelling separator
  const nowIdx = HUIDIG_JAAR - JAAR_MIN;
  const sepX = pad.left + (nowIdx + 0.5) * xStep;
  const sep = document.createElementNS(NS, 'line');
  sep.setAttribute('x1', sepX); sep.setAttribute('x2', sepX);
  sep.setAttribute('y1', pad.top); sep.setAttribute('y2', H - pad.bottom);
  sep.setAttribute('stroke', '#c8d4e8'); sep.setAttribute('stroke-width', '0.6'); sep.setAttribute('opacity', '0.4');
  sep.setAttribute('stroke-dasharray', '3 3');
  svg.appendChild(sep);

  // Bars
  series.forEach((s, i) => {
    const x = xFor(i);
    const y0 = s.anomaly >= 0 ? yScale(s.anomaly) : yScale(0);
    const h = Math.abs(yScale(s.anomaly) - yScale(0));
    const color = s.anomaly >= 0 ? '#e89db5' : '#93b8dc';
    const bar = document.createElementNS(NS, 'rect');
    bar.setAttribute('x', x); bar.setAttribute('y', y0); bar.setAttribute('width', barW); bar.setAttribute('height', h);
    bar.setAttribute('fill', color);
    bar.setAttribute('rx', '1');
    if (s.voorspelling) {
      bar.setAttribute('opacity', '0.55');
      bar.setAttribute('stroke', color); bar.setAttribute('stroke-width', '0.6');
    }
    if (s.year === highlightYear) {
      bar.setAttribute('stroke', '#ffffff'); bar.setAttribute('stroke-width', '1.6');
    }
    svg.appendChild(bar);
  });

  // 10-year rolling average line
  const avgPoints = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - 4);
    const end = Math.min(series.length, i + 5);
    let sum = 0, n = 0;
    for (let j = start; j < end; j++) { sum += series[j].anomaly; n++; }
    avgPoints.push({ x: xFor(i) + barW / 2, y: yScale(sum / n) });
  }
  const avgPath = document.createElementNS(NS, 'path');
  let d = `M ${avgPoints[0].x} ${avgPoints[0].y}`;
  for (let i = 1; i < avgPoints.length; i++) d += ` L ${avgPoints[i].x} ${avgPoints[i].y}`;
  avgPath.setAttribute('d', d);
  avgPath.setAttribute('fill', 'none');
  avgPath.setAttribute('stroke', '#ffffff');
  avgPath.setAttribute('stroke-width', '1.6');
  avgPath.setAttribute('opacity', '0.78');
  svg.appendChild(avgPath);

  // X-axis: every 5 years + highlight year
  series.forEach((s, i) => {
    if (s.year % 5 !== 0 && s.year !== highlightYear) return;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', xFor(i) + barW / 2);
    t.setAttribute('y', H - pad.bottom + 16);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', s.year === highlightYear ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)');
    t.setAttribute('font-size', '10');
    t.setAttribute('font-weight', s.year === highlightYear ? '700' : '400');
    t.setAttribute('font-variant-numeric', 'tabular-nums');
    t.textContent = s.year;
    svg.appendChild(t);
  });

  // Sep label
  const sepLbl = document.createElementNS(NS, 'text');
  sepLbl.setAttribute('x', sepX + 6); sepLbl.setAttribute('y', pad.top + 11);
  sepLbl.setAttribute('fill', 'rgba(200,212,232,0.7)');
  sepLbl.setAttribute('font-size', '9');
  sepLbl.setAttribute('letter-spacing', '0.18em');
  sepLbl.textContent = 'VOORSPELLING →';
  svg.appendChild(sepLbl);

  chart.appendChild(svg);
}

// =====================================================
//  Animation loop
// =====================================================
const _clock = new THREE.Clock();
let tickPhase = 0;
let lastSecond = -1;

function animate() {
  requestAnimationFrame(animate);
  const t = _clock.getElapsedTime();
  const now = performance.now();

  // --- Intro animation: camera dolly-in from far to focused ---
  introT = Math.max(0, Math.min(1, (now - introStartTime) / INTRO_DURATION));
  const introEased = 1 - Math.pow(1 - introT, 5);   // ease out quintic — strong deceleration toward "nu"
  const introDone = introT >= 1;

  // --- Camera Z (intro dolly only). After intro, OrbitControls owns the camera. ---
  if (!introDone) {
    const camTargetZ = CAM_Z_INTRO_START + (CAM_Z_FOCUSED - CAM_Z_INTRO_START) * introEased;
    camera.position.z += (camTargetZ - camera.position.z) * 0.10;
    camera.lookAt(LOOK_AT);
  } else if (!controls.enabled) {
    controls.enabled = true;
    controls.update();
  }

  // --- Clock visibility: show all during intro or while scrolling years; otherwise only current ---
  const recentlyScrolling = (now - lastWheelTime) < 700;
  const showAll = !introDone || recentlyScrolling;
  clocks.forEach((clock, year) => {
    const isCurrent = (year === currentYear);
    const targetScale = (showAll || isCurrent) ? 1 : 0;
    const ns = clock.scale.x + (targetScale - clock.scale.x) * 0.18;
    clock.scale.set(ns, ns, ns);
    if (clock.userData.spikeGroup) clock.userData.spikeGroup.visible = (showAll || isCurrent);
    if (clock.userData.hand) clock.userData.hand.visible = isCurrent;
    if (clock.userData.tip)  clock.userData.tip.visible  = isCurrent;
  });

  // Add body class once intro completes (un-hides HUD via CSS)
  if (introDone && !document.body.classList.contains('intro-done')) {
    document.body.classList.add('intro-done');
  }

  // --- Smooth carousel rotation toward target year ---
  carouselRotation += (targetCarouselRotation - carouselRotation) * 0.16;
  carousel.rotation.z = carouselRotation;

  // Snap currentYear to whichever clock is closest to top-center
  const offset = Math.round(carouselRotation / ARC_DELTA);
  const newYear = Math.max(JAAR_MIN, Math.min(JAAR_MAX, HUIDIG_JAAR + offset));
  if (newYear !== currentYear) setYear(newYear);

  // --- Hand tick on focused clock ---
  const sec = Math.floor(t);
  if (sec !== lastSecond) { lastSecond = sec; tickPhase = 1; }
  tickPhase *= 0.85;
  const jitter = tickPhase * 0.025 * Math.sin(t * 50);
  const focused = clocks.get(currentYear);
  if (focused) {
    const hand = focused.userData.hand;
    const tip  = focused.userData.tip;
    if (hand) {
      const target = hand.userData.handBase - Math.PI / 2 + jitter;
      hand.rotation.z = target;
      tip.rotation.z = target;
    }
    if (currentYear === HUIDIG_JAAR) {
      focused.userData.spikeGroup.children.forEach(c => {
        if (c.userData.isCurrent) {
          c.material.emissiveIntensity = 0.55 + 0.3 * Math.sin(t * 2.4);
        }
      });
    }
  }

  if (controls.enabled) controls.update();
  updateLabels();
  updateYearAvg();
  renderer.render(scene, camera);
}

// =====================================================
//  Resize
// =====================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =====================================================
//  Boot
// =====================================================
setYear(HUIDIG_JAAR);
animate();
window.__klokBooted = true;
