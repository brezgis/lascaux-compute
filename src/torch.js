// torch.js — the visitor's torch: a held prop in camera space, a flickering
// warm point light, sprite flames and drifting embers. No textures from disk;
// the flame sprites are painted on canvas at boot.

import * as THREE from 'three';

function flameSprite(inner, outer) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S * 0.62, 4, S / 2, S * 0.55, S * 0.45);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeTorch(camera, scene) {
  // --- the light that carries the scene
  const light = new THREE.PointLight(0xffa050, 58, 22, 2.0);
  scene.add(light);
  // faint second bounce so full darkness never swallows geometry
  const fill = new THREE.PointLight(0xff9040, 4, 7, 2.0);
  scene.add(fill);

  // --- held prop, child of camera
  const rig = new THREE.Group();
  camera.add(rig);
  rig.position.set(0.34, -0.34, -0.62);

  // basic (unlit) materials: the torch is a silhouette against its own light.
  // stick + head + flames live in one tilted group so the head sits exactly
  // on the stick's tip no matter the tilt.
  const stickGroup = new THREE.Group();
  stickGroup.rotation.set(0.32, 0, -0.12);
  rig.add(stickGroup);

  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.02, 0.42, 7),
    new THREE.MeshBasicMaterial({ color: 0x241708 }),
  );
  stickGroup.add(stick);

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.017, 0.09, 7),
    new THREE.MeshBasicMaterial({ color: 0xb1571e }),
  );
  head.position.set(0, 0.235, 0); // stick half-length 0.21 + head overlap
  stickGroup.add(head);

  const flameMatA = new THREE.SpriteMaterial({
    map: flameSprite('rgba(255,240,190,0.95)', 'rgba(255,140,30,0.55)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const flameMatB = new THREE.SpriteMaterial({
    map: flameSprite('rgba(255,190,90,0.8)', 'rgba(200,60,10,0.35)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const flames = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(i === 0 ? flameMatA : flameMatB);
    s.position.set(0, 0.315, 0); // just above the head, on the stick axis
    s.scale.set(0.085 - i * 0.015, 0.15 - i * 0.02, 1);
    stickGroup.add(s);
    flames.push(s);
  }

  // --- embers, in world space around the torch tip
  const N = 24;
  const emberGeo = new THREE.BufferGeometry();
  const ep = new Float32Array(N * 3);
  const life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const emberC = document.createElement('canvas');
  emberC.width = emberC.height = 32;
  const ex = emberC.getContext('2d');
  const eg = ex.createRadialGradient(16, 16, 1, 16, 16, 15);
  eg.addColorStop(0, 'rgba(255,200,120,1)');
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
  const tmp = new THREE.Vector3();

  let flicker = 1;

  function update(t, dt) {
    // layered-sine flicker, smooth but lively
    flicker = 0.86
      + 0.1 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1.2)
      + 0.06 * Math.sin(t * 23.7 + Math.sin(t * 2.1) * 2)
      + 0.05 * Math.sin(t * 51.3);
    light.intensity = 58 * flicker;
    fill.intensity = 4 * flicker;

    // light rides slightly ahead of the camera so walls model nicely
    tip.set(0.3, -0.05, -0.5).applyQuaternion(camera.quaternion).add(camera.position);
    light.position.copy(tip);
    fill.position.copy(camera.position);

    for (let i = 0; i < flames.length; i++) {
      const f = flames[i];
      const w = 0.075 + i * 0.014;
      f.scale.set(
        w * (0.9 + 0.2 * Math.sin(t * 13 + i * 2.4)),
        w * (1.7 + 0.4 * Math.sin(t * 17 + i * 1.7)) * flicker,
        1,
      );
      f.position.y = 0.315 + 0.012 * Math.sin(t * 11 + i * 2.2);
      f.material.rotation = Math.sin(t * (5 + i * 2.3)) * 0.24;
    }

    // ember drift
    rig.updateWorldMatrix(true, false);
    tmp.setFromMatrixPosition(flames[0].matrixWorld);
    const pos = emberGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      life[i] += dt * (0.5 + (i % 5) * 0.11);
      if (life[i] > 1) {
        life[i] = 0;
        pos[i * 3] = tmp.x + (Math.random() - 0.5) * 0.04;
        pos[i * 3 + 1] = tmp.y;
        pos[i * 3 + 2] = tmp.z + (Math.random() - 0.5) * 0.04;
      }
      pos[i * 3] += (Math.random() - 0.5) * 0.004;
      pos[i * 3 + 1] += dt * 0.35;
      pos[i * 3 + 2] += (Math.random() - 0.5) * 0.004;
    }
    emberGeo.attributes.position.needsUpdate = true;
    embers.material.opacity = 0.5 * flicker;

    return flicker;
  }

  return { light, update, rig };
}
