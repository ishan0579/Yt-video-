// Cold open (freeze-frame), title card, loading screen.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, vgrad, circle, rng, sparkle, starPath, iris, fadeRect, wrap, hLines } from '../engine.mjs';
import { sky, skyline, street } from '../bg.mjs';
import { car, palm } from '../props.mjs';
import { wanted, money, minimap } from '../hud.mjs';
import { makeS } from '../kit.mjs';
import { drawAutoChase } from './s_auto.mjs';

// ---------------- COLD OPEN ----------------
const FREEZE = 4.8, REW = 9.4;
export const coldOpen = {
  id: 'coldopen',
  dur: 11,
  fadeIn: 0, fadeOut: 0,
  music: [[0, FREEZE, 'chase', 0.6]],
  sfx: [[0, 'siren', { dur: FREEZE, vol: 0.3 }], [0, 'engine', { dur: FREEZE, vol: 0.25 }], [3.0, 'explosion'], [FREEZE, 'scratch', { vol: 1.1 }], [REW, 'rewind', { dur: 1.6 }]],
  lines: [
    { t: 1.0, who: 'chintu', text: 'BHAAAAI!!', hi: 'भाईईई!!', style: 'shout', dur: 1.6 },
    { t: 5.1, who: 'bunty', text: 'Haan bhai, ye main hoon. Soch rahe hoge... yahan tak pahuncha kaise?', hi: 'हाँ भाई, ये मैं हूँ। सोच रहे होगे... यहाँ तक पहुँचा कैसे?', dur: 4.2 },
  ],
  draw(ctx, t, S) {
    if (t < FREEZE) {
      drawAutoChase(ctx, t, S, { worldT: 12 + t, scared: true });
      return;
    }
    if (t < REW) {
      const p = ease.inOut(clamp((t - FREEZE) / 3.5));
      const FS = makeS(this, FREEZE - 0.01);
      FS.lines = []; FS.mouth = () => 0; FS.talk = () => false;
      ctx.save();
      ctx.translate(960, 800); ctx.scale(1 + p * 0.45, 1 + p * 0.45); ctx.translate(-960, -800);
      drawAutoChase(ctx, FREEZE - 0.01, FS, { worldT: 12 + FREEZE, noHud: true, noSpeed: true, scared: false, buntyExpr: 'smug', shake: 0 });
      ctx.restore();
      const m = ctx.getTransform();
      if (FS.anchors.bunty) {
        const a = FS.anchors.bunty;
        const z = 1 + p * 0.45;
        S.anchors.bunty = [(a[0] - 960) * z + 960, (a[1] - 800) * z + 800];
      }
      // desaturate + warm tint
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = 0.85; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.fillStyle = 'rgba(255,190,120,0.12)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      txt(ctx, 'FREEZE FRAME', 80, 80, { size: 44, font: 'Bangers', align: 'left', fill: '#fff', lw: 8 });
      return;
    }
    // rewind
    const rt = t - REW;
    drawAutoChase(ctx, t, S, { worldT: 12 + FREEZE - rt * 5, noHud: true, scared: true });
    ctx.save(); ctx.fillStyle = 'rgba(40,60,160,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const R = rng(Math.floor(t * 30));
    for (let i = 0; i < 6; i++) { const y = R() * H; ctx.fillStyle = `rgba(255,255,255,${0.15 + R() * 0.3})`; ctx.fillRect(0, y, W, 4 + R() * 30); }
    if (Math.floor(t * 4) % 2 === 0) {
      for (const ox of [80, 140]) { ctx.beginPath(); ctx.moveTo(ox + 60, 50); ctx.lineTo(ox, 90); ctx.lineTo(ox + 60, 130); ctx.closePath(); fs(ctx, '#fff', 6); }
      txt(ctx, 'REWIND', 230, 92, { size: 70, font: 'Lucky', align: 'left', fill: '#fff', lw: 10 });
    }
  },
  post(ctx, t) {
    if (t > 10.5) fadeRect(ctx, (t - 10.5) / 0.5, '#fff');
  },
};

// ---------------- TITLE ----------------
function logo(ctx, t, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const a1 = ease.back(clamp((t - 0.8) / 0.5)), a2 = ease.back(clamp((t - 1.25) / 0.5)), a3 = ease.back(clamp((t - 1.0) / 0.4));
  // glow
  ctx.save(); ctx.globalAlpha = 0.35 * clamp((t - 0.8) / 0.6);
  const g = ctx.createRadialGradient(0, 0, 50, 0, 0, 620); g.addColorStop(0, '#ffd479'); g.addColorStop(1, 'rgba(255,212,121,0)');
  ctx.fillStyle = g; ctx.fillRect(-700, -400, 1400, 800); ctx.restore();
  if (a1 > 0) { ctx.save(); ctx.translate(0, -150); ctx.rotate(-0.05 + Math.sin(t * 2) * 0.012); ctx.scale(a1, a1); txt(ctx, 'BUNTY', 0, 0, { size: 200, fill: '#ff4fa3', lw: 30, shadow: '#1b1030' }); ctx.restore(); }
  if (a2 > 0) { ctx.save(); ctx.translate(0, 150); ctx.rotate(0.04 + Math.sin(t * 2 + 1) * 0.012); ctx.scale(a2, a2); txt(ctx, 'CHINTU', 0, 0, { size: 200, fill: '#ffd23f', lw: 30, shadow: '#1b1030' }); ctx.restore(); }
  if (a3 > 0) { ctx.save(); ctx.translate(0, 0); ctx.scale(a3, a3); circle(ctx, 0, 0, 52); fs(ctx, '#1dd3b0', 8); txt(ctx, '&', 0, 8, { size: 80, fill: '#fff', lw: 10 }); ctx.restore(); }
  const a4 = ease.out(clamp((t - 2.0) / 0.5));
  if (a4 > 0) {
    ctx.save(); ctx.translate(0, 290); ctx.scale(a4, 1);
    ctx.beginPath(); ctx.moveTo(-380, -40); ctx.lineTo(380, -40); ctx.lineTo(350, 0); ctx.lineTo(380, 40); ctx.lineTo(-380, 40); ctx.lineTo(-350, 0); ctx.closePath(); fs(ctx, '#1dd3b0', 8);
    txt(ctx, 'PALM BAY CITY', 0, 4, { size: 62, font: 'Lucky', fill: '#fff', lw: 10 });
    ctx.restore();
  }
  ctx.restore();
}
export const title = {
  id: 'title',
  dur: 9,
  fadeIn: 0.5, fadeOut: 0,
  music: [[0, 9, 'title', 0.75]],
  sfx: [[0.8, 'whoosh'], [0.9, 'boom'], [1.25, 'whoosh'], [1.35, 'boom'], [2.0, 'sparkle'], [8.4, 'whoosh']],
  lines: [],
  draw(ctx, t, S) {
    const camX = t * 160;
    sky(ctx, t, 'sunset', { horizon: 680, camX, sunY: 520, sunR: 260 });
    skyline(ctx, camX, 680, t);
    street(ctx, camX, t, { groundY: 840 });
    car(ctx, lerp(-400, W + 500, prog(1.5, 4.5, t)), 1040, { color: '#4cc9f0', s: 0.85, wheelRot: t * 20 });
    car(ctx, lerp(W + 400, -500, prog(4.5, 7.5, t)), 1060, { color: '#f9c74f', s: 0.9, face: -1, wheelRot: -t * 20 });
    const bp = ease.back(clamp((t - 2.6) / 0.6)), cp = ease.back(clamp((t - 3.0) / 0.6));
    S.c(ctx, 'bunty', { x: lerp(-200, 300, bp), y: 880, s: 1.25, arms: 'point', expr: 'smug', noAnchor: true });
    S.c(ctx, 'chintu', { x: lerp(W + 200, 1620, cp), y: 880, s: 1.25, face: -1, arms: 'wave', expr: 'laugh', noAnchor: true });
    logo(ctx, t, W / 2, 360, 1);
    const tp = clamp((t - 2.8) / 0.4);
    if (tp > 0) { ctx.save(); ctx.globalAlpha = tp; txt(ctx, 'Ek Open-World Comedy', W / 2, 740, { size: 48, font: 'BalooX', fill: '#fff', lw: 10 }); ctx.restore(); }
    const R = rng(3);
    for (let i = 0; i < 14; i++) {
      const x = W / 2 + (R() - 0.5) * 1200, y = 380 + (R() - 0.5) * 560, ph = R() * 6;
      const a = Math.max(0, Math.sin(t * 3 + ph)) * clamp((t - 1.8) / 0.5);
      sparkle(ctx, x, y, 18 + R() * 14, a);
    }
  },
  post(ctx, t) { if (t > 8.5) fadeRect(ctx, (t - 8.5) / 0.5, '#fff'); },
};

// ---------------- LOADING ----------------
const TIPS = [
  [0, 'Police se bachne ka best tareeka... police ke saath hi bhaago.'],
  [3.6, 'Health kam hai? Mummy ke haath ka khana khao. Full health.'],
  [7.0, 'Ye loading screen kabhi khatam nahi hogi. Kabhi nahi.'],
];
export const loading = {
  id: 'loading',
  dur: 11,
  fadeIn: 0.4, fadeOut: 0,
  music: [[0, 11, 'loading', 0.5]],
  sfx: [[8.3, 'grunt'], [9.0, 'push'], [9.6, 'ding'], [10.2, 'whoosh']],
  lines: [
    { t: 8.2, who: 'chintu', text: 'Hatt! Chal na yaar!', hi: 'हट! चल ना यार!', dur: 1.7 },
  ],
  draw(ctx, t, S) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    // poster panel
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1180, 0); ctx.lineTo(1000, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
    ctx.fillStyle = vgrad(ctx, 0, H, ['#2b1055', '#e0447d', '#ffb347']); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff';
    for (let i = -10; i < 30; i++) { ctx.beginPath(); ctx.moveTo(i * 90 + t * 30, 0); ctx.lineTo(i * 90 + 40 + t * 30, 0); ctx.lineTo(i * 90 - 360 + t * 30, H); ctx.lineTo(i * 90 - 400 + t * 30, H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    circle(ctx, 560, 520, 330); ctx.fillStyle = '#ffd479'; ctx.fill();
    palm(ctx, 140, 1100, { s: 1.6, t, dark: '#3b1c5a', h: 520 });
    palm(ctx, 960, 1120, { s: 1.4, t, dark: '#3b1c5a', h: 500, lean: -0.25 });
    S.c(ctx, 'chintu', { x: 820, y: 1160, s: 2.6, arms: 'flail', expr: 'scared', face: -1, noAnchor: true });
    S.c(ctx, 'bunty', { x: 420, y: 1200, s: 2.9, arms: 'point', expr: 'smug', noAnchor: true, t: 0.3 });
    ctx.restore();
    line(ctx, 1180, 0, 1000, H, 14, '#ff4fa3');
    // logo small
    txt(ctx, 'BUNTY', 1530, 150, { size: 110, fill: '#ff4fa3', lw: 18, shadow: '#000' });
    txt(ctx, '& CHINTU', 1530, 265, { size: 90, fill: '#ffd23f', lw: 16, shadow: '#000' });
    // tip box
    const tips = this.tips || TIPS;
    let tip = tips[0][1];
    for (const [tt, s] of tips) if (t >= tt) tip = s;
    rr(ctx, 1160, 420, 690, 300, 24); fs(ctx, 'rgba(255,255,255,0.06)', 4, '#ff4fa3');
    rr(ctx, 1190, 395, 120, 50, 12); fs(ctx, '#ff4fa3', 4);
    txt(ctx, 'TIP', 1250, 422, { size: 38, font: 'Bangers', fill: '#fff', lw: 0 });
    ctx.font = '46px BalooX';
    wrap(ctx, tip, 620).forEach((s, i) => txt(ctx, s, 1195, 500 + i * 58, { size: 46, font: 'BalooX', align: 'left', fill: '#fff', lw: 0 }));
    // progress
    let p = 0.99 * ease.out(clamp(t / 3));
    if (t > 9.0) p = lerp(0.99, 1, clamp((t - 9.0) / 0.6));
    const bx = 1160, by = 960, bw = 600;
    rr(ctx, bx, by, bw, 46, 23); fs(ctx, '#2c1d4d', 5, '#fff');
    rr(ctx, bx + 6, by + 6, Math.max(30, (bw - 12) * p), 34, 17); fs(ctx, '#1dd3b0', 0);
    const done = t > 9.6;
    txt(ctx, done ? 'LOADING COMPLETE!' : 'LOADING' + '.'.repeat(1 + (Math.floor(t * 3) % 3)), bx, by - 40, { size: 50, font: 'Lucky', align: 'left', fill: done ? '#ffd23f' : '#fff', lw: 8 });
    txt(ctx, Math.floor(p * 100) + '%', bx + bw, by - 40, { size: 50, font: 'Lucky', align: 'right', fill: '#fff', lw: 8 });
    if (t > 4 && t < 8.2 && Math.floor(t * 2) % 2) txt(ctx, '(atak gaya...)', bx + bw / 2, by + 90, { size: 34, font: 'BalooB', fill: '#aaa', lw: 0 });
    // Chintu runs in and pushes the bar
    if (t > 7.9) {
      const cx = keys(t, [[7.9, W + 120], [8.9, bx + bw + 60]], ease.out);
      const pushing = t > 8.9 && t < 9.7;
      S.c(ctx, 'chintu', { x: cx + (pushing ? Math.sin(t * 30) * 3 : 0), y: by + 70, s: 0.75, face: -1, legs: t < 8.9 ? 'run' : 'stand', walk: t * 16, arms: pushing ? 'grab' : (t > 9.7 ? 'cheer' : undefined), expr: pushing ? 'angry' : (t > 9.7 ? 'laugh' : 'worried'), lean: pushing ? 0.25 : 0 });
    }
  },
  post(ctx, t) { iris(ctx, ease.in(clamp((t - 10.2) / 0.8)), 1500, 900); },
};
