// New scenes for the 10-minute cut: fast travel, costume shop, breaking news, Dadi post-credits.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, sparkle, dust, iris, pow, vgrad, starPath, fadeRect, TAU, sweat } from '../engine.mjs';
import { sky, skyline, street, room } from '../bg.mjs';
import { sportsCar, jeep, streetLamp, megaphone, palm } from '../props.mjs';
import { wanted, money, minimap, popup, chapterCard } from '../hud.mjs';
import { CHARS } from '../characters.mjs';
import { cowboyHat, bigMustache, cape, chestEmblem, sehra, afro, discoGlasses, scissors } from '../accessories.mjs';
import { loading } from './s_intro.mjs';
import { interior as bankInterior } from './s_bank.mjs';

// ======================================================= FAST TRAVEL
function cityMap(ctx, t, o) {
  const x0 = 80, y0 = 150, w = 1340, h = 860;
  ctx.save(); rr(ctx, x0, y0, w, h, 24); ctx.clip();
  ctx.fillStyle = '#2b8fd6'; ctx.fillRect(x0, y0, w, h);
  for (let i = 0; i < 12; i++) line(ctx, x0 + 40 + i * 50, y0 + 60 + (i % 3) * 200 + Math.sin(t + i) * 4, x0 + 80 + i * 50, y0 + 60 + (i % 3) * 200 + Math.sin(t + i) * 4, 3, 'rgba(255,255,255,0.35)');
  // land
  ctx.beginPath(); ctx.moveTo(x0 + 330, y0 - 20); ctx.lineTo(x0 + w + 20, y0 - 20); ctx.lineTo(x0 + w + 20, y0 + h + 20); ctx.lineTo(x0 + 250, y0 + h + 20);
  ctx.quadraticCurveTo(x0 + 200, y0 + 600, x0 + 300, y0 + 450); ctx.quadraticCurveTo(x0 + 380, y0 + 250, x0 + 330, y0 - 20); ctx.closePath(); fs(ctx, '#f1e3b5', 5);
  // districts
  const blocks = [[480, 80, 260, 200, '#ffadad'], [780, 60, 300, 230, '#caffbf'], [1120, 80, 260, 260, '#bdb2ff'], [430, 330, 300, 240, '#fdffb6'], [780, 340, 320, 210, '#9bf6ff'], [1140, 380, 240, 200, '#ffc6ff'], [420, 610, 330, 220, '#caffbf'], [800, 600, 280, 230, '#ffd6a5'], [1130, 620, 260, 210, '#a0c4ff']];
  for (const [bx, by, bw, bh, c] of blocks) { rr(ctx, x0 + bx, y0 + by, bw, bh, 14); fs(ctx, c, 3); }
  // roads
  for (const yy of [300, 585]) { line(ctx, x0 + 300, y0 + yy, x0 + w, y0 + yy, 26, '#555'); line(ctx, x0 + 300, y0 + yy, x0 + w, y0 + yy, 3, '#ffd23f'); }
  for (const xx of [760, 1110]) { line(ctx, x0 + xx, y0, x0 + xx, y0 + h, 26, '#555'); line(ctx, x0 + xx, y0, x0 + xx, y0 + h, 3, '#ffd23f'); }
  ctx.restore();
  rr(ctx, x0, y0, w, h, 24); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
  const pins = [
    ['POOL PARTY', 1250, 470, '#ff4fa3', 'here'], ['GARAGE', 600, 720, '#1dd3b0', 'home'], ['BANK', 930, 170, '#ffd23f', 'bank'],
    ['HOSPITAL', 1250, 180, '#ff5d5d', 'plus'], ['MUMMY KA GHAR', 600, 440, '#e63946', 'danger'],
  ];
  for (const [label, px, py, col, kind] of pins) {
    const X = x0 + px, Y = y0 + py;
    if (kind === 'danger') { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); circle(ctx, X, Y, 90); ctx.fillStyle = '#ff0000'; ctx.fill(); ctx.restore(); }
    const sel = o.selected === label;
    const sc = sel ? 1.25 + Math.sin(t * 8) * 0.06 : 1;
    ctx.save(); ctx.translate(X, Y); ctx.scale(sc, sc);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-30, -40, -30, -70, 0, -70); ctx.bezierCurveTo(30, -70, 30, -40, 0, 0); fs(ctx, col, 5);
    circle(ctx, 0, -46, 13); fs(ctx, '#fff', 3);
    if (kind === 'here') { ctx.beginPath(); ctx.moveTo(0, -57); ctx.lineTo(8, -40); ctx.lineTo(-8, -40); ctx.closePath(); fs(ctx, '#ff4fa3', 0); }
    ctx.restore();
    txt(ctx, label, X, Y + 32, { size: 30, font: 'Bangers', fill: '#fff', lw: 7 });
  }
  if (o.route) {
    ctx.save(); ctx.setLineDash([22, 14]); ctx.lineDashOffset = -t * 60;
    ctx.beginPath(); ctx.moveTo(x0 + 1250, y0 + 470); ctx.lineTo(x0 + 1110, y0 + 585); ctx.lineTo(x0 + 760, y0 + 585); ctx.lineTo(x0 + 600, y0 + 700);
    ctx.lineWidth = 10; ctx.strokeStyle = '#ff4fa3'; ctx.stroke(); ctx.restore();
  }
}
function mapFrame(ctx, t) {
  ctx.fillStyle = '#140b2e'; ctx.fillRect(0, 0, W, H);
  const tabs = ['MAP', 'MISSIONS', 'STATS', 'SETTINGS'];
  tabs.forEach((s, i) => {
    rr(ctx, 80 + i * 260, 40, 240, 80, 14); fs(ctx, i === 0 ? '#ff4fa3' : '#2c1d4d', 4, '#fff');
    txt(ctx, s, 200 + i * 260, 82, { size: 44, font: 'Bangers', fill: '#fff', lw: 0 });
  });
  rr(ctx, 1460, 150, 380, 860, 24); fs(ctx, '#2c1d4d', 6, '#fff');
  txt(ctx, 'PALM BAY CITY', 1650, 210, { size: 48, font: 'Lucky', fill: '#ffd23f', lw: 8 });
  const stats = [['Wanted', '★★★'], ['Paisa', '₹0'], ['Mission', 'Bank job'], ['Mummy ka mood', 'DANGER']];
  stats.forEach(([k, v], i) => {
    txt(ctx, k, 1500, 300 + i * 110, { size: 34, font: 'BalooB', fill: '#bbb', align: 'left', lw: 0 });
    if (k === 'Wanted') { for (let j = 0; j < 3; j++) { starPath(ctx, 1520 + j * 50, 345 + i * 110, 20, 9); fs(ctx, '#ffd23f', 3); } return; }
    txt(ctx, v, 1500, 345 + i * 110, { size: 42, font: 'BalooX', fill: i === 3 ? '#ff5d5d' : '#fff', align: 'left', lw: 0 });
  });
}
function cursor(ctx, x, y, press) {
  ctx.save(); ctx.translate(x, y); const s = press ? 0.85 : 1; ctx.scale(s * 1.3, s * 1.3);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 60); ctx.lineTo(16, 46); ctx.lineTo(28, 72); ctx.lineTo(38, 66); ctx.lineTo(26, 42); ctx.lineTo(46, 40); ctx.closePath(); fs(ctx, '#fff', 4);
  ctx.restore();
}
const LOAD0 = 11.8, LOAD_OFF = 2.0;
export const fasttravel = {
  id: 'fasttravel',
  dur: 26,
  fadeIn: 0.6, fadeOut: 0,
  music: [[0, LOAD0, 'loading', 0.4], [LOAD0, 26, 'loading', 0.5]],
  sfx: [[0.4, 'whoosh'], [3.6, 'click'], [10.4, 'pop'], [11.2, 'click'], [LOAD0, 'whoosh'], [17.9, 'grunt'], [18.8, 'push'], [19.4, 'ding']],
  lines: [
    { t: 1.0, who: 'bunty', text: 'Garage door hai. Fast travel karte hain!', hi: 'गैराज दूर है। फ़ास्ट ट्रैवल करते हैं!', dur: 3.4 },
    { t: 4.6, who: 'chintu', text: 'Bhai, fast travel ka loading screen yaad hai na?', hi: 'भाई, फ़ास्ट ट्रैवल का लोडिंग स्क्रीन याद है ना?', dur: 3.6 },
    { t: 8.4, who: 'bunty', text: 'Is baar jaldi hoga. Trust me!', hi: 'इस बार जल्दी होगा। ट्रस्ट मी!', dur: 2.8 },
    { t: 17.3, who: 'chintu', text: 'Phir se 99 pe atak gaya!', hi: 'फिर से निन्यानवे पे अटक गया!', dur: 2.6 },
    { t: 20.3, who: 'bunty', text: 'Dekha? Ekdum fast!', hi: 'देखा? एकदम फ़ास्ट!', dur: 2.2 },
    { t: 22.7, who: 'chintu', text: '...haan bhai. Bilkul.', hi: '...हाँ भाई। बिल्कुल।', dur: 2.2 },
  ],
  draw(ctx, t, S) {
    if (t < LOAD0) {
      const z = lerp(1.15, 1, ease.out(clamp(t / 0.8)));
      ctx.save(); camera(ctx, t, { zoom: z });
      mapFrame(ctx, t);
      cityMap(ctx, t, { selected: t > 3.6 ? 'GARAGE' : null, route: t > 3.6 });
      ctx.restore();
      const cx = keys(t, [[1.2, 1400], [3.4, 680], [9.6, 680], [10.9, 800]], ease.inOut), cy = keys(t, [[1.2, 950], [3.4, 860], [9.6, 860], [10.9, 625]], ease.inOut);
      if (t > 10.2) {
        const p = ease.back(clamp((t - 10.2) / 0.3));
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(p, p);
        rr(ctx, -400, -170, 800, 340, 30); fs(ctx, '#2c1d4d', 8, '#ff4fa3');
        txt(ctx, 'FAST TRAVEL: GARAGE?', 0, -80, { size: 56, fill: '#fff', lw: 0 });
        txt(ctx, 'Kharcha: ₹0  |  Time: "bas 2 second"', 0, -10, { size: 34, font: 'BalooB', fill: '#bbb', lw: 0 });
        rr(ctx, -300, 50, 260, 90, 20); fs(ctx, t > 11.2 ? '#7dff6a' : '#1dd3b0', 5, '#fff'); txt(ctx, 'HAAN', -170, 98, { size: 50, fill: '#1b1030', lw: 0 });
        rr(ctx, 40, 50, 260, 90, 20); fs(ctx, '#e63946', 5, '#fff'); txt(ctx, 'NAHI', 170, 98, { size: 50, fill: '#fff', lw: 0 });
        ctx.restore();
      }
      cursor(ctx, cx, cy, (t > 3.5 && t < 3.7) || (t > 11.1 && t < 11.3));
      return;
    }
    const lt = t - LOAD0 + LOAD_OFF;
    loading.draw.call({ tips: [[0, 'TIP: Fast travel kabhi fast nahi hota.'], [6.5, 'TIP: Agar loading atak jaaye... dost ko bhejo.']] }, ctx, lt, S);
  },
  post(ctx, t) { iris(ctx, ease.in(clamp((t - 24.9) / 1.1)), W / 2, H / 2); },
};

// ======================================================= COSTUME SHOP
const GY = 900;
const OUTFITS = [[12.4, 'cowboy'], [15.8, 'hero'], [19.2, 'sehra'], [22.6, 'disco'], [26.0, 'bandit']];
function outfitAt(t) { let o = null; for (const [tt, k] of OUTFITS) if (t >= tt) o = k; return o; }
function shop(ctx, t) {
  room(ctx, { wall: '#5b2a86', floor: '#8d6e63', trim: '#3d1f5c', floorY: 800, stripes: 'rgba(255,255,255,0.05)' });
  // sign
  rr(ctx, 560, 40, 800, 110, 20); fs(ctx, '#ffd23f', 7);
  txt(ctx, 'BHOLA COSTUME CENTRE', 960, 98, { size: 60, fill: '#e63946', lw: 0 });
  for (let i = 0; i < 12; i++) { circle(ctx, 580 + i * 69, 40, 9); fs(ctx, Math.floor(t * 4 + i) % 2 ? '#fff' : '#ff4fa3', 2); }
  // shelves with hats/masks
  for (let r = 0; r < 3; r++) {
    rr(ctx, 60, 230 + r * 150, 640, 18, 4); fs(ctx, '#a1887f', 4);
    for (let k = 0; k < 5; k++) {
      const x = 110 + k * 125, y = 225 + r * 150, kind = (r * 5 + k) % 4;
      if (kind === 0) { ell(ctx, x, y - 6, 46, 10); fs(ctx, '#8d5524', 4); rr(ctx, x - 24, y - 50, 48, 44, 10); fs(ctx, '#a0682e', 4); }
      if (kind === 1) { ell(ctx, x, y - 30, 34, 26); fs(ctx, ['#ff4fa3', '#4cc9f0', '#ffd23f'][r], 4); circle(ctx, x - 12, y - 32, 7); fs(ctx, '#111', 0); circle(ctx, x + 12, y - 32, 7); fs(ctx, '#111', 0); }
      if (kind === 2) { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x, y - 60); ctx.lineTo(x + 30, y); ctx.closePath(); fs(ctx, '#90be6d', 4); circle(ctx, x, y - 62, 8); fs(ctx, '#ffd23f', 3); }
      if (kind === 3) { rr(ctx, x - 36, y - 26, 72, 22, 10); fs(ctx, '#111', 4); }
    }
  }
  // costume rack
  line(ctx, 760, 260, 1120, 260, 10, '#999'); line(ctx, 780, 260, 780, 800, 8, '#999'); line(ctx, 1100, 260, 1100, 800, 8, '#999');
  ['#e63946', '#ffd23f', '#1dd3b0', '#ff4fa3', '#4cc9f0', '#f4a261'].forEach((c, i) => { const x = 810 + i * 52; ctx.beginPath(); ctx.moveTo(x, 270); ctx.lineTo(x - 26, 330); ctx.lineTo(x - 22, 560); ctx.lineTo(x + 22, 560); ctx.lineTo(x + 26, 330); ctx.closePath(); fs(ctx, c, 4); });
  // mirror
  rr(ctx, 1500, 200, 340, 640, 30); fs(ctx, '#ffd23f', 10);
  rr(ctx, 1520, 220, 300, 600, 22); fs(ctx, '#bfe7f2', 0);
}
function bunty_outfit_pre(ctx, outfit, x, y, s, face, t) { if (outfit === 'hero') cape(ctx, x, y, s, face, t); }
function bunty_outfit_post(ctx, outfit, r, x, y, s, face, t) {
  if (!r) return;
  if (outfit === 'cowboy') { cowboyHat(ctx, r.headC, r.headR, face); bigMustache(ctx, r.headC, r.headR, face); }
  if (outfit === 'hero') chestEmblem(ctx, x, y, s, face);
  if (outfit === 'sehra') sehra(ctx, r.headC, r.headR, face, t);
  if (outfit === 'disco') discoGlasses(ctx, r.headC, r.headR, face, t);
}
export const costume = {
  id: 'costume',
  dur: 46,
  fadeIn: 0.6, fadeOut: 1.2,
  music: [[0, 12.2, 'chill', 0.4], [12.2, 29.4, 'party', 0.32], [29.4, 46, 'sneaky', 0.3]],
  sfx: [[0.6, 'ding'], [12.4, 'whoosh'], [15.8, 'whoosh'], [19.2, 'whoosh'], [22.6, 'whoosh'], [26.0, 'whoosh'], [26.3, 'tada'], [30.0, 'kaching'], [33.2, 'crickets', { dur: 2 }], [37.5, 'snap'], [38.2, 'snap'], [40.0, 'pop']],
  lines: [
    { t: 1.4, who: 'bhola', text: 'Aaiye aaiye! Swagat hai, swagat hai!', hi: 'आइए आइए! स्वागत है, स्वागत है!', dur: 3.2 },
    { t: 6.0, who: 'bunty', text: 'Uncle, bank lootne ke liye koi disguise dikhao.', hi: 'अंकल, बैंक लूटने के लिए कोई डिस्गाइज़ दिखाओ।', dur: 3.6 },
    { t: 9.6, who: 'bhola', text: 'Bilkul! Ek se badhkar ek!', hi: 'बिल्कुल! एक से बढ़कर एक!', dur: 2.4 },
    { t: 12.9, who: 'chintu', text: 'Bhai, ye toh Western film hai.', hi: 'भाई, ये तो वेस्टर्न फ़िल्म है।', dur: 2.7 },
    { t: 16.2, who: 'bunty', text: 'Main hoon... CAPTAIN BUNTY!', hi: 'मैं हूँ... कैप्टन बंटी!', dur: 2.8 },
    { t: 19.6, who: 'chintu', text: 'Bhai, ye dakaiti hai, shaadi nahi!', hi: 'भाई, ये डकैती है, शादी नहीं!', dur: 2.8 },
    { t: 23.0, who: 'bhola', text: 'Ye 80s ka disco special hai!', hi: 'ये अस्सी का डिस्को स्पेशल है!', dur: 2.8 },
    { t: 26.4, who: 'bunty', text: 'Perfect! Ekdum professional dakait.', hi: 'परफ़ेक्ट! एकदम प्रोफ़ेशनल डकैत।', dur: 3.0 },
    { t: 29.6, who: 'bhola', text: 'Total huye... paanch sau rupaye.', hi: 'टोटल हुए... पाँच सौ रुपये।', dur: 3.0 },
    { t: 32.8, who: 'bunty', text: 'Uncle... udhaar chalega?', hi: 'अंकल... उधार चलेगा?', dur: 2.6 },
    { t: 35.6, who: 'bhola', text: 'Mask udhaar pe le jao. Aur tumhare dost ke liye... ye free wala.', hi: 'मास्क उधार पे ले जाओ। और तुम्हारे दोस्त के लिए... ये फ़्री वाला।', dur: 4.6 },
    { t: 40.6, who: 'chintu', text: 'Bhai... kuch dikh nahi raha.', hi: 'भाई... कुछ दिख नहीं रहा।', fx: 'muffle', dur: 2.8 },
  ],
  draw(ctx, t, S) {
    shop(ctx, t);
    const outfit = outfitAt(t);
    // Bhola behind the counter
    const bArms = t > 37.2 && t < 38.6 ? 'hold' : (t > 1.4 && t < 5.8 ? 'wave' : (t > 29.6 && t < 32.6 ? 'point' : (t > 38.6 && t < 40.2 ? 'grab' : 'idle')));
    S.c(ctx, 'bhola', { x: 360, y: 850, s: 1.2, arms: bArms, expr: t > 32.8 && t < 35.6 ? 'bored' : 'laugh', legs: 'hidden', prop: t > 37.2 && t < 38.6 ? c => scissors(c, 0, -10, 0.8, Math.abs(Math.sin(t * 12)) * 0.4) : null });
    rr(ctx, 130, 680, 480, 220, 10); fs(ctx, '#6d4c41', 6); rr(ctx, 110, 660, 520, 34, 8); fs(ctx, '#8d6e63', 5);
    txt(ctx, 'CASH', 370, 790, { size: 40, font: 'Bangers', fill: '#ffd23f', lw: 0 });
    // paper bag on the counter / flying to Chintu
    const bagOn = t > 40.0;
    if (t > 37.2 && t < 40.0) {
      const p = prog(38.9, 40.0, t);
      const bx = lerp(470, 980, p), by = lerp(640, 470, p) - Math.sin(p * Math.PI) * 150;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(p * 6); rr(ctx, -40, -50, 80, 100, 6); fs(ctx, '#c8a26b', 4); if (t > 38.2) { ell(ctx, -12, -10, 8, 10); fs(ctx, '#140b06', 0); ell(ctx, 16, 8, 6, 8); fs(ctx, '#140b06', 0); } ctx.restore();
    }
    // Chintu
    const cx = keys(t, [[0, -200], [1.8, 930]], ease.out);
    const cArms = t < 1.8 ? undefined : (t > 12.9 && t < 15.6 ? 'shrug' : (t > 19.6 && t < 22.4 ? 'flail' : (t > 40.6 ? 'flail' : 'idle')));
    S.c(ctx, 'chintu', { x: cx, y: GY, s: 1.3, walk: t < 1.8 ? t * 10 : undefined, arms: cArms, expr: t > 19.6 && t < 22.4 ? 'shock' : (t > 22.6 && t < 26 ? 'laugh' : 'worried'), mask: bagOn ? 'bag' : null });
    // Bunty in front of the mirror (+ reflection)
    const bx = keys(t, [[0, -400], [2.0, 760], [11.4, 760], [12.3, 1280], [32.4, 1280], [33.0, 1220]], ease.inOut);
    const walking = (t < 2.0) || (t > 11.4 && t < 12.3);
    const s = 1.35 * CHARS.bunty.base;
    let arms = walking ? undefined : 'idle', expr = 'smug';
    if (outfit === 'cowboy') { arms = 'hips'; expr = 'smug'; }
    if (outfit === 'hero') { arms = 'pointUp'; expr = 'laugh'; }
    if (outfit === 'sehra') { arms = 'shrug'; expr = 'laugh'; }
    if (outfit === 'disco') { arms = 'dance'; expr = 'laugh'; }
    if (outfit === 'bandit') { arms = t > 26.4 && t < 29.4 ? 'cheer' : 'hips'; expr = 'smug'; }
    if (t > 32.4 && t < 35.6) { arms = 'shrug'; expr = 'worried'; }
    if (t > 6.0 && t < 9.6) { arms = 'point'; }
    const flash = OUTFITS.some(([tt]) => t > tt - 0.12 && t < tt + 0.12);
    const bob = outfit === 'disco' ? -Math.abs(Math.sin(t * 8)) * 16 : 0;
    // reflection
    ctx.save(); rr(ctx, 1520, 220, 300, 600, 22); ctx.clip();
    if (bx > 1000) {
      const mx = 1520 + 300 / 2 + (1680 - bx) * 0.35;
      bunty_outfit_pre(ctx, outfit, mx, GY - 60, s * 0.8, -1, t);
      const rr2 = S.c(ctx, 'bunty', { x: mx, y: GY - 60, s: 1.08, face: -1, arms, expr, mask: outfit === 'bandit' || outfit === 'hero' ? 'bandit' : null, noAnchor: true, bob, alpha: 0.8 });
      bunty_outfit_post(ctx, outfit, rr2, mx, GY - 60, s * 0.8, -1, t);
      if (outfit === 'disco') afro(ctx, rr2.headC, rr2.headR);
    }
    ctx.globalAlpha = 0.35; line(ctx, 1540, 300, 1680, 220, 18, '#fff'); line(ctx, 1560, 380, 1760, 240, 8, '#fff');
    ctx.restore();
    bunty_outfit_pre(ctx, outfit, bx, GY + 20, s, 1, t);
    if (outfit === 'disco') { const g = { headC: [bx, GY + 20 + bob - 204 * s], headR: 60 * s }; afro(ctx, g.headC, g.headR); }
    const r = S.c(ctx, 'bunty', { x: bx, y: GY + 20, s: 1.35, arms, expr, walk: walking ? t * 10 : undefined, mask: outfit === 'bandit' || outfit === 'hero' ? 'bandit' : null, bob, prop: t > 32.4 && t < 35.6 ? null : null });
    bunty_outfit_post(ctx, outfit, r, bx, GY + 20, s, 1, t);
    // pockets out + moth
    if (t > 32.8 && t < 36.5) {
      for (const dx of [-40, 40]) { rr(ctx, bx + dx - 16, GY - 80, 32, 40, 8); fs(ctx, '#f1faee', 4); }
      const mp = prog(33.0, 36.0, t);
      const mx = bx + 20 + mp * 260, my = GY - 120 - mp * 300 + Math.sin(t * 20) * 14;
      ell(ctx, mx - 10, my, 14, 8 + Math.abs(Math.sin(t * 30)) * 8, -0.5); fs(ctx, '#bfa58a', 3); ell(ctx, mx + 10, my, 14, 8 + Math.abs(Math.sin(t * 30)) * 8, 0.5); fs(ctx, '#bfa58a', 3);
    }
    if (flash) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, 0, W, H); }
    wanted(ctx, 3, t); money(ctx, 0); minimap(ctx, t, { scroll: 0 });
  },
  post(ctx, t) {
    chapterCard(ctx, 'CHAPTER 3.5', 'Disguise Shopping', t - 0.6, 3.0);
    if (t > 12.3 && t < 29.6) {
      const idx = OUTFITS.filter(([tt]) => t >= tt).length;
      txt(ctx, `TRY ${idx}/5`, W - 90, 230, { size: 50, font: 'Bangers', fill: '#ffd23f', align: 'right', lw: 8 });
    }
  },
};

// ======================================================= BREAKING NEWS
function studio(ctx, t) {
  ctx.fillStyle = vgrad(ctx, 0, H, ['#061a40', '#0b3c7d', '#061a40']); ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.25;
  for (let i = 0; i < 18; i++) { const y = 80 + i * 40; line(ctx, 0, y, W, y + Math.sin(t + i) * 10, 2, '#4cc9f0'); }
  const R = rng(5); for (let i = 0; i < 80; i++) { circle(ctx, R() * 900, 100 + R() * 500, 3); fs(ctx, '#9bf6ff', 0); }
  ctx.restore();
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; ctx.beginPath(); const x = ((i * 380 + t * 80) % (W + 400)) - 200; ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x - 200, H); ctx.lineTo(x - 260, H); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
function newsDesk(ctx) {
  ctx.beginPath(); ctx.moveTo(80, 760); ctx.quadraticCurveTo(520, 700, 960, 760); ctx.lineTo(980, 900); ctx.lineTo(60, 900); ctx.closePath(); fs(ctx, '#e9ecef', 6);
  ctx.beginPath(); ctx.moveTo(80, 760); ctx.quadraticCurveTo(520, 700, 960, 760); ctx.lineTo(962, 790); ctx.quadraticCurveTo(520, 732, 78, 790); ctx.closePath(); fs(ctx, '#d62828', 0);
  rr(ctx, 400, 800, 240, 70, 14); fs(ctx, '#0b3c7d', 4); txt(ctx, 'PBN', 520, 836, { size: 52, fill: '#fff', lw: 0 });
}
function cctv(ctx, t, S, bankT, zoom = 1, zx = 960, zy = 540) {
  const x0 = 1000, y0 = 130, w = 840, h = 473;
  ctx.save(); rr(ctx, x0, y0, w, h, 14); ctx.clip();
  ctx.translate(x0, y0); ctx.scale(w / W, h / H);
  ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-zx, -zy);
  bankInterior(ctx, bankT, { ...S, anchors: {}, c: (c, who, o = {}) => S.c(c, who, { ...o, noAnchor: true }) });
  ctx.restore();
  ctx.save(); rr(ctx, x0, y0, w, h, 14); ctx.clip();
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(x0, y0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(40,80,40,0.18)'; ctx.fillRect(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y += 6) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0, y, w, 2); }
  txt(ctx, 'CAM 02', x0 + 30, y0 + 40, { size: 34, font: 'BalooX', fill: '#fff', align: 'left', lw: 6 });
  txt(ctx, `14:32:${String(Math.floor(t * 7) % 60).padStart(2, '0')}`, x0 + w - 30, y0 + 40, { size: 34, font: 'BalooX', fill: '#fff', align: 'right', lw: 6 });
  if (Math.floor(t * 2) % 2) { circle(ctx, x0 + w - 40, y0 + h - 40, 12); fs(ctx, '#ff2e2e', 0); txt(ctx, 'REC', x0 + w - 64, y0 + h - 38, { size: 30, font: 'BalooX', fill: '#fff', align: 'right', lw: 6 }); }
  ctx.restore();
  rr(ctx, x0, y0, w, h, 14); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
}
function lowerThird(ctx, t, headline) {
  const blink = Math.floor(t * 2) % 2;
  ctx.fillStyle = '#d62828'; ctx.fillRect(0, 900, 520, 80);
  txt(ctx, 'BREAKING NEWS', 260, 942, { size: 54, fill: blink ? '#fff' : '#ffd23f', lw: 0 });
  ctx.fillStyle = '#ffffff'; ctx.fillRect(520, 900, W - 520, 80);
  txt(ctx, headline, 560, 942, { size: 56, font: 'Lucky', fill: '#1b1030', align: 'left', lw: 0 });
  ctx.fillStyle = '#0b1d33'; ctx.fillRect(0, 980, W, 70);
  const tick = 'PALM BAY POLICE: "HUM UNHE PAKAD LENGE... HELMET PEHEN KE"  •  DADI JI KI GAADI AB BHI 200 KI SPEED PE  •  POOL PARTY MEIN NAYA DJ VIRAL  •  BHOLA COSTUME CENTRE PE SALE: PAPER BAG FREE  •  ';
  ctx.save(); ctx.beginPath(); ctx.rect(0, 980, W, 70); ctx.clip();
  ctx.font = '40px BalooX'; const tw = ctx.measureText(tick).width;
  const off = (t * 220) % tw;
  for (let k = 0; k < 3; k++) txt(ctx, tick, -off + k * tw, 1016, { size: 40, font: 'BalooX', fill: '#ffd23f', align: 'left', lw: 0 });
  ctx.restore();
  rr(ctx, 60, 50, 150, 64, 10); fs(ctx, '#d62828', 0); circle(ctx, 95, 82, 12); fs(ctx, blink ? '#fff' : '#ffb3b3', 0); txt(ctx, 'LIVE', 150, 84, { size: 40, font: 'Bangers', fill: '#fff', lw: 0 });
  txt(ctx, 'PBN 24x7', W - 60, 84, { size: 48, fill: '#fff', align: 'right', lw: 8 });
}
const INTERVIEW0 = 17.4, INTERVIEW1 = 24.6;
export const news = {
  id: 'news',
  dur: 34,
  fadeIn: 0.5, fadeOut: 0.6,
  music: [[0, 34, 'news', 0.35]],
  sfx: [[0.1, 'newsSting'], [8.4, 'zoom'], [INTERVIEW0, 'whoosh'], [INTERVIEW1, 'whoosh'], [30.5, 'newsSting']],
  lines: [
    { t: 1.0, who: 'anchor', text: 'Namaskar! Aap dekh rahe hain Palm Bay News.', hi: 'नमस्कार! आप देख रहे हैं पाम बे न्यूज़।', dur: 3.4 },
    { t: 4.6, who: 'anchor', text: 'Aaj shehar ke bank mein ek ajeeb dakaiti hui.', hi: 'आज शहर के बैंक में एक अजीब डकैती हुई।', dur: 3.6 },
    { t: 8.4, who: 'anchor', text: 'Dakait ke paas hathiyaar tha... ek kela.', hi: 'डकैत के पास हथियार था... एक केला।', dur: 3.6 },
    { t: 12.2, who: 'anchor', text: 'Unhone line mein lagkar, token lekar, apne hi account se pachaas rupaye loote.', hi: 'उन्होंने लाइन में लगकर, टोकन लेकर, अपने ही अकाउंट से पचास रुपये लूटे।', dur: 5.0 },
    { t: 17.8, who: 'police', text: 'Hum unhe zaroor pakdenge. Bas pehle... chai pee lein.', hi: 'हम उन्हें ज़रूर पकड़ेंगे। बस पहले... चाय पी लें।', dur: 4.0 },
    { t: 21.9, who: 'police', text: 'Aur haan... helmet zaroor pehnna!', hi: 'और हाँ... हेलमेट ज़रूर पहनना!', dur: 2.7 },
    { t: 24.9, who: 'anchor', text: 'Khabar likhe jaane tak, dakait ek auto mein faraar hain. Bane rahiye hamare saath!', hi: 'ख़बर लिखे जाने तक, डकैत एक ऑटो में फ़रार हैं। बने रहिए हमारे साथ!', dur: 5.4 },
  ],
  draw(ctx, t, S) {
    if (t >= INTERVIEW0 && t < INTERVIEW1) {
      sky(ctx, t, 'day', { horizon: 700 });
      skyline(ctx, 900, 700, t, { farC: '#7aa6d6', midC: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'] });
      street(ctx, 900, t, { groundY: 820 });
      rr(ctx, 160, 380, 520, 440, 8); fs(ctx, '#3a5a8c', 6); rr(ctx, 210, 300, 420, 90, 10); fs(ctx, '#1f3d99', 5); txt(ctx, 'POLICE STATION', 420, 346, { size: 46, font: 'Bangers', fill: '#fff', lw: 0 });
      const cup = c => { rr(c, -16, -30, 32, 36, 6); fs(c, '#fff', 4); ctx.save(); ctx.globalAlpha = 0.6; for (let k = 0; k < 3; k++) line(c, -8 + k * 8, -40 - Math.sin(t * 4 + k) * 6, -4 + k * 8, -70, 3, '#ddd'); ctx.restore(); };
      S.c(ctx, 'police', { x: 860, y: 900, s: 1.6, arms: t > 21.9 ? 'pointUp' : 'hold', expr: t > 21.9 ? 'angry' : 'smug', prop: t > 21.9 ? null : cup });
      // reporter's mic
      ctx.save(); ctx.translate(1180, 610); ctx.rotate(-0.3); line(ctx, 0, 0, 260, 60, 22, '#222'); circle(ctx, -6, -2, 30); fs(ctx, '#444', 5); rr(ctx, 20, -24, 60, 46, 6); fs(ctx, '#0b3c7d', 4); txt(ctx, 'PBN', 50, 0, { size: 24, font: 'Bangers', fill: '#fff', lw: 0 }); ctx.restore();
      ellipseHand(ctx);
      ctx.fillStyle = '#0b3c7d'; ctx.fillRect(0, 900, 760, 80); txt(ctx, 'POLICE UNCLE  |  Palm Bay Police', 40, 942, { size: 44, font: 'BalooX', fill: '#fff', align: 'left', lw: 0 });
      rr(ctx, 60, 50, 150, 64, 10); fs(ctx, '#d62828', 0); txt(ctx, 'LIVE', 150, 84, { size: 40, font: 'Bangers', fill: '#fff', lw: 0 }); circle(ctx, 95, 82, 12); fs(ctx, '#fff', 0);
      txt(ctx, 'PBN 24x7', W - 60, 84, { size: 48, fill: '#fff', align: 'right', lw: 8 });
      return;
    }
    studio(ctx, t);
    // inset screen
    if (t < 8.4) cctv(ctx, t, S, 6.0);
    else if (t < 12.2) cctv(ctx, t, S, 6.6, lerp(1, 2.4, ease.inOut(clamp((t - 8.4) / 1.2))), lerp(960, 560, ease.inOut(clamp((t - 8.4) / 1.2))), lerp(540, 700, ease.inOut(clamp((t - 8.4) / 1.2))));
    else if (t < INTERVIEW0) cctv(ctx, t, S, 43.4);
    else {
      const x0 = 1000, y0 = 130, w = 840, h = 473;
      ctx.save(); rr(ctx, x0, y0, w, h, 14); ctx.clip(); ctx.fillStyle = '#f1e3b5'; ctx.fillRect(x0, y0, w, h);
      for (const yy of [0.35, 0.7]) line(ctx, x0, y0 + h * yy, x0 + w, y0 + h * yy, 30, '#555');
      for (const xx of [0.3, 0.65]) line(ctx, x0 + w * xx, y0, x0 + w * xx, y0 + h, 30, '#555');
      const ax = x0 + ((t * 120) % w), ay = y0 + h * 0.7;
      circle(ctx, ax, ay, 22); fs(ctx, '#ffd23f', 5); txt(ctx, 'AUTO', ax, ay - 40, { size: 30, font: 'Bangers', fill: '#1b1030', lw: 6 });
      for (let k = 1; k < 4; k++) { circle(ctx, ax - k * 70, ay, 14); fs(ctx, Math.floor(t * 6 + k) % 2 ? '#ff2e4d' : '#3aa0ff', 3); }
      ctx.restore(); rr(ctx, x0, y0, w, h, 14); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke();
      txt(ctx, 'LIVE TRACKING', x0 + 30, y0 + 40, { size: 34, font: 'BalooX', fill: '#1b1030', align: 'left', lw: 0 });
    }
    // red circle on the banana
    if (t > 9.6 && t < 12.2) { ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = '#ff2e2e'; ell(ctx, 1440, 410, 150, 95, -0.2); ctx.stroke(); txt(ctx, 'HATHIYAAR?!', 1440, 260, { size: 50, fill: '#ff2e2e', lw: 8 }); ctx.restore(); }
    S.c(ctx, 'anchor', { x: 520, y: 950, s: 1.95, legs: 'hidden', arms: (t > 8.4 && t < 12) || (t > 24.9 && t < 28) ? 'point' : 'hold', expr: t > 8.4 && t < 12.2 ? 'shock' : 'smug', look: [0.2, 0.1] });
    newsDesk(ctx);
    const head = t < 12.2 ? 'BANK MEIN "BANANA" DAKAITI!' : (t < INTERVIEW0 ? 'DAKAIT NE LOOTE 50 RUPAYE (APNE HI)' : 'BANANA DAKAIT AUTO MEIN FARAAR!');
    lowerThird(ctx, t, head);
  },
};
function ellipseHand(ctx) {
  ctx.save(); ctx.translate(1420, 690); ctx.rotate(-0.3); circle(ctx, 0, 0, 26); fs(ctx, '#c68642', 5); ctx.restore();
}

// ======================================================= DADI POST-CREDITS
const GREEN = 10.4, ZOOM = 10.7;
function signal(ctx, x, y, state) {
  line(ctx, x, y, x, y - 420, 14, '#333');
  rr(ctx, x - 50, y - 600, 100, 260, 18); fs(ctx, '#222', 6);
  const cols = [['#ff2e2e', '#4a1010'], ['#ffd23f', '#4a3f10'], ['#4dff88', '#103a1f']];
  cols.forEach(([on, off], i) => { circle(ctx, x, y - 555 + i * 80, 30); fs(ctx, state === i ? on : off, 4); if (state === i) { ctx.save(); ctx.globalAlpha = 0.3; circle(ctx, x, y - 555 + i * 80, 60); ctx.fillStyle = on; ctx.fill(); ctx.restore(); } });
}
export const dadiPost = {
  id: 'dadipost',
  dur: 20,
  fadeIn: 0.5, fadeOut: 1.4,
  music: [[2.0, ZOOM, 'tense', 0.35], [ZOOM, 20, 'chase', 0.4]],
  sfx: [[0.3, 'whoosh'], [7.0, 'rev'], [8.0, 'rev'], [9.0, 'gulp'], [GREEN, 'ding'], [ZOOM, 'zoom'], [ZOOM + 0.1, 'skid'], [16.0, 'star']],
  lines: [
    { t: 3.0, who: 'police', text: 'Madam, itni raat ko itni tez gaadi?', hi: 'मैडम, इतनी रात को इतनी तेज़ गाड़ी?', dur: 3.4 },
    { t: 6.6, who: 'dadi', text: 'Race lagayega, beta?', hi: 'रेस लगाएगा, बेटा?', dur: 2.4 },
    { t: 12.2, who: 'police', text: '...Nahi madam. Main toh chai peene jaa raha hoon.', hi: '...नहीं मैडम। मैं तो चाय पीने जा रहा हूँ।', dur: 3.8 },
  ],
  draw(ctx, t, S) {
    sky(ctx, t, 'night', { horizon: 700, moonX: 300, moonY: 170 });
    skyline(ctx, 2600, 700, t, { night: true });
    street(ctx, 0, t, { groundY: 760, night: true });
    streetLamp(ctx, 300, 780, { s: 1, on: true });
    const state = t < 9.6 ? 0 : t < GREEN ? 1 : 2;
    signal(ctx, 1560, 800, state);
    // stop line
    for (let k = 0; k < 6; k++) { ctx.fillStyle = '#ddd'; ctx.fillRect(1180, 860 + k * 38, 24, 20); }
    jeep(ctx, 760, 965, { s: 1.15, t, driver: c => S.c(c, 'police', { x: 40, y: -40, s: 0.6, legs: 'hidden', arms: 'hold', expr: t > 9 && t < 10.6 ? 'scared' : (t > ZOOM ? 'shock' : 'worried'), look: [0.6, 0.8] }) });
    const cx = t < ZOOM ? 820 + (t > 6.8 && t < 9.6 ? Math.sin(t * 40) * 3 : 0) : 820 + Math.pow(t - ZOOM, 2) * 2600;
    if (cx < W + 900) {
      if (t > ZOOM && t < ZOOM + 1.5) { for (let k = 0; k < 6; k++) { const R = rng(Math.floor(t * 20) + k); circle(ctx, cx - 380 - R() * 120, 1040 - R() * 40, 20 + R() * 20); fs(ctx, R() < 0.5 ? '#ff9f1c' : '#ffd23f', 3); } }
      sportsCar(ctx, cx, 1070, { s: 1.35, color: '#e63946', wheelRot: t > ZOOM ? (t - ZOOM) ** 2 * 80 : 0, lights: true, driver: c => S.c(c, 'dadi', { x: 30, y: -20, s: 0.62, legs: 'hidden', arms: 'hold', expr: 'smug', look: [-0.6, -0.5] }) });
    }
    if (t > ZOOM && t < ZOOM + 1.6) dust(ctx, 700, 1050, t - ZOOM, 2.2, 3, '#776d8a');
    if (t > 9.0 && t < 10.6) sweat(ctx, 860, 640, t, 1.0);
  },
  post(ctx, t) {
    if (t > 0.3 && t < 2.6) {
      const p = ease.back(clamp((t - 0.3) / 0.35)), o = clamp((t - 2.2) / 0.4);
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(W / 2, 200); ctx.scale(p, p); ctx.rotate(-0.03);
      rr(ctx, -440, -80, 880, 160, 24); fs(ctx, '#ffd23f', 8); txt(ctx, 'UDHAR DUSRI TARAF...', 0, 6, { size: 76, fill: '#1b1030', lw: 0 });
      ctx.restore();
    }
    popup(ctx, 'DADI KA WANTED LEVEL: 6 STAR', t - 16.0, 3.0, '#9b5de5');
  },
};
