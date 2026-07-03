// paintings.js — the panels of the cave: hand-authored stroke compositions
// in the pigment engine, plus their field-report plaques.
//
// Coordinates are normalized [0..1] x [0..1] per canvas. Because panels have
// different aspect ratios, each draw() builds a local `pt` helper that keeps
// authored shapes visually proportioned.

import { makePainter } from './paint.js';

// --------------------------------------------------------------- shared forms

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

// -------------------------------------------------------------------- panels

export const PAINTINGS = [

  // ============================================================ THE VESTIBULE
  {
    id: 'hands',
    title: 'The Signatures',
    sub: 'PANEL I · pigment spray over hands (and one unidentified appendage) · date of earliest layer unknown',
    body: 'Negative stencils: pigment blown around a hand held flat to the stone — the oldest signature there is. Five are ordinary human hands. The sixth is a rigid, angular limb of no known species, its single finger permanently extended, as if to select something. Below, counting marks proceed 1, 10, 11, 100, 101: the cave dwellers appear to have had only two fingers, or, more likely, needed only two.',
    w: 1024, aspect: 1.55, size: [2.6, 1.68], seed: 11,
    draw(g) {
      const ar = g.W / g.H;
      const hand = (cx, cy, s, rot) => {
        const p = new Path2D();
        const c = Math.cos(rot), sn = Math.sin(rot);
        const P = (dx, dy) => [g.X(cx) + (dx * c - dy * sn) * s * g.W, g.Y(cy) + (dx * sn + dy * c) * s * g.W];
        // palm
        const [px, py] = P(0, 0.06);
        p.ellipse(px, py, s * g.W * 0.185, s * g.W * 0.22, rot, 0, 6.29);
        // wrist
        const [wx, wy] = P(0, 0.32);
        p.ellipse(wx, wy, s * g.W * 0.13, s * g.W * 0.18, rot, 0, 6.29);
        // fingers
        const angles = [-0.5, -0.22, 0.02, 0.28, 0.95]; // thumb last, wide
        for (let i = 0; i < 5; i++) {
          const a = angles[i];
          const len = i === 4 ? 0.24 : (0.31 - Math.abs(a) * 0.09);
          const base = i === 4 ? [0.16, 0.04] : [Math.sin(a) * 0.15, -0.1];
          const tip = i === 4
            ? [0.16 + Math.sin(1.15) * len, 0.04 - Math.cos(1.15) * len]
            : [Math.sin(a) * (0.15 + len), -0.1 - Math.cos(a) * len];
          const [bx, by] = P(...base);
          const [tx2, ty2] = P(...tip);
          const mx = (bx + tx2) / 2, my = (by + ty2) / 2;
          const fl = Math.hypot(tx2 - bx, ty2 - by);
          p.ellipse(mx, my, fl / 2 + s * g.W * 0.025, s * g.W * 0.058, Math.atan2(ty2 - by, tx2 - bx), 0, 6.29);
        }
        return p;
      };
      const cursor = (cx, cy, s, rot) => {
        const p = new Path2D();
        const c = Math.cos(rot), sn = Math.sin(rot);
        const pts = [[0, -0.3], [0.22, 0.14], [0.09, 0.12], [0.16, 0.3], [0.06, 0.34], [-0.01, 0.16], [-0.1, 0.26]];
        pts.forEach(([dx, dy], i) => {
          const x = g.X(cx) + (dx * c - dy * sn) * s * g.W;
          const y = g.Y(cy) + (dx * sn + dy * c) * s * g.W;
          i ? p.lineTo(x, y) : p.moveTo(x, y);
        });
        p.closePath();
        return p;
      };
      g.spray(0.2, 0.38, 0.15, { color: 'red', excludePath: hand(0.2, 0.42, 0.175, -0.2), density: 1.9, alpha: 0.52 });
      g.spray(0.46, 0.28, 0.135, { color: 'yellow', excludePath: hand(0.46, 0.31, 0.155, 0.25), density: 1.9, alpha: 0.52 });
      g.spray(0.33, 0.7, 0.13, { color: 'red', excludePath: hand(0.33, 0.73, 0.15, 0.5), density: 1.8, alpha: 0.5 });
      g.spray(0.64, 0.52, 0.145, { color: 'rust', excludePath: hand(0.64, 0.55, 0.165, -0.4), density: 1.9, alpha: 0.52 });
      // the appendage
      g.spray(0.85, 0.32, 0.13, { color: 'red', excludePath: cursor(0.85, 0.32, 0.19, 0.15), density: 2.1, alpha: 0.55 });
      // binary counting marks
      const groups = [['1'], ['1', '0'], ['1', '1'], ['1', '0', '0'], ['1', '0', '1']];
      let x = 0.68;
      for (const grp of groups) {
        let gx = x;
        for (const b of grp) {
          if (b === '1') g.line(gx, 0.72, gx, 0.72 + 0.05 * ar, { color: 'char', w: 6, alpha: 0.55 });
          else g.circle(gx, 0.745, 0.011, { color: 'char', w: 5, alpha: 0.5 });
          gx += 0.026;
        }
        x = gx + 0.025;
      }
    },
  },

  // ====================================================== HALL OF AUTOMATA
  {
    id: 'turing',
    title: 'The Great Tape-Beast',
    sub: 'PANEL II · charcoal and red ochre · c. 1936 (Turing, “On Computable Numbers”)',
    body: 'The largest figure in the cave: a beast whose body is a band of cells, each holding one of two marks, walking on numberless small legs. Its head hangs over a single cell — it can see only one at a time — and the paired arrows show it may shuffle left or right. The band frays into dots at both edges of the panel; the painters clearly intended it to continue through the rock, without end. Scholars believe anything that can be computed at all can be computed by patient application of this animal.',
    w: 1536, aspect: 2.35, size: [4.6, 1.96], seed: 21,
    draw(g) {
      const ar = g.W / g.H;
      const yTop = 0.56, yBot = 0.78;
      // tape edges, slightly sagging
      g.stroke([[0.05, yTop + 0.03], [0.3, yTop], [0.62, yTop + 0.01], [0.94, yTop + 0.04]], { color: 'char', w: 11, alpha: 0.6, taper: 0.2 });
      g.stroke([[0.05, yBot + 0.02], [0.35, yBot + 0.045], [0.66, yBot + 0.02], [0.94, yBot + 0.05]], { color: 'char', w: 11, alpha: 0.6, taper: 0.2 });
      // cells + symbols + legs
      const rng2 = g.rng;
      for (let i = 0; i < 15; i++) {
        const x = 0.075 + i * 0.058;
        const sag = 0.012 * Math.sin((x - 0.05) * 3.5);
        g.line(x, yTop + 0.015 + sag, x, yBot + 0.028 + sag, { color: 'char', w: 7, alpha: 0.45 });
        const cx2 = x + 0.029;
        const cy2 = (yTop + yBot) / 2 + 0.02 + sag;
        if (i < 14 && rng2() > 0.2) {
          if (rng2() > 0.5) g.line(cx2, cy2 - 0.05, cx2, cy2 + 0.05, { color: 'red', w: 8, alpha: 0.6 });
          else g.circle(cx2, cy2, 0.013, { color: 'red', w: 7, alpha: 0.6 });
        }
        // legs
        g.stroke([[x + 0.01, yBot + 0.04], [x + 0.002, yBot + 0.15]], { color: 'char', w: 6, alpha: 0.5 });
      }
      // infinite ends: trailing dots
      for (let i = 0; i < 5; i++) {
        g.dot(0.045 - i * 0.011, (yTop + yBot) / 2 + 0.02, 8 - i * 1.4, { color: 'char', alpha: 0.5 });
        g.dot(0.955 + i * 0.011, (yTop + yBot) / 2 + 0.05, 8 - i * 1.4, { color: 'char', alpha: 0.5 });
      }
      // the head, lowered over one cell
      const hx = 0.62;
      g.stroke([[hx + 0.1, 0.13], [hx + 0.07, 0.3], [hx + 0.03, 0.42], [hx - 0.015, 0.5]], { color: 'char', w: 14, alpha: 0.62 }); // neck
      g.stroke([[hx + 0.1, 0.13], [hx + 0.16, 0.2], [hx + 0.17, 0.33], [hx + 0.1, 0.4], [hx + 0.03, 0.42]], { color: 'char', w: 12, alpha: 0.6 }); // jaw/cheek
      g.stroke([[hx + 0.085, 0.1], [hx + 0.05, 0.02]], { color: 'char', w: 8, alpha: 0.6 });  // horn 1
      g.stroke([[hx + 0.12, 0.11], [hx + 0.15, 0.02]], { color: 'char', w: 8, alpha: 0.6 });  // horn 2
      g.wash([[hx + 0.1, 0.14], [hx + 0.16, 0.22], [hx + 0.16, 0.33], [hx + 0.08, 0.4], [hx + 0.02, 0.44], [hx + 0.05, 0.28]], { color: 'rust', alpha: 0.14, w: 15 });
      g.dot(hx + 0.11, 0.22, 11, { color: 'char', alpha: 0.75 });
      // gaze stroke to the cell it reads
      g.stroke([[hx + 0.02, 0.47], [hx - 0.005, 0.55]], { color: 'red', w: 6, alpha: 0.5 });
      // state diagram, upper left
      const st = [[0.13, 0.16], [0.24, 0.1], [0.34, 0.18]];
      st.forEach(([sx, sy], i) => g.circle(sx, sy, 0.02, { color: 'char', w: 7, alpha: 0.55 }));
      g.dot(st[1][0], st[1][1], 9, { color: 'red', alpha: 0.6 });
      g.arrow(0.15, 0.14, 0.22, 0.11, { color: 'char', w: 5, alpha: 0.5, head: 10 });
      g.arrow(0.26, 0.11, 0.32, 0.16, { color: 'char', w: 5, alpha: 0.5, head: 10 });
      g.arrow(0.32, 0.21, 0.16, 0.2, { color: 'char', w: 5, alpha: 0.5, head: 10 });
      // left-right double arrow beneath the head
      g.arrow(0.57, 0.93, 0.5, 0.93, { color: 'red', w: 7, alpha: 0.6, head: 14 });
      g.arrow(0.67, 0.93, 0.74, 0.93, { color: 'red', w: 7, alpha: 0.6, head: 14 });
    },
  },

  {
    id: 'lambda',
    title: 'The Horned Binder',
    sub: 'PANEL III · charcoal, ochre arrows · c. 1936 (Church, λ-calculus)',
    body: 'A horned figure in the shape of the letter the ancients called lambda. It is shown begetting a smaller of itself, and that one a smaller still: the painters understood that the beast feeds by substitution, swallowing a value and becoming a new expression. Note the lasso: two marks are bound; the red mark escapes, free. Herds of these, suitably arranged, are exactly as strong as the Tape-Beast on the neighboring wall — a coincidence the cave dwellers found deeply significant, and painted them facing one another.',
    w: 900, aspect: 1.0, size: [2.2, 2.2], seed: 31,
    draw(g) {
      // apex A, right leg to B; left leg branches at C = lerp(A,B,t) down to D
      const lam = (ax, ay, s, w, alpha) => {
        const A = [ax, ay];
        const B = [ax + s * 0.34, ay + s * 0.88];
        const C = [ax + s * 0.34 * 0.42, ay + s * 0.88 * 0.42];
        const D = [ax - s * 0.3, ay + s * 0.9];
        g.stroke([A, [C[0] + s * 0.02, C[1]], B], { color: 'char', w, alpha });
        g.stroke([C, [C[0] - s * 0.12, C[1] + s * 0.24], D], { color: 'char', w: w * 0.92, alpha });
        return { A, B, C, D };
      };
      // the great binder
      const L = lam(0.3, 0.14, 0.62, 16, 0.7);
      // horns + eye at apex
      g.stroke([[L.A[0] - 0.015, L.A[1] + 0.01], [L.A[0] - 0.07, L.A[1] - 0.07], [L.A[0] - 0.075, L.A[1] - 0.12]], { color: 'char', w: 9, alpha: 0.65 });
      g.stroke([[L.A[0] + 0.02, L.A[1] + 0.01], [L.A[0] + 0.07, L.A[1] - 0.08], [L.A[0] + 0.06, L.A[1] - 0.13]], { color: 'char', w: 9, alpha: 0.65 });
      g.dot(L.A[0] + 0.012, L.A[1] + 0.09, 11, { color: 'red', alpha: 0.75 });
      // begetting
      g.arrow(0.56, 0.44, 0.66, 0.44, { color: 'yellow', w: 8, alpha: 0.7, head: 16 });
      lam(0.72, 0.32, 0.36, 12, 0.65);
      g.arrow(0.82, 0.66, 0.86, 0.74, { color: 'yellow', w: 7, alpha: 0.65, head: 13 });
      lam(0.86, 0.76, 0.19, 9, 0.6);
      // bound variables: lasso around two dots near the leg
      g.dot(0.18, 0.78, 11, { color: 'char', alpha: 0.6 });
      g.dot(0.27, 0.82, 11, { color: 'char', alpha: 0.6 });
      g.circle(0.225, 0.8, 0.1, { color: 'char', w: 6, alpha: 0.45, dry: 0.5 });
      g.stroke([[0.29, 0.71], [0.3, 0.6], [0.27, 0.52]], { color: 'char', w: 5, alpha: 0.4 }); // lasso rope to the binder
      // the free variable, escaping
      g.dot(0.55, 0.88, 12, { color: 'red', alpha: 0.7 });
      g.stroke([[0.58, 0.87], [0.66, 0.84]], { color: 'red', w: 5, alpha: 0.4 });
    },
  },

  {
    id: 'vonneumann',
    title: 'The Beast That Swallowed Its Instructions',
    sub: 'PANEL IV · charcoal, x-ray style, yellow wash · c. 1945 (the EDVAC report)',
    body: 'Painted in the x-ray manner: the hide is open and we see what the beast has eaten. In its belly, a grid of cells — and here is the heresy that built the modern world — the cells hold food (dots) and instructions for eating (arrows) TOGETHER, in the same stomach, indistinguishable. The spiral organ in the chest fetches from the belly one cell at a time and the beast becomes whatever it last swallowed. Earlier animals had their habits woven into their bones; this one can be re-taught by feeding.',
    w: 1100, aspect: 1.35, size: [2.6, 1.93], seed: 41,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 12, alpha: 0.6 };
      // body outline (facing right)
      g.stroke([[0.12, 0.42], [0.2, 0.3], [0.38, 0.24], [0.58, 0.26], [0.7, 0.3]], o);                 // back
      g.stroke([[0.7, 0.3], [0.78, 0.2], [0.87, 0.16], [0.93, 0.22], [0.9, 0.32], [0.82, 0.36]], o);   // neck + head
      g.stroke([[0.82, 0.36], [0.76, 0.5], [0.6, 0.6], [0.35, 0.62], [0.16, 0.58], [0.12, 0.42]], o);  // chest + belly + rump
      g.stroke([[0.68, 0.52], [0.71, 0.88]], { ...o, w: 10 });
      g.stroke([[0.58, 0.58], [0.57, 0.9]], { ...o, w: 10 });
      g.stroke([[0.26, 0.6], [0.23, 0.9]], { ...o, w: 10 });
      g.stroke([[0.18, 0.56], [0.13, 0.88]], { ...o, w: 10 });
      // antlers: two beams with tines
      g.stroke([[0.85, 0.15], [0.8, 0.06], [0.72, 0.02]], { ...o, w: 8 });
      g.stroke([[0.8, 0.06], [0.79, -0.02]], { ...o, w: 6 });
      g.stroke([[0.76, 0.04], [0.72, -0.03]], { ...o, w: 6 });
      g.stroke([[0.88, 0.15], [0.92, 0.05], [0.98, 0.02]], { ...o, w: 8 });
      g.stroke([[0.92, 0.05], [0.94, -0.03]], { ...o, w: 6 });
      // ear
      g.stroke([[0.83, 0.18], [0.78, 0.13]], { ...o, w: 7 });
      g.dot(0.885, 0.21, 9, { color: 'char', alpha: 0.75 });
      g.wash([[0.14, 0.42], [0.22, 0.31], [0.4, 0.26], [0.58, 0.28], [0.7, 0.32], [0.74, 0.48], [0.6, 0.58], [0.35, 0.6], [0.17, 0.56]], { color: 'yellow', alpha: 0.08, w: 16 });
      // the belly grid
      const gx0 = 0.26, gy0 = 0.36, cw = 0.09, ch = 0.09;
      for (let r = 0; r <= 2; r++) g.line(gx0, gy0 + r * ch, gx0 + 4 * cw, gy0 + r * ch, { color: 'char', w: 5, alpha: 0.45 });
      for (let c = 0; c <= 4; c++) g.line(gx0 + c * cw, gy0, gx0 + c * cw, gy0 + 2 * ch, { color: 'char', w: 5, alpha: 0.45 });
      const kinds = [1, 0, 0, 1, 0, 1, 1, 0]; // 1 = instruction (arrow), 0 = datum (dot)
      for (let i = 0; i < 8; i++) {
        const cx2 = gx0 + (i % 4) * cw + cw / 2;
        const cy2 = gy0 + ((i / 4) | 0) * ch + ch / 2;
        if (kinds[i]) g.arrow(cx2 - 0.025, cy2 + 0.02, cx2 + 0.025, cy2 - 0.02, { color: 'char', w: 5, alpha: 0.6, head: 9 });
        else g.dot(cx2, cy2, 9, { color: 'red', alpha: 0.65 });
      }
      // control spiral in chest + nerves
      g.stroke(spiralPts(0.72, 0.42, 0.005, 0.045, 2.2, ar), { color: 'red', w: 6, alpha: 0.6, taper: 0.2 });
      g.stroke([[0.72, 0.38], [0.8, 0.28]], { color: 'red', w: 4, alpha: 0.45 });
      g.stroke([[0.7, 0.46], [0.66, 0.42], [0.5, 0.42]], { color: 'red', w: 4, alpha: 0.45 }); // fetch line into belly
    },
  },

  {
    id: 'eniac',
    title: 'The Room-Beast and the Six Who Tamed It',
    sub: 'PANEL V · charcoal, red ochre figures · c. 1946 (ENIAC, Philadelphia)',
    body: 'A beast the size of a room, pelted in dials and creepers of cable, standing on some eighteen thousand legs of glass, each leg glowing, each liable to snap. It could count faster than any animal then alive, but it was mute and helpless until tamed. The six small figures are not decoration. They are Antonelli, Bartik, Holberton, Meltzer, Spence and Teitelbaum, who learned its plugboard anatomy without any manual, and who were for decades painted out of the story. This cave restores them. They are drawn holding the cables, because they were the ones holding the cables.',
    w: 1300, aspect: 1.9, size: [3.6, 1.9], seed: 51,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 11, alpha: 0.6 };
      // massive body
      g.stroke([[0.08, 0.52], [0.09, 0.2], [0.3, 0.14], [0.6, 0.13], [0.78, 0.17], [0.8, 0.5]], o);
      g.stroke([[0.08, 0.52], [0.4, 0.56], [0.8, 0.5]], o);
      // head bump, right end
      g.stroke([[0.8, 0.32], [0.87, 0.3], [0.9, 0.38], [0.86, 0.46], [0.8, 0.46]], { ...o, w: 9 });
      g.dot(0.855, 0.36, 9, { color: 'yellow', alpha: 0.75 });
      // dial rows
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
          const x = 0.13 + c * 0.072, y = 0.22 + r * 0.11;
          if ((r * 9 + c) % 4 === 3) g.dot(x, y, 8, { color: 'yellow', alpha: 0.6 });
          else g.circle(x, y, 0.011, { color: 'char', w: 5, alpha: 0.5 });
        }
      }
      // cable creepers hanging from the hide
      for (const cx2 of [0.2, 0.37, 0.55, 0.7]) {
        g.stroke([[cx2, 0.55], [cx2 - 0.02, 0.63], [cx2 + 0.02, 0.7], [cx2 - 0.01, 0.76]], { color: 'char', w: 6, alpha: 0.5 });
      }
      // the eighteen-thousand legs (a sample)
      for (let i = 0; i < 16; i++) {
        const x = 0.1 + i * 0.044;
        g.stroke([[x, 0.57], [x + (g.rng() - 0.5) * 0.015, 0.68]], { color: 'red', w: 5, alpha: 0.55 });
      }
      // the six
      const poses = [
        [0.14, 0.87, 1.9, -0.6], [0.27, 0.9, 2.6, 0.4], [0.41, 0.88, 2.2, -0.9],
        [0.55, 0.9, 2.8, 0.2], [0.68, 0.88, 2.0, -0.5], [0.88, 0.72, 2.4, -1.2],
      ];
      for (const [x, y, aL, aR] of poses) {
        const f = stick(g, x, y, 0.11, { color: 'red', w: 7, alpha: 0.65, armL: -aL, armR: aR });
        // a cable from a raised hand up into the beast
        g.stroke([[x + Math.cos(aR) * 0.037, y + (Math.sin(aR) * 0.037 - 0.03) * ar], [x + 0.05, y - 0.14 * ar], [x + 0.02, 0.58]], { color: 'char', w: 4, alpha: 0.4 });
      }
    },
  },

  {
    id: 'bug',
    title: 'The First Bug',
    sub: 'PANEL VI · charcoal, ochre adhesive strips · 9 September 1947 (Harvard Mark II, relay #70)',
    body: 'A moth, rendered with unusual tenderness, held to the wall by two painted strips of tape. On that date the operators of the Mark II calculator found a real moth beaten to death in relay 70, panel F, taped it into the logbook, and wrote: “First actual case of bug being found.” The word was older; the specimen made it eternal. The painters have marked the site as one marks a grave. All bugs since are its descendants, and all of us its mourners.',
    w: 700, aspect: 1.0, size: [1.15, 1.15], seed: 61,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 8, alpha: 0.62 };
      // body
      g.stroke([[0.5, 0.3], [0.51, 0.45], [0.5, 0.62], [0.49, 0.72]], { ...o, w: 11 });
      // antennae
      g.stroke([[0.5, 0.3], [0.44, 0.2], [0.4, 0.16]], { ...o, w: 4 });
      g.stroke([[0.51, 0.3], [0.57, 0.19], [0.62, 0.16]], { ...o, w: 4 });
      // upper wings
      g.stroke([[0.5, 0.36], [0.32, 0.26], [0.18, 0.32], [0.22, 0.46], [0.42, 0.5]], o);
      g.stroke([[0.51, 0.36], [0.69, 0.26], [0.83, 0.33], [0.78, 0.47], [0.58, 0.5]], o);
      // lower wings
      g.stroke([[0.48, 0.55], [0.34, 0.58], [0.28, 0.68], [0.4, 0.72], [0.48, 0.66]], { ...o, w: 7 });
      g.stroke([[0.52, 0.55], [0.66, 0.59], [0.72, 0.69], [0.6, 0.72], [0.52, 0.66]], { ...o, w: 7 });
      // wing spots
      g.dot(0.3, 0.36, 8, { color: 'char', alpha: 0.6 });
      g.dot(0.7, 0.37, 8, { color: 'char', alpha: 0.6 });
      // the tape
      g.wash([[0.12, 0.28], [0.34, 0.2], [0.37, 0.28], [0.15, 0.37]], { color: 'yellow', alpha: 0.34, w: 12, density: 1.9 });
      g.wash([[0.62, 0.6], [0.84, 0.53], [0.87, 0.61], [0.65, 0.69]], { color: 'yellow', alpha: 0.34, w: 12, density: 1.9 });
      g.stroke([[0.12, 0.28], [0.34, 0.2]], { color: 'yellow', w: 5, alpha: 0.4, dry: 0.5 });
      g.stroke([[0.15, 0.37], [0.37, 0.28]], { color: 'yellow', w: 5, alpha: 0.4, dry: 0.5 });
      g.stroke([[0.62, 0.6], [0.84, 0.53]], { color: 'yellow', w: 5, alpha: 0.4, dry: 0.5 });
      g.stroke([[0.65, 0.69], [0.87, 0.61]], { color: 'yellow', w: 5, alpha: 0.4, dry: 0.5 });
      // logbook line
      g.glyphs(0.24, 0.86, 8, 0.035, { color: 'char', w: 4, alpha: 0.45 });
      g.line(0.2, 0.92, 0.78, 0.915, { color: 'char', w: 4, alpha: 0.35 });
    },
  },

  // =================================================== GALLERY OF INFORMATION
  {
    id: 'entropy',
    title: 'The River of Surprise',
    sub: 'PANEL VII · charcoal, red ochre · c. 1948 (Shannon, “A Mathematical Theory of Communication”)',
    body: 'A figure releases marks into a river; a figure downstream pulls them out. Between them, the storm — and after the storm the marks arrive bent, flipped, or not at all. The painters grasped the two great truths: that a message is measured not by its length but by its surprise (see the unequal dots raining from the H-sign — common things carry little, rare things carry much), and that the river’s noise sets a hard ceiling on what may cross it. Below that ceiling, they knew, one can always shout cleverly enough to be understood. Above it, never. This wall is the boundary stone of the entire gallery.',
    w: 1400, aspect: 2.0, size: [3.5, 1.75], seed: 71,
    draw(g) {
      const ar = g.W / g.H;
      // banks
      g.stroke([[0.13, 0.45], [0.3, 0.42], [0.5, 0.44], [0.7, 0.41], [0.9, 0.44]], { color: 'char', w: 9, alpha: 0.55 });
      g.stroke([[0.13, 0.68], [0.32, 0.7], [0.52, 0.67], [0.72, 0.7], [0.9, 0.67]], { color: 'char', w: 9, alpha: 0.55 });
      // sender
      stick(g, 0.07, 0.5, 0.13, { color: 'red', w: 8, armL: 2.9, armR: -0.3 });
      // ordered marks before the storm
      for (let i = 0; i < 6; i++) {
        g.line(0.17 + i * 0.045, 0.52, 0.17 + i * 0.045, 0.61, { color: 'char', w: 7, alpha: 0.6 });
      }
      // the storm
      g.stroke([[0.47, 0.06], [0.5, 0.2], [0.45, 0.24], [0.5, 0.38], [0.47, 0.43]], { color: 'red', w: 8, alpha: 0.65, wobble: 0.3 });
      g.stroke([[0.55, 0.1], [0.56, 0.22], [0.52, 0.26], [0.56, 0.4]], { color: 'red', w: 7, alpha: 0.6, wobble: 0.3 });
      g.dots([[0.44, 0.12], [0.52, 0.05], [0.6, 0.13]], 7, { color: 'char', alpha: 0.4 });
      // marks after the storm: bent, flipped, missing
      const after = [
        () => g.stroke([[0.6, 0.53], [0.63, 0.62]], { color: 'char', w: 7, alpha: 0.6 }),       // bent
        () => g.circle(0.665, 0.57, 0.012, { color: 'char', w: 6, alpha: 0.55 }),               // flipped to O
        () => g.line(0.71, 0.51, 0.71, 0.6, { color: 'char', w: 7, alpha: 0.6 }),
        () => { g.line(0.755, 0.53, 0.755, 0.62, { color: 'char', w: 7, alpha: 0.35 });          // dying
               g.line(0.735, 0.54, 0.775, 0.61, { color: 'red', w: 5, alpha: 0.5 }); },
        () => g.dots([[0.8, 0.6]], 5, { color: 'char', alpha: 0.35 }),                           // gone
      ];
      after.forEach((f) => f());
      // receiver, arms up
      stick(g, 0.94, 0.5, 0.12, { color: 'char', w: 8, armL: -2.4, armR: -0.7 });
      // H and its unequal rain
      g.line(0.2, 0.1, 0.2, 0.24, { color: 'char', w: 8, alpha: 0.6 });
      g.line(0.26, 0.1, 0.26, 0.24, { color: 'char', w: 8, alpha: 0.6 });
      g.line(0.2, 0.17, 0.26, 0.17, { color: 'char', w: 7, alpha: 0.6 });
      const drops = [[0.31, 0.13, 12], [0.34, 0.2, 5], [0.37, 0.11, 8], [0.4, 0.18, 4], [0.43, 0.14, 10], [0.46, 0.2, 3]];
      for (const [x, y, r] of drops) g.dot(x, y, r, { color: 'red', alpha: 0.6 });
    },
  },

  {
    id: 'markov',
    title: 'The Chain-Serpent',
    sub: 'PANEL VIII · charcoal, faded ochre substrate · c. 1913 (A. A. Markov reads “Eugene Onegin”)',
    body: 'The oldest painting in the gallery, made before the others by some seventeen winters. A serpent of linked rings — some filled, some hollow, as the letters of the poem were vowel or consonant — and above them the leaping arrows of passage, thick where the crossing is likely, thin where it is rare. The head is drawn looking back at exactly one link. This is the whole doctrine of the serpent: to know where it goes, you need only know where it stands, never where it has been. The faint rows beneath are the twenty thousand letters of Pushkin that Markov counted, by hand, in the winter of Petersburg, to prove it.',
    w: 1300, aspect: 1.8, size: [3.2, 1.78], seed: 81,
    draw(g) {
      const ar = g.W / g.H;
      // chain of states along a sinuous path
      const chain = [];
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        chain.push([0.1 + t * 0.72, 0.42 + Math.sin(t * 4.2) * 0.09]);
      }
      chain.forEach(([x, y], i) => {
        g.circle(x, y, 0.028, { color: 'char', w: 8, alpha: 0.6 });
        if (i % 2 === 0) g.dot(x, y, 12, { color: 'red', alpha: 0.65 });
        if (i < 7) {
          const [nx, ny] = chain[i + 1];
          g.stroke([[x + 0.028, y], [nx - 0.028, ny]], { color: 'char', w: 7, alpha: 0.5 }); // body link
          // leaping arrow above
          const mx = (x + nx) / 2, my = Math.min(y, ny) - 0.13;
          const thick = g.rng() > 0.5;
          g.arrow(x + 0.01, y - 0.06, nx - 0.01, ny - 0.05, { color: thick ? 'char' : 'char', w: thick ? 7 : 3.5, alpha: thick ? 0.55 : 0.4, head: thick ? 13 : 8 });
        }
      });
      // serpent head at the end, looking back
      const [hx, hy] = chain[7];
      g.stroke([[hx + 0.02, hy], [hx + 0.08, hy - 0.04], [hx + 0.1, hy - 0.12], [hx + 0.05, hy - 0.16], [hx - 0.0, hy - 0.13]], { color: 'char', w: 10, alpha: 0.6 });
      g.dot(hx + 0.055, hy - 0.125, 9, { color: 'red', alpha: 0.7 });
      // forked tongue pointing BACK at the previous link
      g.stroke([[hx - 0.0, hy - 0.13], [hx - 0.05, hy - 0.12]], { color: 'red', w: 4, alpha: 0.6 });
      g.stroke([[hx - 0.0, hy - 0.135], [hx - 0.045, hy - 0.155]], { color: 'red', w: 4, alpha: 0.6 });
      // the twenty thousand letters (a sample), faded
      for (let r = 0; r < 3; r++) {
        g.glyphs(0.09, 0.74 + r * 0.09, 22, 0.018, { color: 'yellow', w: 4, alpha: 0.5, gap: 2.0 });
      }
      // vowel tally dots under a few
      g.dots([[0.13, 0.8], [0.27, 0.8], [0.48, 0.89], [0.66, 0.8]], 4, { color: 'red', alpha: 0.45 });
    },
  },

  {
    id: 'trigram',
    title: 'The Three-Headed Guesser',
    sub: 'PANEL IX · charcoal, red ochre · c. 1948–1951 (Shannon’s n-gram approximations)',
    body: 'A beast with one body and three heads on necks of unequal length, walking a trail of marks. Each head watches a different distance back along the trail — one mark, two marks, three — and from what the heads remember, the beast guesses the mark it will step on next (shown hollow, not yet real, with the guessed mark in red). The painters bred longer-necked variants and found the guesses grew uncannily good; a beast of enough heads, they wrote, would speak. They lacked the pigment to feed it. The claim was tested much later, elsewhere, with results known to the reader.',
    w: 1250, aspect: 1.7, size: [3.0, 1.76], seed: 91,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 11, alpha: 0.6 };
      // the trail of marks
      const trail = [];
      for (let i = 0; i < 11; i++) trail.push([0.07 + i * 0.083, 0.84 + Math.sin(i) * 0.008]);
      trail.forEach(([x, y], i) => {
        if (i < 7) {
          const k = i % 3;
          if (k === 0) g.line(x, y - 0.045, x, y + 0.045, { color: 'char', w: 7, alpha: 0.6 });
          else if (k === 1) g.circle(x, y, 0.012, { color: 'char', w: 6, alpha: 0.55 });
          else g.stroke([[x - 0.014, y + 0.04], [x, y - 0.045], [x + 0.014, y + 0.04]], { color: 'char', w: 6, alpha: 0.55 });
        } else if (i > 7) {
          g.circle(x, y, 0.013, { color: 'char', w: 5, alpha: 0.4, dry: 0.55 }); // not yet real
        }
      });
      // the guessed mark, hollow ring + red guess inside
      const [gx2, gy2] = trail[7];
      g.circle(gx2, gy2, 0.026, { color: 'char', w: 6, alpha: 0.5, dry: 0.5 });
      g.line(gx2, gy2 - 0.03, gx2, gy2 + 0.03, { color: 'red', w: 6, alpha: 0.65 });
      // body over the trail
      g.stroke([[0.22, 0.52], [0.38, 0.46], [0.55, 0.48], [0.63, 0.52]], o); // back
      g.stroke([[0.63, 0.52], [0.6, 0.62], [0.42, 0.66], [0.26, 0.63], [0.22, 0.52]], o); // belly
      g.stroke([[0.57, 0.62], [0.59, 0.78]], { ...o, w: 9 });
      g.stroke([[0.47, 0.65], [0.47, 0.79]], { ...o, w: 9 });
      g.stroke([[0.33, 0.64], [0.32, 0.79]], { ...o, w: 9 });
      g.stroke([[0.26, 0.61], [0.24, 0.77]], { ...o, w: 9 });
      // three necks, three heads, looking back at marks 5, 4, 3 (i.e., 1, 2, 3 back)
      const targets = [trail[6], trail[5], trail[4]];
      const necks = [
        { from: [0.58, 0.49], via: [0.66, 0.38], head: [0.63, 0.3] },
        { from: [0.5, 0.47], via: [0.56, 0.28], head: [0.5, 0.2] },
        { from: [0.42, 0.47], via: [0.44, 0.2], head: [0.36, 0.12] },
      ];
      necks.forEach((n, i) => {
        g.stroke([n.from, n.via, n.head], { ...o, w: 10 });
        // head: wedge muzzle aimed down-back toward its mark
        const [tx, ty] = targets[i];
        const dx = tx - n.head[0], dy = ty - n.head[1];
        const L = Math.hypot(dx, dy);
        const mzl = [n.head[0] + (dx / L) * 0.085, n.head[1] + (dy / L) * 0.085];
        g.stroke([n.head, mzl], { ...o, w: 11 });
        g.stroke([[n.head[0] - 0.012, n.head[1] - 0.03], mzl], { ...o, w: 7 });
        g.dot(n.head[0] + 0.008, n.head[1] - 0.005, 10, { color: 'red', alpha: 0.75 });
        // gaze line
        g.stroke([[mzl[0] + (dx / L) * 0.02, mzl[1] + (dy / L) * 0.02], [tx, ty - 0.07]], { color: 'red', w: 3.5, alpha: 0.42, dry: 0.55 });
      });
      // tail
      g.stroke([[0.23, 0.53], [0.16, 0.44], [0.13, 0.36]], { ...o, w: 9 });
    },
  },

  {
    id: 'zipf',
    title: 'The Slope of Least Effort',
    sub: 'PANEL X · yellow ochre, charcoal, red curve · c. 1949 (Zipf, “Human Behavior and the Principle of Least Effort”)',
    body: 'A mountainside of stacked bars, each roughly half the one before... no — each is the first divided by its rank, a subtler and stranger law. On the summit grazes a single enormous beast: the commonest word, fat on use. The slopes below hold ever smaller and hungrier creatures, and past the last bar the herd dwindles into the long trail of dots — thousands of words used once and never again, wandering the tail forever. The painters found this same slope in every tongue they counted, and in the sizes of their fires, and in the crowding of their caves, and were unsettled.',
    w: 1200, aspect: 1.5, size: [2.75, 1.83], seed: 101,
    draw(g) {
      const ar = g.W / g.H;
      const base = 0.82;
      const h1 = 0.58;
      // bars at 1/k heights
      for (let k = 1; k <= 8; k++) {
        const x = 0.06 + (k - 1) * 0.098;
        const h = h1 / k;
        const wpx = 0.08;
        g.wash([[x, base - h], [x + wpx, base - h], [x + wpx, base], [x, base]], { color: 'yellow', alpha: 0.13, w: 13, density: 1.2 });
        g.stroke([[x - 0.005, base - h], [x + wpx + 0.005, base - h]], { color: 'char', w: 8, alpha: 0.55 });
      }
      // the rank-frequency curve
      const curve = [];
      for (let k = 1; k <= 8; k += 0.5) curve.push([0.06 + (k - 1) * 0.098 + 0.04, base - h1 / k - 0.03]);
      g.stroke(curve, { color: 'red', w: 7, alpha: 0.6, taper: 0.3 });
      // beasts by rank
      beast(g, 0.14, base - h1 - 0.075, 0.17, { color: 'char', w: 8, horns: true });
      beast(g, 0.245, base - h1 / 2 - 0.06, 0.11, { color: 'char', w: 6 });
      beast(g, 0.34, base - h1 / 3 - 0.05, 0.08, { color: 'char', w: 5, antlers: true });
      beast(g, 0.44, base - h1 / 4 - 0.045, 0.06, { color: 'char', w: 4.5 });
      // the long tail
      for (let i = 0; i < 14; i++) {
        const x = 0.78 + i * 0.016;
        g.dot(x, base - 0.02 - (g.rng() * 0.012), Math.max(2.5, 7 - i * 0.5), { color: 'char', alpha: 0.5 });
      }
      // tally row under the bars: rank marks
      g.glyphs(0.09, 0.93, 8, 0.024, { color: 'char', w: 4, alpha: 0.4, kinds: [0, 1, 1, 2, 2, 2, 5, 5], gap: 4.05 });
    },
  },

  {
    id: 'hamming',
    title: 'The Ox That Walks Though a Leg Be Broken',
    sub: 'PANEL XI · charcoal, red ochre correction · c. 1950 (Hamming codes, Bell Laboratories)',
    body: 'A pack-ox of seven legs: four bear the load (drawn solid); three, hollow, carry nothing — they are witnesses, placed at the first, second and fourth stations, each sworn to watch a different overlapping set of its solid brothers. When the storm of the river-panel breaks one leg (see the fifth, snapped), the witnesses vote, the odd tallies above name the exact culprit, and the leg is redrawn in red before the ox has finished stumbling. Hamming built this animal out of fury, it is said, after a weekend calculator run died at hour forty for one flipped bit with no witness to name it.',
    w: 1000, aspect: 1.3, size: [2.3, 1.77], seed: 111,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 11, alpha: 0.6 };
      // stout body
      g.stroke([[0.14, 0.4], [0.3, 0.3], [0.55, 0.28], [0.72, 0.33]], o);
      g.stroke([[0.72, 0.33], [0.8, 0.26], [0.88, 0.28], [0.9, 0.38], [0.82, 0.44]], o); // head
      g.stroke([[0.82, 0.44], [0.72, 0.52], [0.5, 0.56], [0.24, 0.54], [0.14, 0.4]], o);
      g.stroke([[0.85, 0.25], [0.9, 0.14], [0.88, 0.06]], { ...o, w: 10 }); // horns
      g.stroke([[0.79, 0.26], [0.75, 0.14], [0.77, 0.06]], { ...o, w: 10 });
      g.dot(0.845, 0.33, 9, { color: 'char', alpha: 0.75 });
      // seven legs; positions 1,2,4 hollow (parity), others solid
      const xs = [0.2, 0.3, 0.4, 0.5, 0.6, 0.69, 0.78];
      for (let i = 0; i < 7; i++) {
        const p = i + 1; // 1-indexed
        const parity = (p === 1 || p === 2 || p === 4);
        const x = xs[i];
        if (parity) {
          // hollow leg: two thin strokes
          g.stroke([[x - 0.008, 0.54], [x - 0.012, 0.78]], { color: 'char', w: 4, alpha: 0.5 });
          g.stroke([[x + 0.008, 0.54], [x + 0.012, 0.78]], { color: 'char', w: 4, alpha: 0.5 });
        } else if (p === 5) {
          // the broken leg
          g.stroke([[x, 0.54], [x + 0.005, 0.64]], { ...o, w: 9 });
          g.stroke([[x + 0.03, 0.68], [x + 0.045, 0.79]], { ...o, w: 9, alpha: 0.45 });
          g.line(x - 0.02, 0.63, x + 0.05, 0.7, { color: 'char', w: 5, alpha: 0.55 });
          g.line(x + 0.05, 0.63, x - 0.02, 0.7, { color: 'char', w: 5, alpha: 0.55 });
          // redrawn in red beside it
          g.stroke([[x + 0.055, 0.54], [x + 0.06, 0.78]], { color: 'red', w: 8, alpha: 0.65 });
        } else {
          g.stroke([[x, 0.54], [x + (g.rng() - 0.5) * 0.01, 0.78]], { ...o, w: 9 });
        }
      }
      // parity tallies above: three triplets, one with the odd mark ringed
      const triples = [[0.18, 0.12, false], [0.4, 0.09, false], [0.62, 0.12, true]];
      for (const [x, y, odd] of triples) {
        for (let j = 0; j < 3; j++) {
          const mx = x + j * 0.045;
          if (odd && j === 2) {
            g.circle(mx, y + 0.035, 0.013, { color: 'red', w: 6, alpha: 0.65 });
            g.circle(mx, y + 0.035, 0.033, { color: 'red', w: 4, alpha: 0.5 });
          } else {
            g.line(mx, y, mx, y + 0.07, { color: 'char', w: 6, alpha: 0.55 });
          }
        }
      }
    },
  },

  // ========================================================= NAVE OF SPEECH
  {
    id: 'chomsky',
    title: 'The Tree of Sentences / The Green Sleeper',
    sub: 'PANEL XII · charcoal; one pigment of disputed provenance · c. 1957 (Chomsky, “Syntactic Structures”)',
    body: 'Above: a tree drawn root-upward, in the grammarians’ manner, its branchings lawful and finite. Below, what the branches bear: a sentence never before spoken, obeying every law and meaning nothing — ideas, colorless and green, asleep, furiously. The painters rendered the sleeper in a green found nowhere else in the cave and colorless besides (analysis of the pigment is ongoing; the pigment refuses). The panel was a boundary-marker: grammar, it says, can be kept without keeping sense — a well-formed emptiness. Whether the tree grows in the mind from birth, the nave’s painters fought about for forty years, in charcoal, over one another’s work.',
    w: 1050, aspect: 1.25, size: [2.5, 2.0], seed: 121,
    draw(g) {
      const ar = g.W / g.H;
      const node = (x, y) => g.circle(x, y, 0.016, { color: 'char', w: 6, alpha: 0.55 });
      const edge = (x1, y1, x2, y2) => g.stroke([[x1, y1], [x2, y2]], { color: 'char', w: 7, alpha: 0.55 });
      // root with a crown mark
      g.dot(0.5, 0.08, 12, { color: 'red', alpha: 0.65 });
      g.stroke([[0.46, 0.045], [0.5, 0.02], [0.54, 0.045]], { color: 'red', w: 5, alpha: 0.55 });
      edge(0.5, 0.1, 0.3, 0.22); edge(0.5, 0.1, 0.68, 0.22);
      node(0.3, 0.24); node(0.68, 0.24);
      edge(0.3, 0.26, 0.2, 0.38); edge(0.3, 0.26, 0.4, 0.38);
      edge(0.68, 0.26, 0.58, 0.38); edge(0.68, 0.26, 0.78, 0.38);
      node(0.2, 0.4); node(0.4, 0.4); node(0.58, 0.4); node(0.78, 0.4);
      edge(0.78, 0.42, 0.7, 0.52); edge(0.78, 0.42, 0.86, 0.52);
      node(0.7, 0.54); node(0.86, 0.54);
      // leaves: short drops to glyphs
      const leaves = [[0.2, 0.42], [0.4, 0.42], [0.58, 0.42], [0.7, 0.56], [0.86, 0.56]];
      leaves.forEach(([x, y], i) => {
        g.stroke([[x, y + 0.02], [x, y + 0.07]], { color: 'char', w: 4, alpha: 0.45 });
        g.glyphs(x - 0.01, y + 0.1, 1, 0.03, { color: 'char', w: 4.5, alpha: 0.5, kinds: [i % 6] });
      });
      // the green sleeper, curled below
      const cx = 0.4, cy = 0.8;
      g.wash([[cx - 0.2, cy], [cx - 0.12, cy - 0.1], [cx + 0.05, cy - 0.13], [cx + 0.2, cy - 0.06], [cx + 0.22, cy + 0.05], [cx + 0.05, cy + 0.1], [cx - 0.14, cy + 0.08]], { color: 'green', alpha: 0.3, w: 15, density: 1.6 });
      g.stroke([[cx - 0.2, cy], [cx - 0.13, cy - 0.1], [cx + 0.04, cy - 0.135], [cx + 0.19, cy - 0.06], [cx + 0.21, cy + 0.05], [cx + 0.04, cy + 0.1], [cx - 0.15, cy + 0.08], [cx - 0.2, cy]], { color: 'char', w: 10, alpha: 0.62 });
      // curled head tucked against the body, with ear and closed eye
      g.circle(cx + 0.13, cy + 0.01, 0.055, { color: 'char', w: 8, alpha: 0.6 });
      g.stroke([[cx + 0.16, cy - 0.05], [cx + 0.19, cy - 0.1]], { color: 'char', w: 6, alpha: 0.55 }); // ear
      g.line(cx + 0.1, cy + 0.015, cx + 0.15, cy + 0.02, { color: 'char', w: 4.5, alpha: 0.65 });     // closed eye
      // legs folded
      g.stroke([[cx - 0.08, cy + 0.09], [cx - 0.02, cy + 0.05], [cx + 0.04, cy + 0.095]], { color: 'char', w: 6, alpha: 0.5 });
      // sleeping furiously: rage-zigzags beside the head
      for (let i = 0; i < 3; i++) {
        const zx = cx + 0.27 + i * 0.05, zy = cy - 0.01 - i * 0.05;
        g.stroke([[zx, zy], [zx + 0.025, zy - 0.035], [zx, zy - 0.06], [zx + 0.025, zy - 0.09]], { color: 'red', w: 5, alpha: 0.68 - i * 0.12, wobble: 0.3 });
      }
    },
  },

  {
    id: 'eliza',
    title: 'The Mirror Oracle',
    sub: 'PANEL XIII · charcoal, red ochre · c. 1966 (Weizenbaum, MIT)',
    body: 'Two figures. The left one is solid and has a heart. The right one is drawn hollow — outline only, nothing inside but an empty ring where a heart would go — yet it is drawn LARGER, because that is how the solid one saw it. Study the speech-spirals: the oracle’s is the seeker’s own, returned reversed. It knew nothing; it asked “why do you say that?” by rule. Its maker built it to show how shallow the trick was, and watched in horror as people poured their hearts into it and asked to be left alone with it. His own secretary did. The panel is a warning, the painters knew, and it has warned no one.',
    w: 1150, aspect: 1.5, size: [2.7, 1.8], seed: 131,
    draw(g) {
      const ar = g.W / g.H;
      // the seeker: solid, with a heart
      stick(g, 0.24, 0.5, 0.2, { color: 'char', w: 10, alpha: 0.65, armL: 2.7, armR: 0.4, headFill: true });
      g.dot(0.24, 0.47, 11, { color: 'red', alpha: 0.75 });
      // the oracle: hollow, larger
      const ox = 0.72, oy = 0.48, os = 0.26;
      const hollow = { color: 'char', w: 4.5, alpha: 0.55 };
      // double-stroked outline body
      g.circle(ox, oy - os * 0.52, os * 0.14, hollow);
      g.circle(ox, oy - os * 0.52, os * 0.1, { ...hollow, w: 3.5, alpha: 0.4 });
      for (const dx of [-0.008, 0.008]) {
        g.stroke([[ox + dx, oy - os * 0.36], [ox + dx, oy + os * 0.12]], hollow);
      }
      g.stroke([[ox, oy - os * 0.28], [ox - 0.1, oy - os * 0.1]], hollow);
      g.stroke([[ox, oy - os * 0.28], [ox + 0.1, oy - os * 0.05]], hollow);
      g.stroke([[ox, oy + os * 0.12], [ox - 0.07, oy + os * 0.5]], hollow);
      g.stroke([[ox, oy + os * 0.12], [ox + 0.07, oy + os * 0.5]], hollow);
      // the empty ring where a heart would go
      g.circle(ox, oy - 0.02, 0.017, { color: 'char', w: 4, alpha: 0.5 });
      // speech spirals: same spiral, mirrored back
      g.stroke(spiralPts(0.38, 0.26, 0.004, 0.05, 2.4, ar, 1), { color: 'char', w: 6, alpha: 0.6, taper: 0.2 });
      g.stroke(spiralPts(0.56, 0.26, 0.004, 0.05, 2.4, ar, -1), { color: 'red', w: 6, alpha: 0.6, taper: 0.2 });
      // the reflection: a mark sent, the same mark bent back
      g.stroke([[0.42, 0.68], [0.47, 0.66]], { color: 'char', w: 6, alpha: 0.55 });
      g.stroke([[0.47, 0.66], [0.5, 0.64], [0.52, 0.68], [0.5, 0.71]], { color: 'red', w: 5, alpha: 0.55 });
      g.arrow(0.5, 0.71, 0.45, 0.73, { color: 'red', w: 5, alpha: 0.55, head: 10 });
    },
  },

  {
    id: 'hmm',
    title: 'The Hidden Beast',
    sub: 'PANEL XIV · charcoal, manganese, red ochre prints · c. 1966–1980 (Baum; Jelinek’s speech group, IBM)',
    body: 'The beast itself is never shown: only the boulder, the horns above it, and the trail of prints it left. From what can be seen (the prints), the painters computed what cannot be (the path behind the rock) — the ringed chain above traces the likeliest way the animal actually walked. Hunters of speech used exactly this animal: the sound is the footprint, the word is the beast. Their chief huntsman is recorded to have said that each time he sent a linguist away from the fire, the hunting improved. The linguists, in fairness, kept insisting the beast could not exist.',
    w: 1300, aspect: 1.7, size: [3.15, 1.85], seed: 141,
    draw(g) {
      const ar = g.W / g.H;
      // the boulder
      const b = [[0.48, 0.7], [0.5, 0.44], [0.6, 0.3], [0.75, 0.26], [0.87, 0.36], [0.9, 0.58], [0.84, 0.74], [0.62, 0.78]];
      g.wash(b, { color: 'brown', alpha: 0.13, w: 17, density: 1.2 });
      g.stroke([...b, b[0]], { color: 'char', w: 11, alpha: 0.6 });
      // hatching to make it read as rock
      g.stroke([[0.58, 0.68], [0.62, 0.52]], { color: 'char', w: 4, alpha: 0.28, dry: 0.5 });
      g.stroke([[0.72, 0.7], [0.77, 0.55]], { color: 'char', w: 4, alpha: 0.28, dry: 0.5 });
      // two horns peeking over the top edge
      g.stroke([[0.6, 0.28], [0.57, 0.16], [0.6, 0.08]], { color: 'char', w: 9, alpha: 0.7 });
      g.stroke([[0.71, 0.27], [0.74, 0.16], [0.71, 0.08]], { color: 'char', w: 9, alpha: 0.7 });
      // footprint trail: pairs of toe-ovals, arcing toward and past the boulder
      const trailT = [];
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        trailT.push([0.06 + t * 0.75, 0.9 - Math.sin(t * 2.4) * 0.1]);
      }
      trailT.forEach(([x, y], i) => {
        g.dot(x - 0.008, y, 7, { color: 'red', alpha: 0.65 });
        g.dot(x + 0.01, y - 0.012, 7, { color: 'red', alpha: 0.65 });
        // emission mark beside each print
        g.glyphs(x - 0.005, y + 0.055, 1, 0.02, { color: 'char', w: 3.5, alpha: 0.45, kinds: [(i * 2) % 6] });
      });
      // the inferred path: chain of hollow rings arcing over/behind the boulder
      const hidden = [];
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        hidden.push([0.1 + t * 0.62, 0.4 - Math.sin(t * 2.8) * 0.18]);
      }
      hidden.forEach(([x, y], i) => {
        g.circle(x, y, 0.017, { color: 'char', w: 5, alpha: 0.5 });
        if (i < 6) {
          const [nx, ny] = hidden[i + 1];
          g.stroke([[x + 0.02, y], [nx - 0.02, ny]], { color: 'char', w: 3, alpha: 0.35, dry: 0.65 });
        }
        // faint vertical correspondence to a print
        const [px2, py2] = trailT[Math.min(8, i + 1)];
        g.stroke([[x, y + 0.03], [px2, py2 - 0.05]], { color: 'char', w: 2.5, alpha: 0.22, dry: 0.7 });
      });
    },
  },

  {
    id: 'mt',
    title: 'The Twin Herds',
    sub: 'PANEL XV · charcoal, red ochre, yellow sinew-lines · c. 1990 (Brown et al., IBM; the Canadian Hansard)',
    body: 'Two herds face each other across the panel: the charcoal herd speaks one tongue, the red herd another. The yellow sinews joining them are the discovery: animal to animal, learned — not from any grammar, but from a great salt-lick where both herds had ALWAYS grazed together, every utterance of one twinned with the other (a parliament, in a cold country, that by law spoke twice). Note the crossings, where the herds order their beasts differently, and the poor ringed animal that answers to nothing at all. Given enough twinned speech, said the painters of this panel, the sinews find themselves. The nave’s elder painters called this cheating. It was. It worked.',
    w: 1350, aspect: 1.8, size: [3.3, 1.83], seed: 151,
    draw(g) {
      // top herd: 5 charcoal beasts
      const topX = [0.12, 0.3, 0.48, 0.66, 0.84];
      const botX = [0.1, 0.25, 0.4, 0.55, 0.7, 0.86];
      topX.forEach((x, i) => beast(g, x, 0.2, 0.14, { color: 'char', w: 6.5, horns: i === 2, flip: i % 2 === 1 }));
      botX.forEach((x, i) => beast(g, x, 0.76, 0.13, { color: 'red', w: 6, antlers: i === 3, flip: i % 2 === 0 }));
      // glyph strings above and below
      g.glyphs(0.09, 0.06, 12, 0.02, { color: 'char', w: 3.5, alpha: 0.42, gap: 3.4 });
      g.glyphs(0.07, 0.95, 15, 0.02, { color: 'red', w: 3.5, alpha: 0.42, gap: 3.3 });
      // alignment sinews: 1→1, 2→3, 3→2, 4→(4,5), 5→6 ; bottom[0] gets nothing
      const links = [[0, 1], [1, 2], [2, 1 + 1], [3, 3], [3, 4], [4, 5]];
      // corrected: use explicit pairs (top index → bottom index)
      const pairs = [[0, 1], [1, 3], [2, 2], [3, 4], [3, 5], [4, 5]];
      const seen = new Set();
      for (const [ti, bi] of pairs) {
        if (seen.has(ti + '-' + bi)) continue;
        seen.add(ti + '-' + bi);
        g.stroke([[topX[ti], 0.3], [(topX[ti] + botX[bi]) / 2 + 0.02, 0.53], [botX[bi], 0.66]], { color: 'yellow', w: 4.5, alpha: 0.5, dry: 0.45 });
      }
      // the unaligned animal, ringed in dots
      const ux = botX[0];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.dot(ux + Math.cos(a) * 0.075, 0.76 + Math.sin(a) * 0.075 * (g.W / g.H), 5, { color: 'char', alpha: 0.45 });
      }
    },
  },

  // ==================================================== SHAFT OF THE PERCEPTRON
  {
    id: 'xor',
    title: 'The Shaft Scene: the Ordeal of the Perceptron',
    sub: 'PANEL XVI · charcoal, rust wash · 1958–1969 (Rosenblatt; then Minsky & Papert, “Perceptrons”)',
    body: 'The deepest painting in the cave, and its most solemn. The disc-headed figure is the Perceptron, firstborn of the learning machines. At its birth the criers promised it would walk, speak, see and reproduce; the Navy paid. It learned truly — but only what a single straight spear can divide. On the bison’s flank the four terrible dots: same-diagonal filled, other-diagonal hollow. EITHER-OR-BUT-NOT-BOTH. No straight spear divides them; see it snap. The book that proved this froze the fires of an entire age (the elders call it the Long Winter). The figure is drawn falling, not dead — consult the far wall. The bird on the staff appears in the original Shaft at Lascaux also; its meaning is disputed there too, and we see no reason to break with tradition.',
    w: 1500, aspect: 1.9, size: [4.1, 2.15], seed: 161,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 13, alpha: 0.65 };
      // ============ the bison, facing left, head lowered
      // back and hump
      g.stroke([[0.9, 0.42], [0.88, 0.3], [0.78, 0.2], [0.62, 0.15], [0.5, 0.2], [0.44, 0.3]], o);
      // head, low, facing left
      g.stroke([[0.44, 0.3], [0.4, 0.42], [0.36, 0.52], [0.38, 0.62], [0.44, 0.66]], o);
      // horns
      g.stroke([[0.41, 0.36], [0.35, 0.28], [0.35, 0.22]], { ...o, w: 9 });
      g.stroke([[0.44, 0.33], [0.47, 0.24], [0.46, 0.18]], { ...o, w: 9 });
      // beard
      for (let i = 0; i < 3; i++) {
        g.stroke([[0.4 + i * 0.02, 0.64 + i * 0.01], [0.39 + i * 0.02, 0.72 + i * 0.01]], { ...o, w: 6, alpha: 0.5 });
      }
      // chest, belly, rear
      g.stroke([[0.44, 0.66], [0.52, 0.72], [0.62, 0.74], [0.76, 0.72]], o);
      g.stroke([[0.9, 0.42], [0.93, 0.55], [0.88, 0.66], [0.76, 0.72]], o);
      // legs
      g.stroke([[0.52, 0.7], [0.51, 0.92]], { ...o, w: 10 });
      g.stroke([[0.6, 0.73], [0.6, 0.93]], { ...o, w: 10 });
      g.stroke([[0.78, 0.7], [0.79, 0.92]], { ...o, w: 10 });
      g.stroke([[0.86, 0.66], [0.88, 0.9]], { ...o, w: 10 });
      // tail, raised
      g.stroke([[0.9, 0.4], [0.96, 0.3], [0.95, 0.2]], { ...o, w: 8 });
      // mane hatching on the hump
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const x = 0.5 + t * 0.26;
        g.stroke([[x, 0.17 + Math.sin(t * 3) * 0.02], [x - 0.03, 0.28]], { color: 'char', w: 5, alpha: 0.4, dry: 0.4 });
      }
      // body wash
      g.wash([[0.46, 0.32], [0.52, 0.22], [0.64, 0.18], [0.78, 0.22], [0.88, 0.32], [0.9, 0.5], [0.84, 0.64], [0.72, 0.7], [0.56, 0.7], [0.46, 0.6], [0.42, 0.45]], { color: 'rust', alpha: 0.12, w: 18 });
      g.dot(0.415, 0.44, 10, { color: 'char', alpha: 0.8 }); // eye
      // ============ the four terrible dots (XOR) on the flank
      const q = [[0.6, 0.36], [0.73, 0.36], [0.6, 0.57], [0.73, 0.57]];
      g.dot(q[0][0], q[0][1], 19, { color: 'char', alpha: 0.9 });            // (0,0) -> filled
      g.circle(q[1][0], q[1][1], 0.021, { color: 'char', w: 9, alpha: 0.85 }); // (1,0) hollow
      g.circle(q[2][0], q[2][1], 0.021, { color: 'char', w: 9, alpha: 0.85 }); // (0,1) hollow
      g.dot(q[3][0], q[3][1], 19, { color: 'char', alpha: 0.9 });            // (1,1) filled
      // ============ the spear that snaps (high, above the fallen one)
      g.stroke([[0.04, 0.34], [0.2, 0.36], [0.36, 0.42]], { color: 'char', w: 7, alpha: 0.7 });
      // break: deflected splinter + scatter
      g.stroke([[0.38, 0.44], [0.44, 0.52], [0.43, 0.58]], { color: 'char', w: 6, alpha: 0.6 });
      g.dots([[0.39, 0.38], [0.42, 0.44], [0.38, 0.5]], 4.5, { color: 'char', alpha: 0.55 });
      // ============ the falling perceptron, lower left
      const px2 = 0.14, py2 = 0.66;
      // tilted body
      g.stroke([[px2, py2], [px2 + 0.06, py2 + 0.09], [px2 + 0.09, py2 + 0.17]], { color: 'char', w: 9, alpha: 0.7 });
      // legs, flung
      g.stroke([[px2 + 0.09, py2 + 0.17], [px2 + 0.17, py2 + 0.14]], { color: 'char', w: 8, alpha: 0.65 });
      g.stroke([[px2 + 0.09, py2 + 0.17], [px2 + 0.15, py2 + 0.26]], { color: 'char', w: 8, alpha: 0.65 });
      // arms, flung back
      g.stroke([[px2 + 0.03, py2 + 0.045], [px2 - 0.05, py2 - 0.0]], { color: 'char', w: 7, alpha: 0.65 });
      g.stroke([[px2 + 0.03, py2 + 0.045], [px2 - 0.035, py2 + 0.1]], { color: 'char', w: 7, alpha: 0.65 });
      // the disc head: retina ring with grid dots
      g.circle(px2 - 0.02, py2 - 0.075, 0.043, { color: 'char', w: 8, alpha: 0.75 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        g.dot(px2 - 0.02 + (c - 1) * 0.02, py2 - 0.075 + (r - 1) * 0.02 * ar, 4.5, { color: 'red', alpha: 0.65 });
      }
      // one dead output stroke from the disc, trailing to the ground
      g.stroke([[px2 + 0.015, py2 - 0.045], [px2 + 0.06, py2 + 0.02]], { color: 'red', w: 5, alpha: 0.55 });
      g.stroke([[px2 + 0.06, py2 + 0.02], [px2 + 0.1, py2 + 0.3]], { color: 'red', w: 4, alpha: 0.4, dry: 0.65 });
      // ============ the bird on the staff (tradition)
      g.stroke([[0.05, 0.93], [0.05, 0.76]], { color: 'char', w: 6, alpha: 0.65 });
      // horizontal body, tail, head knob, beak
      g.stroke([[0.02, 0.73], [0.05, 0.705], [0.08, 0.715]], { color: 'char', w: 9, alpha: 0.7 });
      g.stroke([[0.02, 0.73], [-0.005, 0.75]], { color: 'char', w: 6, alpha: 0.6 });   // tail
      g.dot(0.087, 0.7, 6.5, { color: 'char', alpha: 0.75 });                          // head
      g.stroke([[0.095, 0.7], [0.12, 0.695]], { color: 'char', w: 4, alpha: 0.65 });   // beak
    },
  },

  {
    id: 'backprop',
    title: 'The Return',
    sub: 'PANEL XVII · charcoal, red ochre · c. 1986 (Rumelhart, Hinton & Williams, in “Nature”)',
    body: 'The facing wall answers the Shaft. The disc-headed figure stands again — and where it had one disc it now has three, tier upon tier, joined by many sinews. The red marks run BACKWARD down the sinews: that is the whole spell. The figure errs at the top, and the blame for the error flows back through every joint, each sinew shifting by its share, the hidden middle tier learning what no one could teach it directly. The spear that killed its ancestor cannot kill this one; a bent blade cuts where a straight one could not. Below, the valley: the figure descends it blind, feeling for the slope, settling where the ground stops falling. The elders note the valley has many bottoms, and the figure settles in whichever it reaches first, and that this, mysteriously, is usually good enough.',
    w: 1000, aspect: 1.2, size: [2.4, 2.0], seed: 171,
    draw(g) {
      const ar = g.W / g.H;
      // standing figure, arms in V
      stick(g, 0.5, 0.52, 0.24, { color: 'char', w: 10, alpha: 0.65, armL: -2.2, armR: -0.9, headFill: false });
      // three tiers of discs above (halo of layers), small→large upward
      const tiers = [
        { y: 0.33, n: 2, r: 0.02 },
        { y: 0.2, n: 3, r: 0.023 },
        { y: 0.06, n: 4, r: 0.026 },
      ];
      const nodesPer = tiers.map((t) => {
        const xs = [];
        for (let i = 0; i < t.n; i++) xs.push(0.5 + (i - (t.n - 1) / 2) * 0.11);
        return xs;
      });
      tiers.forEach((t, ti) => {
        nodesPer[ti].forEach((x) => {
          g.circle(x, t.y, t.r, { color: 'char', w: 6, alpha: 0.6 });
          g.dot(x, t.y, 5, { color: 'char', alpha: 0.5 });
        });
      });
      // sinews between tiers + backward red arrows
      for (let ti = 0; ti < 2; ti++) {
        for (const x1 of nodesPer[ti]) for (const x2 of nodesPer[ti + 1]) {
          g.stroke([[x1, tiers[ti].y - 0.02], [x2, tiers[ti + 1].y + 0.03]], { color: 'char', w: 3, alpha: 0.35 });
        }
      }
      // error flows back: red arrows pointing DOWN the stack
      g.arrow(0.63, 0.06, 0.66, 0.19, { color: 'red', w: 5, alpha: 0.65, head: 12 });
      g.arrow(0.66, 0.22, 0.62, 0.32, { color: 'red', w: 5, alpha: 0.65, head: 12 });
      g.arrow(0.6, 0.35, 0.54, 0.43, { color: 'red', w: 5, alpha: 0.65, head: 12 });
      // the valley below, with the settling ball
      const v = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const x = 0.12 + t * 0.76;
        const y = 0.92 - 0.13 * Math.sin(t * Math.PI) - 0.05 * Math.sin(t * 3 * Math.PI + 0.4);
        v.push([x, y]);
      }
      g.stroke(v, { color: 'char', w: 9, alpha: 0.65, taper: 0.15, dry: 0.08 });
      // ball path: dotted from rim down into the deeper bottom
      const path = [[0.2, 0.72], [0.32, 0.78], [0.42, 0.83], [0.5, 0.86]];
      path.forEach(([x, y]) => g.dot(x, y, 6, { color: 'red', alpha: 0.55 }));
      g.dot(0.56, 0.87, 13, { color: 'red', alpha: 0.8 });
      g.stroke(spiralPts(0.56, 0.87, 0.04, 0.018, 1.2, ar), { color: 'red', w: 4, alpha: 0.5 });
    },
  },

  // ================================================== THE GALLERY CEILING
  {
    id: 'loom',
    title: 'The Loom of Memory',
    sub: 'CEILING PANEL · charcoal, red ochre · c. 1949–1975 (magnetic-core memory)',
    body: 'Painted overhead, in the weavers’ position. A lattice of rings, each threaded by three sinews, each ring magnetized one way or the other — a filled ring remembers ONE, a hollow ring remembers NOTHING, and the whole sky of them remembers everything the machine knows. For a quarter of a century all computer memory was made this way: by hand, ring by ring, wire by wire, mostly by women, with steady fingers and textile patience. The programs that steered Apollo to the Moon were woven so, and the engineers called it little-old-lady memory, and the Moon was reached on needlework. Note the diagonal sense-wire: to read a ring, the machine must try to flip it — every act of remembering erases, and what is read must at once be rewoven. The painters put it on the ceiling because that is where one looks when trying to recall something.',
    w: 1150, aspect: 1.35, size: [2.7, 2.0], seed: 191, maxD: 6.5,
    draw(g) {
      const ar = g.W / g.H;
      const cols = 4, rows = 3;
      const gx0 = 0.16, gy0 = 0.18, cw = 0.2, chh = 0.26;
      // drive wires: horizontal per row, vertical per column
      for (let r = 0; r < rows; r++) {
        const y = gy0 + r * chh;
        g.stroke([[0.05, y + (g.rng() - 0.5) * 0.02], [0.5, y], [0.95, y + (g.rng() - 0.5) * 0.02]], { color: 'char', w: 5, alpha: 0.5 });
      }
      for (let c = 0; c < cols; c++) {
        const x = gx0 + c * cw;
        g.stroke([[x, 0.06], [x + (g.rng() - 0.5) * 0.015, 0.5], [x, 0.9]], { color: 'char', w: 5, alpha: 0.5 });
      }
      // the diagonal sense wire, threading every ring
      g.stroke([[0.04, 0.85], [gx0 + cw, gy0 + chh + 0.03], [gx0 + 2 * cw, gy0 + chh - 0.03], [0.93, 0.08]], { color: 'red', w: 4.5, alpha: 0.55, dry: 0.35 });
      // the rings
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = gx0 + c * cw, y = gy0 + r * chh;
          g.circle(x, y, 0.052, { color: 'char', w: 9, alpha: 0.68 });
          if ((r * cols + c) % 3 !== 1) g.dot(x, y, 11, { color: 'red', alpha: 0.7 });
        }
      }
      // the weaver, small, at the loom's edge, reaching in
      stick(g, 0.08, 0.62, 0.16, { color: 'red', w: 6, alpha: 0.7, armL: -0.6, armR: 2.6 });
      g.stroke([[0.13, 0.57], [0.2, 0.6], [0.28, 0.68]], { color: 'red', w: 3.5, alpha: 0.5 }); // her thread
    },
  },

  // ============================================================== THE APSE
  {
    id: 'attention',
    title: 'The Intrusion',
    sub: 'APSE PANEL · charcoal only, unweathered · c. 2017 (“Attention Is All You Need”) · CATALOGING DISPUTED',
    body: 'This panel does not belong to the cave. The charcoal is fresh; the strokes were made with a modern hand; conservators found no calcite over the pigment, and the pigment, when dated, refused. It depicts a lattice in which every mark attends to every other mark at once — no chain, no river, no order but what the marks agree among themselves. The old painters worked one stroke after another; whoever made this worked all strokes at once, and did not stay to finish. The beast in the corner is abandoned mid-outline. The Ministry has asked that this panel not be encouraged. It is included for completeness. Something has been in the cave recently. The torch you are holding was found still warm.',
    w: 1100, aspect: 1.4, size: [2.4, 1.71], seed: 181, fresh: true,
    draw(g) {
      const ar = g.W / g.H;
      const sharp = { color: 'char', wobble: 0.35, dry: 0.15 };
      // six glyphs across the top, six down the left — the same six
      const kinds = [0, 4, 2, 3, 1, 5];
      const topPos = [], leftPos = [];
      for (let i = 0; i < 6; i++) {
        const x = 0.24 + i * 0.13;
        g.glyphs(x, 0.1, 1, 0.026, { ...sharp, w: 5, alpha: 0.6, kinds: [kinds[i]] });
        topPos.push([x, 0.16]);
        const y = 0.24 + i * 0.115;
        g.glyphs(0.07, y, 1, 0.026, { ...sharp, w: 5, alpha: 0.6, kinds: [kinds[i]] });
        leftPos.push([0.13, y]);
      }
      // the lattice: left half dense hairlines, a few heavy
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          if (topPos[i][0] > 0.62) {
            // unfinished right side: only guide dots
            g.dot(topPos[i][0], leftPos[j][1], 3, { color: 'char', alpha: 0.35 });
            continue;
          }
          const heavy = (i + 2 * j) % 7 === 0;
          g.stroke([[topPos[i][0], topPos[i][1] + 0.02], [topPos[i][0] * 0.4 + leftPos[j][0] * 0.6 + 0.12, (topPos[i][1] + leftPos[j][1]) / 2], [leftPos[j][0] + 0.02, leftPos[j][1]]],
            { ...sharp, w: heavy ? 6.5 : 2, alpha: heavy ? 0.65 : 0.3 });
        }
      }
      // the abandoned beast, lower right: back line, one leg, nothing else
      g.stroke([[0.66, 0.78], [0.76, 0.72], [0.88, 0.73]], { ...sharp, w: 9, alpha: 0.6 });
      g.stroke([[0.84, 0.74], [0.85, 0.88]], { ...sharp, w: 8, alpha: 0.55 });
      // the modern signature: a perfectly straight line (no ancient hand drew straight)
      g.line(0.66, 0.94, 0.9, 0.94, { color: 'char', w: 3, alpha: 0.5, wobble: 0.05, dry: 0.05 });
    },
  },
];

// ------------------------------------------------------------------ the bake

export function bakePainting(p, scale = 1) {
  const W = Math.round(p.w * scale);
  const H = Math.round((p.w / p.aspect) * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const g = makePainter(ctx, W, H, p.seed);
  p.draw(g);
  g.weather(p.fresh ? 0.25 : 1.0);
  return canvas;
}
