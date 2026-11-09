// bake-worker.js — paints off the main thread. Receives a job
// ({ panel: id, k } or { motif: kind, variant }) and answers with the
// weathered RGBA pixels (straight alpha), transferred.

import { PAINTINGS, bakePainting } from './paintings.js';
import { bakeMotif } from './motifs.js';

const byId = new Map(PAINTINGS.map((p) => [p.id, p]));

export function bakeJob(job) {
  const { img } = job.panel
    ? bakePainting(byId.get(job.panel), job.k, false)
    : bakeMotif(job.motif, job.variant, false);
  return { width: img.width, height: img.height, data: img.data };
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = ({ data: job }) => {
    const r = bakeJob(job);
    self.postMessage(r, [r.data.buffer]);
  };
}
