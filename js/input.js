'use strict';
/* Mouse / touch input */

/* =========================== input =========================== */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), mouseN = new THREE.Vector2(), hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35), hit = new THREE.Vector3();
const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y), wp = new THREE.Vector3();
let ripI = 0, lastRip = 0, nextRip = 2;
function addRipple(x, z, amp) { waterU.uRip.value[ripI].set(x, z, U.uTime.value, amp); ripI = (ripI + 1) % 8; }
addEventListener('pointermove', e => {
  mouseN.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouseN, camera); if (ray.ray.intersectPlane(hitPlane, hit)) U.uMouse.value.copy(hit);
  if (tReact.checked && tAnim.checked && ray.ray.intersectPlane(waterPlane, wp) && pondD(wp.x, wp.z) < 1.2 && performance.now() - lastRip > 220) { lastRip = performance.now(); addRipple(wp.x, wp.z, 0.55); }
});
addEventListener('pointerdown', e => {
  if (e.target.closest('#panel') || e.target.closest('#showBtn') || !tAnim.checked) return;
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (ray.ray.intersectPlane(waterPlane, wp) && pondD(wp.x, wp.z) < 1.2) {          // a click on the pond only makes ripples and fish
    const x0 = wp.x, z0 = wp.z; addRipple(x0, z0, 1.5); setTimeout(() => addRipple(x0, z0, 1.0), 180); plip();
    jumpFish(x0, z0); if (Math.random() < 0.5) setTimeout(() => jumpFish(x0 + rnd(-0.5, 0.5), z0 + rnd(-0.3, 0.3)), 250);
    return;
  }
  let best = -1, bd = 1e9; const v = new THREE.Vector3();
  for (let i = 0; i < NF; i++) {
    v.copy(heads[i]).project(camera); if (v.z > 1 || v.z < -1) continue;
    const dx = (v.x * 0.5 + 0.5) * innerWidth - e.clientX, dy = (-v.y * 0.5 + 0.5) * innerHeight - e.clientY, d = dx * dx + dy * dy;
    const rad = Math.max(26, 1.1 * fs[i] * innerHeight / (2 * Math.tan(25 * Math.PI / 180)) / Math.max(0.5, v.z * 0 + camera.position.distanceTo(heads[i])));
    if (d < rad * rad && d < bd) { bd = d; best = i; }
  }
  if (best >= 0) (isNight ? spawnFireflies : spawnButterflies)(heads[best].clone());
});
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); reflRT.setSize(...reflSize()); });
