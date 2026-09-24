// forms.js — the shared vocabulary of the painters: spirals, beasts, stick
// figures, hand silhouettes, and the small furniture of computation (gears,
// cards, pots, huts) that recur across panels and lesser figures.
//
// All coordinates are normalized to the panel canvas; `ar` = W/H converts a
// horizontal length into the equal-looking vertical one.

export function spiralPts(cx, cy, r0, r1, turns, ar, mirror = 1) {
  const pts = [];
  const n = Math.ceil(turns * 14);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2 * mirror;
    const r = r0 + (r1 - r0) * t;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * ar]);
  }
  return pts;
}

// small generic quadruped for herds / minor beasts; faces +x unless flip
export function beast(g, cx, cy, s, opts = {}) {
  const { color = 'char', w = 6, flip = false, horns = false, antlers = false,
          alpha = 0.55, tail = true } = opts;
  const ar = g.W / g.H;
  const f = flip ? -1 : 1;
  const pt = (dx, dy) => [cx + dx * s * f, cy + dy * s * ar];
  const o = { color, w, alpha };
  // back + neck + head
  g.stroke([pt(-0.38, -0.14), pt(-0.05, -0.2), pt(0.18, -0.16), pt(0.32, -0.26), pt(0.45, -0.2), pt(0.5, -0.12)], o);
  // chest + belly
  g.stroke([pt(0.42, -0.08), pt(0.3, 0.02), pt(0.02, 0.04), pt(-0.28, 0.0)], o);
  // legs
  g.stroke([pt(0.3, -0.02), pt(0.32, 0.3)], { ...o, w: w * 0.85 });
  g.stroke([pt(0.2, 0.02), pt(0.17, 0.3)], { ...o, w: w * 0.85 });
  g.stroke([pt(-0.2, 0.02), pt(-0.24, 0.3)], { ...o, w: w * 0.85 });
  g.stroke([pt(-0.33, -0.02), pt(-0.37, 0.28)], { ...o, w: w * 0.85 });
  if (tail) g.stroke([pt(-0.38, -0.14), pt(-0.48, -0.02)], { ...o, w: w * 0.7 });
  if (horns) {
    g.stroke([pt(0.42, -0.24), pt(0.47, -0.38)], { ...o, w: w * 0.7 });
    g.stroke([pt(0.37, -0.26), pt(0.34, -0.4)], { ...o, w: w * 0.7 });
  }
  if (antlers) {
    g.stroke([pt(0.4, -0.24), pt(0.44, -0.44), pt(0.52, -0.52)], { ...o, w: w * 0.6 });
    g.stroke([pt(0.44, -0.44), pt(0.36, -0.54)], { ...o, w: w * 0.6 });
  }
  g.dot(...pt(0.43, -0.2), Math.max(3, s * g.W * 0.03), { color, alpha: alpha + 0.15 });
}

// stick figure. pose: {tilt, armL, armR, legSpread} angles in radians.
export function stick(g, cx, cy, s, opts = {}) {
  const { color = 'char', w = 7, alpha = 0.6, tilt = 0,
          armL = 2.4, armR = 0.7, legSpread = 0.35, headFill = false } = opts;
  const ar = g.W / g.H;
  const rot = (dx, dy) => {
    const c = Math.cos(tilt), sn = Math.sin(tilt);
    return [cx + (dx * c - dy * sn) * s, cy + (dx * sn + dy * c) * s * ar];
  };
  const o = { color, w, alpha };
  const head = rot(0, -0.52);
  g.circle(head[0], head[1], s * 0.13, o);
  if (headFill) g.dot(head[0], head[1], s * g.W * 0.09, { color, alpha: alpha * 0.8 });
  g.stroke([rot(0, -0.38), rot(0, 0.1)], o);                       // torso
  const sh = [0, -0.28];
  g.stroke([rot(...sh), rot(Math.cos(armL) * 0.34, -0.28 + Math.sin(armL) * 0.34)], { ...o, w: w * 0.85 });
  g.stroke([rot(...sh), rot(Math.cos(armR) * 0.34, -0.28 + Math.sin(armR) * 0.34)], { ...o, w: w * 0.85 });
  g.stroke([rot(0, 0.1), rot(-legSpread, 0.52)], o);               // legs
  g.stroke([rot(0, 0.1), rot(legSpread, 0.52)], o);
  return { head, rot };
}

// hand silhouette as a Path2D in px (palm, wrist, five fingers). Used for
// negative stencils (spray around it) and positive prints (pigment inside).
export function handPath(g, cx, cy, s, rot, spread = 1) {
  const p = new Path2D();
  const c = Math.cos(rot), sn = Math.sin(rot);
  const P = (dx, dy) => [g.X(cx) + (dx * c - dy * sn) * s * g.W, g.Y(cy) + (dx * sn + dy * c) * s * g.W];
  const [px, py] = P(0, 0.06);
  p.ellipse(px, py, s * g.W * 0.185, s * g.W * 0.22, rot, 0, 6.29);
  const [wx, wy] = P(0, 0.32);
  p.ellipse(wx, wy, s * g.W * 0.13, s * g.W * 0.18, rot, 0, 6.29);
  const angles = [-0.5, -0.22, 0.02, 0.28, 0.95].map((a) => a * spread); // thumb last, wide
  for (let i = 0; i < 5; i++) {
    const a = angles[i];
    const len = i === 4 ? 0.24 : (0.31 - Math.abs(a) * 0.09);
    const base = i === 4 ? [0.16, 0.04] : [Math.sin(a) * 0.15, -0.1];
    const ta = i === 4 ? 1.15 * spread : a;
    const tip = i === 4
      ? [0.16 + Math.sin(ta) * len, 0.04 - Math.cos(ta) * len]
      : [Math.sin(a) * (0.15 + len), -0.1 - Math.cos(a) * len];
    const [bx, by] = P(...base);
    const [tx2, ty2] = P(...tip);
    const mx = (bx + tx2) / 2, my = (by + ty2) / 2;
    const fl = Math.hypot(tx2 - bx, ty2 - by);
    p.ellipse(mx, my, fl / 2 + s * g.W * 0.025, s * g.W * 0.058, Math.atan2(ty2 - by, tx2 - bx), 0, 6.29);
  }
  return p;
}

// closed rectangle outline (normalized), slightly hand-drawn
export function box(g, x, y, w, h, opts) {
  const o = { taper: 0.15, ...opts };
  g.line(x, y, x + w, y, o);
  g.line(x + w, y, x + w, y + h, o);
  g.line(x + w, y + h, x, y + h, o);
  g.line(x, y + h, x, y, o);
}

// toothed wheel: teeth as a zigzag rim, optional spokes and hub
export function gear(g, cx, cy, r, teeth, opts = {}) {
  const { spokes = 0, hub = true, rot = 0, depth = 0.09, ...o } = opts;
  const ar = g.W / g.H;
  const pts = [];
  for (let i = 0; i <= teeth * 4; i++) {
    const a = rot + (i / (teeth * 4)) * Math.PI * 2;
    const k = i % 4;
    const rr = k === 1 || k === 2 ? r * (1 + depth) : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * ar]);
  }
  g.stroke(pts, { taper: 0, wobble: 0.25, ...o });
  for (let s = 0; s < spokes; s++) {
    const a = rot + 0.4 + (s / spokes) * Math.PI * 2;
    g.stroke([[cx + Math.cos(a) * r * 0.14, cy + Math.sin(a) * r * 0.14 * ar],
              [cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9 * ar]], { ...o, w: (o.w || 8) * 1.2 });
  }
  if (hub) g.circle(cx, cy, r * 0.13, { ...o, w: (o.w || 8) * 0.8 });
}

// punched card: rectangle with the top-left corner clipped, holes as dots
export function card(g, x, y, w, h, holes, opts = {}) {
  const { hole = 'char', ...o } = opts;
  const c = Math.min(w, h * g.H / g.W) * 0.25;
  g.stroke([[x + c, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + c * g.W / g.H], [x + c, y]], { taper: 0.05, ...o });
  const cols = 6, rows = 4;
  for (const [ci, ri] of holes) {
    g.dot(x + w * (0.16 + (ci / (cols - 1)) * 0.68), y + h * (0.24 + (ri / (rows - 1)) * 0.56),
      Math.max(3, w * g.W * 0.05), { color: hole, alpha: 0.7 });
  }
}

// clay pot holding one or more pigments (wash layers inside)
export function pot(g, x, y, s, fills, opts = {}) {
  const ar = g.W / g.H;
  const P = (dx, dy) => [x + dx * s, y + dy * s * ar];
  const body = [P(-0.5, -0.3), P(-0.46, 0.12), P(-0.28, 0.4), P(0, 0.48), P(0.28, 0.4), P(0.46, 0.12), P(0.5, -0.3)];
  fills.forEach((f, i) => g.wash([P(-0.47, -0.2 + i * 0.04), ...body.slice(1, -1), P(0.47, -0.2 + i * 0.04)],
    { color: f, alpha: 0.42, w: Math.max(6, s * g.W * 0.12), density: 2.2 }));
  g.stroke(body, { color: 'char', w: 7, alpha: 0.62, ...opts });
  g.stroke([P(-0.58, -0.34), P(0, -0.38), P(0.58, -0.34)], { color: 'char', w: 6, alpha: 0.55, ...opts });
}

// A-frame hut
export function hut(g, x, y, s, opts = {}) {
  const ar = g.W / g.H;
  const P = (dx, dy) => [x + dx * s, y + dy * s * ar];
  g.stroke([P(-0.5, 0.35), P(0, -0.4), P(0.5, 0.35)], { color: 'char', w: 7, alpha: 0.6, ...opts });
  g.stroke([P(-0.12, 0.35), P(0, 0.05), P(0.12, 0.35)], { color: 'char', w: 5, alpha: 0.5, ...opts });
  g.stroke([P(-0.08, -0.52), P(0, -0.4), P(0.1, -0.54)], { color: 'char', w: 4, alpha: 0.45, ...opts });
}

// campfire: flame daubs over crossed sticks
export function fire(g, x, y, s) {
  const ar = g.W / g.H;
  g.line(x - s * 0.5, y + s * 0.2 * ar, x + s * 0.5, y + s * 0.05 * ar, { color: 'char', w: 6, alpha: 0.6 });
  g.line(x - s * 0.45, y + s * 0.05 * ar, x + s * 0.5, y + s * 0.2 * ar, { color: 'char', w: 6, alpha: 0.6 });
  g.stroke([[x - s * 0.25, y + s * 0.05 * ar], [x - s * 0.15, y - s * 0.4 * ar], [x, y - s * 0.95 * ar]], { color: 'red', w: s * g.W * 0.18, alpha: 0.55 });
  g.stroke([[x + s * 0.25, y + s * 0.05 * ar], [x + s * 0.2, y - s * 0.35 * ar], [x + s * 0.05, y - s * 0.7 * ar]], { color: 'yellow', w: s * g.W * 0.14, alpha: 0.6 });
  g.dot(x, y - s * 0.1 * ar, s * g.W * 0.14, { color: 'yellow', alpha: 0.55 });
}

// arc of a circle in visual proportions (angles in radians, 0 = +x, y down)
export function arcPts(cx, cy, r, a0, a1, ar, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * ar]);
  }
  return pts;
}
