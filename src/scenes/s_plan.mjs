// Scene: the master plan in the garage.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, dizzy, pow, starPath } from '../engine.mjs';
import { room } from '../bg.mjs';
import { wanted, money, minimap, chapterCard } from '../hud.mjs';

const GY = 900, DARK = 29.6;
const STEPS = [[5.2, 'STEP 1: Bank jao'], [8.5, 'STEP 2: Paisa lo'], [11.0, 'STEP 3: ???'], [11.6, 'STEP 4: PARTY!!!']];

function brickWall(ctx) {
  ctx.fillStyle = '#5a3d5c'; ctx.fillRect(0, 0, W, 800);
  for (let r = 0; r < 20; r++) for (let c = -1; c < 20; c++) {
    const x = c * 120 + (r % 2) * 60, y = r * 50;
    rr(ctx, x + 4, y + 4, 112, 42, 4); fs(ctx, (r + c) % 3 ? '#6b4a6e' : '#734f75', 0);
  }
}
function tyres(ctx, x, y) { for (let i = 0; i < 3; i++) { ell(ctx, x, y - i * 50, 110, 34); fs(ctx, '#222', 5); ell(ctx, x, y - i * 50 - 8, 50, 14); fs(ctx, '#111', 3); } }

export default {
  id: 'plan',
  dur: 38,
  fadeIn: 0.6, fadeOut: 1.0,
  music: [[0, DARK, 'sneaky', 0.38], [DARK + 1.4, 38, 'sneaky', 0.25]],
  sfx: [[0, 'crickets', { dur: 2, vol: 0.4 }], [5.2, 'marker'], [8.5, 'marker'], [11.0, 'marker'], [11.6, 'marker'], [12.0, 'tada'], [27.5, 'slap'], [29.2, 'snap'], [DARK, 'bonk', { vol: 1.2 }], [DARK + 0.1, 'glass']],
  lines: [
    { t: 2.0, who: 'bunty', text: 'Toh suno. Ye hai mera MASTER PLAN.', dur: 3.1 },
    { t: 5.6, who: 'bunty', text: 'Step 1: Bank jaayenge.', dur: 2.6 },
    { t: 8.7, who: 'bunty', text: 'Step 2: Paisa lenge.', dur: 2.3 },
    { t: 12.0, who: 'bunty', text: 'Aur Step 4... PARTYYYY!', style: 'shout', dur: 2.8 },
    { t: 15.0, who: 'chintu', text: 'Bhai... Step 3 kya hai?', dur: 2.8 },
    { t: 18.0, who: 'bunty', text: 'Wo... surprise hai.', dur: 2.2 },
    { t: 20.4, who: 'chintu', text: 'Aur agar pakde gaye toh? Escape plan kya hai?', dur: 3.2 },
    { t: 23.8, who: 'bunty', text: 'Escape plan ye hai ki... hum pakde hi NAHI jaayenge.', dur: 3.6 },
    { t: 31.4, who: 'chintu', text: '...plan toh solid hai bhai.', dur: 3.2, at: [1300, 560] },
  ],
  draw(ctx, t, S) {
    const dark = t > DARK;
    brickWall(ctx);
    ctx.fillStyle = '#3b3346'; ctx.fillRect(0, 800, W, H - 800); line(ctx, 0, 800, W, 800, 5);
    // whiteboard
    const wbx = 980, wby = 170, wbw = 860, wbh = 560;
    rr(ctx, wbx - 16, wby - 16, wbw + 32, wbh + 32, 12); fs(ctx, '#9aa0a6', 6);
    rr(ctx, wbx, wby, wbw, wbh, 6); fs(ctx, '#fbfbf7', 4);
    line(ctx, wbx + 200, wby + wbh + 16, wbx + 140, GY + 40, 10, '#666'); line(ctx, wbx + wbw - 200, wby + wbh + 16, wbx + wbw - 140, GY + 40, 10, '#666');
    STEPS.forEach(([st, s], i) => {
      const p = clamp((t - st) / 0.5);
      if (p <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(wbx, wby + 40 + i * 125, 60 + p * 820, 120); ctx.clip();
      const col = i === 2 ? '#e63946' : i === 3 ? '#2a9d8f' : '#1d3557';
      txt(ctx, s, wbx + 50, wby + 100 + i * 125, { size: i === 3 ? 76 : 68, font: 'Bangers', align: 'left', fill: col, lw: 0 });
      if (i === 0) { circle(ctx, wbx + 640, wby + 90, 22); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke(); line(ctx, wbx + 640, wby + 112, wbx + 640, wby + 150, 5, col); rr(ctx, wbx + 690, wby + 60, 120, 90, 4); ctx.stroke(); txt(ctx, 'BANK', wbx + 750, wby + 105, { size: 30, font: 'Bangers', fill: col, lw: 0 }); }
      if (i === 1) { txt(ctx, '₹₹₹', wbx + 700, wby + 225, { size: 70, font: 'BalooX', fill: '#2d6a4f', lw: 0 }); }
      if (i === 3) { starPath(ctx, wbx + 700, wby + 470, 40, 18); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke(); starPath(ctx, wbx + 790, wby + 450, 28, 12); ctx.stroke(); }
      ctx.restore();
    });
    tyres(ctx, 430, GY + 20);
    // characters
    const bArms = t < 12 ? (t > 5 ? 'point' : 'hips') : t < 15 ? 'cheer' : t < 18 ? 'idle' : t < 20.4 ? 'shrug' : t < 23.8 ? 'idle' : 'pointUp';
    const bExpr = t < 12 ? 'smug' : t < 15 ? 'laugh' : t < 18 ? 'shock' : 'smug';
    const cArms = t > 27.5 && t < DARK ? 'facepalm' : t > 15 && t < 17.8 ? 'think' : t > 20.4 && t < 23.6 ? 'shrug' : 'idle';
    const cExpr = t > 27.5 ? 'bored' : t > 15 ? 'worried' : 'normal';
    S.c(ctx, 'chintu', { x: 430, y: GY - 112, s: 1.35, legs: 'sit', arms: cArms, expr: cExpr });
    const bx = keys(t, [[0, 1150], [4.8, 1150], [5.4, 800], [24, 800]], ease.inOut);
    const pointer = c => { line(c, 0, 0, 120, -60, 7, '#8d6e63'); };
    S.c(ctx, 'bunty', { x: bx, y: GY, s: 1.35, face: t > 15 && t < 27.5 ? -1 : 1, arms: bArms, expr: dark ? 'dead' : bExpr, prop: t < 12 && t > 5 ? pointer : null, walk: t > 4.8 && t < 5.4 ? t * 10 : undefined });
    if (t > 23.8 && t < 27.4) { const R = rng(Math.floor(t * 4)); for (let i = 0; i < 2; i++) { starPath(ctx, bx - 40 + R() * 60, GY - 395 + R() * 20, 20, 5, 4, 0); fs(ctx, '#fff', 0); } }
    // hanging bulb
    const swing = Math.sin(t * 1.4) * 0.18;
    const bulbFall = t > 29.2 ? Math.min(1, (t - 29.2) / 0.4) : 0;
    const ax = 760, ay = 0, L = 300;
    const bxp = ax + Math.sin(swing) * L, byp = ay + Math.cos(swing) * L;
    const fallX = lerp(bxp, bx - 10, ease.in(bulbFall)), fallY = lerp(byp, GY - 380, ease.in(bulbFall));
    if (!dark) {
      // light cone
      ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.moveTo(fallX - 20, fallY); ctx.lineTo(fallX - 520, H); ctx.lineTo(fallX + 520, H); ctx.lineTo(fallX + 20, fallY); ctx.closePath(); ctx.fill(); ctx.restore();
      if (bulbFall === 0) line(ctx, ax, ay, bxp, byp - 30, 4, '#222'); else line(ctx, ax, ay, ax + 20, ay + 120, 4, '#222');
      rr(ctx, fallX - 14, fallY - 34, 28, 26, 4); fs(ctx, '#777', 4);
      circle(ctx, fallX, fallY, 30); fs(ctx, '#fff3b0', 5);
    }
    if (dark) {
      ctx.fillStyle = 'rgba(5,0,15,0.93)'; ctx.fillRect(0, 0, W, H);
      // eyes in the dark
      const blink = (t % 2.4) < 0.12;
      for (const [x, y] of [[438, GY - 400], [476, GY - 400]]) { ell(ctx, x, y, 12, blink ? 1 : 15); fs(ctx, '#fff', 0); }
      dizzy(ctx, bx, GY - 430, t, 1.2);
      if (t < DARK + 0.6) pow(ctx, bx + 40, GY - 420, 'BONK!', t - DARK, 1.0, '#ffd23f', 2);
    }
  },
  post(ctx, t) { chapterCard(ctx, 'CHAPTER 3', 'Master Plan', t - 0.6, 3.0); },
};
