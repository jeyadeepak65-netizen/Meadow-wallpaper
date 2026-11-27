'use strict';
/* Sky dome, sun, moon, stars, clouds */

/* =========================== sky dome =========================== */
const skyU = {
  uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunCol: { value: new THREE.Color(1, .95, .8) }, uSunI: { value: 1 }, uCloud: { value: 0 }, uCloudCol: { value: new THREE.Color(1, 1, 1) }, uTime: { value: 0 }
};
const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform vec3 uTop, uHor, uSunDir, uSunCol, uCloudCol; uniform float uSunI, uCloud, uTime; varying vec3 vDir;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<5;i++){ s += a*noise(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){
      vec3 d = normalize(vDir); float y = max(d.y, 0.0);
      vec3 col = mix(uHor, uTop, pow(y, 0.5));
      float sd = max(dot(d, uSunDir), 0.0);
      col += uSunCol * (pow(sd, 6.0)*0.22 + pow(sd, 60.0)*0.5 + smoothstep(0.9992, 0.9997, sd)*2.2) * uSunI;
      vec2 uv = d.xz / (d.y + 0.14) * vec2(0.38, 1.25) + vec2(uTime*0.01, 0.0);
      float n = fbm(uv*1.5) + 0.35*fbm(uv*4.0 + 3.0);
      float cover = mix(0.80, 0.40, uCloud);
      float c = smoothstep(cover, cover + 0.22, n) * smoothstep(0.02, 0.2, d.y);
      vec3 cc = uCloudCol * (0.84 + 0.16 * fbm(uv*3.0 + 7.0));
      col = mix(col, cc, c * (0.5 + 0.45*uCloud));
      gl_FragColor = vec4(col, 1.0);
    }`
}));
dome.renderOrder = -10; dome.frustumCulled = false; dome.layers.enable(1); scene.add(dome);

function glowTex(stops, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c);
}
/* ---- the real phase of the moon for today's date, drawn exactly (lit side, shape of the terminator, earthshine) ---- */
const moonState = { k: 1, e: 180, ip: 0, waxing: true, name: 'Full moon', pct: 100, key: '' };
function computeMoon(date) {
  const R = Math.PI / 180, jd = date.getTime() / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
  const D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T;
  const i = 180 - D - 6.289 * Math.sin(Mp * R) + 2.100 * Math.sin(M * R) - 1.274 * Math.sin((2 * D - Mp) * R) - 0.658 * Math.sin(2 * D * R) - 0.214 * Math.sin(2 * Mp * R) - 0.110 * Math.sin(D * R);
  const e = (((180 - i) % 360) + 360) % 360;                         // elongation: 0 new, 90 first quarter, 180 full, 270 last quarter
  const k = (1 + Math.cos(i * R)) / 2, ip = Math.abs((((i + 180) % 360) + 360) % 360 - 180);
  const name = k < 0.02 ? 'New moon' : k > 0.98 ? 'Full moon' : Math.abs(e - 90) < 6 ? 'First quarter' : Math.abs(e - 270) < 6 ? 'Last quarter'
    : e < 90 ? 'Waxing crescent' : e < 180 ? 'Waxing gibbous' : e < 270 ? 'Waning gibbous' : 'Waning crescent';
  return { k, e, ip, waxing: e < 180, name };
}
// sunrise, sunset and solar noon for a date at the current latitude / longitude (device time zone), plus how high the sun climbs
const sunCache = {};
function sunInfo(date) {
  const key = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '|' + lat.toFixed(1) + '|' + lon.toFixed(1); if (sunCache[key]) return sunCache[key];
  const R = Math.PI / 180, N = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const dec = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365) * R, phi = lat * R;
  const c = clamp((Math.sin(-0.833 * R) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)), -1, 1);
  const len = clamp(2 * Math.acos(c) / R / 15, 1.5, 22.5);
  const B = 2 * Math.PI * (N - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);       // equation of time, minutes
  const noon = 12 - (lon + date.getTimezoneOffset() / 4) / 15 - eot / 60;                                              // getTimezoneOffset() / 4 = -(tz hours * 15)
  const alt = 90 - Math.abs(lat - dec / R);
  return sunCache[key] = { rise: noon - len / 2, set: noon + len / 2, noon, len, amp: 0.85 * (0.72 + 0.28 * clamp(alt / 90, 0, 1)) };
}
const fmtHM = h => { h = ((h % 24) + 24) % 24; const hh = Math.floor(h), mm = Math.round((h - hh) * 60), H = (hh + (mm === 60 ? 1 : 0)) % 24; return ((H % 12) || 12) + ':' + String(mm % 60).padStart(2, '0') + (H >= 12 ? ' PM' : ' AM'); };
const moonEmoji = (e, south) => { let i = Math.round(e / 45) % 8; if (south) i = (8 - i) % 8; return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][i]; };
const moonHash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const MARIA = [[-0.28, -0.38, 0.28], [0.10, -0.33, 0.17], [0.27, -0.05, 0.22], [0.62, -0.20, 0.10], [0.50, 0.15, 0.17], [-0.62, -0.05, 0.26], [-0.18, 0.42, 0.17], [-0.52, 0.38, 0.10], [0.03, -0.12, 0.10], [-0.05, -0.68, 0.14]];
function buildMoonTexture(k, ip, waxing, south) {
  const S = 512, R = 88, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const h = x.createRadialGradient(S / 2, S / 2, R * 0.9, S / 2, S / 2, S / 2), ha = 0.5 * k;
  h.addColorStop(0, `rgba(200,215,255,${ha})`); h.addColorStop(0.3, `rgba(160,185,255,${ha * 0.25})`); h.addColorStop(1, 'rgba(140,170,255,0)');
  x.fillStyle = h; x.fillRect(0, 0, S, S);
  const d = document.createElement('canvas'); d.width = d.height = S; const dx = d.getContext('2d'), im = dx.createImageData(S, S), px = im.data;
  const litRight = waxing !== south, sx = (litRight ? 1 : -1) * Math.sin(ip * Math.PI / 180), sz = Math.cos(ip * Math.PI / 180);   // light direction as seen from Earth
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const nx = (i - S / 2 + 0.5) / R, ny = (j - S / 2 + 0.5) / R, r2 = nx * nx + ny * ny; if (r2 > 1.03) continue;
    const r = Math.sqrt(r2), z = Math.sqrt(Math.max(0, 1 - r2));
    let m = 0; for (const [mx, my, mr] of MARIA) m += Math.exp(-((nx - mx) ** 2 + (ny - my) ** 2) / (mr * mr) * 1.2);
    let alb = 0.96 - 0.34 * Math.min(1, m) + (moonHash(i * 0.31, j * 0.31) - 0.5) * 0.06 + (moonHash(Math.floor(i / 5), Math.floor(j / 5)) - 0.5) * 0.05;
    alb += 0.12 * Math.exp(-((nx + 0.1) ** 2 + (ny - 0.68) ** 2) / 0.004) + 0.10 * Math.exp(-((nx + 0.25) ** 2 + (ny + 0.1) ** 2) / 0.003);
    const ndl = nx * sx + z * sz, litF = smooth(0.0, 0.14, ndl), bright = alb * (0.78 + 0.22 * Math.max(0, ndl)), earth = (0.07 + 0.08 * (1 - k)) * alb;
    const edge = clamp((1 - r) * R, 0, 1), idx = (j * S + i) * 4;
    px[idx] = 255 * bright * litF + 120 * earth * (1 - litF); px[idx + 1] = 251 * bright * litF + 140 * earth * (1 - litF); px[idx + 2] = 236 * bright * litF + 190 * earth * (1 - litF);
    px[idx + 3] = 255 * (litF + 0.30 * (1 - litF)) * edge;          // the unlit side stays a faint dark disc
  }
  dx.putImageData(im, 0, 0); x.drawImage(d, 0, 0);
  return new THREE.CanvasTexture(c);
}
const moon = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: false }));
function updateMoon(date) {
  const m = computeMoon(date || viewDate()), south = lat < 0, key = Math.round(m.ip * 2) + '|' + m.waxing + '|' + south;
  Object.assign(moonState, { k: m.k, e: m.e, ip: m.ip, waxing: m.waxing, name: m.name, pct: Math.round(m.k * 100) });
  if (key !== moonState.key) { moonState.key = key; const old = moon.material.map; moon.material.map = buildMoonTexture(m.k, m.ip, m.waxing, south); moon.material.needsUpdate = true; if (old) old.dispose(); }
}
moon.scale.set(60, 60, 1); moon.layers.enable(1); scene.add(moon);

const stars = (() => {
  const n = 2200, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = Math.random() * 6.283, v = Math.pow(Math.random(), 0.8) * 0.92 + 0.04, r = 450, s = Math.sqrt(1 - v * v); p.set([Math.cos(th) * r * s, v * r, Math.sin(th) * r * s], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
  pts.frustumCulled = false; pts.renderOrder = -9; pts.layers.enable(1); scene.add(pts); return pts;
})();
