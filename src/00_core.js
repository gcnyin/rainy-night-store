/* ============================================================================
   雨夜便利店 · 街角微缩模型
   00 — 核心：常量 / 随机 / 调色板 / 贴图生成 / 材质 / 几何 / 描边 / 注册表
   ========================================================================== */

THREE.ColorManagement.legacyMode = false;

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* 固定种子随机，保证每次打开细节一致 */
let _seed = 20240921;
function rnd() {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + rnd() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

/* 噪声（用于闪烁 / 水波扰动） */
const _nz = [];
for (let i = 0; i < 512; i++) _nz.push(rnd());
function noise1(x) {
  const i = Math.floor(x), f = x - i;
  const a = _nz[((i % 512) + 512) % 512], b = _nz[(((i + 1) % 512) + 512) % 512];
  return lerp(a, b, smoothstep(f));
}
function noise2(x, y) {
  return (noise1(x * 1.7 + y * 3.1) + noise1(y * 2.3 - x * 1.1)) * 0.5;
}

/* ---------------------------------------------------------------- 调色板 */
const PAL = {
  night: 0x0d1430,
  fog: 0x141d3c,
  moon: 0xa8c0ff,

  asphalt: 0x474d5e,
  asphaltDark: 0x3d4353,
  lanePaint: 0xf2f5fb,
  concrete: 0x8b93a3,
  concreteDark: 0x7d8391,
  curb: 0xb6bbc6,
  gutter: 0x8a909d,
  metal: 0xb4bcc8,
  darkMetal: 0x39404f,

  wallOut: 0xb6ad9c,
  wallOutDark: 0xa39b8a,
  trim: 0x27314c,
  brandBlue: 0x1f3a86,
  brandOrange: 0xf4802c,

  wallIn: 0xf3e6cd,
  floorIn: 0xb5a88e,
  ceilIn: 0xeee3cc,
  shelf: 0xd9cdb2,
  shelfEdge: 0xdfe7ef,
  counterTop: 0xcbab7e,
  counterBase: 0xe6e2d8,
  fridge: 0xeef3f8,

  warm: 0xffd9a0,
  warmDeep: 0xffb45c,
  lampWarm: 0xffe6bd,
  lampCool: 0xd8ecff,
  neonBlue: 0x6fd6ff,
  neonGreen: 0x8ef0b6,
  neonPink: 0xff8fb0,
  neonRed: 0xff6a5a,
};

/* ------------------------------------------------------------ 画布贴图 */
function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return { cv, g: cv.getContext('2d') };
}
function makeTex(w, h, draw, o) {
  o = o || {};
  const { cv, g } = makeCanvas(w, h);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  if (o.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(o.repeat[0], o.repeat[1]);
  }
  return t;
}
function texRepeat(t, rx, ry) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}
const JP_FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",system-ui,sans-serif';
function setFont(g, size, weight, family) {
  g.font = (weight || 700) + " " + size + "px " + (family || JP_FONT);
}
function txt(g, s, x, y, o) {
  o = o || {};
  g.save();
  setFont(g, o.size || 40, o.weight, o.font);
  g.fillStyle = o.color || '#fff';
  g.textAlign = o.align || 'center';
  g.textBaseline = o.baseline || 'middle';
  try { if (o.spacing != null) g.letterSpacing = o.spacing + 'px'; } catch (e) { }
  if (o.stroke) { g.lineWidth = o.strokeW || 4; g.strokeStyle = o.stroke; g.strokeText(s, x, y); }
  g.fillText(s, x, y);
  g.restore();
}
function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
/* 光晕 / 反射条纹 / 雨丝 / 涟漪 等程序化贴图 */
function glowTex(size) {
  size = size || 128;
  return makeTex(size, size, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.18, 'rgba(255,255,255,0.72)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.22)');
    gr.addColorStop(0.75, 'rgba(255,255,255,0.05)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
/* 地面反射光带：近端（亮源）在最下方，向远端渐隐，带水面横向波带 */
function reflTex(w, h) {
  w = w || 96; h = h || 320;
  return makeTex(w, h, (g, W, H) => {
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1);
      const fade = Math.pow(1 - v, 1.7);
      const band = 0.66 + 0.34 * Math.sin(v * 26 + Math.sin(v * 9) * 2.2);
      const ripple = 0.55 + 0.45 * noise2(v * 16, 3.1);
      const rowA = fade * band * ripple;
      for (let x = 0; x < W; x++) {
        const u = (x / (W - 1)) * 2 - 1;
        const lat = Math.exp(-u * u * 6.0) * (0.74 + 0.26 * Math.cos(u * 7 + v * 5));
        const a = clamp(rowA * lat, 0, 1);
        const i = (y * W + x) * 4;
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
        img.data[i + 3] = a * 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
}
function rainTex() {
  return makeTex(16, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.75, 'rgba(255,255,255,0.95)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(w / 2 - 1.4, 0, 2.8, h);
    g.globalAlpha = 0.5; g.filter = 'blur(1.5px)';
    g.fillRect(w / 2 - 2.4, 0, 4.8, h);
  });
}
function ringTex() {
  return makeTex(128, 128, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const r = 8 + t * 54;
      g.beginPath();
      g.arc(cx, cy, r, 0, TAU);
      g.strokeStyle = 'rgba(255,255,255,' + (0.06 * Math.pow(1 - t, 1.4)).toFixed(4) + ')';
      g.lineWidth = 3.4;
      g.stroke();
    }
    g.beginPath();
    g.arc(cx, cy, 52, 0, TAU);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 4; g.stroke();
  });
}
/* 玻璃上的水流 */
function glassWaterTex() {
  return makeTex(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = rr(0, w), y0 = rr(-40, h), len = rr(30, 210), wd = rr(0.7, 2.6), a = rr(0.05, 0.3);
      const gr = g.createLinearGradient(0, y0, 0, y0 + len);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.4, 'rgba(255,255,255,' + a.toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(x, y0, wd, len);
      if (rnd() < 0.35) {
        g.beginPath();
        g.arc(x + wd / 2, y0 + len, rr(1.2, 3.2), 0, TAU);
        g.fillStyle = 'rgba(255,255,255,' + (a * 1.4).toFixed(3) + ')';
        g.fill();
      }
    }
  }, { repeat: [1, 1] });
}
function streakGlowTex() {
  return makeTex(64, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const v = y / (h - 1);
      const fade = Math.pow(1 - v, 1.4);
      for (let x = 0; x < w; x++) {
        const u = (x / (w - 1)) * 2 - 1;
        const lat = Math.exp(-u * u * 5.0);
        const i = (y * w + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = clamp(fade * lat, 0, 1) * 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
}
/* 地面 / 墙面基础纹理 */
function asphaltTex() {
  return makeTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3a4150'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = ri(-16, 16);
      g.fillStyle = 'rgba(' + (76 + v) + ',' + (83 + v) + ',' + (100 + v) + ',0.5)';
      const s = rr(0.6, 2.6);
      g.fillRect(rr(0, w), rr(0, h), s, s);
    }
    for (let i = 0; i < 26; i++) {
      const x = rr(0, w), y = rr(0, h), r = rr(30, 130);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const dark = rnd() < 0.55;
      gr.addColorStop(0, dark ? 'rgba(40,46,60,0.30)' : 'rgba(150,158,175,0.13)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  }, { repeat: [3, 3] });
}
function concreteTex() {
  return makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#616878'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const v = ri(-14, 14);
      g.fillStyle = 'rgba(' + (127 + v) + ',' + (134 + v) + ',' + (149 + v) + ',0.55)';
      const s = rr(0.5, 2.2);
      g.fillRect(rr(0, w), rr(0, h), s, s);
    }
    for (let i = 0; i < 10; i++) {
      const x = rr(0, w), y = rr(0, h), r = rr(20, 90);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(90,96,110,0.18)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(96,102,116,0.5)'; g.lineWidth = 2.5;
    g.strokeRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.2;
    g.strokeRect(2, 2, w - 4, h - 4);
  }, { repeat: [4, 4] });
}
function tileFloorTex() {
  return makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#e2dbcd'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = ri(-7, 7);
      g.fillStyle = 'rgb(' + (214 + v) + ',' + (206 + v) + ',' + (190 + v) + ')';
      g.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
    }
    g.strokeStyle = 'rgba(120,112,98,0.95)'; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
  }, { repeat: [6, 6] });
}
function brickTex() {
  return makeTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6e6a68'; g.fillRect(0, 0, w, h);
    const bh = 32, bw = 64;
    for (let r = 0; r < h / bh; r++) {
      for (let c = -1; c < w / bw + 1; c++) {
        const off = (r % 2) * bw * 0.5;
        const v = ri(-14, 14);
        g.fillStyle = 'rgb(' + (118 + v) + ',' + (110 + v) + ',' + (106 + v) + ')';
        g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
      }
    }
  }, { repeat: [4, 4] });
}
function gridGrateTex() {
  return makeTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2b303c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8e95a2';
    for (let i = 0; i < 8; i++) g.fillRect(0, i * 16 + 4, w, 6);
    g.fillStyle = '#7d848f'; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
  });
}
function manholeTex() {
  return makeTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#565d6d'; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill();
    g.strokeStyle = '#767d8d'; g.lineWidth = 5;
    g.beginPath(); g.arc(128, 128, 116, 0, TAU); g.stroke();
    g.strokeStyle = '#454b59'; g.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
      g.save(); g.translate(128, 128); g.rotate((i / 12) * TAU);
      g.beginPath(); g.moveTo(30, 0); g.lineTo(104, 0); g.stroke(); g.restore();
    }
    g.beginPath(); g.arc(128, 128, 40, 0, TAU); g.stroke();
    g.fillStyle = '#3c4250'; g.beginPath(); g.arc(128, 128, 26, 0, TAU); g.fill();
  });
}
/* 杂志封面 / 海报 / 商品小图 —— 用色块拼出"信息量" */
function magCoverTex(hue) {
  return makeTex(96, 128, (g, w, h) => {
    const c = 'hsl(' + hue + ',72%,62%)';
    g.fillStyle = '#fdfaf4'; g.fillRect(0, 0, w, h);
    g.fillStyle = c; g.fillRect(0, 0, w, 44);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(8, 10, 46, 8); g.fillRect(8, 24, 30, 6);
    g.fillStyle = 'hsl(' + ((hue + 40) % 360) + ',60%,78%)';
    g.fillRect(6, 50, w - 12, 46);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(12, 62, 40, 24);
    g.fillStyle = '#2b2f3a';
    for (let i = 0; i < 4; i++) g.fillRect(8, 104 + i * 6, rr(30, 74), 3);
  });
}
function posterTex(seedHue, title, sub) {
  return makeTex(256, 320, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'hsl(' + seedHue + ',70%,66%)');
    gr.addColorStop(1, 'hsl(' + ((seedHue + 46) % 360) + ',72%,52%)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath(); g.arc(w * 0.5, h * 0.38, w * 0.26, 0, TAU); g.fill();
    g.fillStyle = 'hsla(' + ((seedHue + 180) % 360) + ',60%,50%,0.55)';
    g.beginPath(); g.arc(w * 0.5, h * 0.38, w * 0.17, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(0, h - 108, w, 108);
    txt(g, title, w / 2, h - 78, { size: 40, color: '#26314d' });
    txt(g, sub || '', w / 2, h - 36, { size: 24, color: '#d2452f' });
  });
}
/* 便利店招牌（主 LOGO） */
function brandTex(w, h, o) {
  o = o || {};
  return makeTex(w, h, (g, W, H) => {
    g.fillStyle = o.bg || '#f7f4ee'; g.fillRect(0, 0, W, H);
    if (o.frame !== false) {
      g.strokeStyle = 'rgba(30,40,70,0.35)'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
    }
    const barY = H * 0.78, barH = H * 0.14;
    g.fillStyle = '#2f9e63'; g.fillRect(W * 0.06, barY, W * 0.29, barH);
    g.fillStyle = '#f4802c'; g.fillRect(W * 0.35, barY, W * 0.30, barH);
    g.fillStyle = '#d94436'; g.fillRect(W * 0.65, barY, W * 0.29, barH);
    txt(g, 'ひかりマート', W / 2, H * 0.40, { size: H * 0.40, color: '#1f3a86' });
    txt(g, 'HIKARI  MART', W / 2, H * 0.66, { size: H * 0.15, color: '#5a6a86', spacing: 3 });
  });
}
