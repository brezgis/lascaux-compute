// scatter.js — covers the cave in minor figures, Lascaux-dense: random
// interior points cast rays at walls and ceilings, and accepted spots get a
// motif decal. Decals are projected against a triangle-subset proxy of the
// cave mesh so a hundred of them stay cheap to build.

import * as THREE from 'three';
import { DecalGeometry } from '../vendor/DecalGeometry.js';
import { mulberry32 } from './paint.js';
import { MOTIFS, pickKind, bakeMotif } from './motifs.js';
import { LAYOUT, castRay } from './cave.js';

// how crowded each chamber gets
const CHAMBER_DENSITY = {
  vestibule: 9, hall: 30, rotunda: 11, shaft: 9, nave: 25, apse: 5,
};
const TUBE_PER_SEG = 4;

export function scatterPaintings({ sdf, caveMesh, scene, avoid }) {
  const rng = mulberry32(20260702);

  // ---- triangle-subset proxy for fast decal projection
  const posArr = caveMesh.geometry.attributes.position.array;
  const normArr = caveMesh.geometry.attributes.normal.array;
  const idx = caveMesh.geometry.index.array;
  const proxy = new THREE.Mesh(new THREE.BufferGeometry());
  function decalGeometryFast(pos, orientation, size) {
    const r = size.length() * 0.8 + 0.6;
    const r2 = r * r;
    const p = [], n = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const cx = (posArr[a] + posArr[b] + posArr[c]) / 3 - pos.x;
      const cy = (posArr[a + 1] + posArr[b + 1] + posArr[c + 1]) / 3 - pos.y;
      const cz = (posArr[a + 2] + posArr[b + 2] + posArr[c + 2]) / 3 - pos.z;
      if (cx * cx + cy * cy + cz * cz > r2) continue;
      for (const v of [a, b, c]) {
        p.push(posArr[v], posArr[v + 1], posArr[v + 2]);
        n.push(normArr[v], normArr[v + 1], normArr[v + 2]);
      }
    }
    proxy.geometry.dispose();
    proxy.geometry = new THREE.BufferGeometry();
    proxy.geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    proxy.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    proxy.updateMatrixWorld(true);
    return new DecalGeometry(proxy, pos, orientation, size);
  }

  function filterFacing(geo, normal) {
    const p = geo.attributes.position.array;
    const n = geo.attributes.normal.array;
    const uv = geo.attributes.uv.array;
    const P = [], N = [], UV = [];
    for (let t = 0; t < p.length; t += 9) {
      let facing = 0, finite = true;
      for (let v = 0; v < 3; v++) {
        const o = t + v * 3;
        facing += n[o] * normal.x + n[o + 1] * normal.y + n[o + 2] * normal.z;
        if (!Number.isFinite(p[o]) || !Number.isFinite(p[o + 1]) || !Number.isFinite(p[o + 2])) finite = false;
      }
      if (!finite || facing < 0.35 * 3) continue; // mean dot < 0.35 → discard
      for (let v = 0; v < 9; v++) { P.push(p[t + v]); N.push(n[t + v]); }
      const u0 = (t / 9) * 6;
      for (let v = 0; v < 6; v++) UV.push(uv[u0 + v]);
    }
    if (P.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    return g;
  }

  // ---- sampling sites
  const sites = [];
  for (const c of LAYOUT.chambers) {
    sites.push({
      pick() {
        return [c.c[0] + (rng() - 0.5) * c.rx * 1.1, c.f + 1.5 + rng() * 0.6, c.c[1] + (rng() - 0.5) * c.rz * 1.1];
      },
      count: CHAMBER_DENSITY[c.name] || 8,
      pCeil: c.name === 'apse' ? 0.65 : 0.45,
    });
  }
  for (const t of LAYOUT.tubes) {
    for (let s = 0; s < t.pts.length - 1; s++) {
      const [x1, z1] = t.pts[s], [x2, z2] = t.pts[s + 1];
      const f1 = t.f[0] + (t.f[1] - t.f[0]) * (s / (t.pts.length - 1));
      sites.push({
        pick() {
          const u = rng();
          return [x1 + (x2 - x1) * u + (rng() - 0.5), f1 + 1.5 + rng() * 0.5, z1 + (z2 - z1) * u + (rng() - 0.5)];
        },
        count: TUBE_PER_SEG,
        pCeil: 0.5,
      });
    }
  }

  // ---- place
  const placed = [];
  const helper = new THREE.Object3D();
  const variantsPer = 5;
  const texCache = new Map();

  for (const site of sites) {
    let done = 0, tries = 0;
    while (done < site.count && tries++ < site.count * 14) {
      const [ox, oy, oz] = site.pick();
      if (sdf.sample(ox, oy, oz) > -0.4) continue;   // started inside rock

      const up = rng() < site.pCeil;
      let dx, dy, dz;
      if (up) {
        dx = (rng() - 0.5) * 1.2; dy = 1; dz = (rng() - 0.5) * 1.2;
      } else {
        const a = rng() * Math.PI * 2;
        dx = Math.cos(a); dy = (rng() - 0.5) * 0.5; dz = Math.sin(a);
      }
      const L = Math.hypot(dx, dy, dz);
      const hit = castRay(sdf, ox, oy, oz, dx / L, dy / L, dz / L, 9);
      if (!hit) continue;
      if (hit.normal.y > 0.6) continue;              // that's a floor
      const ceilingness = hit.normal.y < -0.55;

      const kind = pickKind(rng, ceilingness);
      const m = MOTIFS[kind];
      const w = m.size[0] + rng() * (m.size[1] - m.size[0]);
      const h = w / m.aspect;

      // keep off the plaqued panels; loose among ourselves (Lascaux overlaps)
      let ok = true;
      for (const a of avoid) {
        if (hit.pos.distanceTo(a.pos) < 2.2 + w * 0.5) { ok = false; break; }
      }
      if (ok) {
        for (const p of placed) {
          if (hit.pos.distanceTo(p.pos) < (w + p.w) * 0.38) { ok = false; break; }
        }
      }
      if (!ok) continue;

      helper.position.copy(hit.pos);
      if (Math.abs(hit.normal.y) > 0.85) {
        // near-vertical normal: horizontal up avoids a singular lookAt
        const ua = rng() * Math.PI * 2;
        helper.up.set(Math.cos(ua), 0, Math.sin(ua));
      } else {
        helper.up.set(0, 1, 0);
      }
      helper.lookAt(hit.pos.clone().add(hit.normal));
      // ceilings get a fully random roll; walls a light hand-tilt
      helper.rotateZ(ceilingness ? rng() * Math.PI * 2 : (rng() - 0.5) * 0.35);

      const canvas = bakeMotif(kind, (rng() * variantsPer) | 0);
      let tex = texCache.get(canvas);
      if (!tex) {
        tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        texCache.set(canvas, tex);
      }

      let geo = decalGeometryFast(hit.pos, helper.rotation, new THREE.Vector3(w, h, 1.3));
      if (!geo.attributes.position || geo.attributes.position.count === 0) continue;
      // keep only triangles that actually face the projector — kills the
      // black shards from geometry caught on the far side of thin rock
      geo = filterFacing(geo, hit.normal);
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map: tex, transparent: true,
        opacity: 0.6 + rng() * 0.4,                  // some figures are older
        roughness: 0.97, metalness: 0,
        polygonOffset: true, polygonOffsetFactor: -3 - (placed.length % 3),
        depthWrite: false,
      }));
      mesh.renderOrder = 1;
      scene.add(mesh);
      placed.push({ pos: hit.pos, w, kind });
      done++;
    }
  }
  return placed;
}
