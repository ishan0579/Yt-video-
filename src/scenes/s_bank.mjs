// Scene: the bank "heist" (token number 999).
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, dizzy, pow, starPath, vgrad, fadeRect, sparkle } from '../engine.mjs';
import { sky, room, wallClock } from '../bg.mjs';
import { token, palm } from '../props.mjs';
import { wanted, money, minimap, popup, chapterCard } from '../hud.mjs';
import { guest } from '../characters.mjs';

const GY = 900, INT = 4.0, TL0 = 23.6, TL1 = 32.0, ALARM = 52.0;
const QUEUE = [[720, 11, 26.0], [860, 12, 28.5], [1000, 13, 31.0]];

function banana(c) {
  c.save(); c.rotate(-0.5);
  c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(40, 30, 80, -10); c.quadraticCurveTo(40, 10, -10, -12); c.closePath(); fs(c, '#ffe14d', 4);
  line(c, -12, -6, -20, -8, 6, '#6b4226');
  c.restore();
}
function exterior(ctx, t, S) {
  sky(ctx, t, 'day', { horizon: 700 });
  ctx.fillStyle = '#e8d9c0'; ctx.fillRect(0, 820, W, H);
  // bank facade
  rr(ctx, 360, 260, 1200, 600, 6); fs(ctx, '#f1ece2', 6);
  ctx.beginPath(); ctx.moveTo(320, 270); ctx.lineTo(960, 60); ctx.lineTo(1600, 270); ctx.closePath(); fs(ctx, '#e3dccd', 6);
  rr(ctx, 600, 170, 720, 80, 10); fs(ctx, '#1d3557', 5);
  txt(ctx, 'BANK OF PALM BAY', 960, 212, { size: 54, font: 'Lucky', fill: '#ffd23f', lw: 0 });
  for (let i = 0; i < 6; i++) { const x = 430 + i * 210; rr(ctx, x, 300, 70, 520, 8); fs(ctx, '#ffffff', 5); for (let k = 0; k < 3; k++) line(ctx, x + 18 + k * 17, 315, x + 18 + k * 17, 805, 3, '#ddd'); }
  rr(ctx, 860, 520, 200, 300, 10); fs(ctx, '#8d6e63', 6);
  for (let k = 0; k < 3; k++) { rr(ctx, 320 - k * 30, 820 + k * 30, 1280 + k * 60, 30, 4); fs(ctx, '#d8d0c0', 4); }
  palm(ctx, 160, 900, { s: 1.0, t, h: 480 });
  palm(ctx, 1780, 900, { s: 1.0, t, h: 480, lean: -0.15 });
  const bx = keys(t, [[0, -200], [3.4, 900]], ease.lin), cx = keys(t, [[0, -420], [2.9, 600], [3.4, 560]], ease.lin);
  const bonk = t > 2.9 && t < 3.6;
  S.c(ctx, 'chintu', { x: cx, y: GY + 60, s: 1.3, walk: bonk ? undefined : t * 10, mask: 'bag', arms: bonk ? 'flail' : 'tiptoe', rot: bonk ? -0.15 : 0 });
  S.c(ctx, 'bunty', { x: bx, y: GY + 60, s: 1.35, walk: t * 10, mask: 'bandit', arms: 'tiptoe', expr: 'smug', prop: banana });
  if (bonk) { pow(ctx, 640, GY - 300, 'BONK!', t - 2.9, 0.8, '#ffd23f', 4); dizzy(ctx, cx, GY - 330, t, 1.1); }
}

export function interior(ctx, t, S) {
  const it = t;
  const tl = clamp((t - TL0) / (TL1 - TL0));
  const hours = 10 + tl * 80;
  const dayF = 0.5 + 0.5 * Math.cos(((hours - 13) / 24) * Math.PI * 2);
  room(ctx, { wall: '#efe6d2', floor: '#d9c9a8', trim: '#8d6e63', floorY: 820, tiles: '#c7b48f' });
  // window
  rr(ctx, 430, 120, 240, 300, 8);
  ctx.fillStyle = `rgb(${Math.round(lerp(20, 120, dayF))},${Math.round(lerp(20, 200, dayF))},${Math.round(lerp(70, 255, dayF))})`; ctx.fill(); fs(ctx, null, 7);
  if (dayF < 0.4) { circle(ctx, 600, 190, 22); fs(ctx, '#fff6d6', 0); } else { circle(ctx, 520, 200, 30); fs(ctx, '#fff3a3', 0); }
  line(ctx, 550, 120, 550, 420, 6); line(ctx, 430, 270, 670, 270, 6);
  // door
  const doorOpen = t > INT && t < INT + 1.2 ? 1 : (t > 57.8 && t < 59.8 ? 1 : 0);
  rr(ctx, 50, 380, 230, 440, 6); fs(ctx, '#3b2a20', 6);
  if (doorOpen) { ctx.beginPath(); ctx.moveTo(280, 380); ctx.lineTo(380, 340); ctx.lineTo(380, 860); ctx.lineTo(280, 820); ctx.closePath(); fs(ctx, '#8d6e63', 6); }
  else { rr(ctx, 60, 390, 210, 430, 4); fs(ctx, '#8d6e63', 5); circle(ctx, 240, 610, 10); fs(ctx, '#ffd23f', 3); }
  // clock + display
  wallClock(ctx, 1120, 235, 90, hours);
  rr(ctx, 1320, 90, 520, 170, 14); fs(ctx, '#111', 6);
  txt(ctx, 'NOW SERVING', 1580, 130, { size: 34, font: 'Bangers', fill: '#ff6b6b', lw: 0 });
  let serving = 3;
  if (t > TL0) serving = Math.round(lerp(3, 998, ease.inOut(tl)));
  if (t > TL1) serving = 999;
  const flash = t > TL1 && t < TL1 + 1.2 && Math.floor(t * 8) % 2;
  txt(ctx, String(serving).padStart(3, '0'), 1580, 205, { size: 90, font: 'Lucky', fill: flash ? '#fff' : '#ff2e2e', lw: 0 });
  // token machine
  rr(ctx, 300, 560, 110, 260, 10); fs(ctx, '#e63946', 6);
  rr(ctx, 318, 600, 74, 40, 6); fs(ctx, '#111', 3);
  txt(ctx, 'TOKEN', 355, 690, { size: 26, font: 'Bangers', fill: '#fff', lw: 0 });
  circle(ctx, 355, 740, 18); fs(ctx, t > 15.3 && t < 15.6 ? '#7dff6a' : '#ffd23f', 4);
  // bench
  rr(ctx, 470, 780, 360, 30, 8); fs(ctx, '#a1887f', 5); line(ctx, 500, 810, 500, 880, 10); line(ctx, 800, 810, 800, 880, 10);
  // counter, cashier
  const yawn = t > 9.3 && t < 10.3 ? Math.sin(prog(9.3, 10.3, t) * Math.PI) : 0;
  const cashExpr = t > ALARM - 0.2 ? 'bored' : 'bored';
  S.c(ctx, 'cashier', { x: 1580, y: 830, s: 1.3, face: -1, arms: (t > 40.6 && t < 41.6) ? 'smack' : (t > 52.2 && t < 52.8 ? 'point' : 'idle'), expr: cashExpr, mouth: Math.max(S.mouth('cashier'), yawn), legs: 'hidden' });
  rr(ctx, 1290, 330, 640, 330, 6); ctx.fillStyle = 'rgba(190,235,255,0.25)'; ctx.fill(); fs(ctx, null, 5);
  rr(ctx, 1440, 520, 240, 140, 30); ctx.fillStyle = '#efe6d2'; ctx.globalAlpha = 0.001; ctx.fill(); ctx.globalAlpha = 1;
  rr(ctx, 1270, 650, 680, 30, 6); fs(ctx, '#6d4c41', 5);
  rr(ctx, 1290, 680, 640, 220, 6); fs(ctx, '#8d6e63', 6);
  for (let i = 0; i < 4; i++) { rr(ctx, 1320 + i * 155, 710, 125, 160, 8); fs(ctx, '#7a5a4e', 4); }
  rr(ctx, 1500, 280, 160, 46, 10); fs(ctx, '#2a9d8f', 4); txt(ctx, 'CASH', 1580, 304, { size: 34, font: 'Bangers', fill: '#fff', lw: 0 });
  // queue ropes
  for (let i = 0; i < 5; i++) { const x = 640 + i * 140; line(ctx, x, 900, x, 790, 8, '#c9a227'); circle(ctx, x, 785, 10); fs(ctx, '#ffd23f', 3); if (i < 4) { ctx.beginPath(); ctx.moveTo(x, 800); ctx.quadraticCurveTo(x + 70, 840, x + 140, 800); ctx.lineWidth = 8; ctx.strokeStyle = '#c1121f'; ctx.stroke(); } }
  // queue customers (served one by one during time-lapse)
  for (const [qx, seed, gone] of QUEUE) {
    if (t > gone) continue;
    const G = guest(seed);
    const ap = t > gone - 0.25 ? clamp((gone - t) / 0.25) : 1;
    S.c(ctx, G, { x: qx, y: GY + 20, s: 1.0 * (0.4 + 0.6 * ap), t: t + seed, arms: 'idle', expr: t > TL0 ? 'sleep' : 'bored', beard: t > TL0 ? tl * 0.6 : 0 });
  }
  // our heroes
  let bx = keys(t, [[INT, 120], [INT + 0.8, 440], [15.0, 440], [15.3, 420], [22.4, 420], [23.4, 600], [32.6, 600], [33.8, 1340], [57.6, 1340], [59.6, -300]], ease.inOut);
  const bSit = t > 23.4 && t < 32.6;
  const bWalk = (t > INT && t < INT + 0.8) || (t > 22.4 && t < 23.4) || (t > 32.6 && t < 33.8) || t > 57.6 ? t * 14 : undefined;
  let bArms = 'point', bExpr = 'angry', bFace = 1, bLook = [0.3, 0];
  if (t < 5.0) { bArms = 'point'; bExpr = 'smug'; }
  else if (t < 8.4) { bArms = 'point'; bExpr = 'angry'; }
  else if (t < 13.6) { bArms = 'point'; bExpr = 'worried'; }
  else if (t < 15.0) { bArms = 'hold'; bExpr = 'bored'; bLook = t < 14.3 ? [0.6, 0.6] : [-1, 0]; bFace = t < 14.3 ? 1 : -1; }
  else if (t < 18.6) { bArms = t < 15.6 ? 'grab' : 'idle'; bExpr = t < 16 ? 'smug' : 'shock'; bFace = -1; }
  else if (t < 23.4) { bArms = 'idle'; bExpr = t < 21 ? 'shock' : 'bored'; }
  else if (t < 32.6) { bArms = 'idle'; bExpr = t < TL1 ? 'bored' : 'shock'; }
  else if (t < 37.6) { bArms = 'point'; bExpr = 'angry'; }
  else if (t < 40.2) { bArms = 'idle'; bExpr = 'worried'; }
  else if (t < 41.6) { bArms = 'grab'; bExpr = 'smug'; }
  else if (t < 44.6) { bArms = 'idle'; bExpr = 'shock'; }
  else if (t < 46.8) { bArms = 'cheer'; bExpr = 'laugh'; }
  else if (t < ALARM) { bArms = 'idle'; bExpr = t < 50.2 ? 'smug' : 'bored'; bLook = t > 50.2 ? [-0.2, 0.3] : [0.3, 0]; bFace = t > 50.2 ? -1 : 1; }
  else if (t < 57.6) { bArms = 'flail'; bExpr = 'scared'; }
  else { bFace = -1; bArms = undefined; bExpr = 'scared'; }
  const beard = t < TL0 ? 0 : t < TL1 ? tl : 1;
  let cx = keys(t, [[INT, -60], [INT + 0.9, 250], [32.8, 250], [34.2, 1050], [57.7, 1050], [59.7, -500]], ease.inOut);
  const cSleep = t > TL0 + 0.6 && t < TL1 + 0.4;
  const cWalk = (t > INT && t < INT + 0.9) || (t > 32.8 && t < 34.2) || t > 57.7 ? t * 14 : undefined;
  let cArms = 'idle', cExpr = 'worried';
  if (t > 13.6 && t < 15) cArms = 'shrug';
  if (t > 18.6 && t < 21) { cArms = 'flail'; cExpr = 'shock'; }
  if (cSleep) { cExpr = 'sleep'; }
  if (t > 46.8 && t < 50.2) { cArms = 'hips'; cExpr = 'bored'; }
  if (t > ALARM) { cArms = 'flail'; cExpr = 'scared'; }
  if (cSleep) {
    S.c(ctx, 'chintu', { x: 740, y: 800, s: 1.2, legs: 'sit', arms: 'sleep', expr: 'sleep', mask: 'bag', headTilt: 0.35 });
  } else {
    S.c(ctx, 'chintu', { x: cx, y: GY + 30, s: 1.25, walk: cWalk, legs: cWalk ? 'run' : undefined, arms: cArms, expr: cExpr, mask: 'bag', face: t > 57.7 ? -1 : 1 });
  }
  if (bSit) S.c(ctx, 'bunty', { x: 580, y: 800, s: 1.25, legs: 'sit', arms: 'hold', expr: bExpr, mask: 'bandit', beard, prop: banana });
  else S.c(ctx, 'bunty', { x: bx, y: GY + 40, s: 1.32, walk: bWalk, legs: bWalk ? 'run' : undefined, arms: bArms, expr: bExpr, mask: 'bandit', beard, face: bFace, look: bLook, prop: t < 40 || t > 44.6 ? banana : null });
  // cobwebs + zzz during the time-lapse
  if (t > TL0 && t < TL1 + 0.5) {
    const a = clamp((t - TL0 - 2) / 3);
    ctx.save(); ctx.globalAlpha = a * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    for (const [wx, wy] of [[520, 420], [760, 420]]) { for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(k * 0.6) * 140, wy + Math.sin(k * 0.6) * 140); ctx.stroke(); } for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.arc(wx, wy, r * 40, 0, 3.0); ctx.stroke(); } }
    ctx.restore();
    if (cSleep) for (let i = 0; i < 3; i++) { const u = (t * 0.7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - u; txt(ctx, 'Z', 800 + u * 80, 420 - u * 160, { size: 40 + u * 30, fill: '#fff', lw: 6 }); ctx.restore(); }
  }
  // flying aadhaar card + ₹50 note
  if (t > 40.3 && t < 40.9) { const p = prog(40.3, 40.9, t); rr(ctx, lerp(1420, 1520, p) - 40, lerp(600, 560, p) - 26 - Math.sin(p * Math.PI) * 60, 80, 52, 6); fs(ctx, '#fff', 4); }
  if (t > 42.3 && t < 44.8) { const p = ease.out(prog(42.3, 42.9, t)); ctx.save(); ctx.translate(lerp(1600, 1500, p), 668 - (t > 43 ? (t - 43) * 30 : 0)); rr(ctx, -60, -26, 120, 52, 6); fs(ctx, '#b7e4c7', 4); txt(ctx, '₹50', 0, 2, { size: 34, font: 'BalooX', fill: '#2d6a4f', lw: 0 }); ctx.restore(); }
}

export default {
  id: 'bank',
  dur: 61,
  fadeIn: 0.5, fadeOut: 1.0,
  music: [[0, 8.4, 'sneaky', 0.45], [13.6, TL0, 'sneaky', 0.3], [TL0, TL1, 'timelapse', 0.55], [TL1 + 1, ALARM - 2, 'sneaky', 0.3], [ALARM + 0.5, 61, 'chase', 0.5]],
  sfx: [
    [2.9, 'bonk'], [INT, 'bang', { vol: 1.2 }], [8.6, 'crickets', { dur: 2.2 }], [9.4, 'yawn'],
    [15.4, 'click'], [15.6, 'print'], [16.1, 'whoosh'],
    [TL0, 'tick', { dur: TL1 - TL0 }], [TL1, 'ding'], [40.9, 'stamp'], [41.2, 'stamp'], [43.0, 'kaching'], [44.6, 'cheer', { vol: 0.5 }],
    [50.2, 'crickets', { dur: 1.8 }], [ALARM, 'alarmbell', { dur: 9, vol: 0.5 }], [ALARM + 0.1, 'star'], [ALARM + 0.4, 'star'], [59.8, 'bang'],
  ],
  lines: [
    { t: 5.0, who: 'bunty', text: 'KOI HILEGA NAHI! Ye DAKAITI hai!', hi: 'कोई हिलेगा नहीं! ये डकैती है!', style: 'shout', dur: 3.4 },
    { t: 10.6, who: 'cashier', text: 'Line mein aaiye. Pehle token lijiye.', hi: 'लाइन में आइए। पहले टोकन लीजिए।', dur: 3.0 },
    { t: 18.6, who: 'chintu', text: 'Bhai... 999?!', hi: 'भाई... नौ सौ निन्यानवे?!', dur: 2.4 },
    { t: 21.0, who: 'bunty', text: '...Koi baat nahi. Wait karte hain.', hi: '...कोई बात नहीं। वेट करते हैं।', dur: 2.6 },
    { t: 34.2, who: 'bunty', text: 'SAARA PAISA MERE HAWALE KARO!', hi: 'सारा पैसा मेरे हवाले करो!', style: 'shout', dur: 3.2 },
    { t: 37.6, who: 'cashier', text: 'Aadhaar card dikhaiye.', hi: 'आधार कार्ड दिखाइए।', dur: 2.6 },
    { t: 41.6, who: 'cashier', text: 'Ye lijiye. Pachaas rupaye.', hi: 'ये लीजिए। पचास रुपये।', dur: 2.8 },
    { t: 44.6, who: 'bunty', text: 'Yesss! DAKAITI SUCCESSFUL!', hi: 'येस! डकैती सक्सेसफ़ुल!', dur: 2.2 },
    { t: 46.8, who: 'chintu', text: 'Bhai... ye toh tere hi account ka paisa tha.', hi: 'भाई... ये तो तेरे ही अकाउंट का पैसा था।', dur: 3.4 },
    { t: 52.6, who: 'cashier', text: 'Banana se dakaiti? Alarm toh banta hai.', hi: 'बनाना से डकैती? अलार्म तो बनता है।', dur: 3.0 },
    { t: 55.6, who: 'bunty', text: 'BHAAAAGOOOO!!!', hi: 'भागो!!!', style: 'shout', dur: 2.0 },
  ],
  draw(ctx, t, S) {
    const shake = (t > 5 && t < 8.4 ? 6 : 0) + (t > ALARM && t < 58 ? 5 : 0) + (t > INT && t < INT + 0.3 ? 14 : 0);
    ctx.save(); camera(ctx, t, { shake });
    if (t < INT) exterior(ctx, t, S); else interior(ctx, t, S);
    ctx.restore();
    if (t > ALARM && t < 60) { const on = Math.floor(t * 4) % 2; ctx.fillStyle = on ? 'rgba(255,0,40,0.22)' : 'rgba(255,0,40,0.05)'; ctx.fillRect(0, 0, W, H); }
    const stars = t > ALARM + 0.4 ? 5 : t > ALARM + 0.1 ? 4 : 3;
    wanted(ctx, stars, t, t > ALARM + 0.4 ? ALARM + 0.4 : ALARM + 0.1);
    money(ctx, t > 43 ? 50 : 0, t, 43); minimap(ctx, t, { cops: t > ALARM ? 3 : 0, scroll: 0 });
  },
  post(ctx, t) {
    chapterCard(ctx, 'CHAPTER 4', 'The Heist', t - 0.4, 3.0);
    // token close-up
    if (t > 16.0 && t < 18.6) {
      const p = ease.back(clamp((t - 16.0) / 0.4)), out = clamp((t - 18.2) / 0.4);
      ctx.save(); ctx.globalAlpha = 1 - out; token(ctx, W / 2, H / 2 - 40, 2.6 * p, '999'); ctx.restore();
    }
    const caps = [[24.0, 26.4, '3 GHANTE BAAD...'], [26.8, 29.2, '9 GHANTE BAAD...'], [29.4, 31.8, '3 DIN BAAD...'], [TL1, TL1 + 1.6, 'TOKEN NO. 999!']];
    for (const [a, b, s] of caps) if (t > a && t < b) {
      const p = ease.back(clamp((t - a) / 0.3));
      ctx.save(); ctx.translate(800, 80); ctx.scale(p, p); ctx.rotate(-0.03);
      rr(ctx, -330, -58, 660, 116, 20); fs(ctx, '#ffd23f', 8);
      txt(ctx, s, 0, 6, { size: 64, fill: '#1b1030', lw: 0 });
      ctx.restore();
    }
    popup(ctx, 'WANTED LEVEL MAX: Banana se dakaiti', t - ALARM - 0.3, 3.0);
    if (t > INT - 0.1 && t < INT + 0.1) fadeRect(ctx, 1 - Math.abs(t - INT) / 0.1, '#fff');
  },
};
