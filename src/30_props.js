/* ============================================================================
   30 — 街道道具：自动贩卖机 / 自行车 / 伞架 / 垃圾桶 / 路灯 / 电线杆 / 路牌 /
        凸面镜 / 公告栏 / のぼり旗 / 盆栽 / 交通信号
   ========================================================================== */

const swayList = [];     // 轻微摆动的东西
const uTime = { value: 0 };

/* 电线材质：顶点轻微摆动 */
function wireMat(color) {
  const m = new THREE.MeshToonMaterial({ color: color, gradientMap: gradRamp });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  transformed.y += sin(uTime*1.1 + transformed.x*0.45 + transformed.z*0.3)*0.035;'
    );
  };
  return m;
}

/* ------------------------------------------------------------ 自动贩卖机 */
function vendFaceTex(main, accent, warm) {
  return makeTex(512, 1024, (g, W, H) => {
    g.fillStyle = '#eef2f6'; g.fillRect(0, 0, W, H);
    // 顶部品牌带
    g.fillStyle = main; g.fillRect(0, 0, W, H * 0.13);
    g.fillStyle = '#ffffff';
    txt(g, 'ドリンク', W * 0.30, H * 0.065, { size: 62, color: '#ffffff' });
    txt(g, '24H', W * 0.82, H * 0.065, { size: 62, color: '#ffffff' });
    // 展示区
    const top = H * 0.15, rowH = H * 0.155;
    for (let r = 0; r < 4; r++) {
      const y = top + r * rowH;
      g.fillStyle = r % 2 ? '#e7edf3' : '#f6f9fc';
      g.fillRect(0, y, W, rowH);
      for (let c = 0; c < 5; c++) {
        const x = W * 0.06 + c * W * 0.185;
        const col = 'hsl(' + ((r * 67 + c * 41 + (warm ? 12 : 190)) % 360) + ',72%,' + (48 + (c % 3) * 7) + '%)';
        const kind = (r + c) % 3;
        g.fillStyle = col;
        if (kind === 0) { roundRect(g, x + 8, y + rowH * 0.18, W * 0.13, rowH * 0.66, 6); g.fill(); }
        else if (kind === 1) { roundRect(g, x + 12, y + rowH * 0.12, W * 0.11, rowH * 0.74, 10); g.fill(); }
        else { g.beginPath(); g.ellipse(x + W * 0.065, y + rowH * 0.5, W * 0.062, rowH * 0.36, 0, 0, TAU); g.fill(); }
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillRect(x + W * 0.03, y + rowH * 0.34, W * 0.08, rowH * 0.1);
        g.fillStyle = '#ffffff'; g.fillRect(x + W * 0.02, y + rowH * 0.72, W * 0.1, 5);
        g.fillStyle = '#d94436'; g.fillRect(x + W * 0.03, y + rowH * 0.84, W * 0.07, rowH * 0.09);
      }
      g.fillStyle = 'rgba(60,70,90,0.25)'; g.fillRect(0, y + rowH - 4, W, 4);
    }
    // 价格条 / 按钮
    g.fillStyle = warm ? '#c0392b' : '#2f6fbf';
    g.fillRect(0, H * 0.78, W, H * 0.05);
    txt(g, warm ? 'あたたかい' : 'つめた〜い', W * 0.5, H * 0.805, { size: 40, color: '#fff' });
    for (let c = 0; c < 5; c++) {
      g.fillStyle = '#c9d2dc';
      g.fillRect(W * 0.06 + c * W * 0.185, H * 0.845, W * 0.13, H * 0.022);
      g.fillStyle = '#f4802c';
      g.fillRect(W * 0.06 + c * W * 0.185, H * 0.872, W * 0.13, H * 0.012);
      g.fillStyle = '#8892a0';
      g.fillRect(W * 0.06 + c * W * 0.185, H * 0.89, W * 0.13, H * 0.01);
    }
    g.fillStyle = '#dde3ea'; g.fillRect(0, H * 0.915, W, H * 0.085);
    g.fillStyle = '#3b4456'; g.fillRect(W * 0.06, H * 0.935, W * 0.5, H * 0.045);
    g.fillStyle = '#2b3243'; g.fillRect(W * 0.62, H * 0.93, W * 0.3, H * 0.03);
  });
}
function vendingMachine(x, z, ry, main, accent, warm) {
  const g = group({ x: x, z: z, ry: ry });
  const y0 = surfY(x, z);
  const body = toon(accent);
  boxAt(-0.56, y0, -0.36, 0.56, y0 + 1.96, 0.34, body, { parent: g, outline: true });
  boxAt(-0.58, y0 + 1.96, -0.38, 0.58, y0 + 2.04, 0.36, toon(0x2f3646), { parent: g, outline: true });
  boxAt(-0.5, y0 + 0.02, 0.34, 0.5, y0 + 1.94, 0.365, toon(0xd8dee6), { parent: g });
  const face = signPlane(0.98, 1.9, vendFaceTex(main, accent, warm), {
    mul: warm ? 1.32 : 1.42, x: 0, y: y0 + 0.99, z: 0.375, parent: g
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 1.86), glassMat(0xd8ecff, 0.12));
  glass.position.set(0, y0 + 0.99, 0.40);
  g.add(glass);
  // 取物口 / 投币口 / 退币
  boxAt(-0.44, y0 + 0.16, 0.36, 0.44, y0 + 0.52, 0.40, toon(0x232833), { parent: g });
  boxAt(-0.44, y0 + 0.16, 0.40, 0.44, y0 + 0.20, 0.42, toon(0x59617a), { parent: g });
  boxAt(0.30, y0 + 1.55, 0.38, 0.46, y0 + 1.70, 0.42, toon(0x9aa1ad), { parent: g });
  cyl(0.035, 0.035, 0.02, 10, toon(0x6b7280), { parent: g, x: 0.38, y: y0 + 1.62, z: 0.43, rx: Math.PI / 2 });
  boxAt(-0.5, y0 + 1.52, 0.38, -0.2, y0 + 1.72, 0.42, toon(0x2b3243), { parent: g });
  for (let i = 0; i < 3; i++) {
    boxAt(-0.46, y0 + 1.56 + i * 0.05, 0.42, -0.24, y0 + 1.58 + i * 0.05, 0.44, emit(0x8ef0b6, 1.2), { parent: g });
  }
  // 侧面散热格栅与底座
  for (let i = 0; i < 5; i++) {
    boxAt(0.57, y0 + 0.35 + i * 0.16, -0.2, 0.60, y0 + 0.42 + i * 0.16, 0.2, toon(0x2b3243), { parent: g });
  }
  boxAt(-0.56, y0 - 0.02, -0.36, 0.56, y0 + 0.03, 0.34, toon(0x2b3243), { parent: g });
  // 光晕与灯
  const sp = new THREE.Sprite(addMat(glowTex(), warm ? 0xffd0a0 : 0xbfe4ff, 0.5));
  sp.scale.set(3.0, 3.0, 1);
  sp.position.set(x, y0 + 1.05, z + 0.5);
  scene.add(sp);
  const pl = new THREE.PointLight(warm ? 0xffcf9a : 0xbfe0ff, 0.85, 6.5, 2);
  pl.position.set(x, y0 + 1.1, z + 0.7);
  scene.add(pl);
  emitters.push({ x: x, z: z + 0.55, y: y0 + 0.01, color: warm ? 0xffb877 : 0x8fd4ff, len: 4.6, wid: 1.05, op: 0.5 });
  emitters.push({ x: x, z: Math.max(z + 0.55, LAY.RA_Z0 + 0.5), y: LAY.ROAD_Y + 0.01, color: warm ? 0xffb877 : 0x8fd4ff, len: 8.5, wid: 1.3, op: 0.42 });
  return g;
}

/* ------------------------------------------------------------ 自行车 */
function bikeWheel(x, y, z, mat, spokeTex) {
  const w = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 6, 20), mat);
  t.position.set(x, y, z);
  w.add(t);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.31, 20),
    new THREE.MeshBasicMaterial({ map: spokeTex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  disc.position.set(x, y, z + 0.001);
  w.add(disc);
  const hub = cyl(0.035, 0.035, 0.06, 8, toon(0xc9d0dc), { x: x, y: y, z: z, rx: Math.PI / 2 });
  w.add(hub);
  return w;
}
function spokeTexture() {
  return makeTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(210,220,235,0.75)'; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      g.save(); g.translate(w / 2, h / 2); g.rotate((i / 14) * TAU);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -w / 2 + 3); g.stroke(); g.restore();
    }
  });
}
const SPOKE_TEX = spokeTexture();
function buildBike(x, z, ry, color, lean) {
  const g = group({ x: x, z: z, ry: ry, rz: lean || 0 });
  const y0 = surfY(x, z);
  const frame = toon(color);
  const dark = toon(0x2f3646);
  const metal = toon(0xb9c0cb);
  g.add(bikeWheel(0.52, y0 + 0.34, 0, dark, SPOKE_TEX));
  g.add(bikeWheel(-0.52, y0 + 0.34, 0, dark, SPOKE_TEX));
  const P = (px, py, pz) => new THREE.Vector3(px, y0 + py, pz);
  // 车架
  cylBetween(P(-0.52, 0.34, 0), P(-0.16, 0.36, 0), 0.022, frame, g, 6);
  cylBetween(P(-0.16, 0.36, 0), P(0.05, 0.78, 0), 0.024, frame, g, 6);
  cylBetween(P(0.05, 0.78, 0), P(0.34, 0.72, 0), 0.022, frame, g, 6);
  cylBetween(P(0.34, 0.72, 0), P(0.52, 0.34, 0), 0.022, frame, g, 6);
  cylBetween(P(-0.16, 0.36, 0), P(0.34, 0.72, 0), 0.020, frame, g, 6);
  cylBetween(P(0.05, 0.78, 0), P(-0.05, 1.02, 0), 0.02, frame, g, 6);
  cylBetween(P(0.34, 0.72, 0), P(0.30, 0.98, 0), 0.02, metal, g, 6);
  // 车把
  cylBetween(P(0.30, 0.98, -0.22), P(0.30, 0.98, 0.22), 0.02, metal, g, 6);
  cylBetween(P(0.30, 0.98, -0.2), P(0.22, 0.97, -0.26), 0.02, metal, g, 6);
  cylBetween(P(0.30, 0.98, 0.2), P(0.22, 0.97, 0.26), 0.02, metal, g, 6);
  // 车座
  box(0.16, 0.05, 0.09, dark, { parent: g, x: -0.06, y: y0 + 1.04 });
  cylBetween(P(-0.05, 1.02, 0), P(-0.06, 1.0, 0), 0.018, metal, g, 6);
  // 前筐
  boxAt(0.42, y0 + 0.62, -0.16, 0.70, y0 + 0.84, 0.16, toon(0x8d94a1), { parent: g, outline: true });
  boxAt(0.44, y0 + 0.64, -0.14, 0.68, y0 + 0.82, 0.14, toon(0x5b6272), { parent: g });
  // 后货架 / 挡泥板
  boxAt(-0.72, y0 + 0.62, -0.08, -0.30, y0 + 0.66, 0.08, metal, { parent: g });
  [0.52, -0.52].forEach((wx) => {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.012, 5, 12, Math.PI * 0.75), metal);
    f.position.set(wx, y0 + 0.32, 0);
    f.rotation.z = wx > 0 ? -0.35 : 2.4;
    g.add(f);
  });
  // 曲柄 / 踏板
  cyl(0.055, 0.055, 0.12, 8, dark, { parent: g, x: -0.16, y: y0 + 0.36, rz: Math.PI / 2 });
  box(0.10, 0.025, 0.05, dark, { parent: g, x: -0.16, y: y0 + 0.30, z: 0.10 });
  box(0.10, 0.025, 0.05, dark, { parent: g, x: -0.16, y: y0 + 0.42, z: -0.10 });
  // 链罩
  box(0.36, 0.13, 0.02, frame, { parent: g, x: -0.18, y: y0 + 0.34, z: 0.07 });
  // 车灯（发电机灯）
  cyl(0.045, 0.05, 0.09, 10, metal, { parent: g, x: 0.60, y: y0 + 0.52, z: 0, rz: Math.PI / 2, outline: true });
  const lens = cyl(0.04, 0.04, 0.02, 10, emit(0xfff0c8, 1.5), { parent: g, x: 0.645, y: y0 + 0.52, z: 0, rz: Math.PI / 2 });
  // 尾部反光片
  box(0.03, 0.07, 0.05, emit(0xff6a5a, 1.2), { parent: g, x: -0.78, y: y0 + 0.55, z: 0 });
  return g;
}

/* ------------------------------------------------------------ 伞架 / 伞 */
function umbrella(x, z, ry, lean, color, clear) {
  const g = group({ x: x, z: z, ry: ry, rz: lean });
  const y0 = surfY(x, z);
  const shaft = cyl(0.012, 0.012, 0.72, 6, toon(0xbfc5cf), { parent: g, y: y0 + 0.36 });
  const canopyMat = clear ? glassMat(color, 0.42, { shininess: 90 }) : toon(color);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.24, 9, 1, true), canopyMat);
  canopy.position.set(0, y0 + 0.72, 0);
  g.add(canopy);
  if (clear) {
    O(canopy);
  }
  cyl(0.014, 0.014, 0.1, 6, toon(0x8d94a1), { parent: g, y: y0 + 0.88 });
  const handle = cyl(0.018, 0.018, 0.11, 8, toon(0x6b4423), { parent: g, y: y0 + 0.04 });
  return g;
}
function buildUmbrellaStand() {
  const x = -3.75, z = 5.05;
  const y0 = surfY(x, z);
  const stand = cyl(0.19, 0.16, 0.52, 14, toon(0xa9b0bc), { x: x, y: y0 + 0.26, z: z, outline: true });
  cyl(0.2, 0.2, 0.03, 14, toon(0x8d94a1), { x: x, y: y0 + 0.52, z: z });
  const cols = [0xd94b3f, 0x2f6fbf, 0xdfe6ee, 0x2f9e63, 0xdfe6ee];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.4;
    umbrella(x + Math.cos(a) * 0.09, z + Math.sin(a) * 0.09, a, Math.cos(a) * 0.16, cols[i], i !== 0 && i !== 1);
  }
  // 靠在墙上的长柄伞
  const lean = umbrella(-4.15, 4.75, -0.5, -0.34, 0x2f6fbf, false);
  // 告示牌
  signPlane(0.36, 0.5, makeTex(128, 176, (g, W, H) => {
    g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f6fbf'; g.lineWidth = 5; g.strokeRect(4, 4, W - 8, H - 8);
    txt(g, '傘の', W / 2, H * 0.28, { size: 32, color: '#2b3550' });
    txt(g, '持ち去り', W / 2, H * 0.5, { size: 26, color: '#c0392b' });
    txt(g, '禁止', W / 2, H * 0.72, { size: 32, color: '#c0392b' });
  }), { mul: 1.05, x: x - 0.3, y: y0 + 0.85, z: z - 0.06, ry: 0.5 });
}
/* ------------------------------------------------------------ 垃圾桶 */
function buildTrashBins() {
  const x0 = 3.35, z = 5.15;
  const y0 = surfY(x0, z);
  const cols = [0x2f6fbf, 0xd94b3f, 0x2f9e63];
  const labels = ['カン', 'ペットボトル', 'もえるゴミ'];
  boxAt(x0 - 0.14, y0, z - 0.4, x0 + 1.5, y0 + 0.5, z + 0.4, toon(0x8d94a1), { outline: true });
  for (let i = 0; i < 3; i++) {
    const bx = x0 + i * 0.46;
    boxAt(bx, y0 + 0.5, z - 0.28, bx + 0.4, y0 + 0.96, z + 0.28, toon(0xb9c0cb), { outline: true });
    boxAt(bx + 0.02, y0 + 0.96, z - 0.26, bx + 0.38, y0 + 1.02, z + 0.26, toon(cols[i]), { outline: true });
    boxAt(bx + 0.09, y0 + 0.98, z - 0.18, bx + 0.31, y0 + 1.03, z + 0.18, toon(0x2b3243));
    signPlane(0.34, 0.16, makeTex(160, 72, (g, W, H) => {
      g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, W, H);
      txt(g, labels[i], W / 2, H * 0.5, { size: 26, color: '#2b3550' });
    }), { lit: false, x: bx + 0.2, y: y0 + 0.74, z: z + 0.29 });
  }
  signPlane(1.1, 0.24, makeTex(384, 80, (g, W, H) => {
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f9e63'; g.fillRect(0, H - 8, W, 8);
    txt(g, 'ゴミは分別してね', W / 2, H * 0.46, { size: 34, color: '#2b3550' });
  }), { mul: 1.05, x: x0 + 0.68, y: y0 + 1.35, z: z - 0.05 });
  cyl(0.05, 0.05, 0.34, 8, toon(0x8d94a1), { x: x0 + 0.68, y: y0 + 1.06, z: z - 0.05 });
}

/* ------------------------------------------------------------ 路灯 */
function streetLamp(x, z, ry, tall) {
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  const poleMat = toon(0x9aa1ad);
  cyl(0.09, 0.13, tall, 12, poleMat, { parent: g, y: y0 + tall / 2, outline: true });
  cyl(0.17, 0.19, 0.22, 12, toon(0x767c8a), { parent: g, y: y0 + 0.11 });
  // 弯臂
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.055, 6, 12, Math.PI * 0.52), poleMat);
  arm.position.set(-0.85, y0 + tall, 0);
  arm.rotation.z = -Math.PI * 0.5;
  g.add(arm);
  const head = group({ parent: g, x: -1.7, y: y0 + tall + 0.34 });
  box(0.62, 0.12, 0.3, toon(0xc9d0dc), { parent: head, outline: true });
  box(0.5, 0.05, 0.22, emit(0xdff0ff, 1.6), { parent: head, y: -0.07 });
  const sp = new THREE.Sprite(addMat(glowTex(), 0xcfe6ff, 0.62));
  sp.scale.set(3.4, 3.4, 1);
  sp.position.set(x - 1.7 * Math.cos(ry), y0 + tall + 0.3, z + 1.7 * Math.sin(ry));
  scene.add(sp);
  const pl = new THREE.PointLight(0xd6ecff, 1.0, 15, 2);
  pl.position.set(x - 1.62 * Math.cos(ry), y0 + tall + 0.25, z + 1.62 * Math.sin(ry));
  scene.add(pl);
  emitters.push({
    x: x - 1.6 * Math.cos(ry), z: z + 1.6 * Math.sin(ry), y: y0 + 0.01,
    color: 0xbfe0ff, len: 9.0, wid: 1.5, op: 0.42
  });
  return g;
}

/* ------------------------------------------------------------ 电线杆 */
function utilityPole(x, z, ry, h) {
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  const concrete = toon(0xa8aeb9);
  cyl(0.13, 0.20, h, 12, concrete, { parent: g, y: y0 + h / 2, outline: true });
  // 横担 + 绝缘子
  [0, 1].forEach((i) => {
    const ay = y0 + h - 0.5 - i * 0.85;
    boxAt(-1.15, ay, -0.06, 1.15, ay + 0.09, 0.06, toon(0x8d94a1), { parent: g, outline: true });
    [-1.0, -0.5, 0.5, 1.0].forEach((ix) => {
      cyl(0.045, 0.055, 0.13, 8, toon(0xd8dce4), { parent: g, x: ix, y: ay + 0.15, z: 0 });
      cyl(0.02, 0.02, 0.1, 6, toon(0x8d94a1), { parent: g, x: ix, y: ay + 0.25, z: 0 });
    });
  });
  // 变压器
  cyl(0.30, 0.30, 0.72, 14, toon(0x9aa1ad), { parent: g, x: 0.42, y: y0 + h - 2.0, z: 0, outline: true });
  boxAt(0.30, y0 + h - 1.64, -0.14, 0.54, y0 + h - 1.5, 0.14, toon(0x8d94a1), { parent: g });
  // 爬梯脚钉 / 警示牌
  for (let i = 0; i < 7; i++) {
    cyl(0.018, 0.018, 0.24, 6, toon(0x8d94a1), { parent: g, x: -0.16, y: y0 + 0.7 + i * 0.5, z: 0, rz: Math.PI / 2 });
  }
  signPlane(0.4, 0.56, makeTex(128, 176, (g2, W, H) => {
    g2.fillStyle = '#f4d03f'; g2.fillRect(0, 0, W, H);
    g2.fillStyle = '#2b3243'; g2.fillRect(0, 0, W, H * 0.3);
    txt(g2, '危険', W / 2, H * 0.16, { size: 30, color: '#f4d03f' });
    txt(g2, '足元', W / 2, H * 0.45, { size: 26, color: '#2b3243' });
    txt(g2, '注意', W / 2, H * 0.66, { size: 26, color: '#2b3243' });
    txt(g2, '高圧', W / 2, H * 0.86, { size: 22, color: '#c0392b' });
  }), { lit: false, x: 0.02, y: y0 + 1.9, z: 0.21, ry: Math.PI / 2, parent: g });
  return g;
}
function wire(a, b, sag, r, mat) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector3(
      lerp(a.x, b.x, t), lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * sag, lerp(a.z, b.z, t)
    ));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, r || 0.022, 5, false);
  const m = new THREE.Mesh(geo, mat);
  scene.add(m);
  return m;
}
function buildUtilityPoles() {
  const wm = wireMat(0x2b3243);
  const A = { x: 5.4, z: 5.95, y: surfY(5.4, 5.95) };
  const B = { x: -6.35, z: -10.6, y: surfY(-6.35, -10.6) };
  utilityPole(A.x, A.z, -0.25, 9.2);
  utilityPole(B.x, B.z, 0.3, 8.4);
  const hA = A.y + 9.2, hB = B.y + 8.4;
  // 主线路
  [[-1.0, 0], [-0.5, 0], [0.5, 0], [1.0, 0]].forEach((o) => {
    const ax = A.x + o[0] * Math.cos(-0.25), az = A.z + o[0] * Math.sin(0.25);
    const bx = B.x + o[0] * Math.cos(0.3), bz = B.z + o[0] * Math.sin(-0.3);
    wire(new THREE.Vector3(ax, hA - 0.35, az), new THREE.Vector3(bx, hB - 0.35, bz), 0.9, 0.022, wm);
    wire(new THREE.Vector3(ax, hA - 1.15, az), new THREE.Vector3(bx, hB - 1.15, bz), 0.85, 0.018, wm);
  });
  // 引下线：接便利店与邻栋
  wire(new THREE.Vector3(A.x - 0.9, hA - 0.6, A.z), new THREE.Vector3(S.x1 - 0.3, ROOF_Y + 0.5, 1.2), 0.55, 0.02, wm);
  wire(new THREE.Vector3(A.x + 0.9, hA - 0.55, A.z), new THREE.Vector3(LAY.NB.x1 - 1.0, LAY.WALK_Y + LAY.NB.h + 0.6, 0.4), 0.5, 0.02, wm);
  wire(new THREE.Vector3(B.x + 0.6, hB - 1.6, B.z), new THREE.Vector3(1.5, LAY.WALK_Y + 5.2, -12.0), 0.6, 0.018, wm);
  // 拉线
  cylBetween(new THREE.Vector3(B.x, hB - 0.8, B.z), new THREE.Vector3(B.x + 0.9, B.y + 0.1, B.z + 0.6), 0.02, toon(0x8d94a1), scene, 6);
}

/* ------------------------------------------------------------ 路牌 */
function poleSign(x, z, h, ry, faces) {
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  cyl(0.035, 0.04, h, 10, toon(0xbfc5cf), { parent: g, y: y0 + h / 2, outline: true });
  faces.forEach((f) => {
    signPlane(f.w, f.h, f.tex, { lit: false, mul: 1.05, x: 0, y: y0 + f.y, z: 0, parent: g, ry: f.ry || 0 });
    const back = signPlane(f.w, f.h, f.tex, { lit: false, mul: 0.85, x: 0, y: y0 + f.y, z: -0.02, parent: g, ry: Math.PI });
    boxAt(-f.w / 2, y0 + f.y - f.h / 2, -0.03, f.w / 2, y0 + f.y + f.h / 2, 0.03, toon(0x9aa1ad), { parent: g });
  });
  return g;
}
function buildRoadSigns() {
  // 止まれ（倒三角）
  const stopT = makeTex(256, 256, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#c0392b';
    g.beginPath(); g.moveTo(W * 0.5, H * 0.93); g.lineTo(W * 0.04, H * 0.10); g.lineTo(W * 0.96, H * 0.10); g.closePath(); g.fill();
    g.fillStyle = '#f7f4ee';
    g.beginPath(); g.moveTo(W * 0.5, H * 0.82); g.lineTo(W * 0.16, H * 0.20); g.lineTo(W * 0.84, H * 0.20); g.closePath(); g.fill();
    g.fillStyle = '#c0392b';
    txt(g, '止まれ', W * 0.5, H * 0.44, { size: 54, color: '#c0392b' });
  });
  const sp = poleSign(-6.42, 4.95, 2.7, -Math.PI / 2, [{ w: 0.74, h: 0.74, y: 2.32, tex: stopT }]);
  // 横断歩道サイン
  const crossT = makeTex(256, 256, (g, W, H) => {
    g.fillStyle = '#2f6fbf'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f7f4ee';
    g.beginPath(); g.moveTo(W * 0.05, H * 0.05); g.lineTo(W * 0.95, H * 0.05); g.lineTo(W * 0.95, H * 0.95); g.lineTo(W * 0.05, H * 0.95); g.closePath(); g.fill();
    g.fillStyle = '#2f6fbf';
    for (let i = 0; i < 5; i++) g.fillRect(W * 0.18 + i * W * 0.13, H * 0.62, W * 0.07, H * 0.24);
    // 行人
    g.beginPath(); g.arc(W * 0.5, H * 0.20, W * 0.075, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(W * 0.5, H * 0.28); g.lineTo(W * 0.56, H * 0.5); g.lineTo(W * 0.44, H * 0.62);
    g.lineTo(W * 0.46, H * 0.62); g.lineTo(W * 0.58, H * 0.5); g.lineTo(W * 0.54, H * 0.28); g.closePath(); g.fill();
    g.fillRect(W * 0.40, H * 0.30, W * 0.2, H * 0.06);
  });
  poleSign(-6.42, 4.25, 2.7, -Math.PI / 2, [{ w: 0.6, h: 0.6, y: 2.28, tex: crossT }]);
  // 一方通行
  const oneT = makeTex(320, 200, (g, W, H) => {
    g.fillStyle = '#2f6fbf'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f7f4ee'; g.fillRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#2f6fbf'; g.fillRect(12, 12, W - 24, H - 24);
    g.fillStyle = '#f7f4ee';
    g.beginPath(); g.moveTo(W * 0.72, H * 0.3); g.lineTo(W * 0.88, H * 0.5); g.lineTo(W * 0.72, H * 0.7); g.closePath(); g.fill();
    g.fillRect(W * 0.14, H * 0.44, W * 0.6, H * 0.12);
    txt(g, '一方通行', W * 0.5, H * 0.82, { size: 30, color: '#2f6fbf' });
  });
  poleSign(4.95, 5.95, 2.6, 0.15, [{ w: 0.72, h: 0.45, y: 2.3, tex: oneT }]);
  // 停车位指示（P）
  const pT = makeTex(256, 320, (g, W, H) => {
    g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2f6fbf'; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = '#2f6fbf';
    g.fillRect(0, 0, W, H * 0.44);
    txt(g, 'P', W / 2, H * 0.22, { size: 110, color: '#ffffff' });
    txt(g, 'お客様', W / 2, H * 0.56, { size: 40, color: '#2b3550' });
    txt(g, '駐車場', W / 2, H * 0.72, { size: 40, color: '#2b3550' });
    txt(g, '2台', W / 2, H * 0.88, { size: 30, color: '#c0392b' });
  });
  poleSign(9.4, 6.05, 2.4, 0.2, [{ w: 0.56, h: 0.72, y: 2.0, tex: pT }]);
  // 街道名牌（十字路口）
  const nameT = makeTex(512, 128, (g, W, H) => {
    g.fillStyle = '#1f5c3a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#f7f4ee'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
    txt(g, 'ひかり通り', W * 0.5, H * 0.44, { size: 52, color: '#ffffff' });
    txt(g, 'HIKARI DORI', W * 0.5, H * 0.76, { size: 24, color: '#cfe3d6' });
  });
  const nameT2 = makeTex(512, 128, (g, W, H) => {
    g.fillStyle = '#1f5c3a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#f7f4ee'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
    txt(g, '光町 1丁目', W * 0.5, H * 0.44, { size: 52, color: '#ffffff' });
    txt(g, 'HIKARI-CHO', W * 0.5, H * 0.76, { size: 24, color: '#cfe3d6' });
  });
  // 街道名牌：挂在路灯杆上
  const nlx = -6.28, nlz = 1.4, nly = surfY(nlx, nlz);
  signPlane(1.06, 0.26, nameT, { lit: false, mul: 1.0, x: nlx, y: nly + 4.5, z: nlz + 0.22, ry: 0 });
  boxAt(nlx - 0.53, nly + 4.37, nlz + 0.19, nlx + 0.53, nly + 4.63, nlz + 0.23, toon(0x8d94a1));
  signPlane(1.06, 0.26, nameT2, { lit: false, mul: 1.0, x: nlx - 0.22, y: nly + 4.16, z: nlz, ry: Math.PI / 2 });
  boxAt(nlx - 0.25, nly + 4.03, nlz - 0.53, nlx - 0.21, nly + 4.29, nlz + 0.53, toon(0x8d94a1));
  // 凸面镜
  const mirror = group({ x: -6.38, z: 2.1 });
  const my0 = surfY(-6.38, 2.1);
  cyl(0.04, 0.05, 2.7, 10, toon(0xa9b0bc), { parent: mirror, y: my0 + 1.35, outline: true });
  cyl(0.14, 0.16, 0.16, 10, toon(0x8d94a1), { parent: mirror, y: my0 + 0.08 });
  const mirT = makeTex(256, 256, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#cfe4f7'); gr.addColorStop(0.42, '#8fb3d8');
    gr.addColorStop(0.55, '#5d7fa8'); gr.addColorStop(1, '#3d5a7d');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath(); g.ellipse(W * 0.34, H * 0.30, W * 0.26, H * 0.14, -0.5, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,214,150,0.5)';
    g.beginPath(); g.ellipse(W * 0.66, H * 0.72, W * 0.16, H * 0.07, -0.5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 6;
    g.beginPath(); g.arc(W / 2, H / 2, W * 0.46, 0, TAU); g.stroke();
  });
  const mr = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), emitT(mirT, 0.95));
  mr.position.set(0, my0 + 2.72, 0.05);
  mr.rotation.y = -Math.PI / 2 + 0.5;
  mirror.add(mr);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 24), toon(0xf4802c));
  rim.position.copy(mr.position); rim.rotation.copy(mr.rotation);
  mirror.add(rim);
  const mb = box(0.42, 0.42, 0.06, toon(0xf4802c), { parent: mirror, y: my0 + 2.72, z: -0.04 });
  mb.rotation.y = -Math.PI / 2 + 0.5;
}

/* ------------------------------------------------------------ 公告栏 */
function buildNoticeBoard() {
  const x = -6.3, z = -1.4, ry = -Math.PI / 2;
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  boxAt(-0.06, y0 + 0.5, -0.9, 0.06, y0 + 2.0, -0.82, toon(0x8d94a1), { parent: g, outline: true });
  boxAt(-0.06, y0 + 0.5, 0.82, 0.06, y0 + 2.0, 0.9, toon(0x8d94a1), { parent: g, outline: true });
  boxAt(-0.14, y0 + 0.42, -0.96, 0.10, y0 + 2.06, 0.96, toon(0x5b6272), { parent: g, outline: true });
  boxAt(0.10, y0 + 0.5, -0.9, 0.14, y0 + 1.96, 0.9, toon(0x3f4657), { parent: g });
  // 小屋顶
  boxAt(-0.24, y0 + 2.06, -1.02, 0.24, y0 + 2.16, 1.02, toon(0x2f3646), { parent: g, outline: true });
  // 玻璃罩与海报
  const pts = [
    [-0.3, 0.78, posterTex(200, '秋祭り', '10月20日')],
    [0.28, 0.62, posterTex(20, '防犯', 'パトロール')],
    [-0.26, 0.24, posterTex(150, '資源回収', '第2日曜')],
    [0.32, 0.20, posterTex(320, '子育て', 'サークル募集')]
  ];
  pts.forEach((p) => {
    signPlane(0.44, 0.56, p[2], { lit: false, x: 0.15, y: y0 + 1.5 + p[1] - 0.55, z: p[0], ry: Math.PI / 2, parent: g });
  });
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.5), glassMat(0xd8ecff, 0.09));
  gl.position.set(0.17, y0 + 1.4, 0);
  gl.rotation.y = Math.PI / 2;
  g.add(gl);
  // 板下小灯
  boxAt(-0.05, y0 + 1.95, -0.5, 0.16, y0 + 2.02, 0.5, emit(0xfff0d0, 1.2), { parent: g });
}

/* ------------------------------------------------------------ のぼり旗 / 盆栽 */
function nobori(x, z, ry, tex) {
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  cyl(0.022, 0.025, 2.4, 8, toon(0xb9c0cb), { parent: g, y: y0 + 1.2, outline: true });
  cyl(0.05, 0.09, 0.1, 10, toon(0x767c8a), { parent: g, y: y0 + 0.05 });
  const flag = signPlane(0.5, 1.6, tex, { mul: 1.1, x: 0.27, y: y0 + 1.55, z: 0, parent: g });
  flag.material.side = THREE.DoubleSide;
  swayList.push({ o: flag, base: flag.rotation.y, amp: 0.06, sp: 1.2 + rr(0, 0.4) });
  return g;
}
function buildNobori() {
  const t1 = makeTex(192, 640, (g, W, H) => {
    g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d94436'; g.fillRect(0, 0, W, H * 0.16);
    g.fillStyle = '#2f6fbf'; g.fillRect(0, H * 0.9, W, H * 0.1);
    txt(g, '淹', W / 2, H * 0.26, { size: 76, color: '#2b3550' });
    txt(g, 'れ', W / 2, H * 0.38, { size: 76, color: '#2b3550' });
    txt(g, 'た', W / 2, H * 0.5, { size: 76, color: '#2b3550' });
    txt(g, 'て', W / 2, H * 0.62, { size: 76, color: '#2b3550' });
    txt(g, 'コーヒー', W / 2, H * 0.78, { size: 34, color: '#d94436' });
  });
  const t2 = makeTex(192, 640, (g, W, H) => {
    g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2f9e63'; g.fillRect(0, 0, W, H * 0.16);
    txt(g, 'お', W / 2, H * 0.30, { size: 76, color: '#2b3550' });
    txt(g, 'に', W / 2, H * 0.44, { size: 76, color: '#2b3550' });
    txt(g, 'ぎ', W / 2, H * 0.58, { size: 76, color: '#2b3550' });
    txt(g, 'り', W / 2, H * 0.72, { size: 76, color: '#2b3550' });
    txt(g, '100円', W / 2, H * 0.86, { size: 40, color: '#d94436' });
  });
  nobori(-4.35, 5.7, 0.5, t1);
  nobori(2.15, 5.75, -0.35, t2);
}
function potPlant(x, z, s) {
  s = s || 1;
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z });
  cyl(0.16 * s, 0.12 * s, 0.24 * s, 12, toon(0xb06a4a), { parent: g, y: y0 + 0.12 * s, outline: true });
  cyl(0.17 * s, 0.17 * s, 0.03 * s, 12, toon(0x8f4f36), { parent: g, y: y0 + 0.25 * s });
  for (let i = 0; i < 7; i++) {
    const a = rr(0, TAU), r = rr(0, 0.16 * s);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.3 * s, 5), toon(0x3f7a4a));
    leaf.position.set(Math.cos(a) * r, y0 + 0.4 * s, Math.sin(a) * r);
    leaf.rotation.set(rr(-0.4, 0.4), a, rr(-0.4, 0.4));
    g.add(leaf);
  }
}

/* ------------------------------------------------------------ 交通信号 */
const signals = [];
function trafficSignal(x, z, ry, dyn) {
  const y0 = surfY(x, z);
  const g = group({ x: x, z: z, ry: ry });
  cyl(0.06, 0.08, 4.6, 10, toon(0x8d94a1), { parent: g, y: y0 + 2.3, outline: true });
  cyl(0.14, 0.16, 0.2, 10, toon(0x767c8a), { parent: g, y: y0 + 0.1 });
  // 车行灯（横排三灯）
  const head = group({ parent: g, x: -0.55, y: y0 + 4.1 });
  boxAt(-0.6, -0.18, -0.09, 0.6, 0.18, 0.11, toon(0x3f4657), { outline: true });
  boxAt(-0.66, -0.14, -0.12, 0.66, 0.24, 0.13, toon(0x2f3646));
  const lamps = [];
  [[-0.42, 0x2f9e63], [0, 0xf0c419], [0.42, 0xd94436]].forEach((l) => {
    const m = emit(0x333a4c, 0.6);
    cyl(0.13, 0.13, 0.1, 14, m, { parent: head, x: l[0], y: 0.02, z: 0.14, rx: Math.PI / 2 });
    lamps.push({ mat: m, color: l[1] });
  });
  // 行人灯
  const ped = group({ parent: g, x: 0.42, y: y0 + 2.5 });
  boxAt(-0.16, -0.26, -0.1, 0.16, 0.26, 0.1, toon(0x3f4657), { outline: true });
  const pedLamps = [];
  [[0.12, 0xd94436], [-0.12, 0x2f9e63]].forEach((l) => {
    const m = emit(0x333a4c, 0.6);
    box(0.24, 0.2, 0.04, m, { parent: ped, x: 0, y: l[0], z: 0.12 });
    pedLamps.push({ mat: m, color: l[1] });
  });
  const glow = new THREE.Sprite(addMat(glowTex(), 0xffffff, 0.0));
  glow.scale.set(1.5, 1.5, 1);
  glow.position.set(x - 0.55 * Math.cos(ry), y0 + 4.12, z + 0.55 * Math.sin(ry));
  scene.add(glow);
  signals.push({ lamps: lamps, ped: pedLamps, glow: glow, x: x - 0.55 * Math.cos(ry), z: z + 0.55 * Math.sin(ry), y0: y0 });
  const sx = x - 0.55 * Math.cos(ry), sz = z + 0.55 * Math.sin(ry);
  emitters.push({
    x: sx, z: Math.max(sz, LAY.RA_Z0 + 0.4), y: LAY.ROAD_Y + 0.01,
    color: 0x8ef0b6, len: 10.0, wid: 1.35, op: 0.4, dynamic: dyn
  });
  return g;
}
function buildTrafficSignals() {
  trafficSignal(-6.05, 5.5, Math.PI / 2 + 0.15, 'signal');
  trafficSignal(-11.9, -11.2, -Math.PI / 2 + 0.2, null);
}

/* ------------------------------------------------------------ 统一构建 */
function buildProps() {
  // 自动贩卖机（邻栋前）
  vendingMachine(6.75, 5.55, 0.02, '#d94b3f', 0xc0392b, false);
  vendingMachine(7.95, 5.55, -0.02, '#2f6fbf', 0x2b5fa8, true);
  // 自行车
  buildBike(-5.5, -3.15, Math.PI / 2 + 0.06, 0x4a7fc1, 0.02);
  buildBike(-5.5, -2.35, Math.PI / 2 - 0.04, 0x2f3646, -0.02);
  buildBike(-5.45, -1.55, Math.PI / 2 + 0.1, 0xc0392b, 0.03);
  buildBike(6.05, 4.55, -0.5, 0x2f9e63, 0.05);
  buildUmbrellaStand();
  buildTrashBins();
  streetLamp(-6.28, 1.4, 0, 5.4);
  streetLamp(-6.28, -6.4, 0, 5.4);
  buildUtilityPoles();
  buildRoadSigns();
  buildNoticeBoard();
  buildNobori();
  buildTrafficSignals();
  potPlant(9.1, 5.85, 1.1);
  potPlant(10.2, 5.9, 0.9);
  potPlant(-6.0, -4.6, 0.95);
}
