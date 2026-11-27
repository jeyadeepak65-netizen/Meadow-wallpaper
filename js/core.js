'use strict';
/* Shared helpers, renderer, camera, terrain, shared uniforms */

THREE.ColorManagement.enabled = false;
const LOW = /Android|iPhone|iPad/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4 || innerWidth < 700;          // colours are used exactly as written
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const $ = id => document.getElementById(id);

/* =========================== renderer / camera =========================== */
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.innerHTML = '<div style="color:#fff;font:16px system-ui;padding:40px;text-align:center">This scene needs WebGL. Please open it in an up-to-date Chrome, Edge, Safari or Firefox.</div>'; throw e; }
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(LOW ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb5d8f2, 30, 150);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 9);
const look = new THREE.Vector3(0, 4.2, -40);

/* =========================== terrain =========================== */
const POND = { x: 0, z: 0.5, rx: 5.6, rz: 2.8 }, WATER_Y = -0.18;
const pondD = (x, z) => ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
function H(x, z) {
  let h = 0.22 * Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17) + 0.12 * Math.sin(x * 0.55 + z * 0.3) * Math.sin(z * 0.47);
  h += 13 * Math.exp(-(((x + 4) ** 2) / 260 + ((z + 62) ** 2) / 420));
  h += 9 * Math.exp(-(((x - 52) ** 2) / 300 + ((z + 55) ** 2) / 500));
  h += 8 * Math.exp(-(((x + 55) ** 2) / 300 + ((z + 50) ** 2) / 500));
  h += 5 * smooth(-60, -140, z) + 1.5 * smooth(-20, -50, z);
  h = lerp(h, -0.55, smooth(1.8, 0.8, pondD(x, z)));
  return h;
}
{
  const g = new THREE.PlaneGeometry(320, 240, 300, 220); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) - 60; p.setZ(i, z); const y = H(x, z); p.setY(i, y);
    const n = 0.5 + 0.5 * Math.sin(x * 0.31) * Math.sin(z * 0.23 + 1.0), up = smooth(0, 10, y);
    col[i * 3] = 0.16 + 0.08 * n + 0.12 * up; col[i * 3 + 1] = 0.40 + 0.10 * n + 0.05 * up; col[i * 3 + 2] = 0.12 + 0.04 * n;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere();
  window._terrainMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide });
  const tm = new THREE.Mesh(g, window._terrainMat); tm.layers.enable(1); scene.add(tm);
}
const terrainMat = window._terrainMat;

/* =========================== shared uniforms =========================== */
const U = {
  uTime: { value: 0 }, uMouse: { value: new THREE.Vector3(999, 0, 999) }, uWind: { value: 1 },
  uAnim: { value: 1 }, uReact: { value: 1 }, uLight: { value: new THREE.Color(1, 1, 1) },
  uFog: { value: new THREE.Color(0xb5d8f2) }, uFogN: { value: 30 }, uFogF: { value: 150 }
};
const BEND = `
  uniform float uTime, uWind, uAnim, uReact; uniform vec3 uMouse;
  vec3 bend(vec3 off, float h, float ph) {
    float s = sin(uTime*1.5 + off.x*0.45 + off.z*0.3 + ph)*0.14 + sin(uTime*0.6 + off.x*0.12 - off.z*0.1)*0.12;
    s *= uWind * uAnim;
    vec3 d = vec3(s*h*h, 0.0, s*0.35*h*h);
    vec2 dd = off.xz - uMouse.xz; float dist = length(dd);
    float push = smoothstep(1.7, 0.0, dist) * uReact * uAnim;
    d.xz += normalize(dd + vec2(1e-4)) * push * 0.22 * h * h;
    d.y -= push * 0.06 * h * h;
    return d;
  }`;
