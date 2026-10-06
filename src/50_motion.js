/* ============================================================================
   50 — 动效：招牌闪烁 / 自动门开合 / 交通灯变化 / 摆动 / 电视蓝光
   ========================================================================== */

const storeFx = {};
const sigState = { t: 0, idx: 0, phase: 'green' };

/* 招牌闪烁因子：常态轻微起伏 + 偶发抽搐 */
function flickFactor(seed, t, hard) {
  const slow = 0.955 + 0.045 * noise1(t * 0.55 + seed * 7.3);
  if (!hard) return slow;
  const burst = noise1(t * 2.6 + seed * 3.1);
  if (burst > 0.965) return 0.06 + rnd() * 0.5;
  if (burst > 0.92) return 0.55 + 0.3 * noise1(t * 9 + seed);
  return slow;
}
function updateFlickers(t) {
  for (let i = 0; i < flickerList.length; i++) {
    const f = flickerList[i];
    const v = f.base * flickFactor(i + 1, t, f.hard);
    for (let j = 0; j < f.mats.length; j++) f.mats[j].color.setScalar(v);
  }
  for (let i = 0; i < signFlicker.mats.length; i++) {
    const f = signFlicker.mats[i];
    f.m.color.setScalar(f.base * flickFactor(i + 20, t, i === 2));
  }
  for (let i = 0; i < signFlicker.sprites.length; i++) {
    const sp = signFlicker.sprites[i];
    sp.s.opacity = sp.base * flickFactor(i + 40, t, false);
  }
  for (let i = 0; i < tvWindows.length; i++) {
    const w = tvWindows[i];
    const v = 0.62 + 0.38 * Math.abs(Math.sin(t * w.speed + i)) * (0.6 + 0.4 * noise1(t * 6 + i * 3));
    w.mat.color.setRGB(v * 0.85, v * 0.92, v * 1.15);
  }
}

/* ------------------------------------------------------------ 自动门 */
function updateDoor(dt) {
  const D = doorState;
  if (D.mode === 'idle') {
    D.t -= dt;
    if (D.t <= 0) { D.mode = 'open'; D.t = 1.15; }
  } else if (D.mode === 'open') {
    D.t -= dt;
    D.open = Math.min(1, D.open + dt / 1.15);
    if (D.t <= 0) { D.mode = 'hold'; D.t = rr(3.5, 6.5); }
  } else if (D.mode === 'hold') {
    D.t -= dt;
    D.open = 1;
    if (D.t <= 0) { D.mode = 'close'; D.t = 1.4; }
  } else {
    D.t -= dt;
    D.open = Math.max(0, D.open - dt / 1.4);
    if (D.t <= 0) { D.mode = 'idle'; D.t = rr(9, 17); }
  }
  const e = easeInOut(D.open);
  for (let i = 0; i < D.panels.length; i++) {
    const p = D.panels[i];
    p.g.position.x = (i === 0 ? -2.62 : -1.40) + p.dir * 1.18 * e;
  }
  if (storeFx.doorGlow) storeFx.doorGlow.material.opacity = 0.34 + 0.34 * e;
  if (storeFx.spill) storeFx.spill.intensity = 0.42 + 0.75 * e;
  if (storeFx.doorSpill) storeFx.doorSpill.material.opacity = 0.18 + 0.3 * e;
}

/* ------------------------------------------------------------ 交通信号 */
function updateSignals(dt) {
  const S2 = sigState;
  S2.t -= dt;
  if (S2.t <= 0) {
    if (S2.phase === 'green') { S2.phase = 'yellow'; S2.t = 2.4; }
    else if (S2.phase === 'yellow') { S2.phase = 'red'; S2.t = 11.5; }
    else { S2.phase = 'green'; S2.t = 15.0; }
  }
  const on = { green: 0, yellow: 1, red: 2 }[S2.phase];
  for (let i = 0; i < signals.length; i++) {
    const S = signals[i];
    for (let k = 0; k < S.lamps.length; k++) {
      const L = S.lamps[k];
      const lit = k === on;
      if (lit) L.mat.color.setHex(L.color).multiplyScalar(2.1);
      else L.mat.color.setHex(L.color).multiplyScalar(0.055);
    }
    const walk = S2.phase === 'red';
    S.ped[0].mat.color.setHex(walk ? 0x2f9e63 : 0xd94436).multiplyScalar(walk ? 0.06 : 1.9);
    S.ped[1].mat.color.setHex(0x2f9e63).multiplyScalar(walk ? 1.9 : 0.06);
    const col = S2.phase === 'green' ? 0x8ef0b6 : (S2.phase === 'yellow' ? 0xffd24a : 0xff7a5a);
    S.glow.material.color.setHex(col);
    S.glow.material.opacity = 0.30 + 0.06 * noise1(performance.now() * 0.002 + i);
  }
  const ds = dynamicStreaks.signal;
  if (ds) {
    const col = S2.phase === 'green' ? 0x7fe0a8 : (S2.phase === 'yellow' ? 0xffc94a : 0xff7a5a);
    ds.mat.color.setHex(col);
  }
}

/* ------------------------------------------------------------ 其他摆动 */
function updateSway(t) {
  for (let i = 0; i < swayList.length; i++) {
    const s = swayList[i];
    s.o.rotation.y = s.base + Math.sin(t * s.sp + i) * s.amp;
  }
  uTime.value = t;
}
function updateMotion(dt, t) {
  updateFlickers(t);
  updateDoor(dt);
  updateSignals(dt);
  updateSway(t);
  for (let i = 0; i < updaters.length; i++) updaters[i](dt, t);
}
