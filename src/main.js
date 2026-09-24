// main.js — the visit. Builds the cave, hangs the paintings, lights the torch,
// and runs the loop: walking, gazing, plaques, chamber names, the survey map.

import * as THREE from 'three';
import { DecalGeometry } from '../vendor/DecalGeometry.js';
import { PAINTINGS, bakePainting } from './paintings.js';
import { buildField, meshFromField, makeRockMaterial, solveAnchor, LAYOUT, CHAMBER_ZONES, PLACEMENTS } from './cave.js';
import { scatterPaintings, makeDecalProjector } from './scatter.js';
import { makeTorch } from './torch.js';
import { makeAmbience } from './audio.js';
import { makePlayer } from './player.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'); // headless screenshot mode

// ------------------------------------------------------------ renderer/scene

const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.FogExp2(0x060402, 0.05);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 130);
scene.add(camera);

scene.add(new THREE.AmbientLight(0x2a2018, 0.35));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const frame = () => new Promise((r) => requestAnimationFrame(r));

// ---------------------------------------------------------------- the build

const enterEl = $('#enter');
// load statistics, readable from the console (and by the screenshot scripts)
const stats = { panels: 0, lesser: 0, ms: {} };
window.__grotte = stats;
stats.where = () => player && [+player.pos.x.toFixed(2), +player.pos.z.toFixed(2), +player.yaw.toFixed(2)];
const anchors = [];   // {painting, pos, normal}
let sdf = null, caveMesh = null, player = null, torch = null, ambience = null;

async function build() {
  enterEl.textContent = 'GRINDING OCHRE…';
  await frame(); await frame();
  const tBuild = performance.now();

  // bake all paintings to textures, yielding now and then so the title
  // screen keeps breathing. Small or touch screens get smaller bakes: fifty
  // panels at full size is a lot of texture memory for a phone.
  const textures = new Map();
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  const bakeScale = small ? 0.6 : 1;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  let t0 = performance.now();
  for (let i = 0; i < PAINTINGS.length; i++) {
    const p = PAINTINGS[i];
    const tb = performance.now();
    const cv = bakePainting(p, bakeScale);
    stats.ms.bakeCpu = (stats.ms.bakeCpu || 0) + Math.round(performance.now() - tb);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(4, maxAniso);
    textures.set(p.id, tex);
    if (performance.now() - t0 > 60) {
      enterEl.textContent = `GRINDING OCHRE… ${i + 1} / ${PAINTINGS.length}`;
      await frame();
      t0 = performance.now();
    }
  }

  stats.ms.bake = Math.round(performance.now() - tBuild);
  enterEl.textContent = 'EXCAVATING PASSAGES…';
  await frame(); await frame();
  let tStep = performance.now();
  sdf = buildField();
  stats.ms.field = Math.round(performance.now() - tStep);

  enterEl.textContent = 'CARVING THE WALLS…';
  await frame(); await frame();
  tStep = performance.now();
  const geo = meshFromField(sdf);
  stats.ms.mesh = Math.round(performance.now() - tStep);
  stats.triangles = geo.index.count / 3;
  caveMesh = new THREE.Mesh(geo, makeRockMaterial());
  scene.add(caveMesh);

  enterEl.textContent = 'HANGING THE PLAQUES…';
  await frame(); await frame();
  tStep = performance.now();

  // paintings as decals, flush on the rock
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
    const dmat = new THREE.MeshStandardMaterial({
      map: textures.get(p.id),
      transparent: true,
      roughness: 0.97,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      depthWrite: false,
    });
    const dmesh = new THREE.Mesh(dgeo, dmat);
    dmesh.renderOrder = 2; // plaqued panels draw over any scattered figure
    scene.add(dmesh);
    anchors.push({ painting: p, pos, normal });
  }

  stats.panels = anchors.length;
  stats.ms.panels = Math.round(performance.now() - tStep);
  enterEl.textContent = 'PAINTING THE HERDS…';
  await frame(); await frame();
  tStep = performance.now();
  const crowd = scatterPaintings({ sdf, caveMesh, scene, avoid: anchors, projector });
  stats.lesser = crowd.length;

  stats.ms.lesser = Math.round(performance.now() - tStep);

  // ------------------ entrance: sealed daylight
  const glowC = document.createElement('canvas');
  glowC.width = glowC.height = 128;
  const gx = glowC.getContext('2d');
  const gr = gx.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(214, 228, 240, 0.9)');
  gr.addColorStop(0.5, 'rgba(160, 180, 205, 0.28)');
  gr.addColorStop(1, 'rgba(120, 140, 170, 0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowC);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.55, depthWrite: false,
  }));
  glow.position.set(0, 2.85, 45.2);
  glow.scale.set(2.1, 1.6, 1);
  scene.add(glow);
  const dayLight = new THREE.PointLight(0xbccfe2, 4, 10, 1.8);
  dayLight.position.set(0, 2.7, 44.6);
  scene.add(dayLight);

  // (the collapse boulders are carved into the distance field itself)

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
  const glintPts = new THREE.Points(glintGeo, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(glintC),
    color: 0xfff2d8, size: 0.03, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(glintPts);

  // ------------------ the crew
  torch = makeTorch(camera, scene);
  ambience = makeAmbience();
  player = makePlayer(camera, sdf, canvas);
  // footfalls: louder when hurrying, with more cave in them in big chambers
  player.onStep = (pace) => {
    let room = 0.15;                       // passages: close, dry
    for (const z of CHAMBER_ZONES) {
      const d = Math.hypot(player.pos.x - z.x, player.pos.z - z.z);
      if (d < z.r) { room = Math.min(1, z.r / 9.5); break; }
    }
    ambience.step(pace, room);
  };

  return { glintPts };
}

// ------------------------------------------------------------------- plaques

const plaqueEl = $('#plaque');
// read-panel memory; storage can be missing or throw (private windows)
const seen = new Set();
try { for (const id of JSON.parse(localStorage.getItem('grotte-seen') || '[]')) seen.add(id); } catch (e) { /* no memory */ }
function remember() {
  try { localStorage.setItem('grotte-seen', JSON.stringify([...seen])); } catch (e) { /* ignore */ }
}
let plaqueShown = null;

const fwd = new THREE.Vector3();
const toAnchor = new THREE.Vector3();

function updatePlaque() {
  camera.getWorldDirection(fwd);
  let best = null, bestScore = 0;
  for (const a of anchors) {
    toAnchor.subVectors(a.pos, camera.position);
    const dist = toAnchor.length();
    const maxD = a.painting.maxD || (a.painting.size[0] > 3.4 ? 6.5 : 4.4);
    if (dist > maxD || dist < 0.4) continue;
    toAnchor.divideScalar(dist);
    const facing = fwd.dot(toAnchor);
    if (facing < 0.78) continue;
    const score = facing / (0.6 + dist * 0.25);
    if (score > bestScore) { bestScore = score; best = a; }
  }
  if (best !== plaqueShown) {
    plaqueShown = best;
    if (best) {
      $('#plaque .p-title').textContent = best.painting.title;
      $('#plaque .p-sub').textContent = best.painting.sub;
      $('#plaque .p-body').textContent = best.painting.body;
      $('#plaque .p-body').scrollTop = 0;
      plaqueEl.classList.add('show');
      if (!seen.has(best.painting.id)) {
        seen.add(best.painting.id);
        remember();
      }
    } else {
      plaqueEl.classList.remove('show');
    }
  }
}

// long plaques: the wheel scrolls them even while the torch holds the pointer
window.addEventListener('wheel', (e) => {
  if (plaqueShown) $('#plaque .p-body').scrollTop += e.deltaY;
}, { passive: true });

// -------------------------------------------------------------- chamber toasts

const toastEl = $('#toast');
let currentZone = null, toastTimer = 0;

function updateToasts(dt) {
  let inZone = null;
  for (const z of CHAMBER_ZONES) {
    if (Math.hypot(player.pos.x - z.x, player.pos.z - z.z) < z.r) { inZone = z; break; }
  }
  if (inZone && inZone !== currentZone) {
    currentZone = inZone;
    $('#toast .t-name').textContent = inZone.name;
    $('#toast .t-sub').textContent = inZone.sub;
    toastEl.classList.add('show');
    toastTimer = 3.4;
  }
  if (!inZone && currentZone) {
    // require actually leaving (with hysteresis) before re-arming
    const z = currentZone;
    if (Math.hypot(player.pos.x - z.x, player.pos.z - z.z) > z.r + 2) currentZone = null;
  }
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) toastEl.classList.remove('show');
  }
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
  const x = mapCanvas.getContext('2d');
  const W = mapCanvas.width, Hc = mapCanvas.height;
  x.clearRect(0, 0, W, Hc);
  x.fillStyle = '#1a1410';
  x.fillRect(0, 0, W, Hc);
  // world → map, uniform scale; entrance (+z) at the bottom
  const pad = 18;
  const sc = Math.min((W - pad * 2) / (MAP_B.x1 - MAP_B.x0), (Hc - pad * 2 - 14) / (MAP_B.z1 - MAP_B.z0));
  const ox = (W - (MAP_B.x1 - MAP_B.x0) * sc) / 2, oz = pad;
  const mx = (wx) => ox + (wx - MAP_B.x0) * sc;
  const mz = (wz) => oz + (MAP_B.z1 - wz) * sc;
  x.strokeStyle = 'rgba(200, 180, 140, 0.5)';
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (const t of LAYOUT.tubes) {
    x.lineWidth = Math.max(4, t.r * sc * 0.9);
    x.beginPath();
    t.pts.forEach(([wx, wz], i) => (i ? x.lineTo(mx(wx), mz(wz)) : x.moveTo(mx(wx), mz(wz))));
    x.stroke();
  }
  x.lineWidth = 2;
  for (const c of LAYOUT.chambers) {
    x.beginPath();
    x.ellipse(mx(c.c[0]), mz(c.c[1]), c.rx * sc, c.rz * sc, 0, 0, 6.29);
    x.fillStyle = 'rgba(200, 180, 140, 0.16)';
    x.fill();
    x.stroke();
  }
  // chamber labels
  x.font = '9px "Courier New", monospace';
  x.fillStyle = 'rgba(190, 165, 120, 0.8)';
  x.textAlign = 'center';
  for (const z of CHAMBER_ZONES) x.fillText(z.short, mx(z.x), mz(z.z) + 3);
  x.fillText('ENTRANCE', mx(0), mz(47.5));
  // panels
  let read = 0;
  for (const a of anchors) {
    const has = seen.has(a.painting.id);
    if (has) read++;
    x.beginPath();
    x.arc(mx(a.pos.x), mz(a.pos.z), 2.6, 0, 6.29);
    x.fillStyle = has ? 'rgba(200, 86, 44, 0.95)' : 'rgba(190, 80, 40, 0.3)';
    x.fill();
  }
  // player: forward in world is (-sin yaw, -cos yaw); the map flips z
  const px = mx(player.pos.x), pz = mz(player.pos.z);
  const fx = -Math.sin(player.yaw), fz = Math.cos(player.yaw);
  x.fillStyle = '#e8dcc0';
  x.beginPath();
  x.moveTo(px + fx * 9, pz + fz * 9);
  x.lineTo(px + fz * 4 - fx * 3, pz - fx * 4 - fz * 3);
  x.lineTo(px - fz * 4 - fx * 3, pz + fx * 4 - fz * 3);
  x.closePath();
  x.fill();
  // legend
  x.textAlign = 'left';
  x.fillStyle = 'rgba(160, 140, 100, 0.75)';
  x.fillText(`panels read: ${read} / ${anchors.length}`, pad, Hc - 8);
}

function toggleMap(force) {
  mapOpen = force === undefined ? !mapOpen : force;
  mapEl.classList.toggle('show', mapOpen);
  if (mapOpen) drawMap();
}

window.addEventListener('keydown', (e) => {
  if (!player) return;               // still excavating
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyN' && ambience) ambience.toggle();
});
// touch has no keyboard: the same two switches as buttons
$('#btnMap').addEventListener('click', (e) => { e.stopPropagation(); if (player) toggleMap(); });
$('#btnSound').addEventListener('click', (e) => {
  e.stopPropagation();
  if (!ambience) return;
  $('#btnSound').textContent = ambience.toggle() ? 'SOUND' : 'MUTED';
});
mapEl.addEventListener('click', () => toggleMap(false));

// --------------------------------------------------------------------- boot

const title = $('#title');
let entered = false;
// pointer lock can be refused (iframes, some browsers, too-quick re-requests
// after ESC); newer browsers reject a promise, which must not leak an error
function lockPointer() {
  if ('ontouchstart' in window || document.pointerLockElement) return;
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (e) { /* stay unlocked; clicking again retries */ }
}

build().then(() => {
  enterEl.textContent = matchMedia('(pointer: coarse)').matches ? 'TAP TO LIGHT YOUR TORCH' : 'CLICK TO LIGHT YOUR TORCH';
  enterEl.classList.add('ready');

  const enter = () => {
    if (entered) return;
    entered = true;
    title.classList.add('gone');
    $('#touchbar').classList.add('on');
    ambience.start();
    lockPointer();
    $('#dot').style.display = 'block';
  };
  title.addEventListener('click', enter);
  canvas.addEventListener('click', () => {
    if (!title.classList.contains('gone')) return;
    lockPointer();
  });

  if (params.get('map')) toggleMap(true);

  // headless screenshot mode: ?shot=<panel-id> | ?shot=x,z,yaw[,pitch]
  // (window.__aim(shot) re-aims without reloading)
  const aim = (shot) => {
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
  };
  if (SHOT) {
    entered = true;
    title.classList.add('gone');
    title.style.display = 'none';
    aim(SHOT);
    window.__aim = aim;
    window.__shotReady = false;
    setTimeout(() => { window.__shotReady = true; }, 800);
  }

  // ------------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  let mapRedraw = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    player.active = entered;
    player.update(dt);
    // how close the flame is to rock: it sits ~0.6 m ahead, right and low
    camera.getWorldDirection(fwd);
    const fx = camera.position.x + fwd.x * 0.6, fy = camera.position.y + fwd.y * 0.6 - 0.1, fz = camera.position.z + fwd.z * 0.6;
    const flicker = torch.update(t, dt, { wallDist: -sdf.sample(fx, fy, fz) });
    ambience.setFlicker(flicker);
    if (entered) {
      updatePlaque();
      updateToasts(dt);
    }
    if (mapOpen && (mapRedraw += dt) > 0.25) { mapRedraw = 0; drawMap(); }
    renderer.render(scene, camera);
  });
}).catch((err) => {
  enterEl.textContent = 'THE CAVE COLLAPSED: ' + err.message;
  console.error(err);
});
