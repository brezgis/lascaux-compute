// motifs.js — the crowd. Small parameterized figures scattered densely over
// walls and ceilings between the plaqued panels, the way real Lascaux is
// covered: marked beasts, hunters, hands, counting signs — and the cave's own
// bestiary of computation: punch tape, core rings, gates, sorting nets.

import { makePainter, mulberry32 } from './paint.js';
import { beast, stick, spiralPts } from './paintings.js';

const pickColor = (rng, opts = ['char', 'char', 'red', 'rust', 'yellow']) =>
  opts[(rng() * opts.length) | 0];

// ---------------------------------------------------------------- the motifs

export const MOTIFS = {

  // a beast with computational flank-marks
  beastMark: {
    aspect: 1.4, px: 420, size: [1.1, 2.1], wWall: 3, wCeil: 2.4,
    draw(g, rng) {
      const color = pickColor(rng);
      const flip = rng() < 0.5;
      beast(g, 0.5, 0.48, 0.75, {
        color, w: 9, flip,
        horns: rng() < 0.4, antlers: rng() < 0.25, alpha: 0.6,
      });
      if (rng() < 0.45) {
        g.wash([[0.25, 0.35], [0.5, 0.28], [0.72, 0.36], [0.68, 0.52], [0.35, 0.54]],
          { color: pickColor(rng, ['rust', 'yellow', 'red']), alpha: 0.1, w: 13 });
      }
      // flank marks: XOR square, tallies, or binary dots
      const mk = rng();
      const mc = color === 'char' ? 'red' : 'char';
      if (mk < 0.33) {
        g.dot(0.44, 0.38, 9, { color: mc, alpha: 0.7 });
        g.circle(0.56, 0.38, 0.014, { color: mc, w: 5, alpha: 0.65 });
        g.circle(0.44, 0.5, 0.014, { color: mc, w: 5, alpha: 0.65 });
        g.dot(0.56, 0.5, 9, { color: mc, alpha: 0.7 });
      } else if (mk < 0.66) {
        for (let i = 0; i < 3 + ((rng() * 3) | 0); i++) {
          g.line(0.38 + i * 0.055, 0.36, 0.375 + i * 0.055, 0.5, { color: mc, w: 5, alpha: 0.6 });
        }
      } else {
        for (let i = 0; i < 5; i++) {
          if (rng() < 0.5) g.dot(0.36 + i * 0.06, 0.43, 7, { color: mc, alpha: 0.65 });
          else g.circle(0.36 + i * 0.06, 0.43, 0.012, { color: mc, w: 4.5, alpha: 0.6 });
        }
      }
    },
  },

  // a small herd, diminishing
  herdRow: {
    aspect: 2.2, px: 560, size: [1.7, 2.6], wWall: 1.4, wCeil: 2.2,
    draw(g, rng) {
      const color = pickColor(rng);
      const flip = rng() < 0.5;
      const n = 2 + ((rng() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const s = 0.52 - i * 0.13;
        const x = flip ? 0.76 - i * 0.3 : 0.24 + i * 0.3;
        beast(g, x, 0.5 + i * 0.03, s, {
          color, w: 8 - i * 1.5, flip,
          horns: i === 0 && rng() < 0.5, alpha: 0.6 - i * 0.08,
        });
      }
    },
  },

  // a hunter after a beast — the pursuit of a minimum
  hunterChase: {
    aspect: 1.9, px: 500, size: [1.4, 2.0], wWall: 1.1, wCeil: 0.7,
    draw(g, rng) {
      const flip = rng() < 0.3;
      const bx = flip ? 0.28 : 0.68, hx = flip ? 0.78 : 0.18;
      beast(g, bx, 0.44, 0.5, { color: 'char', w: 8, flip, alpha: 0.62 });
      stick(g, hx, 0.62, 0.26, {
        color: 'red', w: 7, alpha: 0.68,
        armL: flip ? -2.6 : -0.5, armR: flip ? -0.5 : -2.6,
      });
      // the spear, mid-flight
      const sx = flip ? hx - 0.14 : hx + 0.14;
      const ex = flip ? bx + 0.18 : bx - 0.18;
      g.stroke([[sx, 0.42], [(sx + ex) / 2, 0.36], [ex, 0.4]], { color: 'char', w: 5, alpha: 0.55 });
      // motion dashes
      for (let i = 0; i < 3; i++) {
        const mx = hx + (flip ? 0.1 : -0.1) - (flip ? -1 : 1) * i * 0.05;
        g.line(mx, 0.75 + i * 0.02, mx + (flip ? 0.05 : -0.05), 0.76 + i * 0.02, { color: 'red', w: 3.5, alpha: 0.4 });
      }
    },
  },

  // a lone negative hand (rarely, the appendage)
  handSingle: {
    aspect: 1.0, px: 300, size: [0.55, 0.85], wWall: 1.2, wCeil: 0.8,
    draw(g, rng) {
      const color = pickColor(rng, ['red', 'rust', 'yellow']);
      const cursor = rng() < 0.1;
      const rot = (rng() - 0.5) * 1.2;
      const p = new Path2D();
      const c = Math.cos(rot), sn = Math.sin(rot);
      const S = 0.52 * g.W;
      const P = (dx, dy) => [g.X(0.5) + (dx * c - dy * sn) * S, g.Y(0.55) + (dx * sn + dy * c) * S];
      if (cursor) {
        const pts = [[0, -0.3], [0.22, 0.14], [0.09, 0.12], [0.16, 0.3], [0.06, 0.34], [-0.01, 0.16], [-0.1, 0.26]];
        pts.forEach(([dx, dy], i) => { const [x, y] = P(dx * 1.4, dy * 1.4); i ? p.lineTo(x, y) : p.moveTo(x, y); });
        p.closePath();
      } else {
        let [px2, py2] = P(0, 0.1);
        p.ellipse(px2, py2, S * 0.19, S * 0.23, rot, 0, 6.29);
        const angles = [-0.5, -0.22, 0.02, 0.28, 0.95];
        for (let i = 0; i < 5; i++) {
          const a = angles[i];
          const len = i === 4 ? 0.24 : (0.32 - Math.abs(a) * 0.09);
          const base = i === 4 ? [0.17, 0.06] : [Math.sin(a) * 0.15, -0.06];
          const tip = i === 4 ? [0.17 + Math.sin(1.15) * len, 0.06 - Math.cos(1.15) * len]
                              : [Math.sin(a) * (0.15 + len), -0.06 - Math.cos(a) * len];
          const [bx, by] = P(...base);
          const [tx, ty] = P(...tip);
          const fl = Math.hypot(tx - bx, ty - by);
          p.ellipse((bx + tx) / 2, (by + ty) / 2, fl / 2 + S * 0.026, S * 0.06, Math.atan2(ty - by, tx - bx), 0, 6.29);
        }
      }
      g.spray(0.5, 0.52, 0.34, { color, excludePath: p, density: 1.8, alpha: 0.5 });
    },
  },

  // rows and arcs of finger dots
  dotField: {
    aspect: 1.4, px: 300, size: [0.6, 1.2], wWall: 1.6, wCeil: 2.2,
    draw(g, rng) {
      const rows = 2 + ((rng() * 3) | 0);
      for (let r = 0; r < rows; r++) {
        const n = 4 + ((rng() * 6) | 0);
        const y0 = 0.2 + r * (0.6 / rows);
        const arc = (rng() - 0.5) * 0.3;
        const color = pickColor(rng, ['red', 'char', 'yellow', 'red']);
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          g.dot(0.12 + t * 0.76, y0 + Math.sin(t * Math.PI) * arc, 7 + rng() * 4, { color, alpha: 0.6 });
        }
      }
    },
  },

  // counting: tally groups, one ringed
  tallyGroup: {
    aspect: 1.3, px: 280, size: [0.5, 0.95], wWall: 1.3, wCeil: 1.2,
    draw(g, rng) {
      const groups = 2 + ((rng() * 3) | 0);
      const ringed = (rng() * groups) | 0;
      let x = 0.12;
      for (let gi = 0; gi < groups; gi++) {
        const n = 1 + ((rng() * 5) | 0);
        const color = pickColor(rng, ['char', 'char', 'red']);
        for (let i = 0; i < n; i++) {
          g.line(x + i * 0.055, 0.35, x + i * 0.05, 0.65, { color, w: 6, alpha: 0.6 });
        }
        if (gi === ringed) g.circle(x + n * 0.028, 0.5, 0.05 + n * 0.02, { color: 'red', w: 4.5, alpha: 0.5, dry: 0.5 });
        x += n * 0.055 + 0.12;
      }
    },
  },

  // ferrite rings on their sense wires
  coreRings: {
    aspect: 1.25, px: 300, size: [0.55, 1.05], wWall: 0.9, wCeil: 1.1,
    draw(g, rng) {
      const n = 1 + ((rng() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const x = 0.25 + i * (0.5 / Math.max(1, n - 1) || 0) * (n > 1 ? 1 : 0) + (n === 1 ? 0.25 : 0);
        const y = 0.35 + (i % 2) * 0.3;
        g.circle(x, y, 0.11, { color: 'char', w: 8, alpha: 0.65 });
        // threading wires
        g.stroke([[x - 0.2, y + 0.14], [x + 0.2, y - 0.14]], { color: 'char', w: 4, alpha: 0.5 });
        g.stroke([[x - 0.2, y - 0.14], [x + 0.2, y + 0.14]], { color: 'red', w: 4, alpha: 0.5 });
        if (rng() < 0.5) g.dot(x, y, 8, { color: 'red', alpha: 0.7 });
      }
    },
  },

  // a ribbon of punched tape — lovely arcing over ceilings
  punchTape: {
    aspect: 3.4, px: 700, size: [1.9, 3.1], wWall: 0.7, wCeil: 1.7,
    draw(g, rng) {
      const sag = (rng() - 0.5) * 0.3;
      const top = (t) => 0.3 + Math.sin(t * Math.PI) * sag;
      const bot = (t) => top(t) + 0.42;
      const tPts = [], bPts = [];
      for (let i = 0; i <= 6; i++) { tPts.push([0.04 + i * 0.153, top(i / 6)]); bPts.push([0.04 + i * 0.153, bot(i / 6)]); }
      g.stroke(tPts, { color: 'char', w: 7, alpha: 0.6, taper: 0.2 });
      g.stroke(bPts, { color: 'char', w: 7, alpha: 0.6, taper: 0.2 });
      for (let i = 0; i < 14; i++) {
        const t = 0.07 + i * 0.066;
        const y0 = top(t);
        // sprocket
        g.dot(t, y0 + 0.21, 4, { color: 'char', alpha: 0.55 });
        // data holes
        for (let b = 0; b < 4; b++) {
          if (rng() < 0.45) continue;
          const dy = b < 2 ? 0.06 + b * 0.07 : 0.13 + b * 0.07;
          g.dot(t, y0 + dy, 7, { color: b === 0 ? 'red' : 'char', alpha: 0.65 });
        }
      }
    },
  },

  // a punched card, corner clipped
  punchCard: {
    aspect: 1.5, px: 340, size: [0.8, 1.3], wWall: 0.9, wCeil: 0.8,
    draw(g, rng) {
      // outline with cut corner (top-left)
      g.stroke([[0.22, 0.18], [0.88, 0.2]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[0.88, 0.2], [0.87, 0.78]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[0.87, 0.78], [0.13, 0.76]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[0.13, 0.76], [0.12, 0.3]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[0.12, 0.3], [0.22, 0.18]], { color: 'char', w: 6, alpha: 0.65 }); // the cut
      // columns of holes
      for (let c = 0; c < 6; c++) {
        for (let r = 0; r < 3; r++) {
          if (rng() < 0.45) continue;
          const x = 0.22 + c * 0.11, y = 0.3 + r * 0.16;
          g.line(x, y, x, y + 0.07, { color: rng() < 0.15 ? 'red' : 'char', w: 5, alpha: 0.6 });
        }
      }
    },
  },

  // a trap-sign that eats two marks and lets one out
  logicGate: {
    aspect: 1.4, px: 300, size: [0.6, 1.0], wWall: 0.9, wCeil: 0.6,
    draw(g, rng) {
      const neg = rng() < 0.35;
      // D-body
      g.stroke([[0.3, 0.25], [0.3, 0.75]], { color: 'char', w: 7, alpha: 0.65 });
      g.stroke([[0.3, 0.25], [0.55, 0.28], [0.66, 0.5], [0.55, 0.72], [0.3, 0.75]], { color: 'char', w: 7, alpha: 0.65 });
      // inputs
      g.line(0.08, 0.38, 0.29, 0.38, { color: 'red', w: 5, alpha: 0.6 });
      g.line(0.08, 0.62, 0.29, 0.62, { color: 'red', w: 5, alpha: 0.6 });
      // output
      if (neg) g.circle(0.71, 0.5, 0.035, { color: 'char', w: 5, alpha: 0.65 });
      g.arrow(neg ? 0.76 : 0.67, 0.5, 0.92, 0.5, { color: 'red', w: 5, alpha: 0.6, head: 10 });
    },
  },

  // a little tree of decisions
  binTree: {
    aspect: 1.2, px: 300, size: [0.7, 1.1], wWall: 0.8, wCeil: 0.7,
    draw(g, rng) {
      const nodes = [[0.5, 0.15], [0.3, 0.5], [0.7, 0.5], [0.18, 0.85], [0.42, 0.85], [0.58, 0.85], [0.82, 0.85]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      for (const [a, b] of edges) {
        g.stroke([nodes[a], nodes[b]], { color: 'char', w: 5.5, alpha: 0.55 });
      }
      nodes.forEach(([x, y], i) => {
        if (i === 6 && rng() < 0.6) g.dot(x, y, 9, { color: 'red', alpha: 0.7 });
        else g.circle(x, y, 0.035, { color: 'char', w: 5, alpha: 0.6 });
      });
    },
  },

  // recursion: a spiral, or a nest of mouths holding a seed
  spiralRec: {
    aspect: 1.15, px: 300, size: [0.5, 1.0], wWall: 0.8, wCeil: 1.0,
    draw(g, rng) {
      if (rng() < 0.5) {
        g.stroke(spiralPts(0.5, 0.5, 0.02, 0.34, 2.6, g.W / g.H, rng() < 0.5 ? 1 : -1),
          { color: pickColor(rng), w: 6.5, alpha: 0.6, taper: 0.2 });
        g.dot(0.5, 0.5, 8, { color: 'red', alpha: 0.7 });
      } else {
        // (((·))) — the nest
        for (let i = 0; i < 3; i++) {
          const o = 0.1 + i * 0.09;
          const w = 6.5 - i;
          g.stroke([[0.28 + o * 0.5, 0.2 + i * 0.06], [0.16 + o, 0.5], [0.28 + o * 0.5, 0.8 - i * 0.06]], { color: 'char', w, alpha: 0.6 });
          g.stroke([[0.72 - o * 0.5, 0.2 + i * 0.06], [0.84 - o, 0.5], [0.72 - o * 0.5, 0.8 - i * 0.06]], { color: 'char', w, alpha: 0.6 });
        }
        g.dot(0.5, 0.5, 10, { color: 'red', alpha: 0.75 });
      }
    },
  },

  // rails with crossings — the little sorting net
  sortNet: {
    aspect: 1.6, px: 340, size: [0.9, 1.4], wWall: 0.7, wCeil: 0.6,
    draw(g, rng) {
      const rails = 3 + ((rng() * 2) | 0);
      for (let r = 0; r < rails; r++) {
        const y = 0.25 + r * (0.5 / (rails - 1));
        g.stroke([[0.08, y], [0.5, y + (rng() - 0.5) * 0.02], [0.92, y]], { color: 'char', w: 5, alpha: 0.55 });
      }
      const cmps = 3 + ((rng() * 3) | 0);
      for (let cI = 0; cI < cmps; cI++) {
        const x = 0.18 + rng() * 0.64;
        const a = (rng() * (rails - 1)) | 0;
        const y1 = 0.25 + a * (0.5 / (rails - 1));
        const y2 = 0.25 + (a + 1) * (0.5 / (rails - 1));
        g.line(x, y1, x, y2, { color: 'red', w: 5, alpha: 0.6 });
        g.dot(x, y1, 6, { color: 'red', alpha: 0.7 });
        g.dot(x, y2, 6, { color: 'red', alpha: 0.7 });
      }
    },
  },

  // a lesser chain-serpent
  serpentSmall: {
    aspect: 1.9, px: 420, size: [1.0, 1.6], wWall: 0.9, wCeil: 1.0,
    draw(g, rng) {
      const n = 4 + ((rng() * 3) | 0);
      const pts = [];
      const ph = rng() * 3;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        pts.push([0.12 + t * 0.68, 0.5 + Math.sin(t * 3.5 + ph) * 0.16]);
      }
      pts.forEach(([x, y], i) => {
        g.circle(x, y, 0.035, { color: 'char', w: 6, alpha: 0.6 });
        if (i % 2 === 0) g.dot(x, y, 7, { color: 'red', alpha: 0.6 });
        if (i < n - 1) g.stroke([[x + 0.035, y], [pts[i + 1][0] - 0.035, pts[i + 1][1]]], { color: 'char', w: 5, alpha: 0.5 });
      });
      const [hx, hy] = pts[n - 1];
      g.stroke([[hx + 0.03, hy], [hx + 0.1, hy - 0.07]], { color: 'char', w: 7, alpha: 0.6 });
      g.dot(hx + 0.09, hy - 0.06, 6, { color: 'red', alpha: 0.7 });
    },
  },

  // a line of the cave's script, sometimes boxed
  glyphRow: {
    aspect: 2.4, px: 460, size: [0.9, 1.7], wWall: 1.2, wCeil: 1.1,
    draw(g, rng) {
      const n = 5 + ((rng() * 5) | 0);
      const color = pickColor(rng, ['char', 'char', 'red', 'yellow']);
      g.glyphs(0.1, 0.5, n, 0.055, { color, w: 5.5, alpha: 0.55, gap: 1.55 });
      if (rng() < 0.3) {
        g.stroke([[0.05, 0.24], [0.95, 0.26]], { color, w: 4, alpha: 0.4 });
        g.stroke([[0.05, 0.76], [0.95, 0.74]], { color, w: 4, alpha: 0.4 });
      }
    },
  },
};

// ------------------------------------------------------------------ sampling

const KINDS = Object.keys(MOTIFS);

export function pickKind(rng, ceiling) {
  let total = 0;
  for (const k of KINDS) total += ceiling ? MOTIFS[k].wCeil : MOTIFS[k].wWall;
  let r = rng() * total;
  for (const k of KINDS) {
    r -= ceiling ? MOTIFS[k].wCeil : MOTIFS[k].wWall;
    if (r <= 0) return k;
  }
  return KINDS[0];
}

// variant cache: a few bakes per kind, reused across the cave
const cache = new Map();

export function bakeMotif(kind, variant) {
  const key = kind + ':' + variant;
  if (cache.has(key)) return cache.get(key);
  const m = MOTIFS[kind];
  const W = m.px;
  const H = Math.round(m.px / m.aspect);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const seed = (kind.charCodeAt(0) * 7919 + variant * 104729 + 13) >>> 0;
  const g = makePainter(ctx, W, H, seed);
  const rng = mulberry32(seed ^ 0xabcdef);
  m.draw(g, rng);
  g.weather(0.85 + rng() * 0.35);
  cache.set(key, canvas);
  return canvas;
}
