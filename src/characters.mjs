// Rigged cartoon characters (all original designs).
import { OUT, TAU, clamp, lerp, rr, circle, ell, fs, limb, line, rng, noise, starPath } from './engine.mjs';

export const CHARS = {
  bunty: { name: 'BUNTY', tag: '#e63946', skin: '#c68642', hair: 'spiky', hairC: '#17121f', top: '#e63946', pattern: 'flowers', pants: '#27346b', shoe: '#f4f4f4', glasses: 'shades', chain: true, base: 1.0, belly: 0, headR: 60 },
  chintu: { name: 'CHINTU', tag: '#f9a826', skin: '#e3ac72', hair: 'cap', capC: '#3a86ff', hairC: '#3b2414', top: '#ffd23f', pattern: 'star', pants: '#2a9d8f', shoe: '#e76f51', eyes: 'big', base: 0.86, belly: 0.45, headR: 64 },
  dadi: { name: 'DADI', tag: '#9b5de5', skin: '#d6a77a', hair: 'bun', hairC: '#eeeeee', outfit: 'saree', top: '#9b5de5', border: '#ffd23f', shoe: '#7a4b2a', glasses: 'round', base: 0.74, belly: 0.2, headR: 58, hunch: 0.18, wrinkles: true },
  police: { name: 'POLICE UNCLE', tag: '#457b9d', skin: '#a86b45', hair: 'policecap', hairC: '#1b1b1b', top: '#c9a66b', pants: '#9f7f4a', shoe: '#2b1d14', mustache: true, base: 1.05, belly: 0.75, headR: 60, uniform: true },
  mummy: { name: 'MUMMY', tag: '#2a9d8f', skin: '#c99068', hair: 'bun', hairC: '#1d1416', outfit: 'saree', top: '#e5383b', border: '#ffd23f', shoe: '#8d5524', bindi: true, base: 0.95, belly: 0.25, headR: 58 },
  lala: { name: 'LALA JI', tag: '#f4a261', skin: '#e3a87a', hair: 'bald', hairC: '#d9d9d9', outfit: 'robe', top: '#ffffff', pants: '#ffffff', shoe: '#c9a227', glasses: 'gold', chain: true, base: 1.05, belly: 1.0, headR: 60, mustache: true },
  cashier: { name: 'CASHIER', tag: '#6c757d', skin: '#b5835a', hair: 'side', hairC: '#2b2b2b', top: '#f1faee', tie: '#e63946', pants: '#343a40', shoe: '#111', glasses: 'square', base: 0.95, belly: 0.1, headR: 58 },
  nurse: { name: 'NURSE', tag: '#4cc9f0', skin: '#d9a066', hair: 'bun', hairC: '#2b1a12', top: '#bde0fe', pants: '#bde0fe', shoe: '#fff', base: 0.92, belly: 0.1, headR: 58, nurseCap: true },
};
const GUEST_TOPS = ['#ff4fa3', '#4cc9f0', '#90be6d', '#f9c74f', '#f3722c', '#b5179e', '#00b4d8', '#ffafcc'];
const GUEST_SKIN = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#a86b45', '#d6a77a'];
const GUEST_HAIR = ['side', 'spiky', 'bun', 'curly', 'bald'];
export function guest(seed) {
  const R = rng(Math.imul(seed + 1, 2654435761) >>> 0); R(); R();
  const pick = a => a[Math.floor(R() * a.length)];
  const hair = pick(GUEST_HAIR);
  return { name: 'GUEST', tag: '#999', skin: pick(GUEST_SKIN), hair, hairC: pick(['#17121f', '#5a3825', '#c9a227', '#7b2cbf']), top: pick(GUEST_TOPS), pants: pick(['#27346b', '#333', '#6a4c93', '#264653']), shoe: '#222', base: 0.85 + R() * 0.2, belly: R() * 0.6, headR: 56 + R() * 6, glasses: R() < 0.3 ? 'shades' : null };
}

// ----- poses -----
// arm: [shoulderAngle, elbowBend]; 0 = hanging down, + = forward/up (toward facing side)
export function armPose(name, t = 0) {
  const s = Math.sin, c = Math.cos;
  switch (name) {
    case 'up': return [[-2.3 + s(t * 9) * 0.12, -0.5], [2.2 + s(t * 9 + 1) * 0.12, 0.5]];
    case 'wave': return [[0.15, 0.2], [2.1, 0.5 + s(t * 14) * 0.55]];
    case 'point': return [[0.1, 0.2], [1.55, 0]];
    case 'pointUp': return [[0.1, 0.2], [2.25, 0.3]];
    case 'flail': return [[-2.0 + s(t * 22) * 0.8, -0.6 - s(t * 17) * 0.5], [2.0 + s(t * 19 + 2) * 0.8, 0.6 + c(t * 23) * 0.5]];
    case 'cheer': return [[-2.25 + s(t * 12) * 0.3, -0.5], [2.15 + s(t * 12 + 3) * 0.3, 0.6]];
    case 'hold': return [[1.25, 0.3], [1.35, 0.3]];
    case 'holdLow': return [[0.9, 0.4], [1.0, 0.4]];
    case 'facepalm': return [[0.1, 0.2], { to: [38, -190] }];
    case 'think': return [[0.25, 0.2], { to: [40, -165] }];
    case 'binoc': return [{ to: [60, -215] }, { to: [62, -205] }];
    case 'shrug': return [[-0.9, -1.4], [0.9, 1.4]];
    case 'hips': return [{ to: [-46, -78] }, { to: [46, -78] }];
    case 'dance': return [[-2.4 + s(t * 8) * 0.6, -0.8], [0.9 + s(t * 8 + 3) * 0.9, 1.4]];
    case 'dance2': return [[-1.6 + s(t * 8 + 1) * 1.0, -0.5], [1.6 + s(t * 8 + 2.5) * 1.0, 0.5]];
    case 'smack': return [[0.2, 0.2], [s(t * 18) > 0 ? 2.7 : 1.1, 0.3]];
    case 'throw': return [[-0.4, 0.2], [2.7, 0.2]];
    case 'run': return [[0.9 * s(t), 1.4], [-0.9 * s(t), 1.4]];
    case 'tiptoe': return [[1.5, 1.4], [1.8, 1.4]];
    case 'sleep': return [[0.05, 0.1], [0.05, 0.1]];
    case 'pillow': return [[-2.3, -0.4], [2.3, 0.4]];
    case 'grab': return [[1.4, 0.1], [1.5, 0.1]];
    default: return [[0.12 + s(t * 2) * 0.04, 0.25], [-0.08 + s(t * 2 + 1) * 0.04, 0.25]];
  }
}

function dirv(a) { return [Math.sin(a), Math.cos(a)]; }
function ik(hx, hy, tx, ty, l1, l2, bendSign = 1) {
  const dx = tx - hx, dy = ty - hy;
  let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.01);
  const a = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = a - bendSign * Math.acos(cosA);
  return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1];
}

// ----- main draw -----
// returns {head:[sx,sy]} screen coords of head top (for speech bubbles)
export function drawChar(ctx, id, o = {}) {
  const C = typeof id === 'string' ? CHARS[id] : id;
  const t = o.t || 0;
  const s = (o.s ?? 1) * C.base;
  const face = o.face ?? 1;
  const R = C.headR;
  ctx.save();
  ctx.translate(o.x ?? 0, o.y ?? 0);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(s * face, s * (o.sy ?? 1));
  if (o.alpha != null) ctx.globalAlpha = o.alpha;

  // legs
  const legMode = o.legs || (o.walk != null ? 'walk' : 'stand');
  const hipY = -62;
  const bodyW = 74 + C.belly * 34;
  let bob = 0;
  const legW = 20;
  const legsPts = []; // [[hip, knee, foot]] back, front
  if (legMode === 'walk' || legMode === 'run') {
    const amp = legMode === 'run' ? 0.85 : 0.5;
    const p = o.walk || 0;
    bob = -Math.abs(Math.sin(p)) * (legMode === 'run' ? 10 : 5);
    for (const ph of [p + Math.PI, p]) {
      const a = amp * Math.sin(ph);
      const bend = Math.max(0, Math.cos(ph)) * (legMode === 'run' ? 1.4 : 0.7);
      const hip = [0, hipY], kd = dirv(a), knee = [hip[0] + kd[0] * 32, hip[1] + kd[1] * 32];
      const sd = dirv(a - bend), foot = [knee[0] + sd[0] * 30, knee[1] + sd[1] * 30];
      legsPts.push([hip, knee, foot]);
    }
  } else if (legMode === 'sit') {
    for (const dx of [-6, 6]) legsPts.push([[dx, hipY], [dx + 32, hipY + 2], [dx + 34, hipY + 32]]);
  } else if (legMode === 'pedal') {
    const pa = o.pedal || 0, cx = 18, cy = hipY + 52;
    for (const ph of [pa + Math.PI, pa]) {
      const fx = cx + Math.cos(ph) * 15, fy = cy + Math.sin(ph) * 15;
      const k = ik(0, hipY, fx, fy, 32, 30, 1);
      legsPts.push([[0, hipY], k, [fx, fy]]);
    }
  } else if (legMode === 'kick') {
    const p = o.walk || t * 25;
    for (const [i, ph] of [[0, p], [1, p + Math.PI]]) {
      const a = 0.3 + Math.sin(ph) * 0.5;
      const hip = [i ? 8 : -8, hipY], kd = dirv(Math.PI - a), knee = [hip[0] + kd[0] * 32, hip[1] + kd[1] * 32];
      const sd = dirv(Math.PI - a + Math.sin(ph) * 0.6), foot = [knee[0] + sd[0] * 30, knee[1] + sd[1] * 30];
      legsPts.push([hip, knee, foot]);
    }
  } else if (legMode !== 'hidden') {
    const spread = o.spread ?? 1;
    for (const dx of [-13 * spread, 13 * spread]) legsPts.push([[dx * 0.6, hipY], [dx, hipY + 32], [dx, 0]]);
  }
  ctx.translate(0, bob + (o.bob || 0));
  const isDress = C.outfit === 'saree' || C.outfit === 'robe';

  const drawLeg = (lp, shade) => {
    const [hip, knee, foot] = lp;
    if (!isDress || legMode === 'sit' || legMode === 'pedal') limb(ctx, [hip, knee, foot], legW, shade ? darken(C.pants || C.top) : (C.pants || C.top));
    else limb(ctx, [[foot[0], foot[1] - 22], foot], 12, C.skin, 4);
    // shoe
    const fa = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]) - Math.PI / 2;
    ctx.save(); ctx.translate(foot[0], foot[1]); ctx.rotate(legMode === 'kick' ? fa : clamp(fa, -0.5, 0.5));
    ell(ctx, 9, 0, 20, 11); fs(ctx, C.shoe, 5);
    ctx.restore();
  };
  if (legsPts[0]) drawLeg(legsPts[0], true);

  // torso transform (hunch)
  ctx.save();
  if (C.hunch) { ctx.translate(0, hipY); ctx.rotate(C.hunch); ctx.translate(0, -hipY); }
  if (o.lean) { ctx.translate(0, hipY); ctx.rotate(o.lean); ctx.translate(0, -hipY); }

  const shY = -136, shX = bodyW / 2 - 10;
  const arms = o.arms ? armPose(o.arms, t) : (o.armA || armPose(legMode === 'walk' || legMode === 'run' ? 'run' : 'idle', o.walk ?? t));
  if (!o.arms && !o.armA && (legMode === 'walk' || legMode === 'run')) {
    const p = o.walk || 0, amp = legMode === 'run' ? 1.1 : 0.55;
    arms[0] = [amp * Math.sin(p), 0.5]; arms[1] = [-amp * Math.sin(p), 0.5];
  }
  const armPts = (a, side) => {
    const sh = [side * shX * 0.55, shY];
    if (!Array.isArray(a)) {
      const hd = a.to, el = ik(sh[0], sh[1], hd[0], hd[1], 40, 38, side > 0 ? -1 : 1);
      return [sh, el, hd];
    }
    const d1 = dirv(a[0]), el = [sh[0] + d1[0] * 40, sh[1] + d1[1] * 40];
    const d2 = dirv(a[0] + a[1]), hd = [el[0] + d2[0] * 38, el[1] + d2[1] * 38];
    return [sh, el, hd];
  };
  const drawArm = (a, side, shade) => {
    const [sh, el, hd] = armPts(a, side);
    limb(ctx, [sh, el, hd], 16, C.skin, 5);
    const sleeve = C.outfit === 'saree' ? C.skin : C.top;
    if (C.outfit !== 'saree') limb(ctx, [sh, [lerp(sh[0], el[0], 0.75), lerp(sh[1], el[1], 0.75)]], 22, shade ? darken(sleeve) : sleeve, 5);
    circle(ctx, hd[0], hd[1], 12); fs(ctx, C.skin, 5);
    return hd;
  };
  const backHand = drawArm(arms[0], -1, true);
  if (o.backProp) { ctx.save(); ctx.translate(backHand[0], backHand[1]); o.backProp(ctx); ctx.restore(); }
  if (legsPts[1]) drawLeg(legsPts[1], false);

  // body
  const top = -152;
  if (C.outfit === 'saree') {
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2 + 4, top + 16);
    ctx.quadraticCurveTo(0, top - 8, bodyW / 2 - 4, top + 16);
    ctx.lineTo(bodyW / 2 + 16, -14);
    ctx.quadraticCurveTo(0, -4, -bodyW / 2 - 16, -14);
    ctx.closePath(); fs(ctx, C.top, 5);
    // pallu sash
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(bodyW / 2 - 6, top); ctx.lineTo(bodyW / 2 + 20, top + 30); ctx.lineTo(-bodyW / 2 - 20, -40); ctx.lineTo(-bodyW / 2 - 20, -80); ctx.closePath();
    fs(ctx, darken(C.top, 0.82), 0);
    line(ctx, bodyW / 2 + 10, top + 14, -bodyW / 2 - 20, -60, 7, C.border);
    line(ctx, -bodyW, -18, bodyW, -18, 8, C.border);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-bodyW / 2 + 4, top + 16); ctx.quadraticCurveTo(0, top - 8, bodyW / 2 - 4, top + 16);
    ctx.lineTo(bodyW / 2 + 16, -14); ctx.quadraticCurveTo(0, -4, -bodyW / 2 - 16, -14); ctx.closePath(); fs(ctx, null, 5);
  } else if (C.outfit === 'robe') {
    rr(ctx, -bodyW / 2, top, bodyW, -30 - top, 34); fs(ctx, C.top, 5);
    ctx.beginPath(); ctx.moveTo(-14, top + 2); ctx.lineTo(12, top + 50); ctx.lineTo(30, top + 4); ctx.closePath(); fs(ctx, C.skin, 4);
    line(ctx, -bodyW / 2 + 6, -78, bodyW / 2 - 6, -82, 9, '#f4a261');
    line(ctx, -bodyW / 2 + 6, -78, bodyW / 2 - 6, -82, 0.1);
  } else {
    rr(ctx, -bodyW / 2, top, bodyW, hipY - top + 12, 30);
    ctx.save(); fs(ctx, C.top, 0); ctx.clip();
    if (C.pattern === 'flowers') {
      const Rr = rng(11);
      for (let i = 0; i < 14; i++) {
        const fx = -bodyW / 2 + Rr() * bodyW, fy = top + Rr() * 90;
        for (let k = 0; k < 5; k++) { const a = (k * TAU) / 5; circle(ctx, fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 5); fs(ctx, k % 2 ? '#ffd23f' : '#fff3b0', 0); }
        circle(ctx, fx, fy, 3.5); fs(ctx, '#f77f00', 0);
      }
    } else if (C.pattern === 'star') {
      starPath(ctx, 6, -108, 20, 9); fs(ctx, '#e63946', 3);
    }
    // pants band
    ctx.fillStyle = C.pants; ctx.fillRect(-bodyW, hipY - 12, bodyW * 2, 40);
    if (C.uniform) {
      ctx.fillStyle = '#5c3d1e'; ctx.fillRect(-bodyW, hipY - 16, bodyW * 2, 12);
      rr(ctx, 6, hipY - 18, 18, 16, 3); fs(ctx, '#ffd23f', 3);
      for (let i = 0; i < 3; i++) { circle(ctx, 14, top + 22 + i * 22, 3.5); fs(ctx, '#7a5a2a', 0); }
      starPath(ctx, -14, top + 34, 11, 5); fs(ctx, '#ffd23f', 3);
    }
    if (C.tie) {
      ctx.beginPath(); ctx.moveTo(8, top + 4); ctx.lineTo(18, top + 4); ctx.lineTo(22, top + 60); ctx.lineTo(13, top + 72); ctx.lineTo(4, top + 60); ctx.closePath(); fs(ctx, C.tie, 3);
    }
    if (C.nurseCap) { line(ctx, -10, top + 30, 34, top + 30, 0.1); rr(ctx, 4, top + 18, 22, 22, 4); fs(ctx, '#fff', 3); line(ctx, 15, top + 22, 15, top + 36, 4, '#e63946'); line(ctx, 8, top + 29, 22, top + 29, 4, '#e63946'); }
    ctx.restore();
    rr(ctx, -bodyW / 2, top, bodyW, hipY - top + 12, 30); fs(ctx, null, 5);
  }
  if (C.chain) {
    ctx.beginPath(); ctx.arc(8, top + 4, 26, 0.35, Math.PI - 0.35); ctx.lineWidth = 6; ctx.strokeStyle = '#ffd23f'; ctx.stroke();
    circle(ctx, 8, top + 32, 9); fs(ctx, '#ffd23f', 3);
  }
  if (o.wet) {
    for (let i = 0; i < 4; i++) { const yy = top + ((t * 120 + i * 37) % 140); ell(ctx, -20 + i * 14, yy, 3, 6); fs(ctx, '#8fd3ff', 0); }
  }

  // raised front arm goes behind the head so it never covers the face
  const frontRaised = Array.isArray(arms[1]) && armPts(arms[1], 1)[2][1] < shY - 25;
  let frontHand;
  if (frontRaised) {
    frontHand = drawArm(arms[1], 1, false);
    if (o.prop) { ctx.save(); ctx.translate(frontHand[0], frontHand[1]); o.prop(ctx); ctx.restore(); }
  }
  // head
  const hy = top - R + 8 + (o.headBob || 0);
  ctx.save();
  ctx.translate(0, hy);
  if (o.headTilt) ctx.rotate(o.headTilt);
  drawHead(ctx, C, o, t, R);
  ctx.restore();

  // front arm
  if (!frontRaised) {
    frontHand = drawArm(arms[1], 1, false);
    if (o.prop) { ctx.save(); ctx.translate(frontHand[0], frontHand[1]); o.prop(ctx); ctx.restore(); }
  }
  ctx.restore(); // torso

  // anchor: head top in screen space
  const m = ctx.getTransform();
  const hx = 0, hty = hy - R - 22;
  const anchor = [m.a * hx + m.c * hty + m.e, m.b * hx + m.d * hty + m.f];
  const handM = [m.a * frontHand[0] + m.c * frontHand[1] + m.e, m.b * frontHand[0] + m.d * frontHand[1] + m.f];
  ctx.restore();
  return { head: anchor, hand: handM };
}

export function darken(hex, f = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

function drawHead(ctx, C, o, t, R) {
  const expr = o.expr || 'normal';
  // bun behind head
  if (C.hair === 'bun') { circle(ctx, -R * 0.7, -R * 0.72, R * 0.36); fs(ctx, C.hairC, 5); }
  if (C.hair === 'curly') { for (let i = 0; i < 7; i++) { const a = Math.PI + 0.2 + i * 0.45; circle(ctx, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.32); fs(ctx, C.hairC, 5); } }
  // ear
  circle(ctx, -R * 0.62, 6, 14); fs(ctx, C.skin, 5);
  circle(ctx, -R * 0.62, 6, 6); fs(ctx, darken(C.skin, 0.85), 0);
  // head
  circle(ctx, 0, 0, R); fs(ctx, C.skin, 5);
  if (o.mask === 'bag') { drawBag(ctx, R, t); return; }
  // wrinkles
  if (C.wrinkles) { ctx.beginPath(); ctx.arc(18, -R * 0.55, 14, 0.3, Math.PI - 0.3); ctx.lineWidth = 3; ctx.strokeStyle = darken(C.skin, 0.7); ctx.stroke(); }
  // blush
  ctx.save(); ctx.globalAlpha = expr === 'angry' ? 0.5 : 0.25; ell(ctx, R * 0.72, 18, 12, 8); fs(ctx, '#ff4d6d', 0); ctx.restore();
  if (o.mask === 'bandit') {
    ctx.beginPath(); ctx.moveTo(-R * 0.98, -24); ctx.lineTo(R * 0.99, -30); ctx.lineTo(R * 0.99, 2); ctx.lineTo(-R * 0.98, 0); ctx.closePath();
    ctx.save(); circle(ctx, 0, 0, R - 2); ctx.clip(); ctx.beginPath(); ctx.rect(-R, -32, 2 * R, 32); fs(ctx, '#111', 0); ctx.restore();
    const fl = Math.sin(t * 14) * 6;
    ctx.beginPath(); ctx.moveTo(-R * 0.95, -22); ctx.lineTo(-R * 1.5, -30 + fl); ctx.lineTo(-R * 1.45, -14 + fl); ctx.lineTo(-R * 0.95, -8); ctx.closePath(); fs(ctx, '#111', 4);
  }
  // eyes
  const big = C.eyes === 'big';
  const erx = big ? 15 : 12.5, ery = big ? 19 : 16;
  const ex1 = 4, ex2 = 34, ey = -14;
  const lk = o.look || [0.3, 0];
  let blink = o.blink;
  if (blink == null) { const bt = (t + (C.name.length * 0.37)) % 3.7; blink = bt < 0.12; }
  const eyeOpen = expr === 'sleep' ? 0.08 : expr === 'bored' ? 0.5 : blink ? 0.1 : 1;
  for (const ex of [ex1, ex2]) {
    if (expr === 'dead') {
      line(ctx, ex - 10, ey - 10, ex + 10, ey + 10, 5); line(ctx, ex + 10, ey - 10, ex - 10, ey + 10, 5); continue;
    }
    if (expr === 'happy2' || expr === 'laugh') {
      ctx.beginPath(); ctx.arc(ex, ey + 6, 11, Math.PI + 0.3, -0.3); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); continue;
    }
    ell(ctx, ex, ey, erx, ery * eyeOpen); fs(ctx, '#fff', 4);
    if (eyeOpen > 0.3) {
      const pr = expr === 'shock' ? 4 : big ? 8 : 7;
      const px = ex + lk[0] * 5 + (expr === 'scared' ? Math.sin(t * 40) * 1.5 : 0), py = ey + lk[1] * 6;
      circle(ctx, px, py, pr); fs(ctx, '#1b1030', 0);
      circle(ctx, px + 2.5, py - 3, pr * 0.35); fs(ctx, '#fff', 0);
    }
    if (expr === 'bored' || expr === 'sleep') { ctx.beginPath(); ctx.moveTo(ex - erx - 2, ey - ery * eyeOpen + 1); ctx.lineTo(ex + erx + 2, ey - ery * eyeOpen + 1); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); }
  }
  // brows
  const by = ey - ery - 8;
  const brow = (x, inner) => {
    let a = 0, dy = 0;
    if (expr === 'angry') a = inner ? 0.45 : -0.45;
    else if (expr === 'scared' || expr === 'sad' || expr === 'worried') a = inner ? -0.4 : 0.4;
    else if (expr === 'shock') dy = -10;
    else if (expr === 'smug') a = inner ? 0.2 : -0.1;
    ctx.save(); ctx.translate(x, by + dy); ctx.rotate(a * (x < 19 ? 1 : -1));
    line(ctx, -11, 0, 11, 0, C.hair === 'bald' || C.hairC === '#eeeeee' ? 5 : 6, C.hairC === '#eeeeee' ? '#bbb' : '#1b1030');
    ctx.restore();
  };
  if (!(C.glasses === 'shades' || C.glasses === 'gold') || o.noGlasses) { brow(ex1, false); brow(ex2, true); }
  // glasses
  if (C.glasses && !o.noGlasses) {
    if (C.glasses === 'shades' || C.glasses === 'gold') {
      const fc = C.glasses === 'gold' ? '#ffd23f' : '#111';
      ctx.beginPath(); ctx.moveTo(ex1 - 20, ey - 14); ctx.lineTo(ex2 + 22, ey - 16); ctx.lineTo(ex2 + 18, ey + 8);
      ctx.quadraticCurveTo(ex2, ey + 18, ex2 - 10, ey + 6); ctx.lineTo(ex1 + 12, ey + 6);
      ctx.quadraticCurveTo(ex1, ey + 18, ex1 - 16, ey + 8); ctx.closePath();
      fs(ctx, '#15121c', 4, fc);
      line(ctx, ex1 - 8, ey - 6, ex1 + 2, ey + 4, 4, 'rgba(255,255,255,0.7)');
      line(ctx, ex2 - 2, ey - 8, ex2 + 6, ey, 4, 'rgba(255,255,255,0.7)');
      line(ctx, ex1 - 20, ey - 12, -R * 0.62, -2, 5, fc);
      if (expr === 'angry' || expr === 'shock') { brow(ex1, false); brow(ex2, true); }
    } else if (C.glasses === 'round') {
      for (const ex of [ex1, ex2]) { circle(ctx, ex, ey, 17); ctx.lineWidth = 4; ctx.strokeStyle = '#6b4226'; ctx.stroke(); }
      line(ctx, ex1 + 17, ey, ex2 - 17, ey, 4, '#6b4226');
    } else if (C.glasses === 'square') {
      for (const ex of [ex1, ex2]) { rr(ctx, ex - 16, ey - 13, 32, 26, 5); ctx.lineWidth = 4; ctx.strokeStyle = '#222'; ctx.stroke(); }
      line(ctx, ex1 + 16, ey, ex2 - 16, ey, 4, '#222');
    }
  }
  // nose
  ctx.beginPath(); ctx.arc(R * 0.72, 6, 9, -1.2, 1.4); ctx.lineWidth = 4; ctx.strokeStyle = darken(C.skin, 0.7); ctx.stroke();
  if (C.bindi) { circle(ctx, 19, -40, 5); fs(ctx, '#d00000', 0); }
  // mouth
  const mx = 24, my = 30, m = clamp(o.mouth || 0);
  if (m > 0.05 || expr === 'shock' || expr === 'yell') {
    const mm = Math.max(m, expr === 'shock' ? 0.7 : expr === 'yell' ? 0.9 : 0);
    const w = expr === 'yell' ? 22 : 13 + mm * 5, h = 4 + mm * 16;
    ell(ctx, mx, my, w, h); fs(ctx, '#5a0f24', 4);
    ctx.save(); ell(ctx, mx, my, w, h); ctx.clip(); ell(ctx, mx + 2, my + h * 0.8, w * 0.7, h * 0.55); fs(ctx, '#ff6b81', 0); ctx.restore();
  } else {
    ctx.beginPath();
    if (expr === 'sad' || expr === 'worried' || expr === 'scared') ctx.arc(mx, my + 12, 12, Math.PI + 0.5, -0.5);
    else if (expr === 'angry') { ctx.moveTo(mx - 12, my + 2); ctx.lineTo(mx + 12, my - 2); }
    else if (expr === 'bored' || expr === 'dead') { ctx.moveTo(mx - 10, my); ctx.lineTo(mx + 10, my); }
    else if (expr === 'smug') { ctx.moveTo(mx - 10, my); ctx.quadraticCurveTo(mx + 6, my + 6, mx + 16, my - 8); }
    else if (expr === 'sleep') { ell(ctx, mx, my, 5, 4); }
    else ctx.arc(mx, my - 8, 14, 0.4, Math.PI - 0.4);
    ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
  }
  if (C.mustache) {
    ctx.beginPath();
    ctx.moveTo(mx, my - 14);
    ctx.bezierCurveTo(mx - 14, my - 26, mx - 34, my - 12, mx - 30, my - 2);
    ctx.bezierCurveTo(mx - 22, my - 12, mx - 10, my - 8, mx, my - 6);
    ctx.bezierCurveTo(mx + 10, my - 8, mx + 24, my - 12, mx + 32, my - 2);
    ctx.bezierCurveTo(mx + 36, my - 12, mx + 16, my - 26, mx, my - 14);
    fs(ctx, C.hairC === '#d9d9d9' ? '#e8e8e8' : '#1b1b1b', 3);
  }
  if (o.beard > 0) {
    const L = o.beard * 150;
    ctx.beginPath();
    ctx.moveTo(-R * 0.3, 26);
    ctx.quadraticCurveTo(-6, R + L * 0.5, 18, R + L);
    ctx.quadraticCurveTo(38, R + L * 0.5, R * 0.8, 24);
    ctx.quadraticCurveTo(mx, my + 20, mx - 20, my + 4);
    ctx.closePath(); fs(ctx, '#dcdcdc', 4);
  }
  // hair
  drawHair(ctx, C, R, t);
  if (o.bandage) {
    ctx.save(); circle(ctx, 0, 0, R + 1); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.fillRect(-R, -R * 0.62, 2 * R, 18); ctx.restore();
    rr(ctx, -R, -R * 0.62, 2 * R, 18, 4); fs(ctx, null, 3);
    ctx.save(); ctx.translate(R * 0.5, 30); ctx.rotate(0.6); rr(ctx, -14, -5, 28, 10, 3); fs(ctx, '#f6d7b0', 2); ctx.rotate(-1.2); rr(ctx, -14, -5, 28, 10, 3); fs(ctx, '#f6d7b0', 2); ctx.restore();
  }
}

function drawHair(ctx, C, R, t) {
  const hc = C.hairC;
  switch (C.hair) {
    case 'spiky': {
      ctx.beginPath();
      ctx.moveTo(-R * 0.98, 4);
      const pts = [[-R * 1.25, -R * 0.35], [-R * 0.85, -R * 0.5], [-R * 1.05, -R * 0.95], [-R * 0.45, -R * 0.9], [-R * 0.5, -R * 1.35], [0, -R * 1.0], [R * 0.2, -R * 1.4], [R * 0.45, -R * 0.95], [R * 0.95, -R * 1.15], [R * 0.8, -R * 0.62], [R * 1.12, -R * 0.5], [R * 0.7, -R * 0.4]];
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.quadraticCurveTo(R * 0.2, -R * 0.62, -R * 0.35, -R * 0.35);
      ctx.quadraticCurveTo(-R * 0.6, -R * 0.1, -R * 0.75, 12);
      ctx.closePath(); fs(ctx, hc, 5);
      line(ctx, -R * 0.2, -R * 0.95, R * 0.1, -R * 0.75, 4, 'rgba(255,255,255,0.25)');
      break;
    }
    case 'cap': {
      // backwards cap
      ctx.beginPath(); ctx.arc(0, -6, R * 1.02, Math.PI + 0.12, -0.12); ctx.quadraticCurveTo(0, -R * 0.42, -R * 1.0, -R * 0.12); ctx.closePath(); fs(ctx, C.capC, 5);
      ell(ctx, -R * 1.05, -R * 0.2, R * 0.48, R * 0.13, -0.25); fs(ctx, darken(C.capC, 0.8), 5);
      circle(ctx, 0, -R * 1.07, 6); fs(ctx, darken(C.capC, 0.8), 3);
      // front tuft
      ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.62); ctx.lineTo(R * 0.85, -R * 0.42); ctx.lineTo(R * 0.6, -R * 0.38); ctx.lineTo(R * 0.72, -R * 0.24); ctx.lineTo(R * 0.4, -R * 0.4); ctx.closePath(); fs(ctx, hc, 4);
      break;
    }
    case 'bun': {
      ctx.beginPath(); ctx.arc(0, 0, R * 1.0, Math.PI - 0.15, -0.35);
      ctx.quadraticCurveTo(R * 0.35, -R * 0.55, 0, -R * 0.58); ctx.quadraticCurveTo(-R * 0.6, -R * 0.4, -R * 0.82, R * 0.3);
      ctx.closePath(); fs(ctx, hc, 5);
      if (C.nurseCap) { ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 0.75); ctx.lineTo(R * 0.4, -R * 0.95); ctx.lineTo(R * 0.3, -R * 1.25); ctx.lineTo(-R * 0.45, -R * 1.1); ctx.closePath(); fs(ctx, '#fff', 4); line(ctx, -R * 0.05, -R * 1.12, -R * 0.05, -R * 0.9, 4, '#e63946'); line(ctx, -R * 0.17, -R * 1.0, R * 0.08, -R * 1.03, 4, '#e63946'); }
      break;
    }
    case 'policecap': {
      ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.45); ctx.lineTo(-R * 1.05, -R * 1.1); ctx.quadraticCurveTo(0, -R * 1.45, R * 1.05, -R * 1.05); ctx.lineTo(R * 0.92, -R * 0.45); ctx.closePath(); fs(ctx, '#c9a66b', 5);
      rr(ctx, -R * 0.98, -R * 0.62, R * 1.92, R * 0.22, 6); fs(ctx, '#d62828', 4);
      ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.45); ctx.quadraticCurveTo(R * 1.2, -R * 0.5, R * 1.4, -R * 0.3); ctx.lineTo(R * 0.6, -R * 0.33); ctx.closePath(); fs(ctx, '#2b1d14', 4);
      starPath(ctx, R * 0.25, -R * 0.85, 12, 5); fs(ctx, '#ffd23f', 3);
      break;
    }
    case 'bald': {
      line(ctx, -R * 0.2, -R * 0.7, R * 0.15, -R * 0.82, 7, 'rgba(255,255,255,0.55)');
      for (const [x, y] of [[-R * 0.75, -R * 0.25], [-R * 0.85, R * 0.0], [-R * 0.55, -R * 0.4]]) { circle(ctx, x, y, R * 0.2); fs(ctx, hc, 4); }
      break;
    }
    case 'side': {
      ctx.beginPath(); ctx.arc(0, 0, R * 1.02, Math.PI - 0.1, -0.25);
      ctx.quadraticCurveTo(R * 0.5, -R * 0.75, R * 0.1, -R * 0.62); ctx.quadraticCurveTo(-R * 0.4, -R * 0.62, -R * 0.62, -R * 0.2);
      ctx.lineTo(-R * 0.75, R * 0.25); ctx.closePath(); fs(ctx, hc, 5);
      line(ctx, -R * 0.15, -R * 0.98, R * 0.1, -R * 0.66, 3, 'rgba(255,255,255,0.3)');
      break;
    }
    case 'curly': {
      for (let i = 0; i < 6; i++) { const a = Math.PI + 0.35 + i * 0.5; circle(ctx, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, R * 0.3); fs(ctx, hc, 4); }
      break;
    }
  }
}

function drawBag(ctx, R, t) {
  // paper bag over the head, eye holes misaligned
  ctx.beginPath();
  ctx.moveTo(-R * 1.05, R * 0.95);
  ctx.lineTo(-R * 1.15, -R * 1.05);
  const n = 7;
  for (let i = 0; i <= n; i++) ctx.lineTo(-R * 1.15 + (i * 2.3 * R) / n, -R * 1.05 - (i % 2 ? 22 : 0));
  ctx.lineTo(R * 1.05, R * 0.95);
  ctx.closePath(); fs(ctx, '#c8a26b', 5);
  line(ctx, -R * 0.6, -R * 0.6, -R * 0.5, R * 0.6, 3, '#a8834f');
  line(ctx, R * 0.5, -R * 0.8, R * 0.55, R * 0.5, 3, '#a8834f');
  ell(ctx, -6, -18, 11, 13); fs(ctx, '#140b06', 3);
  ell(ctx, 36, 6, 8, 10); fs(ctx, '#140b06', 3);
  // eyes peeking through holes
  circle(ctx, -4, -16, 4); fs(ctx, '#fff', 0);
  circle(ctx, 37, 8, 3); fs(ctx, '#fff', 0);
  line(ctx, 8, 44, 34, 40, 5);
}
