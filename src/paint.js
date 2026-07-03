// paint.js — the pigment engine.
// Strokes are laid down as chains of overlapping "daubs" (finger-pad stamps)
// with wobble, taper, width jitter and dry-brush gaps, then weathered with
// noise erosion so the pigment reads as sunk into rock, not drawn on glass.

// ---------------------------------------------------------------- rng / noise

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(rng) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) grad[i] = rng();

  const fade = (t) => t * t * (3 - 2 * t);

  function noise1(x) {
    const xi = Math.floor(x), xf = x - xi;
    const a = grad[perm[xi & 255]], b = grad[perm[(xi + 1) & 255]];
    return a + (b - a) * fade(xf);
  }
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const aa = grad[perm[(perm[xi & 255] + yi) & 255]];
    const ba = grad[perm[(perm[(xi + 1) & 255] + yi) & 255]];
    const ab = grad[perm[(perm[xi & 255] + yi + 1) & 255]];
    const bb = grad[perm[(perm[(xi + 1) & 255] + yi + 1) & 255]];
    const u = fade(xf), v = fade(yf);
    return (aa + (ba - aa) * u) + ((ab + (bb - ab) * u) - (aa + (ba - aa) * u)) * v;
  }
  function fbm2(x, y, oct = 4) {
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { s += amp * noise2(x * f, y * f); amp *= 0.5; f *= 2.03; }
    return s / (1 - Math.pow(0.5, oct));
  }
  return { noise1, noise2, fbm2 };
}

// ---------------------------------------------------------------- pigments

// Real upper-paleolithic palette: iron oxides, manganese, charcoal, kaolin.
export const PIGMENTS = {
  red:    [166, 62, 33],    // red ochre / hematite
  rust:   [143, 51, 30],
  yellow: [197, 137, 55],   // yellow ochre / goethite
  char:   [38, 30, 25],     // charcoal
  brown:  [92, 55, 35],     // manganese-ish brown
  white:  [214, 199, 175],  // kaolin
  green:  [96, 112, 74],    // "pigment of disputed provenance" (chomsky panel joke)
};

function resolveColor(c) {
  if (Array.isArray(c)) return c;
  return PIGMENTS[c] || PIGMENTS.char;
}

function jitterColor(rgb, rng, amt = 14) {
  return rgb.map((v) => Math.max(0, Math.min(255, Math.round(v + (rng() - 0.5) * 2 * amt))));
}

// ---------------------------------------------------------------- geometry

// Catmull-Rom resample of a polyline (points as [x,y] pairs in px).
function resample(pts, step) {
  if (pts.length < 2) return pts.slice();
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  for (let i = 0; i < P.length - 3; i++) {
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]];
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(seg / step));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

// ---------------------------------------------------------------- painter

export function makePainter(ctx, W, H, seed = 1) {
  const rng = mulberry32(seed);
  const nz = makeNoise(mulberry32(seed ^ 0x9e3779b9));
  const spriteCache = new Map();

  // Pre-rendered daub stamps for a pigment: irregular soft blobs + granules.
  function daubSprites(colorKeyOrRgb) {
    const rgb = resolveColor(colorKeyOrRgb);
    const key = rgb.join(',');
    if (spriteCache.has(key)) return spriteCache.get(key);
    const sprites = [];
    for (let s = 0; s < 8; s++) {
      const c = document.createElement('canvas');
      c.width = c.height = 48;
      const x = c.getContext('2d');
      const col = jitterColor(rgb, rng, 10);
      const blobs = 2 + ((rng() * 2) | 0);
      for (let b = 0; b < blobs; b++) {
        const bx = 24 + (rng() - 0.5) * 14;
        const by = 24 + (rng() - 0.5) * 14;
        const br = 9 + rng() * 9;
        x.save();
        x.translate(bx, by);
        x.rotate(rng() * Math.PI);
        x.scale(1, 0.6 + rng() * 0.6);
        const g = x.createRadialGradient(0, 0, br * 0.15, 0, 0, br);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.8 + rng() * 0.2})`);
        g.addColorStop(0.6, `rgba(${col[0]},${col[1]},${col[2]},${0.4 + rng() * 0.2})`);
        g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        x.fillStyle = g;
        x.beginPath(); x.arc(0, 0, br, 0, Math.PI * 2); x.fill();
        x.restore();
      }
      // pigment granules
      const gr = 4 + ((rng() * 8) | 0);
      x.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`;
      for (let i = 0; i < gr; i++) {
        x.fillRect(24 + (rng() - 0.5) * 34, 24 + (rng() - 0.5) * 34, 1 + rng(), 1 + rng());
      }
      sprites.push(c);
    }
    spriteCache.set(key, sprites);
    return sprites;
  }

  function stamp(sprites, x, y, r, alpha, rot) {
    const s = sprites[(rng() * sprites.length) | 0];
    const sc = (r * 2) / 30; // sprite blob ~30px effective
    ctx.globalAlpha = alpha;
    ctx.setTransform(sc, 0, 0, sc, x, y);
    ctx.rotate(rot);
    ctx.drawImage(s, -24, -24);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  // Normalized (0..1) → px
  const X = (v) => v * W;
  const Y = (v) => v * H;

  // The workhorse. pts in normalized coords.
  // opts: color, w (px), alpha, wobble (0..1), dry (0..1), taper (0..1),
  //       jitter (start-noise phase), sharp (less blob overlap)
  function stroke(pts, opts = {}) {
    const {
      color = 'char', w = 9, alpha = 0.75, wobble = 0.6,
      dry = 0.25, taper = 0.6,
    } = opts;
    const sprites = daubSprites(color);
    const px = pts.map((p) => [X(p[0]), Y(p[1])]);
    const step = Math.max(1.6, w * 0.28);
    const path = resample(px, step);
    if (path.length < 2) return;
    const ph1 = rng() * 100, ph2 = rng() * 100, ph3 = rng() * 100;
    let total = 0;
    for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    let dist = 0;
    for (let i = 0; i < path.length; i++) {
      if (i > 0) dist += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      const t = total > 0 ? dist / total : 0;
      // perpendicular wobble
      const j = Math.min(path.length - 1, i + 1);
      const k = Math.max(0, i - 1);
      let tx = path[j][0] - path[k][0], ty = path[j][1] - path[k][1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const wob = (nz.noise1(t * 7 + ph1) - 0.5) * 2 * wobble * w * 0.55;
      const xx = path[i][0] - ty * wob;
      const yy = path[i][1] + tx * wob;
      // taper at both ends
      const tIn = Math.min(1, t / (0.12 * taper + 0.02));
      const tOut = Math.min(1, (1 - t) / (0.16 * taper + 0.02));
      const tap = 0.3 + 0.7 * Math.min(tIn, tOut);
      const wi = w * tap * (0.6 + 0.8 * nz.noise1(t * 4.3 + ph2));
      // dry gaps
      const d = nz.noise1(t * 9 + ph3);
      if (d < dry * 0.55) {
        if (rng() < 0.3) stamp(sprites, xx, yy, wi * 0.25, alpha * 0.4, rng() * 6.28);
        continue;
      }
      stamp(sprites, xx, yy, wi * 0.5, alpha, rng() * 6.28);
    }
  }

  function line(x1, y1, x2, y2, opts) {
    const mx = (x1 + x2) / 2 + (rng() - 0.5) * 0.008;
    const my = (y1 + y2) / 2 + (rng() - 0.5) * 0.008;
    stroke([[x1, y1], [mx, my], [x2, y2]], opts);
  }

  function ring(cx, cy, r, opts = {}) {
    const n = 10;
    const a0 = rng() * 6.28;
    const pts = [];
    const rx = r, ry = r * (opts.squash || 1);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * rx * (1 + (rng() - 0.5) * 0.12),
                cy + Math.sin(a) * ry * (1 + (rng() - 0.5) * 0.12) * (H ? W / H : 1) * (opts.aspectFix === false ? H / W : 1)]);
    }
    stroke(pts, { taper: 0, ...opts });
  }

  // circle in *visual* proportions: radius given as fraction of W for both axes
  function circle(cx, cy, r, opts = {}) {
    const n = 11;
    const a0 = rng() * 6.28;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r * (1 + (rng() - 0.5) * 0.1),
                cy + Math.sin(a) * r * (W / H) * (1 + (rng() - 0.5) * 0.1)]);
    }
    stroke(pts, { taper: 0, ...opts });
  }

  function dot(x, y, r, opts = {}) {
    const { color = 'char', alpha = 0.75 } = opts;
    const sprites = daubSprites(color);
    const n = 2 + ((rng() * 3) | 0);
    for (let i = 0; i < n; i++) {
      stamp(sprites, X(x) + (rng() - 0.5) * r * 0.5, Y(y) + (rng() - 0.5) * r * 0.5,
        r * (0.5 + rng() * 0.4), alpha, rng() * 6.28);
    }
  }

  function dots(list, r, opts) {
    for (const [x, y] of list) dot(x, y, r * (0.8 + rng() * 0.4), opts);
  }

  function arrow(x1, y1, x2, y2, opts = {}) {
    line(x1, y1, x2, y2, opts);
    const a = Math.atan2((y2 - y1) * H, (x2 - x1) * W);
    const hl = (opts.head || 14) / W;
    const hlY = (opts.head || 14) / H;
    for (const s of [-1, 1]) {
      const b = a + Math.PI + s * 0.5;
      stroke([[x2, y2], [x2 + Math.cos(b) * hl, y2 + Math.sin(b) * hlY]],
        { ...opts, taper: 0.3 });
    }
  }

  // spatter spray for negative stencils; excludePath is a Path2D in px coords.
  function spray(cx, cy, rad, opts = {}) {
    const { color = 'red', density = 1, alpha = 0.5, excludePath = null } = opts;
    const rgb = resolveColor(color);
    const cxp = X(cx), cyp = Y(cy), radp = rad * W;
    const n = Math.floor(radp * radp * 0.16 * density);
    const clump = rng() * 100;
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const rr = Math.sqrt(rng()) * radp;
      const x = cxp + Math.cos(a) * rr;
      const y = cyp + Math.sin(a) * rr * 1.05;
      if (excludePath && ctx.isPointInPath(excludePath, x, y)) continue;
      const fall = 1 - (rr / radp);
      const cl = nz.noise2(x * 0.02 + clump, y * 0.02);
      const al = alpha * (0.25 + 0.75 * fall) * (0.35 + 0.85 * cl);
      if (al < 0.03) continue;
      const col = jitterColor(rgb, rng, 12);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${Math.min(1, al)})`;
      const s = 0.8 + rng() * 2.1;
      ctx.beginPath(); ctx.arc(x, y, s, 0, 6.29); ctx.fill();
    }
  }

  // patchy interior fill bounded by a closed normalized path
  function wash(pts, opts = {}) {
    const { color = 'red', alpha = 0.13, density = 1, w = 13 } = opts;
    const sprites = daubSprites(color);
    const px = resample(pts.map((p) => [X(p[0]), Y(p[1])]), 4);
    const path = new Path2D();
    px.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
    path.closePath();
    ctx.save();
    ctx.clip(path);
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const p of px) {
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    }
    const stepY = w * 0.75;
    const ph = rng() * 50;
    for (let y = minY; y <= maxY; y += stepY) {
      for (let x = minX; x <= maxX; x += w * 0.55) {
        const nv = nz.fbm2(x * 0.012 + ph, y * 0.012, 3);
        if (nv < 0.42 / density) continue;
        stamp(sprites, x + (rng() - 0.5) * w, y + (rng() - 0.5) * stepY,
          w * (0.4 + rng() * 0.5), alpha * (0.5 + nv), rng() * 6.28);
      }
    }
    ctx.restore();
  }

  // proto-writing: rows of little marks. Returns [x,y] anchor of each glyph.
  function glyphs(x, y, count, size, opts = {}) {
    const { gap = 1.7, kinds = null, hollow = false } = opts;
    const out = [];
    const sw = Math.max(3, size * W * 0.16);
    for (let i = 0; i < count; i++) {
      const gx = x + i * size * gap;
      const gy = y + (rng() - 0.5) * size * 0.3;
      out.push([gx, gy]);
      const kind = kinds ? kinds[i % kinds.length] : (rng() * 6) | 0;
      const o = { ...opts, w: sw, taper: 0.3, wobble: 0.5 };
      const s = size, sy = size * (W / H);
      if (hollow) { circle(gx, gy + sy * 0.0, s * 0.4, { ...o, w: sw * 0.8 }); continue; }
      switch (kind) {
        case 0: line(gx, gy - sy * 0.5, gx, gy + sy * 0.5, o); break;
        case 1: line(gx - s * 0.15, gy - sy * 0.5, gx - s * 0.15, gy + sy * 0.5, o);
                line(gx + s * 0.25, gy - sy * 0.45, gx + s * 0.25, gy + sy * 0.5, o); break;
        case 2: line(gx - s * 0.3, gy - sy * 0.4, gx + s * 0.3, gy + sy * 0.4, o);
                line(gx + s * 0.3, gy - sy * 0.4, gx - s * 0.3, gy + sy * 0.4, o); break;
        case 3: stroke([[gx - s * 0.35, gy + sy * 0.4], [gx, gy - sy * 0.45], [gx + s * 0.35, gy + sy * 0.4]], o); break;
        case 4: circle(gx, gy, s * 0.32, o); break;
        default:
          stroke([[gx - s * 0.3, gy - sy * 0.35], [gx + s * 0.3, gy - sy * 0.35], [gx - s * 0.25, gy + sy * 0.4]], o);
      }
    }
    return out;
  }

  // weathering pass: erode alpha with fbm so pigment sits *in* the rock.
  function weather(amount = 1) {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const ph = rng() * 100;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4 + 3;
        const a = d[idx];
        if (a === 0) continue;
        const e = nz.fbm2(x * 0.012 + ph, y * 0.012, 4);          // patchy wear
        const h = nz.noise2(x * 0.11 + ph * 2, y * 0.11);          // granular
        let f = (0.62 + 0.48 * e) * (0.82 + 0.26 * h);
        if (e < 0.26) f *= 0.5;                                     // worn-away patches
        f = 1 - (1 - f) * amount;
        d[idx] = Math.max(0, Math.min(255, a * f * 1.35));
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return {
    rng, nz, W, H, ctx,
    stroke, line, ring, circle, dot, dots, arrow, spray, wash, glyphs, weather,
    X, Y,
  };
}
