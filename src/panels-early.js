// panels-early.js — the older wings: the Chamber of the Ancients (tally bone,
// sky-wheel, the stepwise hunter, the Book of Changes), the Engine House
// (loom, engine, Note G, the corral laws, the census herd), and the sworn
// beast of Bletchley that hangs in the Hall.
//
// Same format as paintings.js: normalized strokes through the pigment engine.

import { spiralPts, beast, stick, box, gear, card, arcPts } from './forms.js';

export const EARLY_PANELS = [

  // ================================================== CHAMBER OF THE ANCIENTS
  {
    id: 'ishango',
    title: 'The Tally Bone',
    date: 'c. 20,000 BP', who: 'the Ishango bone',
    body: 'A baboon fibula, notched some twenty thousand years ago on the shore of Lake Edward. One column runs 11, 13, 17, 19: every prime between ten and twenty. Whether its carver meant this is disputed with some heat.',
    w: 1300, aspect: 2.0, size: [3.1, 1.55], seed: 201,
    draw(g) {
      // the bone: a long shaft swelling to a knuckle at the right end
      const top = [[0.1, 0.3], [0.3, 0.26], [0.55, 0.27], [0.8, 0.29], [0.88, 0.24], [0.94, 0.3]];
      const bot = [[0.94, 0.74], [0.88, 0.8], [0.8, 0.74], [0.55, 0.76], [0.3, 0.77], [0.1, 0.72]];
      g.wash([...top, ...bot], { color: 'yellow', alpha: 0.12, w: 16, density: 1.2 });
      g.stroke([...top, [0.97, 0.52], bot[0]], { color: 'brown', w: 10, alpha: 0.6 });
      g.stroke([...bot, [0.075, 0.51], top[0]], { color: 'brown', w: 10, alpha: 0.6 });
      // the quartz chip at the working end
      g.wash([[0.01, 0.5], [0.075, 0.39], [0.11, 0.51], [0.07, 0.62]], { color: 'white', alpha: 0.5, w: 10, density: 2 });
      g.engrave([[0.01, 0.5], [0.075, 0.39], [0.11, 0.51], [0.07, 0.62], [0.01, 0.5]], { w: 4, alpha: 0.6 });
      // the three columns of notches
      const rows = [
        { y: 0.36, groups: [3, 6, 4, 8, 10, 5, 5, 7], red: false },
        { y: 0.5, groups: [11, 13, 17, 19], red: true },
        { y: 0.64, groups: [11, 21, 19, 9], red: false },
      ];
      for (const r of rows) {
        const n = r.groups.reduce((a, b) => a + b, 0);
        const span = 0.72, gapG = 0.028;
        const step = (span - gapG * (r.groups.length - 1)) / n;
        let x = 0.15;
        for (const k of r.groups) {
          for (let i = 0; i < k; i++) {
            const h = 0.045 + g.rng() * 0.015;
            const lean = (g.rng() - 0.5) * 0.004;
            if (r.red) g.line(x, r.y - h, x + lean, r.y + h, { color: 'red', w: 5, alpha: 0.7, wobble: 0.2 });
            else g.engrave([[x, r.y - h], [x + lean, r.y + h]], { w: 4.2, alpha: 0.7 });
            x += step;
          }
          x += gapG;
        }
      }
      // a counting hand pressed below, as if keeping place
      g.dots([[0.2, 0.9], [0.24, 0.91], [0.28, 0.9], [0.32, 0.91]], 7, { color: 'red', alpha: 0.5 });
    },
  },

  {
    id: 'khwarizmi',
    title: 'The Stepwise Hunter',
    date: 'c. 820', who: 'al-Khwārizmī, House of Wisdom, Baghdad',
    body: 'A hunter descends numbered steps, one at a time, and at the bottom the quarry is caught. The scribes kept his name, Algoritmi, and lost the man. His other book set broken things right: al-jabr, restoration.',
    w: 1150, aspect: 1.6, size: [2.7, 1.69], seed: 211,
    draw(g) {
      const ar = g.W / g.H;
      // the stair
      const stair = [];
      for (let i = 0; i < 7; i++) {
        const x0 = 0.08 + i * 0.105, y = 0.3 + i * 0.085;
        stair.push([x0, y], [x0 + 0.105, y]);
        if (i < 6) stair.push([x0 + 0.105, y + 0.085]);
      }
      g.stroke(stair, { color: 'char', w: 8, alpha: 0.6, taper: 0.1, wobble: 0.3 });
      // count marks on each tread; the first is the zero
      for (let i = 0; i < 7; i++) {
        const x0 = 0.08 + i * 0.105, y = 0.3 + i * 0.085;
        if (i === 0) {
          g.circle(x0 + 0.078, y - 0.04, 0.016, { color: 'red', w: 7, alpha: 0.8 });
        } else {
          for (let k = 0; k < i; k++) g.line(x0 + 0.035 + k * 0.012, y - 0.075, x0 + 0.035 + k * 0.012, y - 0.02, { color: 'char', w: 4.5, alpha: 0.62 });
        }
        // footprints
        g.dot(x0 + 0.02, y - 0.012, 5, { color: 'red', alpha: 0.5 });
        g.dot(x0 + 0.03, y - 0.02, 5, { color: 'red', alpha: 0.5 });
      }
      // the hunter, on the top step, stepping down
      stick(g, 0.1, 0.198, 0.11, { color: 'char', w: 7, alpha: 0.68, armL: 3.3, armR: 0.9, legSpread: 0.3 });
      g.stroke([[0.07, 0.24], [0.16, 0.08]], { color: 'char', w: 4, alpha: 0.55 }); // spear
      // the quarry at the bottom, caught
      beast(g, 0.87, 0.76, 0.19, { color: 'red', w: 9, horns: true, flip: true, alpha: 0.7 });
      g.stroke([[0.8, 0.87], [0.94, 0.86]], { color: 'char', w: 6, alpha: 0.5 });
      // al-jabr: a broken bone restored, bound in red
      const bone = (x1, y1, x2, y2) => {
        g.stroke([[x1, y1], [x2, y2]], { color: 'char', w: 13, alpha: 0.64, taper: 0.1 });
      };
      // knuckled ends: two lobes side by side, across the shaft
      const knob = (x, y, ux, uy) => {
        const L = Math.hypot(ux * g.W, uy * g.H);
        const nx = (-uy * g.H) / L, ny = (ux * g.W) / L;   // unit normal in px
        for (const sg of [-1, 1]) g.dot(x + (sg * nx * 11) / g.W, y + (sg * ny * 11) / g.H, 13, { color: 'char', alpha: 0.66 });
      };
      bone(0.56, 0.24, 0.715, 0.15);
      bone(0.735, 0.14, 0.9, 0.05);
      knob(0.55, 0.246, 0.34, -0.19);
      knob(0.91, 0.044, 0.34, -0.19);
      for (let k = 0; k < 4; k++) {
        const x = 0.7 + k * 0.014;
        g.line(x, 0.105 + k * 0.001, x + 0.02, 0.2 - k * 0.012, { color: 'red', w: 6, alpha: 0.75 });
      }
    },
  },

  {
    id: 'leibniz',
    title: 'The Book of Changes, Read in Twos',
    date: '1703', who: 'Leibniz, “Explication de l’Arithmétique Binaire”',
    body: 'A figure in an enormous wig reads the hexagrams of the Book of Changes as broken 0 and whole 1, and finds them counting. His motto for the discovery: to make everything out of nothing, one is enough.',
    w: 1150, aspect: 1.55, size: [2.6, 1.68], seed: 221,
    draw(g) {
      const ar = g.W / g.H;
      // the thinker in the wig
      stick(g, 0.11, 0.6, 0.24, { color: 'char', w: 9, alpha: 0.65, armL: 2.2, armR: -0.25 });
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.95 + i * 0.18);
        const cx = 0.11 + Math.cos(a) * 0.05, cy = 0.6 - 0.52 * 0.24 * ar + Math.sin(a) * 0.05 * ar + 0.03;
        g.stroke(spiralPts(cx, cy, 0.004, 0.02, 1.4, ar, i % 2 ? 1 : -1), { color: 'brown', w: 5, alpha: 0.6, taper: 0.3 });
      }
      // the hexagrams: 0, 1, 2, 3 … 63
      const nums = [0, 1, 2, 3, 63];
      const xs = [0.27, 0.4, 0.53, 0.66, 0.84];
      nums.forEach((n, k) => {
        const x = xs[k], bw = 0.095;
        const color = n === 63 ? 'red' : 'char';
        for (let b = 0; b < 6; b++) {
          const y = 0.12 + b * 0.068;
          const bit = (n >> (5 - b)) & 1;
          const o = { color, w: 13, alpha: 0.7, taper: 0.15, wobble: 0.2, dry: 0 };
          if (bit) g.line(x, y, x + bw, y, o);
          else { g.line(x, y, x + bw * 0.36, y, o); g.line(x + bw * 0.64, y, x + bw, y, o); }
        }
        // its count beneath
        const cy = 0.66, cx = x + bw / 2;
        if (n === 0) g.circle(cx, cy, 0.018, { color: 'char', w: 6, alpha: 0.6 });
        else if (n < 63) for (let d = 0; d < n; d++) g.dot(cx + (d - (n - 1) / 2) * 0.022, cy, 8, { color: 'char', alpha: 0.65 });
        else {
          g.dot(cx, cy, 16, { color: 'red', alpha: 0.75 });
          for (let r = 0; r < 10; r++) {
            const a = (r / 10) * Math.PI * 2;
            g.line(cx + Math.cos(a) * 0.028, cy + Math.sin(a) * 0.028 * ar, cx + Math.cos(a) * 0.05, cy + Math.sin(a) * 0.05 * ar, { color: 'red', w: 4, alpha: 0.6 });
          }
        }
      });
      // the long gap between 3 and 63, walked in dots
      g.dots([[0.775, 0.3], [0.79, 0.3], [0.805, 0.3]], 4, { color: 'char', alpha: 0.5 });
      // binary counting row along the base, 1 · 10 · 11 · 100 · 101 · 110 · 111
      let x = 0.28;
      for (let n = 1; n <= 7; n++) {
        const bits = n.toString(2);
        for (const b of bits) {
          if (b === '1') g.line(x, 0.82, x, 0.9, { color: 'char', w: 5, alpha: 0.55 });
          else g.circle(x, 0.86, 0.007, { color: 'char', w: 3.5, alpha: 0.55 });
          x += 0.022;
        }
        x += 0.028;
      }
    },
  },

  {
    id: 'antikythera',
    title: 'The Sky-Wheel of the Sponge Divers',
    date: 'c. 2nd–1st century BC', who: 'the Antikythera mechanism',
    body: 'Painted overhead, where the sky goes. Bronze wheels mesh to carry the Sun, the Moon in its phases, and the calendar of eclipses. Sponge divers raised it from a wreck in 1901. Nothing like it is known for a thousand years after.',
    w: 1150, aspect: 1.25, size: [2.7, 2.16], seed: 231, maxD: 6.8,
    draw(g) {
      const ar = g.W / g.H;
      // corrosion bloom under everything
      g.wash([[0.12, 0.3], [0.3, 0.18], [0.55, 0.26], [0.62, 0.55], [0.5, 0.82], [0.2, 0.8], [0.08, 0.55]], { color: 'green', alpha: 0.16, w: 20, density: 1.1 });
      // the great four-spoked wheel
      gear(g, 0.36, 0.5, 0.25, 30, { color: 'char', w: 8, alpha: 0.65, spokes: 4, depth: 0.1 });
      // the train
      gear(g, 0.72, 0.32, 0.11, 14, { color: 'char', w: 7, alpha: 0.62, rot: 0.2 });
      gear(g, 0.74, 0.62, 0.085, 11, { color: 'brown', w: 6, alpha: 0.62, rot: 0.5 });
      gear(g, 0.6, 0.84, 0.06, 8, { color: 'char', w: 5, alpha: 0.6 });
      // the Sun
      g.dot(0.85, 0.12, 20, { color: 'yellow', alpha: 0.75 });
      for (let r = 0; r < 12; r++) {
        const a = (r / 12) * Math.PI * 2;
        g.line(0.85 + Math.cos(a) * 0.038, 0.12 + Math.sin(a) * 0.038 * ar, 0.85 + Math.cos(a) * 0.06, 0.12 + Math.sin(a) * 0.06 * ar, { color: 'yellow', w: 4, alpha: 0.6 });
      }
      // the Moon: half pale, half dark
      g.wash(arcPts(0.9, 0.44, 0.04, -Math.PI / 2, Math.PI / 2, ar), { color: 'white', alpha: 0.6, w: 8, density: 2.5 });
      g.wash(arcPts(0.9, 0.44, 0.04, Math.PI / 2, Math.PI * 1.5, ar), { color: 'char', alpha: 0.6, w: 8, density: 2.5 });
      g.circle(0.9, 0.44, 0.042, { color: 'char', w: 5, alpha: 0.6 });
      // pointers from the train to Sun and Moon
      g.stroke([[0.72, 0.32], [0.8, 0.2], [0.84, 0.15]], { color: 'char', w: 4, alpha: 0.45, dry: 0.4 });
      g.stroke([[0.74, 0.62], [0.84, 0.5], [0.875, 0.47]], { color: 'char', w: 4, alpha: 0.45, dry: 0.4 });
      // the eclipse spiral (the Saros dial runs four turns)
      g.stroke(spiralPts(0.13, 0.13, 0.008, 0.09, 4, ar), { color: 'red', w: 5, alpha: 0.6, taper: 0.2 });
      for (const [a, r] of [[0.8, 0.03], [2.6, 0.05], [4.4, 0.07], [5.9, 0.085]]) {
        g.dot(0.13 + Math.cos(a) * r, 0.13 + Math.sin(a) * r * ar, 6, { color: 'char', alpha: 0.7 });
      }
      // pin-and-slot: the Moon's uneven pace
      g.stroke([[0.83, 0.74], [0.93, 0.8]], { color: 'char', w: 9, alpha: 0.5 });
      g.dot(0.87, 0.765, 8, { color: 'red', alpha: 0.75 });
    },
  },

  // ======================================================== THE ENGINE HOUSE
  {
    id: 'jacquard',
    title: 'The Loom That Read',
    date: '1804', who: 'Jacquard, Lyon',
    body: 'A loom reading a chain of punched cards: where there is a hole, the thread lifts. Any figure can be woven, given enough cards. It was a memory a machine could read, a century early, and it was meant for silk.',
    w: 1200, aspect: 1.45, size: [2.8, 1.93], seed: 241,
    draw(g) {
      const ar = g.W / g.H;
      const o = { color: 'char', w: 11, alpha: 0.62 };
      // the frame
      g.stroke([[0.2, 0.93], [0.2, 0.12]], o);
      g.stroke([[0.62, 0.93], [0.62, 0.12]], o);
      g.stroke([[0.16, 0.13], [0.66, 0.12]], o);
      g.stroke([[0.2, 0.5], [0.62, 0.5]], { ...o, w: 7 });
      // warp threads
      for (let i = 0; i < 12; i++) {
        const x = 0.245 + i * 0.03;
        g.line(x, 0.16, x, 0.9, { color: 'char', w: 2.5, alpha: 0.35 });
      }
      // the woven beast, cell by cell
      const mask = [
        '............',
        '.........XX.',
        '..XXXXXXXXX.',
        '.XXXXXXXXXX.',
        'X.XXXXXXXX..',
        '..X.X..X.X..',
        '..X.X..X.X..',
        '............',
      ];
      const cx0 = 0.235, cy0 = 0.54, cw = 0.03, chh = 0.045;
      mask.forEach((row, r) => [...row].forEach((c, k) => {
        const x = cx0 + k * cw, y = cy0 + r * chh;
        if (c === 'X') g.wash([[x, y], [x + cw, y], [x + cw, y + chh], [x, y + chh]], { color: 'red', alpha: 0.6, w: 8, density: 3 , poly: true });
      }));
      // the card chain over the top and down the right side
      const chain = [[0.58, 0.02], [0.68, 0.05], [0.76, 0.12], [0.82, 0.22], [0.85, 0.34], [0.85, 0.46], [0.83, 0.58], [0.8, 0.7], [0.79, 0.82]];
      const cwid = 0.075, chgt = 0.075;
      chain.forEach(([x, y], i) => {
        const holes = [];
        for (let h = 0; h < 7; h++) holes.push([(g.rng() * 6) | 0, (g.rng() * 4) | 0]);
        card(g, x - cwid / 2, y, cwid, chgt, holes, { color: 'brown', w: 5, alpha: 0.62 });
        if (i < chain.length - 1) {
          const [nx, ny] = chain[i + 1];
          g.stroke([[x, y + chgt], [nx, ny]], { color: 'char', w: 3, alpha: 0.45 });
        }
      });
      // the weaver
      stick(g, 0.08, 0.72, 0.2, { color: 'red', w: 8, alpha: 0.65, armL: -0.3, armR: -0.2 });
      g.stroke([[0.145, 0.62], [0.2, 0.6]], { color: 'red', w: 4, alpha: 0.5 });
    },
  },

  {
    id: 'babbage',
    title: 'The Engine of Differences',
    date: '1822–1991', who: 'Babbage’s Difference Engine',
    body: 'Columns of number-wheels that tabulate by addition alone. The dotted columns were never built in his lifetime; in 1991 London finished the engine from his drawings, and it worked. Asked whether wrong figures in yield right answers out, he declined to understand the question.',
    w: 1200, aspect: 1.4, size: [2.8, 2.0], seed: 251,
    draw(g) {
      const ar = g.W / g.H;
      const cols = [0.28, 0.4, 0.52, 0.64, 0.76];
      // frame plates
      g.stroke([[0.2, 0.14], [0.58, 0.13]], { color: 'char', w: 10, alpha: 0.62 });
      g.stroke([[0.2, 0.76], [0.58, 0.77]], { color: 'char', w: 10, alpha: 0.62 });
      g.stroke([[0.58, 0.13], [0.84, 0.14]], { color: 'char', w: 6, alpha: 0.35, dry: 0.75 });
      g.stroke([[0.58, 0.77], [0.84, 0.76]], { color: 'char', w: 6, alpha: 0.35, dry: 0.75 });
      cols.forEach((x, ci) => {
        const ghost = ci >= 3;
        const o = ghost ? { color: 'char', w: 4, alpha: 0.35, dry: 0.75 } : { color: 'char', w: 7, alpha: 0.62 };
        g.line(x, 0.15, x, 0.75, { ...o, w: o.w * 0.8 });
        for (let r = 0; r < 6; r++) {
          const y = 0.21 + r * 0.1;
          g.ring(x, y, 0.045, { ...o, squash: 0.22 });
          if (!ghost) {
            for (let t = 0; t < 3; t++) g.line(x - 0.02 + t * 0.02, y + 0.006, x - 0.02 + t * 0.02, y + 0.024, { color: 'char', w: 2.5, alpha: 0.5 });
            if ((r + ci) % 3 === 0) g.dot(x + 0.03, y + 0.012, 5, { color: 'red', alpha: 0.7 });
          }
        }
      });
      // carry arrows: each column adds into the next
      g.arrow(0.3, 0.47, 0.38, 0.47, { color: 'red', w: 4, alpha: 0.55, head: 10 });
      g.arrow(0.42, 0.57, 0.5, 0.57, { color: 'red', w: 4, alpha: 0.55, head: 10 });
      // the crank and the one who turns it
      g.stroke(arcPts(0.14, 0.2, 0.045, 0, Math.PI * 1.8, ar), { color: 'char', w: 6, alpha: 0.6 });
      g.line(0.14, 0.2, 0.2, 0.2, { color: 'char', w: 7, alpha: 0.6 });
      g.dot(0.14, 0.2 + 0.045 * ar, 9, { color: 'char', alpha: 0.75 });
      stick(g, 0.1, 0.42, 0.2, { color: 'red', w: 8, alpha: 0.68, armL: 2.6, armR: -0.9 });
      // the tables that fall out
      for (let r = 0; r < 3; r++) {
        g.glyphs(0.24, 0.84 + r * 0.05, 9, 0.014, { color: 'char', w: 3, alpha: 0.45, gap: 2.3, kinds: [0, 1, 4, 0, 2, 1, 4, 4, 0] });
      }
    },
  },

  {
    id: 'lovelace',
    title: 'Note G',
    date: '1843', who: 'Ada Lovelace’s notes on the Analytical Engine',
    body: 'A chain of punched cards that becomes, as it crosses the wall, leaves and flowers. In Note G she set out how the Engine would compute the Bernoulli numbers: the first published program, for a machine that did not exist.',
    w: 1150, aspect: 1.35, size: [2.6, 1.93], seed: 261,
    draw(g) {
      const ar = g.W / g.H;
      // the woman: head, body, long skirt
      const x = 0.15, y = 0.5;
      g.circle(x, y - 0.2, 0.03, { color: 'char', w: 7, alpha: 0.68 });
      g.stroke([[x, y - 0.15], [x, y + 0.02]], { color: 'char', w: 8, alpha: 0.65 });
      const skirt = [[x - 0.01, y + 0.0], [x - 0.065, y + 0.3], [x + 0.065, y + 0.3], [x + 0.01, y + 0.0]];
      g.wash(skirt, { color: 'red', alpha: 0.4, w: 12, density: 1.8 });
      g.stroke([...skirt], { color: 'char', w: 7, alpha: 0.6 });
      g.stroke([[x, y - 0.1], [x + 0.06, y - 0.2], [x + 0.08, y - 0.26]], { color: 'char', w: 6, alpha: 0.65 }); // raised arm
      g.stroke([[x, y - 0.1], [x - 0.06, y - 0.02]], { color: 'char', w: 6, alpha: 0.6 });
      // the chain of cards rising from her hand and arching right
      const path = [[0.24, 0.22], [0.32, 0.14], [0.42, 0.1], [0.52, 0.1], [0.62, 0.14], [0.7, 0.2], [0.77, 0.28]];
      path.forEach(([px, py], i) => {
        const t = i / (path.length - 1);
        if (t < 0.6) {
          const holes = [];
          for (let h = 0; h < 5; h++) holes.push([(g.rng() * 6) | 0, (g.rng() * 4) | 0]);
          card(g, px - 0.03, py - 0.03, 0.06, 0.07, holes, { color: 'brown', w: 4, alpha: 0.6 });
        } else {
          // the holes have become leaves
          for (let l = 0; l < 3; l++) {
            const a = -0.8 + l * 0.9;
            const lx = px + Math.cos(a) * 0.03, ly = py + Math.sin(a) * 0.03 * ar;
            g.stroke([[px, py], [lx, ly]], { color: 'char', w: 3, alpha: 0.5 });
            g.wash([[px, py], [lx - 0.012, ly - 0.004], [lx + Math.cos(a) * 0.012, ly + Math.sin(a) * 0.012 * ar], [lx + 0.004, ly + 0.012]], { color: 'yellow', alpha: 0.6, w: 6, density: 2.5 });
          }
        }
        if (i < path.length - 1) g.stroke([[px + 0.02, py], [path[i + 1][0] - 0.02, path[i + 1][1]]], { color: 'char', w: 3, alpha: 0.45 });
      });
      g.stroke([[x + 0.08, y - 0.26], [0.24, 0.22]], { color: 'char', w: 3, alpha: 0.45 });
      // the woven flower
      const fx = 0.78, fy = 0.52;
      g.stroke([[0.77, 0.3], [0.79, 0.42], [fx, fy]], { color: 'char', w: 5, alpha: 0.55 });
      for (let p = 0; p < 7; p++) {
        const a = (p / 7) * Math.PI * 2;
        const px = fx + Math.cos(a) * 0.055, py = fy + Math.sin(a) * 0.055 * ar;
        g.wash(arcPts(px, py, 0.03, 0, Math.PI * 2, ar, 8), { color: p % 2 ? 'red' : 'yellow', alpha: 0.5, w: 9, density: 2.2 });
      }
      g.dot(fx, fy, 14, { color: 'char', alpha: 0.7 });
      g.stroke([[fx, fy + 0.07], [0.77, 0.9]], { color: 'char', w: 6, alpha: 0.55 });
      g.stroke([[0.775, 0.76], [0.84, 0.7]], { color: 'char', w: 4, alpha: 0.5 });
      // the seven notes, A to G; the last one is the program
      for (let n = 0; n < 6; n++) g.glyphs(0.3 + n * 0.055, 0.8, 1, 0.022, { color: 'char', w: 4, alpha: 0.5, kinds: [n % 6] });
      g.stroke(spiralPts(0.67, 0.8, 0.004, 0.04, 2.2, ar), { color: 'red', w: 6, alpha: 0.7, taper: 0.2 });
      g.circle(0.67, 0.8, 0.055, { color: 'red', w: 3.5, alpha: 0.45, dry: 0.5 });
    },
  },

  {
    id: 'boole',
    title: 'The Laws of the Corral',
    date: '1854', who: 'Boole, “An Investigation of the Laws of Thought”',
    body: 'Two corrals overlap. In the lens stands the beast both horned and antlered; outside, one that is neither. Below, the strangest law: x·x = x, a thought repeated adds nothing. Every switch since obeys these fences.',
    w: 1150, aspect: 1.5, size: [2.6, 1.73], seed: 271,
    draw(g) {
      const ar = g.W / g.H;
      // the two corrals, posts and rails
      const corral = (cx, color) => {
        g.stroke(arcPts(cx, 0.44, 0.22, 0, Math.PI * 2, ar * 0.62, 20), { color, w: 8, alpha: 0.6, taper: 0 });
        for (let p = 0; p < 14; p++) {
          const a = (p / 14) * Math.PI * 2;
          const px = cx + Math.cos(a) * 0.22, py = 0.44 + Math.sin(a) * 0.22 * ar * 0.62;
          g.line(px, py - 0.035, px, py + 0.02, { color, w: 5, alpha: 0.5 });
        }
      };
      corral(0.36, 'char');
      corral(0.62, 'red');
      // horned in the left, antlered in the right, both in the lens
      beast(g, 0.24, 0.45, 0.13, { color: 'char', w: 6, horns: true });
      beast(g, 0.75, 0.45, 0.13, { color: 'red', w: 6, antlers: true, flip: true });
      beast(g, 0.49, 0.45, 0.1, { color: 'char', w: 6, horns: true });
      beast(g, 0.49, 0.45, 0.1, { color: 'red', w: 5, antlers: true, tail: false });
      // NEITHER, alone outside
      beast(g, 0.89, 0.13, 0.11, { color: 'brown', w: 5, flip: true, alpha: 0.6 });
      // x · x = x
      const yy = 0.86;
      g.line(0.34, yy - 0.05, 0.34, yy + 0.05, { color: 'char', w: 8, alpha: 0.65 });
      g.dot(0.38, yy, 7, { color: 'char', alpha: 0.7 });
      g.line(0.42, yy - 0.05, 0.42, yy + 0.05, { color: 'char', w: 8, alpha: 0.65 });
      g.line(0.47, yy - 0.012, 0.52, yy - 0.012, { color: 'red', w: 5, alpha: 0.6 });
      g.line(0.47, yy + 0.014, 0.52, yy + 0.014, { color: 'red', w: 5, alpha: 0.6 });
      g.line(0.57, yy - 0.05, 0.57, yy + 0.05, { color: 'char', w: 8, alpha: 0.65 });
    },
  },

  {
    id: 'hollerith',
    title: 'The Census Herd',
    date: '1890', who: 'Hollerith’s tabulator, United States census',
    body: 'A people walks under a lintel of pins and emerges as punched cards. The census of 1880 took nearly a decade by hand; the machines announced the headcount of 1890 in six weeks. The firm became International Business Machines.',
    w: 1300, aspect: 1.9, size: [3.2, 1.68], seed: 281,
    draw(g) {
      const ar = g.W / g.H;
      // the people, walking right
      const folk = [[0.05, 0.7, 0.15], [0.1, 0.75, 0.1], [0.15, 0.7, 0.16], [0.21, 0.76, 0.09], [0.26, 0.7, 0.15], [0.32, 0.72, 0.13]];
      folk.forEach(([x, y, s], i) => stick(g, x, y, s, { color: i % 3 === 1 ? 'red' : 'char', w: 6.5, alpha: 0.62, armL: 2.2, armR: 0.9, legSpread: 0.3 + (i % 2) * 0.12 }));
      // the lintel of pins
      g.stroke([[0.4, 0.93], [0.4, 0.24]], { color: 'char', w: 10, alpha: 0.62 });
      g.stroke([[0.49, 0.93], [0.49, 0.24]], { color: 'char', w: 10, alpha: 0.62 });
      g.stroke([[0.37, 0.25], [0.52, 0.24]], { color: 'char', w: 12, alpha: 0.65 });
      for (let p = 0; p < 7; p++) g.line(0.405 + p * 0.013, 0.27, 0.405 + p * 0.013, 0.36, { color: 'char', w: 3, alpha: 0.55 });
      // cups of mercury
      for (let p = 0; p < 4; p++) g.dot(0.41 + p * 0.022, 0.52, 6, { color: 'white', alpha: 0.7 });
      // cards, fanning out and stacking
      const cards = [[0.54, 0.6], [0.62, 0.54], [0.7, 0.62], [0.78, 0.56], [0.86, 0.64]];
      cards.forEach(([x, y]) => {
        const holes = [];
        for (let h = 0; h < 6; h++) holes.push([(g.rng() * 6) | 0, (g.rng() * 4) | 0]);
        card(g, x, y, 0.07, 0.15, holes, { color: 'brown', w: 5, alpha: 0.62, hole: 'char' });
      });
      for (let s = 0; s < 5; s++) g.line(0.88, 0.9 - s * 0.018, 0.97, 0.9 - s * 0.018, { color: 'brown', w: 4, alpha: 0.5 });
      // the dials above, each with a needle, wired to the pins
      for (let d = 0; d < 5; d++) {
        const x = 0.58 + d * 0.085, y = 0.2;
        g.circle(x, y, 0.028, { color: 'char', w: 5, alpha: 0.6 });
        const a = -1.2 + d * 0.9;
        g.line(x, y, x + Math.cos(a) * 0.022, y + Math.sin(a) * 0.022 * ar, { color: 'red', w: 4, alpha: 0.7 });
        g.stroke([[0.5, 0.26], [x - 0.02, 0.28 + d * 0.01], [x, y + 0.03 * ar]], { color: 'char', w: 2, alpha: 0.3, dry: 0.5 });
      }
    },
  },

  // ============================================== THE HALL (a late addition)
  {
    id: 'colossus',
    title: 'The Sworn Beast',
    date: '1944', who: 'Colossus, Bletchley Park',
    body: 'A beast of glowing glass bottles, reading tape at five thousand characters a second against the German high command’s cipher. After the war its drawings were burned and its keepers kept silent for thirty years. The right half was whitewashed, deliberately.',
    w: 1250, aspect: 1.75, size: [3.0, 1.71], seed: 291,
    draw(g) {
      const ar = g.W / g.H;
      // the tape loop on its bedstead of wheels
      g.circle(0.1, 0.45, 0.04, { color: 'char', w: 7, alpha: 0.62 });
      g.circle(0.33, 0.45, 0.04, { color: 'char', w: 7, alpha: 0.62 });
      const loopTop = [[0.1, 0.45 - 0.05 * ar], [0.22, 0.45 - 0.052 * ar], [0.33, 0.45 - 0.05 * ar]];
      const loopBot = [[0.33, 0.45 + 0.05 * ar], [0.22, 0.45 + 0.052 * ar], [0.1, 0.45 + 0.05 * ar]];
      g.stroke([...loopTop, ...arcPts(0.33, 0.45, 0.05, -Math.PI / 2, Math.PI / 2, ar, 6), ...loopBot, ...arcPts(0.1, 0.45, 0.05, Math.PI / 2, Math.PI * 1.5, ar, 6)], { color: 'brown', w: 6, alpha: 0.6, taper: 0 });
      for (let i = 0; i < 9; i++) g.dot(0.12 + i * 0.024, 0.45 - 0.051 * ar, 4, { color: 'char', alpha: 0.6 });
      // it runs into the beast
      g.arrow(0.36, 0.34, 0.41, 0.34, { color: 'red', w: 5, alpha: 0.6, head: 10 });
      // the beast: a rack of valves
      const o = { color: 'char', w: 10, alpha: 0.62 };
      g.stroke([[0.43, 0.72], [0.43, 0.2], [0.6, 0.15], [0.8, 0.17], [0.84, 0.3]], o);
      g.stroke([[0.43, 0.72], [0.62, 0.74], [0.84, 0.7], [0.84, 0.3]], o);
      g.stroke([[0.84, 0.3], [0.9, 0.26], [0.94, 0.34], [0.9, 0.42], [0.84, 0.42]], { ...o, w: 8 });
      g.stroke([[0.9, 0.26], [0.88, 0.16]], { ...o, w: 6 });
      g.stroke([[0.92, 0.27], [0.96, 0.18]], { ...o, w: 6 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const x = 0.48 + c * 0.058, y = 0.27 + r * 0.115;
        g.dot(x, y, 9, { color: 'yellow', alpha: 0.7 });
        g.stroke([[x - 0.012, y + 0.035], [x - 0.012, y - 0.005], [x, y - 0.03], [x + 0.012, y - 0.005], [x + 0.012, y + 0.035]], { color: 'char', w: 3.5, alpha: 0.5 });
      }
      for (const lx of [0.47, 0.56, 0.72, 0.81]) g.stroke([[lx, 0.73], [lx, 0.92]], { ...o, w: 8 });
      // the oath: kaolin over the right half
      g.wash([[0.6, 0.05], [0.99, 0.08], [0.98, 0.96], [0.64, 0.95], [0.58, 0.6], [0.62, 0.3]], { color: 'white', alpha: 0.2, w: 22, density: 1.0 });
      for (const [sx, sy, sr] of [[0.62, 0.2, 0.06], [0.6, 0.5, 0.07], [0.63, 0.8, 0.06], [0.8, 0.5, 0.12], [0.9, 0.2, 0.08]]) {
        g.spray(sx, sy, sr, { color: 'white', alpha: 0.45, density: 1.2 });
      }
      // the one who will not say
      stick(g, 0.2, 0.78, 0.16, { color: 'red', w: 7, alpha: 0.7, armL: 2.4, armR: -1.3 });
      g.line(0.205, 0.78 - 0.52 * 0.16 * ar - 0.01, 0.205, 0.78 - 0.52 * 0.16 * ar + 0.055, { color: 'char', w: 5, alpha: 0.8 });
    },
  },
];

