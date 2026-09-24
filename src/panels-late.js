// panels-late.js — the newer wings: the Scriptorium (the beasts given words),
// the Sanctuary of Sand (silicon), the Gallery of the Hand (the machine turns
// to face us), the Labyrinth (the net), the Arena (games), the Thaw (the
// learning machines return), and a second intrusion in the Apse.
//
// Same format as paintings.js: normalized strokes through the pigment engine.

import { spiralPts, beast, stick, handPath, box, card, pot, hut, fire, arcPts } from './forms.js';

// a partial beast (for panels that take animals apart): parts is a subset of
// 'head', 'back', 'belly', 'legs', 'tail'
function beastPart(g, cx, cy, s, parts, opts = {}) {
  const { color = 'char', w = 6, alpha = 0.6, flip = false } = opts;
  const ar = g.W / g.H;
  const f = flip ? -1 : 1;
  const pt = (dx, dy) => [cx + dx * s * f, cy + dy * s * ar];
  const o = { color, w, alpha };
  if (parts.includes('head')) {
    g.stroke([pt(0.18, -0.16), pt(0.32, -0.26), pt(0.45, -0.2), pt(0.5, -0.12), pt(0.42, -0.08)], o);
    g.stroke([pt(0.42, -0.24), pt(0.47, -0.38)], { ...o, w: w * 0.7 });
    g.dot(...pt(0.41, -0.18), Math.max(3, s * g.W * 0.03), { color, alpha: alpha + 0.15 });
  }
  if (parts.includes('back')) g.stroke([pt(-0.38, -0.14), pt(-0.05, -0.2), pt(0.18, -0.16)], o);
  if (parts.includes('belly')) g.stroke([pt(0.3, 0.02), pt(0.02, 0.04), pt(-0.28, 0.0)], o);
  if (parts.includes('legs')) {
    for (const [a, b] of [[0.3, 0.32], [0.18, 0.17], [-0.2, -0.24], [-0.33, -0.37]]) {
      g.stroke([pt(a, 0), pt(b, 0.3)], { ...o, w: w * 0.85 });
    }
  }
  if (parts.includes('tail')) g.stroke([pt(-0.38, -0.14), pt(-0.48, -0.02)], { ...o, w: w * 0.7 });
}

// a woman figure: head, torso, triangular skirt
function woman(g, x, y, s, opts = {}) {
  const { color = 'char', skirt = null, crown = false, alpha = 0.65 } = opts;
  const ar = g.W / g.H;
  const P = (dx, dy) => [x + dx * s, y + dy * s * ar];
  g.circle(...P(0, -0.5), s * 0.12, { color, w: 6, alpha });
  g.stroke([P(0, -0.38), P(0, -0.05)], { color, w: 7, alpha });
  const sk = [P(-0.02, -0.08), P(-0.26, 0.5), P(0.26, 0.5), P(0.02, -0.08)];
  if (skirt) g.wash(sk, { color: skirt, alpha: 0.4, w: 10, density: 1.8 });
  g.stroke(sk, { color, w: 6, alpha });
  g.stroke([P(0, -0.3), P(-0.28, -0.05)], { color, w: 5, alpha });
  g.stroke([P(0, -0.3), P(0.28, -0.05)], { color, w: 5, alpha });
  if (crown) g.stroke([P(-0.12, -0.66), P(-0.12, -0.78), P(-0.05, -0.7), P(0, -0.82), P(0.05, -0.7), P(0.12, -0.78), P(0.12, -0.66)], { color: 'yellow', w: 5, alpha: 0.8 });
}

// a crowned stick man
function king(g, x, y, s, opts = {}) {
  const { color = 'char', crown = true, alpha = 0.65 } = opts;
  const ar = g.W / g.H;
  stick(g, x, y, s, { color, w: 7, alpha, armL: 2.4, armR: 0.7 });
  if (crown) {
    const P = (dx, dy) => [x + dx * s, y + dy * s * ar];
    g.stroke([P(-0.12, -0.64), P(-0.12, -0.78), P(-0.05, -0.7), P(0, -0.82), P(0.05, -0.7), P(0.12, -0.78), P(0.12, -0.64)], { color: 'yellow', w: 5, alpha: 0.8 });
  }
}

// parentheses as crescents
function paren(g, cx, cy, r, side, opts) {
  const ar = g.W / g.H;
  const [a0, a1] = side < 0 ? [Math.PI * 0.68, Math.PI * 1.32] : [-Math.PI * 0.32, Math.PI * 0.32];
  g.stroke(arcPts(cx, cy, r, a0, a1, ar, 10), opts);
}

export const LATE_PANELS = [

  // ============================================================ SCRIPTORIUM
  {
    id: 'hopper',
    title: 'The Translator',
    sub: 'PANEL XXVII · charcoal, red ochre · 1952 (Grace Hopper’s A-0, for the UNIVAC)',
    body: 'A figure stands between two kinds of marks. On the left, the marks people make: words, curling out of a mouth. On the right, the marks the beasts eat: strokes and dots, nothing else. The figure takes in the one and puts out the other, and so the beasts were given words. “Nobody believed that I had a running compiler and nobody would touch it,” Grace Hopper recalled. “They told me computers could only do arithmetic.” Her A-0 of 1952 is usually counted the first compiler; her later FLOW-MATIC fed into COBOL, which still pays some of the world’s pensions. Below, the short red wire she handed out at lectures: about thirty centimeters, the distance light travels in a billionth of a second. Asked for a microsecond, she would produce a coil of nearly a thousand feet (bottom right) and suggest that programmers think twice before wasting one.',
    w: 1150, aspect: 1.5, size: [2.6, 1.73], seed: 301,
    draw(g) {
      const ar = g.W / g.H;
      // the translator
      stick(g, 0.5, 0.5, 0.26, { color: 'red', w: 10, alpha: 0.7, armL: 3.0, armR: 0.15, headFill: true });
      // words, from a mouth on the left
      g.circle(0.08, 0.33, 0.035, { color: 'char', w: 7, alpha: 0.6 });
      g.stroke(spiralPts(0.15, 0.3, 0.004, 0.035, 1.8, ar), { color: 'char', w: 5, alpha: 0.6, taper: 0.2 });
      for (let r = 0; r < 3; r++) g.glyphs(0.09, 0.46 + r * 0.08, 6, 0.018, { color: 'char', w: 4, alpha: 0.55, gap: 2.2 });
      g.arrow(0.3, 0.52, 0.39, 0.4, { color: 'char', w: 5, alpha: 0.55, head: 11 });
      // strokes and dots, out on the right
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 8; k++) {
          const x = 0.65 + k * 0.038, y = 0.26 + r * 0.1;
          if ((k * 7 + r * 3) % 5 < 2) g.dot(x, y, 6.5, { color: 'char', alpha: 0.65 });
          else g.line(x, y - 0.03, x, y + 0.03, { color: 'char', w: 5, alpha: 0.6 });
        }
      }
      g.arrow(0.58, 0.4, 0.63, 0.34, { color: 'char', w: 5, alpha: 0.55, head: 11 });
      // the nanosecond: a short red wire with its ends marked
      g.stroke([[0.38, 0.9], [0.5, 0.88], [0.62, 0.9]], { color: 'red', w: 6, alpha: 0.7, wobble: 0.2 });
      g.dot(0.38, 0.9, 8, { color: 'char', alpha: 0.7 });
      g.dot(0.62, 0.9, 8, { color: 'char', alpha: 0.7 });
      // the microsecond: a coil, off to one side
      g.stroke(spiralPts(0.85, 0.86, 0.01, 0.06, 4, ar), { color: 'red', w: 3, alpha: 0.5, taper: 0.1 });
      // the moth, remembered, small in the corner
      g.stroke([[0.05, 0.1], [0.1, 0.07], [0.1, 0.14], [0.05, 0.1], [0.0, 0.07], [0.0, 0.14], [0.05, 0.1]], { color: 'char', w: 3.5, alpha: 0.5 });
      g.stroke([[0.05, 0.06], [0.05, 0.15]], { color: 'char', w: 5, alpha: 0.55 });
      g.stroke([[0.05, 0.06], [0.03, 0.03]], { color: 'char', w: 2, alpha: 0.5 });
      g.stroke([[0.05, 0.06], [0.07, 0.03]], { color: 'char', w: 2, alpha: 0.5 });
    },
  },

  {
    id: 'fortranlisp',
    title: 'The Column and the Nest',
    sub: 'PANEL XXVIII · charcoal, red ochre · 1957–1958 (FORTRAN, Backus et al., IBM; LISP, McCarthy, MIT)',
    body: 'Two tongues, split by a crack in the rock. On the left, the Column: beasts marching in drilled ranks, each rank one line of formula, and a red arrow that sends the column back round to do it again. This is FORTRAN, the formula translator John Backus’s team at IBM delivered in 1957, the first language whose compiled output was fast enough to make the hand-coders give up. On the right, the Nest: a single beast inside brackets inside brackets inside brackets. This is LISP, John McCarthy’s 1958 language of lists, in which a program is written in the same nested shape as its data — the heresy of the Hall’s swallowed instructions, made into grammar. Both are still spoken. The Ministry has counted the closing brackets trailing off to the right and asked the painters to stop.',
    w: 1300, aspect: 1.8, size: [3.1, 1.72], seed: 311,
    draw(g) {
      const ar = g.W / g.H;
      // FORTRAN: drilled ranks
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          beast(g, 0.08 + c * 0.095, 0.2 + r * 0.19, 0.075, { color: r === 0 ? 'red' : 'char', w: 4.5, alpha: 0.62, horns: c === 0 });
        }
      }
      // the DO loop: down the right side and back up to the top
      g.stroke([[0.44, 0.84], [0.47, 0.5], [0.44, 0.14]], { color: 'red', w: 6, alpha: 0.6 });
      g.arrow(0.44, 0.14, 0.4, 0.12, { color: 'red', w: 6, alpha: 0.6, head: 13 });
      // the crack between the tongues
      g.stroke([[0.52, 0.02], [0.5, 0.25], [0.53, 0.45], [0.51, 0.7], [0.54, 0.98]], { color: 'char', w: 3, alpha: 0.45, dry: 0.4 });
      // LISP: the nest
      const cx = 0.72, cy = 0.46;
      beast(g, cx, cy + 0.02, 0.08, { color: 'red', w: 5, alpha: 0.7 });
      for (let k = 1; k <= 4; k++) {
        const r = 0.035 + k * 0.035;
        paren(g, cx, cy, r, -1, { color: 'char', w: 7 - k * 0.6, alpha: 0.62, taper: 0.5 });
        paren(g, cx, cy, r, 1, { color: 'char', w: 7 - k * 0.6, alpha: 0.62, taper: 0.5 });
      }
      // ... and the trailing closers
      for (let k = 0; k < 6; k++) {
        paren(g, 0.87 + k * 0.022, cy, 0.05 - k * 0.004, 1, { color: 'char', w: 4, alpha: 0.5 - k * 0.04, taper: 0.5 });
      }
    },
  },

  {
    id: 'unix',
    title: 'The Hearth of Small Tools',
    sub: 'PANEL XXIX · charcoal, red ochre · 1969–1973 (UNIX and C, Thompson & Ritchie, Bell Labs)',
    body: 'Five small, different animals stand in a line, joined by pipes. A stream of dots enters the first, and each animal does one small thing to it — sorts it, trims it, counts it — and passes it down the pipe to the next. The pipe, added in 1973 at Doug McIlroy’s insistence, is the soul of UNIX, which Ken Thompson and Dennis Ritchie began in 1969 on a little-used PDP-7 at Bell Labs and rewrote, in 1973, in Ritchie’s new language, C (the red crescent). Do one thing, and do it well. Its descendants count every moment from midnight, 1 January 1970, in a number that will overflow at 03:14:07 on 19 January 2038, and the painters left the end of the stream uncarved accordingly.',
    w: 1350, aspect: 2.1, size: [3.3, 1.57], seed: 321,
    draw(g) {
      const ar = g.W / g.H;
      const xs = [0.14, 0.32, 0.5, 0.68, 0.86];
      const y = 0.58;
      // the tools
      beast(g, xs[0], y, 0.1, { color: 'char', w: 6, horns: true });
      beast(g, xs[1], y, 0.09, { color: 'red', w: 6, antlers: true });
      beast(g, xs[2], y, 0.1, { color: 'char', w: 6, tail: false });
      beast(g, xs[3], y, 0.08, { color: 'brown', w: 6, horns: true });
      beast(g, xs[4], y, 0.09, { color: 'char', w: 6, antlers: true });
      // pipes between them, with the stream inside
      for (let i = 0; i < 4; i++) {
        const a = xs[i] + 0.055, b = xs[i + 1] - 0.05;
        g.line(a, y - 0.025, b, y - 0.025, { color: 'char', w: 4, alpha: 0.55 });
        g.line(a, y + 0.035, b, y + 0.035, { color: 'char', w: 4, alpha: 0.55 });
        const n = 4 - i;
        for (let k = 0; k < n; k++) g.dot(a + ((k + 0.5) / n) * (b - a), y + 0.005, 6, { color: 'red', alpha: 0.7 });
      }
      // the stream arriving, and the uncarved end
      g.dots([[0.01, y], [0.03, y + 0.01], [0.05, y - 0.005], [0.07, y + 0.004]], 6, { color: 'red', alpha: 0.6 });
      g.stroke([[0.93, y], [0.99, y + 0.01]], { color: 'char', w: 3, alpha: 0.35, dry: 0.8 });
      // C, in red, over the hearth
      g.stroke(arcPts(0.5, 0.2, 0.07, -Math.PI * 0.25, -Math.PI * 1.75, ar, 16), { color: 'red', w: 13, alpha: 0.68, taper: 0.5 });
      // the little-used machine it was born on, up in the corner
      box(g, 0.05, 0.08, 0.1, 0.16, { color: 'char', w: 5, alpha: 0.5 });
      for (let k = 0; k < 4; k++) g.dot(0.07 + k * 0.02, 0.14, 4, { color: k % 2 ? 'yellow' : 'char', alpha: 0.6 });
      for (let k = 0; k < 4; k++) g.line(0.07 + k * 0.02, 0.18, 0.07 + k * 0.02, 0.21, { color: 'char', w: 3, alpha: 0.5 });
      // the epoch tally along the base
      for (let k = 0; k < 32; k++) {
        const x = 0.05 + k * 0.028;
        if (k % 8 === 0) g.line(x, 0.86, x, 0.94, { color: 'char', w: 4, alpha: 0.55 });
        else g.line(x, 0.88, x, 0.92, { color: 'char', w: 3, alpha: 0.4 });
      }
      g.stroke([[0.94, 0.84], [0.96, 0.9], [0.935, 0.96]], { color: 'red', w: 4, alpha: 0.6 });
    },
  },

  {
    id: 'linux',
    title: 'The Flightless Bird and the Thousand Hands',
    sub: 'PANEL XXX · charcoal, kaolin, yellow ochre, prints in every pigment · 1991 (Linux, Helsinki)',
    body: 'A fat, upright, flightless bird — the painters of the Cosquer cave, near Marseille, drew great auks like this one twenty-odd thousand years ago — surrounded by hand stencils in every color the cave owns. Each hand added a little. On 25 August 1991 a student in Helsinki, Linus Torvalds, announced to a newsgroup that he was “doing a (free) operating system (just a hobby, won’t be big and professional like gnu).” The hands arrived. The bird (who got its portrait in 1996) now runs most of the world’s servers, every one of the five hundred fastest supercomputers, and the phone in a great many pockets. The hobby is going well.',
    w: 950, aspect: 1.05, size: [2.1, 2.0], seed: 331,
    draw(g) {
      const ar = g.W / g.H;
      // hands, positive prints, all round
      const hands = [[0.14, 0.2, -0.4, 'red'], [0.86, 0.22, 0.4, 'yellow'], [0.11, 0.6, -0.9, 'brown'],
                     [0.89, 0.62, 0.9, 'red'], [0.2, 0.9, -0.3, 'yellow'], [0.8, 0.9, 0.3, 'rust'],
                     [0.72, 0.08, 0.2, 'rust'], [0.3, 0.07, -0.25, 'brown']];
      for (const [x, y, rot, c] of hands) {
        const s = 0.12 + g.rng() * 0.03;
        g.spray(x, y, s * 0.75, { color: c, excludePath: handPath(g, x, y + 0.02, s, rot), density: 1.8, alpha: 0.5 });
      }
      // the bird: upright body, dark back, pale belly
      const body = [[0.5, 0.26], [0.6, 0.32], [0.65, 0.5], [0.63, 0.7], [0.56, 0.8], [0.44, 0.8], [0.37, 0.7], [0.35, 0.5], [0.4, 0.32]];
      g.wash(body, { color: 'char', alpha: 0.35, w: 16, density: 1.6 });
      g.wash([[0.5, 0.4], [0.57, 0.48], [0.58, 0.68], [0.5, 0.76], [0.42, 0.68], [0.43, 0.48]], { color: 'white', alpha: 0.75, w: 12, density: 2.8 });
      g.stroke([...body, body[0]], { color: 'char', w: 9, alpha: 0.68 });
      // head and beak
      g.circle(0.5, 0.22, 0.06, { color: 'char', w: 8, alpha: 0.68 });
      g.wash(arcPts(0.5, 0.22, 0.055, 0, Math.PI * 2, ar, 12), { color: 'char', alpha: 0.4, w: 10, density: 2 });
      g.dot(0.48, 0.21, 6, { color: 'white', alpha: 0.9 });
      g.dot(0.53, 0.21, 6, { color: 'white', alpha: 0.9 });
      g.wash([[0.47, 0.26], [0.53, 0.26], [0.5, 0.3]], { color: 'yellow', alpha: 0.8, w: 7, density: 3 });
      // flippers
      g.stroke([[0.37, 0.4], [0.3, 0.55], [0.32, 0.62]], { color: 'char', w: 9, alpha: 0.6 });
      g.stroke([[0.63, 0.4], [0.7, 0.55], [0.68, 0.62]], { color: 'char', w: 9, alpha: 0.6 });
      // feet
      g.wash([[0.4, 0.8], [0.48, 0.8], [0.47, 0.84], [0.38, 0.84]], { color: 'yellow', alpha: 0.75, w: 7, density: 3 });
      g.wash([[0.52, 0.8], [0.6, 0.8], [0.62, 0.84], [0.53, 0.84]], { color: 'yellow', alpha: 0.75, w: 7, density: 3 });
    },
  },

  // ===================================================== SANCTUARY OF SAND
  {
    id: 'transistor',
    title: 'The Gatekeeper on the Stone',
    sub: 'PANEL XXXI · charcoal, brown and yellow ochre, red current · December 1947 (the point-contact transistor, Bell Labs)',
    body: 'A wedge stands on a slab of stone, touching it with two gold-foil feet a hair apart, held down by a bent spring. Into one foot flows a thin red trickle; out of the other pours a red river — the small current commands the large one, and the stone has become a gate that can be opened by a whisper. In December 1947 John Bardeen and Walter Brattain made it from a plastic triangle wrapped in gold foil, slit with a razor blade, and pressed onto germanium with a bent paper clip; their group’s leader, William Shockley, who had not been in the room, went away and improved it in a fury. The three shared a Nobel Prize in 1956. The painters drew them standing well apart, which is accurate.',
    w: 1150, aspect: 1.4, size: [2.5, 1.79], seed: 341,
    draw(g) {
      const ar = g.W / g.H;
      // the slab
      const slab = [[0.3, 0.72], [0.72, 0.7], [0.74, 0.86], [0.28, 0.88]];
      g.wash(slab, { color: 'brown', alpha: 0.3, w: 14, density: 1.7 });
      g.stroke([...slab, slab[0]], { color: 'char', w: 9, alpha: 0.62 });
      // the wedge, point down
      const wedge = [[0.4, 0.34], [0.6, 0.34], [0.5, 0.7]];
      g.wash(wedge, { color: 'yellow', alpha: 0.28, w: 12, density: 1.8 });
      g.stroke([...wedge, wedge[0]], { color: 'char', w: 8, alpha: 0.62 });
      // the gold foil feet
      g.stroke([[0.44, 0.48], [0.487, 0.7]], { color: 'yellow', w: 6, alpha: 0.8 });
      g.stroke([[0.56, 0.48], [0.513, 0.7]], { color: 'yellow', w: 6, alpha: 0.8 });
      // the paper-clip spring
      g.stroke([[0.5, 0.33], [0.47, 0.29], [0.53, 0.25], [0.47, 0.21], [0.53, 0.17], [0.5, 0.12], [0.5, 0.06]], { color: 'char', w: 5, alpha: 0.6, wobble: 0.2 });
      // the trickle in, the river out
      g.stroke([[0.16, 0.52], [0.3, 0.5], [0.44, 0.48]], { color: 'red', w: 3, alpha: 0.7 });
      g.stroke([[0.56, 0.48], [0.7, 0.46], [0.84, 0.44], [0.97, 0.47]], { color: 'red', w: 16, alpha: 0.6 });
      g.arrow(0.9, 0.455, 0.97, 0.47, { color: 'red', w: 7, alpha: 0.6, head: 18 });
      // the base contact under the stone
      g.stroke([[0.5, 0.88], [0.5, 0.97]], { color: 'char', w: 5, alpha: 0.55 });
      // the three, standing well apart
      stick(g, 0.07, 0.8, 0.14, { color: 'char', w: 6, alpha: 0.6, armL: 2.3, armR: 0.6 });
      stick(g, 0.15, 0.8, 0.14, { color: 'char', w: 6, alpha: 0.6, armL: 2.6, armR: 0.3 });
      stick(g, 0.9, 0.8, 0.14, { color: 'red', w: 6, alpha: 0.6, armL: 2.9, armR: 1.4 });
    },
  },

  {
    id: 'ic',
    title: 'Many Beasts in One Stone',
    sub: 'PANEL XXXII · charcoal, brown and yellow ochre · 1958–1959 (the integrated circuit: Kilby, Texas Instruments; Noyce, Fairchild)',
    body: 'Two stones, each holding a whole herd. On the left, the stone of September 1958: a sliver of germanium about half an inch long, its few parts linked by gold wires arching through the air like loose hair. Jack Kilby, too new at Texas Instruments to have earned a summer holiday, worked it out alone in the emptied lab. On the right, the stone of 1959: flat silicon, its parts linked by metal laid down on the surface itself, nothing standing up to break — Robert Noyce’s at Fairchild, built on Jean Hoerni’s planar process. The flat one is the one that multiplied (see the doubling herd on the next wall). Kilby received the Nobel Prize in 2000. Noyce had died in 1990, and the prize is not given to the dead, so the painters gave him the larger stone.',
    w: 1300, aspect: 1.8, size: [3.1, 1.72], seed: 351,
    draw(g) {
      const ar = g.W / g.H;
      // Kilby's: a rough sliver with hair-wires
      const k = [[0.07, 0.56], [0.14, 0.48], [0.34, 0.5], [0.4, 0.58], [0.34, 0.66], [0.12, 0.66]];
      g.wash(k, { color: 'brown', alpha: 0.3, w: 12, density: 1.6 });
      g.stroke([...k, k[0]], { color: 'char', w: 8, alpha: 0.6 });
      const kp = [[0.14, 0.57], [0.21, 0.6], [0.28, 0.56], [0.34, 0.6]];
      kp.forEach(([x, y]) => g.dot(x, y, 10, { color: 'char', alpha: 0.65 }));
      g.stroke([[0.14, 0.56], [0.16, 0.3], [0.2, 0.26], [0.22, 0.4], [0.21, 0.59]], { color: 'yellow', w: 3.5, alpha: 0.75 });
      g.stroke([[0.21, 0.59], [0.25, 0.2], [0.3, 0.18], [0.29, 0.4], [0.28, 0.55]], { color: 'yellow', w: 3.5, alpha: 0.75 });
      g.stroke([[0.28, 0.55], [0.32, 0.36], [0.37, 0.3], [0.36, 0.45], [0.34, 0.59]], { color: 'yellow', w: 3.5, alpha: 0.75 });
      g.stroke([[0.08, 0.6], [0.02, 0.4], [0.05, 0.3]], { color: 'yellow', w: 3.5, alpha: 0.65 });
      // the crack between them
      g.stroke([[0.49, 0.05], [0.5, 0.5], [0.48, 0.95]], { color: 'char', w: 3, alpha: 0.4, dry: 0.5 });
      // Noyce's: flat, square, wired on its face
      const nx0 = 0.56, ny0 = 0.18, nw = 0.38, nh = 0.66;
      g.wash([[nx0, ny0], [nx0 + nw, ny0], [nx0 + nw, ny0 + nh], [nx0, ny0 + nh]], { color: 'yellow', alpha: 0.1, w: 14, density: 1.2 , poly: true });
      box(g, nx0, ny0, nw, nh, { color: 'char', w: 9, alpha: 0.62 });
      const parts = [[0.63, 0.3], [0.75, 0.3], [0.87, 0.3], [0.63, 0.52], [0.75, 0.52], [0.87, 0.52], [0.69, 0.72], [0.81, 0.72]];
      parts.forEach(([x, y], i) => {
        if (i % 3 === 0) g.circle(x, y, 0.016, { color: 'char', w: 5, alpha: 0.65 });
        else if (i % 3 === 1) g.line(x - 0.018, y, x + 0.018, y, { color: 'char', w: 8, alpha: 0.65 });
        else g.dot(x, y, 9, { color: 'red', alpha: 0.7 });
      });
      const wires = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [2, 5], [4, 6], [4, 7], [6, 7]];
      for (const [a, b] of wires) {
        const [x1, y1] = parts[a], [x2, y2] = parts[b];
        g.stroke([[x1, y1], [x1, (y1 + y2) / 2], [x2, (y1 + y2) / 2], [x2, y2]], { color: 'brown', w: 3, alpha: 0.5, wobble: 0.15 });
      }
    },
  },

  {
    id: 'moore',
    title: 'The Doubling',
    sub: 'PANEL XXXIII · charcoal, red ochre · 1965 (Moore, “Cramming more components onto integrated circuits”)',
    body: 'A herd that doubles at every step: one beast, then two, then four, eight, sixteen, thirty-two, each generation smaller so that the same patch of rock can hold it. The red line climbs straight, which on a wall of doublings is the most alarming shape a line can have. Gordon Moore, writing in Electronics in April 1965, guessed that the number of components on a chip would keep doubling every year; in 1975 he slowed it to every two. It was not a law of nature. It was a schedule, and an entire industry kept it for half a century, the way the cave painters kept the solstice. The last column is still being painted; the painters are finding it hard to get the brush small enough.',
    w: 1250, aspect: 1.55, size: [2.9, 1.87], seed: 361,
    draw(g) {
      const ar = g.W / g.H;
      const colX = [0.13, 0.32, 0.46, 0.59, 0.73, 0.88];
      colX.forEach((x, k) => {
        const n = 1 << k;
        const top = 0.14, bot = 0.9, span = bot - top;
        if (k <= 2) {
          const s = [0.2, 0.13, 0.075][k];
          for (let i = 0; i < n; i++) beast(g, x, top + span * (i + 0.5) / n, s, { color: k === 0 ? 'red' : 'char', w: Math.max(3, 9 - k * 2.5), alpha: 0.64, horns: k === 0 });
        } else if (k === 3) {
          for (let i = 0; i < n; i++) {
            const y = top + span * (i + 0.5) / n;
            g.stroke([[x - 0.02, y], [x + 0.02, y - 0.004], [x + 0.032, y - 0.015]], { color: 'char', w: 4, alpha: 0.6 });
            g.line(x - 0.012, y, x - 0.014, y + 0.02, { color: 'char', w: 3, alpha: 0.55 });
            g.line(x + 0.012, y, x + 0.014, y + 0.02, { color: 'char', w: 3, alpha: 0.55 });
          }
        } else {
          const cols = k === 4 ? 2 : 4;
          const rows = n / cols;
          for (let i = 0; i < n; i++) {
            const c = i % cols, r = (i / cols) | 0;
            g.dot(x - 0.03 + (c + 0.5) * (0.06 / cols), top + span * (r + 0.5) / rows, k === 4 ? 6 : 3.5, { color: 'char', alpha: 0.7 });
          }
        }
      });
      // the straight red line of a steady doubling
      g.stroke([[0.04, 0.95], [0.5, 0.52], [0.97, 0.06]], { color: 'red', w: 7, alpha: 0.55, dry: 0.2 });
    },
  },

  {
    id: 'microprocessor',
    title: 'The Whole Beast on a Fingertip',
    sub: 'PANEL XXXIV · red ochre print, charcoal · November 1971 (the Intel 4004)',
    body: 'Behind, faint and huge, the Room-Beast of the Hall, all dials and legs. In front, a hand pressed in red ochre, one finger raised — and on the tip of that finger, painted with the finest brush in the cave, a whole beast, with a belly full of cells like the beast of the swallowed instructions. The 4004, designed by Federico Faggin, Ted Hoff, Stan Mazor and Masatoshi Shima for a Japanese calculator company, Busicom, put an entire central processor onto one chip of some 2,300 transistors. It was roughly as capable as the Room-Beast and would fit on a fingernail. The calculator company, short of money, gave back the rights to sell the chip for anything else in exchange for a discount. The painters regarded this as the single worst trade recorded on any wall of the cave.',
    w: 1100, aspect: 1.3, size: [2.5, 1.92], seed: 371,
    draw(g) {
      const ar = g.W / g.H;
      // the faint Room-Beast behind
      const ghost = { color: 'char', w: 6, alpha: 0.26, dry: 0.5 };
      g.stroke([[0.04, 0.62], [0.05, 0.22], [0.4, 0.14], [0.8, 0.16], [0.96, 0.24], [0.96, 0.6]], ghost);
      g.stroke([[0.04, 0.62], [0.5, 0.66], [0.96, 0.6]], ghost);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) g.circle(0.1 + c * 0.085, 0.26 + r * 0.11, 0.012, { color: 'char', w: 3.5, alpha: 0.22 });
      for (let i = 0; i < 18; i++) g.line(0.07 + i * 0.05, 0.66, 0.07 + i * 0.05, 0.76, { color: 'char', w: 3.5, alpha: 0.2 });
      // the hand, index finger raised: a fist with one finger, printed
      const hp = new Path2D();
      const X = g.X, Y = g.Y;
      hp.ellipse(X(0.52), Y(0.78), g.W * 0.1, g.W * 0.085, 0, 0, 6.29);          // fist
      hp.ellipse(X(0.52), Y(0.95), g.W * 0.065, g.W * 0.08, 0, 0, 6.29);          // wrist
      hp.ellipse(X(0.49), Y(0.56), g.W * 0.03, g.W * 0.12, -0.05, 0, 6.29);       // index finger
      hp.ellipse(X(0.61), Y(0.74), g.W * 0.028, g.W * 0.06, -0.8, 0, 6.29);       // thumb
      for (let k = 0; k < 3; k++) hp.ellipse(X(0.545 + k * 0.032), Y(0.675 + k * 0.012), g.W * 0.022, g.W * 0.03, 0.3, 0, 6.29); // curled fingers
      g.printPath(hp, { color: 'red', alpha: 0.6, w: 8 });
      for (let k = 0; k < 3; k++) g.stroke(arcPts(0.545 + k * 0.032, 0.675 + k * 0.012, 0.02, Math.PI * 1.1, Math.PI * 1.9, ar, 6), { color: 'rust', w: 3, alpha: 0.5 });
      // the beast on the fingertip
      const bx = 0.49, by = 0.34;
      g.circle(bx, by, 0.055, { color: 'char', w: 3, alpha: 0.3, dry: 0.5 });
      beast(g, bx, by, 0.075, { color: 'char', w: 3.5, alpha: 0.8, antlers: true });
      for (let c = 0; c < 3; c++) g.dot(bx - 0.012 + c * 0.012, by - 0.004, 2.5, { color: 'red', alpha: 0.8 });
      // a pointer so the eye finds it
      g.stroke([[0.64, 0.24], [0.56, 0.3]], { color: 'char', w: 3, alpha: 0.45 });
    },
  },

  // ===================================================== GALLERY OF THE HAND
  {
    id: 'sketchpad',
    title: 'The Wand of Light',
    sub: 'PANEL XXXV · charcoal, yellow glow, red ochre · 1963 (Sutherland’s Sketchpad, MIT Lincoln Laboratory)',
    body: 'A figure touches a glowing disc with a wand, and on the disc its trembling line is shown again, made straight. Beside it, one small shape drawn once and repeated three times: change the first, and all its copies change with it. Ivan Sutherland wrote Sketchpad for his doctorate on the TX-2 computer at Lincoln Laboratory in 1962–63, drawing with a light pen directly on the screen; the machine held the drawing as objects that knew their own constraints — this line parallel to that, these two equal — and copies that remembered their master. Every drawing program since has been its grandchild, and a good part of how programs are organized, besides. Before this wall, the beasts only spoke; here, for the first time, one was drawn on.',
    w: 1150, aspect: 1.45, size: [2.6, 1.79], seed: 381,
    draw(g) {
      const ar = g.W / g.H;
      // the screen, glowing
      const sx = 0.62, sy = 0.47, sr = 0.28;
      g.wash(arcPts(sx, sy, sr, 0, Math.PI * 2, ar * 0.9, 20), { color: 'yellow', alpha: 0.12, w: 18, density: 1.1 });
      g.stroke(arcPts(sx, sy, sr, 0, Math.PI * 2, ar * 0.9, 20), { color: 'char', w: 9, alpha: 0.6, taper: 0 });
      // the trembling line, and the same line straightened
      const trem = [];
      for (let i = 0; i <= 10; i++) trem.push([0.44 + i * 0.03, 0.33 + Math.sin(i * 2.1) * 0.02 + i * 0.004]);
      g.stroke(trem, { color: 'char', w: 3.5, alpha: 0.45, dry: 0.4 });
      g.line(0.44, 0.43, 0.74, 0.47, { color: 'red', w: 7, alpha: 0.7, wobble: 0.05 });
      // master and instances: a little flag, four times
      const flag = (x, y, s, color) => {
        g.stroke([[x, y + 0.08 * s], [x, y - 0.08 * s]], { color: 'char', w: 4, alpha: 0.7 });
        const tri = [[x, y - 0.08 * s], [x + 0.06 * s, y - 0.055 * s], [x, y - 0.03 * s]];
        g.wash(tri, { color, alpha: 0.7, w: 5, density: 3 });
        g.stroke([...tri, tri[0]], { color, w: 3, alpha: 0.7 });
      };
      flag(0.5, 0.62, 1.4, 'red');
      g.stroke([[0.54, 0.6], [0.6, 0.6]], { color: 'char', w: 2.5, alpha: 0.45, dry: 0.5 });
      flag(0.63, 0.62, 1.0, 'char');
      flag(0.71, 0.64, 0.8, 'char');
      flag(0.78, 0.6, 1.1, 'char');
      // the figure with the wand
      stick(g, 0.13, 0.55, 0.3, { color: 'char', w: 10, alpha: 0.66, armL: 2.3, armR: -0.35 });
      g.stroke([[0.23, 0.42], [0.34, 0.37], [0.43, 0.34]], { color: 'char', w: 5, alpha: 0.65 });
      g.dot(0.435, 0.335, 9, { color: 'red', alpha: 0.8 });
    },
  },

  {
    id: 'engelbart',
    title: 'The Mouse, and the Mother of All Demos',
    sub: 'PANEL XXXVI · charcoal, red ochre print · 9 December 1968 (Engelbart, SRI, San Francisco)',
    body: 'An actual mouse: body, ears, whiskers, and a long tail that runs up the wall into a glowing window, where it becomes a small red mark that moves wherever the mouse moves. The demonstrators called it the bug, a word this cave has already had occasion to use. On a stage in San Francisco in December 1968, Douglas Engelbart spent ninety minutes showing a thousand people the mouse, linked text you could click through, windows, shared editing, and a live video call to a colleague thirty miles away in Menlo Park — much of what the next fifty years would be sold as. The five-key chord pad on the left caught on less well. The mouse was named for its tail, and Engelbart said later that no one could remember who named it.',
    w: 1250, aspect: 1.7, size: [2.9, 1.71], seed: 391,
    draw(g) {
      const ar = g.W / g.H;
      // the window, with the pointing appendage in it
      box(g, 0.56, 0.08, 0.36, 0.44, { color: 'char', w: 8, alpha: 0.6 });
      g.wash([[0.57, 0.1], [0.91, 0.1], [0.91, 0.5], [0.57, 0.5]], { color: 'yellow', alpha: 0.13, w: 16 , poly: true });
      for (let r = 0; r < 3; r++) g.glyphs(0.6, 0.17 + r * 0.07, 5, 0.014, { color: 'char', w: 3, alpha: 0.4, gap: 2.2 });
      // the bug: a small red mark with legs, where the mouse says
      const bx = 0.8, by = 0.38;
      g.dot(bx, by, 12, { color: 'red', alpha: 0.85 });
      for (const d of [-1, 1]) for (let k = 0; k < 3; k++) {
        g.line(bx + d * 0.008, by - 0.02 + k * 0.02, bx + d * 0.026, by - 0.03 + k * 0.03, { color: 'char', w: 2.5, alpha: 0.6 });
      }
      // the mouse
      const mx = 0.36, my = 0.74;
      const body = arcPts(mx, my, 0.11, Math.PI, Math.PI * 2, ar * 0.7, 12);
      g.wash([...body, [mx + 0.11, my + 0.02], [mx - 0.11, my + 0.02]], { color: 'brown', alpha: 0.3, w: 12, density: 1.8 });
      g.stroke([...body, [mx + 0.13, my + 0.03], [mx - 0.11, my + 0.03], body[0]], { color: 'char', w: 8, alpha: 0.65 });
      g.circle(mx - 0.1, my - 0.1, 0.022, { color: 'char', w: 5, alpha: 0.6 });   // ear
      g.circle(mx - 0.07, my - 0.12, 0.02, { color: 'char', w: 5, alpha: 0.6 });  // ear
      g.dot(mx - 0.1, my - 0.03, 6, { color: 'char', alpha: 0.8 });                 // eye
      for (const d of [-0.02, 0, 0.02]) g.line(mx - 0.13, my + d, mx - 0.19, my + d * 2.2, { color: 'char', w: 2, alpha: 0.5 });
      // the tail becomes the cable
      g.stroke([[mx + 0.13, my + 0.02], [0.55, 0.78], [0.6, 0.7], [0.58, 0.6], [0.66, 0.53]], { color: 'char', w: 4, alpha: 0.6 });
      // the chord keyset, five keys
      for (let k = 0; k < 5; k++) g.line(0.05 + k * 0.028, 0.72 - (k === 2 ? 0.03 : k % 2 ? 0.015 : 0), 0.05 + k * 0.028, 0.84, { color: 'char', w: 9, alpha: 0.55 });
      // two faces, thirty miles apart, joined
      g.circle(0.08, 0.2, 0.04, { color: 'char', w: 6, alpha: 0.6 });
      g.circle(0.4, 0.2, 0.04, { color: 'char', w: 6, alpha: 0.6 });
      g.dots([[0.07, 0.19], [0.09, 0.19], [0.39, 0.19], [0.41, 0.19]], 4, { color: 'char', alpha: 0.7 });
      g.stroke([[0.13, 0.2], [0.18, 0.16], [0.22, 0.24], [0.26, 0.16], [0.3, 0.24], [0.35, 0.2]], { color: 'red', w: 4, alpha: 0.6 });
    },
  },

  {
    id: 'alto',
    title: 'The Window Wall',
    sub: 'PANEL XXXVII · charcoal, yellow ochre, red ochre · 1973 (the Xerox Alto, Palo Alto Research Center)',
    body: 'A tall pale slab the shape of a sheet of paper, and on it windows laid over windows, each with a dark bar across the top; in one of them, a beast drawn in square cells, dot by dot. Below, a mouse with three buttons. The Alto, built at Xerox PARC in 1973, had a screen you could draw on pixel by pixel, a mouse, overlapping windows, a network (Ethernet was invented for it) and a laser printer down the hall. It was never sold as a product. In December 1979 a young man from a small computer company was given a demonstration; the painters show him at the right-hand edge, peering in, with his eye very large. Within five years his company sold a machine that looked like this wall, and everyone else’s did not look like anything else again.',
    w: 1000, aspect: 1.05, size: [2.1, 2.0], seed: 401,
    draw(g) {
      const ar = g.W / g.H;
      // the portrait screen
      const sx = 0.2, sy = 0.06, sw = 0.52, sh = 0.7;
      g.wash([[sx, sy], [sx + sw, sy], [sx + sw, sy + sh], [sx, sy + sh]], { color: 'white', alpha: 0.28, w: 16, density: 1.4 , poly: true });
      box(g, sx, sy, sw, sh, { color: 'char', w: 10, alpha: 0.62 });
      // overlapping windows
      const wins = [[0.25, 0.14, 0.3, 0.26], [0.36, 0.3, 0.3, 0.28], [0.27, 0.5, 0.26, 0.2]];
      wins.forEach(([x, y, w, h], i) => {
        if (i > 0) g.wash([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { color: 'white', alpha: 0.45, w: 10, density: 2.4 , poly: true });
        box(g, x, y, w, h, { color: 'char', w: 5, alpha: 0.62 });
        g.line(x, y + 0.025, x + w, y + 0.025, { color: 'char', w: 11, alpha: 0.6 });
      });
      // the bitmap beast in the middle window
      const mask = ['..........', '.......XX.', '.XXXXXXXX.', 'XXXXXXXX..', '.X.X..X.X.', '.X.X..X.X.'];
      mask.forEach((row, r) => [...row].forEach((c, k) => {
        if (c === 'X') g.dot(0.4 + k * 0.022, 0.38 + r * 0.022 * ar, 5, { color: 'char', alpha: 0.8 });
      }));
      // text lines in the others
      g.glyphs(0.28, 0.23, 7, 0.013, { color: 'char', w: 3, alpha: 0.45, gap: 2.4 });
      g.glyphs(0.3, 0.6, 5, 0.013, { color: 'char', w: 3, alpha: 0.45, gap: 2.4 });
      // the three-button mouse
      const mx = 0.46, my = 0.88;
      g.stroke(arcPts(mx, my, 0.07, Math.PI * 0.95, Math.PI * 2.05, ar * 0.8, 12), { color: 'char', w: 7, alpha: 0.62 });
      g.line(mx - 0.07, my + 0.005, mx + 0.07, my + 0.005, { color: 'char', w: 6, alpha: 0.6 });
      for (let b = 0; b < 3; b++) g.line(mx - 0.04 + b * 0.04, my - 0.04, mx - 0.04 + b * 0.04, my - 0.01, { color: 'red', w: 6, alpha: 0.7 });
      g.stroke([[mx, my - 0.06], [mx + 0.02, 0.8], [0.46, 0.765]], { color: 'char', w: 3, alpha: 0.5 });
      // the visitor, peering in from the right
      g.stroke([[0.9, 0.95], [0.88, 0.62], [0.86, 0.5]], { color: 'char', w: 8, alpha: 0.6 });
      g.circle(0.84, 0.4, 0.07, { color: 'char', w: 7, alpha: 0.62 });
      g.circle(0.8, 0.4, 0.03, { color: 'char', w: 5, alpha: 0.7 });
      g.dot(0.795, 0.4, 11, { color: 'char', alpha: 0.85 });
      g.stroke([[0.86, 0.6], [0.78, 0.55], [0.74, 0.52]], { color: 'char', w: 6, alpha: 0.6 });
    },
  },

  {
    id: 'personal',
    title: 'The Beast Comes Home',
    sub: 'PANEL XXXVIII · charcoal, red and yellow ochre · 1975–1977 (the Altair 8800; the Apple II; the home computer)',
    body: 'A hut, a hearth, a family — and, sitting by the fire as if it had always lived there, a small box-shaped beast with a row of lights along its flank and a row of switches below. For thirty years the beasts had lived in machine rooms and been visited by appointment. In January 1975 a magazine, Popular Electronics, put a kit on its cover, the MITS Altair 8800, programmed by flipping its switches and answering by blinking its lights. Two young men wrote a BASIC for it and founded a company to sell it; a club of hobbyists in Menlo Park met to show off their own; from that club came, in 1977, a machine in a beige case with color graphics that people bought for their kitchens. The children in the painting are not afraid of it. That is the whole point of the painting.',
    w: 1200, aspect: 1.5, size: [2.7, 1.8], seed: 411,
    draw(g) {
      const ar = g.W / g.H;
      // the hut
      g.stroke([[0.06, 0.9], [0.5, 0.08], [0.94, 0.9]], { color: 'char', w: 12, alpha: 0.6 });
      g.stroke([[0.44, 0.06], [0.5, 0.08], [0.57, 0.03]], { color: 'char', w: 8, alpha: 0.55 });
      g.stroke([[0.04, 0.92], [0.96, 0.92]], { color: 'brown', w: 6, alpha: 0.5 });
      // the hearth
      fire(g, 0.34, 0.82, 0.08);
      // the box beast
      const bx = 0.5, by = 0.58, bw = 0.18, bh = 0.17;
      g.wash([[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], { color: 'brown', alpha: 0.25, w: 12 , poly: true });
      box(g, bx, by, bw, bh, { color: 'char', w: 8, alpha: 0.62 });
      for (let k = 0; k < 7; k++) {
        const x = bx + 0.023 + k * 0.022;
        if (k % 3 !== 1) g.dot(x, by + 0.05, 6, { color: 'red', alpha: 0.8 });
        else g.circle(x, by + 0.05, 0.006, { color: 'char', w: 3, alpha: 0.6 });
        g.line(x, by + 0.1, x + (k % 2 ? 0.004 : -0.004), by + 0.14, { color: 'char', w: 3.5, alpha: 0.6 });
      }
      g.stroke([[bx + 0.03, by + bh], [bx + 0.03, by + bh + 0.08]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[bx + bw - 0.03, by + bh], [bx + bw - 0.03, by + bh + 0.08]], { color: 'char', w: 6, alpha: 0.6 });
      g.stroke([[bx + bw, by + 0.02], [bx + bw + 0.04, by - 0.04], [bx + bw + 0.05, by + 0.01]], { color: 'char', w: 6, alpha: 0.6 }); // an ear
      // the family
      stick(g, 0.25, 0.74, 0.19, { color: 'char', w: 7, alpha: 0.6, armL: 2.6, armR: 0.3 });
      stick(g, 0.77, 0.75, 0.17, { color: 'char', w: 7, alpha: 0.6, armL: 2.7, armR: 0.8 });
      stick(g, 0.44, 0.82, 0.1, { color: 'red', w: 6, alpha: 0.7, armL: 3.0, armR: -0.35 });
    },
  },

  // ============================================================ THE LABYRINTH
  {
    id: 'arpanet',
    title: 'LO',
    sub: 'PANEL XXXIX · charcoal, red ochre, a crescent moon · 29 October 1969 (the first ARPANET message, UCLA to SRI)',
    body: 'Two camps, far apart, joined by a trail. A runner sets out from the left camp carrying marks to the right: an L, an O — and then the runner lies down, and the rest of the word is faint dots that never arrived. Late on the evening of 29 October 1969, a student programmer named Charley Kline at UCLA, in Leonard Kleinrock’s lab, tried to log in to a computer at the Stanford Research Institute, some 350 miles away. He typed L, then O, and the receiving system crashed. So the first message ever sent across the network that became the Internet was “LO,” as in lo and behold. They got the whole LOGIN through about an hour later. The painters, who knew a good omen when they saw one, painted only the first attempt.',
    w: 1250, aspect: 1.95, size: [3.1, 1.59], seed: 421,
    draw(g) {
      const ar = g.W / g.H;
      // two camps
      hut(g, 0.07, 0.6, 0.1);
      fire(g, 0.15, 0.72, 0.045);
      hut(g, 0.93, 0.6, 0.1);
      fire(g, 0.85, 0.72, 0.045);
      // the trail
      for (let i = 0; i < 26; i++) {
        const x = 0.19 + i * 0.024;
        g.dot(x, 0.85 + Math.sin(i * 0.9) * 0.012, 3.5, { color: 'char', alpha: 0.4 });
      }
      // L and O, big, carried along
      g.stroke([[0.28, 0.2], [0.28, 0.52], [0.4, 0.52]], { color: 'red', w: 15, alpha: 0.72, taper: 0.2 });
      g.circle(0.5, 0.36, 0.06, { color: 'red', w: 15, alpha: 0.72 });
      // the rest, never arrived: G, I, N as faint dots
      const faint = { color: 'char', alpha: 0.3 };
      for (const [x, y] of [[0.66, 0.26], [0.63, 0.3], [0.62, 0.38], [0.64, 0.45], [0.68, 0.46], [0.7, 0.4], [0.67, 0.4]]) g.dot(x, y, 4, faint);
      for (let k = 0; k < 5; k++) g.dot(0.75, 0.26 + k * 0.05, 4, faint);
      for (const [x, y] of [[0.8, 0.46], [0.8, 0.36], [0.8, 0.26], [0.83, 0.33], [0.86, 0.4], [0.88, 0.46], [0.88, 0.36], [0.88, 0.26]]) g.dot(x, y, 4, faint);
      // the runner, having run, lying down
      stick(g, 0.26, 0.74, 0.14, { color: 'char', w: 7, alpha: 0.66, armL: -2.6, armR: -0.4, tilt: 0.25, legSpread: 0.45 });
      g.stroke([[0.54, 0.8], [0.62, 0.79], [0.66, 0.8]], { color: 'char', w: 8, alpha: 0.65 });
      g.circle(0.51, 0.785, 0.018, { color: 'char', w: 6, alpha: 0.65 });
      g.stroke([[0.58, 0.8], [0.6, 0.74]], { color: 'char', w: 5, alpha: 0.55 });
      g.stroke([[0.66, 0.8], [0.7, 0.83]], { color: 'char', w: 5, alpha: 0.55 });
      // night: a crescent moon
      g.stroke(arcPts(0.1, 0.16, 0.05, -1.9, 1.9, ar, 10), { color: 'yellow', w: 9, alpha: 0.6, taper: 0.9 });
    },
  },

  {
    id: 'packets',
    title: 'The Packet Herd',
    sub: 'PANEL XL · charcoal, red ochre · 1964–1983 (packet switching, Baran and Davies; TCP/IP, Cerf and Kahn)',
    body: 'A beast on the left is taken apart — head, back, belly, legs, tail — and each piece is sent off separately through a maze of trails, each by whatever way is open. On the right the pieces arrive in the wrong order, by different roads, and are put back together into the same beast. Paul Baran at RAND worked out in the early 1960s how to build a network that could lose any part of itself and still deliver; Donald Davies in London, independently, named the pieces packets. Vint Cerf and Bob Kahn wrote down, in 1974, the rules by which any network could hand pieces to any other, and on 1 January 1983 the ARPANET switched over to them all at once. The trail with the X across it is broken; nothing on this wall minds.',
    w: 1300, aspect: 1.6, size: [3.0, 1.88], seed: 431,
    draw(g) {
      const ar = g.W / g.H;
      // whole on the left, red
      beast(g, 0.1, 0.5, 0.15, { color: 'red', w: 7, horns: true, alpha: 0.68 });
      // the net of trails
      const nodes = [[0.28, 0.25], [0.28, 0.75], [0.45, 0.15], [0.45, 0.5], [0.45, 0.85], [0.62, 0.3], [0.62, 0.7], [0.76, 0.5]];
      const links = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6], [4, 6], [5, 7], [6, 7], [2, 3]];
      for (const [a, b] of links) g.line(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], { color: 'char', w: 4, alpha: 0.4, dry: 0.3 });
      nodes.forEach(([x, y]) => g.circle(x, y, 0.014, { color: 'char', w: 5, alpha: 0.6 }));
      g.stroke([[0.18, 0.46], [0.28, 0.25]], { color: 'char', w: 3, alpha: 0.35 });
      g.stroke([[0.18, 0.54], [0.28, 0.75]], { color: 'char', w: 3, alpha: 0.35 });
      g.stroke([[0.76, 0.5], [0.83, 0.5]], { color: 'char', w: 3, alpha: 0.35 });
      // the broken trail
      g.line(0.51, 0.52, 0.56, 0.6, { color: 'red', w: 5, alpha: 0.7 });
      g.line(0.56, 0.52, 0.51, 0.6, { color: 'red', w: 5, alpha: 0.7 });
      // pieces in transit, each on its own road
      beastPart(g, 0.3, 0.13, 0.2, ['head'], { color: 'red', w: 7, alpha: 0.72 });
      beastPart(g, 0.54, 0.24, 0.2, ['back'], { color: 'red', w: 7, alpha: 0.72 });
      beastPart(g, 0.36, 0.58, 0.2, ['belly'], { color: 'red', w: 7, alpha: 0.72 });
      beastPart(g, 0.36, 0.84, 0.2, ['legs'], { color: 'red', w: 7, alpha: 0.72 });
      beastPart(g, 0.7, 0.66, 0.2, ['tail'], { color: 'red', w: 7, alpha: 0.72 });
      // whole again on the right, in charcoal
      beast(g, 0.91, 0.5, 0.15, { color: 'char', w: 7, horns: true, alpha: 0.68 });
    },
  },

  {
    id: 'publickey',
    title: 'The Mixing of the Paints',
    sub: 'PANEL XLI · yellow and red ochre, charcoal, mixed · 1976–1977 (Diffie & Hellman; Rivest, Shamir & Adleman)',
    body: 'The painters’ own trade, turned into a secret. At the top, a pot of yellow that everyone may see. Each of the two painters adds to it a color of their own, told to no one — red on the left, charcoal on the right — and they swap the mixed pots in plain view, across the middle of the wall. Each then adds their own secret color again, to the pot they received, and both arrive at exactly the same brown. The crouching figure below watched every pot change hands and still cannot make that brown, because paint, once mixed, will not unmix. Whitfield Diffie and Martin Hellman published the idea in November 1976; Rivest, Shamir and Adleman made a lock of the same kind the next year. It was later revealed that three British cryptographers had painted this wall first, in secret, at GCHQ in the early 1970s, and been told to keep quiet about it.',
    w: 1150, aspect: 1.45, size: [2.6, 1.79], seed: 441,
    draw(g) {
      // the public yellow
      pot(g, 0.5, 0.12, 0.08, ['yellow']);
      g.arrow(0.45, 0.19, 0.34, 0.33, { color: 'char', w: 3.5, alpha: 0.4, head: 9 });
      g.arrow(0.55, 0.19, 0.66, 0.33, { color: 'char', w: 3.5, alpha: 0.4, head: 9 });
      // the painters and their secret pots
      stick(g, 0.07, 0.55, 0.22, { color: 'char', w: 8, alpha: 0.64, armL: 2.4, armR: 0.2 });
      stick(g, 0.93, 0.55, 0.22, { color: 'char', w: 8, alpha: 0.64, armL: 2.9, armR: 0.8 });
      pot(g, 0.18, 0.3, 0.06, ['red']);
      pot(g, 0.82, 0.3, 0.06, ['char']);
      // mixed: yellow+red, yellow+charcoal
      pot(g, 0.3, 0.44, 0.07, ['yellow', 'red']);
      pot(g, 0.7, 0.44, 0.07, ['yellow', 'char']);
      // the swap, in plain view
      g.arrow(0.36, 0.5, 0.64, 0.74, { color: 'red', w: 5, alpha: 0.6, head: 13 });
      g.arrow(0.64, 0.5, 0.36, 0.74, { color: 'char', w: 5, alpha: 0.6, head: 13 });
      // the same brown, twice
      pot(g, 0.22, 0.8, 0.075, ['yellow', 'char', 'red']);
      pot(g, 0.78, 0.8, 0.075, ['yellow', 'char', 'red']);
      g.dot(0.22, 0.8, 9, { color: 'brown', alpha: 0.7 });
      g.dot(0.78, 0.8, 9, { color: 'brown', alpha: 0.7 });
      // the eavesdropper, crouched, with an empty pot
      stick(g, 0.5, 0.88, 0.1, { color: 'brown', w: 5, alpha: 0.55, armL: 2.4, armR: 0.5, tilt: -0.3, legSpread: 0.5 });
      pot(g, 0.57, 0.9, 0.04, [], { alpha: 0.45 });
    },
  },

  {
    id: 'www',
    title: 'The Web',
    sub: 'CEILING PANEL III · charcoal, kaolin, red ochre thread · 1989–1991 (Berners-Lee, CERN)',
    body: 'Painted overhead, as spiders do. A web of charcoal spokes and rings, and caught at its crossings, pale little pages; one red thread leaps across the web from one page to another far away, which is the whole invention. In March 1989 Tim Berners-Lee, at the particle physics laboratory CERN, handed his boss a proposal for a way to link documents on different computers; his boss, Mike Sendall, wrote on the cover “Vague but exciting…”. The first web site was running at CERN by Christmas 1990 and opened to the world in August 1991; in April 1993 CERN put the whole thing in the public domain, so that nobody would ever own the web. The spider at the center is purely decorative. There is no center. That was also the point.',
    w: 1150, aspect: 1.2, size: [2.7, 2.25], seed: 451, maxD: 6.8,
    draw(g) {
      const ar = g.W / g.H;
      const cx = 0.5, cy = 0.5, spokes = 11;
      const ang = [];
      for (let s = 0; s < spokes; s++) ang.push((s / spokes) * Math.PI * 2 + (g.rng() - 0.5) * 0.2);
      for (const a of ang) g.stroke([[cx, cy], [cx + Math.cos(a) * 0.48, cy + Math.sin(a) * 0.48 * ar]], { color: 'char', w: 5, alpha: 0.62, dry: 0.15 });
      const rings = [0.08, 0.15, 0.23, 0.31, 0.39];
      rings.forEach((r) => {
        const pts = ang.map((a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r * ar]);
        g.stroke([...pts, pts[0]], { color: 'char', w: 3.5, alpha: 0.5, dry: 0.15, taper: 0 });
      });
      // pages caught in the web
      const pages = [];
      ang.forEach((a, i) => {
        const r = rings[(i * 3) % 5 + 0 > 4 ? 4 : (i * 3) % 5];
        if (r < 0.12) return;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * ar;
        pages.push([x, y]);
        g.wash([[x - 0.02, y - 0.03], [x + 0.02, y - 0.03], [x + 0.02, y + 0.03], [x - 0.02, y + 0.03]], { color: 'white', alpha: 0.6, w: 7, density: 2.5 , poly: true });
        box(g, x - 0.022, y - 0.032, 0.044, 0.064, { color: 'char', w: 3.5, alpha: 0.6 });
        g.line(x - 0.012, y - 0.01, x + 0.012, y - 0.01, { color: 'char', w: 2, alpha: 0.5 });
        g.line(x - 0.012, y + 0.008, x + 0.012, y + 0.008, { color: 'char', w: 2, alpha: 0.5 });
      });
      // the link: one red thread across
      if (pages.length > 3) {
        const a = pages[0], b = pages[Math.floor(pages.length / 2)];
        g.stroke([a, [(a[0] + b[0]) / 2 + 0.08, (a[1] + b[1]) / 2 - 0.1], b], { color: 'red', w: 5, alpha: 0.75 });
        g.dot(b[0], b[1], 9, { color: 'red', alpha: 0.7 });
      }
      // the spider
      g.dot(cx, cy, 16, { color: 'char', alpha: 0.85 });
      g.dot(cx, cy - 0.035, 10, { color: 'char', alpha: 0.85 });
      for (let l = 0; l < 4; l++) {
        for (const sgn of [-1, 1]) {
          const a0 = -0.9 + l * 0.55;
          g.stroke([[cx, cy], [cx + sgn * Math.cos(a0) * 0.04, cy + Math.sin(a0) * 0.04 * ar - 0.01], [cx + sgn * Math.cos(a0) * 0.07, cy + Math.sin(a0) * 0.05 * ar + 0.02]], { color: 'char', w: 3, alpha: 0.75 });
        }
      }
    },
  },

  {
    id: 'pagerank',
    title: 'The Trackers’ Rule',
    sub: 'PANEL XLII · charcoal, red ochre · 1998 (Brin & Page, PageRank, Stanford)',
    body: 'Many huts, and trails running between them. A hunter wanders from hut to hut at random, following whatever trail leaves the hut he is in — and now and then, bored, leaps to any hut at all (the dotted arc). Count, over a long enough wandering, where he spends his nights: that is how much each hut matters. The hut in red, with the most trails leading into it from huts that themselves have many, is painted largest. A hut is important if important huts point to it — the circularity is the trick, and it can be solved. Sergey Brin and Larry Page wrote it up at Stanford in 1998; their first search engine had been called BackRub. The trackers took the rule, grew very large, and became the hut that every trail led to.',
    w: 1200, aspect: 1.6, size: [2.8, 1.75], seed: 461,
    draw(g) {
      const huts = [[0.12, 0.3, 0.07], [0.3, 0.16, 0.06], [0.18, 0.72, 0.06], [0.52, 0.52, 0.17], [0.78, 0.2, 0.07], [0.86, 0.66, 0.08], [0.4, 0.86, 0.05], [0.66, 0.88, 0.05]];
      const edges = [[0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [7, 5], [0, 1], [1, 4], [2, 6], [5, 4], [3, 5], [6, 2]];
      for (const [a, b] of edges) {
        const [x1, y1] = huts[a], [x2, y2] = huts[b];
        const t0 = 0.12, t1 = b === 3 ? 0.72 : 0.8;
        g.arrow(x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0, x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, { color: 'char', w: b === 3 ? 5 : 3, alpha: b === 3 ? 0.55 : 0.4, head: b === 3 ? 12 : 9 });
      }
      huts.forEach(([x, y, s], i) => {
        if (i === 3) g.wash([[x - s * 0.45, y + s * 0.5], [x, y - s * 0.55], [x + s * 0.45, y + s * 0.5]], { color: 'red', alpha: 0.35, w: 14, density: 1.6 });
        hut(g, x, y, s, { color: i === 3 ? 'red' : 'char', w: i === 3 ? 11 : 6 });
      });
      // the wandering hunter, and his bored leap
      stick(g, 0.28, 0.5, 0.1, { color: 'brown', w: 5, alpha: 0.65, armL: 2.2, armR: 0.8 });
      const leap = arcPts(0.5, 0.12, 0.34, Math.PI * 0.95, Math.PI * 0.05, 1.6 * 0.5, 16);
      leap.forEach(([x, y], i) => { if (i % 2 === 0) g.dot(x, y + 0.2, 4, { color: 'brown', alpha: 0.5 }); });
    },
  },

  // ================================================================ THE ARENA
  {
    id: 'samuel',
    title: 'The Beast That Played Itself',
    sub: 'PANEL XLIII · charcoal, red ochre, brown wash · 1959 (Samuel’s checkers player, IBM)',
    body: 'A board of dark and light squares. On either side, the same beast — identical, even to the flank marks — plays against itself, while a human stands aside and watches. Arthur Samuel’s draughts program at IBM improved by playing thousands of games against copies of itself and adjusting its judgement of positions by what worked; in 1959 he described it in a paper that did much to fix a new phrase in the language: machine learning. In 1962 it beat a respectable human player. It is said that when the program was shown on television in 1956, IBM’s share price jumped fifteen points overnight. The painters, who kept no shares, recorded only that the human is looking at the beasts, and the beasts are looking at each other.',
    w: 1150, aspect: 1.5, size: [2.6, 1.73], seed: 471,
    draw(g) {
      const ar = g.W / g.H;
      const n = 8, cs = 0.042, bx = 0.5 - (n * cs) / 2, by = 0.12;
      const csy = cs * ar;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if ((r + c) % 2 === 1) {
          const x = bx + c * cs, y = by + r * csy;
          g.wash([[x, y], [x + cs, y], [x + cs, y + csy], [x, y + csy]], { color: 'brown', alpha: 0.45, w: 7, density: 3 , poly: true });
        }
      }
      box(g, bx, by, n * cs, n * csy, { color: 'char', w: 7, alpha: 0.6 });
      // pieces on dark squares
      const pieces = [[0, 1, 'red'], [0, 3, 'red'], [1, 2, 'red'], [2, 5, 'red'], [1, 6, 'red'], [3, 2, 'red'],
                      [7, 0, 'char'], [6, 3, 'char'], [5, 4, 'char'], [7, 4, 'char'], [6, 7, 'char'], [4, 3, 'char']];
      for (const [r, c, col] of pieces) {
        if ((r + c) % 2 === 1) g.dot(bx + (c + 0.5) * cs, by + (r + 0.5) * csy, 11, { color: col, alpha: 0.85 });
      }
      // the beast, twice
      const flank = (x) => { g.dot(x - 0.015, 0.47, 6, { color: 'red', alpha: 0.7 }); g.dot(x + 0.015, 0.47, 6, { color: 'red', alpha: 0.7 }); };
      beast(g, 0.13, 0.5, 0.2, { color: 'char', w: 8, horns: true, alpha: 0.64 });
      flank(0.13);
      beast(g, 0.87, 0.5, 0.2, { color: 'char', w: 8, horns: true, flip: true, alpha: 0.64 });
      flank(0.87);
      // the human, aside
      stick(g, 0.5, 0.82, 0.14, { color: 'red', w: 6, alpha: 0.6, armL: 2.6, armR: 1.2 });
    },
  },

  {
    id: 'pong',
    title: 'The Two Paddles',
    sub: 'PANEL XLIV · charcoal, red ochre, a heap of coins · 1962–1972 (Spacewar!, MIT; Pong, Atari)',
    body: 'A dashed line down the middle; a paddle on either side; a single ball, its path dotted as it glances off the top wall. Any visitor can read this panel, which is why it is here. Pong was built at Atari in 1972 by Allan Alcorn, as a practice exercise his boss Nolan Bushnell gave him; the prototype was installed in Andy Capp’s Tavern in Sunnyvale, and within days it stopped working, because its coin box was jammed full of quarters. Upper left, smaller and older, two ships circle a star and shoot at each other: Spacewar!, written by Steve Russell and friends on a PDP-1 at MIT in 1962, the game that kept the students up all night a decade before anyone thought to charge for it.',
    w: 1150, aspect: 1.6, size: [2.7, 1.69], seed: 481,
    draw(g) {
      const ar = g.W / g.H;
      // the court
      g.line(0.1, 0.22, 0.9, 0.22, { color: 'char', w: 5, alpha: 0.45 });
      g.line(0.1, 0.84, 0.9, 0.84, { color: 'char', w: 5, alpha: 0.45 });
      for (let k = 0; k < 9; k++) g.line(0.5, 0.25 + k * 0.066, 0.5, 0.28 + k * 0.066, { color: 'char', w: 6, alpha: 0.55 });
      // paddles
      g.line(0.16, 0.44, 0.16, 0.62, { color: 'char', w: 16, alpha: 0.7, wobble: 0.1 });
      g.line(0.84, 0.32, 0.84, 0.5, { color: 'char', w: 16, alpha: 0.7, wobble: 0.1 });
      // the ball and its path, bouncing off the top wall
      const path = [[0.18, 0.54], [0.3, 0.42], [0.42, 0.3], [0.52, 0.235], [0.62, 0.3], [0.72, 0.37], [0.8, 0.42]];
      path.slice(0, -1).forEach(([x, y]) => g.dot(x, y, 6.5, { color: 'red', alpha: 0.6 }));
      g.dot(0.8, 0.42, 19, { color: 'red', alpha: 0.9 });
      g.dot(0.8, 0.42, 12, { color: 'red', alpha: 0.9 });
      // the players, holding their paddles like spears
      stick(g, 0.06, 0.6, 0.2, { color: 'char', w: 7, alpha: 0.6, armL: 2.4, armR: -0.2 });
      stick(g, 0.94, 0.5, 0.2, { color: 'char', w: 7, alpha: 0.6, armL: 3.3, armR: 0.8 });
      // the heap of quarters
      for (let k = 0; k < 16; k++) {
        const x = 0.7 + (g.rng() - 0.3) * 0.2, y = 0.92 - Math.abs(x - 0.76) * 0.3 - g.rng() * 0.05;
        g.circle(x, y, 0.011, { color: 'brown', w: 3.5, alpha: 0.6 });
      }
      box(g, 0.6, 0.86, 0.08, 0.1, { color: 'char', w: 5, alpha: 0.55 });
      // Spacewar!: two ships around a star
      g.dot(0.13, 0.1, 9, { color: 'yellow', alpha: 0.8 });
      g.stroke(arcPts(0.13, 0.1, 0.06, 0, Math.PI * 1.6, ar, 12), { color: 'char', w: 2, alpha: 0.35, dry: 0.5 });
      g.stroke([[0.2, 0.07], [0.22, 0.1], [0.2, 0.13], [0.2, 0.07]], { color: 'char', w: 3.5, alpha: 0.65 });
      g.stroke([[0.07, 0.13], [0.04, 0.09]], { color: 'char', w: 4, alpha: 0.65 });
      g.dots([[0.17, 0.1], [0.15, 0.105]], 3, { color: 'red', alpha: 0.6 });
    },
  },

  {
    id: 'deepblue',
    title: 'The Giant and the Champion',
    sub: 'PANEL XLV · charcoal (the painters had no blue) · May 1997 (Deep Blue vs. Kasparov, New York)',
    body: 'A tall, square, many-eyed giant, and before it a single man, and between them a king lying on its side. IBM’s Deep Blue, looking at some two hundred million positions a second, beat the world champion Garry Kasparov by 3½ to 2½ in a six-game rematch in New York in May 1997; he had beaten an earlier version, 4–2, the year before. The last game lasted nineteen moves. Kasparov suspected human help and asked for another match. IBM declined, and took the machine apart. Palaeolithic painters had no blue pigment at all — there is essentially none in any cave — and the Ministry wishes to state that the giant is painted in charcoal under protest.',
    w: 1250, aspect: 1.7, size: [2.9, 1.71], seed: 491,
    draw(g) {
      const ar = g.W / g.H;
      // the giant
      const gx = 0.56, gy = 0.06, gw = 0.3, gh = 0.72;
      g.wash([[gx, gy], [gx + gw, gy], [gx + gw, gy + gh], [gx, gy + gh]], { color: 'char', alpha: 0.24, w: 18, density: 1.4 , poly: true });
      box(g, gx, gy, gw, gh, { color: 'char', w: 12, alpha: 0.66 });
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
        g.dot(gx + 0.04 + c * 0.055, gy + 0.08 + r * 0.09, 5.5, { color: (r * 5 + c) % 7 === 3 ? 'red' : 'white', alpha: 0.75 });
      }
      g.stroke([[gx + 0.06, gy + gh], [gx + 0.06, 0.93]], { color: 'char', w: 12, alpha: 0.64 });
      g.stroke([[gx + gw - 0.06, gy + gh], [gx + gw - 0.06, 0.93]], { color: 'char', w: 12, alpha: 0.64 });
      // the man
      stick(g, 0.14, 0.62, 0.3, { color: 'red', w: 9, alpha: 0.66, armL: 2.7, armR: 1.5, headFill: true });
      // the fallen king, between them: base to the left, cross to the right
      const kx = 0.28, ky = 0.84, L = 0.2;
      const K = (u, v) => [kx + u * L, ky + v * L * ar];
      const half = [[0, 0.2], [0.1, 0.17], [0.18, 0.08], [0.6, 0.07], [0.66, 0.15], [0.74, 0.1], [0.8, 0.04]];
      const outline = [...half.map(([u, v]) => K(u, v)), ...half.slice().reverse().map(([u, v]) => K(u, -v))];
      g.wash(outline, { color: 'char', alpha: 0.4, w: 9, density: 2 });
      g.stroke([...outline, outline[0]], { color: 'char', w: 6, alpha: 0.66 });
      g.stroke([K(0.8, 0), K(1.0, 0)], { color: 'char', w: 7, alpha: 0.66 });
      g.stroke([K(0.9, -0.09), K(0.9, 0.09)], { color: 'char', w: 7, alpha: 0.66 });
      // a strip of the board
      for (let k = 0; k < 12; k++) {
        const x = 0.06 + k * 0.074;
        if (k % 2) g.wash([[x, 0.94], [x + 0.074, 0.94], [x + 0.074, 0.99], [x, 0.99]], { color: 'brown', alpha: 0.4, w: 8, density: 2.5 , poly: true });
      }
    },
  },

  {
    id: 'alphago',
    title: 'Move 37',
    sub: 'PANEL XLVI · charcoal and kaolin stones, one red stone · March 2016 (AlphaGo vs. Lee Sedol, Seoul)',
    body: 'A board of crossing lines, stones of charcoal and stones of kaolin, and one stone in red, placed high on the fifth line where no stone had any business being. In the second game of five, DeepMind’s AlphaGo played this shoulder hit — move 37 — and the commentators assumed it had blundered; its own estimate was that a human would play it perhaps one time in ten thousand. It won that game, and the match, four games to one. The small red ring is Lee Sedol’s move 78 in the fourth game, a wedge nobody expected either, which won the only game a human took. Three years later he retired, saying of the machines that they “cannot be defeated.” The painters, who could not be defeated either but never had to prove it, painted both stones red.',
    w: 1000, aspect: 1.05, size: [2.2, 2.1], seed: 501,
    draw(g) {
      const ar = g.W / g.H;
      const n = 11, x0 = 0.1, y0 = 0.08, span = 0.7, st = span / (n - 1), sty = st * ar;
      for (let i = 0; i < n; i++) {
        g.line(x0, y0 + i * sty, x0 + span, y0 + i * sty, { color: 'char', w: 3.5, alpha: 0.5, wobble: 0.2 });
        g.line(x0 + i * st, y0, x0 + i * st, y0 + (n - 1) * sty, { color: 'char', w: 3.5, alpha: 0.5, wobble: 0.2 });
      }
      const P = (c, r) => [x0 + c * st, y0 + r * sty];
      const black = [[2, 3], [3, 7], [7, 7], [8, 3], [6, 8], [3, 3], [7, 2], [2, 6], [5, 7], [8, 5]];
      const white = [[7, 3], [3, 2], [8, 7], [2, 8], [6, 2], [4, 8], [8, 2], [7, 6], [2, 4], [6, 6]];
      for (const [c, r] of black) { g.dot(...P(c, r), 15, { color: 'char', alpha: 0.95 }); g.dot(...P(c, r), 10, { color: 'char', alpha: 0.95 }); }
      for (const [c, r] of white) {
        g.dot(...P(c, r), 15, { color: 'white', alpha: 0.95 });
        g.circle(...P(c, r), 0.021, { color: 'char', w: 3, alpha: 0.45 });
      }
      // move 37: high, on the fifth line
      g.dot(...P(9, 4), 17, { color: 'red', alpha: 0.9 });
      g.circle(...P(9, 4), 0.045, { color: 'red', w: 4, alpha: 0.5, dry: 0.4 });
      // move 78: the wedge, a small red ring
      g.circle(...P(4, 6), 0.02, { color: 'red', w: 6, alpha: 0.8 });
      // the player, seated, bottom left; the searching tree, top right
      stick(g, 0.1, 0.9, 0.14, { color: 'char', w: 6, alpha: 0.6, armL: 2.2, armR: 0.2, legSpread: 0.55 });
      const tree = (x, y, a, len, d) => {
        if (d === 0) return;
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len * ar;
        g.stroke([[x, y], [x2, y2]], { color: 'char', w: 1.5 + d, alpha: 0.5 });
        tree(x2, y2, a - 0.45, len * 0.7, d - 1);
        tree(x2, y2, a + 0.45, len * 0.7, d - 1);
      };
      tree(0.9, 0.98, -Math.PI / 2, 0.1, 5);
    },
  },

  // ================================================================ THE THAW
  {
    id: 'winter',
    title: 'The Long Winter',
    sub: 'PANEL XLVII · kaolin, charcoal, a small fire in red · 1973–c. 2006 (the AI winters)',
    body: 'Icicles hang from the top of the panel and snow falls across it. Frozen in a block of ice, on the left, is the disc-headed figure from the Shaft above. In the middle, three figures crouch around a very small fire and keep it going. After the Perceptron fell, and after Sir James Lighthill’s 1973 report told the British government that artificial intelligence had not delivered on its promises, the money froze; it froze again in the late 1980s, when the market for the specialized machines of the time collapsed. Through the cold a handful of people kept feeding neural networks — in Toronto, in Montreal, at Bell Labs, where one of them taught a network to read the handwritten numbers on cheques. In 2018 Geoffrey Hinton, Yoshua Bengio and Yann LeCun shared the Turing Award for not letting the fire go out.',
    w: 1300, aspect: 1.85, size: [3.1, 1.68], seed: 511,
    draw(g) {
      const ar = g.W / g.H;
      // icicles
      for (let k = 0; k < 22; k++) {
        const x = 0.02 + k * 0.045 + (g.rng() - 0.5) * 0.01;
        const len = 0.06 + g.rng() * 0.16;
        g.stroke([[x - 0.01, 0.0], [x, len * 0.6], [x + 0.002, len]], { color: 'white', w: 9, alpha: 0.7, taper: 1 });
      }
      // drifts, finger-fluted through the moonmilk
      g.flute([[0.3, 0.97], [0.5, 0.92], [0.74, 0.95], [0.99, 0.9]], { fingers: 4, gap: 9, color: 'white', w: 5, alpha: 0.5 });
      g.flute([[0.74, 0.3], [0.86, 0.26], [0.99, 0.3]], { fingers: 3, gap: 8, color: 'white', w: 4, alpha: 0.4 });
      // snow
      for (let k = 0; k < 90; k++) g.dot(g.rng(), 0.2 + g.rng() * 0.75, 3 + g.rng() * 3, { color: 'white', alpha: 0.6 });
      // the ice block, with the disc-headed figure frozen inside
      const ib = [[0.05, 0.36], [0.27, 0.34], [0.28, 0.9], [0.06, 0.92]];
      g.wash(ib, { color: 'white', alpha: 0.35, w: 18, density: 1.5 });
      g.stroke([...ib, ib[0]], { color: 'white', w: 6, alpha: 0.7 });
      g.circle(0.16, 0.47, 0.035, { color: 'char', w: 6, alpha: 0.5 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.dot(0.16 + (c - 1) * 0.016, 0.47 + (r - 1) * 0.016 * ar, 3, { color: 'red', alpha: 0.4 });
      g.stroke([[0.16, 0.53], [0.16, 0.72]], { color: 'char', w: 6, alpha: 0.45 });
      g.stroke([[0.16, 0.72], [0.12, 0.86]], { color: 'char', w: 6, alpha: 0.45 });
      g.stroke([[0.16, 0.72], [0.2, 0.86]], { color: 'char', w: 6, alpha: 0.45 });
      g.stroke([[0.16, 0.58], [0.1, 0.66]], { color: 'char', w: 5, alpha: 0.45 });
      g.stroke([[0.16, 0.58], [0.22, 0.66]], { color: 'char', w: 5, alpha: 0.45 });
      // the three around the small fire
      fire(g, 0.58, 0.8, 0.06);
      stick(g, 0.47, 0.76, 0.15, { color: 'char', w: 7, alpha: 0.65, armL: 0.6, armR: 0.3, tilt: 0.35, legSpread: 0.5 });
      stick(g, 0.58, 0.64, 0.13, { color: 'char', w: 7, alpha: 0.65, armL: 1.9, armR: 1.2, legSpread: 0.25 });
      stick(g, 0.69, 0.76, 0.15, { color: 'char', w: 7, alpha: 0.65, armL: 2.8, armR: 2.5, tilt: -0.35, legSpread: 0.5 });
      g.wash(arcPts(0.58, 0.8, 0.07, 0, Math.PI * 2, ar, 12), { color: 'yellow', alpha: 0.12, w: 14 });
      // the cheque-reading net, drawn as a little numeral being read
      g.stroke([[0.84, 0.5], [0.88, 0.46], [0.9, 0.52], [0.84, 0.62], [0.91, 0.62]], { color: 'char', w: 6, alpha: 0.6 });
      g.arrow(0.8, 0.56, 0.76, 0.66, { color: 'char', w: 3, alpha: 0.4, head: 9 });
    },
  },

  {
    id: 'lstm',
    title: 'The Serpent That Remembers',
    sub: 'PANEL XLVIII · charcoal, red ochre · 1997 (Hochreiter & Schmidhuber, long short-term memory)',
    body: 'The chain-serpent of the Gallery returns, but now a straight belt runs above it the whole length of its body, and a single red token rides the belt from the tail to the head untouched. At every link three small gates decide: whether to let a new thing onto the belt, whether to let an old thing fall off, and whether to let the head see what the belt is carrying. Older serpents forgot everything but their last few links; the sense of what they had seen long ago faded to nothing as it was passed back. Sepp Hochreiter, who had diagnosed the fading in his 1991 diploma thesis, and Jürgen Schmidhuber published this cure in 1997 (the forgetting gate was added in 1999 by Felix Gers). For the next twenty years this serpent did the listening and translating for a great many telephones.',
    w: 1350, aspect: 2.05, size: [3.3, 1.61], seed: 521,
    draw(g) {
      const ar = g.W / g.H;
      // the belt
      g.stroke([[0.04, 0.24], [0.5, 0.235], [0.96, 0.24]], { color: 'char', w: 12, alpha: 0.64, wobble: 0.1, taper: 0.1 });
      // the red token, riding the whole way (ghosts of where it has been)
      for (let k = 0; k < 6; k++) g.dot(0.07 + k * 0.03, 0.24, 7 - k * 0.6, { color: 'red', alpha: 0.2 + k * 0.05 });
      g.dot(0.9, 0.24, 15, { color: 'red', alpha: 0.9 });
      g.dot(0.08, 0.24, 11, { color: 'red', alpha: 0.6 });
      // the serpent: links below, each tied to the belt by gates
      const links = [0.14, 0.3, 0.46, 0.62, 0.78];
      links.forEach((x, i) => {
        const y = 0.62 + Math.sin(i * 1.3) * 0.05;
        g.circle(x, y, 0.035, { color: 'char', w: 8, alpha: 0.64 });
        if (i % 2 === 0) g.dot(x, y, 10, { color: 'red', alpha: 0.55 });
        if (i < links.length - 1) g.stroke([[x + 0.035, y], [links[i + 1] - 0.035, 0.62 + Math.sin((i + 1) * 1.3) * 0.05]], { color: 'char', w: 7, alpha: 0.55 });
        // three gates: in, forget, out
        for (let k = 0; k < 3; k++) {
          const gx = x - 0.03 + k * 0.03;
          g.line(gx, 0.27, gx, y - 0.075, { color: 'char', w: 3, alpha: 0.45 });
          const open = (i + k) % 3 !== 0;
          if (open) g.line(gx - 0.012, 0.36 + k * 0.03, gx + 0.012, 0.345 + k * 0.03, { color: 'char', w: 5, alpha: 0.65 });
          else g.line(gx - 0.012, 0.35 + k * 0.03, gx + 0.012, 0.35 + k * 0.03, { color: 'red', w: 6, alpha: 0.7 });
        }
      });
      // the head, turned up to read the belt
      const hx = 0.86, hy = 0.6;
      g.stroke([[0.815, 0.62], [hx, hy], [hx + 0.04, hy - 0.08], [hx + 0.02, hy - 0.15], [hx - 0.02, hy - 0.12], [hx, hy]], { color: 'char', w: 10, alpha: 0.62 });
      g.dot(hx + 0.015, hy - 0.1, 8, { color: 'red', alpha: 0.75 });
      g.stroke([[hx + 0.01, hy - 0.16], [0.89, 0.29]], { color: 'red', w: 3.5, alpha: 0.55 });
      // tail
      g.stroke([[0.105, 0.63], [0.06, 0.7], [0.03, 0.66]], { color: 'char', w: 7, alpha: 0.6 });
    },
  },

  {
    id: 'alexnet',
    title: 'The Naming of the Ten Thousand Beasts',
    sub: 'PANEL XLIX · every pigment, charcoal funnel, two small fires · 2009–2012 (ImageNet; AlexNet)',
    body: 'On the left, a wall of animals, row on row, each with its name-mark beneath it — a sample of the fourteen million pictures that Fei-Fei Li and her colleagues had people label, by hand, over the Internet, into more than twenty thousand kinds (ImageNet, 2009). In the middle, a funnel of stacked layers; a beast goes in at the wide end and its name comes out at the narrow one. Beneath the funnel, two small fires. In the ImageNet contest of 2012, a network of this shape built by Alex Krizhevsky, Ilya Sutskever and Geoffrey Hinton cut the error rate from about 26 percent to about 15, and it was trained on two graphics cards bought for video games, in a bedroom. The fire in the Thaw was not small after that.',
    w: 1350, aspect: 1.8, size: [3.2, 1.78], seed: 531,
    draw(g) {
      const ar = g.W / g.H;
      // the wall of labelled beasts
      const cols = ['char', 'red', 'brown', 'yellow', 'rust'];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const x = 0.05 + c * 0.075, y = 0.12 + r * 0.17;
        beast(g, x, y, 0.055, { color: cols[(r + c * 2) % 5], w: 3.5, alpha: 0.7, horns: (r + c) % 3 === 0, antlers: (r * c) % 4 === 1, flip: (r + c) % 2 === 1 });
        g.glyphs(x - 0.012, y + 0.06, 2, 0.008, { color: 'char', w: 2.5, alpha: 0.5, gap: 2.2 });
      }
      // one beast goes in
      beast(g, 0.46, 0.5, 0.08, { color: 'red', w: 5, antlers: true, alpha: 0.75 });
      g.arrow(0.5, 0.5, 0.535, 0.5, { color: 'char', w: 4, alpha: 0.5, head: 9 });
      // the funnel of layers
      const layers = [[0.56, 0.36], [0.63, 0.28], [0.69, 0.2], [0.74, 0.13], [0.785, 0.07], [0.82, 0.035]];
      layers.forEach(([x, h], i) => {
        const skew = 0.02;
        g.stroke([[x, 0.5 - h], [x + skew, 0.5 - h - 0.02], [x + skew, 0.5 + h - 0.02], [x, 0.5 + h], [x, 0.5 - h]], { color: 'char', w: 5, alpha: 0.6, taper: 0 });
        if (i < layers.length - 1) {
          const [nx, nh] = layers[i + 1];
          g.line(x + skew, 0.5 - h - 0.02, nx, 0.5 - nh, { color: 'char', w: 2, alpha: 0.35 });
          g.line(x + skew, 0.5 + h - 0.02, nx, 0.5 + nh, { color: 'char', w: 2, alpha: 0.35 });
        }
      });
      // the name comes out
      g.arrow(0.85, 0.5, 0.89, 0.5, { color: 'char', w: 4, alpha: 0.5, head: 9 });
      g.glyphs(0.915, 0.5, 2, 0.02, { color: 'red', w: 6, alpha: 0.8, gap: 1.6, kinds: [3, 4] });
      g.circle(0.93, 0.5, 0.04, { color: 'red', w: 4, alpha: 0.55 });
      // two small fires under the funnel
      fire(g, 0.63, 0.92, 0.035);
      fire(g, 0.72, 0.92, 0.035);
    },
  },

  {
    id: 'word2vec',
    title: 'King − Man + Woman',
    sub: 'PANEL L · charcoal, red and yellow ochre · 2013 (Mikolov et al., word2vec)',
    body: 'Four figures at the corners of a leaning square: a man, a crowned man, a woman, a crowned woman. The red arrow that carries the man to his crown is the same arrow, same length, same slant, that carries the woman to hers. Around them, a cloud of dots: every other word, each placed by the company it keeps. Tomas Mikolov and colleagues at Google trained such maps, in 2013, from billions of words of text, a few hundred dimensions deep — the painters drew only two; the rest go on into the rock — and found that meaning had a geometry: king − man + woman lands nearest to queen. (The demonstration quietly excludes the words you started with; without that rule, the nearest point is usually still king.) “You shall know a word by the company it keeps,” the linguist J. R. Firth had written in 1957. It took the beasts fifty-six years to take him literally.',
    w: 1150, aspect: 1.4, size: [2.6, 1.86], seed: 541,
    draw(g) {
      const ar = g.W / g.H;
      // the cloud of other words
      for (let k = 0; k < 70; k++) {
        const x = 0.05 + g.rng() * 0.9, y = 0.06 + g.rng() * 0.88;
        g.dot(x, y, 3 + g.rng() * 3, { color: g.rng() < 0.2 ? 'brown' : 'char', alpha: 0.3 });
      }
      // the four
      const man = [0.2, 0.78], kingP = [0.36, 0.34], wom = [0.62, 0.78], queen = [0.78, 0.34];
      king(g, man[0], man[1], 0.2, { crown: false });
      king(g, kingP[0], kingP[1], 0.2, { crown: true });
      woman(g, wom[0], wom[1], 0.2, { skirt: 'red' });
      woman(g, queen[0], queen[1], 0.2, { skirt: 'red', crown: true });
      // the same red arrow, twice
      g.arrow(man[0] + 0.04, man[1] - 0.12, kingP[0] + 0.02, kingP[1] + 0.12, { color: 'red', w: 6, alpha: 0.7, head: 15 });
      g.arrow(wom[0] + 0.04, wom[1] - 0.12, queen[0] + 0.02, queen[1] + 0.12, { color: 'red', w: 6, alpha: 0.7, head: 15 });
      // and the same charcoal arrow, twice
      g.arrow(man[0] + 0.07, man[1] + 0.08, wom[0] - 0.07, wom[1] + 0.08, { color: 'char', w: 4, alpha: 0.45, head: 11, dry: 0.4 });
      g.arrow(kingP[0] + 0.07, kingP[1] + 0.08, queen[0] - 0.07, queen[1] + 0.08, { color: 'char', w: 4, alpha: 0.45, head: 11, dry: 0.4 });
    },
  },

  // ================================================================ THE APSE
  {
    id: 'gpt',
    title: 'The Intrusion, Continued',
    sub: 'APSE PANEL II · charcoal only, unweathered · 2018–2020 (GPT, GPT-2, GPT-3) · CATALOGING DISPUTED',
    body: 'A second fresh panel, by the same modern hand as the first. It is the Three-Headed Guesser of the Gallery, grown: not three necks but dozens, fanned out, every head looking back along the trail at a different distance, and the next mark, as before, in red. Above, the same beast drawn three times, each larger than the last. The first GPT (2018) had about a hundred and seventeen million sinews; GPT-2 (2019), a billion and a half, and was at first withheld as too dangerous to release, then released in stages; GPT-3 (2020), a hundred and seventy-five billion. Each only ever guessed the next mark. A beast of enough heads, the Gallery painters wrote, would speak. At the end of 2022 it was taught to answer back, and the queue at the cave entrance has not been short since. The Ministry cannot rule out that this plaque was written by one of them.',
    w: 1150, aspect: 1.5, size: [2.4, 1.6], seed: 551, fresh: true,
    draw(g) {
      const ar = g.W / g.H;
      const sharp = { color: 'char', wobble: 0.35, dry: 0.15 };
      // three generations, growing
      beast(g, 0.1, 0.14, 0.06, { ...sharp, w: 3, alpha: 0.55 });
      beast(g, 0.22, 0.14, 0.11, { ...sharp, w: 4, alpha: 0.6 });
      beast(g, 0.4, 0.15, 0.2, { ...sharp, w: 5, alpha: 0.6 });
      // the trail of marks
      const trail = [];
      for (let i = 0; i < 16; i++) trail.push([0.05 + i * 0.058, 0.9]);
      trail.forEach(([x, y], i) => {
        if (i < 12) g.glyphs(x, y, 1, 0.016, { ...sharp, w: 4, alpha: 0.6, kinds: [(i * 5) % 6] });
        else if (i === 12) { g.circle(x, y, 0.02, { ...sharp, w: 4, alpha: 0.5 }); g.line(x, y - 0.03, x, y + 0.03, { color: 'red', w: 6, alpha: 0.75 }); }
        else g.dot(x, y, 3, { color: 'char', alpha: 0.3 });
      });
      // the body, and the many necks
      g.stroke([[0.46, 0.56], [0.6, 0.5], [0.76, 0.54]], { ...sharp, w: 8, alpha: 0.62 });
      g.stroke([[0.76, 0.54], [0.74, 0.64], [0.56, 0.67], [0.46, 0.56]], { ...sharp, w: 8, alpha: 0.62 });
      const base = [0.62, 0.52];
      for (let k = 0; k < 18; k++) {
        const t = k / 17;
        const tgt = trail[Math.min(11, Math.round(t * 11))];
        const a = -Math.PI * (0.95 - t * 0.9);
        const head = [base[0] + Math.cos(a) * 0.2, base[1] + Math.sin(a) * 0.2 * ar * 0.9];
        g.stroke([base, [(base[0] + head[0]) / 2, (base[1] + head[1]) / 2 - 0.03], head], { ...sharp, w: 2.5, alpha: 0.45 });
        g.dot(head[0], head[1], 4, { color: 'char', alpha: 0.7 });
        if (k % 3 === 0) g.stroke([head, [tgt[0], tgt[1] - 0.05]], { color: 'char', w: 1.2, alpha: 0.18, dry: 0.7 });
      }
      // legs: guide dots only, unfinished
      for (const x of [0.5, 0.56, 0.68, 0.73]) for (let k = 0; k < 3; k++) g.dot(x, 0.7 + k * 0.035, 2.5, { color: 'char', alpha: 0.35 });
      // the modern signature
      g.line(0.62, 0.97, 0.94, 0.97, { color: 'char', w: 3, alpha: 0.5, wobble: 0.05, dry: 0.05 });
    },
  },
];
