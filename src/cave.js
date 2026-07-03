// cave.js — the rock. A signed-distance field describes the chamber system
// (positive = solid rock, negative = open air); naive surface nets mesh it
// into one continuous body. Normals come from the field gradient, ambient
// occlusion from probing the field along the normal, and the same field
// drives player collision and painting placement at runtime.

import * as THREE from 'three';
import { mulberry32 } from './paint.js';

// -------------------------------------------------------------------- layout
// Coordinates in meters. The visitor enters at +z and descends toward -z.

export const LAYOUT = {
  tubes: [
    // [x1,z1, x2,z2, radius, floor1, floor2, squash]
    { pts: [[0, 46], [0, 36]], r: 2.3, f: [0, 0] },                       // entrance
    { pts: [[0, 27.5], [0, 19]], r: 2.5, f: [0, 0] },                     // vestibule -> hall
    { pts: [[-7, 7], [-12, 4], [-16, 2]], r: 2.4, f: [0, 0] },            // hall -> gallery
    { pts: [[-16, 2], [-21, -4], [-22, -10], [-24, -14]], r: 3.0, f: [0, 0] }, // the gallery
    { pts: [[-26.5, -20.5], [-28, -23.5], [-30, -25.5]], r: 2.2, f: [0, -3.2] }, // descent to shaft
    { pts: [[7.5, 7.5], [11.5, 4.5], [13.5, 2.5]], r: 2.4, f: [0, 0] },   // hall -> nave
    { pts: [[17.5, -7], [18.5, -10.5]], r: 1.8, f: [0, 0], squash: 0.72 }, // crawl to apse
  ],
  chambers: [
    { c: [0, 31], rx: 4.5, ry: 3.4, rz: 4.2, f: 0, name: 'vestibule' },
    { c: [0, 10], rx: 10, ry: 5.4, rz: 9, f: 0, name: 'hall' },
    { c: [-25.5, -17.5], rx: 4.8, ry: 3.6, rz: 4.4, f: 0, name: 'rotunda' },
    { c: [-30.5, -27], rx: 5.2, ry: 4.2, rz: 4.8, f: -3.2, name: 'shaft' },
    { c: [17, 0], rx: 7.5, ry: 4.8, rz: 8, f: 0, name: 'nave' },
    { c: [19, -13], rx: 3.6, ry: 2.5, rz: 3.8, f: 0, name: 'apse' },
  ],
};

// chamber name toasts + rough trigger radii
export const CHAMBER_ZONES = [
  { name: 'THE VESTIBULE', sub: 'the signatures of the first hands', x: 0, z: 31, r: 5 },
  { name: 'THE HALL OF AUTOMATA', sub: 'the great beasts of computation', x: 0, z: 10, r: 9.5 },
  { name: 'THE GALLERY OF INFORMATION', sub: 'what may be said, and how surely', x: -21, z: -6, r: 7 },
  { name: 'THE ROTUNDA', sub: 'the laws of the herd', x: -25.5, z: -17.5, r: 5 },
  { name: 'THE SHAFT OF THE PERCEPTRON', sub: 'tread quietly. something fell here.', x: -30.5, z: -27, r: 5.5 },
  { name: 'THE NAVE OF SPEECH', sub: 'the animals that talk', x: 17, z: 0, r: 8 },
  { name: 'THE APSE', sub: 'recent intrusion — cataloging disputed', x: 19, z: -13, r: 4 },
];

// painting placements: probe from an interior point toward the wall
export const PLACEMENTS = {
  hands:      { from: [0.5, 31], dir: [-1, 0.15], y: 1.75 },
  turing:     { from: [0, 12], dir: [0, -1], y: 2.1 },
  lambda:     { from: [-3.5, 11], dir: [-0.45, 1], y: 1.8 },
  vonneumann: { from: [3, 10], dir: [1, 0.12], y: 1.8 },
  eniac:      { from: [-3, 10.5], dir: [-1, 0.1], y: 1.8 },
  bug:        { from: [-3.5, 8.5], dir: [-1, -0.15], y: 1.5 },
  entropy:    { from: [-17.5, 0], dir: [0.75, -0.66], y: 1.7 },
  markov:     { from: [-19.5, -2.5], dir: [-0.75, 0.66], y: 1.7 },
  trigram:    { from: [-21.5, -7.5], dir: [1, -0.15], y: 1.7 },
  zipf:       { from: [-25, -17], dir: [-0.85, 0.3], y: 1.75 },
  hamming:    { from: [-25, -18.5], dir: [0.8, -0.45], y: 1.7 },
  chomsky:    { from: [14.5, -2.5], dir: [-0.45, -1], y: 1.85 },
  eliza:      { from: [18, 0], dir: [1, 0.25], y: 1.7 },
  hmm:        { from: [17.5, 2], dir: [0.6, 0.8], y: 1.7 },
  mt:         { from: [17, 3], dir: [0.12, 1], y: 1.7 },
  xor:        { from: [-30, -26], dir: [-0.65, -0.75], y: 1.9, big: true },
  backprop:   { from: [-30, -26.5], dir: [0.9, 0.35], y: 1.85 },
  attention:  { from: [19, -12], dir: [0.35, -1], y: 1.45 },
  loom:       { from: [-21.7, -6.5], dir: [0.25, -0.2], el: 1.6, y: 1.6 },
};

// ------------------------------------------------------------------ 3D noise

function makeNoise3(seed) {
  const rng = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const g = new Float32Array(256);
  for (let i = 0; i < 256; i++) g[i] = rng() * 2 - 1;

  return function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const X = xi & 255, Y = yi & 255, Z = zi & 255;
    const A = perm[X] + Y, B = perm[X + 1] + Y;
    const AA = perm[A] + Z, AB = perm[A + 1] + Z, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    const lerp = (a, b, t) => a + (b - a) * t;
    return lerp(
      lerp(lerp(g[perm[AA] & 255], g[perm[BA] & 255], u), lerp(g[perm[AB] & 255], g[perm[BB] & 255], u), v),
      lerp(lerp(g[perm[AA + 1] & 255], g[perm[BA + 1] & 255], u), lerp(g[perm[AB + 1] & 255], g[perm[BB + 1] & 255], u), v),
      w);
  };
}

// --------------------------------------------------------------------- field

const H = 0.55;               // grid cell (m)
const ORIGIN = [-38, -6, -35];
const DIMS = [122, 31, 156];  // cells; corners are +1

export function buildField(onProgress) {
  const noise3 = makeNoise3(1234);
  const [nx, ny, nz] = DIMS;
  const cx = nx + 1, cy = ny + 1, cz = nz + 1;
  const field = new Float32Array(cx * cy * cz);

  // flatten parts into capsule segments + ellipsoids
  const segs = [];
  for (const t of LAYOUT.tubes) {
    const total = t.pts.length - 1;
    for (let i = 0; i < total; i++) {
      const fa = t.f[0] + (t.f[1] - t.f[0]) * (i / total);
      const fb = t.f[0] + (t.f[1] - t.f[0]) * ((i + 1) / total);
      segs.push({
        a: [t.pts[i][0], fa + t.r * 0.85, t.pts[i][1]],
        b: [t.pts[i + 1][0], fb + t.r * 0.85, t.pts[i + 1][1]],
        r: t.r, sq: t.squash || 1.12, fa, fb,
      });
    }
  }
  const chs = LAYOUT.chambers.map((c) => ({
    c: [c.c[0], c.f + c.ry * 0.6, c.c[1]], rx: c.rx, ry: c.ry, rz: c.rz, f: c.f,
  }));

  // local floor height: inverse-distance-weighted over parts
  function floorAt(x, z) {
    let wsum = 0, fsum = 0;
    for (const s of segs) {
      const dx = s.b[0] - s.a[0], dz = s.b[2] - s.a[2];
      const L2 = dx * dx + dz * dz || 1;
      let t = ((x - s.a[0]) * dx + (z - s.a[2]) * dz) / L2;
      t = Math.max(0, Math.min(1, t));
      const px = s.a[0] + dx * t, pz = s.a[2] + dz * t;
      const d2 = (x - px) * (x - px) + (z - pz) * (z - pz) + 0.3;
      const w = 1 / (d2 * d2);
      wsum += w; fsum += w * (s.fa + (s.fb - s.fa) * t);
    }
    for (const c of chs) {
      const d2 = (x - c.c[0]) * (x - c.c[0]) + (z - c.c[2]) * (z - c.c[2]) + 0.3;
      const w = 1.6 / (d2 * d2);
      wsum += w; fsum += w * c.f;
    }
    return fsum / wsum;
  }

  const smin = (a, b, k) => {
    const h2 = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h2 * h2 * k * 0.25;
  };

  // the collapse that sealed the entrance: solid boulders carved back
  // out of the open tube, so they mesh as one body with the cave
  const boulders = [
    [0.0, 0.4, 46.2, 1.5], [-1.3, 0.3, 45.6, 1.1], [1.4, 0.35, 45.8, 1.15],
    [-0.5, 1.5, 46.4, 1.2], [0.9, 1.6, 46.3, 1.05], [0.1, 2.6, 46.6, 1.1],
    [-1.6, 1.2, 46.6, 0.9],
  ];

  // distance to open volume (negative inside)
  function baseDist(x, y, z) {
    let d = 1e9;
    for (const s of segs) {
      const dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], dz = s.b[2] - s.a[2];
      const L2 = dx * dx + dy * dy + dz * dz || 1;
      let t = ((x - s.a[0]) * dx + (y - s.a[1]) * dy + (z - s.a[2]) * dz) / L2;
      t = Math.max(0, Math.min(1, t));
      const px = x - (s.a[0] + dx * t), py = (y - (s.a[1] + dy * t)) / s.sq, pz = z - (s.a[2] + dz * t);
      d = smin(d, Math.sqrt(px * px + py * py + pz * pz) - s.r, 2.2);
    }
    for (const c of chs) {
      const px = (x - c.c[0]) / c.rx, py = (y - c.c[1]) / c.ry, pz = (z - c.c[2]) / c.rz;
      const k = Math.sqrt(px * px + py * py + pz * pz);
      const m = Math.min(c.rx, Math.min(c.ry, c.rz));
      d = smin(d, (k - 1) * m, 2.6);
    }
    for (const [bx, by, bz, br] of boulders) {
      const db = Math.hypot(x - bx, y - by, z - bz) - br;
      d = Math.max(d, -db + 0.12);
    }
    return d;
  }

  // horizontal distance to parts (for column skipping)
  function colDist(x, z) {
    let d = 1e9;
    for (const s of segs) {
      const dx = s.b[0] - s.a[0], dz = s.b[2] - s.a[2];
      const L2 = dx * dx + dz * dz || 1;
      let t = ((x - s.a[0]) * dx + (z - s.a[2]) * dz) / L2;
      t = Math.max(0, Math.min(1, t));
      const px = x - (s.a[0] + dx * t), pz = z - (s.a[2] + dz * t);
      d = Math.min(d, Math.hypot(px, pz) - s.r);
    }
    for (const c of chs) {
      d = Math.min(d, Math.hypot(x - c.c[0], z - c.c[2]) - Math.max(c.rx, c.rz));
    }
    return d;
  }

  const SOLID = 4;
  const floors = new Float32Array(cx * cz);
  for (let k = 0; k < cz; k++) {
    for (let i = 0; i < cx; i++) {
      floors[k * cx + i] = floorAt(ORIGIN[0] + i * H, ORIGIN[2] + k * H);
    }
  }

  let idx = 0;
  for (let k = 0; k < cz; k++) {
    const z = ORIGIN[2] + k * H;
    for (let j = 0; j < cy; j++) {
      const y = ORIGIN[1] + j * H;
      for (let i = 0; i < cx; i++) {
        const x = ORIGIN[0] + i * H;
        // the lattice boundary is always rock, so the mesh can never
        // open a hole to the void
        if (j === 0 || j === cy - 1 || i === 0 || i === cx - 1 || k === 0 || k === cz - 1) {
          field[idx++] = SOLID; continue;
        }
        const cd = colDist(x, z);
        if (cd > 2.5) { field[idx++] = SOLID; continue; }
        let d = baseDist(x, y, z);
        if (d < 2.2) {
          // rocky irregularity; ceilings get extra gnarl
          const up = Math.max(0, Math.min(1, (y - 1.5) / 4));
          d += noise3(x * 0.31 + y * 0.09, y * 0.29 + z * 0.07, z * 0.31 + x * 0.06) * (0.62 + up * 0.4)
             + noise3(x * 0.62 + 13.7, y * 0.58, z * 0.62) * 0.3
             + noise3(x * 1.1, y * 1.05 + 7.3, z * 1.1) * 0.14;
        }
        // flat-ish walkable floor with slight bumps
        const fl = floors[k * cx + i] + noise3(x * 0.8, 7.7, z * 0.8) * 0.07;
        d = Math.max(d, fl - y);
        field[idx++] = Math.min(d, SOLID);
      }
    }
    if (onProgress && (k & 7) === 0) onProgress(k / cz);
  }

  return {
    field, floors,
    dims: DIMS, origin: ORIGIN, h: H,
    sample(x, y, z) {
      // trilinear sample, clamped
      const gx = (x - ORIGIN[0]) / H, gy = (y - ORIGIN[1]) / H, gz = (z - ORIGIN[2]) / H;
      const i = Math.max(0, Math.min(DIMS[0] - 1, Math.floor(gx)));
      const j = Math.max(0, Math.min(DIMS[1] - 1, Math.floor(gy)));
      const k = Math.max(0, Math.min(DIMS[2] - 1, Math.floor(gz)));
      const fx = Math.max(0, Math.min(1, gx - i)), fy = Math.max(0, Math.min(1, gy - j)), fz = Math.max(0, Math.min(1, gz - k));
      const I = (ii, jj, kk) => field[(kk * cy + jj) * cx + ii];
      const c00 = I(i, j, k) * (1 - fx) + I(i + 1, j, k) * fx;
      const c10 = I(i, j + 1, k) * (1 - fx) + I(i + 1, j + 1, k) * fx;
      const c01 = I(i, j, k + 1) * (1 - fx) + I(i + 1, j, k + 1) * fx;
      const c11 = I(i, j + 1, k + 1) * (1 - fx) + I(i + 1, j + 1, k + 1) * fx;
      return (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
    },
    grad(x, y, z, out) {
      const e = 0.28;
      out.set(
        this.sample(x + e, y, z) - this.sample(x - e, y, z),
        this.sample(x, y + e, z) - this.sample(x, y - e, z),
        this.sample(x, y, z + e) - this.sample(x, y, z - e),
      );
      return out.normalize();
    },
    floorHeight(x, z) {
      const gx = (x - ORIGIN[0]) / H, gz = (z - ORIGIN[2]) / H;
      const i = Math.max(0, Math.min(DIMS[0] - 1, Math.floor(gx)));
      const k = Math.max(0, Math.min(DIMS[2] - 1, Math.floor(gz)));
      const fx = gx - i, fz = gz - k;
      const F = (ii, kk) => floors[kk * cx + ii];
      return (F(i, k) * (1 - fx) + F(i + 1, k) * fx) * (1 - fz)
           + (F(i, k + 1) * (1 - fx) + F(i + 1, k + 1) * fx) * fz;
    },
  };
}

// ------------------------------------------------------------- surface nets

export function meshFromField(sdf, onProgress) {
  const { field, dims, origin, h } = sdf;
  const [nx, ny, nz] = dims;
  const cx = nx + 1, cy = ny + 1;
  const I = (i, j, k) => field[(k * cy + j) * cx + i];

  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const CV = (i, j, k) => cellVert[(k * ny + j) * nx + i];

  const positions = [];
  const cellOf = [];

  // pass 1: one vertex per sign-crossing cell (mean of edge crossings)
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const vals = new Array(8);
        let sign = 0, mixed = false;
        for (let c = 0; c < 8; c++) {
          vals[c] = I(i + corners[c][0], j + corners[c][1], k + corners[c][2]);
          const s = vals[c] > 0 ? 1 : -1;
          if (c === 0) sign = s;
          else if (s !== sign) mixed = true;
        }
        if (!mixed) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          const va = vals[a], vb = vals[b];
          if ((va > 0) === (vb > 0)) continue;
          const t = va / (va - vb);
          sx += corners[a][0] + (corners[b][0] - corners[a][0]) * t;
          sy += corners[a][1] + (corners[b][1] - corners[a][1]) * t;
          sz += corners[a][2] + (corners[b][2] - corners[a][2]) * t;
          n++;
        }
        cellVert[(k * ny + j) * nx + i] = positions.length / 3;
        positions.push(
          origin[0] + (i + sx / n) * h,
          origin[1] + (j + sy / n) * h,
          origin[2] + (k + sz / n) * h,
        );
        cellOf.push(i, j, k);
      }
    }
    if (onProgress && (k & 15) === 0) onProgress(k / nz);
  }

  // pass 2: quads across sign-changing grid edges
  const indices = [];
  function quad(v0, v1, v2, v3, flip) {
    if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) return;
    if (flip) indices.push(v0, v1, v2, v0, v2, v3);
    else indices.push(v0, v2, v1, v0, v3, v2);
  }
  for (let k = 1; k < nz; k++) {
    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        const v000 = I(i, j, k);
        // x-edge
        const vx = I(i + 1, j, k);
        if ((v000 > 0) !== (vx > 0)) {
          quad(CV(i, j - 1, k - 1), CV(i, j, k - 1), CV(i, j, k), CV(i, j - 1, k), v000 > 0);
        }
        // y-edge
        const vy = I(i, j + 1, k);
        if ((v000 > 0) !== (vy > 0)) {
          quad(CV(i - 1, j, k - 1), CV(i - 1, j, k), CV(i, j, k), CV(i, j, k - 1), v000 > 0);
        }
        // z-edge
        const vz = I(i, j, k + 1);
        if ((v000 > 0) !== (vz > 0)) {
          quad(CV(i - 1, j - 1, k), CV(i, j - 1, k), CV(i, j, k), CV(i - 1, j, k), v000 > 0);
        }
      }
    }
  }

  // normals from field gradient + baked AO/color in vertex colors
  const vcount = positions.length / 3;
  const normals = new Float32Array(vcount * 3);
  const colors = new Float32Array(vcount * 3);
  const g = new THREE.Vector3();
  const noiseC = makeNoise3(777);
  for (let v = 0; v < vcount; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    sdf.grad(x, y, z, g); // gradient points into rock
    normals[v * 3] = -g.x; normals[v * 3 + 1] = -g.y; normals[v * 3 + 2] = -g.z;
    // AO: probe openness along the (into-air) normal
    let occ = 0;
    const probes = [[0.5, 0.5], [1.2, 1.2], [2.4, 2.4]];
    for (const [d, ref] of probes) {
      const s = sdf.sample(x - g.x * d, y - g.y * d, z - g.z * d);
      occ += Math.max(0, Math.min(1, 1 - (-s) / ref));
    }
    const ao = 1 - 0.36 * (occ / 3) ** 1.3 * 2.3;
    // large-scale mineral variation: warmer pockets, greyer pockets
    const m = noiseC(x * 0.05, y * 0.05, z * 0.05);
    const m2 = noiseC(x * 0.13 + 40, y * 0.13, z * 0.13);
    let r = 0.72 + m * 0.14 + m2 * 0.05;
    let gg = 0.64 + m * 0.09 + m2 * 0.04;
    let b = 0.52 + m * 0.03 + m2 * 0.03;
    const aoC = Math.max(0.25, ao);
    colors[v * 3] = r * aoC; colors[v * 3 + 1] = gg * aoC; colors[v * 3 + 2] = b * aoC;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

// ------------------------------------------------------------ rock material

export function makeRockTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const rng = mulberry32(99);
  x.fillStyle = '#a8977d';
  x.fillRect(0, 0, S, S);
  // mineral mottling (kept tileable by wrapping stamps)
  const blob = (bx, by, r, style) => {
    x.fillStyle = style;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      x.beginPath(); x.arc(bx + ox, by + oy, r, 0, 6.29); x.fill();
    }
  };
  for (let i = 0; i < 900; i++) {
    const v = 120 + rng() * 95;
    blob(rng() * S, rng() * S, 2 + rng() * 22, `rgba(${v * 1.1},${v},${v * 0.8},${0.05 + rng() * 0.1})`);
  }
  for (let i = 0; i < 700; i++) {
    blob(rng() * S, rng() * S, 1.5 + rng() * 13, `rgba(52,42,32,${0.05 + rng() * 0.1})`);
  }
  // fine grain
  const img = x.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rng() - 0.5) * 18;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeRockMaterial() {
  const tex = makeRockTexture();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.rockTex = { value: tex };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWPos = (modelMatrix * vec4(position,1.0)).xyz;\nvWNorm = normalize(mat3(modelMatrix) * normal);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D rockTex;\nvarying vec3 vWPos;\nvarying vec3 vWNorm;\nfloat grotteH = 0.0;\nvec3 triplanar(sampler2D t, vec3 p, vec3 n, float s){\n  vec3 an = abs(n); an = an / (an.x + an.y + an.z);\n  vec3 cx = texture2D(t, p.zy * s).rgb;\n  vec3 cy = texture2D(t, p.xz * s).rgb;\n  vec3 cz = texture2D(t, p.xy * s).rgb;\n  return cx * an.x + cy * an.y + cz * an.z;\n}')
      .replace('#include <color_fragment>',
        `#include <color_fragment>
        vec3 rockA = triplanar(rockTex, vWPos, vWNorm, 0.24);
        vec3 rockB = triplanar(rockTex, vWPos, vWNorm, 0.043);
        vec3 rock = rockA * 0.7 + rockB * 0.5;
        grotteH = dot(rockB, vec3(0.55)) + dot(rockA, vec3(0.12));
        diffuseColor.rgb *= rock * 1.45;`)
      .replace('#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          vec3 sx = dFdx(-vViewPosition);
          vec3 sy = dFdy(-vViewPosition);
          vec3 r1 = cross(sy, normal);
          vec3 r2 = cross(normal, sx);
          float det = dot(sx, r1);
          float dhx = dFdx(grotteH);
          float dhy = dFdy(grotteH);
          vec3 vGrad = sign(det) * (dhx * r1 + dhy * r2);
          normal = normalize(abs(det) * normal - 0.3 * vGrad);
        }`);
  };
  return mat;
}

// -------------------------------------------------- painting anchor solving

// March a ray through the field from an interior point to the wall.
// spec.dir is [dx, dz] horizontal; spec.el adds an upward component
// (el = 1 → mostly at the ceiling). Also usable directly via castRay.
export function castRay(sdf, ox, oy, oz, dx, dy, dz, maxDist = 14) {
  let t = 0;
  const step = 0.12;
  while (t < maxDist) {
    t += step;
    const v = sdf.sample(ox + dx * t, oy + dy * t, oz + dz * t);
    if (v >= -0.02) {
      // bisect back for precision
      let lo = t - step, hi = t;
      for (let b = 0; b < 6; b++) {
        const mid = (lo + hi) / 2;
        if (sdf.sample(ox + dx * mid, oy + dy * mid, oz + dz * mid) >= -0.02) hi = mid;
        else lo = mid;
      }
      t = (lo + hi) / 2;
      const pos = new THREE.Vector3(ox + dx * t, oy + dy * t, oz + dz * t);
      const g = new THREE.Vector3();
      sdf.grad(pos.x, pos.y, pos.z, g);        // into rock
      return { pos, normal: g.negate(), dist: t };
    }
  }
  return null;
}

export function solveAnchor(sdf, spec) {
  const [fx, fz] = spec.from;
  const fy = sdf.floorHeight(fx, fz) + spec.y;
  const el = spec.el || 0;
  const d = Math.hypot(spec.dir[0], el, spec.dir[1]);
  const hit = castRay(sdf, fx, fy, fz, spec.dir[0] / d, el / d, spec.dir[1] / d);
  if (hit) return hit;
  // fallback: should not happen, but never return garbage
  return { pos: new THREE.Vector3(fx, fy, fz), normal: new THREE.Vector3(0, 0, 1) };
}
