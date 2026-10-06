/* ============================================================================
   40 — 天气：持续降雨 / 雨滴涟漪 / 檐口滴水 / 湿路面反射光带 / 排水沟水流 / 雾气
   ========================================================================== */

const RAIN_TEX = rainTex();
const RING_TEX = ringTex();
const REFL_TEX = reflTex();
const streaks = [];
const dynamicStreaks = {};
const ripples = [];
const drips = [];
const rainLayers = [];
const waterFx = [];

/* ------------------------------------------------------------ 反射光带 */
function buildStreaks() {
  emitters.forEach((e, idx) => {
    const mat = addMat(REFL_TEX, new THREE.Color(e.color), e.op == null ? 0.45 : e.op);
    mat.depthTest = true;
    const geo = new THREE.PlaneGeometry(e.wid * (e.wk == null ? 1 : e.wk), e.len * (e.lk == null ? 1 : e.lk));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, e.len * (e.lk == null ? 1 : e.lk) / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(e.x, e.y + 0.012, e.z);
    m.renderOrder = 4;
    m.frustumCulled = false;
    scene.add(m);
    const sk = {
      m: m, mat: mat, x: e.x, z: e.z, base: e.op == null ? 0.45 : e.op,
      seed: rr(0, 10), sway: rr(0.9, 1.3), flick: e.flick || null, color: new THREE.Color(e.color), k: e.k == null ? 1 : e.k
    };
    streaks.push(sk);
    if (e.dynamic) dynamicStreaks[e.dynamic] = sk;
  });
  // 灯下地面柔光池（近地小亮斑）
  const pools = [
    [-1.2, 5.0, 6.4, 2.6, 0xffd9a0, 0.26], [-1.4, 4.6, 3.6, 2.0, 0xffe0b0, 0.30],
    [6.75, 5.9, 2.4, 1.2, 0xffb877, 0.30], [7.95, 5.9, 2.4, 1.2, 0x8fd4ff, 0.30],
    [-6.28 - 1.6, 1.4, 3.4, 2.4, 0xbfe0ff, 0.24], [-6.28 - 1.6, -6.4, 3.4, 2.4, 0xbfe0ff, 0.22]
  ];
  pools.forEach((p) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p[2], p[3]), addMat(glowTex(), p[4], p[5]));
    m.rotation.x = -Math.PI / 2;
    m.position.set(p[0], surfY(p[0], p[1]) + 0.011, p[1]);
    m.renderOrder = 4;
    scene.add(m);
  });
}

/* ------------------------------------------------------------ 雨 */
function makeRain(count, area, top, yMin, speedLo, speedHi, size, opacity, tint) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const spd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = rr(-area, area);
    pos[i * 3 + 1] = rr(yMin, top);
    pos[i * 3 + 2] = rr(-area, area);
    spd[i] = rr(speedLo, speedHi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: size, map: RAIN_TEX, transparent: true, opacity: opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
    sizeAttenuation: true, color: tint || 0xa9c6ff
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  scene.add(pts);
  rainLayers.push({ geo: geo, spd: spd, count: count, top: top, yMin: yMin, area: area });
  return pts;
}
function buildRain() {
  makeRain(1900, 16.5, 17, -1.0, 11, 15, 1.15, 0.27, 0x9fbcf5);
  makeRain(850, 12.5, 12, -1.0, 14, 19, 2.1, 0.17, 0xbcd4ff);
  makeRain(320, 8.5, 9, -1.0, 17, 24, 2.5, 0.09, 0xd6e6ff);
}

/* ------------------------------------------------------------ 涟漪 */
function buildRipples() {
  for (let i = 0; i < 56; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addMat(RING_TEX, 0xd8ecff, 0.0));
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    m.renderOrder = 5;
    scene.add(m);
    ripples.push({ m: m, life: 1 + rnd(), dur: rr(0.55, 0.95), size: rr(0.4, 1.1) });
  }
}
function spawnRipple(x, y, z, power) {
  for (let i = 0; i < ripples.length; i++) {
    const r = ripples[i];
    if (r.life >= 1) {
      r.life = 0;
      r.dur = rr(0.5, 0.9) / (power || 1);
      r.size = rr(0.34, 0.9) * (power || 1);
      r.m.position.set(x, y + 0.014, z);
      r.m.visible = true;
      return;
    }
  }
}
function updateRipples(dt) {
  for (let i = 0; i < ripples.length; i++) {
    const r = ripples[i];
    if (r.life >= 1) { if (r.m.visible) r.m.visible = false; continue; }
    r.life += dt / r.dur;
    const t = Math.min(r.life, 1);
    const s = 0.06 + t * r.size;
    r.m.scale.set(s, s, 1);
    r.m.material.opacity = 0.5 * Math.pow(1 - t, 1.7);
  }
}
let rippleTimer = 0;
function rippleSpawner(dt) {
  rippleTimer -= dt;
  if (rippleTimer <= 0) {
    rippleTimer = rr(0.012, 0.045);
    const n = ri(1, 3);
    for (let i = 0; i < n; i++) {
      const s = pick(wetSpots);
      if (!s) continue;
      const ang = rr(0, TAU), rad = Math.sqrt(rnd()) * s.r;
      spawnRipple(s.x + Math.cos(ang) * rad, s.y, s.z + Math.sin(ang) * rad, s.weight > 1 ? 1.15 : 0.75);
    }
  }
}

/* ------------------------------------------------------------ 檐口滴水 */
function buildDrips() {
  const srcs = [
    { x: -4.4, y: 2.52, z: 5.72, n: 3 }, { x: -2.0, y: 2.52, z: 5.72, n: 3 },
    { x: 0.6, y: 2.52, z: 5.72, n: 3 }, { x: 3.4, y: 2.52, z: 5.72, n: 3 },
    { x: -4.62, y: 2.52, z: 2.0, n: 2 }, { x: -4.62, y: 2.52, z: 3.6, n: 2 },
    { x: 5.4, y: 8.6, z: 5.95, n: 1 }
  ];
  const list = [];
  srcs.forEach((s) => {
    for (let i = 0; i < s.n; i++) list.push({ x: s.x + rr(-0.6, 0.6), y: s.y, z: s.z + rr(-0.12, 0.12) });
  });
  const count = list.length;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const st = [];
  for (let i = 0; i < count; i++) {
    const s = list[i];
    pos[i * 3] = s.x; pos[i * 3 + 1] = s.y; pos[i * 3 + 2] = s.z;
    st.push({ s: s, y: s.y, v: 0, delay: rr(0, 1.6), x: s.x, z: s.z, landed: false });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.085, map: glowTex(), color: 0xcfe4ff, transparent: true,
    opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 8;
  scene.add(pts);
  drips.push({ geo: geo, st: st, count: count });
}
function updateDrips(dt) {
  for (let d = 0; d < drips.length; d++) {
    const sys = drips[d];
    const a = sys.geo.attributes.position.array;
    for (let i = 0; i < sys.count; i++) {
      const st = sys.st[i];
      if (st.delay > 0) { if (st.delay < 1) a[i * 3 + 1] = st.s.y + 40; st.delay -= dt; continue; }
      st.v += 13 * dt;
      st.y -= st.v * dt;
      a[i * 3] = st.x; a[i * 3 + 1] = st.y; a[i * 3 + 2] = st.z;
      const gy = surfY(st.x, st.z);
      if (st.y <= gy) {
        spawnRipple(st.x, gy, st.z, 0.8);
        st.y = st.s.y; st.v = 0; st.delay = rr(0.5, 2.4);
        st.x = st.s.x + rr(-0.7, 0.7);
        st.z = st.s.z + rr(-0.3, 0.3);
      }
    }
    sys.geo.attributes.position.needsUpdate = true;
  }
}

/* ------------------------------------------------------------ 水管喷水 */
function waterGush(x, y, z, len) {
  // 破口管子
  const stub = cyl(0.055, 0.055, 0.34, 8, toon(0x9aa1ad), { x: x - 0.17, y: y + 0.02, z: z, rz: Math.PI / 2, outline: true });
  boxAt(x - 0.34, y - 0.09, z - 0.09, x - 0.30, y + 0.13, z + 0.09, toon(0x8d94a1));
  cyl(0.07, 0.05, 0.08, 8, toon(0x878e9a), { x: x - 0.02, y: y + 0.02, z: z, rz: Math.PI / 2 });
  const t = makeTex(32, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(220,240,255,0.85)');
    grd.addColorStop(0.5, 'rgba(190,225,255,0.55)');
    grd.addColorStop(1, 'rgba(200,230,255,0.85)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 22; i++) g.fillRect(rr(0, w), rr(0, h), rr(1, 3), rr(6, 26));
  }, { repeat: [1, 3] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.1, len), addMat(t, 0xd8eeff, 0.55));
  m.position.set(x, y - len / 2, z);
  m.renderOrder = 7;
  scene.add(m);
  const m2 = m.clone();
  m2.rotation.y = Math.PI / 2;
  scene.add(m2);
  updaters.push((dt) => { t.offset.y -= dt * 1.33; });
  // 落点水花
  updaters.push((dt) => {
    if (rnd() < dt * 26) spawnRipple(x + rr(-0.12, 0.12), surfY(x, z), z + rr(-0.12, 0.12), 1.25);
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.5, 18), addMat(glowTex(), 0xbfe0ff, 0.28));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, surfY(x, z) + 0.013, z);
  pool.renderOrder = 4;
  scene.add(pool);
  emitters.push({ x: x, z: z, y: surfY(x, z) + 0.01, color: 0x9fd0ff, len: 2.4, wid: 0.6, op: 0.35 });
}

/* ------------------------------------------------------------ 排水沟水流 */
function buildGutterFlow() {
  const t = makeTex(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = 'rgba(190,220,255,' + rr(0.05, 0.3).toFixed(2) + ')';
      g.fillRect(rr(0, w), rr(0, h), rr(4, 26), rr(1, 3));
    }
  }, { repeat: [4, 1] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(LAY.B - (LAY.RB_X1 + 1.3), 0.5), addMat(t, 0xa8ccff, 0.3));
  m.rotation.x = -Math.PI / 2;
  m.position.set((LAY.RB_X1 + 1.3 + LAY.B) / 2, LAY.ROAD_Y + 0.008, LAY.RA_Z0 - 0.53);
  m.renderOrder = 5;
  scene.add(m);
  const t2 = t.clone();
  t2.needsUpdate = true;
  const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, LAY.RA_Z0 - 1.3 + LAY.B), addMat(t2, 0xa8ccff, 0.26));
  m2.rotation.x = -Math.PI / 2;
  m2.position.set(LAY.RB_X1 + 0.55, LAY.ROAD_Y + 0.008, (LAY.RA_Z0 - 1.3 - LAY.B) / 2);
  m2.renderOrder = 5;
  scene.add(m2);
  updaters.push((dt) => { t.offset.x -= dt * 0.22; t2.offset.y -= dt * 0.22; });
  waterFx.push({ t: t, t2: t2 });
}

/* ------------------------------------------------------------ 低空水雾 */
function buildMist() {
  const mat = addMat(glowTex(), 0x8fb0e0, 0.03, { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const w = rr(6, 14);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), mat.clone());
    m.position.set(rr(-12, 12), rr(0.5, 1.8), rr(-12, 12));
    m.renderOrder = 9;
    scene.add(m);
    const base = rr(0.012, 0.03);
    updaters.push((dt, t) => {
      m.position.x += dt * 0.08;
      if (m.position.x > 13) m.position.x = -13;
      m.material.opacity = base * (0.7 + 0.3 * Math.sin(t * 0.4 + m.position.z));
      m.lookAt(m.position.x + 0.1, m.position.y, 30);
    });
  }
}

/* ------------------------------------------------------------ 统一更新 */
function buildWeather() {
  buildRain();
  buildRipples();
  buildDrips();
  buildGutterFlow();
  buildMist();
  // 后巷破管喷水（在生成反射光带之前注册发光体）
  waterGush(LAY.ALLEY.x0 + 0.22, LAY.WALK_Y + 2.62, -4.18, 2.4);
  buildStreaks();
}
function updateWeather(dt, t) {
  // 雨
  for (let l = 0; l < rainLayers.length; l++) {
    const L = rainLayers[l];
    const a = L.geo.attributes.position.array;
    for (let i = 0; i < L.count; i++) {
      a[i * 3 + 1] -= L.spd[i] * dt;
      a[i * 3] -= L.spd[i] * dt * 0.10;
      if (a[i * 3 + 1] < L.yMin) {
        a[i * 3 + 1] = L.top;
        a[i * 3] = rr(-L.area, L.area);
        a[i * 3 + 2] = rr(-L.area, L.area);
      }
      if (a[i * 3] < -L.area) a[i * 3] = L.area;
    }
    L.geo.attributes.position.needsUpdate = true;
  }
  updateRipples(dt);
  rippleSpawner(dt);
  updateDrips(dt);
  // 反射光带朝向相机
  for (let i = 0; i < streaks.length; i++) {
    const s = streaks[i];
    s.m.rotation.y = Math.atan2(camera.position.x - s.x, camera.position.z - s.z);
    const sh = 0.82 + 0.18 * Math.sin(t * s.sway + s.seed * 3.1) * Math.sin(t * 0.7 + s.seed);
    s.mat.opacity = s.base * sh * (s.k || 1);
  }
}
