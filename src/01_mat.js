/* ============================================================================
   01 — 材质 / 几何 / 描边 / 注册表
   ========================================================================== */

let scene = null;                  // 由 60_main 建立
const updaters = [];               // 每帧回调 fn(dt, t)
const wetSpots = [];               // 可产生涟漪的地面点
const flickerList = [];            // 灯光闪烁注册表 {mats:[], sprites:[], streaks:[]}
const emitters = [];               // 发光体（用于地面反射光带）

/* ------------------------------------------------------------ 卡通材质 */
const gradRamp = (() => {
  const steps = [0.30, 0.56, 0.80, 1.0];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    const c = Math.round(v * 255);
    data[i * 4] = c; data[i * 4 + 1] = c; data[i * 4 + 2] = c; data[i * 4 + 3] = 255;
  });
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

const _toonCache = new Map();
function toon(color, o) {
  o = o || {};
  if (o.map || o.emissive || Object.keys(o).length > 2) {
    return new THREE.MeshToonMaterial(Object.assign({ color: color, gradientMap: gradRamp }, o));
  }
  const key = color + '';
  let m = _toonCache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color: color, gradientMap: gradRamp });
    _toonCache.set(key, m);
  }
  return m;
}
function toonT(color, map, o) {
  return new THREE.MeshToonMaterial(Object.assign({ color: color, map: map, gradientMap: gradRamp }, o || {}));
}
/* 自发光（灯箱 / 灯管 / 屏幕）：颜色可超过 1，配合 ACES 得到柔和光晕 */
function emit(color, mul, o) {
  const c = new THREE.Color(color).multiplyScalar(mul == null ? 1.7 : mul);
  return new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
}
function emitT(map, mul, o) {
  return new THREE.MeshBasicMaterial(Object.assign({ map: map, color: new THREE.Color(mul == null ? 1.25 : mul, mul == null ? 1.25 : mul, mul == null ? 1.25 : mul) }, o || {}));
}
/* 玻璃：低不透明度 + 高光，双面 */
function glassMat(color, opacity, o) {
  return new THREE.MeshPhongMaterial(Object.assign({
    color: color == null ? 0xcfe6ff : color,
    transparent: true, opacity: opacity == null ? 0.13 : opacity,
    shininess: 34, specular: 0x8fa6c4, side: THREE.DoubleSide,
    depthWrite: false, reflectivity: 0.4
  }, o || {}));
}
/* 加色叠加片（光晕、反射、水面亮斑） */
function addMat(map, color, opacity, o) {
  return new THREE.MeshBasicMaterial(Object.assign({
    map: map || null, color: color == null ? 0xffffff : color,
    transparent: true, opacity: opacity == null ? 0.6 : opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: true
  }, o || {}));
}

/* ------------------------------------------------------------ 描边 */
const outlineU = {
  uW: { value: 0.0022 },
  uColor: { value: new THREE.Color(0x121a2e) },
  fogColor: { value: new THREE.Color(PAL.fog) },
  fogNear: { value: 1 },
  fogFar: { value: 1000 },
  fogOn: { value: 0 }
};
const outlineVert = [
  'uniform float uW;',
  'varying float vFog;',
  'void main(){',
  '  vec4 mv = modelViewMatrix * vec4(position,1.0);',
  '  vec3 n = normalize(normalMatrix * normal);',
  '  mv.xyz += n * uW * (-mv.z);',
  '  vFog = -mv.z;',
  '  gl_Position = projectionMatrix * mv;',
  '}'
].join('\n');
const outlineFrag = [
  'uniform vec3 uColor;',
  'uniform vec3 fogColor;',
  'uniform float fogNear, fogFar;',
  'uniform float fogOn;',
  'varying float vFog;',
  'void main(){',
  '  vec3 c = uColor;',
  '  if(fogOn > 0.5){',
  '    float f = smoothstep(fogNear, fogFar, vFog);',
  '    c = mix(c, fogColor, f);',
  '  }',
  '  gl_FragColor = vec4(c, 1.0);',
  '}'
].join('\n');
let _outlineMat = null;
function outlineMat() {
  if (!_outlineMat) {
    _outlineMat = new THREE.ShaderMaterial({
      uniforms: outlineU, vertexShader: outlineVert, fragmentShader: outlineFrag,
      side: THREE.BackSide, depthWrite: true, fog: false
    });
  }
  return _outlineMat;
}
/* 给网格加反向壳描边 */
function O(mesh, w) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat());
  o.renderOrder = -1;
  o.frustumCulled = mesh.frustumCulled;
  mesh.add(o);
  return mesh;
}

/* ------------------------------------------------------------ 几何构造 */
function meshOf(geo, mat, o) {
  o = o || {};
  const m = new THREE.Mesh(geo, mat);
  if (o.x || o.y || o.z) m.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = !!o.shadow; m.receiveShadow = false;
  if (o.outline) O(m);
  if (o.parent) o.parent.add(m);
  else if (scene) scene.add(m);
  return m;
}
function box(w, h, d, mat, o) {
  return meshOf(new THREE.BoxGeometry(w, h, d), mat, o);
}
/* 以 (x,y,z) 为最小角放置的盒子，便于“搭积木”式建模 */
function boxAt(x0, y0, z0, x1, y1, z1, mat, o) {
  o = o || {};
  return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), mat, Object.assign({
    x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2
  }, o));
}
function cyl(rt, rb, h, seg, mat, o) {
  return meshOf(new THREE.CylinderGeometry(rt, rb, h, seg || 12, 1, !!(o && o.open)), mat, o);
}
function plane(w, h, mat, o) {
  return meshOf(new THREE.PlaneGeometry(w, h), mat, o);
}
function sphere(r, mat, o) {
  return meshOf(new THREE.SphereGeometry(r, (o && o.seg) || 12, (o && o.seg2) || 8), mat, o);
}
/* 两点之间连一根圆柱（车架 / 电线杆横担 / 支架） */
function cylBetween(a, b, r, mat, parent, seg) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 8), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  if (parent) parent.add(m); else if (scene) scene.add(m);
  return m;
}
/* 平面四边形（宣传单 / 地面贴纸 / 光片） */
function quad(w, h, mat, o) {
  return plane(w, h, mat, o);
}
function group(o) {
  const g = new THREE.Group();
  o = o || {};
  if (o.x || o.y || o.z) g.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.ry) g.rotation.y = o.ry;
  if (o.rx) g.rotation.x = o.rx;
  if (o.rz) g.rotation.z = o.rz;
  if (o.parent) o.parent.add(g); else if (scene) scene.add(g);
  return g;
}
/* 贴地光斑 / 阴影贴片 */
function groundBlob(size, color, opacity, x, y, z, tex) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), addMat(tex || glowTex(), color, opacity));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 3;
  if (scene) scene.add(m);
  return m;
}
/* 文字招牌面片（自发光灯箱，可指定朝向） */
function signPlane(w, h, tex, o) {
  o = o || {};
  const mat = o.lit === false ? toonT(0xffffff, tex) : emitT(tex, o.mul == null ? 1.15 : o.mul);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  if (o.parent) o.parent.add(m); else if (scene) scene.add(m);
  if (o.outline) {
    const b = box(w, h, 0.05, toon(PAL.trim), { parent: o.parent, outline: true });
    b.position.copy(m.position);
    b.rotation.copy(m.rotation);
    b.translateZ(-0.05);
    m.userData.backplate = b;
  }
  return m;
}
