// Game-style HUD (original design): wanted stars, money, minimap, mission banners.
import { OUT, TAU, W, H, clamp, lerp, ease, rr, circle, ell, fs, line, starPath, txt, rng, prog } from './engine.mjs';

export function wanted(ctx, n, t, changedAt = -99) {
  const x0 = W - 80, y = 72;
  for (let i = 0; i < 5; i++) {
    const x = x0 - (4 - i) * 74;
    const filled = i < n;
    const isNew = filled && i === n - 1 && t - changedAt < 1.5 && t >= changedAt;
    let sc = 1;
    if (isNew) sc = 1 + 0.6 * Math.max(0, 1 - (t - changedAt) / 0.4) + (Math.floor((t - changedAt) * 8) % 2 ? 0.08 : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    starPath(ctx, 0, 0, 32, 14);
    if (filled) {
      const flash = isNew && Math.floor((t - changedAt) * 10) % 2;
      fs(ctx, flash ? '#ffffff' : '#ffd23f', 6);
    } else { ctx.globalAlpha = 0.55; fs(ctx, 'rgba(20,10,40,0.6)', 5, '#ffffff'); }
    ctx.restore();
  }
}

export function money(ctx, amount, t = 0, changedAt = -99) {
  const pulse = t - changedAt < 0.6 && t >= changedAt ? 1 + 0.25 * (1 - (t - changedAt) / 0.6) : 1;
  ctx.save(); ctx.translate(W - 60, 150); ctx.scale(pulse, pulse);
  txt(ctx, '₹' + Math.round(amount).toLocaleString('en-IN'), 0, 0, { size: 64, font: 'BalooX', fill: '#7dff6a', align: 'right', lw: 12 });
  ctx.restore();
}

export function minimap(ctx, t, o = {}) {
  const cx = 175, cy = H - 175, r = 120;
  ctx.save();
  circle(ctx, cx, cy, r + 10); fs(ctx, 'rgba(20,10,40,0.75)', 0);
  circle(ctx, cx, cy, r); ctx.clip();
  ctx.fillStyle = o.night ? '#1d3b4a' : '#4fa3a5'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  ctx.translate(cx, cy); ctx.rotate(o.heading || 0);
  const sc = (o.scroll ?? t * 30) % 90;
  for (let k = -3; k <= 3; k++) {
    line(ctx, -200, k * 90 + sc, 200, k * 90 + sc, 14, '#d8eef0');
    line(ctx, k * 90 + 20, -200, k * 90 + 20, 200, 10, '#d8eef0');
  }
  ctx.fillStyle = '#7bc96f'; ctx.fillRect(30, 30 + sc - 90, 50, 50);
  if (o.cops) {
    for (let i = 0; i < o.cops; i++) {
      const a = t * 0.8 + i * 2.1, d = 50 + 20 * Math.sin(t + i);
      circle(ctx, Math.cos(a) * d, Math.sin(a) * d, 9); fs(ctx, Math.floor(t * 6 + i) % 2 ? '#ff2e4d' : '#3aa0ff', 3, '#fff');
    }
  }
  if (o.target) { circle(ctx, o.target[0], o.target[1], 10); fs(ctx, '#ffd23f', 3); }
  ctx.restore();
  // player arrow
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(13, 14); ctx.lineTo(0, 7); ctx.lineTo(-13, 14); ctx.closePath(); fs(ctx, '#ff4fa3', 4, '#fff');
  ctx.restore();
  circle(ctx, cx, cy, r); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
  txt(ctx, 'N', cx, cy - r - 2, { size: 30, font: 'Bangers', fill: '#fff' });
}

// mission banner, lifecycle p (seconds since start), dur visible
export function missionBanner(ctx, label, text, age, dur = 4) {
  if (age < 0 || age > dur) return;
  const pin = ease.back(clamp(age / 0.45)), pout = ease.in(clamp((age - dur + 0.4) / 0.4));
  const x = lerp(-900, 60, pin) - pout * 1000;
  ctx.save(); ctx.translate(x, 60);
  ctx.font = '58px Lucky';
  const w = Math.max(560, ctx.measureText(text).width + 80);
  rr(ctx, 0, 0, w, 150, 18); fs(ctx, 'rgba(27,16,48,0.88)', 6, '#ff4fa3');
  rr(ctx, 24, -22, 250, 46, 12); fs(ctx, '#ff4fa3', 5);
  txt(ctx, label, 149, 2, { size: 34, font: 'Bangers', fill: '#fff', lw: 0 });
  txt(ctx, text, 40, 90, { size: 58, align: 'left', fill: '#ffd23f', lw: 0 });
  ctx.restore();
}

export function popup(ctx, text, age, dur = 2.6, color = '#ff2e4d') {
  if (age < 0 || age > dur) return;
  const pin = ease.back(clamp(age / 0.3)), pout = clamp((age - dur + 0.3) / 0.3);
  ctx.save(); ctx.translate(W / 2, 250 - pout * 40); ctx.globalAlpha = 1 - pout; ctx.scale(pin, pin);
  ctx.font = '44px BalooX';
  const w = ctx.measureText(text).width + 90;
  rr(ctx, -w / 2, -40, w, 80, 40); fs(ctx, color, 6, '#fff');
  txt(ctx, text, 0, 4, { size: 44, font: 'BalooX', fill: '#fff', lw: 8 });
  ctx.restore();
}

export function bigCenter(ctx, title, sub, age, o = {}) {
  if (age < 0) return;
  const p = ease.back(clamp(age / 0.5));
  ctx.save(); ctx.translate(W / 2, o.y ?? H / 2 - 40);
  ctx.scale(lerp(2.2, 1, p), lerp(2.2, 1, p)); ctx.globalAlpha = clamp(age / 0.25);
  // band
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-W, -110, W * 2, 220);
  txt(ctx, title, 0, -10, { size: o.size || 150, fill: o.color || '#ff3355', lw: 22, shadow: 'rgba(0,0,0,0.6)' });
  if (sub) txt(ctx, sub, 0, 85, { size: 50, font: 'BalooX', fill: '#fff', lw: 10 });
  ctx.restore();
}

export function speedo(ctx, kmh, label = 'km/h') {
  const cx = W - 170, cy = H - 150, r = 105;
  circle(ctx, cx, cy, r); fs(ctx, 'rgba(20,10,40,0.75)', 6, '#fff');
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  ctx.beginPath(); ctx.arc(cx, cy, r - 16, a0, a1); ctx.lineWidth = 10; ctx.strokeStyle = '#5a4a7a'; ctx.stroke();
  const f = clamp(kmh / 200);
  ctx.beginPath(); ctx.arc(cx, cy, r - 16, a0, lerp(a0, a1, f)); ctx.strokeStyle = f > 0.7 ? '#ff2e4d' : '#1dd3b0'; ctx.stroke();
  txt(ctx, String(Math.round(kmh)), cx, cy - 4, { size: 60, font: 'Lucky', fill: '#fff', lw: 8 });
  txt(ctx, label, cx, cy + 46, { size: 26, font: 'BalooB', fill: '#ddd', lw: 0 });
}

export function healthBar(ctx, hp) {
  const x = 60, y = H - 330 - 20;
  rr(ctx, x + 50, y, 240, 24, 12); fs(ctx, 'rgba(20,10,40,0.75)', 4, '#fff');
  rr(ctx, x + 54, y + 4, 232 * clamp(hp), 16, 8); fs(ctx, hp < 0.3 ? '#ff2e4d' : '#5cff7a', 0);
}

export function chapterCard(ctx, num, title, age, dur = 2.4) {
  if (age < 0 || age > dur) return;
  const pin = ease.out(clamp(age / 0.35)), pout = ease.in(clamp((age - dur + 0.35) / 0.35));
  ctx.save();
  ctx.globalAlpha = 1 - pout;
  ctx.font = '60px Lucky';
  const w = Math.max(ctx.measureText(title).width, 380) + 80;
  ctx.translate(lerp(-w - 60, 50, pin), 60);
  rr(ctx, 0, 0, w, 130, 16); fs(ctx, 'rgba(27,16,48,0.9)', 6, '#1dd3b0');
  txt(ctx, num, 40, 34, { size: 32, font: 'Bangers', fill: '#1dd3b0', align: 'left', lw: 0 });
  txt(ctx, title, 40, 86, { size: 60, align: 'left', fill: '#fff', lw: 0 });
  ctx.restore();
}
