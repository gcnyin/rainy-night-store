/* ============================================================================
   20 — 便利店：外壳 / 玻璃幕 / 自动门 / 雨棚 / 招牌 / 店内全陈设
   ========================================================================== */

const S = LAY.STORE;
const FLOOR_Y = LAY.WALK_Y + 0.05;         // 店内地面
const CEIL_Y = FLOOR_Y + 2.55;             // 店内天花
const ROOF_Y = LAY.WALK_Y + S.h;           // 屋顶结构面
const WALL_T = 0.2;

const doorState = { open: 0, mode: 'idle', t: 6, panels: [] };
const storeGroup = new THREE.Group();
const interiorGroup = new THREE.Group();
const signFlicker = { mats: [], sprites: [], streaks: [], base: 1.0 };

/* ------------------------------------------------------------ 小店招牌 */
function brandBandTex(w, h, sub) {
  return makeTex(w, h, (g, W, H) => {
    g.fillStyle = '#fbf9f5'; g.fillRect(0, 0, W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(1, 'rgba(226,232,240,0.9)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f9e63'; g.fillRect(W * 0.012, H * 0.80, W * 0.09, H * 0.13);
    g.fillStyle = '#f4802c'; g.fillRect(W * 0.108, H * 0.80, W * 0.09, H * 0.13);
    g.fillStyle = '#d94436'; g.fillRect(W * 0.204, H * 0.80, W * 0.09, H * 0.13);
    txt(g, 'ひかりマート', W * 0.36, H * 0.46, { size: H * 0.40, color: '#1f3a86' });
    txt(g, 'HIKARI MART', W * 0.72, H * 0.40, { size: H * 0.17, color: '#5a6a86', spacing: 3 });
    if (sub !== false) txt(g, '24時間営業', W * 0.72, H * 0.68, { size: H * 0.18, color: '#d94436' });
  });
}
function buildStoreExterior() {
  const wall = toon(PAL.wallOut);
  const wallDark = toon(PAL.wallOutDark);
  const trim = toon(PAL.trim);
  const glass = glassMat(0xd6ecff, 0.09);
  const glassSide = glassMat(0xd6ecff, 0.08);
  const mullion = toon(0x3a4256);

  /* ---- 楼体 ---- */
  // 左墙（后段实墙）
  boxAt(S.x0, LAY.WALK_Y, S.z0, S.x0 + WALL_T, ROOF_Y, 1.25, wall, { outline: true });
  // 左墙裙（玻璃下沿矮墙）
  boxAt(S.x0, LAY.WALK_Y, 1.25, S.x0 + WALL_T, LAY.WALK_Y + 0.42, S.z1, wall, { outline: true });
  // 右墙
  boxAt(S.x1 - WALL_T, LAY.WALK_Y, S.z0, S.x1, ROOF_Y, S.z1, wall, { outline: true });
  // 后墙
  boxAt(S.x0, LAY.WALK_Y, S.z0, S.x1, ROOF_Y, S.z0 + WALL_T, wall, { outline: true });
  // 前墙：右段实墙（收银区背墙）
  boxAt(1.5, LAY.WALK_Y, S.z1 - WALL_T, S.x1, ROOF_Y, S.z1, wall, { outline: true });
  // 前墙裙 + 左段玻璃下矮墙
  boxAt(S.x0, LAY.WALK_Y, S.z1 - WALL_T, 1.5, LAY.WALK_Y + 0.42, S.z1, wall, { outline: true });

  // 外墙横向分缝
  boxAt(S.x0 - 0.015, ROOF_Y - 0.5, S.z0, S.x0 + 0.02, ROOF_Y - 0.42, S.z1, wallDark);
  boxAt(S.x0, ROOF_Y - 0.5, S.z1 + 0.005, S.x1, ROOF_Y - 0.42, S.z1 + 0.04, wallDark);

  /* ---- 玻璃幕（左 + 前） ---- */
  const gTop = CEIL_Y - 0.06, gBot = LAY.WALK_Y + 0.42;
  function pane(x0, x1, z0, z1, vertical, mat) {
    const w = Math.abs(x1 - x0) || 0.02, d = Math.abs(z1 - z0) || 0.02;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? d : w, gTop - gBot), mat);
    m.position.set((x0 + x1) / 2, (gTop + gBot) / 2, (z0 + z1) / 2);
    if (vertical) m.rotation.y = Math.PI / 2;
    scene.add(m);
    // 玻璃上的水流
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? d : w, gTop - gBot),
      addMat(glassWaterTex(), 0xbfe0ff, 0.5, { blending: THREE.NormalBlending, opacity: 0.17 }));
    wm.position.copy(m.position);
    wm.rotation.copy(m.rotation);
    wm.position.y += 0;
    wm.renderOrder = 6;
    scene.add(wm);
    updaters.push((dt, t) => { wm.material.map.offset.y -= dt * 0.035; wm.material.map.offset.x = Math.sin(t * 0.2) * 0.02; });
    return m;
  }
  // 左侧转角玻璃 z∈[1.25,4.2]
  pane(S.x0 + WALL_T * 0.5, S.x0 + WALL_T * 0.5, 1.25, S.z1, true, glassSide);
  // 前脸玻璃：门口左右
  pane(S.x0 + 0.02, -2.62, S.z1 - WALL_T * 0.5, S.z1 - WALL_T * 0.5, false, glass);
  pane(-0.18, 1.5, S.z1 - WALL_T * 0.5, S.z1 - WALL_T * 0.5, false, glass);
  // 竖框
  const mulPos = [-4.4, -3.2, -2.62, -0.18, 1.0, 1.5];
  mulPos.forEach((x) => boxAt(x, gBot, S.z1 - WALL_T * 0.5 - 0.03, x + 0.07, gTop, S.z1 - WALL_T * 0.5 + 0.03, mullion, { outline: true }));
  [1.25, 2.7, 4.15].forEach((z) => boxAt(S.x0 + WALL_T * 0.5 - 0.03, gBot, z, S.x0 + WALL_T * 0.5 + 0.03, gTop, z + 0.07, mullion, { outline: true }));
  // 上下横挺
  boxAt(S.x0 + 0.02, gTop, S.z1 - WALL_T * 0.5 - 0.03, 1.5, gTop + 0.09, S.z1 - WALL_T * 0.5 + 0.03, mullion);
  boxAt(S.x0 + WALL_T * 0.5 - 0.03, gBot, 1.25, S.x0 + WALL_T * 0.5 + 0.03, gBot + 0.09, S.z1, mullion);
  boxAt(S.x0 + WALL_T * 0.5 - 0.03, gTop, 1.25, S.x0 + WALL_T * 0.5 + 0.03, gTop + 0.09, S.z1, mullion);
  // 窗下压条（前脸）
  boxAt(S.x0, LAY.WALK_Y + 0.40, S.z1 - WALL_T, 1.5, LAY.WALK_Y + 0.46, S.z1 + 0.06, toon(0xa89e8c));
  boxAt(S.x0, LAY.WALK_Y, S.z1 - WALL_T - 0.002, 1.5, LAY.WALK_Y + 0.42, S.z1 - WALL_T + 0.02, toon(0x9c8f7c));

  /* ---- 自动门 ---- */
  // 门套（左右门柱 + 上槛 + 地槛）
  boxAt(-2.72, LAY.WALK_Y + 0.42, S.z1 - WALL_T * 0.5 - 0.06, -2.60, gTop + 0.06, S.z1 - WALL_T * 0.5 + 0.06, mullion, { outline: true });
  boxAt(-0.20, LAY.WALK_Y + 0.42, S.z1 - WALL_T * 0.5 - 0.06, -0.08, gTop + 0.06, S.z1 - WALL_T * 0.5 + 0.06, mullion, { outline: true });
  boxAt(-2.72, gTop, S.z1 - WALL_T * 0.5 - 0.06, -0.08, gTop + 0.12, S.z1 - WALL_T * 0.5 + 0.06, mullion, { outline: true });
  boxAt(-2.72, LAY.WALK_Y + 0.40, S.z1 - WALL_T * 0.5 - 0.10, -0.08, LAY.WALK_Y + 0.46, S.z1 - WALL_T * 0.5 + 0.10, toon(0xb9c1cd));
  const doorMat = glassMat(0xcfe8ff, 0.12);
  for (let i = 0; i < 2; i++) {
    const g = group({ x: i === 0 ? -2.62 : -1.40, z: S.z1 - WALL_T * 0.5 });
    const leafDir = i === 0 ? -1 : 1;
    const glassLeaf = new THREE.Mesh(new THREE.PlaneGeometry(1.22, gTop - gBot - 0.04), doorMat);
    glassLeaf.position.set(leafDir * 0.61, (gTop + gBot) / 2, 0);
    g.add(glassLeaf);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(1.22, gTop - gBot - 0.04),
      addMat(glassWaterTex(), 0xbfe0ff, 0.15, { blending: THREE.NormalBlending }));
    wl.position.copy(glassLeaf.position); wl.position.z += 0.01;
    wl.renderOrder = 7;
    g.add(wl);
    updaters.push((dt) => { wl.material.map.offset.y -= dt * 0.05; });
    // 门框与把手
    boxAt(-0.03, gBot, -0.035, 0.03, gTop, 0.035, toon(0x4a5266), { parent: g, outline: true });
    boxAt(leafDir * 1.20, gBot, -0.035, leafDir * 1.26, gTop, 0.035, toon(0x4a5266), { parent: g });
    boxAt(leafDir * 1.22, gBot, -0.03, leafDir * 1.24, gTop, 0.03, toon(0x59617a), { parent: g });
    boxAt(leafDir * 0.28, 1.05, 0.02, leafDir * 0.32, 2.0, 0.06, toon(0xc9d0dc), { parent: g });
    boxAt(leafDir * 0.62, 1.05, -0.06, leafDir * 0.66, 2.0, 0.02, toon(0xc9d0dc), { parent: g });
    boxAt(leafDir * 0.61, gBot + 0.02, -0.04, leafDir * 1.22, gBot + 0.22, 0.04, toon(0xd7dce4), { parent: g });
    boxAt(leafDir * 0.61, gTop - 0.20, -0.04, leafDir * 1.22, gTop - 0.02, 0.04, toon(0xd7dce4), { parent: g });
    // "自動ドア" 贴纸
    const st = signPlane(0.5, 0.16, makeTex(128, 40, (G, w, h) => {
      G.fillStyle = 'rgba(255,255,255,0)'; G.clearRect(0, 0, w, h);
      txt(G, '自動ドア', w / 2, h / 2, { size: 24, color: 'rgba(80,150,220,0.85)' });
    }), { parent: g, mul: 1.0, x: leafDir * 0.62, y: gBot + 1.05, z: 0.04 });
    st.material.transparent = true;
    doorState.panels.push({ g: g, dir: leafDir });
  }
  // 门头感应器与门轨
  boxAt(-2.75, gTop + 0.02, S.z1 - WALL_T * 0.5 - 0.16, -0.05, gTop + 0.14, S.z1 - WALL_T * 0.5 + 0.02, toon(0x333a4c), { outline: true });
  boxAt(-2.4, gTop + 0.06, S.z1 - WALL_T * 0.5 - 0.30, -1.0, gTop + 0.13, S.z1 - WALL_T * 0.5 - 0.05, toon(0x2b3243));
  const sensor = cyl(0.05, 0.05, 0.05, 10, emit(0x8ef0b6, 1.2), { x: -1.7, y: gTop + 0.05, z: S.z1 - WALL_T * 0.5 - 0.14 });

  /* ---- 屋檐雨棚 ---- */
  const canopy = toon(0x37414f);
  const canopyEdge = toon(0xc6bdae);
  boxAt(S.x0 - 0.1, 2.66, S.z1 - 0.02, S.x1 + 0.1, 2.76, S.z1 + 0.98, canopy, { outline: true });
  boxAt(S.x0 - 0.1, 2.76, S.z1 + 0.86, S.x1 + 0.1, 2.83, S.z1 + 1.01, canopyEdge);
  boxAt(S.x0 - 0.16, 2.64, S.z1 - 0.05, S.x0 + 0.02, 2.78, S.z1 + 0.98, canopyEdge);
  // 棚下筒灯
  for (let i = 0; i < 4; i++) {
    const lx = -3.8 + i * 2.4;
    cyl(0.11, 0.13, 0.09, 12, toon(0xd7dce4), { x: lx, y: 2.62, z: S.z1 + 0.62 });
    cyl(0.095, 0.095, 0.03, 12, emit(0xffe3b4, 2.6), { x: lx, y: 2.57, z: S.z1 + 0.62 });
  }
  // 侧雨棚（左）
  boxAt(S.x0 - 0.86, 2.66, 1.2, S.x0 - 0.08, 2.76, 4.25, canopy, { outline: true });
  boxAt(S.x0 - 0.86, 2.76, 1.32, S.x0 - 0.74, 2.83, 4.25, canopyEdge);
  boxAt(S.x0 - 0.86, 2.64, 1.2, S.x0 - 0.72, 2.78, 1.36, canopyEdge);
  for (let i = 0; i < 2; i++) {
    cyl(0.11, 0.13, 0.09, 12, toon(0xd7dce4), { x: S.x0 - 0.52, y: 2.62, z: 2.0 + i * 1.9 });
    cyl(0.095, 0.095, 0.03, 12, emit(0xffe3b4, 2.6), { x: S.x0 - 0.52, y: 2.57, z: 2.0 + i * 1.9 });
  }

  /* ---- 招牌灯箱 ---- */
  // 前脸横向灯箱
  const fasciaT = brandBandTex(1024, 176);
  const fasciaMat = emit(0xfffaf0, 1.05);
  const fascia = box(9.0, 0.62, 0.16, fasciaMat, { x: 0, y: 3.02, z: S.z1 + 0.10, outline: true });
  signFlicker.mats.push({ m: fasciaMat, base: 1.05 });
  signPlane(9.0, 0.62, fasciaT, { mul: 1.18, x: 0, y: 3.02, z: S.z1 + 0.185 });
  // 左侧转角灯箱
  const sideT = brandBandTex(640, 176, false);
  const sideMat = emit(0xfffaf0, 1.0);
  const sideS = box(0.16, 0.62, 3.0, sideMat, { x: S.x0 - 0.10, y: 3.02, z: 2.7, outline: true });
  signFlicker.mats.push({ m: sideMat, base: 1.0 });
  signPlane(3.0, 0.62, sideT, { mul: 1.12, x: S.x0 - 0.19, y: 3.02, z: 2.7, ry: -Math.PI / 2 });
  // 屋顶大灯箱
  const roofT = makeTex(768, 256, (g, W, H) => {
    g.fillStyle = '#fbf9f5'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#eef2f7'; g.fillRect(0, 0, W, H * 0.5);
    g.fillStyle = '#2f9e63'; g.fillRect(0, H * 0.84, W, H * 0.05);
    g.fillStyle = '#f4802c'; g.fillRect(0, H * 0.89, W, H * 0.05);
    g.fillStyle = '#d94436'; g.fillRect(0, H * 0.94, W, H * 0.06);
    txt(g, 'ひかりマート', W * 0.5, H * 0.40, { size: H * 0.40, color: '#1f3a86' });
    txt(g, '24時間  OPEN', W * 0.5, H * 0.68, { size: H * 0.19, color: '#d94436', spacing: 3 });
  });
  const roofMat = emit(0xfffaf0, 1.06);
  const roofSign = box(5.2, 1.6, 0.22, roofMat, { x: -0.6, y: ROOF_Y + 1.35, z: -1.4, outline: true });
  signPlane(5.2, 1.6, roofT, { mul: 1.22, x: -0.6, y: ROOF_Y + 1.35, z: -1.28 });
  signPlane(5.2, 1.6, roofT, { mul: 1.2, x: -0.6, y: ROOF_Y + 1.35, z: -1.52, ry: Math.PI });
  signFlicker.mats.push({ m: roofMat, base: 1.06 });
  // 屋顶灯箱支架
  [-3.0, 1.8].forEach((bx) => {
    boxAt(bx - 0.06, ROOF_Y + 0.1, -1.55, bx + 0.06, ROOF_Y + 0.6, -1.25, toon(0x8d93a0), { outline: true });
    cylBetween(new THREE.Vector3(bx, ROOF_Y + 0.55, -1.4), new THREE.Vector3(bx, ROOF_Y + 0.75, -1.4), 0.05, toon(0x8d93a0), scene, 6);
  });
  // 转角出挑竖招牌（袖看板）
  const projT = makeTex(224, 640, (g, W, H) => {
    g.fillStyle = '#fbf9f5'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1f3a86'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#d94436'; g.fillRect(12, 12, W - 24, H * 0.17);
    txt(g, '24H', W / 2, H * 0.10, { size: H * 0.075, color: '#fff' });
    txt(g, 'ひ', W / 2, H * 0.30, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'か', W / 2, H * 0.40, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'り', W / 2, H * 0.50, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'マ', W / 2, H * 0.60, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'ー', W / 2, H * 0.70, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'ト', W / 2, H * 0.80, { size: H * 0.085, color: '#1f3a86' });
    txt(g, 'ATM', W / 2, H * 0.91, { size: H * 0.055, color: '#2f9e63' });
  });
  const projMat = emit(0xfffaf0, 1.04);
  const projSign = box(0.5, 1.44, 0.14, projMat, { x: S.x0 - 0.42, y: 3.5, z: S.z1 - 0.05, ry: Math.PI / 4, outline: true });
  signPlane(0.5, 1.44, projT, { mul: 1.45, x: S.x0 - 0.42, y: 3.5, z: S.z1 - 0.05, ry: Math.PI / 4 });
  signPlane(0.5, 1.44, projT, { mul: 1.1, x: S.x0 - 0.42, y: 3.5, z: S.z1 - 0.05, ry: Math.PI / 4 + Math.PI });
  signFlicker.mats.push({ m: projMat, base: 1.04 });
  cylBetween(new THREE.Vector3(S.x0 - 0.02, 3.5, S.z1 - 0.05), new THREE.Vector3(S.x0 - 0.18, 3.5, S.z1 - 0.05), 0.035, toon(0x8d93a0), scene, 6);

  /* ---- 玻璃贴海报（店内灯箱海报，位于玻璃内侧） ---- */
  const posterT = [
    posterTex(210, '新発売', 'コーヒー S 110円'),
    posterTex(8, 'からあげ', '20% OFF'),
    posterTex(120, 'おにぎり', '100円 セール'),
    posterTex(280, 'ATM', '24時間 ご利用可')
  ];
  const posterPos = [
    [-4.0, 0.92, 0.74, 0.92], [-2.95, 0.92, 0.74, 0.92],
    [0.35, 0.92, 0.74, 0.92], [1.18, 0.92, 0.74, 0.92]
  ];
  posterPos.forEach((p, i) => {
    signPlane(p[2], p[3], posterT[i], { lit: false, mul: 1.0, x: p[0], y: p[1], z: S.z1 - WALL_T - 0.02, outline: false });
  });
  // 玻璃下沿的小价签带
  for (let i = 0; i < 7; i++) {
    signPlane(0.34, 0.2, makeTex(128, 76, (g, W, H) => {
      g.fillStyle = '#fdfaf3'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#d94436'; g.fillRect(0, 0, W, H * 0.34);
      txt(g, 'SALE', W / 2, H * 0.17, { size: 24, color: '#fff' });
      txt(g, ['¥100', '¥128', '¥98', '¥150', '¥120', '¥88', '¥168'][i], W / 2, H * 0.66, { size: 30, color: '#2b3550' });
    }), { lit: false, x: -4.1 + i * 0.62, y: 0.52, z: S.z1 - WALL_T - 0.015, outline: false });
  }
  // 左侧玻璃贴纸
  signPlane(0.82, 1.0, posterTex(190, '雑誌', '最新号 入荷'), { lit: false, x: S.x0 + WALL_T + 0.02, y: 0.92, z: 2.5, ry: Math.PI / 2 });

  /* ---- 门口地垫 / 门前灯 / 招牌光晕 ---- */
  const matTex = makeTex(256, 128, (g, W, H) => {
    g.fillStyle = '#25322c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f3d35';
    for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 4);
    g.strokeStyle = '#c9d3c6'; g.lineWidth = 4; g.strokeRect(5, 5, W - 10, H - 10);
    txt(g, 'WELCOME', W / 2, H * 0.42, { size: 34, color: '#cdd8cb', spacing: 6 });
    txt(g, 'ひかりマート', W / 2, H * 0.72, { size: 22, color: '#93a892' });
  });
  boxAt(-2.72, LAY.WALK_Y, S.z1 + 0.02, -0.08, LAY.WALK_Y + 0.035, S.z1 + 0.92, toonT(0xffffff, matTex), { outline: true });

  // 招牌光晕（Sprite）
  const glowSp = new THREE.Sprite(addMat(glowTex(), 0xffd9a0, 0.55));
  glowSp.scale.set(11, 3.4, 1);
  glowSp.position.set(0, 3.02, S.z1 + 0.35);
  scene.add(glowSp);
  signFlicker.sprites.push({ s: glowSp.material, base: 0.55 });
  const cornerGlow = new THREE.Sprite(addMat(glowTex(), 0xffc888, 0.30));
  cornerGlow.scale.set(5.0, 4.0, 1);
  cornerGlow.position.set(S.x0 + 0.3, 1.6, S.z1 - 0.3);
  scene.add(cornerGlow);
  const doorGlow = new THREE.Sprite(addMat(glowTex(), 0xffe0b0, 0.42));
  doorGlow.scale.set(4.6, 3.0, 1);
  doorGlow.position.set(-1.4, 1.7, S.z1 + 0.5);
  scene.add(doorGlow);
  return { glowSp: glowSp, doorGlow: doorGlow };
}

/* ------------------------------------------------------------ 店内陈设 */
const PROD = { box: [], can: [], cup: [], bottle: [], onigiri: [], bento: [], cig: [], tub: [] };
const PROD_COLORS = [
  0xe8452f, 0x1f5fd0, 0x1f9e52, 0xffa000, 0xf2ead6, 0x8e2fc0, 0x18c0b0,
  0xff5a3c, 0x2f4fd0, 0xd4e02f, 0xfff4e0, 0x1090b0, 0xe03f8a, 0x8a4a12,
  0xffd21f, 0xd0202f, 0x30a0e0, 0x60c040
];
function addProd(type, x, y, z, ry, color, sc) {
  PROD[type].push({ x: x, y: y, z: z, ry: ry || 0, c: color == null ? pick(PROD_COLORS) : color, s: sc || 1 });
}
function buildProducts() {
  const defs = {
    box: { geo: new THREE.BoxGeometry(0.10, 0.15, 0.065), color: 0xffffff },
    can: { geo: new THREE.CylinderGeometry(0.037, 0.037, 0.13, 10), color: 0xffffff },
    cup: { geo: new THREE.CylinderGeometry(0.052, 0.043, 0.12, 12), color: 0xffffff },
    bottle: { geo: new THREE.CylinderGeometry(0.036, 0.040, 0.20, 10), color: 0xffffff },
    onigiri: { geo: (() => { const g = new THREE.CylinderGeometry(0.058, 0.058, 0.05, 3); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI); return g; })(), color: 0xffffff },
    bento: { geo: new THREE.BoxGeometry(0.17, 0.055, 0.12), color: 0xffffff },
    cig: { geo: new THREE.BoxGeometry(0.055, 0.088, 0.02), color: 0xffffff },
    tub: { geo: new THREE.CylinderGeometry(0.05, 0.045, 0.075, 12), color: 0xffffff }
  };
  const dummy = new THREE.Object3D();
  Object.keys(PROD).forEach((k) => {
    const list = PROD[k];
    if (!list.length) return;
    const d = defs[k];
    const mesh = new THREE.InstancedMesh(d.geo, toon(0xffffff), list.length);
    list.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.ry, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(p.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    interiorGroup.add(mesh);
  });
}
/* 货架单元（横放：长边沿 x，面向街道玻璃，商品正面朝外） */
function shelfRowX(cz, x0, x1, tiers, label) {
  const len = x1 - x0, cx = (x0 + x1) / 2;
  const bodyMat = toon(PAL.shelf);
  const backMat = toon(0xe4ddcf);
  const frame = toon(0xc9cfd8);
  const g = group({ parent: interiorGroup });
  boxAt(x0, FLOOR_Y, cz - 0.34, x1, FLOOR_Y + 0.12, cz + 0.34, frame, { parent: g, outline: true });
  boxAt(x0, FLOOR_Y + 0.12, cz - 0.34, x0 + 0.04, FLOOR_Y + tiers[tiers.length - 1] + 0.06, cz + 0.34, bodyMat, { parent: g });
  boxAt(x1 - 0.04, FLOOR_Y + 0.12, cz - 0.34, x1, FLOOR_Y + tiers[tiers.length - 1] + 0.06, cz + 0.34, bodyMat, { parent: g });
  boxAt(x0, FLOOR_Y, cz - 0.34, x1, FLOOR_Y + tiers[tiers.length - 1] + 0.06, cz - 0.30, backMat, { parent: g });
  tiers.forEach((th) => {
    boxAt(x0 + 0.02, FLOOR_Y + th, cz - 0.33, x1 - 0.02, FLOOR_Y + th + 0.035, cz + 0.33, bodyMat, { parent: g, outline: true });
    boxAt(x0 + 0.02, FLOOR_Y + th + 0.005, cz + 0.05, x1 - 0.02, FLOOR_Y + th + 0.032, cz + 0.35, frame);
    boxAt(x0 + 0.02, FLOOR_Y + th + 0.032, cz + 0.30, x1 - 0.02, FLOOR_Y + th + 0.058, cz + 0.36,
      toon([0xd94436, 0x2f6fbf, 0x2f9e63, 0xf0a52c][(th * 10 | 0) % 4]));
    for (let x = x0 + 0.25; x < x1 - 0.35; x += 0.42) {
      boxAt(x, FLOOR_Y + th + 0.03, cz + 0.2, x + 0.14, FLOOR_Y + th + 0.15, cz + 0.36, toon(0xfdfaf2), { parent: g });
    }
  });
  if (label) {
    const col = ['#2f6fbf', '#d94436', '#2f9e63'][(label.length + x0) % 3 | 0] || '#2f6fbf';
    const t = makeTex(640, 96, (G, W, H) => {
      G.fillStyle = col; G.fillRect(0, 0, W, H);
      G.fillStyle = 'rgba(255,255,255,0.92)'; G.fillRect(0, 0, W, H * 0.18);
      txt(G, label, W / 2, H * 0.56, { size: 46, color: '#ffffff' });
    });
    signPlane(len * 0.94, 0.2, t, { mul: 1.15, x: cx, y: FLOOR_Y + tiers[tiers.length - 1] + 0.20, z: cz + 0.34, parent: g });
  }
  return g;
}
function fillShelfX(cz, x0, x1, tierY, type, step) {
  for (let x = x0 + 0.22; x < x1 - 0.14; x += (step || 0.17)) {
    addProd(type, x, FLOOR_Y + tierY + 0.09, cz + 0.19, 0, null, rr(0.94, 1.08));
    addProd(type, x + 0.04, FLOOR_Y + tierY + 0.09, cz - 0.17, 0, null, rr(0.94, 1.08));
    if ((x * 7 | 0) % 3 === 0) addProd(type, x + 0.02, FLOOR_Y + tierY + 0.09 + 0.15, cz + 0.02, 0, null, rr(0.9, 1.02));
  }
}
/* 货架单元 */
function shelfUnit(cx, z0, z1, tiers, label) {
  const len = z1 - z0, cz = (z0 + z1) / 2;
  const bodyMat = toon(PAL.shelf);
  const backMat = toon(0xe4ddcf);
  const frame = toon(0xc9cfd8);
  const g = group({ parent: interiorGroup });
  // 底座与侧板
  boxAt(cx - 0.36, FLOOR_Y, z0, cx + 0.36, FLOOR_Y + 0.12, z1, frame, { parent: g, outline: true });
  boxAt(cx - 0.34, FLOOR_Y + 0.12, z0, cx + 0.34, FLOOR_Y + tiers[tiers.length - 1] + 0.06, z0 + 0.04, bodyMat, { parent: g });
  boxAt(cx - 0.34, FLOOR_Y + 0.12, z1 - 0.04, cx + 0.34, FLOOR_Y + tiers[tiers.length - 1] + 0.06, z1, bodyMat, { parent: g });
  boxAt(cx - 0.34, FLOOR_Y + 0.02, z0, cx + 0.34, FLOOR_Y + tiers[tiers.length - 1] + 0.06, z0 + 0.03, backMat, { parent: g });
  // 层板
  tiers.forEach((th) => {
    boxAt(cx - 0.33, FLOOR_Y + th, z0 + 0.02, cx + 0.33, FLOOR_Y + th + 0.035, z1 - 0.02, bodyMat, { parent: g, outline: true });
    // 前挡价签条
    boxAt(cx - 0.05, FLOOR_Y + th + 0.005, z0 + 0.02, cx + 0.35, FLOOR_Y + th + 0.032, z1 - 0.02, frame);
    for (let z = z0 + 0.2; z < z1 - 0.3; z += 0.42) {
      boxAt(cx + 0.2, FLOOR_Y + th + 0.03, z, cx + 0.36, FLOOR_Y + th + 0.15, z + 0.14, toon(0xfdfaf2), { parent: g });
    }
  });
  // 顶部灯箱价签
  if (label) {
    const t = makeTex(512, 96, (G, W, H) => {
      G.fillStyle = '#fdfaf3'; G.fillRect(0, 0, W, H);
      G.fillStyle = '#2f9e63'; G.fillRect(0, H - 8, W, 8);
      txt(G, label, W / 2, H * 0.46, { size: 46, color: '#2b3550' });
    });
    signPlane(len * 0.92, 0.2, t, { mul: 1.15, x: cx + 0.30, y: FLOOR_Y + tiers[tiers.length - 1] + 0.20, z: cz, ry: Math.PI / 2, parent: g });
  }
  return g;
}
function fillShelf(cx, z0, z1, tierY, type, step) {
  for (let z = z0 + 0.24; z < z1 - 0.16; z += (step || 0.17)) {
    addProd(type, cx - 0.17, FLOOR_Y + tierY + 0.085, z, 0, null, rr(0.94, 1.06));
    addProd(type, cx + 0.14, FLOOR_Y + tierY + 0.085, z + 0.03, 0, null, rr(0.94, 1.06));
  }
}

function buildStoreInterior() {
  if (!interiorGroup.parent) scene.add(interiorGroup);
  const ceilMat = toon(PAL.ceilIn);
  const wallIn = toon(PAL.wallIn);
  const IW = S.x1 - WALL_T, IE = S.x0 + WALL_T, IN = S.z0 + WALL_T, IF = S.z1 - WALL_T;

  /* ---- 地面 / 天花 ---- */
  const floorT = tileFloorTex();
  texRepeat(floorT, 0.42, 0.42);
  boxAt(IE - 0.02, LAY.WALK_Y, IN - 0.02, IW + 0.02, FLOOR_Y, IF + 0.02, toonT(0xffffff, floorT), { parent: interiorGroup, outline: true });
  boxAt(IE - 0.02, CEIL_Y, IN - 0.02, IW + 0.02, CEIL_Y + 0.08, IF + 0.02, ceilMat, { parent: interiorGroup });
  // 天花灯箱
  const panelMat = emit(0xffe8c0, 0.92);
  for (let ix = 0; ix < 4; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      const px = lerp(IE + 1.0, IW - 1.0, ix / 3), pz = lerp(IN + 1.1, IF - 1.2, iz / 2);
      boxAt(px - 0.62, CEIL_Y - 0.02, pz - 0.34, px + 0.62, CEIL_Y + 0.01, pz + 0.34, panelMat, { parent: interiorGroup });
      boxAt(px - 0.68, CEIL_Y - 0.045, pz - 0.40, px + 0.68, CEIL_Y - 0.015, pz + 0.40, toon(0xe8e4da), { parent: interiorGroup });
      // 地面光斑
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.2), addMat(glowTex(), 0xffe6bd, 0.30));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(px, FLOOR_Y + 0.006, pz);
      pool.renderOrder = 3;
      interiorGroup.add(pool);
    }
  }
  // 天花横梁
  for (let bz = IN + 0.5; bz < IF; bz += 1.55) {
    boxAt(IE, CEIL_Y - 0.06, bz, IW, CEIL_Y + 0.005, bz + 0.09, toon(0xcfc6b2), { parent: interiorGroup });
  }
  boxAt(IE, CEIL_Y - 0.06, IN, (IE + IW) / 2 - 0.9, CEIL_Y + 0.005, IF, toon(0xcfc6b2), { parent: interiorGroup });
  // 天花设备：喇叭 / 摄像头 / 空调出风
  boxAt(0.6, CEIL_Y - 0.16, 0.6, 1.1, CEIL_Y - 0.05, 1.1, toon(0xe4e0d6), { parent: interiorGroup });
  const cam = group({ parent: interiorGroup, x: -4.0, y: CEIL_Y - 0.12, z: 3.6 });
  cyl(0.05, 0.05, 0.16, 8, toon(0x2b3243), { parent: cam, y: -0.08 });
  const camBody = box(0.16, 0.14, 0.24, toon(0xe8e4da), { parent: cam, y: -0.22, z: 0.06, outline: true });
  cyl(0.05, 0.05, 0.03, 10, emit(0x88bbff, 1.2), { parent: cam, y: -0.22, z: 0.19, rx: Math.PI / 2 });
  boxAt(2.6, CEIL_Y - 0.12, -3.4, 3.6, CEIL_Y - 0.02, -2.4, toon(0xe0dcd2), { parent: interiorGroup });

  /* ---- 吊旗 ---- */
  const bannerT = [
    makeTex(192, 320, (g, W, H) => {
      g.fillStyle = '#f6f1e6'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#d94436'; g.fillRect(0, 0, W, H * 0.22);
      txt(g, '新発売', W / 2, H * 0.11, { size: 40, color: '#fff' });
      txt(g, 'からあげ', W / 2, H * 0.40, { size: 46, color: '#b2453a' });
      txt(g, 'クン', W / 2, H * 0.56, { size: 46, color: '#b2453a' });
      txt(g, '¥220', W / 2, H * 0.78, { size: 52, color: '#2b3550' });
    }),
    makeTex(192, 320, (g, W, H) => {
      g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#2f6fbf'; g.fillRect(0, 0, W, H * 0.2);
      txt(g, 'COFFEE', W / 2, H * 0.10, { size: 34, color: '#fff' });
      txt(g, '淹れたて', W / 2, H * 0.36, { size: 44, color: '#2b3550' });
      txt(g, 'M 150円', W / 2, H * 0.60, { size: 40, color: '#d94436' });
      txt(g, 'L 200円', W / 2, H * 0.76, { size: 40, color: '#2b3550' });
    })
  ];
  [[-3.2, 0.6], [-1.2, 0.6], [1.9, 2.2], [3.4, 2.2]].forEach((p, i) => {
    const b = signPlane(0.5, 0.84, bannerT[i % 2], { mul: 1.1, x: p[0], y: CEIL_Y - 0.55, z: p[1], parent: interiorGroup, outline: false });
    b.material.side = THREE.DoubleSide;
    boxAt(p[0] - 0.26, CEIL_Y - 0.12, p[1] - 0.01, p[0] + 0.26, CEIL_Y - 0.10, p[1] + 0.01, toon(0xdedad0), { parent: interiorGroup });
  });

  /* ---- 货架三列 + 商品 ---- */
  const shelves = [
    { cz: -3.05, x0: -4.15, x1: -0.45, label: '菓子・スナック' },
    { cz: -1.65, x0: -4.15, x1: -0.45, label: 'インスタント・日用品' },
    { cz: -0.25, x0: -4.15, x1: -0.45, label: '飲料・お酒' }
  ];
  shelves.forEach((s, si) => {
    shelfRowX(s.cz, s.x0, s.x1, [0.38, 0.72, 1.06, 1.40], s.label);
    const types = [['box', 'box', 'cup', 'box'], ['cup', 'box', 'bottle', 'box'], ['bottle', 'can', 'can', 'bottle']][si];
    types.forEach((t, ti) => fillShelfX(s.cz, s.x0, s.x1, 0.42 + ti * 0.34, t, t === 'cup' ? 0.19 : 0.17));
  });
  // 入口处的特价平台
  const pf = group({ parent: interiorGroup });
  boxAt(-2.6, FLOOR_Y, 0.85, -0.9, FLOOR_Y + 0.62, 1.45, toon(0xdcd6c8), { parent: pf, outline: true });
  boxAt(-2.66, FLOOR_Y + 0.62, 0.79, -0.84, FLOOR_Y + 0.68, 1.51, toon(0xc9a978), { parent: pf, outline: true });
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      addProd(i % 2 ? 'cup' : 'box', -2.45 + i * 0.34, FLOOR_Y + 0.76, 0.98 + j * 0.18, 0, null, rr(0.95, 1.1));
    }
  }
  signPlane(1.5, 0.22, makeTex(384, 64, (g, W, H) => {
    g.fillStyle = '#fdfaf3'; g.fillRect(0, 0, W, H);
    txt(g, 'おすすめ 特価品', W / 2, H * 0.5, { size: 36, color: '#d94436' });
  }), { mul: 1.15, x: -1.75, y: FLOOR_Y + 0.86, z: 1.52, parent: pf });

  /* ---- 饮料冷柜（右墙） ---- */
  const fridgeMat = toon(0xf2f5f8);
  const frameMat = toon(0xd3d9e2);
  const FX0 = 3.45, FX1 = S.x1 - WALL_T, FZ0 = -4.35, FZ1 = -1.15;
  // 外壳做成"箱体"：只有背板/顶板/底板/侧板，正面留空给玻璃门
  boxAt(FX0, FLOOR_Y, FZ0, FX1, FLOOR_Y + 2.05, FZ0 + 0.05, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(FX0, FLOOR_Y, FZ1 - 0.05, FX1, FLOOR_Y + 2.05, FZ1, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(FX0, FLOOR_Y, FZ0, FX1, FLOOR_Y + 0.08, FZ1, frameMat, { parent: interiorGroup, outline: true });
  boxAt(FX0, FLOOR_Y + 1.96, FZ0, FX1, FLOOR_Y + 2.05, FZ1, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(FX0 - 0.06, FLOOR_Y, FZ0 - 0.02, FX0 + 0.02, FLOOR_Y + 2.05, FZ1 + 0.02, frameMat, { parent: interiorGroup });
  const litIn = emit(0xeaf2ff, 1.1);
  // 内壁与背板灯箱
  boxAt(FX1 - 0.04, FLOOR_Y + 0.08, FZ0 + 0.05, FX1, FLOOR_Y + 1.96, FZ1 - 0.05, litIn, { parent: interiorGroup });
  boxAt(FX0 + 0.02, FLOOR_Y + 1.86, FZ0 + 0.05, FX1, FLOOR_Y + 1.96, FZ1 - 0.05, emit(0xeef6ff, 1.25), { parent: interiorGroup });
  const doorCount = 3, dw = (FZ1 - FZ0) / doorCount;
  for (let i = 0; i < doorCount; i++) {
    const z0 = FZ0 + i * dw + 0.02, z1 = z0 + dw - 0.04;
    boxAt(FX0 - 0.085, FLOOR_Y + 0.05, z0, FX0 - 0.05, FLOOR_Y + 1.92, z1, frameMat, { parent: interiorGroup, outline: true });
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0 - 0.04, 1.72), glassMat(0xd8ecff, 0.14));
    gp.rotation.y = -Math.PI / 2;
    gp.position.set(FX0 - 0.095, FLOOR_Y + 1.02, (z0 + z1) / 2);
    interiorGroup.add(gp);
    // 把手
    boxAt(FX0 - 0.14, FLOOR_Y + 0.75, z1 - 0.10, FX0 - 0.10, FLOOR_Y + 1.55, z1 - 0.06, toon(0xc9d0dc));
    // 商品：四层
    for (let r = 0; r < 4; r++) {
      const ry = FLOOR_Y + 0.22 + r * 0.42;
      boxAt(FX0 + 0.05, ry - 0.03, z0 + 0.02, FX1 - 0.05, ry, z1 - 0.02, toon(0xe8eef4), { parent: interiorGroup });
      for (let k = 0; k < 5; k++) {
        const pz = lerp(z0 + 0.10, z1 - 0.10, k / 4);
        for (let c = 0; c < 2; c++) {
          addProd(r < 2 ? 'bottle' : 'can', FX0 + 0.17 + c * 0.2, ry + (r < 2 ? 0.10 : 0.065), pz, 0, null, 1);
        }
      }
    }
  }
  // 冷柜顶部灯箱
  const fh = makeTex(640, 96, (g, W, H) => {
    g.fillStyle = '#f7fbff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f6fbf'; g.fillRect(0, H - 10, W, 10);
    txt(g, 'つめた〜い 飲料', W / 2, H * 0.48, { size: 44, color: '#24548f' });
  });
  signPlane((FZ1 - FZ0) * 0.96, 0.28, fh, { mul: 1.2, x: FX0 - 0.10, y: FLOOR_Y + 2.2, z: (FZ0 + FZ1) / 2, ry: -Math.PI / 2, parent: interiorGroup });

  /* ---- 后墙冷藏柜（便当・饭团） ---- */
  const CZ0 = S.z0 + WALL_T, CX1 = -0.30, CX0 = S.x0 + WALL_T;
  boxAt(CX0, FLOOR_Y, CZ0, CX1, FLOOR_Y + 1.9, CZ0 + 0.07, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(CX0, FLOOR_Y, CZ0, CX1, FLOOR_Y + 0.08, CZ0 + 0.80, frameMat, { parent: interiorGroup, outline: true });
  boxAt(CX0, FLOOR_Y + 1.80, CZ0, CX1, FLOOR_Y + 1.9, CZ0 + 0.80, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(CX0, FLOOR_Y, CZ0, CX0 + 0.06, FLOOR_Y + 1.9, CZ0 + 0.80, fridgeMat, { parent: interiorGroup, outline: true });
  boxAt(CX1 - 0.06, FLOOR_Y, CZ0, CX1, FLOOR_Y + 1.9, CZ0 + 0.80, fridgeMat, { parent: interiorGroup, outline: true });
  const litC = emit(0xfff0d4, 1.1);
  boxAt(CX0 + 0.06, FLOOR_Y + 0.08, CZ0 + 0.05, CX1 - 0.06, FLOOR_Y + 1.80, CZ0 + 0.10, litC, { parent: interiorGroup });
  boxAt(CX0 + 0.06, FLOOR_Y + 1.70, CZ0 + 0.05, CX1 - 0.06, FLOOR_Y + 1.80, CZ0 + 0.74, emit(0xfff2dc, 1.2), { parent: interiorGroup });
  for (let r = 0; r < 4; r++) {
    const ry = FLOOR_Y + 0.30 + r * 0.42;
    boxAt(CX0 + 0.02, ry - 0.04, CZ0 + 0.02, CX1 - 0.02, ry, CZ0 + 0.80, toon(0xeff4f8), { parent: interiorGroup });
    for (let k = 0; k < 11; k++) {
      const px = lerp(CX0 + 0.22, CX1 - 0.22, k / 10);
      addProd('bento', px, ry + 0.026, CZ0 + 0.46, 0, null, 1);
      addProd('onigiri', px, ry + 0.026, CZ0 + 0.20, 0, [0xe9e4d8, 0xd8cbb0, 0xf0ead9][r % 3], 1);
    }
  }
  // 玻璃门
  const cg = new THREE.Mesh(new THREE.PlaneGeometry(CX1 - CX0 - 0.06, 1.62), glassMat(0xd8ecff, 0.12));
  cg.position.set((CX0 + CX1) / 2, FLOOR_Y + 1.05, CZ0 + 0.80);
  interiorGroup.add(cg);
  const ch = makeTex(768, 96, (g, W, H) => {
    g.fillStyle = '#fffaf2'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d94436'; g.fillRect(0, H - 10, W, 10);
    txt(g, 'お弁当・おにぎり・サンドイッチ', W / 2, H * 0.46, { size: 40, color: '#a83a30' });
  });
  signPlane((CX1 - CX0) * 0.96, 0.26, ch, { mul: 1.2, x: (CX0 + CX1) / 2, y: FLOOR_Y + 2.04, z: CZ0 + 0.80, parent: interiorGroup });

  /* ---- 冰淇淋冰柜（后墙右） ---- */
  const iceMat = toon(0xeef4f8);
  boxAt(0.05, FLOOR_Y, CZ0, 2.35, FLOOR_Y + 0.62, CZ0 + 0.06, iceMat, { parent: interiorGroup, outline: true });
  boxAt(0.05, FLOOR_Y, CZ0 + 0.86, 2.35, FLOOR_Y + 0.62, CZ0 + 0.92, iceMat, { parent: interiorGroup, outline: true });
  boxAt(0.05, FLOOR_Y, CZ0, 0.11, FLOOR_Y + 0.62, CZ0 + 0.92, iceMat, { parent: interiorGroup, outline: true });
  boxAt(2.29, FLOOR_Y, CZ0, 2.35, FLOOR_Y + 0.62, CZ0 + 0.92, iceMat, { parent: interiorGroup, outline: true });
  boxAt(0.05, FLOOR_Y, CZ0, 2.35, FLOOR_Y + 0.12, CZ0 + 0.92, toon(0xdde4ea), { parent: interiorGroup, outline: true });
  boxAt(0.11, FLOOR_Y + 0.14, CZ0 + 0.06, 2.29, FLOOR_Y + 0.58, CZ0 + 0.10, emit(0xeaf6ff, 1.3), { parent: interiorGroup });
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 3; j++) {
      addProd('tub', 0.25 + i * 0.31, FLOOR_Y + 0.66, CZ0 + 0.28 + j * 0.24, 0, null, 1);
    }
  }
  boxAt(0.0, FLOOR_Y + 0.60, CZ0 + 0.06, 2.40, FLOOR_Y + 0.66, CZ0 + 0.96, toon(0xc9d4de));
  signPlane(1.5, 0.24, makeTex(384, 72, (g, W, H) => {
    g.fillStyle = '#eaf6ff'; g.fillRect(0, 0, W, H);
    txt(g, 'アイスクリーム', W / 2, H * 0.5, { size: 40, color: '#3a6ea8' });
  }), { mul: 1.15, x: 1.2, y: FLOOR_Y + 1.10, z: CZ0 + 0.92, parent: interiorGroup });

  /* ---- 后场门 / 储物柜 / 消防 ---- */
  const staffMat = toon(0x53607a);
  boxAt(2.75, FLOOR_Y, CZ0, 3.95, FLOOR_Y + 2.02, CZ0 + 0.06, staffMat, { parent: interiorGroup, outline: true });
  boxAt(2.85, FLOOR_Y + 0.08, CZ0 + 0.06, 3.85, FLOOR_Y + 1.5, CZ0 + 0.09, toon(0x2f3a4e), { parent: interiorGroup });
  boxAt(2.9, FLOOR_Y + 1.62, CZ0 + 0.06, 3.4, FLOOR_Y + 1.94, CZ0 + 0.09, emit(0xbfe6ff, 1.0), { parent: interiorGroup });
  cyl(0.05, 0.05, 0.16, 8, toon(0xc9d0dc), { x: 3.72, y: FLOOR_Y + 0.95, z: CZ0 + 0.12, rx: Math.PI / 2 });
  signPlane(0.9, 0.24, makeTex(256, 72, (g, W, H) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, W, H);
    txt(g, 'STAFF ONLY', W / 2, H * 0.5, { size: 34, color: '#a83a30' });
  }), { mul: 1.05, x: 3.35, y: FLOOR_Y + 2.16, z: CZ0 + 0.08, parent: interiorGroup });
  // 储物柜
  boxAt(2.35, FLOOR_Y, CZ0 + 0.02, 2.72, FLOOR_Y + 1.5, CZ0 + 0.5, toon(0xd8dce4), { parent: interiorGroup, outline: true });
  for (let i = 0; i < 3; i++) {
    boxAt(2.36, FLOOR_Y + 0.06 + i * 0.48, CZ0 + 0.5, 2.71, FLOOR_Y + 0.48 + i * 0.48, CZ0 + 0.53, toon(0xaeb6c2), { parent: interiorGroup });
  }
  // 灭火器
  cyl(0.075, 0.075, 0.42, 10, toon(0xc0392b), { x: -0.55, y: FLOOR_Y + 0.23, z: CZ0 + 0.16, parent: interiorGroup, outline: true });
  cyl(0.03, 0.03, 0.09, 8, toon(0x8d93a0), { x: -0.55, y: FLOOR_Y + 0.48, z: CZ0 + 0.16, parent: interiorGroup });
  // 拖把池
  boxAt(4.05, FLOOR_Y, CZ0 + 0.02, 4.32, FLOOR_Y + 0.55, CZ0 + 0.6, toon(0xb9c0cb), { parent: interiorGroup, outline: true });

  /* ---- 收银台区（前右） ---- */
  const cntTop = toon(PAL.counterTop);
  const cntBody = toon(PAL.counterBase);
  const CZ = 2.42;
  boxAt(1.55, FLOOR_Y, CZ, 4.32, FLOOR_Y + 1.02, CZ + 0.72, cntBody, { parent: interiorGroup, outline: true });
  boxAt(1.5, FLOOR_Y + 1.02, CZ - 0.05, 4.36, FLOOR_Y + 1.09, CZ + 0.77, cntTop, { parent: interiorGroup, outline: true });
  // 收银台侧挡板
  boxAt(1.5, FLOOR_Y, CZ - 0.06, 1.62, FLOOR_Y + 1.02, CZ + 0.78, toon(0xdcd8ce), { parent: interiorGroup });
  // 通道小门
  boxAt(1.62, FLOOR_Y, CZ + 0.78, 2.1, FLOOR_Y + 0.95, CZ + 0.84, toon(0xe4e0d6), { parent: interiorGroup, outline: true });
  // POS 收银机
  const reg = group({ parent: interiorGroup, x: 3.5, y: FLOOR_Y + 1.09, z: CZ + 0.30 });
  box(0.42, 0.36, 0.34, toon(0x3b4456), { parent: reg, y: 0.18, outline: true });
  const scr = box(0.34, 0.24, 0.02, emit(0x9fd6ff, 1.25), { parent: reg, y: 0.20, z: -0.18 });
  box(0.3, 0.1, 0.24, toon(0xd8dce4), { parent: reg, y: 0.05, z: 0.05 });
  box(0.24, 0.02, 0.18, toon(0x2b3243), { parent: reg, y: 0.08, z: 0.2 });
  // 客用显示屏
  const cdisp = box(0.26, 0.18, 0.02, emit(0xffe0a0, 1.2), { parent: interiorGroup, x: 3.5, y: FLOOR_Y + 1.32, z: CZ - 0.02, rx: -0.35 });
  // 读卡器 / 扫码
  box(0.16, 0.1, 0.12, toon(0xdfe3ea), { parent: interiorGroup, x: 3.05, y: FLOOR_Y + 1.15, z: CZ + 0.2, outline: true });
  box(0.1, 0.14, 0.1, toon(0x2b3243), { parent: interiorGroup, x: 2.75, y: FLOOR_Y + 1.17, z: CZ + 0.3 });
  // 购物篮堆
  for (let i = 0; i < 4; i++) {
    boxAt(2.2, FLOOR_Y + i * 0.11, CZ + 0.18, 2.55, FLOOR_Y + 0.1 + i * 0.11, CZ + 0.56, toon(i % 2 ? 0x9fc4e8 : 0xbcd8f2), { parent: interiorGroup });
  }
  // 香烟柜（前右实墙内侧）
  const cig = group({ parent: interiorGroup });
  boxAt(1.75, FLOOR_Y + 1.15, S.z1 - WALL_T - 0.26, 4.3, FLOOR_Y + 2.45, S.z1 - WALL_T - 0.02, toon(0x2f3646), { parent: cig, outline: true });
  for (let r = 0; r < 4; r++) {
    const ry = FLOOR_Y + 1.32 + r * 0.28;
    boxAt(1.78, ry - 0.02, S.z1 - WALL_T - 0.27, 4.28, ry, S.z1 - WALL_T - 0.05, emit(0xffe9c4, 1.2), { parent: cig });
    for (let c = 0; c < 11; c++) {
      const px = lerp(1.92, 4.14, c / 10);
      addProd('cig', px, ry + 0.046, S.z1 - WALL_T - 0.16, 0, null, 1);
    }
  }
  signPlane(2.4, 0.22, makeTex(512, 64, (g, W, H) => {
    g.fillStyle = '#2f3646'; g.fillRect(0, 0, W, H);
    txt(g, 'たばこ ・ 金券', W / 2, H * 0.5, { size: 36, color: '#ffd9a0' });
  }), { mul: 1.1, x: 3.0, y: FLOOR_Y + 2.56, z: S.z1 - WALL_T - 0.10, parent: interiorGroup });

  /* ---- 咖啡机 / 关东煮 / 热食柜（收银台后方） ---- */
  const backTop = FLOOR_Y + 1.02;
  boxAt(1.55, FLOOR_Y, CZ + 1.05, 4.32, FLOOR_Y + 0.98, CZ + 1.5, toon(0xe0dcd2), { parent: interiorGroup, outline: true });
  boxAt(1.5, FLOOR_Y + 0.98, CZ + 1.0, 4.36, FLOOR_Y + 1.05, CZ + 1.55, toon(0xd2cec4), { parent: interiorGroup });
  // 咖啡机
  const cm = group({ parent: interiorGroup, x: 2.45, y: FLOOR_Y + 1.05, z: CZ + 1.26 });
  box(0.6, 0.86, 0.5, toon(0x4a3f36), { parent: cm, y: 0.43, outline: true });
  box(0.52, 0.26, 0.02, emit(0xffd9a0, 1.3), { parent: cm, y: 0.68, z: -0.26 });
  box(0.52, 0.16, 0.02, emit(0xa8dcff, 1.15), { parent: cm, y: 0.42, z: -0.26 });
  box(0.6, 0.08, 0.42, toon(0x2f2a26), { parent: cm, y: 0.12, z: 0.06 });
  cyl(0.035, 0.035, 0.1, 8, toon(0xd8dce4), { parent: cm, x: 0, y: 0.2, z: -0.12 });
  cyl(0.035, 0.035, 0.1, 8, toon(0xd8dce4), { parent: cm, x: 0.16, y: 0.2, z: -0.12 });
  box(0.14, 0.18, 0.14, toon(0xe8e2d8), { parent: cm, x: -0.3, y: 0.9, z: 0 });
  box(0.1, 0.12, 0.1, toon(0x8d93a0), { parent: cm, x: -0.3, y: 1.02, z: 0 });
  // 关东煮柜台
  const oden = group({ parent: interiorGroup, x: 3.55, y: FLOOR_Y + 1.05, z: CZ + 1.24 });
  boxAt(-0.52, 0, -0.36, 0.52, 0.16, 0.34, toon(0xb9c0cb), { parent: oden, outline: true });
  boxAt(-0.46, 0.16, -0.30, 0.46, 0.34, 0.28, toon(0xc9d0dc), { parent: oden, outline: true });
  const soup = boxAt(-0.42, 0.32, -0.26, 0.42, 0.35, 0.24, emit(0xffd9a0, 1.05), { parent: oden });
  // 关东煮串
  for (let i = 0; i < 12; i++) {
    const px = -0.36 + (i % 6) * 0.145, pz = -0.18 + Math.floor(i / 6) * 0.3;
    cyl(0.028, 0.03, 0.075, 8, toon(pick([0xd9a86a, 0xf0e0bd, 0xc98f5a, 0xe8d3a8])), { parent: oden, x: px, y: 0.40, z: pz });
    cyl(0.006, 0.006, 0.14, 5, toon(0xe0d6c0), { parent: oden, x: px, y: 0.50, z: pz });
  }
  // 蒸汽
  const steam = makeSteam(3.55, FLOOR_Y + 1.42, CZ + 1.24, 16, 0.9);
  // 热食柜（炸物）
  const hot = group({ parent: interiorGroup, x: 1.95, y: FLOOR_Y + 1.05, z: CZ + 1.24 });
  boxAt(-0.3, 0, -0.34, 0.3, 0.14, 0.32, toon(0xc9d0dc), { parent: hot, outline: true });
  boxAt(-0.26, 0.14, -0.30, 0.26, 0.30, 0.28, emit(0xffe0a8, 1.1), { parent: hot });
  const hg = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), glassMat(0xd8ecff, 0.14));
  hg.position.set(0, 0.38, 0.30); hot.add(hg);
  boxAt(-0.28, 0.30, -0.32, 0.28, 0.62, -0.28, toon(0xdfe3ea), { parent: hot, outline: true });
  boxAt(-0.26, 0.30, -0.30, 0.26, 0.58, -0.34, emit(0xfff0d0, 1.0), { parent: hot });
  for (let i = 0; i < 6; i++) {
    box(0.085, 0.05, 0.13, toon(pick([0xd9a24a, 0xc98f3a, 0xe0b060])), { parent: hot, x: -0.2 + (i % 3) * 0.16, y: 0.18, z: -0.12 + Math.floor(i / 3) * 0.2 });
  }

  /* ---- 杂志架（左墙近窗） ---- */
  const magFrame = toon(0xd8d2c6);
  boxAt(S.x0 + WALL_T, FLOOR_Y, 1.35, S.x0 + WALL_T + 0.42, FLOOR_Y + 1.5, 3.45, magFrame, { parent: interiorGroup, outline: true });
  const magT = [magCoverTex(210), magCoverTex(20), magCoverTex(330), magCoverTex(140), magCoverTex(50), magCoverTex(265)];
  for (let r = 0; r < 4; r++) {
    const ry = FLOOR_Y + 0.30 + r * 0.36;
    boxAt(S.x0 + WALL_T + 0.06, ry, 1.4, S.x0 + WALL_T + 0.42, ry + 0.03, 3.4, toon(0xe4dfd4), { parent: interiorGroup });
    for (let c = 0; c < 3; c++) {
      const pz = lerp(1.68, 3.12, c / 2);
      const p = signPlane(0.28, 0.36, magT[(r * 3 + c) % magT.length], {
        lit: false, x: S.x0 + WALL_T + 0.22, y: ry + 0.20, z: pz, ry: Math.PI / 2 - 0.22, parent: interiorGroup
      });
      boxAt(S.x0 + WALL_T + 0.06, ry + 0.03, pz - 0.14, S.x0 + WALL_T + 0.4, ry + 0.05, pz + 0.14, toon(0xcfc9bd), { parent: interiorGroup });
    }
  }
  signPlane(1.6, 0.22, makeTex(384, 64, (g, W, H) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, W, H);
    txt(g, '雑誌 ・ コミック', W / 2, H * 0.5, { size: 38, color: '#3b4456' });
  }), { mul: 1.1, x: S.x0 + WALL_T + 0.22, y: FLOOR_Y + 1.62, z: 2.4, ry: Math.PI / 2, parent: interiorGroup });

  /* ---- 复印机 / 垃圾桶（入口左） ---- */
  const cp = group({ parent: interiorGroup, x: -3.55, y: FLOOR_Y, z: 3.55 });
  boxAt(-0.4, 0, -0.32, 0.4, 1.05, 0.32, toon(0xdfe3ea), { parent: cp, outline: true });
  boxAt(-0.34, 1.05, -0.26, 0.34, 1.16, 0.26, toon(0xc9d0dc), { parent: cp });
  boxAt(-0.3, 1.16, -0.22, 0.3, 1.24, 0.22, emit(0xbfe0ff, 1.0), { parent: cp });
  boxAt(-0.22, 0.55, 0.32, 0.28, 0.9, 0.36, emit(0xa8dcff, 1.15), { parent: cp });
  signPlane(0.7, 0.2, makeTex(224, 64, (g, W, H) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, W, H);
    txt(g, 'コピー・FAX', W / 2, H * 0.5, { size: 28, color: '#2f6fbf' });
  }), { mul: 1.1, x: -3.55, y: FLOOR_Y + 1.42, z: 3.9, parent: interiorGroup });
  // 垃圾桶
  cyl(0.16, 0.14, 0.5, 12, toon(0xb9c0cb), { x: -4.0, y: FLOOR_Y + 0.25, z: 3.9, parent: interiorGroup, outline: true });
  // 伞桶（店内）
  cyl(0.12, 0.1, 0.42, 12, toon(0xa9b0bc), { x: -2.9, y: FLOOR_Y + 0.21, z: 3.85, parent: interiorGroup, outline: true });

  /* ---- 地面导视 ---- */
  const arrowT = makeTex(256, 512, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#7fbf5f';
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      const y = 40 + i * 110;
      g.moveTo(W * 0.5, y);
      g.lineTo(W * 0.86, y + 56);
      g.lineTo(W * 0.66, y + 56);
      g.lineTo(W * 0.66, y + 84);
      g.lineTo(W * 0.34, y + 84);
      g.lineTo(W * 0.34, y + 56);
      g.lineTo(W * 0.14, y + 56);
      g.closePath();
      g.fill();
    }
  });
  const arrowMat = new THREE.MeshBasicMaterial({ map: arrowT, transparent: true, opacity: 0.85, depthWrite: false });
  const ar = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.24), arrowMat);
  ar.rotation.x = -Math.PI / 2;
  ar.position.set(-1.4, FLOOR_Y + 0.008, 3.3);
  ar.renderOrder = 3;
  interiorGroup.add(ar);
  const ar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), arrowMat);
  ar2.rotation.x = -Math.PI / 2;
  ar2.rotation.z = -Math.PI / 2;
  ar2.position.set(0.5, FLOOR_Y + 0.008, 2.9);
  ar2.renderOrder = 3;
  interiorGroup.add(ar2);
  signPlane(0.9, 0.2, makeTex(256, 56, (g, W, H) => {
    g.fillStyle = '#fdfaf3'; g.fillRect(0, 0, W, H);
    txt(g, 'お会計はこちら →', W / 2, H * 0.5, { size: 26, color: '#2f9e63' });
  }), { lit: false, x: 2.6, y: FLOOR_Y + 0.008, z: 1.6, rx: -Math.PI / 2, rz: Math.PI, parent: interiorGroup });

  /* ---- 墙面海报 ---- */
  [[-3.6, 1.05, S.z0 + WALL_T + 0.03, posterTex(200, 'のどごし', '新発売')],
  [-2.2, 1.05, S.z0 + WALL_T + 0.03, posterTex(340, 'アイス', '全品 20円引')],
  [S.x0 + WALL_T + 0.03, 1.3, 0.6, posterTex(160, 'コーヒー', 'M 150円')],
  [S.x0 + WALL_T + 0.03, 1.3, -0.5, posterTex(280, 'ATM', '24時間')]
  ].forEach((p, i) => {
    const vertical = i >= 2;
    signPlane(0.8, 1.0, p[3], {
      lit: false, x: p[0], y: p[1], z: p[2],
      ry: vertical ? Math.PI / 2 : 0, parent: interiorGroup
    });
  });
  // 后墙上方"店内禁煙"等告示
  signPlane(1.5, 0.34, makeTex(384, 88, (g, W, H) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#c0392b'; g.lineWidth = 4; g.strokeRect(3, 3, W - 6, H - 6);
    txt(g, '店内は禁煙です', W / 2, H * 0.5, { size: 34, color: '#8d3b32' });
  }), { mul: 1.0, x: -1.4, y: FLOOR_Y + 2.3, z: S.z0 + WALL_T + 0.04, parent: interiorGroup });

  // 店内暖光晕（透过玻璃看到的"明亮空气"）
  const haloPos = [[-3.2, 1.1], [-1.4, 2.6], [0.6, 0.4], [2.8, 2.0], [-3.0, -2.2], [1.6, -2.6]];
  haloPos.forEach((hp) => {
    const sp = new THREE.Sprite(addMat(glowTex(), 0xffbe70, 0.09));
    sp.scale.set(3.6, 2.4, 1);
    sp.position.set(hp[0], FLOOR_Y + 1.5, hp[1]);
    interiorGroup.add(sp);
  });
  const frontGlow = new THREE.Sprite(addMat(glowTex(), 0xffb864, 0.08));
  frontGlow.scale.set(11, 3.2, 1);
  frontGlow.position.set(-0.6, 1.7, S.z1 - 0.15);
  interiorGroup.add(frontGlow);
  const leftGlow = new THREE.Sprite(addMat(glowTex(), 0xffbe74, 0.09));
  leftGlow.scale.set(4.4, 3.0, 1);
  leftGlow.position.set(S.x0 + 0.25, 1.6, 2.7);
  interiorGroup.add(leftGlow);

  buildProducts();
}

/* 蒸汽粒子（关东煮） */
function makeSteam(x, y, z, count, range) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = x + rr(-range * 0.4, range * 0.4);
    pos[i * 3 + 1] = y + rr(0, 0.5);
    pos[i * 3 + 2] = z + rr(-range * 0.3, range * 0.3);
    vel.push({ vy: rr(0.25, 0.5), vx: rr(-0.06, 0.06), vz: rr(-0.06, 0.06), life: rr(0, 1) });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.14, map: glowTex(), color: 0xffffff, transparent: true,
    opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  const p = new THREE.Points(geo, mat);
  p.frustumCulled = false;
  interiorGroup.add(p);
  updaters.push((dt) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const v = vel[i];
      a[i * 3 + 1] += v.vy * dt;
      a[i * 3] += v.vx * dt;
      a[i * 3 + 2] += v.vz * dt;
      v.life += dt * 0.5;
      if (v.life > 1) {
        v.life = 0;
        a[i * 3] = x + rr(-range * 0.4, range * 0.4);
        a[i * 3 + 1] = y;
        a[i * 3 + 2] = z + rr(-range * 0.3, range * 0.3);
      }
    }
    geo.attributes.position.needsUpdate = true;
  });
  return p;
}

/* ------------------------------------------------------------ 屋顶 */
function buildRoof() {
  const roofMat = toon(0x8b91a0);
  const parapet = toon(0xa9b0bd);
  boxAt(S.x0, ROOF_Y, S.z0, S.x1, ROOF_Y + 0.14, S.z1, roofMat, { outline: true });
  boxAt(S.x0 - 0.08, ROOF_Y + 0.14, S.z0 - 0.08, S.x1 + 0.08, ROOF_Y + 0.42, S.z0 + 0.1, parapet, { outline: true });
  boxAt(S.x0 - 0.08, ROOF_Y + 0.14, S.z1 - 0.1, S.x1 + 0.08, ROOF_Y + 0.42, S.z1 + 0.08, parapet, { outline: true });
  boxAt(S.x0 - 0.08, ROOF_Y + 0.14, S.z0, S.x0 + 0.1, ROOF_Y + 0.42, S.z1, parapet, { outline: true });
  boxAt(S.x1 - 0.1, ROOF_Y + 0.14, S.z0, S.x1 + 0.08, ROOF_Y + 0.42, S.z1, parapet, { outline: true });
  // 屋顶地面
  boxAt(S.x0 + 0.1, ROOF_Y + 0.14, S.z0 + 0.1, S.x1 - 0.1, ROOF_Y + 0.18, S.z1 - 0.1, toon(0x4b515f));
  acUnit(scene, 2.6, ROOF_Y + 0.5, 1.4, 0.2, 1.1);
  acUnit(scene, 3.5, ROOF_Y + 0.5, 1.4, -0.1, 0.85);
  cyl(0.28, 0.28, 0.9, 12, toon(0xa9b0bc), { x: -3.4, y: ROOF_Y + 0.65, z: 3.2, outline: true });
  cyl(0.12, 0.12, 0.7, 10, toon(0x8d93a0), { x: -2.6, y: ROOF_Y + 0.55, z: -3.4, outline: true });
  cyl(0.16, 0.16, 0.1, 10, toon(0x767c8a), { x: -2.6, y: ROOF_Y + 0.94, z: -3.4 });
  // 检修梯
  const ladder = group({ parent: scene, x: S.x1 - 0.2, y: ROOF_Y + 0.2, z: -3.6 });
  for (let i = 0; i < 8; i++) {
    cylBetween(new THREE.Vector3(0, i * 0.32, -0.18), new THREE.Vector3(0, i * 0.32, 0.18), 0.022, toon(0x8d93a0), ladder, 5);
  }
  cylBetween(new THREE.Vector3(0, 0, -0.18), new THREE.Vector3(0, 2.5, -0.18), 0.026, toon(0x8d93a0), ladder, 5);
  cylBetween(new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(0, 2.5, 0.18), 0.026, toon(0x8d93a0), ladder, 5);
}
