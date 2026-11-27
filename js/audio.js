'use strict';
/* Ambient sound: pond, wind, birds, owl, water drops */

/* =========================== ambient sound =========================== */
let actx, master, windG, rainG, rustleG, fxBus, dripBus, pondG, birdDest, nextDrip = 2;
function initAudio() {
  if (actx) return; actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  { const comp = actx.createDynamicsCompressor(); master.connect(comp); comp.connect(actx.destination); }
  fxBus = actx.createGain(); fxBus.gain.value = 3; fxBus.connect(master);                         // birds and owls go through a soft reverb
  { const len = actx.sampleRate * 2, ir = actx.createBuffer(2, len, actx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
    const conv = actx.createConvolver(); conv.buffer = ir; const wet = actx.createGain(); wet.gain.value = 0.4; fxBus.connect(conv); conv.connect(wet).connect(master); }
  { // water drops get a soft, slow echo, like a quiet cave or a still garden pond
    dripBus = actx.createGain(); dripBus.connect(fxBus);
    const dl = actx.createDelay(1), fb = actx.createGain(), dlp = actx.createBiquadFilter(), eo = actx.createGain();
    dl.delayTime.value = 0.28; fb.gain.value = 0.08; dlp.type = 'lowpass'; dlp.frequency.value = 1100; eo.gain.value = 0.18;
    dripBus.connect(dl); dl.connect(dlp); dlp.connect(fb).connect(dl); dlp.connect(eo).connect(fxBus); }
  const len = actx.sampleRate * 3;
  const b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const s = actx.createBufferSource(); s.buffer = b; s.loop = true;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  windG = actx.createGain(); s.connect(lp).connect(windG).connect(master); s.start();
  const nb = actx.createBuffer(1, len, actx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
  const ns = actx.createBufferSource(); ns.buffer = nb; ns.loop = true;
  const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
  rainG = actx.createGain(); rainG.gain.value = 0; ns.connect(hp).connect(rainG).connect(master); ns.start();
  // slow breathing of the breeze + a faint leaf rustle
  const bl = actx.createOscillator(); bl.frequency.value = 0.11; const blg = actx.createGain(); blg.gain.value = 0.03; bl.connect(blg).connect(windG.gain); bl.start();
  const rs = actx.createBufferSource(); rs.buffer = nb; rs.loop = true;
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.6;
  rustleG = actx.createGain(); rustleG.gain.value = 0.01; rs.connect(bp).connect(rustleG).connect(master); rs.start();
  { // a soft, continuous pond: two layers of gently filtered noise that swell and ebb slowly, panned left/right like water lapping at the edges
    const wl = actx.sampleRate * 4, mk = () => { const wb = actx.createBuffer(1, wl, actx.sampleRate), wd = wb.getChannelData(0); let l1 = 0;
      for (let i = 0; i < wl; i++) { const w = Math.random() * 2 - 1; l1 = l1 * 0.6 + w * 0.4; wd[i] = l1; } return wb; };   // slightly smoothed noise = no harsh hiss
    [[620, 0.8, 1500, -0.55, 0.23, 0.0085, 0.021, 0.11], [980, 1.1, 2200, 0.55, 0.31, 0.0065, 0.017, 0.14]].forEach(([fq, q, cut, pan, lf, depth, base, fdepth]) => {
      const src = actx.createBufferSource(); src.buffer = mk(); src.loop = true; src.playbackRate.value = 0.9 + Math.random() * 0.2;
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q;
      const lpw = actx.createBiquadFilter(); lpw.type = 'lowpass'; lpw.frequency.value = cut;
      const g = actx.createGain(); g.gain.value = base; const pn = actx.createStereoPanner(); pn.pan.value = pan;
      const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = lf; lg.gain.value = depth; lfo.connect(lg).connect(g.gain);
      const lfo2 = actx.createOscillator(), lg2 = actx.createGain(); lfo2.frequency.value = lf * 0.6; lg2.gain.value = fq * fdepth * 3; lfo2.connect(lg2).connect(bp.frequency);
      src.connect(bp).connect(lpw).connect(g).connect(pn).connect(master); src.start(); lfo.start(); lfo2.start(); pondG = g; });
  }
  const rl = actx.createOscillator(); rl.frequency.value = 0.17; const rlg = actx.createGain(); rlg.gain.value = 0.006; rl.connect(rlg).connect(rustleG.gain); rl.start();
}
const wallpaperMode = new URLSearchParams(location.search).has('wallpaper');
{ const hideIntro = () => { const i = $('intro'); if (i) { i.style.opacity = 0; setTimeout(() => i.remove(), 1200); } };
  if (wallpaperMode) hideIntro(); else { addEventListener('pointerdown', hideIntro, { once: true }); setTimeout(hideIntro, 14000); } }
// silent when the tab/app is hidden; in a normal browser also silent when the window loses focus
const audible = () => tSound.checked && !document.hidden && (wallpaperMode || document.hasFocus());
if (wallpaperMode && tSound.checked) { try { initAudio(); actx.resume(); } catch (e) {} }
addEventListener('pointerdown', () => { if (tSound.checked) { initAudio(); if (actx.state === 'suspended') actx.resume(); } }, { once: false });
$('muteBtn').onclick = () => { tSound.checked = !tSound.checked; if (tSound.checked) { initAudio(); actx.resume(); } };

/* --- sound effects: birds, owl, water --- */
let nextBird = 4, nextOwl = 15, noiseBuf;
// --- birdsong: round, soft-edged notes (no sharp clicks), gentle harmonics, low-passed so nothing is shrill, each bird placed somewhere in the stereo field ---
function syl(t, f0, f1, dur, vol) {
  const o = actx.createOscillator(), o2 = actx.createOscillator(), h = actx.createGain(), env = actx.createGain(), lp = actx.createBiquadFilter();
  o.type = 'sine'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.3;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(400, f1), t + dur);
  o2.frequency.setValueAtTime(f0 * 2, t); o2.frequency.exponentialRampToValueAtTime(Math.max(800, f1 * 2), t + dur); h.gain.value = 0.12;
  const at = Math.min(0.022, dur * 0.4);                                               // soft rounded attack and a smooth fall
  env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(vol, t + at); env.gain.setTargetAtTime(0.0001, t + at, dur * 0.28);
  o.connect(env); o2.connect(h).connect(env); env.connect(lp).connect(birdDest || fxBus);
  o.start(t); o2.start(t); o.stop(t + dur * 2 + 0.08); o2.stop(t + dur * 2 + 0.08);
}
function whistle(t, f0, f1, dur, vol) {          // a sweet, clear whistled note with a gentle vibrato (koel, magpie-robin)
  const o = actx.createOscillator(), v = actx.createOscillator(), vg = actx.createGain(), g = actx.createGain(), lp = actx.createBiquadFilter();
  o.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 2800;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  v.frequency.value = rnd(4.5, 6); vg.gain.value = f0 * 0.01; v.connect(vg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
  o.connect(lp).connect(g).connect(birdDest || fxBus); o.start(t); v.start(t); o.stop(t + dur + 0.2); v.stop(t + dur + 0.2);
}
function coo(t, f, dur, vol) {                    // a dove's warm, rounded "coo": low, breathy, slow swell
  const o = actx.createOscillator(), o2 = actx.createOscillator(), h = actx.createGain(), g = actx.createGain(), lp = actx.createBiquadFilter();
  o.type = 'sine'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 1300;
  o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f, t + dur * 0.35); o.frequency.exponentialRampToValueAtTime(f * 0.93, t + dur);
  o2.frequency.setValueAtTime(f * 2, t); h.gain.value = 0.18;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); o2.connect(h).connect(lp); lp.connect(g).connect(birdDest || fxBus); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function phrase(kind, t, vol) {
  if (kind === 'tweet') { const n = 2 + Math.floor(Math.random() * 3); let f = rnd(2500, 3500);
    for (let i = 0; i < n; i++) { const d = rnd(0.08, 0.13); syl(t, f, i < n - 1 ? f * rnd(1.15, 1.4) : f * 0.78, d, vol); t += d + rnd(0.07, 0.13); f *= rnd(0.95, 1.08); } return t; }
  if (kind === 'trill') { const n = 8 + Math.floor(Math.random() * 6); let f = rnd(2300, 3100);
    for (let i = 0; i < n; i++) { syl(t, f, f * 1.1, 0.045, vol * 0.7); t += 0.068; f *= 1.006; } return t; }
  if (kind === 'warble') { const n = 6 + Math.floor(Math.random() * 5); let f = rnd(2200, 3200);
    for (let i = 0; i < n; i++) { const nf = clamp(f * rnd(0.84, 1.24), 1800, 4000), d = rnd(0.07, 0.14); syl(t, f, nf, d, vol * 0.85); t += d + rnd(0.02, 0.05); f = nf; } return t; }
  if (kind === 'coo') { const f = rnd(430, 520); coo(t, f, 0.34, vol * 1.1); coo(t + 0.46, f * 1.03, 0.34, vol * 1.25); coo(t + 0.92, f, 0.5, vol * 1.1); coo(t + 1.7, f * 0.98, 0.4, vol * 0.8); return t + 2.2; }
  if (kind === 'sweet') { const f = rnd(2000, 2700), seq = [1, 1.26, 1.5, 1.26, 1.12];                            // a little rising-falling melody on a pentatonic-ish ladder
    seq.forEach((m, i) => whistle(t + i * 0.2, f * m, f * m * rnd(0.97, 1.05), 0.2, vol * 0.65)); return t + seq.length * 0.2 + 0.1; }
  const n = 2 + Math.floor(Math.random() * 2); let f = rnd(1500, 2000);
  for (let i = 0; i < n; i++) { const d = rnd(0.34, 0.5); whistle(t, f, f * rnd(0.88, 1.15), d, vol * 0.7); t += d + rnd(0.14, 0.24); f *= rnd(0.9, 1.1); } return t;
}
function birdAt(fn) { // each singer sits at its own spot in the stereo field and is slightly softened by "distance"
  const pn = actx.createStereoPanner(), lpd = actx.createBiquadFilter(), far = Math.random();
  pn.pan.value = rnd(-0.85, 0.85); lpd.type = 'lowpass'; lpd.frequency.value = 5200 - far * 2200; pn.connect(lpd).connect(fxBus);
  birdDest = pn; try { fn(far); } finally { birdDest = null; }
}
function chirp(vol) {                              // daytime: a relaxed phrase, often answered (and sometimes a third bird joins in) from elsewhere
  if (!actx || actx.state !== 'running' || !audible()) return;
  const kinds = ['tweet', 'sweet', 'warble', 'coo', 'trill', 'whistle', 'sweet', 'warble', 'tweet'], pick = () => kinds[Math.floor(Math.random() * kinds.length)];
  birdAt(far => { const t = phrase(pick(), actx.currentTime + 0.02, vol * (1 - far * 0.35));
    if (Math.random() < 0.7) birdAt(far2 => { const t2 = phrase(pick(), t + rnd(0.4, 1.1), vol * 0.6 * (1 - far2 * 0.35)); if (Math.random() < 0.35) birdAt(f3 => phrase(pick(), t2 + rnd(0.5, 1.2), vol * 0.4)); }); });
}
function dawnSong(vol) {                           // 5:30-7:00 AM: a gentle dawn chorus - the koel's rising call, sweet whistles, warbles and doves from different directions
  if (!actx || actx.state !== 'running' || !audible()) return;
  const t0 = actx.currentTime + 0.02; let t = t0; const calls = 3 + Math.floor(Math.random() * 3);
  birdAt(() => { for (let i = 0; i < calls; i++) { whistle(t, 700 * (1 + 0.05 * i), 700 * (1.55 + 0.06 * i), 0.5, vol * 0.8); t += 0.7 + i * 0.02; } });
  birdAt(() => phrase('warble', t0 + 0.8, vol * 0.75)); birdAt(() => phrase('sweet', t0 + 1.6, vol * 0.7)); birdAt(() => phrase('trill', t0 + 2.2, vol * 0.6));
  birdAt(() => phrase('tweet', t0 + 3.2, vol * 0.6)); birdAt(() => phrase('coo', t0 + 3.8, vol * 0.7));
  if (Math.random() < 0.6) birdAt(() => phrase('warble', t0 + 4.6, vol * 0.5));
}
function hoot(vol) {                               // a deep, soft owl: "hoo ... hoo-hoo-hooooo" - low steady tone, tiny pitch dip, quavering last note, a far owl answering
  if (!actx || actx.state !== 'running' || !audible()) return;
  const note = (t, base, len, gain, quaver, cut, pan) => {
    const o = actx.createOscillator(), o2 = actx.createOscillator(), h = actx.createGain(), f = actx.createBiquadFilter(), g = actx.createGain(), pn = actx.createStereoPanner();
    o.type = 'sine'; o2.type = 'sine'; f.type = 'lowpass'; f.frequency.value = cut; pn.pan.value = pan; h.gain.value = 0.16;
    o.frequency.setValueAtTime(base * 1.03, t); o.frequency.exponentialRampToValueAtTime(base, t + 0.08); o.frequency.exponentialRampToValueAtTime(base * 0.94, t + len);
    o2.frequency.setValueAtTime(base * 2, t); o2.frequency.exponentialRampToValueAtTime(base * 1.88, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.09); g.gain.setValueAtTime(gain, t + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12);
    if (quaver) { const q = actx.createOscillator(), qg = actx.createGain(); q.frequency.value = 7; qg.gain.value = gain * 0.3; q.connect(qg).connect(g.gain); q.start(t + 0.1); q.stop(t + len + 0.2); }
    o.connect(f); o2.connect(h).connect(f); f.connect(g).connect(pn).connect(fxBus);
    o.start(t); o2.start(t); o.stop(t + len + 0.2); o2.stop(t + len + 0.2);
  };
  const song = (t0, base, gain, cut, pan) => { note(t0, base, 0.35, gain * 0.8, false, cut, pan); note(t0 + 1.1, base, 0.2, gain * 0.9, false, cut, pan); note(t0 + 1.45, base, 0.2, gain * 0.9, false, cut, pan); note(t0 + 1.8, base * 0.97, 1.0, gain, true, cut, pan); };
  const t0 = actx.currentTime + 0.02; song(t0, 300, vol, 750, -0.3); if (Math.random() < 0.7) song(t0 + rnd(4.5, 6), 260, vol * 0.35, 520, 0.5);
}
const DROP_NOTES = [392, 440, 523, 587, 659, 784];          // a calm pentatonic scale, so every drop sits nicely with the others
function droplet(t, f, vol, dur) {                // a soft glassy chime tail used under the bloops: gentle attack, long fade
  const o = actx.createOscillator(), o2 = actx.createOscillator(), h = actx.createGain(), g = actx.createGain(), lp = actx.createBiquadFilter();
  o.type = 'sine'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 1500;
  o.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 2.01, t); h.gain.value = 0.08;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); o2.connect(h).connect(lp); lp.connect(g).connect(dripBus || fxBus);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function bloop(t, f, vol, pan) {                  // a real-water "blup": a bubble's pitch rises quickly then rings out softly - round and relaxing
  const o = actx.createOscillator(), g = actx.createGain(), lp = actx.createBiquadFilter(), pn = actx.createStereoPanner(), dur = rnd(0.11, 0.2);
  o.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 1800; pn.pan.value = pan === undefined ? rnd(-0.6, 0.6) : pan;
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rnd(1.7, 2.1), t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
  o.connect(lp).connect(g).connect(pn).connect(dripBus || fxBus); o.start(t); o.stop(t + dur + 0.1);
}
function ambientWater() {                         // a rare, single soft bloop - never a string of drops
  if (!actx || actx.state !== 'running' || !audible()) return;
  bloop(actx.currentTime + 0.02, rnd(450, 800), 0.02);
}
function splashSound(vol) {                       // a fish splash: a soft swell of water, a round low "bloop", and a few little drips falling back in
  if (!actx || actx.state !== 'running' || !audible()) return;
  if (!noiseBuf) { noiseBuf = actx.createBuffer(1, Math.floor(actx.sampleRate * 0.8), actx.sampleRate); const d = noiseBuf.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = l * 0.5 + (Math.random() * 2 - 1) * 0.5; d[i] = l; } }
  const t = actx.currentTime, s = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(380, t + 0.6); bp.Q.value = 0.7;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.2, t + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  s.connect(bp).connect(g).connect(fxBus); s.start(t); s.stop(t + 0.8);
  bloop(t + 0.02, 300, vol * 0.8, 0);
}
function plip() {                                  // clicking the pond: one soft bloop and a quieter second
  if (!actx || actx.state !== 'running' || !audible()) return;
  const t = actx.currentTime, i0 = 2 + Math.floor(Math.random() * 3);
  bloop(t, DROP_NOTES[i0] * 0.9, 0.06, -0.15); bloop(t + 0.3, DROP_NOTES[i0 - 1] * 0.9, 0.025, 0.2);
}
