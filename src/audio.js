// audio.js — the cave's voice, synthesized from nothing: filtered-noise wind,
// randomly scheduled water drips with cavernous echo, and a torch crackle
// whose roughness follows the flame's flicker.

export function makeAmbience() {
  let ctx = null;
  let master = null;
  let crackleGain = null;
  let enabled = true;
  let started = false;

  function start() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    // ---- cavern echo bus (feedback delay)
    const echo = ctx.createDelay(1.2);
    echo.delayTime.value = 0.42;
    const echoFb = ctx.createGain(); echoFb.gain.value = 0.42;
    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'lowpass'; echoFilter.frequency.value = 900;
    echo.connect(echoFilter); echoFilter.connect(echoFb); echoFb.connect(echo);
    const echoOut = ctx.createGain(); echoOut.gain.value = 0.5;
    echoFilter.connect(echoOut); echoOut.connect(master);

    // ---- noise source (shared buffer)
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 3.2;
    }

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

    // ---- torch crackle: bandpassed noise, gain follows flicker
    const crackle = ctx.createBufferSource();
    crackle.buffer = buf; crackle.loop = true; crackle.playbackRate.value = 1.7;
    const crackleBp = ctx.createBiquadFilter();
    crackleBp.type = 'bandpass'; crackleBp.frequency.value = 2400; crackleBp.Q.value = 0.8;
    crackleGain = ctx.createGain(); crackleGain.gain.value = 0.035;
    crackle.connect(crackleBp); crackleBp.connect(crackleGain); crackleGain.connect(master);
    crackle.start();
    // sporadic pops
    (function pop() {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05 + Math.random() * 0.6;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(700 + Math.random() * 1600, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.04);
      const gpop = ctx.createGain();
      gpop.gain.setValueAtTime(0, t);
      gpop.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.004);
      gpop.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(gpop); gpop.connect(master);
      o.start(t); o.stop(t + 0.08);
      setTimeout(pop, 300 + Math.random() * 1400);
    })();

    // ---- drips: sine blips into the echo bus
    (function drip() {
      if (!ctx) return;
      const t = ctx.currentTime + 0.1;
      const f = 900 + Math.random() * 2200;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.07);
      const gd = ctx.createGain();
      gd.gain.setValueAtTime(0, t);
      gd.gain.linearRampToValueAtTime(0.10 + Math.random() * 0.09, t + 0.003);
      gd.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(gd); gd.connect(echo); gd.connect(master);
      o.start(t); o.stop(t + 0.2);
      setTimeout(drip, 2500 + Math.random() * 9000);
    })();
  }

  return {
    start,
    setFlicker(f) {
      if (crackleGain) crackleGain.gain.value = 0.02 + Math.max(0, f - 0.8) * 0.14;
    },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? 0.55 : 0;
      return enabled;
    },
  };
}
