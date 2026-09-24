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
    sub: 'PANEL XVIII · yellow ochre, engraved notches, red ochre · c. 20,000 years before the present (the Ishango bone)',
    body: 'The only object in this cave that is genuinely old enough to have been painted here. A baboon fibula with a chip of quartz set in its end, found in 1950 by Jean de Heinzelin at Ishango, on the shore of Lake Edward in the Congo. Its notches run in three columns. One column groups them 11, 13, 17, 19 — every prime between ten and twenty (painted here in red). Another runs 11, 21, 19, 9; the third, 3, 6, 4, 8, 10, 5, 5, 7, doubles and halves. Whether its carver knew about primes, or was keeping track of the moon, or simply liked the feel of cutting, is disputed with some heat. The painters copied it faithfully and declined to take sides.',
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
    sub: 'PANEL XIX · charcoal, red ochre · c. 820 (al-Khwārizmī, House of Wisdom, Baghdad)',
    body: 'A hunter descends a stair of numbered steps, one at a time, and at the bottom the quarry is simply there, caught: that is the whole miracle of a procedure. The first step bears a hollow red ring — the zero, which reached the West in the hunter’s own book on Hindu reckoning, whose Latin title began “Algoritmi de numero Indorum.” The scribes kept his name and lost track of who he was, and so every procedure since is an algorithm. Top right, a broken bone bound back together in red: his other book was on al-jabr, “restoration,” a word that also meant setting bones. Hence algebra, and, in old Spanish, the algebrista who set your arm.',
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
    sub: 'PANEL XX · charcoal, red ochre, one wig · 1703 (Leibniz, “Explication de l’Arithmétique Binaire”)',
    body: 'A figure in an enormous curled wig contemplates stacks of six bars, each bar whole or broken. They are hexagrams from the Chinese Book of Changes, which the Jesuit Joachim Bouvet had sent him from Beijing in their old Fu Xi order; Leibniz read the broken bar as 0 and the whole bar as 1 and found them counting — 0, 1, 2, 3, on up to 63 — in the binary arithmetic he had been working out for years. The letter reached him in April 1703 and he sent his paper to the Paris Académie that same month, delighted. Beneath the first stack is nothing (a hollow ring); beneath the last, a red sun. He had already proposed a medal for it: “omnibus ex nihilo ducendis sufficit unum” — to make everything out of nothing, one is enough.',
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
    sub: 'CEILING PANEL II · charcoal, yellow ochre, the green again · c. 2nd–1st century BC (the Antikythera mechanism)',
    body: 'Painted overhead, where the sky goes. Toothed wheels mesh with toothed wheels; the great four-spoked wheel drives the rest, and from the train come the Sun, the Moon (half pale, half dark, turning to show its phase) and a spiral dial that walks the calendar of eclipses. The original is a shoebox of corroded bronze pulled in 1901 from a Roman-era wreck off the island of Antikythera by sponge divers sheltering from a storm. Some thirty of its gears survive. It modeled the Moon’s uneven pace with a pin riding in a slot, and when X-ray tomography looked inside in 2005 it found thousands of characters of instructions engraved in the bronze. Nothing like it is known for more than a thousand years afterward. The green is the second outbreak of the disputed pigment; the Ministry blames bronze disease, and the pigment blames no one.',
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
    sub: 'PANEL XXI · charcoal, red ochre weave · 1804 (Jacquard, Lyon)',
    body: 'A loom, and draped over it a chain of stiff cards, each punched with holes. Where a card has a hole a hooked needle passes through and its warp thread is lifted; where there is none, the thread stays down; card by card, row by row, the pattern comes out of the loom. The painters wove a beast into the cloth to show what the cards can hold — any figure at all, given enough cards. The most famous product of the method was a silk portrait of Jacquard himself, woven in 1839 from some 24,000 cards; Charles Babbage owned one, and enjoyed asking visitors whether it was an engraving; most guessed wrong. It was a memory that a machine could read, a century before there were machines to read it, and it was meant for silk.',
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
    sub: 'PANEL XXII · charcoal, red ochre, unfinished by design · 1822–1991 (Babbage’s Difference Engine)',
    body: 'Three columns of stacked number-wheels, geared to add each column into the next — which, by the method of differences, is enough to tabulate any polynomial without ever multiplying. A figure turns the crank; tables fall out of the bottom. The columns to the right are drawn in dotted outline only, because they were never made: Babbage proposed the engine in 1822, got a small working section built by 1832, fell out with his engineer, and moved on to the grander Analytical Engine, with its store and its mill and its instructions on Jacquard’s cards, which was never built either. In 1991 the Science Museum in London finished his Difference Engine No. 2 from the drawings. It worked. The painters record his complaint: “On two occasions I have been asked, — ‘Pray, Mr. Babbage, if you put into the machine wrong figures, will the right answers come out?’ … I am not able rightly to apprehend the kind of confusion of ideas that could provoke such a question.”',
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
    sub: 'PANEL XXIII · charcoal, red and yellow ochre · 1843 (Ada Lovelace’s notes on the Analytical Engine)',
    body: 'A woman lifts a chain of punched cards; as the chain crosses the wall its holes turn into leaves and flowers. It illustrates her own sentence: “the Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.” Asked to translate Luigi Menabrea’s paper on Babbage’s engine, Ada, Countess of Lovelace, added seven notes, A to G, about three times the length of the original. The last, Note G, lays out step by step how the engine would compute the Bernoulli numbers — the first published program for a general-purpose computer, for a computer that did not exist. Its table contains one transposed operand, which, the Ministry notes, only proves it is a real program. She also guessed that such an engine might compose music, if music could be put into its symbols, and she was right about that too.',
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
    sub: 'PANEL XXIV · charcoal, red ochre · 1854 (Boole, “An Investigation of the Laws of Thought”)',
    body: 'Two corrals overlap. The horned beasts live in the left; the antlered in the right; and in the lens where the fences cross stands the single animal that is horned AND antlered. Outside both, a lone beast that is NEITHER. Below, the rule that the painters thought the strangest of all: a mark taken twice together is only the mark again — Boole’s x·x = x, thought repeated adds nothing. George Boole, a shoemaker’s son from Lincoln who taught himself mathematics and ended up a professor in Cork, made logic into an algebra of 1 and 0 in 1854. The corrals themselves were added by a later hand, John Venn’s, in 1880. Eighty-three years after the book, a master’s student named Claude Shannon noticed that telephone relays obey exactly these laws, and every switch since has been Boole’s.',
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
    sub: 'PANEL XXV · charcoal, red ochre, brown · 1890 (Hollerith’s tabulator, United States census)',
    body: 'A people walks in from the left — tall and short, adults and children — and passes under a lintel hung with pins. On the other side they come out as cards, each punched with holes where the person was: age, sex, birthplace, and so on. Where a pin found a hole it dipped into a cup of mercury, closed a circuit, and advanced one of the dials above by one. The 1880 census had taken the better part of a decade to count by hand; with Herman Hollerith’s machines the headcount of 1890 was announced within about six weeks. His Tabulating Machine Company merged into a firm that renamed itself, in 1924, International Business Machines. The painters did not know yet what the herd would become; they only drew it growing.',
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
    sub: 'PANEL XXVI · charcoal, yellow ochre, later overpainted in kaolin · 1944 (Colossus, Bletchley Park)',
    body: 'A beast built of glowing glass bottles, fed by a loop of punched tape running endlessly round its wheels. Tommy Flowers, a Post Office engineer, built it at Dollis Hill; from early 1944 it read the tape at five thousand characters a second at Bletchley Park, breaking the German high command’s teleprinter cipher (Tunny, not Enigma — Enigma was the bombes’ quarry). By war’s end there were ten. Then most were broken up, Flowers burned the drawings in a furnace, and everyone who had tended the beast kept their oath for thirty years — which is why the Room-Beast across this hall was long painted as the first of its kind. The white wash was applied deliberately, in antiquity, over the right half. The figure asks you not to mention it.',
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

