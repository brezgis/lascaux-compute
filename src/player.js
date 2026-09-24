// player.js — first-person movement: pointer-lock look, WASD walk, collision
// and floor-following both driven by the cave's distance field. Touch support:
// left half of the screen is a walk stick, right half drags the view.

import * as THREE from 'three';

const EYE = 1.62;
const CLEARANCE = 0.55; // how far from the wall the body stays

export function makePlayer(camera, sdf, dom) {
  let yaw = 0;            // facing -z (into the cave); forward is (-sin yaw, -cos yaw)
  let pitch = 0;
  const pos = new THREE.Vector3(0, sdf.floorHeight(0, 43) + EYE, 43);
  const keys = new Set();
  let bobT = 0, bobAmp = 0;
  const grad = new THREE.Vector3();

  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  const state = {
    pos, locked: false, moving: false, active: true, speed: 0, onStep: null,
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
  // a cancelled touch (system gesture, notification) must also let go,
  // or the visitor keeps walking into the wall forever
  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (walkTouch && t.identifier === walkTouch.id) { walkTouch = null; walkVec.x = walkVec.y = 0; }
      if (lookTouch && t.identifier === lookTouch.id) lookTouch = null;
    }
  };
  dom.addEventListener('touchend', endTouch);
  dom.addEventListener('touchcancel', endTouch);

  // ---------- movement
  function passable(x, y, z) {
    // body probe at knee and chest height
    return sdf.sample(x, y - 0.9, z) < -CLEARANCE * 0.7
        && sdf.sample(x, y - 0.2, z) < -CLEARANCE * 0.55;
  }

  function update(dt) {
    let fwd = 0, str = 0;
    if (!state.active) { keys.clear(); walkVec.x = walkVec.y = 0; }
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
    const x0 = pos.x, z0 = pos.z;
    if (vx !== 0 && passable(pos.x + vx, pos.y, pos.z)) pos.x += vx;
    if (vz !== 0 && passable(pos.x, pos.y, pos.z + vz)) pos.z += vz;
    const moved = Math.hypot(pos.x - x0, pos.z - z0);   // real ground covered

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

    // stride: head bob and footfalls follow ground actually covered, so
    // pushing against a wall neither bobs nor stamps. One bob per step;
    // a hurried stride is longer.
    const stride = speed > 4 ? 0.86 : 0.7;
    state.speed = dt > 0 ? moved / dt : 0;
    const prev = bobT;
    bobT += (moved / stride) * Math.PI * 2;
    // the foot lands at the bottom of the bob (sin = -1)
    const landed = Math.floor((bobT + Math.PI / 2) / (Math.PI * 2)) > Math.floor((prev + Math.PI / 2) / (Math.PI * 2));
    if (landed && state.onStep) state.onStep(Math.min(1, state.speed / 4.6));
    bobAmp += ((state.speed > 0.3 ? 1 : 0) - bobAmp) * Math.min(1, dt * 6);
    const bob = Math.sin(bobT) * 0.028 * bobAmp;

    camera.position.set(pos.x, pos.y + bob, pos.z);
    camera.quaternion.setFromEuler(euler.set(pitch, yaw, 0, 'YXZ'));
  }

  return Object.assign(state, { update });
}
