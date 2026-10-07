# 雨夜便利店 · 街角微缩模型

**Rainy Night Store — a street-corner diorama**

一个用原生 JavaScript + three.js 手写的雨夜街角便利店微缩场景：下雨的路面、闪烁的招牌、自动门、店内陈设、贩卖机、电线杆与雾气。**零运行时依赖、零外部素材**——所有贴图都在 Canvas 2D 上程序化生成，模型全部由代码用几何体搭出来。

A hand-written rainy-night convenience-store diorama built with vanilla JavaScript and three.js: wet asphalt, flickering signage, sliding doors, a fully furnished interior, vending machines, utility poles and fog. **No runtime dependencies, no external assets** — every texture is generated procedurally on a Canvas 2D context and every model is assembled from primitives in code.

---

## 生成说明 / Generation Note

整个场景由 **deepseek-v4.1-flash** 模型搭配一份自然语言需求提示词**一次性完整生成**——包括全部 `src/` 源码、`template.html` 与 `build.mjs`，没有后续手工修补。提示词原文保存在 [`PROMPT.md`](./PROMPT.md)。

The entire scene was **fully generated in a single shot** by the **deepseek-v4.1-flash** model from one natural-language prompt — all of `src/`, plus `template.html` and `build.mjs`, with no subsequent hand-editing. The original prompt is preserved in [`PROMPT.md`](./PROMPT.md).

---

## 预览 / Preview

构建后得到**单个 HTML 文件**，用浏览器直接打开即可，无需服务器：

The build produces a **single self-contained HTML file**. Open it in a browser directly — no server required:

```bash
node build.mjs            # 生成 index.html
open index.html           # macOS
# xdg-open index.html     # Linux
# start index.html        # Windows
```

> 需要支持 WebGL 的现代浏览器，以及一段能跑起来的 GPU。
> Requires a modern WebGL-capable browser and a GPU that cooperates.

---

## 快速开始 / Quick Start

**依赖 / Requirements**

| 用途 / Purpose | 要求 / Requirement |
| --- | --- |
| 构建 / Build | Node.js ≥ 16（只用到 `node:fs`、`node:path`） |
| 运行 / Run | 任意支持 WebGL 的浏览器；**不需要** npm install |

> ⚠️ `index.html` 是构建产物，已写入 `.gitignore`，**不在仓库里**。克隆后请先执行 `node build.mjs` 再打开。
>
> ⚠️ `index.html` is a build artifact and is listed in `.gitignore`, so it is **not committed**. Run `node build.mjs` after cloning before opening it.

**构建 / Build**

```bash
node build.mjs
# built -> index.html  (752 KB, 9 modules, 3389 lines app)
```

`build.mjs` 做的事情只有三件：读取 `vendor/three.min.js`，按文件名排序拼接 `src/*.js`，再把两者注入 `template.html` 的占位符并输出单文件 HTML。构建是**确定性**的——同样的源码永远得到逐字节相同的结果。

`build.mjs` does exactly three things: read `vendor/three.min.js`, concatenate `src/*.js` in filename order, and splice both into the `/*__THREE__*/` and `/*__APP__*/` placeholders in `template.html`. The build is **deterministic** — identical sources always yield a byte-identical file.

---

## 操作 / Controls

| 操作 / Action | 鼠标 / Mouse | 触屏 / Touch |
| --- | --- | --- |
| 旋转视角 / Orbit | 左键拖拽 | 单指拖拽 |
| 平移 / Pan | 右键或中键拖拽，或 `Shift` + 拖拽 | 双指拖拽 |
| 缩放 / Zoom | 滚轮 | 双指捏合 |
| 复位视角 / Reset view | `R` | — |

闲置 15 秒后镜头会缓慢自动环绕；任意操作都会立刻打断它。
The camera slowly auto-orbits after 15 seconds of inactivity; any input interrupts it.

---

## URL 参数 / URL Parameters

| 参数 / Parameter | 说明 / Description |
| --- | --- |
| `?view=theta,phi,dist,x,y,z` | 把相机钉在指定机位（球坐标 + 注视点），同时关闭自动环绕。便于截图对比。<br>Pins the camera to an exact pose (spherical coords + look-at target) and disables auto-orbit. Handy for reproducible screenshots. |
| `?nofx` | 只关闭自动环绕，其余交互不变。<br>Disables only the auto-orbit. |

```text
index.html?view=-0.66,1.32,52,0.7,1.0,-0.7
index.html?nofx
```

参数非法时会静默忽略并退回默认机位。
Malformed values are silently ignored and the default pose is used.

---

## 项目结构 / Project Structure

```text
rainy-night-store/
├── PROMPT.md            # 生成场景所用的原始提示词 / original generation prompt
├── build.mjs            # 单文件打包脚本 / single-file bundler
├── template.html        # HTML 外壳与占位符 / shell + placeholders
├── src/                 # 按序号拼接的源码 / sources, concatenated in order
├── vendor/three.min.js  # three.js r149 (UMD, MIT)
└── index.html           # 构建产物（已忽略）/ build output (gitignored)
```

`src/` 下的文件**不是** ES 模块——它们被按文件名顺序拼进同一个 IIFE 里，共享一份作用域，因此顺序即依赖关系，改文件名等于改加载顺序。数字前缀就是这个顺序。

The files in `src/` are **not** ES modules. They are concatenated into a single IIFE and share one scope, so the filename order *is* the dependency order — the numeric prefixes encode it.

| 模块 / Module | 行数 | 内容 / Contents |
| --- | --- | --- |
| `00_core.js` | 376 | 常量、随机与噪声、调色板、Canvas 程序化贴图、通用工具<br>Constants, PRNG/noise, palette, procedural canvas textures, utilities |
| `01_mat.js` | 208 | 卡通材质与渐变贴图、几何辅助、描边、全局注册表（每帧回调 / 涟漪点 / 灯光闪烁 / 发光体）<br />Toon materials and gradient ramp, geometry helpers, outlines, global registries (per-frame updaters, ripple spots, flicker lights, emitters) |
| `10_world.js` | 251 | 底座、天空、道路、人行道、路沿、排水沟、标线、积水、护栏<br />Base plate, sky, roads, sidewalks, curbs, drains, lane markings, puddles, railings |
| `11_neighbor.js` | 305 | 右侧邻栋、后巷、背景住宅、围墙、电视蓝光窗户<br />Neighbouring building, back alley, background housing, walls, TV-blue windows |
| `20_store.js` | 835 | 便利店主体：外壳、玻璃幕、自动门、雨棚、招牌、店内全套陈设<br />The store itself: shell, glass curtain wall, sliding doors, awning, signage, full interior |
| `30_props.js` | 592 | 贩卖机、自行车、伞架、垃圾桶、路灯、电线杆、路牌、凸面镜、公告栏、のぼり旗、盆栽、交通信号<br />Vending machine, bicycle, umbrella stand, bins, street lamps, utility poles, signs, convex mirror, notice board, nobori flags, bonsai, traffic signal |
| `40_weather.js` | 301 | 持续降雨、雨滴涟漪、檐口滴水、湿路面反射光带、排水沟水流、雾气<br />Rain, ripples, eaves drips, wet-road reflection streaks, gutter flow, fog |
| `50_motion.js` | 113 | 招牌闪烁、自动门开合、交通灯周期、摆动、电视蓝光<br />Sign flicker, door animation, traffic-light cycle, swaying, TV glow |
| `60_main.js` | 381 | 渲染器、灯光、相机、自由轨道控制、场景构建与主循环、辉光后处理<br />Renderer, lights, camera, orbit controls, scene build, main loop, bloom post-processing |

---

## 渲染实现 / Rendering Notes

- **卡通着色** — `MeshToonMaterial` + 自建渐变贴图（`gradRamp`）压出硬边明暗交界。描边是自定义 shader 的背面外扩壳：顶点沿法线在**视图空间**偏移并按深度补偿（`n * uW * -mv.z`），所以画面上线宽恒定，且描边单独接入雾色，远处不会浮出一圈黑影。<br />**Toon shading** — `MeshToonMaterial` plus a hand-built gradient ramp for hard terminator edges. Outlines are inverted hulls driven by a custom shader: vertices push along the view-space normal with depth compensation (`n * uW * -mv.z`) so the line width stays screen-constant, and the outline applies its own fog blend so distant edges don't read as a dark halo.
- **辉光 / Bloom** — 没有引入任何后处理库，自己搭了一条 `亮部提取 → 可分离高斯模糊（横向 + 纵向）→ 合成` 的管线，离屏 RT 在 resize 时重建。<br />**Bloom** — no post-processing library; a hand-rolled `bright pass → separable Gaussian blur (H + V) → composite` chain with offscreen render targets rebuilt on resize.
- **雨天氛围** — 雨丝分层错速下落，落点按注册的 `wetSpots` 生成扩散涟漪；招牌与店内暖光通过 `emitters` 在人行道和马路上投出两级反射光带。<br />**Rain mood** — layered rain at staggered speeds, impact ripples spawned on registered `wetSpots`, and store/sign glow cast onto sidewalk and road as two-tier reflection streaks via `emitters`.
- **确定性随机** — 全部随机数走同一个可播种 PRNG，场景每次构建完全一致，方便对比改动。<br />**Deterministic randomness** — everything draws from one seedable PRNG, so the scene rebuilds identically and diffs stay meaningful.
- **程序化贴图** — 约 60 张贴图由 `makeTex(w, h, draw)` 在 Canvas 2D 上现场绘制（招牌字、玻璃反射、路面颗粒、窗格等），仓库里没有任何图片文件。<br />**Procedural textures** — ~60 textures are drawn at runtime by `makeTex(w, h, draw)` on a Canvas 2D context (signage, glass reflections, asphalt grain, window grids). The repository contains no image files at all.

---

## 许可 / License

本项目以 **MIT** 许可分发，详见 [`LICENSE`](./LICENSE)。随附的 three.js r149（`vendor/three.min.js`）版权归 Three.js Authors 所有，同样以 **MIT** 许可分发，许可证头保留在文件顶部。

This project is distributed under the **MIT** license — see [`LICENSE`](./LICENSE). The bundled three.js r149 (`vendor/three.min.js`) is © Three.js Authors, distributed under the **MIT** license, with its license header preserved at the top of the file.
