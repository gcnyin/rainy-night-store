/* ============================================================================
   60 — 主程序：渲染器 / 灯光 / 相机 / 自由轨道控制 / 构建与主循环
   ========================================================================== */

let renderer, camera, canvas;
const ctrl = {
  theta: -0.66, phi: 1.32, dist: 52,
  tTheta: -0.66, tPhi: 1.32, tDist: 52,
  minD: 14, maxD: 120,
  target: new THREE.Vector3(0.7, 1.0, -0.7),
  tTarget: new THREE.Vector3(0.7, 1.0, -0.7),
  idle: 0, autoOn: true
};

function initRenderer() {
  canvas = document.getElementById('stage');
  renderer = new THREE.WebGLRenderer({
    canvas: canvas, antialias: true, alpha: false,
    powerPreference: 'high-performance', stencil: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = false;
}

/* 依据窗口比例自动取景 */
function fitDistance() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const vFov = 30 * DEG;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const r = 16.4;
  const d = r / Math.sin(Math.min(vFov, hFov) / 2) * 0.73;
  return clamp(d, 26, 96);
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d1c);
  scene.fog = new THREE.Fog(0x0a1024, 58, 230);
  outlineU.fogColor.value = new THREE.Color(0x0a1024);
  outlineU.fogNear.value = 58;
  outlineU.fogFar.value = 230;
  outlineU.fogOn.value = 1;

  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 420);
  ctrl.tDist = ctrl.dist = fitDistance();
  ctrl.minD = ctrl.dist * 0.32;
  ctrl.maxD = ctrl.dist * 2.6;

  /* ---- 灯光 ---- */
  const hemi = new THREE.HemisphereLight(0x4c66b0, 0x0b0f1c, 0.55);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xa9c0ff, 0.33);
  moon.position.set(-22, 30, 18);
  scene.add(moon);
  const fill = new THREE.DirectionalLight(0x6f86c8, 0.12);
  fill.position.set(18, 14, -20);
  scene.add(fill);
  // 店内暖光
  const in1 = new THREE.PointLight(0xffd79c, 0.78, 15, 2);
  in1.position.set(-2.4, FLOOR_Y + 2.25, 0.6);
  scene.add(in1);
  const in2 = new THREE.PointLight(0xffdca4, 0.74, 14, 2);
  in2.position.set(2.6, FLOOR_Y + 2.25, 1.6);
  scene.add(in2);
  const in3 = new THREE.PointLight(0xffe6c0, 0.6, 11, 2);
  in3.position.set(-0.2, FLOOR_Y + 2.1, -3.4);
  scene.add(in3);
  // 门口暖光（随门开合变化）
  const spill = new THREE.PointLight(0xffd9a0, 0.62, 10, 2);
  spill.position.set(-1.4, FLOOR_Y + 1.9, S.z1 + 0.7);
  scene.add(spill);
  storeFx.spill = spill;
  const in4 = new THREE.PointLight(0xffe8c8, 0.7, 9, 2);
  in4.position.set(-1.4, FLOOR_Y + 2.2, 3.2);
  scene.add(in4);
  const in5 = new THREE.PointLight(0xffe4bc, 0.58, 9, 2);
  in5.position.set(-3.5, FLOOR_Y + 2.15, 2.4);
  scene.add(in5);
  // 招牌下沿的暖色补光（照亮店前人行道）
  const front = new THREE.PointLight(0xffcf94, 0.8, 12, 2);
  front.position.set(0.2, 2.7, S.z1 + 0.9);
  scene.add(front);
}

/* 门口光斑（地面暖色溢出） */
function buildDoorSpill() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 5.0), addMat(glowTex(), 0xffc98a, 0.30));
  m.rotation.x = -Math.PI / 2;
  m.position.set(-1.4, LAY.WALK_Y + 0.013, S.z1 + 0.95);
  m.renderOrder = 4;
  scene.add(m);
  storeFx.doorSpill = m;
}


/* ------------------------------------------------------------ 后期：泛光 */
const QUAD_VS = [
  'varying vec2 vUv;',
  'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
].join('\n');
let post = null;
function initPost() {
  const pr = renderer.getPixelRatio();
  const w = Math.max(8, Math.floor(window.innerWidth * pr));
  const h = Math.max(8, Math.floor(window.innerHeight * pr));
  const hw = Math.max(4, Math.floor(w / 2)), hh = Math.max(4, Math.floor(h / 2));
  const RT = THREE.WebGLMultisampleRenderTarget || THREE.WebGLRenderTarget;
  const base = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
  const rtScene = new RT(w, h, Object.assign({ depthBuffer: true }, base));
  const small = Object.assign({ depthBuffer: false }, base);
  const rtA = new THREE.WebGLRenderTarget(hw, hh, small);
  const rtB = new THREE.WebGLRenderTarget(hw, hh, small);
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  quad.frustumCulled = false;
  quadScene.add(quad);
  const matBright = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uThresh: { value: 0.80 }, uKnee: { value: 0.30 } },
    vertexShader: QUAD_VS,
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float uThresh, uKnee; varying vec2 vUv;',
      'void main(){',
      '  vec3 c = texture2D(tDiffuse, vUv).rgb;',
      '  float l = max(max(c.r, c.g), c.b);',
      '  float k = smoothstep(uThresh, uThresh + uKnee, l);',
      '  gl_FragColor = vec4(c * k, 1.0);',
      '}'
    ].join('\n')
  });
  const matBlur = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: QUAD_VS,
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;',
      'void main(){',
      '  vec3 s = texture2D(tDiffuse, vUv).rgb * 0.227027;',
      '  s += (texture2D(tDiffuse, vUv + uDir * 1.3846).rgb + texture2D(tDiffuse, vUv - uDir * 1.3846).rgb) * 0.3162162;',
      '  s += (texture2D(tDiffuse, vUv + uDir * 3.2308).rgb + texture2D(tDiffuse, vUv - uDir * 3.2308).rgb) * 0.0702702;',
      '  gl_FragColor = vec4(s, 1.0);',
      '}'
    ].join('\n')
  });
  const matComp = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: null }, tBloom: { value: null }, uInt: { value: 0.5 }, uVig: { value: 0.30 } },
    vertexShader: QUAD_VS,
    fragmentShader: [
      'uniform sampler2D tScene, tBloom; uniform float uInt, uVig; varying vec2 vUv;',
      'vec3 toSRGB(vec3 c){',
      '  c = max(c, vec3(0.0));',
      '  return mix(c * 12.92, 1.055 * pow(c, vec3(0.4166667)) - 0.055, step(vec3(0.0031308), c));',
      '}',
      'void main(){',
      '  vec3 base = texture2D(tScene, vUv).rgb;',
      '  vec3 bl = texture2D(tBloom, vUv).rgb;',
      '  vec3 c = base + bl * uInt;',
      '  vec2 q = vUv - 0.5;',
      '  c *= 1.0 - uVig * dot(q, q) * 2.0;',
      '  gl_FragColor = vec4(toSRGB(c), 1.0);',
      '}'
    ].join('\n')
  });
  post = {
    rtScene: rtScene, rtA: rtA, rtB: rtB, quadScene: quadScene, quadCam: quadCam, quad: quad,
    matBright: matBright, matBlur: matBlur, matComp: matComp, hw: hw, hh: hh
  };
}
function renderPost() {
  if (!post) { renderer.render(scene, camera); return; }
  renderer.setRenderTarget(post.rtScene);
  renderer.render(scene, camera);
  post.quad.material = post.matBright;
  post.matBright.uniforms.tDiffuse.value = post.rtScene.texture;
  renderer.setRenderTarget(post.rtA);
  renderer.render(post.quadScene, post.quadCam);
  post.quad.material = post.matBlur;
  post.matBlur.uniforms.tDiffuse.value = post.rtA.texture;
  post.matBlur.uniforms.uDir.value.set(1 / post.hw, 0);
  renderer.setRenderTarget(post.rtB);
  renderer.render(post.quadScene, post.quadCam);
  post.matBlur.uniforms.tDiffuse.value = post.rtB.texture;
  post.matBlur.uniforms.uDir.value.set(0, 1 / post.hh);
  renderer.setRenderTarget(post.rtA);
  renderer.render(post.quadScene, post.quadCam);
  post.quad.material = post.matComp;
  post.matComp.uniforms.tScene.value = post.rtScene.texture;
  post.matComp.uniforms.tBloom.value = post.rtA.texture;
  renderer.setRenderTarget(null);
  renderer.render(post.quadScene, post.quadCam);
}

/* ------------------------------------------------------------ 轨道控制 */
function initControls() {
  const pointers = new Map();
  let pinchDist = 0;

  const el = canvas;
  el.style.touchAction = 'none';

  function onDown(e) {
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey });
    ctrl.idle = 0;
    if (pointers.size === 2) {
      const p = Array.from(pointers.values());
      pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    el.style.cursor = 'grabbing';
  }
  function onMove(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    ctrl.idle = 0;
    if (pointers.size >= 2) {
      const arr = Array.from(pointers.values());
      const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      if (pinchDist > 0) {
        ctrl.tDist = clamp(ctrl.tDist * (pinchDist / Math.max(1, d)), ctrl.minD, ctrl.maxD);
      }
      pinchDist = d;
      pan(dx * 0.5, dy * 0.5);
      return;
    }
    const panMode = p.btn === 2 || p.btn === 1 || e.shiftKey;
    if (panMode) pan(dx, dy);
    else {
      ctrl.tTheta -= dx * 0.0058;
      ctrl.tPhi = clamp(ctrl.tPhi - dy * 0.0050, 0.10, 1.50);
    }
  }
  function onUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) el.style.cursor = 'grab';
  }
  function pan(dx, dy) {
    const aspect = window.innerWidth / window.innerHeight;
    const vFov = camera.fov * DEG;
    const units = 2 * ctrl.tDist * Math.tan(vFov / 2) / window.innerHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    ctrl.tTarget.addScaledVector(right, -dx * units);
    ctrl.tTarget.addScaledVector(up, dy * units);
    ctrl.tTarget.x = clamp(ctrl.tTarget.x, -9, 9);
    ctrl.tTarget.z = clamp(ctrl.tTarget.z, -9, 9);
    ctrl.tTarget.y = clamp(ctrl.tTarget.y, -1.6, 7);
    void aspect;
  }
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const k = Math.exp((e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY) * 0.0011);
    ctrl.tDist = clamp(ctrl.tDist * k, ctrl.minD, ctrl.maxD);
    ctrl.idle = 0;
  }, { passive: false });
  el.style.cursor = 'grab';

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      ctrl.tTheta = -0.66; ctrl.tPhi = 1.32;
      ctrl.tDist = fitDistance();
      ctrl.tTarget.set(0.7, 1.0, -0.7);
    }
  });
}

function updateCamera(dt) {
  ctrl.idle += dt;
  if (ctrl.idle > 15 && ctrl.autoOn) ctrl.tTheta += dt * 0.028;
  const k = Math.min(1, dt * 8.5);
  ctrl.theta += (ctrl.tTheta - ctrl.theta) * k;
  ctrl.phi += (ctrl.tPhi - ctrl.phi) * k;
  ctrl.dist += (ctrl.tDist - ctrl.dist) * k;
  ctrl.target.lerp(ctrl.tTarget, Math.min(1, dt * 8.5));
  const sp = Math.sin(ctrl.phi);
  camera.position.set(
    ctrl.target.x + ctrl.dist * sp * Math.sin(ctrl.theta),
    ctrl.target.y + ctrl.dist * Math.cos(ctrl.phi),
    ctrl.target.z + ctrl.dist * sp * Math.cos(ctrl.theta)
  );
  camera.lookAt(ctrl.target);
  // 远处淡出：避免贴近时穿帮
  ctrl.autoOn = true;
}

/* ------------------------------------------------------------ 构建 */
function buildStoreGlow() {
  // 店内暖光向外的地面反射（人行道 + 马路两级）
  const mk = (x, z, y, w, l, col, op) => {
    emitters.push({ x: x, z: z, y: y, color: col, len: l, wid: w, op: op });
  };
  mk(-1.2, S.z1 + 0.35, LAY.WALK_Y + 0.01, 3.4, 8.5, 0xffcf94, 0.52);
  mk(-1.2, LAY.RA_Z0 + 0.5, LAY.ROAD_Y + 0.01, 4.4, 14.0, 0xffc98a, 0.44);
  mk(-3.6, S.z1 + 0.2, LAY.WALK_Y + 0.01, 1.7, 6.0, 0xffd9a0, 0.40);
}

function buildAll() {
  buildSky();
  buildBase();
  buildGround();
  buildPuddles();
  buildStoreGlow();
  buildGuardrails();
  buildNeighborhood();
  storeFx.ext = buildStoreExterior();
  storeFx.doorGlow = storeFx.ext.doorGlow;
  buildStoreInterior();
  buildRoof();
  buildProps();
  buildDoorSpill();
  buildWeather();
}

/* ------------------------------------------------------------ 主循环 */
let _last = 0, _t = 0, _fpsT = 0, _frames = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const t = now * 0.001;
  let dt = _last ? t - _last : 0.016;
  _last = t;
  if (dt > 0.05) dt = 0.05;
  _t += dt;
  updateCamera(dt);
  updateMotion(dt, _t);
  updateWeather(dt, _t);
  renderPost();
}

function applyQuery() {
  try {
    const q = new URLSearchParams(location.search);
    const v = q.get('view');
    if (v) {
      const a = v.split(',').map(Number);
      if (a.length >= 6 && a.every((n) => isFinite(n))) {
        ctrl.tTheta = ctrl.theta = a[0];
        ctrl.tPhi = ctrl.phi = a[1];
        ctrl.tDist = ctrl.dist = a[2];
        ctrl.tTarget.set(a[3], a[4], a[5]);
        ctrl.target.copy(ctrl.tTarget);
        ctrl.autoOn = false;
        ctrl.idle = -1e6;
      }
    }
    if (q.get('nofx')) ctrl.autoOn = false;
  } catch (e) { }
}

function boot() {
  initRenderer();
  initScene();
  buildAll();
  initControls();
  applyQuery();
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (post) {
      post.rtScene.dispose(); post.rtA.dispose(); post.rtB.dispose();
      post = null;
      initPost();
    }
  });
  // 先渲染一帧
  updateCamera(0.016);
  initPost();
  renderPost();
  requestAnimationFrame(loop);
}
