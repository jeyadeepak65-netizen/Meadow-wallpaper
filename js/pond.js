'use strict';
/* Pond, rain and fireflies */

/* =========================== pond =========================== */
// the pond is a mirror: sky, sun/moon, clouds and hills are drawn again from underneath the water and shown on its surface
const reflSize = () => [Math.max(256, innerWidth >> (LOW ? 2 : 1)), Math.max(256, innerHeight >> (LOW ? 2 : 1))];
const reflRT = new THREE.WebGLRenderTarget(...reflSize());
const rcam = new THREE.PerspectiveCamera(); rcam.layers.set(1);
const reflPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y);
const biasM = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
const waterU = { ...U, uTop: skyU.uTop, uHor: skyU.uHor, uLum: { value: 1 }, uRip: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -99, 0)) },
  uRefl: { value: reflRT.texture }, uTexMat: { value: new THREE.Matrix4() }, uGlintDir: { value: new THREE.Vector3(0, 1, -1) }, uGlintCol: { value: new THREE.Color(1, 1, 1) }, uGlintI: { value: 0 } };
const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: waterU, transparent: true, depthWrite: false,
  vertexShader: `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `
    uniform vec3 uTop, uHor, uMouse, uGlintDir, uGlintCol; uniform float uTime, uReact, uAnim, uLum, uGlintI; uniform vec4 uRip[8];
    uniform sampler2D uRefl; uniform mat4 uTexMat; varying vec2 vP; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      float r = length(vP);
      vec3 V = normalize(cameraPosition - vW);
      vec2 q = vW.xz;
      vec2 dist = vec2(sin(q.x*7.0 + uTime*1.3) + sin(q.y*5.0 - uTime*1.1), cos(q.x*6.0 - uTime*1.2) + cos(q.y*8.0 + uTime*0.9)) * 0.0035;
      vec2 dm0 = q - uMouse.xz; float dm = length(dm0);
      dist += normalize(dm0 + vec2(1e-4)) * sin(dm*10.0 - uTime*5.0) * exp(-dm*0.9) * 0.012 * uReact * uAnim * step(dm, 4.0);
      float ringSum = 0.0;
      for (int i = 0; i < 8; i++) {
        vec4 rp = uRip[i]; float age = uTime - rp.z;
        if (rp.w > 0.0 && age > 0.0 && age < 5.0) {
          vec2 dv = q - rp.xy; float dd = length(dv);
          float ring = sin((dd - age) * 16.0) * exp(-abs(dd - age) * 4.5) * exp(-age * 0.7) * rp.w;
          dist += normalize(dv + vec2(1e-4)) * ring * 0.018; ringSum += ring;
        }
      }
      vec4 rc = uTexMat * vec4(vW, 1.0);
      vec3 refl = texture2D(uRefl, rc.xy / rc.w + dist).rgb * mix(vec3(0.78, 0.90, 0.86), vec3(1.0), uLum);
      float fres = clamp(0.34 + 0.7 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0), 0.0, 0.93);
      vec3 deep = mix(vec3(0.02, 0.09, 0.10), uHor * 0.28, 0.5) * (0.3 + uLum);
      vec3 col = mix(deep, refl, fres);
      vec3 N = normalize(vec3(dist.x * 20.0, 1.0, dist.y * 20.0));
      float sg = pow(max(dot(reflect(-V, N), uGlintDir), 0.0), 90.0);
      col += uGlintCol * sg * uGlintI;
      col += vec3(0.10, 0.13, 0.16) * ringSum * (0.4 + uLum);
      col += step(0.9965, hash(floor(q*14.0 + floor(uTime*1.5)))) * 0.3 * uLum;
      gl_FragColor = vec4(col, smoothstep(1.0, 0.86, r));
    }`
}));
water.position.set(POND.x, WATER_Y, POND.z); water.scale.set(POND.rx * 1.27, 1, POND.rz * 1.27); water.renderOrder = 2; scene.add(water);

/* =========================== rain + fireflies =========================== */
const RAIN = 3000, rp = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) rp.set([rnd(-22, 22), rnd(0, 14), rnd(-30, 10)], i * 3);
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
rain.frustumCulled = false; scene.add(rain);

const NFF = 140, ffBase = [], ffPos = new Float32Array(NFF * 3), ffCol = new Float32Array(NFF * 3);
for (let i = 0; i < NFF; i++) ffBase.push({ x: rnd(-14, 14), y: rnd(0.4, 3.0), z: rnd(7, -26), s: Math.random() * 10, sp: rnd(0.3, 0.8), b: rnd(0.4, 1.2) });
const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3)); ffGeo.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));
const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({
  map: glowTex([[0, 'rgba(255,255,200,1)'], [0.25, 'rgba(210,255,120,0.55)'], [1, 'rgba(180,255,80,0)']]),
  size: 0.55, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0
}));
fireflies.frustumCulled = false; scene.add(fireflies);
