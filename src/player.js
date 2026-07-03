// player.js — first-person movement: pointer-lock look, WASD walk, collision
// and floor-following both driven by the cave's distance field. Touch support:
// left half of the screen is a walk stick, right half drags the view.

import * as THREE from 'three';

const EYE = 1.62;
const CLEARANCE = 0.55; // how far from the wall the body stays

export function makePlayer(camera, sdf, dom) {
  let yaw = Math.PI;      // facing -z (into the cave)
  let pitch = 0;
  const pos = new THREE.Vector3(0, sdf.floorHeight(0, 43) + EYE, 43);
  const keys = new Set();
  let bobT = 0;
  const grad = new THREE.Vector3();

  const state = {
    pos, locked: false, moving: false,
    get yaw() { return yaw; },
    set(x, z, yw) {
      pos.x = x; pos.z = z; yaw = yw;
      pos.y = sdf.floorHeight(x, z) + EYE;
    },
    setPitch(p) { pitch = Math.max(-1.45, Math.min(1.45, p)); },
  };

  // ---------- look
  function onMouseMove(e) {
    if (!state.locked) return;
    yaw -= e.movementX * 0.0023;
    pitch -= e.movementY * 0.0021;
    pitch = Math.max(-1.45, Math.min(1.45, pitch));
  }
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === dom;
  });

  // ---------- keys
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // ---------- touch
  let walkTouch = null, lookTouch = null;
  const walkVec = { x: 0, y: 0 };
  dom.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth / 2 && walkTouch === null) {
        walkTouch = { id: t.identifier, x0: t.clientX, y0: t.clientY };
      } else if (lookTouch === null) {
        lookTouch = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
    }
  }, { passive: true });
  dom.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (walkTouch && t.identifier === walkTouch.id) {
        walkVec.x = Math.max(-1, Math.min(1, (t.clientX - walkTouch.x0) / 60));
        walkVec.y = Math.max(-1, Math.min(1, (t.clientY - walkTouch.y0) / 60));
      } else if (lookTouch && t.identifier === lookTouch.id) {
        yaw -= (t.clientX - lookTouch.x) * 0.005;
        pitch -= (t.clientY - lookTouch.y) * 0.004;
        pitch = Math.max(-1.45, Math.min(1.45, pitch));
        lookTouch.x = t.clientX; lookTouch.y = t.clientY;
      }
    }
  }, { passive: true });
  dom.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (walkTouch && t.identifier === walkTouch.id) { walkTouch = null; walkVec.x = walkVec.y = 0; }
      if (lookTouch && t.identifier === lookTouch.id) lookTouch = null;
    }
  });

  // ---------- movement
  function passable(x, y, z) {
    // body probe at knee and chest height
    return sdf.sample(x, y - 0.9, z) < -CLEARANCE * 0.7
        && sdf.sample(x, y - 0.2, z) < -CLEARANCE * 0.55;
  }

  function update(dt) {
    let fwd = 0, str = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) str -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) str += 1;
    fwd += -walkVec.y; str += walkVec.x;
    const L = Math.hypot(fwd, str);
    if (L > 1) { fwd /= L; str /= L; }
    const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 4.6 : 3.0;
    state.moving = L > 0.05;

    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const vx = (-sin * fwd + cos * str) * speed * dt;
    const vz = (-cos * fwd - sin * str) * speed * dt;

    // axis-separated slide
    if (vx !== 0 && passable(pos.x + vx, pos.y, pos.z)) pos.x += vx;
    if (vz !== 0 && passable(pos.x, pos.y, pos.z + vz)) pos.z += vz;

    // soft push-out if the walls have crept too close (noise pockets)
    const here = sdf.sample(pos.x, pos.y - 0.4, pos.z);
    if (here > -CLEARANCE * 0.5) {
      sdf.grad(pos.x, pos.y - 0.4, pos.z, grad);
      pos.x -= grad.x * dt * 2.2;
      pos.z -= grad.z * dt * 2.2;
    }

    // floor follow
    const fl = sdf.floorHeight(pos.x, pos.z);
    const targetY = fl + EYE;
    pos.y += (targetY - pos.y) * Math.min(1, dt * 9);

    // head bob
    if (state.moving) bobT += dt * (speed > 4 ? 11 : 8.2);
    const bob = Math.sin(bobT) * 0.028 * (state.moving ? 1 : 0);

    camera.position.set(pos.x, pos.y + bob, pos.z);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  }

  return Object.assign(state, { update });
}
