'use strict';
/* Time dial and settings panel */

/* =========================== time dial + UI =========================== */
let manualHour = null;
const nowHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; };
const hourNow = () => manualHour !== null ? manualHour : nowHour();
const dial = $('dial'), NS = 'http://www.w3.org/2000/svg';
for (let i = 0; i <= 60; i++) {
  const a = (-80 + i * 160 / 60) * Math.PI / 180, r1 = 140, r2 = i % 5 === 0 ? 126 : 132;
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', 150 + r1 * Math.sin(a)); l.setAttribute('y1', 150 - r1 * Math.cos(a));
  l.setAttribute('x2', 150 + r2 * Math.sin(a)); l.setAttribute('y2', 150 - r2 * Math.cos(a));
  l.setAttribute('stroke', 'rgba(255,255,255,.55)'); l.setAttribute('stroke-width', i % 5 === 0 ? 2 : 1.3); l.setAttribute('stroke-linecap', 'round'); dial.appendChild(l);
}
const needle = document.createElementNS(NS, 'path'); needle.setAttribute('d', 'M0,-112 L-9,-90 L0,-96 L9,-90 Z'); needle.setAttribute('fill', '#fff');
const ng = document.createElementNS(NS, 'g'); ng.appendChild(needle); dial.appendChild(ng);
let dragging = false, dialHover = false;
function dialSet(e) {
  const r = dial.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * (150 / 160);
  const ang = clamp(Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI, -80, 80);
  manualHour = (ang + 80) / 160 * 24; $('liveBtn').classList.remove('on');
}
dial.addEventListener('pointerdown', e => { dragging = true; dial.setPointerCapture(e.pointerId); dialSet(e); });
dial.addEventListener('pointermove', e => { if (dragging) dialSet(e); });
dial.addEventListener('pointerup', () => dragging = false);
dial.addEventListener('mouseenter', () => dialHover = true); dial.addEventListener('mouseleave', () => dialHover = false);
$('liveBtn').onclick = () => { manualHour = null; $('liveBtn').classList.add('on'); };

document.querySelectorAll('#wSeg button').forEach(b => b.onclick = () => {
  override = b.dataset.w; document.querySelectorAll('#wSeg button').forEach(x => x.classList.toggle('on', x === b));
});
const tAnim = $('tAnim'), tReact = $('tReact'), tSound = $('tSound'), vol = $('vol');
const panel = $('panel'), showBtn = $('showBtn');
function setPanel(v) { panel.classList.toggle('hidden', !v); showBtn.classList.toggle('vis', !v); }
$('hideBtn').onclick = () => setPanel(false); showBtn.onclick = () => setPanel(true);
addEventListener('keydown', e => { if (e.key === 'h' || e.key === 'H') setPanel(panel.classList.contains('hidden')); });
$('fsBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
let hideT;
addEventListener('pointermove', e => {
  if (e.clientX > innerWidth - 70 && e.clientY < 70) setPanel(true);          // move the mouse to the top-right corner to open
  if (!panel.classList.contains('hidden')) { clearTimeout(hideT); hideT = setTimeout(() => { if (!panel.matches(':hover') && !dragging) setPanel(false); }, 2500); }
});
