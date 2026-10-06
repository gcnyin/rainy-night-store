/* ============================================================================
   10 — 世界：底座 / 天空 / 道路 / 人行道 / 路沿 / 排水 / 标线 / 积水 / 护栏
   ========================================================================== */

const LAY = {
  B: 13,                       // 底座半宽
  RA_Z0: 6.2, RA_Z1: 13,       // 前街（沿 x 走向）
  RB_X0: -13, RB_X1: -6.6,     // 左侧街（沿 z 走向）
  ROAD_Y: 0.045,               // 路面高度
  WALK_Y: 0.22,                // 人行道高度
  STORE: { x0: -4.5, x1: 4.5, z0: -4.8, z1: 4.2, h: 3.4 },
  ALLEY: { x0: 4.5, x1: 6.0, z0: -4.8, z1: 6.2 },
  NB: { x0: 6.0, x1: 12.6, z0: -6.6, z1: 6.2, h: 6.8 },   // 右侧邻栋
};

function onRoad(x, z) { return (z > LAY.RA_Z0) || (x < LAY.RB_X1); }
function surfY(x, z) { return onRoad(x, z) ? LAY.ROAD_Y : LAY.WALK_Y; }

/* ------------------------------------------------------------ 天空 */
function buildSky() {
  const geo = new THREE.SphereGeometry(200, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x03050c) },
      mid: { value: new THREE.Color(0x0d1631) },
      bot: { value: new THREE.Color(0x222d52) },
      glow: { value: new THREE.Color(0x6a5078) },
      glowDir: { value: new THREE.Vector3(-0.35, 0.0, 0.93).normalize() }
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
    fragmentShader: [
      'varying vec3 vP; uniform vec3 top, mid, bot, glow; uniform vec3 glowDir;',
      'void main(){',
      '  float h = clamp(vP.y*0.5+0.5, 0.0, 1.0);',
      '  vec3 c = mix(bot, mid, smoothstep(0.40, 0.62, h));',
      '  c = mix(c, top, smoothstep(0.56, 0.96, h));',
      '  vec3 fl = normalize(vec3(vP.x, 0.0, vP.z));',
      '  float d = max(dot(fl, glowDir), 0.0);',
      '  c += glow * pow(d, 6.0) * (1.0 - smoothstep(0.34, 0.70, h)) * 0.45;',
      '  c += glow * pow(d, 16.0) * 0.30 * (1.0 - smoothstep(0.30, 0.52, h));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'
    ].join('\n')
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);
  return sky;
}

/* ------------------------------------------------------------ 底座 */
function buildBase() {
  const slab = boxAt(-LAY.B, -1.6, -LAY.B, LAY.B, -0.02, LAY.B, toon(0x2c3247), { outline: true });
  slab.name = 'base';
  boxAt(-LAY.B + 1.5, -2.45, -LAY.B + 1.5, LAY.B - 1.5, -1.6, LAY.B - 1.5, toon(0x1a1f30), { outline: true });
  boxAt(-LAY.B + 0.02, -0.10, -LAY.B + 0.02, LAY.B - 0.02, -0.02, LAY.B - 0.02, toon(0x59617a));
  // 底座铭牌
  const plate = signPlane(3.2, 0.9, makeTex(256, 72, (g, w, h) => {
    g.fillStyle = '#20263a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6d7896'; g.lineWidth = 3; roundRect(g, 4, 4, w - 8, h - 8, 8); g.stroke();
    txt(g, '雨夜 · ひかりマート', w / 2, h * 0.40, { size: 26, color: '#c9d4ee' });
    txt(g, 'MINIATURE  DIORAMA', w / 2, h * 0.72, { size: 15, color: '#7f8dae', spacing: 3 });
  }), { mul: 0.9 });
  plate.position.set(0, -0.78, LAY.B + 0.015);
  plate.rotation.y = Math.PI;
  // 桌面接触阴影
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(76, 76),
    new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x04060d, transparent: true, opacity: 0.78, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = -2.5;
  scene.add(sh);
}

/* 由多边形（世界 x,z）生成水平板 */
function plateFromPoly(pts, y0, y1, mat, outline) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y0;
  if (outline) O(m);
  scene.add(m);
  return m;
}

/* ------------------------------------------------------------ 道路 / 人行道 */
function buildGround() {
  const aspT = texRepeat(asphaltTex(), 0.5, 0.5);
  const aspMat = toonT(0xffffff, aspT);
  const conT = texRepeat(concreteTex(), 0.5, 0.5);
  const conMat = toonT(0xffffff, conT);

  plateFromPoly([[-LAY.B, LAY.RA_Z0], [LAY.B, LAY.RA_Z0], [LAY.B, LAY.B], [-LAY.B, LAY.B]], 0, LAY.ROAD_Y, aspMat);
  plateFromPoly([[LAY.RB_X0, -LAY.B], [LAY.RB_X1, -LAY.B], [LAY.RB_X1, LAY.RA_Z0], [LAY.RB_X0, LAY.RA_Z0]], 0, LAY.ROAD_Y, aspMat);

  const walk = plateFromPoly([
    [LAY.RB_X1, -LAY.B], [LAY.B, -LAY.B], [LAY.B, LAY.RA_Z0],
    [LAY.RB_X1 + 1.35, LAY.RA_Z0], [LAY.RB_X1, LAY.RA_Z0 - 1.35]
  ], 0, LAY.WALK_Y, conMat);

  // ---- 路沿石 ----
  const curbMat = toon(0xa9b0bd);
  const curbTop = toon(0x949bab);
  boxAt(LAY.RB_X1 + 1.28, LAY.ROAD_Y, LAY.RA_Z0 - 0.28, LAY.B, LAY.WALK_Y + 0.012, LAY.RA_Z0, curbMat, { outline: true });
  boxAt(LAY.RB_X1, LAY.ROAD_Y, -LAY.B, LAY.RB_X1 + 0.28, LAY.WALK_Y + 0.012, LAY.RA_Z0 - 1.28, curbMat, { outline: true });
  const chamfer = boxAt(-1.0, LAY.ROAD_Y, -0.14, 1.0, LAY.WALK_Y + 0.012, 0.14, curbMat, { outline: true });
  chamfer.position.set(LAY.RB_X1 + 0.68, 0, LAY.RA_Z0 - 0.68);
  chamfer.rotation.y = -Math.PI / 4;
  boxAt(LAY.RB_X1 + 1.28, LAY.WALK_Y + 0.012, LAY.RA_Z0 - 0.28, LAY.B, LAY.WALK_Y + 0.02, LAY.RA_Z0 - 0.16, curbTop);
  boxAt(LAY.RB_X1 + 0.16, LAY.WALK_Y + 0.012, -LAY.B, LAY.RB_X1 + 0.28, LAY.WALK_Y + 0.02, LAY.RA_Z0 - 1.28, curbTop);

  // ---- 排水沟 ----
  const gutMat = toon(0x7d8390);
  const grateMat = toonT(0xffffff, gridGrateTex(), { color: 0x9aa1ae });
  boxAt(LAY.RB_X1 + 1.28, LAY.ROAD_Y - 0.06, LAY.RA_Z0 - 0.82, LAY.B, LAY.ROAD_Y + 0.004, LAY.RA_Z0 - 0.28, gutMat);
  boxAt(LAY.RB_X1, LAY.ROAD_Y - 0.06, -LAY.B, LAY.RB_X1 + 0.82, LAY.ROAD_Y + 0.004, LAY.RA_Z0 - 1.28, gutMat);
  for (let x = -3.4; x < LAY.B - 0.7; x += 2.6) {
    boxAt(x, LAY.ROAD_Y - 0.008, LAY.RA_Z0 - 0.78, x + 0.64, LAY.ROAD_Y + 0.012, LAY.RA_Z0 - 0.32, grateMat);
  }
  for (let z = -11.8; z < 3.2; z += 2.6) {
    boxAt(LAY.RB_X1 + 0.16, LAY.ROAD_Y - 0.008, z, LAY.RB_X1 + 0.62, LAY.ROAD_Y + 0.012, z + 0.64, grateMat);
  }
  boxAt(-0.5, LAY.ROAD_Y - 0.03, LAY.RA_Z0 - 0.80, 0.6, LAY.ROAD_Y + 0.018, LAY.RA_Z0 - 0.30, toon(0x5f6674));
  boxAt(LAY.RB_X1 + 0.14, LAY.ROAD_Y - 0.03, 3.9, LAY.RB_X1 + 0.64, LAY.ROAD_Y + 0.018, 5.0, toon(0x5f6674));

  // ---- 井盖 ----
  const mhMat = toonT(0xffffff, manholeTex(), { color: 0xaeb4c1 });
  const mh = new THREE.Mesh(new THREE.CircleGeometry(0.62, 26), mhMat);
  mh.rotation.x = -Math.PI / 2;
  mh.position.set(1.9, LAY.ROAD_Y + 0.006, 9.6);
  scene.add(mh); O(mh);
  const mh2 = new THREE.Mesh(new THREE.CircleGeometry(0.62, 26), mhMat);
  mh2.rotation.x = -Math.PI / 2;
  mh2.position.set(-10.6, LAY.ROAD_Y + 0.006, -3.6);
  scene.add(mh2); O(mh2);
  boxAt(-6.0, LAY.WALK_Y, 1.1, -5.35, LAY.WALK_Y + 0.014, 1.75, toon(0x9198a5));

  // ---- 标线 ----
  const white = toon(0xa4aebd);
  const dim = toon(0x848e9f);
  const mark = (x0, z0, x1, z1, mat, y) => {
    const base = (y == null ? LAY.ROAD_Y : y);
    return boxAt(x0, base + 0.002, z0, x1, base + 0.010, z1, mat);
  };
  for (let x = -12.4; x < LAY.B - 1.4; x += 3.2) mark(x, 9.52, x + 1.8, 9.68, dim);
  for (let z = -12.6; z < 5.0; z += 3.2) mark(-9.88, z, -9.72, z + 1.8, dim);
  mark(LAY.RB_X1 + 1.28, LAY.RA_Z0 + 0.36, LAY.B, LAY.RA_Z0 + 0.50, dim);
  mark(LAY.RB_X1 + 0.36, -LAY.B, LAY.RB_X1 + 0.50, LAY.RA_Z0 - 1.28, dim);
  // 斑马线（左街）
  for (let i = 0; i < 4; i++) mark(LAY.RB_X1 + 0.55, 2.46 + i * 0.94, LAY.RB_X1 + 6.55, 2.46 + i * 0.94 + 0.52, white);
  // 斑马线（前街，正对便利店）
  for (let i = 0; i < 5; i++) mark(-6.3 + i * 0.96, LAY.RA_Z0 + 0.55, -6.3 + i * 0.96 + 0.54, LAY.RA_Z0 + 6.45, white);
  mark(-9.86, 5.24, -7.1, 5.72, white);
  mark(-7.64, LAY.RA_Z0 + 0.55, -7.10, LAY.RA_Z0 + 6.45, white);
  // 停止线前的"止まれ"提示
  boxAt(-8.95, LAY.ROAD_Y + 0.011, 3.46, -8.15, LAY.ROAD_Y + 0.016, 4.52, toon(0xb4bdcc));

  // ---- 停车位（邻栋前） ----
  const bay = { x0: 9.7, x1: 12.5, z0: 0.9, z1: 5.9 };
  mark(bay.x0, bay.z0, bay.x1, bay.z0 + 0.15, white, LAY.WALK_Y);
  mark(bay.x0, bay.z1 - 0.15, bay.x1, bay.z1, white, LAY.WALK_Y);
  mark(bay.x0, bay.z0, bay.x0 + 0.15, bay.z1, white, LAY.WALK_Y);
  mark(bay.x1 - 0.15, bay.z0, bay.x1, bay.z1, white, LAY.WALK_Y);
  const cz = (bay.z0 + bay.z1) / 2;
  boxAt(bay.x0 + 0.15, LAY.WALK_Y + 0.002, cz - 0.06, bay.x0 + 0.85, LAY.WALK_Y + 0.010, cz + 0.06, white);
  boxAt(bay.x0 + 0.6, LAY.WALK_Y, cz - 0.1, bay.x0 + 0.85, LAY.WALK_Y + 0.010, cz + 0.5, white);
  boxAt(bay.x0 + 0.6, LAY.WALK_Y, cz - 0.5, bay.x0 + 0.85, LAY.WALK_Y + 0.010, cz + 0.1, white);
  boxAt(bay.x0 + 0.4, LAY.WALK_Y, bay.z0 + 1.0, bay.x1 - 0.4, LAY.WALK_Y + 0.13, bay.z0 + 1.25, toon(0xccd1db));
  boxAt(bay.x0 + 0.4, LAY.WALK_Y, bay.z1 - 1.25, bay.x1 - 0.4, LAY.WALK_Y + 0.13, bay.z1 - 1.0, toon(0xccd1db));

  // ---- 自行车停放位白线（便利店左侧） ----
  for (let i = 0; i < 6; i++) mark(-6.32, -3.5 + i * 0.74, -4.7, -3.5 + i * 0.74 + 0.11, white, LAY.WALK_Y);
  mark(-6.32, -3.6, -6.21, 0.1, white, LAY.WALK_Y);
  // 盲道提示砖
  const dotMat = toon(0xd9c98d);
  for (let i = 0; i < 5; i++) {
    boxAt(LAY.RB_X1 + 1.05, LAY.WALK_Y, -2.7 + i * 0.52, LAY.RB_X1 + 1.5, LAY.WALK_Y + 0.012, -2.7 + i * 0.52 + 0.38, dotMat);
  }
  return walk;
}

/* ------------------------------------------------------------ 积水 */
const puddles = [];
function buildPuddles() {
  const wet = new THREE.MeshBasicMaterial({
    color: 0x18213c, transparent: true, opacity: 0.34,
    depthWrite: false, side: THREE.DoubleSide
  });
  const spots = [
    [-1.0, 8.4, 3.4, 1.9], [3.6, 10.8, 2.6, 1.5], [-8.2, 3.0, 2.4, 1.6],
    [-10.2, -4.4, 3.0, 1.7], [-9.0, 8.6, 2.2, 1.3], [5.6, 8.2, 1.9, 1.1],
    [-5.7, 4.7, 1.3, 0.8], [1.2, 5.6, 1.6, 0.9], [-5.4, -1.6, 1.8, 0.9],
    [7.4, 3.0, 1.5, 0.8], [10.6, 9.0, 2.8, 1.4], [0.6, 11.4, 2.2, 1.2]
  ];
  spots.forEach((s) => {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 30), wet);
    p.rotation.x = -Math.PI / 2;
    p.scale.set(s[2], s[3], 1);
    p.position.set(s[0], surfY(s[0], s[1]) + 0.009, s[1]);
    p.renderOrder = 2;
    scene.add(p);
    puddles.push(p);
    wetSpots.push({ x: s[0], z: s[1], r: Math.min(s[2], s[3]) * 0.8, y: p.position.y, weight: 4 });
  });
  for (let i = 0; i < 26; i++) {
    const x = rr(-12.6, 12.6), z = rr(-12.6, 12.6);
    const b = new THREE.Mesh(new THREE.CircleGeometry(1, 18),
      new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x080d1e, transparent: true, opacity: rr(0.10, 0.24), depthWrite: false }));
    b.rotation.x = -Math.PI / 2;
    b.scale.set(rr(1.2, 3.4), rr(0.9, 2.2), 1);
    b.position.set(x, surfY(x, z) + 0.005, z);
    b.renderOrder = 1;
    scene.add(b);
  }
  for (let i = 0; i < 70; i++) {
    const x = rr(-12.4, 12.4), z = rr(-12.4, 12.4);
    wetSpots.push({ x: x, z: z, r: 0.3, y: surfY(x, z) + 0.007, weight: 1 });
  }
}

/* ------------------------------------------------------------ 护栏 */
function buildGuardrails() {
  const white = toon(0xc2c9d6);
  const post = toon(0xa6adbb);
  const refl = emit(0xffcf94, 1.5);
  function rail(x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const g = group({ x: cx, z: cz, ry: Math.atan2(dx, dz) });
    const base = surfY(cx, cz);
    box(0.08, 0.30, len, white, { parent: g, y: base + 0.60, outline: true });
    box(0.055, 0.075, len, post, { parent: g, y: base + 0.79 });
    box(0.065, 0.10, len, post, { parent: g, y: base + 0.42 });
    const n = Math.max(2, Math.round(len / 2.0));
    for (let i = 0; i <= n; i++) {
      const t = (i / n - 0.5) * len;
      cyl(0.055, 0.055, 0.94, 8, post, { parent: g, y: base + 0.47, z: t });
      cyl(0.05, 0.05, 0.025, 10, refl, { parent: g, y: base + 0.60, z: t, rz: Math.PI / 2 });
    }
  }
  rail(-12.5, 12.55, -0.4, 12.55);
  rail(2.6, 12.55, 12.5, 12.55);
  rail(-12.55, 10.2, -12.55, -1.2);
  rail(-12.55, -3.8, -12.55, -12.5);
}
