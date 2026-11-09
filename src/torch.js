// torch.js — the visitor's torch: a held prop in camera space, a flickering
// warm point light, sprite flames with a soft halo, and drifting embers. No
// textures from disk; the flame sprites are painted on canvas at boot.
//
// The flicker is smoothed noise rather than sines (sines read as a pulse),
// with the occasional gust that pulls the flame low and red. The light sits
// in the flame itself, falls off a little gentler than inverse-square (the
// far wall of a big chamber just catches it), and throttles itself when the
// flame is held close to rock, the way your eye would stop down.

import * as THREE from 'three';

// teardrop flame: narrow tip, round belly, hot core low in the body
function flameSprite(core, mid, edge) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  x.filter = 'blur(3px)';
  const g = x.createRadialGradient(S / 2, S * 0.7, 2, S / 2, S * 0.62, S * 0.42);
  g.addColorStop(0, core);
  g.addColorStop(0.45, mid);
  g.addColorStop(1, edge);
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(S / 2, S * 0.06);                                        // tip
  x.bezierCurveTo(S * 0.62, S * 0.36, S * 0.8, S * 0.6, S * 0.72, S * 0.8);
  x.bezierCurveTo(S * 0.64, S * 0.94, S * 0.36, S * 0.94, S * 0.28, S * 0.8);
  x.bezierCurveTo(S * 0.2, S * 0.6, S * 0.38, S * 0.36, S / 2, S * 0.06);
  x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function glowSprite() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,170,80,0.55)');
  g.addColorStop(0.3, 'rgba(255,120,40,0.18)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// smooth 1-D value noise in [0, 1]
function makeNoise1(seed) {
  const N = 256, v = new Float32Array(N);
  let s = seed;
  for (let i = 0; i < N; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
  return (t) => {
    const i = Math.floor(t), f = t - i;
    const a = v[i & 255], b = v[(i + 1) & 255];
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  };
}

const HOT = new THREE.Color(0xffbc80);   // steady flame
const LOW = new THREE.Color(0xff7a2e);   // guttering: redder, as a dimming flame is
const LUMEN = 34;

export function makeTorch(camera, scene) {
  // --- the light that carries the scene
  const light = new THREE.PointLight(0xffb070, 0, 26, 1.75);
  scene.add(light);

  // --- held prop, child of camera
  const rig = new THREE.Group();
  camera.add(rig);
  rig.position.set(0.36, -0.4, -0.62);

  // basic (unlit) materials: the torch is a silhouette against its own light.
  const stickGroup = new THREE.Group();
  stickGroup.rotation.set(0.32, 0, -0.12);
  rig.add(stickGroup);

  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.017, 0.42, 12),
    new THREE.MeshBasicMaterial({ color: 0x1c1208 }),
  );
  stickGroup.add(stick);

  // the wrapped head: charred, with a glowing lip where it burns
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.016, 0.08, 16),
    new THREE.MeshBasicMaterial({ color: 0x3a1c0c }),
  );
  head.position.set(0, 0.235, 0);
  stickGroup.add(head);
  const ember = new THREE.Mesh(
    new THREE.CylinderGeometry(0.023, 0.022, 0.016, 16),
    new THREE.MeshBasicMaterial({ color: 0xc8501c }),
  );
  ember.position.set(0, 0.28, 0);
  stickGroup.add(ember);

  const add = { blending: THREE.AdditiveBlending, depthWrite: false, transparent: true };
  const flameMats = [
    new THREE.SpriteMaterial({ map: flameSprite('rgba(255,248,215,1)', 'rgba(255,170,60,0.75)', 'rgba(220,70,10,0)'), ...add }),
    new THREE.SpriteMaterial({ map: flameSprite('rgba(255,210,120,0.9)', 'rgba(240,110,30,0.5)', 'rgba(180,40,5,0)'), ...add }),
    new THREE.SpriteMaterial({ map: flameSprite('rgba(255,180,90,0.6)', 'rgba(210,80,20,0.3)', 'rgba(150,30,5,0)'), ...add }),
  ];
  const flames = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(flameMats[i]);
    s.center.set(0.5, 0.12);           // anchor near the base, so it grows upward
    s.position.set(0, 0.29, 0);
    stickGroup.add(s);
    flames.push(s);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), ...add, opacity: 0.5 }));
  halo.position.set(0, 0.34, 0);
  halo.scale.set(0.34, 0.34, 1);
  stickGroup.add(halo);

  // --- embers, in world space around the flame
  const N = 28;
  const emberGeo = new THREE.BufferGeometry();
  const ep = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const emberC = document.createElement('canvas');
  emberC.width = emberC.height = 32;
  const ex = emberC.getContext('2d');
  const eg = ex.createRadialGradient(16, 16, 1, 16, 16, 15);
  eg.addColorStop(0, 'rgba(255,210,140,1)');
  eg.addColorStop(0.4, 'rgba(255,140,40,0.5)');
  eg.addColorStop(1, 'rgba(255,120,20,0)');
  ex.fillStyle = eg; ex.fillRect(0, 0, 32, 32);
  const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    map: new THREE.CanvasTexture(emberC),
    color: 0xffa040, size: 0.012, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(embers);

  const tip = new THREE.Vector3();
  const lastCam = new THREE.Vector3().copy(camera.position);
  const camVel = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const nA = makeNoise1(11), nB = makeNoise1(29), nC = makeNoise1(47), nG = makeNoise1(83);
  const nX = makeNoise1(5), nZ = makeNoise1(7);

  let flicker = 1, gust = 0, lean = 0, dim = 1;

  // the torch starts unlit; kindle() lights it over a second or so
  let ignite = 0, igniting = false;

  // opts.wallDist: distance from the flame to the nearest rock (m)
  function update(t, dt, opts = {}) {
    if (igniting) ignite = Math.min(1, ignite + dt / 1.3);
    const kindle = ignite * ignite * (3 - 2 * ignite);
    // the torch is raised into view as it catches
    rig.visible = ignite > 0;
    rig.position.y = -0.4 - 0.3 * (1 - kindle);
    // flicker: three octaves of smoothed noise; a slow "breath", a lively
    // mid band and a fine shimmer. Gusts come rarely and pull it down.
    const g = nG(t * 0.35);
    const gustTarget = g > 0.8 ? (g - 0.8) * 3.2 : 0;
    gust += (gustTarget - gust) * Math.min(1, dt * 5);
    flicker = 0.9
      + (nA(t * 1.1) - 0.5) * 0.12
      + (nB(t * 6.5) - 0.5) * 0.14
      + (nC(t * 19) - 0.5) * 0.06
      - gust * 0.22;

    // held close to rock, the light stops down (up to ~half), smoothly
    const wd = opts.wallDist === undefined ? 3 : opts.wallDist;
    const k = Math.max(0, Math.min(1, (wd - 0.25) / 1.8));
    const dimTarget = 0.45 + 0.55 * k * k * (3 - 2 * k);
    dim += (dimTarget - dim) * Math.min(1, dt * 4);

    light.intensity = LUMEN * flicker * dim * kindle;
    light.color.copy(LOW).lerp(HOT, Math.max(0, Math.min(1, (flicker - 0.72) / 0.3)));

    // the light lives in the flame, and wanders with it by a few centimetres
    rig.updateWorldMatrix(true, true);
    tip.setFromMatrixPosition(flames[0].matrixWorld);
    tip.y += 0.06;
    light.position.set(
      tip.x + (nX(t * 3) - 0.5) * 0.05,
      tip.y + (nB(t * 4 + 9) - 0.5) * 0.04,
      tip.z + (nZ(t * 3) - 0.5) * 0.05,
    );

    // the flame leans against the way you are moving
    camVel.subVectors(camera.position, lastCam).divideScalar(Math.max(dt, 1e-3));
    lastCam.copy(camera.position);
    camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    const side = camVel.dot(camRight);
    lean += (Math.max(-0.5, Math.min(0.5, -side * 0.12)) - lean) * Math.min(1, dt * 4);

    for (let i = 0; i < flames.length; i++) {
      const f = flames[i];
      const w = 0.05 + i * 0.022;
      const hN = nB(t * (7 + i * 2.3) + i * 17);
      const grow = 0.25 + 0.75 * kindle;
      f.scale.set(
        w * (0.88 + 0.24 * nC(t * 11 + i * 5)) * grow,
        w * (2.3 + 0.9 * hN) * (0.75 + 0.35 * flicker) * grow,
        1,
      );
      f.material.rotation = lean + (nA(t * (3 + i) + i * 31) - 0.5) * 0.3;
      f.material.opacity = 0.75 + 0.25 * flicker;
    }
    halo.material.opacity = (0.32 + 0.25 * flicker) * kindle;
    const hs = 0.3 + 0.06 * flicker;
    halo.scale.set(hs, hs, 1);

    // ember drift: born at the flame, rising and slowing, wandering sideways
    const pos = emberGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      life[i] += dt * (0.45 + (i % 5) * 0.1);
      if (life[i] > 1) {
        life[i] = Math.random() * 0.2;
        pos[i * 3] = tip.x + (Math.random() - 0.5) * 0.03;
        pos[i * 3 + 1] = tip.y - 0.02;
        pos[i * 3 + 2] = tip.z + (Math.random() - 0.5) * 0.03;
        vel[i * 3] = (Math.random() - 0.5) * 0.12;
        vel[i * 3 + 1] = 0.3 + Math.random() * 0.35;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      }
      vel[i * 3 + 1] *= 1 - dt * 0.8;
      pos[i * 3] += vel[i * 3] * dt + (Math.random() - 0.5) * 0.003;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt + (Math.random() - 0.5) * 0.003;
    }
    emberGeo.attributes.position.needsUpdate = true;
    embers.material.opacity = 0.55 * flicker * kindle;

    return flicker * kindle;
  }

  return {
    light, update, rig,
    kindle() { igniting = true; },
    kindleNow() { igniting = true; ignite = 1; },
  };
}
