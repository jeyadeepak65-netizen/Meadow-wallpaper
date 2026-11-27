'use strict';
/* Colours and the main animation loop */

/* =========================== colours =========================== */
const C = h => new THREE.Color(h);
const topDay = C(0x2d6fc4), horDay = C(0xb5d8f2), topNight = C(0x040716), horNight = C(0x101d3c), horDusk = C(0xffa070), topDusk = C(0x4a5a9a);
const gTopDay = C(0x7f8996), gHorDay = C(0xaab2bb), gNight = C(0x0c1018), gNight2 = C(0x141a26);
const lNight = new THREE.Color(0.22, 0.32, 0.56), lDay = new THREE.Color(1, 0.98, 0.92), lDusk = new THREE.Color(1, 0.62, 0.4);
const cNight = new THREE.Color(0.13, 0.18, 0.3), cWhite = new THREE.Color(1, 1, 1), cDusk = new THREE.Color(1, 0.65, 0.55);
const sunWhite = new THREE.Color(1, 0.95, 0.8), sunOrange = new THREE.Color(1, 0.55, 0.25);
const skyTop = new THREE.Color(), hor = new THREE.Color(), gT = new THREE.Color(), gH = new THREE.Color(), L = new THREE.Color(), cc = new THREE.Color();
const sunDir = new THREE.Vector3(), moonDir = new THREE.Vector3(), moonCol = new THREE.Color(0.75, 0.82, 1.0);

/* =========================== main loop =========================== */
let perfFrames = 0, perfDone = false; const perfStart = performance.now() + 2000;
const clock = new THREE.Clock(); let T = 0, frame = 0, ffT = 0;
document.getElementById('loading').style.opacity = 0;
function tick() {
  const nowMs = performance.now();
  if (!perfDone && nowMs > perfStart) { perfFrames++; if (nowMs - perfStart > 5000) { perfDone = true; if (perfFrames / ((nowMs - perfStart) / 1000) < 35) renderer.setPixelRatio(1); } }   // slow machine: lower the sharpness
  const dt = Math.min(clock.getDelta(), 0.05), anim = tAnim.checked, react = tReact.checked;
  if (anim) T += dt; ffT += dt;
  U.uAnim.value = anim ? 1 : 0; U.uReact.value = react ? 1 : 0;
  const hr = hourNow();

  let tc = state.apiCloud, tr = state.apiRain, tf = state.apiFog, tw = state.apiWind;
  if (override === 'clear') { tc = 0.05; tr = 0; tf = 0; } else if (override === 'cloud') { tc = 1; tr = 0; tf = 0; } else if (override === 'rain') { tc = 1; tr = 1; tf = 0; tw = 1.8; }
  else if (override === 'day' && preview) { tc = preview.cloud; tr = preview.r; tf = preview.fog; tw = preview.wind; }   // previewing a forecast day
  const k = 1 - Math.exp(-dt * 1.2);
  cur.cloud += (tc - cur.cloud) * k; cur.rain += (tr - cur.rain) * k; cur.fog += (tf - cur.fog) * k; cur.wind += (tw - cur.wind) * k;

  const S = sunInfo(viewDate(hr)), ts = ((hr - S.rise) % 24 + 24) % 24;                                  // real sunrise / sunset for the day on show
  const a = ts <= S.len ? Math.PI * ts / S.len : Math.PI + Math.PI * (ts - S.len) / (24 - S.len);
  sunDir.set(-Math.cos(a) * 0.55, Math.sin(a) * S.amp, -1).normalize();
  const am = (hr - S.noon - moonState.e / 15 + 6) / 12 * Math.PI;        // the moon crosses the sky later each day, by its real phase
  moonDir.set(-Math.cos(am) * 0.55, Math.sin(am) * 0.85, -1).normalize(); const elevM = moonDir.y;
  const elev = sunDir.y, dayF = smooth(-0.12, 0.26, elev), duskF = Math.max(0, 1 - Math.abs(elev) / 0.2), nightF = 1 - dayF;

  skyTop.copy(topNight).lerp(topDay, dayF).lerp(topDusk, duskF * 0.5);
  hor.copy(horNight).lerp(horDay, dayF).lerp(horDusk, duskF * 0.75);
  gT.copy(gNight).lerp(gTopDay, dayF); gH.copy(gNight2).lerp(gHorDay, dayF);
  skyTop.lerp(gT, cur.cloud * 0.7); hor.lerp(gH, cur.cloud * 0.7); hor.lerp(gH, cur.fog * 0.5);
  skyU.uTop.value.copy(skyTop); skyU.uHor.value.copy(hor); skyU.uSunDir.value.copy(sunDir);
  skyU.uSunCol.value.copy(sunWhite).lerp(sunOrange, duskF); skyU.uSunI.value = smooth(-0.06, 0.08, elev) * (1 - cur.cloud * 0.85);
  skyU.uCloud.value = cur.cloud; skyU.uTime.value = T;
  cc.copy(cNight).lerp(cWhite, dayF).lerp(cDusk, duskF * 0.7).multiplyScalar(1 - cur.cloud * 0.3 - cur.rain * 0.15); skyU.uCloudCol.value.copy(cc);
  scene.fog.color.copy(hor); U.uFog.value.copy(hor);
  const fn = 30 - cur.fog * 24, ff = 150 - cur.fog * 110; scene.fog.near = fn; scene.fog.far = ff; U.uFogN.value = fn; U.uFogF.value = ff;

  L.copy(lNight).lerp(lDay, dayF).lerp(lDusk, duskF * 0.6).multiplyScalar(1 - cur.cloud * 0.38);
  U.uLight.value.copy(L); terrainMat.color.copy(L);
  waterU.uLum.value = 0.15 + 0.85 * dayF * (1 - cur.cloud * 0.4);
  { const gs = smooth(-0.02, 0.1, elev) * 1.8, gm = smooth(-0.02, 0.1, elevM) * 0.9 * moonState.k * nightF, useSun = gs >= gm;
    waterU.uGlintDir.value.copy(useSun ? sunDir : moonDir); waterU.uGlintCol.value.copy(useSun ? skyU.uSunCol.value : moonCol);
    waterU.uGlintI.value = (useSun ? gs : gm) * (1 - cur.cloud * 0.85); }
  U.uTime.value = T; U.uWind.value = cur.wind * (1 + cur.rain * 0.4);

  dome.position.copy(camera.position); stars.position.copy(camera.position);
  stars.material.opacity = nightF * (1 - cur.cloud) * (1 - cur.fog);
  moon.position.copy(camera.position).addScaledVector(moonDir, 300);
  moon.material.opacity = smooth(-0.12, 0.06, elevM) * (1 - 0.6 * dayF) * (1 - cur.cloud * 0.85);

  rain.material.opacity = cur.rain * 0.55;
  if (cur.rain > 0.02 && anim) {
    const arr = rainGeo.attributes.position.array;
    for (let i = 0; i < RAIN; i++) { arr[i * 3 + 1] -= dt * 22; arr[i * 3] -= dt * 2; if (arr[i * 3 + 1] < 0) { arr[i * 3 + 1] = rnd(12, 16); arr[i * 3] = rnd(-22, 22); } }
    rainGeo.attributes.position.needsUpdate = true;
  }

  const ffOn = nightF * (1 - cur.rain) * (1 - cur.cloud * 0.4);
  fireflies.material.opacity = ffOn;
  if (ffOn > 0.02) {
    for (let i = 0; i < NFF; i++) {
      const f = ffBase[i], t = ffT * f.sp + f.s, br = Math.max(0, Math.sin(ffT * f.b * 1.6 + f.s * 3)) ** 2;
      ffPos[i * 3] = f.x + Math.sin(t) * 1.4; ffPos[i * 3 + 1] = f.y + Math.sin(t * 1.3 + 1) * 0.5; ffPos[i * 3 + 2] = f.z + Math.cos(t * 0.8) * 1.4;
      ffCol[i * 3] = 0.85 * br; ffCol[i * 3 + 1] = 1.0 * br; ffCol[i * 3 + 2] = 0.45 * br;
    }
    ffGeo.attributes.position.needsUpdate = true; ffGeo.attributes.color.needsUpdate = true;
  }

  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i], u = b.userData; u.t += dt;
    const sn = Math.sin(u.t * u.flap), fl = 0.12 + 1.25 * Math.pow(0.5 + 0.5 * sn, 1.4); u.R.rotation.z = fl; u.L.rotation.z = -fl; b.rotation.x = sn * 0.07;
    u.heading += Math.sin(u.t * 1.7 + u.wob) * dt * 2.0;
    const dx = Math.cos(u.heading), dz = Math.sin(u.heading) * 0.8 + 0.25;
    b.position.x += dx * u.speed * dt * 2.0; b.position.z += dz * u.speed * dt * 2.0;
    b.position.y += (u.rise + Math.sin(u.t * 2.3 + u.wob) * 0.18 + sn * 0.22) * dt;
    b.rotation.y = Math.atan2(dx, dz);
    const left = u.life - u.t; b.scale.setScalar(Math.max(0.01, Math.min(1, left)));
    if (left <= 0) { scene.remove(b); butterflies.splice(i, 1); }
  }

  {
    const dayAmt = dayF * (1 - cur.cloud * 0.5) * (1 - cur.rain), nightAmt = nightF * (1 - cur.rain) * (1 - cur.cloud * 0.3);
    if (anim && dayAmt > 0.5 && birds.length === 0 && T > nextFlock) { spawnFlock(); nextFlock = T + rnd(25, 50); }
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i], u = b.userData; if (anim) u.x += u.dir * u.spd * dt;
      b.position.set(u.x, u.y + Math.sin(T * 1.3 + u.ph) * 0.8, u.z);
      b.material.map = birdTex[Math.floor(T * 6 + u.ph) % 2]; b.material.opacity = dayAmt * 0.85;
      if (Math.abs(u.x) > 120) { scene.remove(b); b.material.dispose(); birds.splice(i, 1); }
    }
    for (const b of bats) {
      const u = b.userData; b.visible = nightAmt > 0.02; if (!b.visible) continue;
      if (anim) { u.cx += u.v * dt; if (u.cx > 60) u.cx = -60; if (u.cx < -60) u.cx = 60; }
      b.position.set(u.cx + Math.sin(T * u.s1 + u.p) * u.ax, u.cy + Math.sin(T * u.s2 + u.p * 2) * u.ay + Math.sin(T * 9) * 0.12, u.cz);
      b.material.map = batTex[Math.floor(T * 11 + u.p) % 2]; b.material.opacity = nightAmt * 0.9;
    }
    for (const o of owls) {
      const night = nightAmt > 0.5, perch = new THREE.Vector3(o.x, o.y + o.postH + o.oh * 0.45, o.z);
      o.post.material.color.setRGB(0.26 * L.r, 0.2 * L.g, 0.14 * L.b);
      o.sp.material.color.copy(L).multiplyScalar(0.8).addScalar(0.18);
      if (night && !o.wasNight) o.nextFlight = T + rnd(4, 14);          // soon after sunset
      if (!night) o.nextFlight = 1e9;
      o.wasNight = night;
      if (o.state === 'sit') {
        o.sp.position.copy(perch); o.sp.scale.set(o.oh * 0.75, o.oh, 1);
        if (night && T > o.nextBlink) { o.until = T + 0.18; o.nextBlink = T + rnd(3, 7); }
        o.sp.material.map = owlSitTex[night && T > o.until ? 0 : 1];       // asleep by day, eyes open at night
        if (night && anim && T > o.nextFlight) {
          const sg = Math.random() < 0.5 ? -1 : 1, top = o.y + o.postH, V = (a, b, c) => new THREE.Vector3(a, b, c);
          o.curve = new THREE.CatmullRomCurve3([perch.clone(), V(o.x + sg * 4, top + 3, o.z - 4), V(o.x + sg * 18, o.y + 9, o.z - 18), V(o.x - sg * 10, o.y + 14, o.z - 45),
            V(o.x - sg * 30, o.y + 11, o.z - 30), V(o.x - sg * 14, o.y + 6, o.z - 8), V(o.x - sg * 3, top + 2.5, o.z + 0.5), perch.clone()], false, 'catmullrom', 0.5);
          o.state = 'fly'; o.t0 = T; o.dur = rnd(26, 36);
        }
      } else {
        const s2 = (T - o.t0) / o.dur;
        if (s2 >= 1) { o.state = 'sit'; o.nextFlight = T + rnd(70, 130); o.nextBlink = T + 2; }
        else {
          const e = 0.5 - 0.5 * Math.cos(Math.PI * s2), p = o.curve.getPoint(e), q = o.curve.getPoint(Math.min(1, e + 0.01));
          const w = 0.5 * clamp(camera.position.distanceTo(p) / 17, 0.6, 5);
          o.sp.position.copy(p); o.sp.scale.set(w * (q.x < p.x ? -1 : 1), w * 0.5, 1);
          o.sp.material.map = owlTex[Math.floor(T * 2.8) % 2];
        }
      }
    }
    fishBodyMat.color.copy(L); finMat.color.setRGB(0.97 * L.r, 0.6 * L.g, 0.25 * L.b);
    for (let i = fishes.length - 1; i >= 0; i--) {
      const f = fishes[i], u = f.userData; u.t += dt; const tt = u.t;
      f.position.set(u.x0 + u.vx * tt, WATER_Y + u.vy * tt - 0.5 * u.g * tt * tt, u.z0 + u.vz * tt);
      f.lookAt(f.position.x + u.vx, f.position.y + u.vy - u.g * tt, f.position.z + u.vz); f.rotateZ(Math.sin(tt * 9) * 0.35); u.tail.rotation.y = Math.sin(tt * 38) * 0.6;
      if (tt >= u.air) { addRipple(f.position.x, f.position.z, 0.9); splash(f.position.x, f.position.z, 10, 0.9); splashSound(0.12); scene.remove(f); fishes.splice(i, 1); }
    }
    for (let j = 0; j < MAXD; j++) if (dLife[j] > 0) {
      dLife[j] -= dt; dVel[j * 3 + 1] -= 6 * dt; dPos[j * 3] += dVel[j * 3] * dt; dPos[j * 3 + 1] += dVel[j * 3 + 1] * dt; dPos[j * 3 + 2] += dVel[j * 3 + 2] * dt;
      if (dLife[j] <= 0 || dPos[j * 3 + 1] < WATER_Y) { dLife[j] = 0; dPos[j * 3 + 1] = -50; }
    }
    dGeo.attributes.position.needsUpdate = true; dPts.material.opacity = 0.3 + 0.5 * dayF;
    if (anim && T > nextFish) { nextFish = T + rnd(8, 16); const a3 = Math.random() * 6.283, r3 = Math.sqrt(Math.random()) * 0.7; jumpFish(POND.x + Math.cos(a3) * POND.rx * r3, POND.z + Math.sin(a3) * POND.rz * r3); }
    if (anim && T > nextRip) { nextRip = T + rnd(2.5, 5); const a2 = Math.random() * 6.283, r2 = Math.sqrt(Math.random()) * 0.8; addRipple(POND.x + Math.cos(a2) * POND.rx * r2, POND.z + Math.sin(a2) * POND.rz * r2, 0.4); }
  }
  isNight = nightF > 0.5;
  for (let i = glowBugs.length - 1; i >= 0; i--) {
    const b = glowBugs[i], u = b.userData; u.t += dt;
    const w = u.t * u.sp + u.s;
    b.position.x += Math.cos(w * 1.3) * dt * 0.28; b.position.z += Math.sin(w) * dt * 0.28; b.position.y += (u.rise + Math.sin(w * 1.7) * 0.07) * dt;
    const fade = Math.min(1, u.t / 1.2, (u.life - u.t) / 2.5);
    b.material.opacity = Math.max(0, fade) * (0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(u.t * u.pulse * 2.2 + u.s)), 2)) * (0.4 + 0.6 * nightF);
    if (u.t >= u.life) { scene.remove(b); b.material.dispose(); glowBugs.splice(i, 1); }
  }
  const lt = new THREE.Vector3(mouseN.x * 5 * (react ? 1 : 0), 4.2 + mouseN.y * 2.5 * (react ? 1 : 0), -40);
  look.lerp(lt, 0.05); camera.lookAt(look);

  if (actx) {
    master.gain.setTargetAtTime(audible() ? parseFloat(vol.value) * 0.5 : 0, actx.currentTime, 0.4);
    if (audible()) {
      const inDawn = hr >= 5.5 && hr < 7.0, calm = cur.rain < 0.5;
      if (ffT > nextBird) {
        if (inDawn && calm) { dawnSong(0.085); nextBird = ffT + rnd(5, 8); }
        else if (dayF > 0.35 && calm) { chirp(0.085); nextBird = ffT + rnd(3.5, 7); }
        else nextBird = ffT + 3;
      }
      if (ffT > nextDrip) { ambientWater(); nextDrip = ffT + rnd(9, 18); }
      if (ffT > nextOwl) {
        if (nightF > 0.6 && !inDawn && calm) { hoot(0.14); nextOwl = ffT + rnd(28, 38); }
        else nextOwl = ffT + 5;
      }
    }
    windG.gain.value = (0.05 + 0.07 * cur.wind) * (0.4 + 0.6 * dayF); rustleG.gain.value = (0.008 + 0.012 * cur.wind) * (0.4 + 0.6 * dayF); rainG.gain.value = cur.rain * 0.06;
  }
  $('muteBtn').textContent = tSound.checked ? '🔊' : '🔇';

  needle.parentNode.setAttribute('transform', `translate(150,150) rotate(${hr / 24 * 160 - 80})`);
  if (frame++ % 8 === 0) {
    $('place').textContent = state.place || 'Locating…';
    const lbl = override === 'clear' ? 'Clear sky' : override === 'cloud' ? 'Overcast' : override === 'rain' ? 'Rain' : state.label;
    $('cond').textContent = override === 'day' && preview ? preview.name + ' · ' + preview.label + ' · ' + preview.hi + '°/' + preview.lo + '°' : lbl + (state.temp === null ? '' : ' · ' + state.temp + '°');
    $('moonInfo').style.whiteSpace = 'pre-line'; $('moonInfo').textContent = '🌅 ' + fmtHM(S.rise) + '  ·  🌇 ' + fmtHM(S.set) + '\n🌙 ' + moonState.name + ' · ' + moonState.pct + '% lit' + (elevM < 0 ? ' · below the horizon' : '');
    $('credit').textContent = 'Weather: ' + (state.source || '…');
    $('condIcon').textContent = cur.rain > 0.5 ? '🌧' : cur.cloud > 0.6 ? '☁️' : nightF > 0.5 ? '🌙' : '☀️';
    const hh = Math.floor(hr) % 24, mm = Math.floor((hr % 1) * 60);
    $('dialTime').textContent = ((hh % 12) || 12) + ':' + String(mm).padStart(2, '0') + ' ' + (hh >= 12 ? 'PM' : 'AM');
    $('dialLabel').textContent = dialHover || dragging ? 'Drag to explore' : hr < 5 || hr >= 20 ? 'Night' : hr < 7.5 ? 'Dawn' : hr < 11 ? 'Morning' : hr < 15 ? 'Midday' : hr < 17.5 ? 'Afternoon' : 'Evening';
  }

  {   // draw the sky, sun/moon and hills as seen from under the water, for the pond's reflection
    rcam.position.set(camera.position.x, 2 * WATER_Y - camera.position.y, camera.position.z); rcam.up.set(0, -1, 0);
    rcam.lookAt(look.x, 2 * WATER_Y - look.y, look.z);
    rcam.projectionMatrix.copy(camera.projectionMatrix); rcam.projectionMatrixInverse.copy(camera.projectionMatrixInverse); rcam.updateMatrixWorld();
    waterU.uTexMat.value.copy(biasM).multiply(rcam.projectionMatrix).multiply(rcam.matrixWorldInverse);
    renderer.clippingPlanes = [reflPlane]; renderer.setRenderTarget(reflRT); renderer.render(scene, rcam); renderer.setRenderTarget(null); renderer.clippingPlanes = [];
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
setTimeout(() => $('loading').remove(), 1200);
