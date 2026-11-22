// Core helpers: canvas, fonts, math, shapes, text, camera, effects.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const W = 1920, H = 1080, FPS = 30;
export const OUT = '#1b1030';

GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/LuckiestGuy.ttf'), 'Lucky');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Bangers.ttf'), 'Bangers');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Baloo2-ExtraBold.ttf'), 'BalooX');
GlobalFonts.registerFromPath(path.join(ROOT, 'assets/fonts/Baloo2-Bold.ttf'), 'BalooB');

export function makeCanvas(w = W, h = H) {
  const c = createCanvas(w, h);
  return [c, c.getContext('2d')];
}

// ---------- math ----------
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (a, b, v) => clamp((v - a) / (b - a)); // 0..1 progress of v from a to b
export const TAU = Math.PI * 2;
export const ease = {
  lin: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};
// piecewise keyframe interpolation: keys = [[t, v], ...]
export function keys(t, ks, e = ease.inOut) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
    if (t <= t1) {
      const p = e((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((x, j) => lerp(x, v1[j], p));
      return lerp(v0, v1, p);
    }
  }
  return ks[ks.length - 1][1];
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 57), hash(i + 1 + seed * 57), u) * 2 - 1;
}

// ---------- shapes ----------
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); }
export function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
export function fs(ctx, fill, lw = 5, stroke = OUT) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
export function line(ctx, x1, y1, x2, y2, lw, color = OUT) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
}
// thick outlined limb (outline then fill)
export function limb(ctx, pts, w, color, out = 5) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = w + out * 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
}
export function starPath(ctx, cx, cy, r1, r2, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}
export function burstPath(ctx, cx, cy, r1, r2, n, seed = 1) {
  const R = rng(seed); ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = (i % 2 ? r2 : r1) * (0.8 + R() * 0.4), a = (i * Math.PI) / n;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

// ---------- text ----------
export function txt(ctx, s, x, y, o = {}) {
  const size = o.size || 60;
  ctx.font = `${size}px ${o.font || 'Lucky'}`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x + size * 0.06, y + size * 0.08); }
  if (o.lw !== 0) {
    ctx.lineWidth = o.lw ?? size * 0.16; ctx.strokeStyle = o.stroke || OUT; ctx.lineJoin = 'round';
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = o.fill || '#fff';
  ctx.fillText(s, x, y);
}
export function wrap(ctx, s, maxW) {
  const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------- camera ----------
// cam: {x,y} world point at screen center, zoom, rot, shake (px amplitude)
export function camera(ctx, t, cam = {}) {
  const z = cam.zoom ?? 1, sh = cam.shake || 0;
  const sx = sh ? noise(t * 25, 1) * sh : 0, sy = sh ? noise(t * 25, 2) * sh : 0;
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.scale(z, z);
  if (cam.rot) ctx.rotate(cam.rot);
  ctx.translate(-(cam.x ?? W / 2), -(cam.y ?? H / 2));
}

// ---------- effects ----------
export function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}
export function dust(ctx, x, y, age, s = 1, seed = 3, color = '#e9dcc9') {
  if (age < 0 || age > 1.2) return;
  const R = rng(seed);
  ctx.save();
  ctx.globalAlpha = clamp(1 - age / 1.2);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + R() * Math.PI, d = (40 + R() * 70) * ease.out(clamp(age / 0.8)) * s;
    const r = (18 + R() * 22) * s * (0.5 + age);
    circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5 - age * 30 * s, r);
    fs(ctx, color, 4 * s);
  }
  ctx.restore();
}
export function explosion(ctx, x, y, age, s = 1, seed = 5) {
  if (age < 0 || age > 1.6) return;
  const R = rng(seed);
  ctx.save();
  const p = ease.out(clamp(age / 0.5));
  ctx.globalAlpha = clamp(1.6 - age);
  // smoke
  for (let i = 0; i < 9; i++) {
    const a = R() * TAU, d = R() * 120 * s * p;
    circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - age * 80 * s, (50 + R() * 40) * s * (0.4 + p));
    fs(ctx, age > 0.4 ? '#4a3b4f' : '#ff9f1c', 5 * s);
  }
  if (age < 0.7) {
    burstPath(ctx, x, y, 170 * s * p, 90 * s * p, 11, seed);
    fs(ctx, '#ffd23f', 6 * s);
    burstPath(ctx, x, y, 100 * s * p, 55 * s * p, 9, seed + 1);
    fs(ctx, '#fff3b0', 0);
  }
  // debris
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * R(), v = (300 + R() * 500) * s;
    const dx = Math.cos(a) * v * age, dy = Math.sin(a) * v * age + 600 * s * age * age;
    rr(ctx, x + dx - 8 * s, y + dy - 8 * s, 16 * s, 16 * s, 3); fs(ctx, '#3d2c3e', 3 * s);
  }
  ctx.restore();
}
export function speedLines(ctx, t, alpha = 0.5, cx = W / 2, cy = H / 2, seed = 9) {
  const R = rng(seed + Math.floor(t * 15));
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) {
    const a = R() * TAU, r0 = 420 + R() * 300, r1 = 1400, w = 0.004 + R() * 0.01;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1);
    ctx.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1);
    ctx.fill();
  }
  ctx.restore();
}
export function hLines(ctx, t, alpha = 0.6, seed = 4, color = '#fff') {
  // horizontal motion streaks
  const R = rng(seed);
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const y = R() * H, len = 200 + R() * 500, sp = 2500 + R() * 2500;
    const x = W + 300 - ((t * sp + R() * 4000) % (W + 1200));
    ctx.lineWidth = 2 + R() * 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.restore();
}
export function sparkle(ctx, x, y, r, a = 1, color = '#fff') {
  ctx.save(); ctx.globalAlpha = a;
  starPath(ctx, x, y, r, r * 0.25, 4, 0); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
// comic "POW" burst text
export function pow(ctx, x, y, word, age, s = 1, color = '#ffd23f', seed = 7) {
  if (age < 0 || age > 0.9) return;
  const p = ease.back(clamp(age / 0.18)), a = clamp((0.9 - age) / 0.25);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.12); ctx.scale(p * s, p * s);
  burstPath(ctx, 0, 0, 150, 95, 12, seed); fs(ctx, color, 7);
  txt(ctx, word, 0, 6, { size: 74, font: 'Bangers', fill: '#e63946', lw: 10 });
  ctx.restore();
}
// dizzy stars orbiting
export function dizzy(ctx, x, y, t, s = 1) {
  for (let i = 0; i < 3; i++) {
    const a = t * 6 + (i * TAU) / 3;
    starPath(ctx, x + Math.cos(a) * 70 * s, y + Math.sin(a) * 18 * s, 18 * s, 8 * s);
    fs(ctx, '#ffd23f', 3 * s);
  }
}
export function sweat(ctx, x, y, t, s = 1) {
  const p = (t * 1.5) % 1;
  ctx.save(); ctx.globalAlpha = 1 - p;
  ctx.beginPath();
  const yy = y + p * 40 * s;
  ctx.moveTo(x, yy - 18 * s);
  ctx.quadraticCurveTo(x + 12 * s, yy, x, yy + 6 * s);
  ctx.quadraticCurveTo(x - 12 * s, yy, x, yy - 18 * s);
  fs(ctx, '#8fd3ff', 3 * s);
  ctx.restore();
}
export function vignette(ctx, a = 0.45) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(10,0,25,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
export function iris(ctx, p, cx = W / 2, cy = H / 2) {
  // p=0 fully open, p=1 closed (black)
  if (p <= 0) return;
  const r = (1 - p) * 1300;
  ctx.save(); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(0, r), 0, TAU, true); ctx.fill('evenodd');
  ctx.restore();
}
export function fadeRect(ctx, a, color = '#000') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore();
}
export function letterbox(ctx, p) {
  if (p <= 0) return;
  const h = 110 * p; ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
}
