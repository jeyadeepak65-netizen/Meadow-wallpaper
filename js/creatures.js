'use strict';
/* Butterflies, jumping fish, birds, bats and owls */

/* =========================== butterflies =========================== */
function wingTexture(type) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const fore = new Path2D('M10 122 C30 50 120 0 215 26 C240 60 215 110 150 130 C100 138 50 134 10 128 Z');
  const hind = new Path2D('M10 130 C60 140 150 134 190 160 C215 195 170 235 110 228 C60 220 20 175 10 134 Z');
  const P = {
    monarch: { g: ['#ffa23a', '#f26b0c', '#b84304'], edge: '#16100c', dots: '#fff7e8', vein: '#1a120d', band: false },
    morpho:  { g: ['#9bd6ff', '#3f86ff', '#17369e'], edge: '#1b1410', dots: '#d6eaff', vein: '#12206a', band: false },
    swallow: { g: ['#fbf1a6', '#f2d44a', '#cfa51c'], edge: '#14110c', dots: '#6aa8ff', vein: '#1a1408', band: true }
  }[type];
  for (const path of [hind, fore]) {
    x.save(); x.clip(path);
    const gr = x.createRadialGradient(20, 128, 5, 20, 128, 240);
    gr.addColorStop(0, P.g[2]); gr.addColorStop(0.3, P.g[0]); gr.addColorStop(0.75, P.g[1]); gr.addColorStop(1, P.g[2]);
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = P.vein; x.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const a = (-70 + i * 17) * Math.PI / 180; x.lineWidth = P.band && i % 2 ? 9 : 2.2; x.globalAlpha = P.band && i % 2 ? 0.9 : 0.8;
      x.beginPath(); x.moveTo(14, 128); x.quadraticCurveTo(100, 128 + Math.sin(a) * 40, 14 + Math.cos(a) * 230, 128 + Math.sin(a) * 230); x.stroke();
    }
    x.globalAlpha = 1; x.lineWidth = 24; x.strokeStyle = P.edge; x.stroke(path);
    x.restore(); x.lineWidth = 3; x.strokeStyle = P.edge; x.stroke(path);
  }
  x.fillStyle = P.dots;
  [[196, 34], [222, 52], [228, 78], [214, 102], [182, 120], [186, 172], [180, 202], [150, 222], [112, 222]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 4.2, 0, 7); x.fill(); });
  if (type === 'swallow') { x.fillStyle = P.edge; x.beginPath(); x.moveTo(118, 226); x.quadraticCurveTo(138, 250, 152, 254); x.lineTo(136, 242); x.lineTo(110, 228); x.fill(); }
  return new THREE.CanvasTexture(c);
}
const wingTexSet = ['monarch', 'morpho', 'swallow'].map(wingTexture);
const WS = 0.075;
const wingGeo = new THREE.PlaneGeometry(WS, WS).rotateX(Math.PI / 2).translate(WS / 2 - 0.003, 0, 0);
const bodyGeo = new THREE.CylinderGeometry(0.0042, 0.0032, 0.07, 6).rotateX(Math.PI / 2);
const headGeo = new THREE.SphereGeometry(0.0058, 8, 6), antGeo = new THREE.CylinderGeometry(0.0007, 0.0007, 0.04, 3).rotateX(Math.PI / 2);
const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1a1410 });
const butterflies = [];
let isNight = false;
const bugTex = glowTex([[0, 'rgba(255,255,210,1)'], [0.2, 'rgba(220,255,120,0.7)'], [1, 'rgba(170,255,70,0)']]);
const glowBugs = [];
function spawnFireflies(pos) {
  const n = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bugTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }));
    sp.position.copy(pos).add(new THREE.Vector3(rnd(-.25, .25), rnd(0, .3), rnd(-.25, .25)));
    sp.scale.setScalar(0.13);
    sp.userData = { t: 0, life: rnd(12, 18), s: rnd(0, 10), sp: rnd(0.4, 0.8), pulse: rnd(1.2, 2.2), rise: rnd(0.05, 0.14) };
    scene.add(sp); glowBugs.push(sp);
  }
}
function spawnButterflies(pos) {
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: wingTexSet[Math.floor(Math.random() * wingTexSet.length)], side: THREE.DoubleSide, transparent: true, alphaTest: 0.35 });
    const g = new THREE.Group(), R = new THREE.Mesh(wingGeo, mat), L = new THREE.Mesh(wingGeo, mat); L.scale.x = -1;
    const head = new THREE.Mesh(headGeo, bodyMat); head.position.z = 0.04;
    const aR = new THREE.Mesh(antGeo, bodyMat), aL = new THREE.Mesh(antGeo, bodyMat);
    aR.position.set(0.004, 0.004, 0.058); aR.rotation.set(-0.35, 0.4, 0); aL.position.set(-0.004, 0.004, 0.058); aL.rotation.set(-0.35, -0.4, 0);
    g.add(R, L, new THREE.Mesh(bodyGeo, bodyMat), head, aR, aL);
    g.position.copy(pos).add(new THREE.Vector3(rnd(-.2, .2), rnd(0, .3), rnd(-.2, .2)));
    g.userData = { R, L, t: 0, life: rnd(10, 14), heading: rnd(0, 6.28), speed: rnd(0.35, 0.6), flap: rnd(20, 28), wob: rnd(0, 10), rise: rnd(0.15, 0.3) };
    scene.add(g); butterflies.push(g);
  }
}

/* =========================== tiny fish that jump =========================== */
// a small golden koi-like fish: tapered body shaded back-to-belly, forked tail that wags, dorsal fin
const fishBodyGeo = (() => {
  const prof = [[0.004, -0.5], [0.03, -0.42], [0.052, -0.3], [0.07, -0.15], [0.08, 0.0], [0.076, 0.12], [0.06, 0.26], [0.04, 0.38], [0.018, 0.46], [0.002, 0.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 14); g.rotateX(Math.PI / 2); g.scale(0.78, 1.15, 1);
  const p = g.attributes.position, c = new Float32Array(p.count * 3), back = [0.93, 0.45, 0.12], mid = [0.97, 0.72, 0.34], belly = [0.98, 0.93, 0.82];
  for (let i = 0; i < p.count; i++) {
    const t = clamp(p.getY(i) / 0.092 * 0.5 + 0.5, 0, 1), a = t > 0.5 ? mid : belly, b = t > 0.5 ? back : mid, k = t > 0.5 ? (t - 0.5) * 2 : t * 2;
    c[i * 3] = lerp(a[0], b[0], k); c[i * 3 + 1] = lerp(a[1], b[1], k); c[i * 3 + 2] = lerp(a[2], b[2], k);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
})();
const finShape = pts => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); return new THREE.ShapeGeometry(sh).rotateY(Math.PI / 2); };
const tailGeo = finShape([[0, 0], [0.1, 0.07], [0.2, 0.15], [0.15, 0.02], [0.2, -0.13], [0.1, -0.06]]);
const dorsalGeo = finShape([[-0.1, 0], [0.02, 0.1], [0.15, 0]]).translate(0, 0.088, 0);
const fishBodyMat = new THREE.MeshBasicMaterial({ vertexColors: true }), finMat = new THREE.MeshBasicMaterial({ color: 0xf79a40, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });
function makeFish() {
  const g = new THREE.Group(), tail = new THREE.Group(); tail.position.z = -0.48; tail.add(new THREE.Mesh(tailGeo, finMat));
  g.add(new THREE.Mesh(fishBodyGeo, fishBodyMat), new THREE.Mesh(dorsalGeo, finMat), tail); return { group: g, tail };
}
const fishes = []; let nextFish = 5;
const MAXD = 140, dPos = new Float32Array(MAXD * 3).fill(-50), dVel = new Float32Array(MAXD * 3), dLife = new Float32Array(MAXD); let dI = 0;
const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dPts = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xdff2ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false }));
dPts.frustumCulled = false; scene.add(dPts);
function splash(x, z, n, power) {
  for (let i = 0; i < n; i++) {
    const j = dI; dI = (dI + 1) % MAXD; const a = Math.random() * 6.283, sp = rnd(0.2, 0.6) * power;
    dPos.set([x, WATER_Y, z], j * 3); dVel.set([Math.cos(a) * sp, rnd(0.8, 1.8) * power, Math.sin(a) * sp], j * 3); dLife[j] = rnd(0.35, 0.6);
  }
}
function jumpFish(x, z) {
  const d0 = Math.sqrt(pondD(x, z)); if (d0 > 0.95) { x = POND.x + (x - POND.x) * 0.95 / d0; z = POND.z + (z - POND.z) * 0.95 / d0; }
  let dx = rnd(-0.9, 0.9), dz = rnd(-0.5, 0.5), guard = 0;
  while (pondD(x + dx, z + dz) > 1.0 && guard++ < 12) { dx *= 0.7; dz *= 0.7; }
  const air = rnd(0.55, 0.8), g = 7, fsh = makeFish(), f = fsh.group; f.scale.setScalar(rnd(0.2, 0.26));
  f.userData = { x0: x, z0: z, vx: dx / air, vz: dz / air, vy: g * air / 2, g, t: 0, air, tail: fsh.tail };
  f.position.set(x, WATER_Y, z); scene.add(f); fishes.push(f);
  addRipple(x, z, 0.8); splash(x, z, 14, 1); splashSound(0.09);
}

/* =========================== wildlife: birds by day, bats and owls at night =========================== */
const mkTex = draw => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; draw(c.getContext('2d')); return new THREE.CanvasTexture(c); };
const birdTex = [0, 1].map(f => mkTex(x => {
  const tip = f === 0 ? 14 : 48; x.strokeStyle = '#222b38'; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(8, tip); x.quadraticCurveTo(36, 30, 64, 34); x.quadraticCurveTo(92, 30, 120, tip); x.stroke();
}));
const batTex = [0, 1].map(f => mkTex(x => {
  const up = f === 0 ? -1 : 1; x.fillStyle = '#0a0d15';
  x.beginPath(); x.ellipse(64, 36, 5, 10, 0, 0, 7); x.fill();
  x.beginPath(); x.moveTo(60, 26); x.lineTo(58, 18); x.lineTo(64, 24); x.lineTo(70, 18); x.lineTo(68, 26); x.fill();
  for (const sg of [-1, 1]) {
    x.beginPath(); x.moveTo(66 + sg * 2, 32); x.lineTo(64 + sg * 58, 30 + up * 22); x.lineTo(64 + sg * 46, 40 + up * 12);
    x.lineTo(64 + sg * 36, 38 + up * 8); x.lineTo(64 + sg * 24, 46 + up * 4); x.lineTo(64 + sg * 8, 42); x.closePath(); x.fill();
  }
}));
const owlSitTex = [0, 1].map(f => {
  const c = document.createElement('canvas'); c.width = 96; c.height = 128; const x = c.getContext('2d');
  const el = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  x.fillStyle = '#5b4630'; el(48, 84, 30, 40); el(48, 46, 30, 26);
  x.beginPath(); x.moveTo(22, 30); x.lineTo(24, 6); x.lineTo(40, 24); x.fill(); x.beginPath(); x.moveTo(74, 30); x.lineTo(72, 6); x.lineTo(56, 24); x.fill();
  x.fillStyle = '#8c7152'; el(48, 94, 18, 26); x.fillStyle = '#6a553b'; for (let i = 0; i < 12; i++) el(38 + (i * 7) % 20, 78 + (i * 11) % 32, 2, 3);
  x.fillStyle = '#3d2e20'; el(36, 46, 13, 13); el(60, 46, 13, 13);
  if (f === 0) { x.fillStyle = '#ffd24a'; el(36, 46, 8, 8); el(60, 46, 8, 8); x.fillStyle = '#000'; el(36, 46, 3.5, 3.5); el(60, 46, 3.5, 3.5); }
  else { x.strokeStyle = '#ffd24a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(29, 47); x.lineTo(43, 47); x.moveTo(53, 47); x.lineTo(67, 47); x.stroke(); }
  x.fillStyle = '#c98a2a'; x.beginPath(); x.moveTo(44, 54); x.lineTo(52, 54); x.lineTo(48, 64); x.fill();
  return new THREE.CanvasTexture(c);
});
const owlTex = [0, 1].map(f => mkTex(x => {
  const up = f === 0 ? -1 : 1; x.fillStyle = '#4a3a28';
  x.beginPath(); x.ellipse(64, 36, 8, 12, 0, 0, 7); x.fill();
  x.beginPath(); x.arc(64, 22, 8, 0, 7); x.fill();
  x.beginPath(); x.moveTo(58, 17); x.lineTo(57, 11); x.lineTo(62, 15); x.fill();
  x.beginPath(); x.moveTo(70, 17); x.lineTo(71, 11); x.lineTo(66, 15); x.fill();
  for (const sg of [-1, 1]) {
    x.beginPath(); x.moveTo(64 + sg * 5, 28); x.quadraticCurveTo(64 + sg * 34, 18 + up * 18, 64 + sg * 60, 30 + up * 20);
    x.lineTo(64 + sg * 50, 40 + up * 12); x.lineTo(64 + sg * 40, 40 + up * 8); x.lineTo(64 + sg * 28, 46 + up * 4); x.lineTo(64 + sg * 10, 44); x.closePath(); x.fill();
  }
  x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(61, 22, 1.6, 0, 7); x.fill(); x.beginPath(); x.arc(67, 22, 1.6, 0, 7); x.fill();
}));
const mkSprite = (tex, w, h) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.scale.set(w, h, 1); scene.add(s); return s; };

const birds = []; let nextFlock = 3;
function spawnFlock() {
  const dir = Math.random() < 0.5 ? 1 : -1, n = 3 + Math.floor(Math.random() * 3), y0 = rnd(22, 40), z0 = rnd(-130, -90), spd = rnd(5, 8);
  for (let i = 0; i < n; i++) {
    const k = rnd(0.8, 1.1), s = mkSprite(birdTex[0], 1.5 * k, 0.75 * k);
    s.userData = { dir, spd, ph: rnd(0, 6), x: -dir * 115 - dir * i * rnd(2, 3.5), y: y0 + rnd(-2, 2), z: z0 + rnd(-3, 3) };
    birds.push(s);
  }
}
const bats = [];
for (let i = 0; i < 5; i++) { const s = mkSprite(batTex[0], 2.0, 1.0); s.userData = { cx: rnd(-50, 50), cy: rnd(7, 17), cz: rnd(-70, -35), ax: rnd(4, 9), ay: rnd(1.5, 3.5), s1: rnd(0.3, 0.7), s2: rnd(0.8, 1.6), p: rnd(0, 6), v: rnd(1.5, 3.5) * (Math.random() < 0.5 ? 1 : -1) }; bats.push(s); }
const owls = [];
[[-7.5, -8, 1.0, 0.36], [8.5, -13, 1.1, 0.42]].forEach(([x, z, postH, oh], k) => {
  const y = H(x, z);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, postH, 6), new THREE.MeshBasicMaterial({ color: 0x433226 }));
  post.position.set(x, y + postH / 2, z); scene.add(post);
  const sp = mkSprite(owlSitTex[1], oh * 0.75, oh); sp.material.opacity = 1; sp.position.set(x, y + postH + oh * 0.45, z);
  owls.push({ post, sp, x, y, z, postH, oh, state: 'sit', nextBlink: 2 + k * 2, until: 0, nextFlight: 1e9, wasNight: false, t0: 0, dur: 30, curve: null });
});
