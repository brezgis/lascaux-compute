// baker.js — a small pool that paints in workers, so the visitor can walk in
// while the pigment is still being ground. Falls back to painting on the
// main thread, one job per idle moment, where module workers or
// OffscreenCanvas are missing (or a worker fails to start).

import { bakeJob } from './bake-worker.js';

export function makeBaker() {
  let workers = [];
  let mainBusy = false;

  function onMain(task) {
    mainBusy = true;
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 16));
    idle(() => {
      const r = bakeJob(task.job);
      mainBusy = false;
      task.resolve(r);
    });
  }

  try {
    if (typeof OffscreenCanvas === 'undefined') throw new Error('no OffscreenCanvas');
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./bake-worker.js', import.meta.url), { type: 'module' });
      w.task = null;
      w.onmessage = ({ data }) => {
        const task = w.task;
        w.task = null;
        task.resolve(data);
      };
      w.onerror = (e) => {
        e.preventDefault();
        const stranded = workers.map((x) => x.task).filter(Boolean);
        for (const x of workers) x.terminate();
        workers = [];
        for (const task of stranded) onMain(task);
      };
      workers.push(w);
    }
  } catch (e) { workers = []; }

  return {
    // how many more jobs can be started right now
    get free() { return workers.length ? workers.filter((w) => !w.task).length : (mainBusy ? 0 : 1); },
    // job: { panel: id, k } | { motif: kind, variant } → { width, height, data }
    bake(job) {
      return new Promise((resolve) => {
        const task = { job, resolve };
        const w = workers.find((x) => !x.task);
        if (w) { w.task = task; w.postMessage(job); } else onMain(task);
      });
    },
  };
}
