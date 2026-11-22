// Auto-rickshaw chase (also used for the cold-open teaser).
import { W, H, clamp, lerp, ease, keys, prog, camera, explosion, hLines, speedLines, sparkle, rr, fs, line, txt, vgrad, dust, circle, rng } from '../engine.mjs';
import { sky, skyline, street } from '../bg.mjs';
import { auto, car, heli, streetLamp, fruitCart, palm } from '../props.mjs';
import { wanted, money, minimap, speedo, chapterCard } from '../hud.mjs';

const V = 1500;
// world-time warp (slow-mo during the jump)
export function warp(t) {
  if (t < 37) return t;
  if (t < 41) return 37 + (t - 37) * 0.3;
  return 38.2 + (t - 41);
}
const JUMP0 = 36.8, JUMP1 = 38.6; // world-time
const GAP0 = V * 37.05 + 1100, GAP1 = V * 38.35 + 700; // world x of the broken bridge (screen-relative to auto front)
const AUTO_SX = 900;
const CART_T = 7.5, CAR_T = 15;

export function drawAutoChase(ctx, t, S, o = {}) {
  const wt = o.worldT ?? warp(t);
  const A = V * wt;
  const camX = A - AUTO_SX;
  const hz = 640, gy = 760, roadY = 1030;
  // jump arc
  let jy = 0, jr = 0, inAir = false;
  if (wt > JUMP0 && wt < JUMP1) {
    const p = (wt - JUMP0) / (JUMP1 - JUMP0);
    jy = -Math.sin(p * Math.PI) * 380; jr = -ease.inOut(p) * Math.PI * 2; inAir = true;
  }
  const landAge = wt - JUMP1;
  const zoom = o.zoom ?? (inAir ? 0.86 : 1);
  ctx.save();
  camera(ctx, t, { x: W / 2, y: H / 2 + (inAir ? jy * 0.35 : 0), zoom, shake: o.shake ?? (landAge > 0 && landAge < 0.4 ? 18 : 4) });

  sky(ctx, t, 'sunset', { horizon: hz, camX, sunY: 470, sunR: 210 });
  skyline(ctx, camX, hz, t);
  street(ctx, camX, t, { groundY: gy });
  // street lamps
  const sp = 700, s0 = Math.floor((camX - 300) / sp);
  for (let i = s0; i < s0 + 5; i++) streetLamp(ctx, i * sp - camX, gy + 20, { s: 0.9 });
  // bridge gap
  const g0 = GAP0 - camX, g1 = GAP1 - camX;
  if (g1 > -200 && g0 < W + 400) {
    ctx.fillStyle = vgrad(ctx, gy - 40, H + 300, ['#ff9e5e', '#7b2c91', '#1b4d7a']); ctx.fillRect(g0, gy - 40, g1 - g0, H);
    ctx.fillStyle = '#1e6091'; ctx.fillRect(g0, H - 120, g1 - g0, 400);
    for (let k = 0; k < 4; k++) line(ctx, g0 + 40 + k * 300 + Math.sin(t * 2 + k) * 20, H - 90 + k * 8, g0 + 160 + k * 300, H - 90 + k * 8, 4, 'rgba(255,255,255,0.5)');
    for (const [x, dir] of [[g0, 1], [g1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, gy - 40);
      for (let k = 0; k < 8; k++) ctx.lineTo(x + dir * (k % 2 ? 26 : 0), gy - 40 + k * 60);
      ctx.lineTo(x + dir * -400, H + 200); ctx.lineTo(x + dir * -400, gy - 40); ctx.closePath();
      fs(ctx, '#3b3b4f', 5);
      ctx.fillStyle = '#e8d9c0'; ctx.fillRect(Math.min(x, x - dir * 400), gy - 40, 400, 110);
      line(ctx, x, gy - 40, x + dir * 10, H, 6);
    }
    // warning sign before the gap
  }
  const signX = GAP0 - 900 - camX;
  if (signX > -300 && signX < W + 300) {
    line(ctx, signX, gy + 30, signX, gy - 200, 10, '#555');
    rr(ctx, signX - 170, gy - 330, 340, 140, 14); fs(ctx, '#ffd23f', 6);
    txt(ctx, 'PUL TOOTA HAI!', signX, gy - 280, { size: 40, font: 'Bangers', fill: '#d62828', lw: 0 });
    txt(ctx, '(seriously)', signX, gy - 232, { size: 30, font: 'BalooB', fill: '#1b1030', lw: 0 });
  }
  // fruit cart + parked car that explode for no reason
  const cartX = V * CART_T + 400 + AUTO_SX - 900 - camX + 300;
  if (wt < CART_T) fruitCart(ctx, cartX, gy + 20, 1);
  else explosion(ctx, cartX, gy - 80, wt - CART_T, 1.3, 11);
  const pcX = V * CAR_T + 500 - camX + 300;
  if (wt < CAR_T) car(ctx, pcX, gy + 30, { color: '#8ecae6', s: 0.9 });
  else { explosion(ctx, pcX, gy - 60, wt - CAR_T, 1.7, 21); if (wt - CAR_T < 2.5) car(ctx, pcX + (wt - CAR_T) * 200, gy + 30 - Math.max(0, (wt - CAR_T) * 900 - (wt - CAR_T) ** 2 * 700), { color: '#333', s: 0.9, tilt: (wt - CAR_T) * 3 }); }

  // police car A (far lane)
  let pA = A - 520 + Math.sin(t * 1.3) * 60;
  if (wt > 24.5 && wt < 31) pA = A - 520 + 420 * ease.inOut(clamp((wt - 24.5) / 1.5)) - 420 * ease.inOut(clamp((wt - 29.5) / 1.5));
  let pB = A - 1000 + Math.sin(t * 1.7 + 1) * 70;
  const stopA = GAP0 - 260, stopB = GAP0 - 680;
  const brakeA = pA > stopA, brakeB = pB > stopB;
  pA = Math.min(pA, stopA); pB = Math.min(pB, stopB);
  car(ctx, pA - camX, roadY - 70, { police: true, s: 0.95, wheelRot: brakeA ? 0 : t * 25, t, brake: brakeA, driver: c => {
    S.c(c, 'police', { key: 'policeA', x: -20, y: -30, s: 0.42, legs: 'hidden', noAnchor: true, expr: brakeA ? 'shock' : 'angry' });
  } });
  if (brakeA && wt < JUMP1 + 2) dust(ctx, pA - camX - 150, roadY - 70, (t * 1.5) % 1.2, 1, 4, "#bbb");

  // the auto
  const bounce = inAir ? 0 : Math.abs(Math.sin(t * 22)) * 4 + (landAge > 0 && landAge < 0.5 ? Math.sin(landAge * 25) * 14 * (1 - landAge * 2) : 0);
  const tilt = o.tilt ?? (wt > 25 && wt < 29.2 ? -0.32 * ease.out(clamp((wt - 25) / 0.4)) * (1 - ease.in(clamp((wt - 28.8) / 0.4))) : 0);
  const scared = o.scared ?? ((wt > 7.5 && wt < 11) || (wt > 25 && wt < 28) || (wt > 31.5 && wt < 34) || inAir);
  ctx.save();
  ctx.translate(AUTO_SX, roadY + jy - bounce);
  if (tilt) { ctx.translate(165 * 1.25, 0); ctx.rotate(tilt); ctx.translate(-165 * 1.25, 0); }
  if (jr) { ctx.translate(0, -160); ctx.rotate(jr); ctx.translate(0, 160); }
  auto(ctx, 0, 0, { s: 1.25, wheelRot: t * 30, inside: c => {
    // Chintu in the back
    c.save(); c.beginPath(); c.moveTo(-150, -125); c.lineTo(-145, -235); c.quadraticCurveTo(-90, -255, -40, -250); c.lineTo(-40, -125); c.closePath(); c.clip();
    S.c(c, 'chintu', { x: -92, y: -82, s: 0.62, legs: 'hidden', arms: scared ? 'flail' : (o.cheer ? 'cheer' : 'hold'), expr: scared ? 'scared' : (o.cheer ? 'laugh' : 'worried'), anchorOffset: [0, -10] });
    c.restore();
    c.save(); c.beginPath(); c.moveTo(0, -125); c.lineTo(0, -250); c.quadraticCurveTo(70, -250, 110, -230); c.quadraticCurveTo(128, -190, 128, -125); c.closePath(); c.clip();
    S.c(c, 'bunty', { x: 52, y: -84, s: 0.6, legs: 'hidden', arms: o.cheer ? 'cheer' : 'hold', expr: o.buntyExpr || (inAir ? 'laugh' : 'smug'), anchorOffset: [0, -10] });
    line(c, 80, -150, 118, -170, 7, '#333');
    c.restore();
  } });
  if (tilt < -0.1) for (let k = 0; k < 6; k++) { const R = rng(Math.floor(t * 30) + k); sparkle(ctx, -120 + R() * 40, -10 - R() * 20, 14 + R() * 10, 1, '#ffd23f'); }
  ctx.restore();
  if (landAge > 0 && landAge < 1) dust(ctx, AUTO_SX - 100, roadY, landAge, 1.4, 8, '#f1e3c8');

  // police car B (near lane)
  car(ctx, pB - camX, roadY + 40, { police: true, s: 1.05, wheelRot: brakeB ? 0 : t * 25, t, brake: brakeB, driver: c => {
    S.c(c, 'police', { key: 'policeB', x: -20, y: -30, s: 0.42, legs: 'hidden', noAnchor: true, expr: 'angry' });
  } });

  // helicopter
  if (wt > 16) {
    const hp = ease.out(clamp((wt - 16) / 2));
    const hx = lerp(W + 400, 1250, hp) + Math.sin(t * 1.1) * 40, hyy = 210 + Math.sin(t * 1.7) * 18;
    heli(ctx, hx, hyy, { s: 1.0, t, face: -1, tilt: 0.08, light: [hx - AUTO_SX - 60 < 0 ? -(hx - AUTO_SX) : -(hx - AUTO_SX), roadY - hyy] });
    S.anchors.heli = [hx - 40, hyy - 40];
  }
  ctx.restore();

  if (!o.noSpeed && !inAir) hLines(ctx, t, 0.35, 4);
  if (inAir) speedLines(ctx, t, 0.35);
  if (!o.noHud) {
    wanted(ctx, 5, t); money(ctx, 50); minimap(ctx, t, { cops: 3, scroll: t * 160, heading: 0.2 });
    speedo(ctx, inAir ? 0 : 92 + Math.sin(t * 2) * 8);
  }
}

export default {
  id: 'autochase',
  dur: 47,
  fadeIn: 0.2,
  music: [[0, 36.6, 'chase', 0.55], [36.6, 41.4, 'epic', 0.6], [41.4, 47, 'chase', 0.45]],
  sfx: [
    [0, 'siren', { dur: 47, vol: 0.25 }], [0, 'engine', { dur: 36, vol: 0.25 }],
    [CART_T, 'explosion'], [CAR_T, 'explosion', { vol: 1.1 }],
    [16, 'heli', { dur: 30, vol: 0.3 }],
    [25, 'skid'], [25.2, 'sparks', { dur: 3.5 }],
    [36.6, 'whoosh'], [37.1, 'choir', { dur: 4 }], [38.5, 'skid'], [38.9, 'skid'],
    [41.4, 'thud', { vol: 1.2 }], [41.5, 'cheer'],
  ],
  lines: [
    { t: 0.6, who: 'chintu', text: 'Bhai, tu auto chalana jaanta hai?!' },
    { t: 4.2, who: 'bunty', text: 'Nahi! Par aaj seekh jaaunga!' },
    { t: 8.0, who: 'chintu', text: 'Bhai wo kyun phata?!', style: 'shout' },
    { t: 10.8, who: 'bunty', text: 'Open world hai bhai! Yahan sab apne aap phat-ta hai!', dur: 4.2 },
    { t: 17.3, who: 'heli', name: 'POLICE (HELICOPTER)', tag: '#457b9d', voice: 'police', text: 'AUTO ROK DO! Turant!', style: 'shout', mega: true },
    { t: 20.6, who: 'bunty', text: 'Meter chalu hai, uncle! Rukega nahi!', dur: 3.6 },
    { t: 25.0, who: 'chintu', text: 'Bhai auto ek taraf jhuk gaya!!', style: 'shout' },
    { t: 28.2, who: 'bunty', text: 'Isko kehte hain... DESI DRIFT!' },
    { t: 31.6, who: 'chintu', text: 'Bhai aage pul toota hua hai!!', style: 'shout' },
    { t: 34.3, who: 'bunty', text: 'Bollywood stunt time!', dur: 2.2 },
    { t: 37.4, who: 'chintu', text: 'MUMMYYYYY!!!', style: 'shout', dur: 3.6 },
    { t: 42.0, who: 'bunty', text: 'HUM BACH GAYE!!', style: 'shout', dur: 2.8 },
    { t: 44.6, who: 'chintu', text: 'Bhai tu legend hai!', dur: 2.2 },
  ],
  draw(ctx, t, S) { drawAutoChase(ctx, t, S, { cheer: t > 41.6 }); },
  post(ctx, t) { chapterCard(ctx, 'CHAPTER 5', 'Auto Wala Stunt', t - 0.4, 2.8); },
};
