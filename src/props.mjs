// Vehicles and world props (side view, y = ground line).
import { OUT, TAU, W, H, clamp, lerp, rr, circle, ell, fs, line, rng, starPath, txt, vgrad } from './engine.mjs';
import { darken } from './characters.mjs';

export function wheel(ctx, x, y, r, rot, rim = '#d9d9d9') {
  circle(ctx, x, y, r); fs(ctx, '#1d1a22', 5);
  circle(ctx, x, y, r * 0.55); fs(ctx, rim, 4);
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * TAU) / 5;
    line(ctx, x, y, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 4, '#7a7a7a');
  }
  circle(ctx, x, y, r * 0.14); fs(ctx, '#555', 3);
}

// sports car facing right, length ~ 420*s
export function sportsCar(ctx, x, y, o = {}) {
  const s = o.s ?? 1, col = o.color || '#e63946', rot = o.wheelRot || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  ell(ctx, 0, 4, 220, 14); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-210, -40); ctx.lineTo(-200, -78); ctx.quadraticCurveTo(-120, -88, -70, -92);
  ctx.quadraticCurveTo(-20, -140, 50, -132); ctx.quadraticCurveTo(110, -110, 140, -86);
  ctx.quadraticCurveTo(200, -80, 215, -60); ctx.lineTo(212, -36); ctx.quadraticCurveTo(205, -22, 190, -22);
  ctx.lineTo(-195, -22); ctx.quadraticCurveTo(-212, -24, -210, -40); ctx.closePath();
  fs(ctx, col, 6);
  // window
  const sw = () => { ctx.beginPath(); ctx.moveTo(-50, -92); ctx.quadraticCurveTo(-8, -128, 48, -122); ctx.quadraticCurveTo(95, -106, 118, -88); ctx.closePath(); };
  sw(); fs(ctx, '#9be7ff', 0);
  if (o.driver) { ctx.save(); sw(); ctx.clip(); o.driver(ctx); ctx.restore(); }
  sw(); fs(ctx, null, 5);
  line(ctx, 30, -124, 22, -90, 5);
  line(ctx, -20, -112, 10, -100, 5, 'rgba(255,255,255,0.7)');
  // stripe
  line(ctx, -195, -58, 200, -58, 8, darken(col, 0.75));
  // lights
  ell(ctx, 204, -54, 10, 8); fs(ctx, o.lights ? '#fffbcc' : '#ffe8a3', 4);
  rr(ctx, -212, -66, 14, 16, 4); fs(ctx, o.brake ? '#ff2e2e' : '#b21e2e', 4);
  if (o.alarm) {
    ctx.save(); ctx.globalAlpha = 0.6; circle(ctx, 210, -54, 45); ctx.fillStyle = '#fff6a8'; ctx.fill(); circle(ctx, -210, -58, 40); ctx.fillStyle = '#ff6060'; ctx.fill(); ctx.restore();
  }
  // door handle
  line(ctx, 10, -76, 34, -76, 6);
  wheel(ctx, -130, -22, 40, rot); wheel(ctx, 135, -22, 40, rot);
  ctx.restore();
}

// generic traffic car
export function car(ctx, x, y, o = {}) {
  const s = o.s ?? 1, col = o.color || '#4cc9f0', rot = o.wheelRot || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  ell(ctx, 0, 4, 190, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  rr(ctx, -185, -95, 370, 72, 26); fs(ctx, col, 6);
  ctx.beginPath(); ctx.moveTo(-110, -92); ctx.quadraticCurveTo(-90, -160, -20, -160); ctx.lineTo(60, -160); ctx.quadraticCurveTo(110, -160, 125, -92); ctx.closePath(); fs(ctx, col, 6);
  const win = () => { ctx.beginPath(); ctx.moveTo(-90, -96); ctx.quadraticCurveTo(-75, -146, -20, -146); ctx.lineTo(10, -146); ctx.lineTo(10, -96); ctx.closePath();
    ctx.moveTo(24, -96); ctx.lineTo(24, -146); ctx.lineTo(60, -146); ctx.quadraticCurveTo(98, -146, 108, -96); ctx.closePath(); };
  win(); fs(ctx, '#9be7ff', 0);
  if (o.driver) { ctx.save(); win(); ctx.clip(); o.driver(ctx); ctx.restore(); }
  win(); fs(ctx, null, 5);
  if (o.police) {
    rr(ctx, -40, -182, 80, 22, 8); fs(ctx, '#222', 4);
    const on = Math.floor((o.t || 0) * 8) % 2;
    rr(ctx, -38, -180, 38, 18, 6); fs(ctx, on ? '#ff2e4d' : '#7a1020', 0);
    rr(ctx, 0, -180, 38, 18, 6); fs(ctx, on ? '#1f3d99' : '#3aa0ff', 0);
    ctx.save(); ctx.globalAlpha = 0.35; circle(ctx, on ? -20 : 20, -171, 60); ctx.fillStyle = on ? '#ff2e4d' : '#3aa0ff'; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(-185, -70, 370, 22);
    txt(ctx, 'POLICE', 0, -58, { size: 30, font: 'Bangers', fill: '#1f3d99', lw: 0 });
  }
  ell(ctx, 178, -70, 9, 10); fs(ctx, '#fffbcc', 4);
  rr(ctx, -190, -80, 12, 18, 4); fs(ctx, o.brake ? '#ff5050' : '#b21e2e', 4);
  wheel(ctx, -110, -22, 38, rot); wheel(ctx, 115, -22, 38, rot);
  ctx.restore();
}

// police jeep (boxy, open side window)
export function jeep(ctx, x, y, o = {}) {
  const s = o.s ?? 1, rot = o.wheelRot || 0, t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  ell(ctx, 0, 4, 200, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  rr(ctx, -190, -110, 380, 88, 14); fs(ctx, '#f1f1f1', 6);
  ctx.beginPath(); ctx.moveTo(-150, -108); ctx.lineTo(-130, -200); ctx.lineTo(90, -200); ctx.lineTo(130, -108); ctx.closePath(); fs(ctx, '#f1f1f1', 6);
  const jw = () => { ctx.beginPath(); ctx.moveTo(-15, -112); ctx.lineTo(-15, -186); ctx.lineTo(82, -186); ctx.lineTo(112, -112); ctx.closePath(); };
  jw(); fs(ctx, '#bfefff', 0);
  if (o.driver) { ctx.save(); if (!o.driverOut) { jw(); ctx.clip(); } o.driver(ctx); ctx.restore(); }
  jw(); fs(ctx, null, 5);
  ctx.fillStyle = '#1f3d99'; ctx.fillRect(-188, -78, 376, 20);
  txt(ctx, 'POLICE', -80, -136, { size: 40, font: 'Bangers', fill: '#1f3d99', lw: 0 });
  rr(ctx, -60, -224, 120, 24, 8); fs(ctx, '#222', 4);
  const on = Math.floor(t * 8) % 2;
  rr(ctx, -57, -221, 56, 18, 6); fs(ctx, on ? '#ff2e4d' : '#7a1020', 0);
  rr(ctx, 1, -221, 56, 18, 6); fs(ctx, on ? '#1f3d99' : '#3aa0ff', 0);
  ctx.save(); ctx.globalAlpha = 0.35; circle(ctx, on ? -30 : 30, -212, 80); ctx.fillStyle = on ? '#ff2e4d' : '#3aa0ff'; ctx.fill(); ctx.restore();
  ell(ctx, 182, -88, 9, 12); fs(ctx, '#fffbcc', 4);
  wheel(ctx, -115, -22, 42, rot); wheel(ctx, 120, -22, 42, rot);
  ctx.restore();
}

// bicycle facing right; returns seat/handle/pedal local positions (scaled)
export function bicycle(ctx, x, y, o = {}) {
  const s = o.s ?? 1, rot = o.wheelRot || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  const r = 58, bx = -95, fx = 95, wy = -r;
  for (const wx of [bx, fx]) {
    circle(ctx, wx, wy, r); ctx.lineWidth = 12; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#444'; ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = rot + (i * Math.PI) / 8; line(ctx, wx - Math.cos(a) * r, wy - Math.sin(a) * r, wx + Math.cos(a) * r, wy + Math.sin(a) * r, 2, '#999'); }
    circle(ctx, wx, wy, 7); fs(ctx, '#888', 3);
  }
  const col = o.color || '#ff4fa3';
  const P = (pts, w = 10) => { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w + 8; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); };
  P([[bx, wy], [0, wy], [-20, -150], [bx, wy]]);
  P([[0, wy], [70, -150], [-20, -150]]);
  P([[70, -150], [fx, wy]]);
  P([[70, -150], [64, -185]]);
  P([[50, -190], [86, -186]], 8);
  // seat
  rr(ctx, -50, -170, 60, 16, 8); fs(ctx, '#222', 4);
  line(ctx, -20, -155, -20, -150, 8);
  // carrier
  P([[bx + 5, -125], [-35, -125]], 6);
  // bell
  circle(ctx, 76, -195, 9); fs(ctx, '#ffd23f', 3);
  // crank
  circle(ctx, 0, wy, 18); fs(ctx, '#777', 4);
  const pa = o.pedal || 0;
  line(ctx, 0, wy, Math.cos(pa) * 18, wy + Math.sin(pa) * 18, 6, '#333');
  ctx.restore();
}

// auto-rickshaw facing right
export function auto(ctx, x, y, o = {}) {
  const s = o.s ?? 1, rot = o.wheelRot || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  ell(ctx, 0, 4, 180, 12); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  if (o.back) { ctx.save(); o.back(ctx); ctx.restore(); }
  // lower body
  ctx.beginPath(); ctx.moveTo(-170, -40); ctx.lineTo(-175, -120); ctx.lineTo(60, -120); ctx.quadraticCurveTo(150, -118, 165, -60); ctx.lineTo(160, -40); ctx.closePath(); fs(ctx, '#2a9d4f', 6);
  // canopy
  ctx.beginPath(); ctx.moveTo(-178, -118); ctx.lineTo(-170, -250); ctx.quadraticCurveTo(-60, -290, 90, -255); ctx.quadraticCurveTo(140, -235, 150, -150); ctx.lineTo(140, -118); ctx.closePath();
  ctx.save(); fs(ctx, '#ffd23f', 6); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-178, -118); ctx.lineTo(-174, -175); ctx.lineTo(140, -175); ctx.lineTo(140, -118); ctx.closePath(); fs(ctx, '#ffd23f', 0);
  // openings
  ctx.beginPath(); ctx.moveTo(-150, -125); ctx.lineTo(-145, -235); ctx.quadraticCurveTo(-90, -255, -40, -250); ctx.lineTo(-40, -125); ctx.closePath(); fs(ctx, '#1b1030', 5);
  ctx.beginPath(); ctx.moveTo(0, -125); ctx.lineTo(0, -250); ctx.quadraticCurveTo(70, -250, 110, -230); ctx.quadraticCurveTo(128, -190, 128, -125); ctx.closePath(); fs(ctx, '#1b1030', 5);
  if (o.inside) { ctx.save(); o.inside(ctx); ctx.restore(); }
  // canopy top outline + black roof
  ctx.beginPath(); ctx.moveTo(-170, -250); ctx.quadraticCurveTo(-60, -290, 90, -255); ctx.lineWidth = 14; ctx.strokeStyle = '#111'; ctx.stroke();
  line(ctx, -175, -120, 160, -120, 6);
  // front panel + headlight
  circle(ctx, 160, -150, 14); fs(ctx, '#fffbcc', 5);
  txt(ctx, 'AUTO', -105, -82, { size: 34, font: 'Bangers', fill: '#ffd23f', lw: 6 });
  wheel(ctx, -110, -26, 32, rot); wheel(ctx, 120, -26, 32, rot);
  ctx.restore();
}

export function heli(ctx, x, y, o = {}) {
  const s = o.s ?? 1, t = o.t || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face ?? 1), s);
  if (o.tilt) ctx.rotate(o.tilt);
  if (o.light) {
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fffbd0';
    ctx.beginPath(); ctx.moveTo(30, 40); ctx.lineTo(o.light[0] - 160, o.light[1]); ctx.lineTo(o.light[0] + 160, o.light[1]); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // tail
  ctx.beginPath(); ctx.moveTo(-60, -20); ctx.lineTo(-250, -40); ctx.lineTo(-250, -10); ctx.lineTo(-60, 20); ctx.closePath(); fs(ctx, '#1f3d99', 5);
  const tr = t * 40; line(ctx, -250 + Math.cos(tr) * 30, -25 + Math.sin(tr) * 30, -250 - Math.cos(tr) * 30, -25 - Math.sin(tr) * 30, 6, '#333');
  ell(ctx, 0, 0, 110, 62); fs(ctx, '#1f3d99', 6);
  ctx.beginPath(); ctx.ellipse(40, -8, 62, 44, 0, -1.4, 1.2); ctx.closePath(); fs(ctx, '#9be7ff', 5);
  ctx.fillStyle = '#fff'; ctx.fillRect(-100, 6, 120, 16);
  line(ctx, -60, 70, 60, 70, 7); line(ctx, -30, 55, -35, 70, 6); line(ctx, 30, 55, 35, 70, 6);
  line(ctx, 0, -62, 0, -80, 8);
  const bl = Math.abs(Math.cos(t * 50)) * 210 + 30;
  ell(ctx, 0, -82, bl, 8); fs(ctx, 'rgba(40,40,40,0.8)', 3);
  ctx.restore();
}

export function palm(ctx, x, y, o = {}) {
  const s = o.s ?? 1, t = o.t || 0, h = o.h ?? 420, sway = Math.sin(t * 1.3 + x * 0.01) * 0.05;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const lean = o.lean ?? 0.12;
  const tx = Math.sin(lean) * h, ty = -h;
  // trunk
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(tx * 0.2 - 14, ty * 0.5, tx - 9, ty); ctx.lineTo(tx + 9, ty); ctx.quadraticCurveTo(tx * 0.2 + 14, ty * 0.5, 18, 0); ctx.closePath();
  fs(ctx, o.dark ? o.dark : '#9c6b3e', o.dark ? 0 : 5);
  if (!o.dark) for (let i = 1; i < 9; i++) { const p = i / 9; const px = lerp(0, tx, p * p * 0.6 + p * 0.4), py = ty * p; line(ctx, px - 14 * (1 - p * 0.4), py, px + 14 * (1 - p * 0.4), py - 6, 3, '#6d4526'); }
  // fronds
  ctx.translate(tx, ty); ctx.rotate(sway);
  const leaves = [-2.9, -2.4, -1.9, -1.2, -0.7, -0.2, 0.3];
  for (const a0 of leaves) {
    const a = a0 + Math.sin(t * 2 + a0) * 0.04, L = 190;
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -50, L, 30); ctx.quadraticCurveTo(L * 0.5, -10, 0, 0);
    fs(ctx, o.dark ? o.dark : '#2bb24c', o.dark ? 0 : 5);
    if (!o.dark) { ctx.beginPath(); ctx.moveTo(10, -4); ctx.quadraticCurveTo(L * 0.5, -32, L - 10, 24); ctx.lineWidth = 3; ctx.strokeStyle = '#1b7a33'; ctx.stroke(); }
    ctx.restore();
  }
  if (!o.dark) for (const [cx, cy] of [[-10, 8], [10, 10], [0, 18]]) { circle(ctx, cx, cy, 12); fs(ctx, '#6d4526', 4); }
  ctx.restore();
}

export function ramp(ctx, x, y, o = {}) {
  const s = o.s ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(200, -160); ctx.lineTo(200, 0); ctx.closePath(); fs(ctx, '#f4a261', 6);
  for (let i = 0; i < 5; i++) line(ctx, -150 + i * 80, -20 - i * 32, -150 + i * 80, 0, 5, '#b5651d');
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.beginPath(); ctx.moveTo(-200 + i * 70, 0); ctx.lineTo(-170 + i * 70, 0); ctx.lineTo(-170 + i * 70 + 10, -8); ctx.lineTo(-200 + i * 70 + 10, -8); ctx.closePath(); fs(ctx, i % 2 ? '#111' : '#ffd23f', 0); ctx.restore(); }
  ctx.restore();
}

export function cone(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(-6, -70); ctx.lineTo(6, -70); ctx.lineTo(22, -6); ctx.closePath(); fs(ctx, '#ff7b00', 4);
  ctx.fillStyle = '#fff'; ctx.fillRect(-13, -45, 26, 10);
  rr(ctx, -30, -8, 60, 10, 3); fs(ctx, '#ff7b00', 4);
  ctx.restore();
}

export function streetLamp(ctx, x, y, o = {}) {
  const s = o.s ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, 0, 0, 0, -380, 12, '#3a3a4a'); line(ctx, 0, -380, 60, -395, 10, '#3a3a4a');
  rr(ctx, 40, -400, 50, 18, 6); fs(ctx, o.on ? '#fff3b0' : '#ddd', 4);
  if (o.on) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.moveTo(45, -385); ctx.lineTo(-60, 0); ctx.lineTo(200, 0); ctx.lineTo(85, -385); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
}

export function fruitCart(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -110, -110, 220, 60, 8); fs(ctx, '#8d5524', 5);
  const cols = ['#e63946', '#ffd23f', '#90be6d', '#f77f00'];
  for (let i = 0; i < 9; i++) { circle(ctx, -90 + i * 22, -118 - (i % 2) * 8, 14); fs(ctx, cols[i % 4], 3); }
  line(ctx, -100, -110, -100, -220, 6); line(ctx, 100, -110, 100, -220, 6);
  ctx.beginPath(); ctx.moveTo(-130, -220); ctx.lineTo(130, -220); ctx.lineTo(110, -250); ctx.lineTo(-110, -250); ctx.closePath(); fs(ctx, '#ff4fa3', 5);
  wheel(ctx, -60, -30, 28, 0); wheel(ctx, 60, -30, 28, 0);
  ctx.restore();
}

export function chappal(ctx, x, y, rot = 0, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ell(ctx, 0, 0, 46, 20); fs(ctx, '#3a86ff', 5);
  ell(ctx, 0, -4, 40, 15); fs(ctx, '#ffd23f', 0);
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.quadraticCurveTo(10, -36, 26, -8); ctx.lineWidth = 7; ctx.strokeStyle = '#e63946'; ctx.stroke();
  ctx.restore();
}

export function handbag(ctx, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = OUT; ctx.stroke();
  rr(ctx, -30, 0, 60, 46, 10); fs(ctx, '#ff4fa3', 5);
  circle(ctx, 0, 14, 6); fs(ctx, '#ffd23f', 3);
  ctx.restore();
}

export function megaphone(ctx, s = 1) {
  ctx.save(); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(40, -26); ctx.lineTo(40, 26); ctx.lineTo(-6, 10); ctx.closePath(); fs(ctx, '#f1f1f1', 4);
  ell(ctx, 40, 0, 8, 26); fs(ctx, '#e63946', 4);
  ctx.restore();
}

export function moneyBag(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-14, -50); ctx.quadraticCurveTo(-60, -10, -40, 20); ctx.quadraticCurveTo(0, 40, 40, 20); ctx.quadraticCurveTo(60, -10, 14, -50); ctx.closePath(); fs(ctx, '#d4b483', 5);
  txt(ctx, '₹', 0, 0, { size: 44, font: 'BalooX', fill: '#2d6a4f', lw: 0 });
  ctx.restore();
}

export function building(ctx, x, yb, w, h, col, seed, o = {}) {
  const R = rng(seed);
  rr(ctx, x, yb - h, w, h + 10, 6); fs(ctx, col, o.lw ?? 5);
  const cw = 26, chh = 34, gx = 18, gy = 22;
  const cols = Math.floor((w - 20) / (cw + gx)), rows = Math.floor((h - 40) / (chh + gy));
  const ox = x + (w - (cols * cw + (cols - 1) * gx)) / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lit = R() < (o.lit ?? 0.35);
    rr(ctx, ox + c * (cw + gx), yb - h + 30 + r * (chh + gy), cw, chh, 4);
    fs(ctx, lit ? (o.litC || '#ffe08a') : (o.winC || darken(col, 0.7)), 0);
  }
  if (o.sign) {
    rr(ctx, x + w * 0.1, yb - h - 50, w * 0.8, 46, 10); fs(ctx, o.signC || '#ff4fa3', 5);
    txt(ctx, o.sign, x + w / 2, yb - h - 26, { size: 32, font: 'Bangers', fill: '#fff', lw: 5 });
  }
}

export function cloud(ctx, x, y, s = 1, col = '#fff', a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(-60, 10, 40, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-15, -25, 50, Math.PI, 0); ctx.arc(45, -10, 45, Math.PI * 1.2, Math.PI * 0.1); ctx.arc(60, 25, 25, -Math.PI / 2, Math.PI / 2);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}

export function token(ctx, x, y, s, num) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(ctx, -60, -80, 120, 160, 8); fs(ctx, '#fffbe6', 5);
  txt(ctx, 'TOKEN', 0, -45, { size: 26, font: 'Bangers', fill: '#555', lw: 0 });
  txt(ctx, num, 0, 10, { size: 64, font: 'Lucky', fill: '#e63946', lw: 0 });
  for (let i = 0; i < 6; i++) line(ctx, -50 + i * 20, 70, -40 + i * 20, 80, 3, '#999');
  ctx.restore();
}
