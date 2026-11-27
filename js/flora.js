'use strict';
/* Flowers, grass and daisies */

/* =========================== flowers (data first) =========================== */
const NF = LOW ? 1200 : 2600, NG = LOW ? 50000 : 140000;
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
const TAN_H = 0.4663 * Math.max(innerWidth / innerHeight, 1.9);   // half-width of the view per unit of depth
let fk = 1;
const fc = new Float32Array(NF * 3), fh = new Float32Array(NF), fs = new Float32Array(NF), ft = new Float32Array(NF * 3), fp = new Float32Array(NF);
const heads = [];
const tints = [[1, 1, 1, .78], [1, .72, .88, .08], [1, .95, .45, .07], [.8, .75, 1, .07]];
for (let i = 0; i < NF; i++) {
  let x, z, tries = 0;
  do {
    const u = halton(fk, 5), v = halton(fk, 7); fk++; z = 7 - 80 * Math.pow(v, 1.5); const dist = 9 - z; x = (u * 2 - 1) * (dist * TAN_H * 1.12 + 1.2);
  } while (pondD(x, z) < 1.55 && ++tries < 40);
  const y = H(x, z), hgt = rnd(0.24, 0.42);
  fc.set([x, y, z], i * 3); fh[i] = hgt; fs[i] = rnd(0.05, 0.09); fp[i] = Math.random() * 6.28;
  let r = Math.random(), t = tints[0]; for (const k of tints) { if (r < k[3]) { t = k; break; } r -= k[3]; }
  ft.set([t[0], t[1], t[2]], i * 3); heads.push(new THREE.Vector3(x, y + hgt, z));
}

/* =========================== grass =========================== */
{
  const W = 0.02, bg = new THREE.InstancedBufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute([-W, 0, 0, W, 0, 0, -W * .75, .5, 0, W * .75, .5, 0, 0, 1, 0], 3));
  bg.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  const N = NG + NF, off = new Float32Array(N * 3), sc = new Float32Array(N), ph = new Float32Array(N);
  let gk = 1;
  for (let i = 0; i < NG; i++) {
    let x, z, t = 0;
    do { const u = halton(gk, 2), v = halton(gk, 3); gk++; z = 7 - 75 * Math.pow(v, 1.5); const d = 9 - z; x = (u * 2 - 1) * (d * TAN_H * 1.12 + 1.2); } while (pondD(x, z) < 1.45 && ++t < 40);
    off.set([x, H(x, z) - 0.02, z], i * 3); sc[i] = rnd(0.2, 0.46); ph[i] = Math.random() * 6.28;
  }
  for (let i = 0; i < NF; i++) { const j = NG + i; off.set([fc[i * 3], fc[i * 3 + 1] - 0.02, fc[i * 3 + 2]], j * 3); sc[j] = fh[i]; ph[j] = fp[i]; }
  bg.setAttribute('offset', new THREE.InstancedBufferAttribute(off, 3));
  bg.setAttribute('aScale', new THREE.InstancedBufferAttribute(sc, 1));
  bg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
  bg.instanceCount = N;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: BEND + `
      attribute vec3 offset; attribute float aScale; attribute float aPhase;
      varying float vH, vDepth, vTone, vPatch;
      void main() {
        float h = position.y, a = aPhase * 3.1, c = cos(a), s = sin(a);
        vec3 p = vec3(position.x * c, h * aScale, position.x * s);
        vec3 w = p + offset + bend(offset, h, aPhase);
        vH = h; vTone = fract(sin(aPhase * 43.7) * 437.5);
        vPatch = 0.5 + 0.5 * sin(offset.x * 0.13) * sin(offset.z * 0.11);
        vec4 mv = viewMatrix * vec4(w, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uLight, uFog; uniform float uFogN, uFogF;
      varying float vH, vDepth, vTone, vPatch;
      void main() {
        vec3 base = vec3(0.04, 0.17, 0.05), mid = vec3(0.17, 0.44, 0.10), tip = vec3(0.64, 0.86, 0.30);
        vec3 c = mix(base, mid, smoothstep(0.0, 0.5, vH)); c = mix(c, tip, smoothstep(0.45, 1.0, vH));
        c *= 0.78 + 0.45 * vTone; c = mix(c, c * vec3(1.15, 1.05, 0.62), vPatch * 0.5);
        c *= uLight;
        float f = clamp((vDepth - uFogN) / (uFogF - uFogN), 0.0, 1.0);
        gl_FragColor = vec4(mix(c, uFog, f), 1.0);
      }`
  });
  const m = new THREE.Mesh(bg, mat); m.frustumCulled = false; scene.add(m);
}

/* =========================== daisies =========================== */
{
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.translate(64, 64);
  for (let i = 0; i < 14; i++) {
    x.save(); x.rotate(i / 14 * Math.PI * 2);
    const g = x.createLinearGradient(0, 0, 0, -58); g.addColorStop(0, '#cfd6da'); g.addColorStop(1, '#ffffff');
    x.fillStyle = g; x.beginPath(); x.ellipse(0, -37, 9, 25, 0, 0, Math.PI * 2); x.fill(); x.restore();
  }
  x.fillStyle = '#d99600'; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ffd238'; x.beginPath(); x.arc(-2, -2, 11, 0, Math.PI * 2); x.fill();
  const tex = new THREE.CanvasTexture(cv);
  const pg = new THREE.PlaneGeometry(1, 1), dg = new THREE.InstancedBufferGeometry();
  dg.index = pg.index; dg.setAttribute('position', pg.attributes.position); dg.setAttribute('uv', pg.attributes.uv);
  dg.setAttribute('aCenter', new THREE.InstancedBufferAttribute(fc, 3));
  dg.setAttribute('aHeight', new THREE.InstancedBufferAttribute(fh, 1));
  dg.setAttribute('aSize', new THREE.InstancedBufferAttribute(fs, 1));
  dg.setAttribute('aTint', new THREE.InstancedBufferAttribute(ft, 3));
  dg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(fp, 1));
  dg.instanceCount = NF;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uMap: { value: tex } },
    vertexShader: BEND + `
      attribute vec3 aCenter, aTint; attribute float aHeight, aSize, aPhase;
      varying vec2 vUv; varying vec3 vTint; varying float vDepth;
      void main() {
        vec3 head = aCenter + vec3(0.0, aHeight, 0.0) + bend(aCenter, 1.0, aPhase);
        vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 u = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 w = head + (r * position.x + u * position.y) * aSize;
        vUv = uv; vTint = aTint;
        vec4 mv = viewMatrix * vec4(w, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform vec3 uLight, uFog; uniform float uFogN, uFogF;
      varying vec2 vUv; varying vec3 vTint; varying float vDepth;
      void main() {
        vec4 t = texture2D(uMap, vUv); if (t.a < 0.5) discard;
        vec3 c = t.rgb * vTint * mix(uLight, vec3(1.0), 0.18);
        float f = clamp((vDepth - uFogN) / (uFogF - uFogN), 0.0, 1.0);
        gl_FragColor = vec4(mix(c, uFog, f), 1.0);
      }`
  });
  const m = new THREE.Mesh(dg, mat); m.frustumCulled = false; scene.add(m);
}
