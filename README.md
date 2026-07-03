# GROTTE DU CALCUL

*The painted cave of computation.*

A first-person browser toy: walk into a torchlit cave and read the history of
computation and NLP (1913–1997, plus one disputed intrusion) as parietal art —
ochre, charcoal, and one pigment that should not exist, painted flush on the
rock. Sealed for an unknown span and found again, as tradition absolutely
requires, by four teenagers following a dog named Robot.¹

¹ The real Lascaux was discovered in 1940 by four teenagers following a dog
actually named Robot. Some things cannot be improved upon.

## The chambers

| Chamber | Panels |
|---|---|
| The Vestibule | hand stencils (and one unidentified appendage), binary counting marks |
| The Hall of Automata | the Turing tape-beast, the λ binder, the von Neumann x-ray beast, ENIAC and its six programmers, the first bug (1947, with tape) |
| The Gallery of Information | Shannon's noisy channel, Markov's chain-serpent (1913), the three-headed n-gram beast |
| The Rotunda | Zipf's slope, the Hamming(7,4) ox |
| The Nave of Speech | the Chomsky tree and the colorless green sleeper, ELIZA the mirror oracle, the hidden Markov beast, IBM's twin herds of statistical MT |
| The Gallery ceiling | The Loom of Memory (magnetic-core memory, read-destructive and hand-woven) — painted overhead, in the weavers' position |
| The Shaft of the Perceptron | the XOR bison goring the fallen Perceptron (after the Shaft scene at Lascaux); on the facing wall, The Return (backprop, 1986) |
| The Apse | a recent intrusion (2017, unfinished, cataloging disputed) |

Stand before a painting and its field-report plaque surfaces. Every plaque is
lore-flavored but historically load-bearing: dates, names, and anecdotes check
out (the moth, the Hansard, the dog).

Beyond the plaqued panels, ~120 lesser figures crowd the walls and ceilings,
Lascaux-dense: marked beasts and little herds, hunters mid-throw, hand
stencils, counting dots, punch-tape ribbons, punched cards with clipped
corners, ferrite core rings, logic-gate trap signs, sorting nets, recursion
spirals, lesser chain-serpents. They are scattered procedurally (seeded, so
every visitor sees the same cave) and have no plaques; they are just the
centuries of other painters.

## Controls

- **WASD / arrows** — walk (Shift to hurry)
- **mouse** — torch & gaze
- **M** — survey map (tracks which panels you have read)
- **N** — sound on/off
- **touch** — left half of screen walks, right half looks

## Running

Static files, ES modules — needs any web server (`file://` won't do):

```
python3 -m http.server 8000
# then http://localhost:8000
```

Deploy = copy the directory (or push to GitHub Pages). Everything is
self-contained: three.js is vendored in `vendor/`, all art, audio and geometry
are synthesized at load. No build step, no assets, no network calls.
Total payload is ~1.4 MB raw, mostly three.js (~300 KB gzipped on the wire).

## How it works

- **The rock** (`src/cave.js`) — the chamber system is a signed-distance field
  (capsule passages + ellipsoid chambers, smooth-min'd, fbm-roughened, floor-cut
  for walkability), meshed by naive surface nets into one continuous body.
  Normals come from the field gradient; ambient occlusion is baked by probing
  the field along normals; player collision and painting placement sample the
  same field at runtime. The entrance collapse is carved into the field itself.
- **The paintings** (`src/paint.js`, `src/paintings.js`) — every panel is
  stroke-authored and rendered at load through a pigment engine: strokes become
  chains of overlapping finger-daubs with wobble, taper, width jitter and
  dry-brush gaps, then a weathering pass erodes the pigment with noise so it
  sits *in* the rock. Hand stencils are spatter-sprayed around Path2D masks.
  Panels are projected onto the rock as decals (`THREE.DecalGeometry`), so they
  hug every bump — the way the Lascaux painters used the wall's bulges.
- **The torch** (`src/torch.js`) — a flickering point light (layered sines),
  sprite flames, drifting embers.
- **The sound** (`src/audio.js`) — synthesized from nothing: brown-noise wind
  breathing through a lowpass, random drips into a feedback-delay "cavern",
  and a torch crackle whose gain follows the flame's flicker.

## Dev tools

- `paint-lab.html` — renders all plaqued panels flat on a rock background for
  iterating on the art (`?only=turing,xor&scale=0.8`).
- `motif-lab.html` — the same for the scattered lesser figures
  (`src/motifs.js`), three variants of each.
- `index.html?shot=<panel-id>` or `?shot=x,z,yaw[,pitch]` — positions the
  camera for headless screenshots; `?map=1` opens the survey map.
- To run the walkability simulation or other field tests in Node, give it a
  `three` package pointing at the vendored build:
  ```
  mkdir -p node_modules/three
  printf '{"name":"three","type":"module","exports":"./three.module.js"}' > node_modules/three/package.json
  ln -s ../../vendor/three.module.js node_modules/three/three.module.js
  ```

— Ministry of Prehistoric Computation, Bulletin № 5.
No flash photography. Do not feed the Perceptron.
