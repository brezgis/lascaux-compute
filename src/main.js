// main.js — the visit. Builds the cave, lights the torch, paints the panels
// (in workers, nearest first, while you walk), and runs the loop: walking,
// gazing, plaques, chamber names, the survey map.

import * as THREE from 'three';
import { PAINTINGS } from './paintings.js';
import { buildField, meshFromField, makeRockMaterial, solveAnchor, LAYOUT, CHAMBER_ZONES, PLACEMENTS } from './cave.js';
import { scatterPaintings, makeDecalProjector } from './scatter.js';
import { makeTorch } from './torch.js';
import { makeAmbience } from './audio.js';
import { makePlayer } from './player.js';
import { makeBaker } from './baker.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // headless screenshot mode
const TOUCH = matchMedia('(pointer: coarse)').matches;
document.body.classList.toggle('touch', TOUCH);

// per-visitor memory; storage can be missing or throw (private windows)
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* no memory */ } },
};

// ------------------------------------------------------------ renderer/scene

const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
// full device resolution (capped at 2); the frame governor below may lower
// the cap on a GPU that cannot keep up
let dprCap = 2;
const applySize = () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.FogExp2(0x060402, 0.05);

const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 130);
scene.add(camera);
scene.add(new THREE.AmbientLight(0x2a2018, 0.5));
applySize();
window.addEventListener('resize', applySize);

// ---------------------------------------------------------------- the build

const enterEl = $('#enter');
// load statistics, readable from the console (and by the screenshot scripts)
const stats = { panels: 0, lesser: 0, painted: 0, ms: {} };
window.__grotte = stats;
stats.where = () => player && [+player.pos.x.toFixed(2), +player.pos.z.toFixed(2), +player.yaw.toFixed(2)];

const anchors = [];   // {painting, pos, normal, k, mesh, mat, fade}
const ambience = makeAmbience();
let sdf = null, player = null, torch = null;

// panel texel density (texels per metre of rock): sharp enough for a close
// look on a retina screen, gentler on phones' texture memory
const SMALL = Math.min(window.innerWidth, window.innerHeight) < 700 || TOUCH;
const DENSITY = SMALL ? 260 : (window.devicePixelRatio >= 1.5 ? 450 : 340);
const maxAniso = renderer.capabilities.getMaxAnisotropy();

const frame = () => new Promise((r) => requestAnimationFrame(r));

async function build() {
  await frame();
  let t = performance.now();
  sdf = buildField();
  stats.ms.field = Math.round(performance.now() - t);

  t = performance.now();
  const caveMesh = new THREE.Mesh(meshFromField(sdf), makeRockMaterial(maxAniso));
  stats.triangles = caveMesh.geometry.index.count / 3;
  scene.add(caveMesh);
  stats.ms.mesh = Math.round(performance.now() - t);

  // plaqued panels: decals flush on the rock, hidden until their pigment
  // arrives from the bakers. A blank 1×1 map from the start means the
  // painted texture swaps in without a shader recompile.
  t = performance.now();
  const projector = makeDecalProjector(caveMesh);
  const helper = new THREE.Object3D();
  for (const p of PAINTINGS) {
    const spec = PLACEMENTS[p.id];
    if (!spec) { console.warn('no placement for panel', p.id); continue; }
    const { pos, normal } = solveAnchor(sdf, spec);
    helper.position.copy(pos);
    // ceilings: a vertical up-vector is degenerate against a downward normal,
    // so the placement names the compass direction of the panel's top
    if (Math.abs(normal.y) > 0.7) {
      const top = spec.top || [-spec.dir[0], -spec.dir[1]];
      helper.up.set(top[0], 0, top[1]).normalize();
    } else helper.up.set(0, 1, 0);
    helper.lookAt(pos.clone().add(normal));
    const size = new THREE.Vector3(p.size[0], p.size[1], 1.6);
    const dgeo = projector.filterFacing(projector.project(pos, helper.rotation, size), normal, 0.1);
    if (!dgeo) { console.warn('panel found no rock', p.id); continue; }
    const mat = new THREE.MeshStandardMaterial({
      map: blank, transparent: true, opacity: 0, roughness: 0.97, metalness: 0,
      polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false,
    });
    const mesh = new THREE.Mesh(dgeo, mat);
    mesh.renderOrder = 2; // plaqued panels draw over any scattered figure
    mesh.visible = false;
    scene.add(mesh);
    const k = Math.max(0.45, Math.min(1.6, DENSITY * p.size[0] / p.w));
    anchors.push({ painting: p, pos, normal, k, mesh, mat, fade: -1 });
  }
  stats.panels = anchors.length;
  stats.ms.panels = Math.round(performance.now() - t);

  t = performance.now();
  stats.lesser = scatterPaintings({ sdf, scene, avoid: anchors, projector, pigment }).length;
  stats.ms.lesser = Math.round(performance.now() - t);

  // ------------------ entrance: sealed daylight
  const glowC = document.createElement('canvas');
  glowC.width = glowC.height = 128;
  const gx = glowC.getContext('2d');
  const gr = gx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(214, 228, 240, 0.9)');
  gr.addColorStop(0.5, 'rgba(160, 180, 205, 0.28)');
  gr.addColorStop(1, 'rgba(120, 140, 170, 0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowC), transparent: true, opacity: 0.55, depthWrite: false,
  }));
  glow.position.set(0, 2.85, 45.2);
  glow.scale.set(2.1, 1.6, 1);
  scene.add(glow);
  const dayLight = new THREE.PointLight(0xbccfe2, 4, 10, 1.8);
  dayLight.position.set(0, 2.7, 44.6);
  scene.add(dayLight);

  // ------------------ calcite glints
  const glints = [];
  let attempts = 0;
  while (glints.length < 260 && attempts++ < 8000) {
    const ch = LAYOUT.chambers[(Math.random() * LAYOUT.chambers.length) | 0];
    const x = ch.c[0] + (Math.random() - 0.5) * ch.rx * 2.2;
    const z = ch.c[1] + (Math.random() - 0.5) * ch.rz * 2.2;
    const y = ch.f + Math.random() * ch.ry * 1.7;
    const s = sdf.sample(x, y, z);
    if (s > -0.55 && s < -0.12) glints.push(x, y, z);
  }
  const glintGeo = new THREE.BufferGeometry();
  glintGeo.setAttribute('position', new THREE.Float32BufferAttribute(glints, 3));
  const glintC = document.createElement('canvas');
  glintC.width = glintC.height = 32;
  const glx = glintC.getContext('2d');
  const glg = glx.createRadialGradient(16, 16, 1, 16, 16, 15);
  glg.addColorStop(0, 'rgba(255,244,220,1)');
  glg.addColorStop(0.5, 'rgba(255,244,220,0.25)');
  glg.addColorStop(1, 'rgba(255,244,220,0)');
  glx.fillStyle = glg; glx.fillRect(0, 0, 32, 32);
  scene.add(new THREE.Points(glintGeo, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(glintC),
    color: 0xfff2d8, size: 0.03, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // ------------------ the crew
  torch = makeTorch(camera, scene);
  player = makePlayer(camera, sdf, canvas);
  // footfalls: louder when hurrying, with more cave in them in big chambers
  player.onStep = (pace) => {
    const z = zoneAt(player.pos);
    ambience.step(pace, z ? Math.min(1, z.r / 9.5) : 0.15);
  };
}

const zoneAt = (p) => CHAMBER_ZONES.find((z) => Math.hypot(p.x - z.x, p.z - z.z) < z.r) || null;

// -------------------------------------------------------------- the painting

// Everything painted (the lesser figures first, they are small; then the
// panels, nearest to the visitor first) is painted in workers. Decals wait
// hidden with a blank 1×1 map, so the painted texture swaps in without a
// shader recompile; panels then fade up on the rock.
const baker = makeBaker();
const blank = new THREE.DataTexture(new Uint8Array(4), 1, 1);
blank.needsUpdate = true;
const motifs = new Map();      // 'kind:variant' → { job, users: [{ mat, mesh }] }
const motifQueue = [];
const unpainted = new Set();
const arrived = [];            // finished pixels, waiting for upload

function pigment(kind, variant, mat, mesh) {
  const key = kind + ':' + variant;
  let m = motifs.get(key);
  if (!m) {
    m = { job: { motif: kind, variant }, users: [] };
    motifs.set(key, m);
    motifQueue.push(m);
  }
  mat.map = blank;
  mesh.visible = false;
  m.users.push({ mat, mesh });
}

function feedBaker() {
  while (baker.free > 0 && (motifQueue.length || unpainted.size)) {
    if (motifQueue.length) {
      const m = motifQueue.shift();
      baker.bake(m.job).then((r) => arrived.push({ r, hang: (tex) => {
        for (const u of m.users) { u.mat.map = tex; u.mesh.visible = true; }
      } }));
      continue;
    }
    let best = null, bestD = Infinity;
    for (const a of unpainted) {
      const d = a.pos.distanceToSquared(camera.position);
      if (d < bestD) { bestD = d; best = a; }
    }
    unpainted.delete(best);
    baker.bake({ panel: best.painting.id, k: best.k }).then((r) => arrived.push({ r, hang: (tex) => {
      best.mat.map = tex;
      best.mesh.visible = true;
      best.fade = 0;
      if (++stats.painted === anchors.length) stats.ms.allPainted = Math.round(performance.now());
    } }));
  }
}

// upload what has arrived, a few milliseconds' worth per frame
function hangArrived() {
  const t0 = performance.now();
  while (arrived.length && performance.now() - t0 < 3) {
    const { r, hang } = arrived.shift();
    const tex = new THREE.DataTexture(r.data, r.width, r.height);
    tex.flipY = true;                         // canvas rows run top-down
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.min(8, maxAniso);
    tex.needsUpdate = true;
    // once on the GPU, let go of the CPU copy (fifty panels' worth adds up)
    tex.onUpdate = () => { tex.image.data = null; };
    renderer.initTexture(tex);
    hang(tex);
  }
}

// ------------------------------------------------------------------- plaques

const plaqueEl = $('#plaque');
const P = {
  title: $('#plaque .p-title'), date: $('#plaque .p-date'), who: $('#plaque .p-by'), body: $('#plaque .p-body'),
};
const seen = new Set(store.get('grotte-seen', []));
let plaqueShown = null, plaqueGrace = 0;

const fwd = new THREE.Vector3();
const toAnchor = new THREE.Vector3();

function updatePlaque(dt) {
  camera.getWorldDirection(fwd);
  let best = null, bestScore = 0;
  for (const a of anchors) {
    toAnchor.subVectors(a.pos, camera.position);
    const dist = toAnchor.length();
    const maxD = a.painting.maxD || (a.painting.size[0] > 3.4 ? 6.5 : 4.4);
    if (dist > maxD || dist < 0.4) continue;
    toAnchor.divideScalar(dist);
    const facing = fwd.dot(toAnchor);
    // a little stickiness for the plaque already up, so it doesn't flicker
    if (facing < (a === plaqueShown ? 0.72 : 0.78)) continue;
    const score = facing / (0.6 + dist * 0.25) * (a === plaqueShown ? 1.1 : 1);
    if (score > bestScore) { bestScore = score; best = a; }
  }
  // looking away: hold the plaque a moment before it sinks
  if (!best && plaqueShown) {
    plaqueGrace += dt;
    if (plaqueGrace < 0.5) return;
  }
  plaqueGrace = 0;
  if (best === plaqueShown) return;
  plaqueShown = best;
  if (!best) { plaqueEl.classList.remove('show'); return; }
  const p = best.painting;
  P.title.textContent = p.title;
  P.date.textContent = p.date;
  P.who.textContent = p.who;
  P.body.textContent = p.body;
  plaqueEl.classList.add('show');
  if (!seen.has(p.id)) { seen.add(p.id); store.set('grotte-seen', [...seen]); }
}


// -------------------------------------------------------- names and hints

const toastEl = $('#toast');
let currentZone = null, toastTimer = 0, zonesVisited = 0;
const titleCase = (s) => s.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase())
  .replace(/ (Of|The|And)(?= )/g, (m) => m.toLowerCase());

function updateToasts(dt) {
  const inZone = zoneAt(player.pos);
  if (inZone && inZone !== currentZone) {
    currentZone = inZone;
    $('#toast .t-name').textContent = titleCase(inZone.name);
    $('#toast .t-sub').textContent = inZone.sub;
    toastEl.classList.add('show');
    toastTimer = 3.6;
    if (++zonesVisited === 2) hint('#hintKeys', 6, 4.2);
  }
  if (!inZone && currentZone) {
    // require actually leaving (with hysteresis) before re-arming
    const z = currentZone;
    if (Math.hypot(player.pos.x - z.x, player.pos.z - z.z) > z.r + 2) currentZone = null;
  }
  if (toastTimer > 0 && (toastTimer -= dt) <= 0) toastEl.classList.remove('show');
}

// each hint shows once per visitor, then never again
const hinted = new Set(store.get('grotte-hinted', []));
const hintTimers = {};
function hint(sel, seconds, delay = 0) {
  if (hinted.has(sel) || SHOT) return;
  hinted.add(sel);
  store.set('grotte-hinted', [...hinted]);
  setTimeout(() => {
    $(sel).classList.add('show');
    hintTimers[sel] = setTimeout(() => $(sel).classList.remove('show'), seconds * 1000);
  }, delay * 1000);
}
function unhint(sel) {
  clearTimeout(hintTimers[sel]);
  $(sel).classList.remove('show');
}

// ------------------------------------------------------------------ the map

const mapEl = $('#map');
const mapCanvas = $('#mapCanvas');
let mapOpen = false;

// survey bounds, from the layout itself (with a margin), so new wings
// never fall off the edge of the map
const MAP_B = (() => {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const t of LAYOUT.tubes) for (const [x, z] of t.pts) {
    x0 = Math.min(x0, x - t.r); x1 = Math.max(x1, x + t.r); z0 = Math.min(z0, z - t.r); z1 = Math.max(z1, z + t.r);
  }
  for (const c of LAYOUT.chambers) {
    x0 = Math.min(x0, c.c[0] - c.rx); x1 = Math.max(x1, c.c[0] + c.rx);
    z0 = Math.min(z0, c.c[1] - c.rz); z1 = Math.max(z1, c.c[1] + c.rz);
  }
  return { x0: x0 - 2, x1: x1 + 2, z0: z0 - 2, z1: z1 + 3 };
})();

function drawMap() {
  // CSS size fits the window; the backing store is at device resolution
  const aspect = (MAP_B.x1 - MAP_B.x0) / (MAP_B.z1 - MAP_B.z0);
  const Hc = Math.min(window.innerHeight - 140, 680), W = Math.min(window.innerWidth - 32, Hc * aspect + 36);
  const dpr = window.devicePixelRatio || 1;
  if (mapCanvas.width !== Math.round(W * dpr)) {
    mapCanvas.width = Math.round(W * dpr); mapCanvas.height = Math.round(Hc * dpr);
    mapCanvas.style.width = W + 'px'; mapCanvas.style.height = Hc + 'px';
  }
  const x = mapCanvas.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, Hc);
  // world → map, uniform scale; entrance (+z) at the bottom
  const pad = 18;
  const sc = Math.min((W - pad * 2) / (MAP_B.x1 - MAP_B.x0), (Hc - pad * 2 - 24) / (MAP_B.z1 - MAP_B.z0));
  const ox = (W - (MAP_B.x1 - MAP_B.x0) * sc) / 2, oz = pad;
  const mx = (wx) => ox + (wx - MAP_B.x0) * sc;
  const mz = (wz) => oz + (MAP_B.z1 - wz) * sc;
  // the passages, as a charcoal line on the rock
  x.strokeStyle = 'rgba(163, 149, 130, 0.42)';
  x.fillStyle = 'rgba(163, 149, 130, 0.12)';
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (const t of LAYOUT.tubes) {
    x.lineWidth = Math.max(4, t.r * sc * 0.9);
    x.beginPath();
    t.pts.forEach(([wx, wz], i) => (i ? x.lineTo(mx(wx), mz(wz)) : x.moveTo(mx(wx), mz(wz))));
    x.stroke();
  }
  x.lineWidth = 1.5;
  for (const c of LAYOUT.chambers) {
    x.beginPath();
    x.ellipse(mx(c.c[0]), mz(c.c[1]), c.rx * sc, c.rz * sc, 0, 0, 6.29);
    x.fill();
    x.stroke();
  }
  x.font = 'italic 12.5px Alegreya, Georgia, serif';
  x.fillStyle = 'rgba(235, 225, 205, 0.72)';
  x.textAlign = 'center';
  for (const z of CHAMBER_ZONES) x.fillText(titleCase(z.short), mx(z.x), mz(z.z) + 4);
  x.fillText('entrance', mx(0), mz(47.5));
  // panels: ochre once read
  let read = 0;
  for (const a of anchors) {
    const has = seen.has(a.painting.id);
    if (has) read++;
    x.beginPath();
    x.arc(mx(a.pos.x), mz(a.pos.z), 3, 0, 6.29);
    x.fillStyle = has ? 'rgba(214, 104, 52, 0.95)' : 'rgba(184, 88, 44, 0.28)';
    x.fill();
  }
  // the visitor: forward in world is (-sin yaw, -cos yaw); the map flips z
  const px = mx(player.pos.x), pz = mz(player.pos.z);
  const fx = -Math.sin(player.yaw), fz = Math.cos(player.yaw);
  x.fillStyle = '#ffd9a0';
  x.beginPath();
  x.moveTo(px + fx * 10, pz + fz * 10);
  x.lineTo(px + fz * 4.5 - fx * 3, pz - fx * 4.5 - fz * 3);
  x.lineTo(px - fz * 4.5 - fx * 3, pz + fx * 4.5 - fz * 3);
  x.closePath();
  x.fill();
  x.font = '15px Alegreya, Georgia, serif';
  x.fillStyle = 'rgba(235, 225, 205, 0.85)';
  x.fillText(`${read} of ${anchors.length} panels read`, W / 2, Hc - 10);
}

function toggleMap(force) {
  mapOpen = force === undefined ? !mapOpen : force;
  mapEl.classList.toggle('show', mapOpen);
  if (mapOpen) { drawMap(); unhint('#hintKeys'); toastEl.classList.remove('show'); }
}

window.addEventListener('keydown', (e) => {
  if (!player || !entered) return;
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyN') { ambience.toggle(); unhint('#hintKeys'); }
  if (e.code === 'Escape' && mapOpen) toggleMap(false);
});
// touch has no keyboard: the same two switches as buttons
$('#btnMap').addEventListener('click', (e) => { e.stopPropagation(); if (player) toggleMap(); });
$('#btnSound').addEventListener('click', (e) => {
  e.stopPropagation();
  $('#btnSound').textContent = ambience.toggle() ? 'Sound' : 'Muted';
});
mapEl.addEventListener('click', () => toggleMap(false));

// --------------------------------------------------------------------- boot

const title = $('#title');
const relock = $('#relock');
let entered = false, ready = false, wantEnter = false;

// pointer lock can be refused (iframes, some browsers, too-quick re-requests
// after ESC); newer browsers reject a promise, which must not leak an error
function lockPointer() {
  if (TOUCH || document.pointerLockElement) return;
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (e) { /* stay unlocked; clicking again retries */ }
}

function enter() {
  if (entered) return;
  ambience.start();                 // needs the click itself, so before anything waits
  lockPointer();
  if (!ready) {                     // clicked early: go in the moment the cave stands
    wantEnter = true;
    enterEl.textContent = 'Lighting…';
    return;
  }
  entered = true;
  document.body.classList.add('in');
  torch.kindle();
  hint('#hintMove', 9, 1.6);
}
title.addEventListener('click', enter);
canvas.addEventListener('click', () => { if (entered) lockPointer(); });

// headless screenshot mode: ?shot=<panel-id> | ?shot=x,z,yaw[,pitch]
// (window.__aim(shot) re-aims without reloading)
function aim(shot) {
  const a = anchors.find((an) => an.painting.id === shot);
  if (a) {
    // back away from the panel along its normal, but not into rock
    const want = Math.max(2.2, a.painting.size[0] * 0.85);
    let d = 0.8;
    while (d < want) {
      const ex = a.pos.x + a.normal.x * (d + 0.3), ez = a.pos.z + a.normal.z * (d + 0.3);
      if (sdf.sample(ex, sdf.floorHeight(ex, ez) + 1.62, ez) > -0.35) break;
      d += 0.1;
    }
    const eye = a.pos.clone().addScaledVector(a.normal, d);
    const dx = a.pos.x - eye.x, dz = a.pos.z - eye.z;
    const yaw = Math.hypot(dx, dz) > 0.05 ? Math.atan2(-dx, -dz) : player.yaw;
    player.set(eye.x, eye.z, yaw);
    const dy = a.pos.y - (sdf.floorHeight(eye.x, eye.z) + 1.62);
    player.setPitch(Math.atan2(dy, Math.hypot(dx, dz)));
  } else {
    const [sx, sz, syaw, spitch] = shot.split(',').map(Number);
    player.set(sx, sz, syaw || 0);
    player.setPitch(spitch || 0);
  }
}

// frame governor: if the GPU can't hold ~45 fps at full resolution, step the
// resolution down a notch (never below 1×); it never steps back up mid-visit
const gov = { sum: 0, n: 0, wait: 3 };
function govern(raw) {
  if (raw > 0.25) { gov.sum = gov.n = 0; return; }        // a stall (tab switch, GC): ignore
  if ((gov.wait -= raw) > 0) return;
  gov.sum += raw; gov.n++;
  if (gov.sum < 2) return;
  const avg = gov.sum / gov.n;
  gov.sum = gov.n = 0;
  if (avg > 1 / 45 && renderer.getPixelRatio() > 1) {
    dprCap = Math.max(1, renderer.getPixelRatio() - 0.25);
    applySize();
    stats.dprCap = dprCap;
    gov.wait = 1;
  }
}

build().then(() => {
  for (const a of anchors) unpainted.add(a);
  feedBaker();
  if (params.get('map')) toggleMap(true);
  if (SHOT) {
    entered = true;
    document.body.classList.add('in');
    title.style.display = 'none';
    torch.kindleNow();
    aim(SHOT);
    window.__aim = aim;
    window.__shotReady = false;
  }

  // ------------------------------------------------------------------- loop
  let last = performance.now(), mapRedraw = 0, t = 0, unlockedFor = 0;
  renderer.setAnimationLoop((now) => {
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(0.05, raw);
    t += dt;
    if (entered) govern(raw);

    feedBaker();
    hangArrived();
    for (const a of anchors) {
      if (a.fade >= 0 && a.fade < 1) a.mat.opacity = a.fade = Math.min(1, a.fade + dt / 0.9);
    }

    player.active = entered;
    player.update(dt);
    // how close the flame is to rock: it sits ~0.6 m ahead, right and low
    camera.getWorldDirection(fwd);
    const fx = camera.position.x + fwd.x * 0.6, fy = camera.position.y + fwd.y * 0.6 - 0.1, fz = camera.position.z + fwd.z * 0.6;
    ambience.setFlicker(torch.update(t, dt, { wallDist: -sdf.sample(fx, fy, fz) }));
    if (entered) {
      updatePlaque(dt);
      updateToasts(dt);
      if (player.walked > 4 && player.looked) unhint('#hintMove');
      // the torch was let go (Esc): say how to take it up again
      unlockedFor = (!TOUCH && !SHOT && !player.locked && !mapOpen) ? unlockedFor + dt : 0;
      relock.classList.toggle('show', unlockedFor > 0.8);
    }
    if (mapOpen && (mapRedraw += dt) > 0.25) { mapRedraw = 0; drawMap(); }
    renderer.render(scene, camera);
    if (SHOT && !window.__shotReady && stats.painted === anchors.length && !motifQueue.length && !arrived.length) {
      window.__shotReady = true;
    }
  });

  // first frame drawn (and its shaders compiled) behind the title: open the door
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ready = true;
    stats.ready = true;
    stats.ms.ready = Math.round(performance.now());
    enterEl.textContent = TOUCH ? 'Tap to light your torch' : 'Click to light your torch';
    enterEl.classList.add('ready');
    if (wantEnter) enter();
  }));
}).catch((err) => {
  enterEl.textContent = 'The cave collapsed: ' + err.message;
  console.error(err);
});

// the title answers the keyboard too
window.addEventListener('keydown', (e) => {
  if (!entered && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); enter(); }
});
