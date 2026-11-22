// Backgrounds: skies, skyline parallax, streets, beach, interiors.
import { OUT, TAU, W, H, clamp, lerp, rr, circle, ell, fs, line, rng, starPath, txt, vgrad, noise } from './engine.mjs';
import { palm, building, cloud, streetLamp } from './props.mjs';
import { darken } from './characters.mjs';

export const SKY = {
  day: ['#3fa7ff', '#7fd0ff', '#c8f0ff'],
  sunset: ['#2b1055', '#7b2c91', '#e0447d', '#ff9e5e', '#ffd479'],
  night: ['#05021a', '#180a45', '#3a0ca3'],
  dusk: ['#1d0b3d', '#5a189a', '#c9184a', '#ff8e3c'],
};

export function sky(ctx, t, kind = 'day', o = {}) {
  const hz = o.horizon ?? 720;
  ctx.fillStyle = vgrad(ctx, 0, hz, SKY[kind]); ctx.fillRect(-W, -H, 3 * W, hz + H + 400);
  if (kind === 'night') {
    const R = rng(77);
    for (let i = 0; i < 120; i++) { const x = R() * W, y = R() * hz * 0.8, tw = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.globalAlpha = 0.4 + 0.6 * tw; circle(ctx, x, y, 1 + R() * 2.2); ctx.fillStyle = '#fff'; ctx.fill(); }
    ctx.globalAlpha = 1;
    circle(ctx, o.moonX ?? 1550, o.moonY ?? 190, 70); fs(ctx, '#fff6d6', 0);
    circle(ctx, (o.moonX ?? 1550) + 30, (o.moonY ?? 190) - 20, 62); ctx.fillStyle = SKY.night[0]; ctx.globalAlpha = 0.0; ctx.fill(); ctx.globalAlpha = 1;
    circle(ctx, (o.moonX ?? 1550) - 20, (o.moonY ?? 190) + 15, 12); fs(ctx, '#efe2b8', 0);
    return;
  }
  if (kind === 'sunset' || kind === 'dusk') {
    // retro striped sun
    const sx = o.sunX ?? W / 2, sy = o.sunY ?? hz - 120, r = o.sunR ?? 230;
    ctx.save(); circle(ctx, sx, sy, r); ctx.clip();
    ctx.fillStyle = vgrad(ctx, sy - r, sy + r, ['#fff36b', '#ffb347', '#ff4f8b']); ctx.fillRect(sx - r, sy - r, 2 * r, 2 * r);
    ctx.fillStyle = SKY[kind][3];
    for (let i = 0; i < 7; i++) { const yy = sy + 10 + i * 30, hh = 4 + i * 3.2; ctx.fillRect(sx - r, yy, 2 * r, hh); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.25; circle(ctx, sx, sy, r * 1.25); ctx.fillStyle = '#ffd479'; ctx.fill(); ctx.restore();
  } else {
    circle(ctx, o.sunX ?? 1650, o.sunY ?? 150, 80); fs(ctx, '#fff3a3', 0);
    ctx.save(); ctx.globalAlpha = 0.3; circle(ctx, o.sunX ?? 1650, o.sunY ?? 150, 120); ctx.fillStyle = '#fffbd0'; ctx.fill(); ctx.restore();
  }
  // clouds
  const cc = kind === 'day' ? '#ffffff' : '#ffb3c7';
  const camX = o.camX || 0;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 420 - camX * 0.05 + t * 12) % (W + 600) + W + 600) % (W + 600) - 300;
    cloud(ctx, x, 110 + (i % 3) * 90, 0.9 + (i % 2) * 0.5, cc, kind === 'day' ? 0.95 : 0.55);
  }
}

// infinite parallax skyline. camX world scroll.
const FAR = ['#5b2a86', '#6c2c91', '#4a1f73'];
export function skyline(ctx, camX, hz, t, o = {}) {
  const night = o.night;
  // far layer
  const f1 = 0.12, sp1 = 150;
  const start1 = Math.floor((camX * f1 - 600) / sp1), end1 = start1 + Math.ceil((W + 1200) / sp1) + 2;
  for (let i = start1; i < end1; i++) {
    const R = rng(i * 13 + 5), h = 160 + R() * 260, w = 110 + R() * 70;
    const x = i * sp1 - camX * f1;
    rr(ctx, x, hz - h, w, h + 20, 4); fs(ctx, night ? '#1d1145' : (o.farC || FAR[Math.abs(i) % 3]), 0);
    if (R() < 0.3) { line(ctx, x + w / 2, hz - h, x + w / 2, hz - h - 50, 4, night ? '#1d1145' : FAR[0]); circle(ctx, x + w / 2, hz - h - 52, 5); fs(ctx, '#ff3b6b', 0); }
    if (night) { const R2 = rng(i * 7); for (let k = 0; k < 10; k++) { if (R2() < 0.5) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 10 + R2() * (w - 25), hz - h + 15 + R2() * (h - 30), 8, 10); } } }
  }
  // mid layer
  const f2 = 0.3, sp2 = 260;
  const start2 = Math.floor((camX * f2 - 700) / sp2), end2 = start2 + Math.ceil((W + 1400) / sp2) + 2;
  const mids = o.midC || ['#ff6f91', '#845ec2', '#00c9a7', '#ffc75f', '#4b4453', '#f9f871'];
  for (let i = start2; i < end2; i++) {
    const R = rng(i * 31 + 9), h = 200 + R() * 240, w = 170 + R() * 60;
    const x = i * sp2 - camX * f2;
    const col = night ? darken(mids[Math.abs(i) % mids.length], 0.35) : mids[Math.abs(i) % mids.length];
    building(ctx, x, hz + 20, w, h, col, i * 3 + 1, { lit: night ? 0.55 : 0.12, lw: 4, winC: night ? '#1a1033' : undefined });
  }
  if (o.palms !== false) {
    const f3 = 0.45, sp3 = 330;
    const s3 = Math.floor((camX * f3 - 700) / sp3), e3 = s3 + Math.ceil((W + 1400) / sp3) + 2;
    for (let i = s3; i < e3; i++) {
      const R = rng(i * 17 + 3);
      palm(ctx, i * sp3 - camX * f3 + R() * 80, hz + 30, { s: 0.55 + R() * 0.2, t, dark: night ? '#120a2a' : '#3b1c5a', h: 380, lean: (R() - 0.5) * 0.4 });
    }
  }
}

// street: sidewalk + road. groundY = sidewalk top where people stand.
export function street(ctx, camX, t, o = {}) {
  const gy = o.groundY ?? 820;
  const night = o.night;
  // sidewalk
  ctx.fillStyle = night ? '#3d3456' : '#e8d9c0'; ctx.fillRect(-W, gy - 40, 3 * W, 120);
  const tile = 120, off = ((camX % tile) + tile) % tile;
  for (let x = -off - 480; x < W + tile + 480; x += tile) line(ctx, x, gy - 40, x - 30, gy + 80, 3, night ? '#2c2540' : '#cbb995');
  ctx.fillStyle = night ? '#2a2340' : '#bfae8f'; ctx.fillRect(-W, gy + 70, 3 * W, 18);
  // road
  ctx.fillStyle = night ? '#1d1a2b' : '#3b3b4f'; ctx.fillRect(-W, gy + 88, 3 * W, H - gy + 400);
  const dash = 220, doff = ((camX % dash) + dash) % dash;
  for (let x = -doff - 440; x < W + dash + 440; x += dash) { rr(ctx, x, gy + 88 + (H - gy - 88) / 2 - 6, 120, 12, 6); fs(ctx, '#ffd23f', 0); }
  line(ctx, 0, gy + 40, W, gy + 40, 0.01);
}

export function shopsRow(ctx, camX, gy, t, o = {}) {
  // foreground storefronts that scroll at 1:1
  const sp = 520;
  const s = Math.floor((camX - 600) / sp), e = s + Math.ceil((W + 1200) / sp) + 1;
  const names = o.names || ['SWEETS', 'CHAI', 'PHONE', 'SALON', 'PIZZA', 'GYM'];
  const cols = ['#ff8fab', '#7bdff2', '#b8f2e6', '#ffd6a5', '#cdb4db', '#fdffb6'];
  for (let i = s; i < e; i++) {
    const x = i * sp - camX;
    const col = cols[((i % 6) + 6) % 6];
    rr(ctx, x, gy - 480, sp - 30, 450, 8); fs(ctx, o.night ? darken(col, 0.45) : col, 5);
    rr(ctx, x + 40, gy - 260, sp - 110, 230, 6); fs(ctx, o.night ? '#ffe7a0' : '#9be7ff', 5);
    // awning
    ctx.save(); rr(ctx, x + 20, gy - 330, sp - 70, 60, 10); ctx.clip();
    for (let k = 0; k < 10; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#e63946'; ctx.fillRect(x + 20 + k * 50, gy - 330, 50, 60); }
    ctx.restore(); rr(ctx, x + 20, gy - 330, sp - 70, 60, 10); fs(ctx, null, 5);
    rr(ctx, x + 70, gy - 440, sp - 170, 70, 12); fs(ctx, '#1b1030', 0);
    txt(ctx, names[((i % names.length) + names.length) % names.length], x + (sp - 30) / 2, gy - 404, { size: 46, font: 'Bangers', fill: col, lw: 0 });
  }
}

export function sea(ctx, t, hz, sandY) {
  ctx.fillStyle = vgrad(ctx, hz, sandY, ['#1ea5d6', '#38c9e8', '#7ee8f5']); ctx.fillRect(0, hz, W, sandY - hz);
  for (let r = 0; r < 6; r++) {
    const y = hz + 20 + r * ((sandY - hz) / 6);
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.02 + t * 2 + r) * 4);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke();
  }
  // foam edge
  ctx.beginPath(); ctx.moveTo(0, sandY);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, sandY - 10 + Math.sin(x * 0.015 + t * 1.6) * 8);
  ctx.lineTo(W, sandY + 30); ctx.lineTo(0, sandY + 30); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
}

export function sand(ctx, y) {
  ctx.fillStyle = vgrad(ctx, y, H, ['#f7d9a0', '#eec27a']); ctx.fillRect(0, y, W, H - y);
  const R = rng(4);
  for (let i = 0; i < 70; i++) { circle(ctx, R() * W, y + 20 + R() * (H - y), 2 + R() * 3); fs(ctx, '#d9a95c', 0); }
}

export function umbrella(ctx, x, y, s = 1, col = '#ff4fa3') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, 0, 0, 10, -260, 8, '#ddd');
  ctx.beginPath(); ctx.moveTo(-170, -240); ctx.quadraticCurveTo(10, -380, 190, -240); ctx.closePath();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : col; ctx.beginPath(); ctx.moveTo(10, -330); ctx.lineTo(-170 + i * 45, -240); ctx.lineTo(-125 + i * 45, -240); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-170, -240); ctx.quadraticCurveTo(10, -380, 190, -240); ctx.closePath(); fs(ctx, null, 5);
  ctx.restore();
}

// generic interior wall + floor
export function room(ctx, o = {}) {
  const fy = o.floorY ?? 800;
  ctx.fillStyle = o.wall || '#f2e8cf'; ctx.fillRect(0, 0, W, fy);
  if (o.stripes) { ctx.fillStyle = o.stripes; for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 40, fy); }
  ctx.fillStyle = o.trim || '#8d6e63'; ctx.fillRect(0, fy - 30, W, 30);
  ctx.fillStyle = o.floor || '#c9b79c'; ctx.fillRect(0, fy, W, H - fy);
  if (o.tiles) {
    for (let x = -200; x < W + 200; x += 160) line(ctx, x, fy, x + (x - W / 2) * 0.6, H, 3, o.tiles);
    for (let y = fy + 40, k = 1; y < H; y += 40 * k, k += 0.4) line(ctx, 0, y, W, y, 3, o.tiles);
  }
  line(ctx, 0, fy, W, fy, 5);
}

export function wallClock(ctx, x, y, r, hours, o = {}) {
  circle(ctx, x, y, r); fs(ctx, '#fff', 7);
  for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12; line(ctx, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, 5); }
  const ha = (hours / 12) * TAU - Math.PI / 2, ma = (hours % 1) * TAU - Math.PI / 2;
  line(ctx, x, y, x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5, 9);
  line(ctx, x, y, x + Math.cos(ma) * r * 0.75, y + Math.sin(ma) * r * 0.75, 6, '#e63946');
  circle(ctx, x, y, 8); fs(ctx, OUT, 0);
}
