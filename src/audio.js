// audio.js — the cave's voice, synthesized from nothing: filtered-noise wind,
// the torch's crackle and snaps, rare water drops, and the visitor's own
// footfalls on gritty stone. Everything wet goes through one convolution
// reverb whose impulse is itself synthesized: a dark, two-and-a-half-second
// cave tail. (An earlier version used a feedback delay and sine-tone pops and
// drips, which together read as beeping. Nothing here is a pitched tone
// except the water drop, and that is a bubble, gliding upward, as real drops
// do.)

export function makeAmbience() {
  let ctx = null;
  let master = null;
  let crackleGain = null;
  let reverb = null;
  let noiseBuf = null;
  let enabled = true;
  let started = false;
  let foot = 0;

  // a synthesized cave impulse response: a few early reflections, then a
  // diffuse tail that decays and darkens
  function caveImpulse(seconds = 2.6) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        const env = Math.exp(-t * 2.4);
        // the tail loses its highs as it goes: a one-pole lowpass whose
        // coefficient closes over time
        const a = 0.55 - 0.45 * Math.min(1, t / seconds);
        lp += a * ((Math.random() * 2 - 1) - lp);
        d[i] = lp * env * 0.6;
      }
      for (const [tt, g] of [[0.013, 0.5], [0.029, 0.35], [0.047, 0.28], [0.071, 0.2]]) {
        const i = Math.floor((tt + ch * 0.004) * rate);
        d[i] += g;
      }
    }
    return ir;
  }

  function noiseBurst(t, { dur = 0.05, type = 'bandpass', freq = 1000, q = 1, gain = 0.1, attack = 0.002, dest = master, wet = 0, pan = 0 }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = 0.9 + Math.random() * 0.3;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g);
    let out = g;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(); p.pan.value = pan;
      g.connect(p); out = p;
    }
    out.connect(dest);
    if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; out.connect(w); w.connect(reverb); }
    src.start(t, Math.random() * 3);
    src.stop(t + dur + 0.02);
  }

  function start() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.55 : 0;   // honour a mute pressed before entering
    master.connect(ctx.destination);
    // some browsers (iOS Safari) hand back a suspended context
    if (ctx.state === 'suspended') ctx.resume();
    // hush when the tab is hidden, resume when it returns
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    // ---- the cave itself: convolution reverb
    reverb = ctx.createConvolver();
    reverb.buffer = caveImpulse();
    const reverbOut = ctx.createGain(); reverbOut.gain.value = 1.6;
    reverb.connect(reverbOut); reverbOut.connect(master);

    // ---- noise sources: brown for wind, white for grit and crackle
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 3.2;
    }
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const wd = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;

    // ---- wind: brown noise, slow-breathing lowpass
    const wind = ctx.createBufferSource();
    wind.buffer = buf; wind.loop = true;
    const windLp = ctx.createBiquadFilter();
    windLp.type = 'lowpass'; windLp.frequency.value = 220; windLp.Q.value = 0.6;
    const windGain = ctx.createGain(); windGain.gain.value = 0.16;
    wind.connect(windLp); windLp.connect(windGain); windGain.connect(master);
    wind.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 90;
    lfo.connect(lfoGain); lfoGain.connect(windLp.frequency);
    lfo.start();
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.043;
    const lfo2Gain = ctx.createGain(); lfo2Gain.gain.value = 0.05;
    lfo2.connect(lfo2Gain); lfo2Gain.connect(windGain.gain);
    lfo2.start();

    // ---- torch: a soft roar (low, follows the flicker) ...
    const roar = ctx.createBufferSource();
    roar.buffer = noiseBuf; roar.loop = true;
    const roarBp = ctx.createBiquadFilter();
    roarBp.type = 'bandpass'; roarBp.frequency.value = 700; roarBp.Q.value = 0.5;
    crackleGain = ctx.createGain(); crackleGain.gain.value = 0.012;
    roar.connect(roarBp); roarBp.connect(crackleGain); crackleGain.connect(master);
    roar.start();
    // ... and resin snaps: clusters of tiny noise clicks, never a tone
    (function snap() {
      if (!ctx) return;
      let t = ctx.currentTime + 0.05;
      const n = 1 + ((Math.random() * Math.random() * 5) | 0);
      for (let i = 0; i < n; i++) {
        noiseBurst(t, {
          dur: 0.008 + Math.random() * 0.02, type: 'highpass', freq: 1800 + Math.random() * 3000, q: 0.7,
          gain: 0.05 + Math.random() * 0.07, attack: 0.0008, pan: 0.25, wet: 0.05,
        });
        t += 0.01 + Math.random() * 0.05;
      }
      setTimeout(snap, 250 + Math.random() * 1600);
    })();

    // ---- water: a drop now and then, somewhere off in the dark. A drop
    // rings as a small bubble whose pitch rises; it lives mostly in the
    // reverb, so it sounds far away.
    (function drip() {
      if (!ctx) return;
      const t = ctx.currentTime + 0.1;
      const drop = (tt, f0, level) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, tt);
        o.frequency.exponentialRampToValueAtTime(f0 * (1.6 + Math.random() * 0.5), tt + 0.03);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 2200;
        const gd = ctx.createGain();
        gd.gain.setValueAtTime(0, tt);
        gd.gain.linearRampToValueAtTime(level, tt + 0.002);
        gd.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07);
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        o.connect(lp); lp.connect(gd);
        let out = gd;
        if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; gd.connect(pan); out = pan; }
        const dry = ctx.createGain(); dry.gain.value = 0.25;
        out.connect(dry); dry.connect(master);
        const wet = ctx.createGain(); wet.gain.value = 1.0;
        out.connect(wet); wet.connect(reverb);
        o.start(tt); o.stop(tt + 0.1);
        // the tiny tick of impact
        noiseBurst(tt, { dur: 0.006, type: 'highpass', freq: 3000, gain: level * 0.4, attack: 0.0005, wet: 0.6 });
      };
      const f0 = 480 + Math.random() * 520;
      const level = 0.035 + Math.random() * 0.035;
      drop(t, f0, level);
      if (Math.random() < 0.3) drop(t + 0.35 + Math.random() * 0.4, f0 * (0.9 + Math.random() * 0.2), level * 0.7);
      setTimeout(drip, 4000 + Math.random() * 10000);
    })();
  }

  // one footfall: a soft heel thump, then a scatter of grit under the sole,
  // sometimes a short scuff. pace 0..1 (hurrying is heavier); room 0..1 is
  // how much cave comes back.
  function step(pace = 0.6, room = 0.3) {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime + 0.01;
    foot = 1 - foot;
    const pan = foot ? -0.12 : 0.12;
    const v = 0.55 + 0.45 * pace;
    const wet = 0.1 + room * 0.9;
    // heel
    noiseBurst(t, { dur: 0.09, type: 'lowpass', freq: 160 + Math.random() * 60, q: 0.8, gain: 4 * v, attack: 0.004, pan, wet });
    // grit: a dozen tiny grains over ~60 ms
    const grains = 6 + ((Math.random() * 8) | 0);
    for (let i = 0; i < grains; i++) {
      noiseBurst(t + 0.008 + Math.random() * 0.06, {
        dur: 0.004 + Math.random() * 0.012, type: 'bandpass', freq: 1400 + Math.random() * 3200, q: 1.2,
        gain: (0.3 + Math.random() * 0.35) * v, attack: 0.0006, pan, wet: wet * 0.6,
      });
    }
    // scuff of the toe leaving, now and then
    if (Math.random() < 0.35) {
      noiseBurst(t + 0.09 + Math.random() * 0.04, { dur: 0.09, type: 'bandpass', freq: 900 + Math.random() * 500, q: 0.6, gain: 0.2 * v, attack: 0.03, pan, wet: wet * 0.5 });
    }
  }

  return {
    start,
    step,
    setFlicker(f) {
      // a gentle roar that swells with the flame
      if (crackleGain) crackleGain.gain.value = 0.006 + Math.max(0, f - 0.7) * 0.03;
    },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? 0.55 : 0;
      return enabled;
    },
  };
}
