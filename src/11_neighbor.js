/* ============================================================================
   11 — 邻里：右侧邻栋 / 后巷 / 背景住宅 / 围墙
   ========================================================================== */

const tvWindows = [];   // 电视蓝光闪烁窗

function windowTex(kind, hue) {
  return makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#12172a'; g.fillRect(0, 0, w, h);
    const warm = kind !== 'cool';
    const c1 = warm ? '#ffd79a' : '#a9d8ff';
    const c2 = warm ? '#e79a4e' : '#5f8fd0';
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(8, 8, w - 16, h - 16);
    // 窗帘
    g.fillStyle = 'rgba(255,246,230,0.85)';
    g.beginPath();
    g.moveTo(8, 8); g.lineTo(w - 8, 8); g.lineTo(w - 8, h * 0.72);
    g.quadraticCurveTo(w * 0.72, h * 0.6, w * 0.5, h * 0.78);
    g.quadraticCurveTo(w * 0.26, h * 0.62, 8, h * 0.75);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(160,120,80,0.25)';
    for (let i = 1; i < 6; i++) g.fillRect(8 + i * (w - 16) / 6, 8, 2, h - 16);
    // 窗框
    g.strokeStyle = '#3b4256'; g.lineWidth = 7;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w / 2, h - 4); g.stroke();
  });
}
/* 卷帘门 */
function shutterTex() {
  return makeTex(128, 256, (g, w, h) => {
    g.fillStyle = '#5d6472'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 12) {
      g.fillStyle = '#6c7382'; g.fillRect(0, y, w, 8);
      g.fillStyle = '#3f4553'; g.fillRect(0, y + 8, w, 4);
    }
    g.fillStyle = 'rgba(30,34,44,0.5)'; g.fillRect(0, h * 0.45, w, 6);
  }, { repeat: [1, 1] });
}
function corrugatedTex() {
  return makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#767d8c'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      g.fillStyle = '#8b92a1'; g.fillRect(x, 0, 8, h);
      g.fillStyle = '#616875'; g.fillRect(x + 8, 0, 4, h);
    }
    g.fillStyle = 'rgba(70,76,88,0.35)';
    for (let i = 0; i < 40; i++) g.fillRect(rr(0, w), rr(0, h), rr(2, 14), rr(1, 4));
  }, { repeat: [4, 1] });
}
function acUnit(parent, x, y, z, ry, s) {
  s = s || 1;
  const g = group({ parent: parent, x: x, y: y, z: z, ry: ry });
  const body = toon(0xd6dae2);
  box(0.86 * s, 0.62 * s, 0.34 * s, body, { parent: g, outline: true });
  box(0.92 * s, 0.10 * s, 0.40 * s, toon(0xa9b0bd), { parent: g, y: -0.30 * s, z: 0.02 });
  // 出风格栅
  const grill = new THREE.Mesh(new THREE.CircleGeometry(0.24 * s, 18), toon(0x353b49));
  grill.rotation.y = Math.PI / 2; grill.position.set(0.175 * s, 0.03 * s, 0); g.add(grill);
  const fan = group({ parent: g, x: 0.19 * s, y: 0.03 * s, z: 0 });
  for (let i = 0; i < 3; i++) {
    const b = box(0.02 * s, 0.4 * s, 0.055 * s, toon(0x59606f), { parent: fan, rz: i * 1.05 });
  }
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * s, 0.055 * s, 0.5 * s, 8), toon(0xbfc5cf));
  tube.rotation.z = Math.PI / 2; tube.position.set(-0.3 * s, -0.26 * s, 0.1 * s); g.add(tube);
  const flange = box(0.1 * s, 0.1 * s, 0.06 * s, toon(0x9aa1ad), { parent: g, x: -0.5 * s, y: -0.26 * s, z: 0.1 * s });
  updaters.push((dt) => { fan.rotation.x += dt * 7.5; });
  return g;
}
function drainPipe(parent, x, y, z, len, o) {
  o = o || {};
  const mat = toon(o.color == null ? 0x9aa1ad : o.color);
  const g = group({ parent: parent });
  const p = cyl(0.075, 0.075, len, 10, mat, { parent: g, x: x, y: y + len / 2, z: z, outline: true });
  cyl(0.09, 0.09, 0.09, 10, toon(0x878e9a), { parent: g, x: x, y: y + 0.35, z: z });
  cyl(0.09, 0.09, 0.09, 10, toon(0x878e9a), { parent: g, x: x, y: y + len - 0.5, z: z });
  // 落水口（弯头）
  const elbow = group({ parent: g, x: x, y: y, z: z + 0.16 });
  cyl(0.075, 0.075, 0.32, 10, mat, { parent: elbow, rx: Math.PI / 2, y: 0.06, z: 0.0 });
  return g;
}

function buildNeighborhood() {
  const N = LAY.NB;
  const brick = toonT(0xffffff, texRepeat(brickTex(), 2.4, 2.4), { color: 0x8e8b92 });
  const wall2 = toon(0x6e7484);
  const roofMat = toon(0x3a4154);
  const trim = toon(0x2f3646);

  /* ---------------- 右侧邻栋（两层小楼） ---------------- */
  const nb = group({});
  boxAt(N.x0, LAY.WALK_Y, N.z0, N.x1, LAY.WALK_Y + N.h, N.z1, brick, { outline: true, parent: nb });
  boxAt(N.x0 - 0.05, LAY.WALK_Y + N.h, N.z0 - 0.18, N.x1 + 0.18, LAY.WALK_Y + N.h + 0.5, N.z1 + 0.18, roofMat, { outline: true, parent: nb });
  boxAt(N.x0 - 0.12, LAY.WALK_Y + N.h - 0.28, N.z1 - 0.05, N.x1 + 0.12, LAY.WALK_Y + N.h + 0.06, N.z1 + 0.12, toon(0x9aa0ad), { parent: nb });
  boxAt(N.x0, LAY.WALK_Y + 3.15, N.z1 - 0.03, N.x1, LAY.WALK_Y + 3.4, N.z1 + 0.10, toon(0xcfc9bd), { parent: nb });
  // 一层：卷帘门商铺 + 小门
  const shut = signPlane(3.4, 2.2, shutterTex(), { lit: false, x: 9.9, y: LAY.WALK_Y + 1.15, z: N.z1 + 0.02, parent: nb });
  shut.material.color.setHex(0xdfe4ee);
  boxAt(9.9 - 1.78, LAY.WALK_Y + 2.2, N.z1, 9.9 + 1.78, LAY.WALK_Y + 2.5, N.z1 + 0.22, trim, { parent: nb, outline: true });
  boxAt(9.9 - 1.78, LAY.WALK_Y, N.z1, 9.9 + 1.78, LAY.WALK_Y + 0.09, N.z1 + 0.3, toon(0xb6bcc8), { parent: nb });
  // 店铺小门 + 踏步
  boxAt(7.0, LAY.WALK_Y, N.z1, 7.9, LAY.WALK_Y + 2.1, N.z1 + 0.06, toon(0x3d4454), { parent: nb, outline: true });
  boxAt(7.06, LAY.WALK_Y + 0.1, N.z1 + 0.06, 7.84, LAY.WALK_Y + 1.5, N.z1 + 0.10, toon(0x243049), { parent: nb });
  boxAt(6.9, LAY.WALK_Y, N.z1 + 0.02, 8.0, LAY.WALK_Y + 0.09, N.z1 + 0.44, toon(0xb6bcc8), { parent: nb });
  // 小竖招牌
  signPlane(0.62, 2.0, makeTex(80, 256, (g, w, h) => {
    g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b2453a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    txt(g, 'スナック', w / 2, h * 0.22, { size: 26, color: '#8d3b32' });
    txt(g, 'ゆ', w / 2, h * 0.50, { size: 44, color: '#b2453a' });
    txt(g, 'き', w / 2, h * 0.70, { size: 44, color: '#b2453a' });
    txt(g, '営業中', w / 2, h * 0.88, { size: 20, color: '#2f6f52' });
  }), { mul: 1.25, x: 6.35, y: LAY.WALK_Y + 3.0, z: N.z1 + 0.14, parent: nb });
  O(box(0.7, 2.06, 0.14, trim, { parent: nb, x: 6.35, y: LAY.WALK_Y + 3.0, z: N.z1 + 0.06 }));
  // 一层橱窗（暖光）
  signPlane(1.5, 1.0, windowTex('warm'), { mul: 1.5, x: 7.6, y: LAY.WALK_Y + 1.35, z: N.z1 + 0.035, parent: nb });
  boxAt(6.8, LAY.WALK_Y + 0.78, N.z1, 8.45, LAY.WALK_Y + 0.9, N.z1 + 0.10, toon(0xd8d2c6), { parent: nb });
  boxAt(6.8, LAY.WALK_Y + 1.8, N.z1, 8.45, LAY.WALK_Y + 1.94, N.z1 + 0.10, toon(0xd8d2c6), { parent: nb });
  // 二层窗
  signPlane(1.5, 1.15, windowTex('warm'), { mul: 1.35, x: 7.5, y: LAY.WALK_Y + 4.6, z: N.z1 + 0.035, parent: nb });
  const w2t = windowTex('warm');
  const w2 = signPlane(1.5, 1.15, w2t, { mul: 1.1, x: 10.6, y: LAY.WALK_Y + 4.6, z: N.z1 + 0.035, parent: nb });
  tvWindows.push({ mat: w2.material, base: 1.0, speed: 3.4, amp: 0.42 });
  [7.5, 10.6].forEach((wx) => {
    boxAt(wx - 0.86, LAY.WALK_Y + 3.95, N.z1, wx + 0.86, LAY.WALK_Y + 4.06, N.z1 + 0.12, toon(0xd8d2c6), { parent: nb });
    boxAt(wx - 0.86, LAY.WALK_Y + 5.16, N.z1, wx + 0.86, LAY.WALK_Y + 5.30, N.z1 + 0.12, toon(0xd8d2c6), { parent: nb });
    boxAt(wx - 0.92, LAY.WALK_Y + 4.02, N.z1, wx - 0.84, LAY.WALK_Y + 5.24, N.z1 + 0.12, toon(0xd8d2c6), { parent: nb });
    boxAt(wx + 0.84, LAY.WALK_Y + 4.02, N.z1, wx + 0.92, LAY.WALK_Y + 5.24, N.z1 + 0.12, toon(0xd8d2c6), { parent: nb });
  });
  // 二层外机 + 晾衣杆
  acUnit(nb, 9.0, LAY.WALK_Y + 3.7, N.z1 + 0.28, 0, 0.95);
  boxAt(6.6, LAY.WALK_Y + 5.5, N.z1 + 0.16, 11.4, LAY.WALK_Y + 5.58, N.z1 + 0.22, toon(0xb9bfca), { parent: nb });
  cylBetween(new THREE.Vector3(6.7, LAY.WALK_Y + 5.5, N.z1 + 0.19), new THREE.Vector3(6.7, LAY.WALK_Y + 5.9, N.z1 + 0.19), 0.03, toon(0xb9bfca), nb);
  cylBetween(new THREE.Vector3(11.3, LAY.WALK_Y + 5.5, N.z1 + 0.19), new THREE.Vector3(11.3, LAY.WALK_Y + 5.9, N.z1 + 0.19), 0.03, toon(0xb9bfca), nb);
  // 晾着的布（微动）
  const cloth = box(0.9, 0.7, 0.02, toon(0xd9e2ee), { parent: nb, x: 9.6, y: LAY.WALK_Y + 5.12, z: N.z1 + 0.2 });
  updaters.push((dt, t) => { cloth.rotation.z = Math.sin(t * 0.9) * 0.06; });
  // 落水管与配电箱
  drainPipe(nb, N.x1 - 0.28, LAY.WALK_Y, N.z1 - 0.1, N.h - 0.4, {});
  boxAt(N.x1 - 0.75, LAY.WALK_Y + 2.2, N.z1 - 0.12, N.x1 - 0.35, LAY.WALK_Y + 2.9, N.z1 + 0.02, toon(0xb3b9c4), { parent: nb, outline: true });
  // 屋顶水箱 + 天线
  const tank = cyl(1.0, 1.0, 1.5, 14, toon(0xa9b0bc), { parent: nb, x: 10.0, y: LAY.WALK_Y + N.h + 1.35, z: -1.2, outline: true });
  cyl(1.05, 1.05, 0.12, 14, toon(0x8f96a2), { parent: nb, x: 10.0, y: LAY.WALK_Y + N.h + 2.14, z: -1.2 });
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach((o) => {
    boxAt(10.0 + o[0] - 0.05, LAY.WALK_Y + N.h + 0.5, -1.2 + o[1] - 0.05, 10.0 + o[0] + 0.05, LAY.WALK_Y + N.h + 0.62, -1.2 + o[1] + 0.05, toon(0x8f96a2), { parent: nb });
  });
  [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach((o) => {
    cylBetween(new THREE.Vector3(10.0 + o[0], LAY.WALK_Y + N.h + 0.6, -1.2 + o[1]),
      new THREE.Vector3(10.0 + o[0] * 0.62, LAY.WALK_Y + N.h + 1.02, -1.2 + o[1] * 0.62), 0.04, toon(0x8f96a2), nb, 6);
  });
  const ant = group({ parent: nb, x: 8.4, y: LAY.WALK_Y + N.h + 0.5, z: -4.0 });
  cyl(0.035, 0.045, 2.2, 6, toon(0x9aa1ad), { parent: ant, y: 1.1 });
  for (let i = 0; i < 4; i++) {
    box(0.02, 0.02, 1.4 - i * 0.24, toon(0x9aa1ad), { parent: ant, y: 1.5 + i * 0.2, rx: 0.0, ry: 0 });
  }
  // 店门口吊灯 + 暖光
  cyl(0.05, 0.05, 0.22, 8, toon(0x3b4252), { parent: nb, x: 7.45, y: LAY.WALK_Y + 2.55, z: N.z1 + 0.34 });
  cyl(0.17, 0.12, 0.22, 12, emit(0xffcf94, 1.7), { parent: nb, x: 7.45, y: LAY.WALK_Y + 2.32, z: N.z1 + 0.34, outline: true });
  boxAt(6.6, LAY.WALK_Y + 2.62, N.z1 + 0.02, 8.3, LAY.WALK_Y + 2.7, N.z1 + 0.62, toon(0x3b4252), { parent: nb, outline: true });
  const npl = new THREE.PointLight(0xffc98a, 0.9, 7, 2);
  npl.position.set(7.45, LAY.WALK_Y + 2.25, N.z1 + 0.5);
  scene.add(npl);
  // 霓虹灯管（邻栋外墙，粉紫色）
  const neon = emit(0xff8fb0, 2.0);
  boxAt(N.x0 + 0.5, LAY.WALK_Y + 2.5, N.z1 + 0.03, N.x0 + 0.62, LAY.WALK_Y + 4.6, N.z1 + 0.12, neon, { parent: nb });
  boxAt(N.x0 + 0.5, LAY.WALK_Y + 4.5, N.z1 + 0.03, N.x0 + 1.9, LAY.WALK_Y + 4.62, N.z1 + 0.12, neon, { parent: nb });
  boxAt(N.x0 + 1.78, LAY.WALK_Y + 2.9, N.z1 + 0.03, N.x0 + 1.9, LAY.WALK_Y + 4.62, N.z1 + 0.12, neon, { parent: nb });
  const nsp = new THREE.Sprite(addMat(glowTex(), 0xff8fb0, 0.42));
  nsp.scale.set(3.2, 4.2, 1);
  nsp.position.set(N.x0 + 1.2, LAY.WALK_Y + 3.5, N.z1 + 0.4);
  scene.add(nsp);
  emitters.push({ x: N.x0 + 1.2, z: N.z1 + 0.3, y: LAY.WALK_Y + 0.01, color: 0xff8fb0, len: 5.0, wid: 1.1, op: 0.34 });
  emitters.push({ x: N.x0 + 1.2, z: LAY.RA_Z0 + 0.5, y: LAY.ROAD_Y + 0.01, color: 0xff8fb0, len: 7.5, wid: 1.3, op: 0.26 });
  flickerList.push({ mats: [neon], base: 2.0, min: 1.2, rate: 0.5 });
  // 屋顶护栏
  for (let x = N.x0 + 0.3; x < N.x1; x += 1.4) {
    cyl(0.03, 0.03, 0.6, 6, toon(0x8f96a2), { parent: nb, x: x, y: LAY.WALK_Y + N.h + 0.8, z: N.z1 - 0.3 });
  }
  boxAt(N.x0 + 0.3, LAY.WALK_Y + N.h + 1.05, N.z1 - 0.34, N.x1, LAY.WALK_Y + N.h + 1.10, N.z1 - 0.26, toon(0x8f96a2), { parent: nb });

  /* ---------------- 便利店右侧后巷 ---------------- */
  const A = LAY.ALLEY;
  const alleyFloor = toon(0x8c919e);
  boxAt(A.x0, LAY.WALK_Y, A.z0, A.x1, LAY.WALK_Y + 0.012, LAY.z1, alleyFloor);
  // 巷子中央排水槽
  boxAt(A.x0 + 0.62, LAY.WALK_Y - 0.05, A.z0, A.x0 + 0.9, LAY.WALK_Y + 0.008, A.z1, toon(0x6d7380));
  const grateA = toonT(0xffffff, gridGrateTex(), { color: 0x8d94a1 });
  for (let z = A.z0 + 0.4; z < A.z1 - 0.4; z += 0.62) {
    boxAt(A.x0 + 0.6, LAY.WALK_Y - 0.006, z, A.x0 + 0.92, LAY.WALK_Y + 0.012, z + 0.5, grateA);
  }
  // 便利店侧墙上的外机 / 管道 / 电表
  acUnit(scene, A.x0 + 0.28, LAY.WALK_Y + 0.45, -1.4, Math.PI / 2, 1.0);
  acUnit(scene, A.x0 + 0.28, LAY.WALK_Y + 2.3, 0.4, Math.PI / 2, 1.0);
  drainPipe(scene, A.x0 + 0.14, LAY.WALK_Y, 2.4, 3.1, {});
  drainPipe(scene, A.x0 + 0.14, LAY.WALK_Y, -4.2, 3.1, {});
  boxAt(A.x0 + 0.02, LAY.WALK_Y + 1.5, -3.0, A.x0 + 0.14, LAY.WALK_Y + 2.1, -2.4, toon(0xb3b9c4), { outline: true });
  // 后门（员工出入口）
  boxAt(A.x0 + 0.02, LAY.WALK_Y, 3.6, A.x0 + 0.10, LAY.WALK_Y + 2.05, 4.6, toon(0x505a6e), { outline: true });
  boxAt(A.x0 + 0.10, LAY.WALK_Y + 0.15, 3.72, A.x0 + 0.14, LAY.WALK_Y + 1.55, 4.48, toon(0x2b3243));
  cyl(0.05, 0.05, 0.14, 8, toon(0xb9bfca), { x: A.x0 + 0.2, y: LAY.WALK_Y + 1.0, z: 4.36, rz: Math.PI / 2 });
  // 后门小灯（暖光）
  const backLamp = emit(0xffd9a0, 2.0);
  boxAt(A.x0 + 0.02, LAY.WALK_Y + 2.15, 4.0, A.x0 + 0.22, LAY.WALK_Y + 2.3, 4.2, toon(0x3b4252));
  const bl = cyl(0.09, 0.11, 0.1, 10, backLamp, { x: A.x0 + 0.2, y: LAY.WALK_Y + 2.12, z: 4.1 });
  // 巷内墙灯（荧光灯管，闪）
  const tubeMat = emit(0xdff0ff, 1.6);
  const tube = box(0.98, 0.07, 0.1, tubeMat, { x: A.x1 - 0.28, y: LAY.WALK_Y + 2.55, z: 1.2, ry: Math.PI / 2 });
  boxAt(A.x1 - 0.4, LAY.WALK_Y + 2.5, 0.62, A.x1 - 0.1, LAY.WALK_Y + 2.68, 1.78, toon(0x535a6a));
  flickerList.push({ mats: [tubeMat], base: 1.6, min: 0.06, rate: 0.9, hard: true });
  flickerList.push({ mats: [backLamp], base: 2.0, min: 1.1, rate: 0.25 });
  // 啤酒筐 / 水桶 / 拖把 / 旧冰箱
  const crate = toon(0xcf5a4a);
  boxAt(A.x1 - 1.25, LAY.WALK_Y, -1.9, A.x1 - 0.35, LAY.WALK_Y + 0.34, -1.0, crate, { outline: true });
  boxAt(A.x1 - 1.2, LAY.WALK_Y + 0.34, -1.85, A.x1 - 0.4, LAY.WALK_Y + 0.66, -1.05, toon(0x4a7fc1), { outline: true });
  boxAt(A.x1 - 1.15, LAY.WALK_Y + 0.66, -1.8, A.x1 - 0.45, LAY.WALK_Y + 0.96, -1.1, toon(0x5fa86f), { outline: true });
  cyl(0.19, 0.16, 0.34, 12, toon(0x6f7686), { x: A.x1 - 0.6, y: LAY.WALK_Y + 0.17, z: -0.2, outline: true });
  cylBetween(new THREE.Vector3(A.x1 - 0.35, LAY.WALK_Y + 0.9, -2.4), new THREE.Vector3(A.x1 - 0.15, LAY.WALK_Y, -2.6), 0.025, toon(0xb08a5a), scene, 6);
  boxAt(A.x1 - 0.95, LAY.WALK_Y + 0.9, -2.9, A.x1 - 0.35, LAY.WALK_Y + 1.05, -2.5, toon(0x8a8f9a));
  const oldFridge = boxAt(A.x1 - 1.5, LAY.WALK_Y, 2.2, A.x1 - 0.55, LAY.WALK_Y + 1.15, 3.0, toon(0xb9bcc4), { outline: true });
  boxAt(A.x1 - 1.45, LAY.WALK_Y + 0.35, 2.14, A.x1 - 0.6, LAY.WALK_Y + 1.1, 3.05, toon(0xd9dce2));
  // 巷口铁链与"立入禁止"牌
  const post1 = cyl(0.04, 0.04, 0.85, 8, toon(0x9aa1ad), { x: A.x0 + 0.35, y: LAY.WALK_Y + 0.42, z: A.z1 - 0.15, outline: true });
  const post2 = cyl(0.04, 0.04, 0.85, 8, toon(0x9aa1ad), { x: A.x1 - 0.35, y: LAY.WALK_Y + 0.42, z: A.z1 - 0.15, outline: true });
  const chain = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    chain.push(new THREE.Vector3(lerp(A.x0 + 0.35, A.x1 - 0.35, t), LAY.WALK_Y + 0.8 - Math.sin(t * Math.PI) * 0.12, A.z1 - 0.15));
  }
  const chainGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chain), 12, 0.018, 5, false);
  scene.add(new THREE.Mesh(chainGeo, toon(0x8b92a0)));
  const signNo = signPlane(0.66, 0.44, makeTex(128, 88, (g, w, h) => {
    g.fillStyle = '#f8f5ee'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c0392b'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
    txt(g, '立入禁止', w / 2, h / 2, { size: 30, color: '#c0392b' });
  }), { mul: 1.2, x: (A.x0 + A.x1) / 2, y: LAY.WALK_Y + 0.95, z: A.z1 - 0.15 });
  signNo.rotation.y = Math.PI;

  /* ---------------- 背后住宅区 ---------------- */
  function backBuilding(x0, x1, z0, z1, h, o) {
    o = o || {};
    const wallM = toon(o.color == null ? 0x767c8c : o.color);
    const g = group({});
    boxAt(x0, LAY.WALK_Y, z0, x1, LAY.WALK_Y + h, z1, wallM, { outline: true, parent: g });
    boxAt(x0 - 0.14, LAY.WALK_Y + h, z0 - 0.14, x1 + 0.14, LAY.WALK_Y + h + 0.42, z1 + 0.14, toon(0x3a4154), { outline: true, parent: g });
    boxAt(x0 - 0.2, LAY.WALK_Y + h + 0.42, z0 - 0.2, x1 + 0.2, LAY.WALK_Y + h + 0.56, z1 + 0.2, toon(0x2f3646), { parent: g });
    // 背面窗户（避免背后一片空白）
    for (let i = 0; i < 2; i++) {
      const wx2 = lerp(x0 + 1.4, x1 - 1.4, i);
      const lit2 = rnd() < 0.55;
      if (lit2) {
        const wm2 = windowTex(rnd() < 0.3 ? 'cool' : 'warm');
        const p2 = signPlane(0.96, 0.8, wm2, { mul: rr(0.85, 1.25), x: wx2, y: LAY.WALK_Y + 1.2 + (rnd() < 0.5 ? 2.6 : 0), z: z0 - 0.03, ry: Math.PI, parent: g });
        if (rnd() < 0.3) tvWindows.push({ mat: p2.material, base: 1.0, speed: rr(2.0, 4.5), amp: 0.4 });
      } else {
        boxAt(wx2 - 0.48, LAY.WALK_Y + 1.6, z0 - 0.05, wx2 + 0.48, LAY.WALK_Y + 1.78, z0 - 0.01, toon(0x5b6272), { parent: g });
      }
    }
    // 屋顶水箱与排气管
    cyl(0.3, 0.3, 0.8, 10, toon(0x8d93a0), { x: (x0 + x1) / 2 + 1, y: LAY.WALK_Y + h + 0.9, z: (z0 + z1) / 2, outline: true });
    cyl(0.09, 0.09, 0.7, 8, toon(0x7d8492), { x: (x0 + x1) / 2 - 1.4, y: LAY.WALK_Y + h + 0.85, z: (z0 + z1) / 2 + 0.6 });
    boxAt(x0 + 0.4, LAY.WALK_Y + h + 0.42, z0 + 0.5, x1 - 0.4, LAY.WALK_Y + h + 1.0, z0 + 0.56, toon(0x8d93a0), { parent: g });
    const nf = o.floors || 2;
    for (let f = 0; f < nf; f++) {
      const wy = LAY.WALK_Y + 1.1 + f * 2.6;
      const count = Math.max(2, Math.floor((x1 - x0) / 2.2));
      for (let i = 0; i < count; i++) {
        const wx = lerp(x0 + 1.1, x1 - 1.1, count === 1 ? 0.5 : i / (count - 1));
        const lit = rnd() < (o.lit == null ? 0.4 : o.lit);
        if (lit) {
          const wm = windowTex(rnd() < 0.25 ? 'cool' : 'warm');
          const p = signPlane(1.0, 0.82, wm, { mul: rr(0.9, 1.4), x: wx, y: wy, z: z1 + 0.03, parent: g });
          if (rnd() < 0.3) tvWindows.push({ mat: p.material, base: 1.0, speed: rr(2.0, 4.5), amp: 0.4 });
        } else {
          boxAt(wx - 0.5, wy - 0.41, z1, wx + 0.5, wy + 0.41, z1 + 0.04, toon(0x2c3446), { parent: g });
        }
        boxAt(wx - 0.56, wy - 0.47, z1 + 0.02, wx + 0.56, wy + 0.47, z1 + 0.07, toon(0x5b6272), { parent: g });
      }
    }
    return g;
  }
  backBuilding(-6.4, 0.2, -12.9, -7.4, 5.6, { color: 0x7b8291, lit: 0.35 });
  backBuilding(0.8, 6.2, -12.9, -8.2, 7.4, { color: 0x6d7484, lit: 0.45, floors: 2 });
  backBuilding(6.6, 12.5, -12.9, -8.0, 4.6, { color: 0x828896, lit: 0.3, floors: 2 });
  // 屋顶杂物，丰富天际线
  cyl(0.42, 0.42, 1.0, 12, toon(0x9aa1ad), { x: 4.6, y: LAY.WALK_Y + 7.4 + 0.9, z: -10.4, outline: true });
  boxAt(-3.0, LAY.WALK_Y + 5.6, -11.6, -1.6, LAY.WALK_Y + 6.5, -10.4, toon(0x8d93a0), { outline: true });
  boxAt(9.0, LAY.WALK_Y + 4.6, -11.4, 10.4, LAY.WALK_Y + 5.5, -10.2, toon(0x8d93a0), { outline: true });

  /* ---------------- 便利店背后的围墙与小院 ---------------- */
  const fenceMat = toonT(0xffffff, corrugatedTex(), { color: 0x99a0ad });
  const S = LAY.STORE;
  boxAt(-6.4, LAY.WALK_Y, -6.6, 6.5, LAY.WALK_Y + 1.9, -6.5, fenceMat, { outline: true });
  boxAt(-6.4, LAY.WALK_Y + 1.9, -6.68, 6.5, LAY.WALK_Y + 2.02, -6.42, toon(0x8d93a0));
  for (let x = -6.2; x < 6.5; x += 2.2) {
    boxAt(x, LAY.WALK_Y, -6.72, x + 0.12, LAY.WALK_Y + 2.0, -6.5, toon(0x878e9a));
  }
  acUnit(scene, 1.6, LAY.WALK_Y + 0.42, -6.1, 0, 1.05);
  acUnit(scene, 2.9, LAY.WALK_Y + 0.42, -6.1, 0, 0.9);
  drainPipe(scene, -6.0, LAY.WALK_Y, -6.35, 2.0, {});
  boxAt(-1.2, LAY.WALK_Y, -6.2, -0.2, LAY.WALK_Y + 1.3, -5.5, toon(0xa9b0bc), { outline: true });   // 旧冰柜
  boxAt(-5.6, LAY.WALK_Y, -5.6, -4.9, LAY.WALK_Y + 1.6, -5.0, toon(0x8d93a0), { outline: true });    // 杂物箱
}

