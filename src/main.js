// main.js — the visit. Builds the cave, hangs the paintings, lights the torch,
// and runs the loop: walking, gazing, plaques, chamber names, the survey map.

import * as THREE from 'three';
import { DecalGeometry } from '../vendor/DecalGeometry.js';
import { PAINTINGS, bakePainting } from './paintings.js';
import { buildField, meshFromField, makeRockMaterial, solveAnchor, LAYOUT, CHAMBER_ZONES, PLACEMENTS } from './cave.js';
import { scatterPaintings } from './scatter.js';
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
const anchors = [];   // {painting, pos, normal}
let sdf = null, caveMesh = null, player = null, torch = null, ambience = null;

async function build() {
  enterEl.textContent = 'GRINDING OCHRE…';
  await frame(); await frame();

  // bake all paintings to textures
  const textures = new Map();
  for (const p of PAINTINGS) {
    const cv = bakePainting(p, 1);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    textures.set(p.id, tex);
  }

  enterEl.textContent = 'EXCAVATING PASSAGES…';
  await frame(); await frame();
  sdf = buildField();

  enterEl.textContent = 'CARVING THE WALLS…';
  await frame(); await frame();
  const geo = meshFromField(sdf);
  caveMesh = new THREE.Mesh(geo, makeRockMaterial());
  scene.add(caveMesh);

  enterEl.textContent = 'HANGING THE PLAQUES…';
  await frame(); await frame();

  // paintings as decals, flush on the rock
  const helper = new THREE.Object3D();
  for (const p of PAINTINGS) {
    const spec = PLACEMENTS[p.id];
    if (!spec) continue;
    const { pos, normal } = solveAnchor(sdf, spec);
    helper.position.copy(pos);
    helper.lookAt(pos.clone().add(normal));
    const size = new THREE.Vector3(p.size[0], p.size[1], 1.6);
    const dgeo = new DecalGeometry(caveMesh, pos, helper.rotation, size);
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

  enterEl.textContent = 'PAINTING THE HERDS…';
  await frame(); await frame();
  scatterPaintings({ sdf, caveMesh, scene, avoid: anchors });

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
  const dayLight = new THREE.PointLight(0xbccfe2, 6.5, 10, 1.8);
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

  return { glintPts };
}

// ------------------------------------------------------------------- plaques

const plaqueEl = $('#plaque');
const seen = new Set(JSON.parse(localStorage.getItem('grotte-seen') || '[]'));
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
      plaqueEl.classList.add('show');
      if (!seen.has(best.painting.id)) {
        seen.add(best.painting.id);
        localStorage.setItem('grotte-seen', JSON.stringify([...seen]));
      }
    } else {
      plaqueEl.classList.remove('show');
    }
  }
}

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

function drawMap() {
  const x = mapCanvas.getContext('2d');
  const W = mapCanvas.width, Hc = mapCanvas.height;
  x.clearRect(0, 0, W, Hc);
  x.fillStyle = '#1a1410';
  x.fillRect(0, 0, W, Hc);
  // world → map: x in [-38, 28], z in [-34, 50]
  const mx = (wx) => ((wx + 38) / 66) * (W - 40) + 20;
  const mz = (wz) => ((50 - wz) / 84) * (Hc - 40) + 20; // deeper = up... no: entrance at bottom
  x.strokeStyle = 'rgba(200, 180, 140, 0.5)';
  x.lineWidth = 7;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (const t of LAYOUT.tubes) {
    x.beginPath();
    t.pts.forEach(([wx, wz], i) => (i ? x.lineTo(mx(wx), mz(wz)) : x.moveTo(mx(wx), mz(wz))));
    x.stroke();
  }
  for (const c of LAYOUT.chambers) {
    x.beginPath();
    x.ellipse(mx(c.c[0]), mz(c.c[1]), (c.rx / 66) * (W - 40), (c.rz / 84) * (Hc - 40), 0, 0, 6.29);
    x.fillStyle = 'rgba(200, 180, 140, 0.16)';
    x.fill();
    x.stroke();
  }
  // chamber labels
  x.font = '9px Courier New';
  x.fillStyle = 'rgba(190, 165, 120, 0.75)';
  x.textAlign = 'center';
  const labels = [
    ['VESTIBULE', 0, 31], ['HALL OF AUTOMATA', 0, 10], ['GALLERY', -22, -6],
    ['ROTUNDA', -25.5, -17.5], ['SHAFT', -30.5, -27], ['NAVE OF SPEECH', 17, 0], ['APSE', 19, -13],
    ['ENTRANCE', 0, 47],
  ];
  for (const [name, wx, wz] of labels) x.fillText(name, mx(wx), mz(wz) - 12);
  // panels
  for (const a of anchors) {
    x.beginPath();
    x.arc(mx(a.pos.x), mz(a.pos.z), 3, 0, 6.29);
    x.fillStyle = seen.has(a.painting.id) ? 'rgba(190, 80, 40, 0.95)' : 'rgba(190, 80, 40, 0.3)';
    x.fill();
  }
  // player
  const px = mx(player.pos.x), pz = mz(player.pos.z);
  x.fillStyle = '#e8dcc0';
  x.beginPath();
  const yw = player.yaw;
  // forward in world = (-sin yaw, -cos yaw); map z axis is flipped
  const fx = -Math.sin(yw), fz = Math.cos(yw); // note: mz flips z
  x.moveTo(px + fx * 9, pz + fz * 9);
  x.lineTo(px + fz * 4 - fx * 3, pz - fx * 4 - fz * 3);
  x.lineTo(px - fz * 4 - fx * 3, pz + fx * 4 - fz * 3);
  x.closePath();
  x.fill();
  // legend
  x.textAlign = 'left';
  x.fillStyle = 'rgba(160, 140, 100, 0.7)';
  x.fillText(`panels read: ${seen.size} / ${anchors.length}`, 20, Hc - 10);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') {
    mapOpen = !mapOpen;
    mapEl.classList.toggle('show', mapOpen);
    if (mapOpen) drawMap();
  }
  if (e.code === 'KeyN' && ambience) ambience.toggle();
});

// --------------------------------------------------------------------- boot

const title = $('#title');

build().then(() => {
  enterEl.textContent = 'CLICK TO LIGHT YOUR TORCH';
  enterEl.classList.add('ready');

  const enter = () => {
    title.classList.add('gone');
    ambience.start();
    if (!('ontouchstart' in window)) canvas.requestPointerLock();
    $('#dot').style.display = 'block';
  };
  title.addEventListener('click', enter);
  canvas.addEventListener('click', () => {
    if (!title.classList.contains('gone')) return;
    if (!('ontouchstart' in window) && !document.pointerLockElement) canvas.requestPointerLock();
  });

  if (params.get('map')) {
    mapOpen = true;
    mapEl.classList.add('show');
    drawMap();
  }

  // headless screenshot mode: ?shot=<panel-id> | ?shot=x,z,yaw[,pitch]
  if (SHOT) {
    title.classList.add('gone');
    title.style.display = 'none';
    const a = anchors.find((an) => an.painting.id === SHOT);
    if (a) {
      const eye = a.pos.clone().addScaledVector(a.normal, Math.max(2.2, a.painting.size[0] * 0.85));
      const dx = a.pos.x - eye.x, dz = a.pos.z - eye.z;
      const yaw = Math.atan2(-dx, -dz);
      player.set(eye.x, eye.z, yaw);
      const dy = a.pos.y - (sdf.floorHeight(eye.x, eye.z) + 1.62);
      player.setPitch(Math.atan2(dy, Math.hypot(dx, dz)));
    } else {
      const [sx, sz, syaw, spitch] = SHOT.split(',').map(Number);
      player.set(sx, sz, syaw || 0);
      player.setPitch(spitch || 0);
    }
    window.__shotReady = false;
    setTimeout(() => { window.__shotReady = true; }, 800);
  }

  // ------------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  let mapRedraw = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    player.update(dt);
    const flicker = torch.update(t, dt);
    ambience.setFlicker(flicker);
    updatePlaque();
    updateToasts(dt);
    if (mapOpen && (mapRedraw += dt) > 0.25) { mapRedraw = 0; drawMap(); }
    renderer.render(scene, camera);
  });
}).catch((err) => {
  enterEl.textContent = 'THE CAVE COLLAPSED: ' + err.message;
  console.error(err);
});
