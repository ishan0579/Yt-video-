// Scene: bicycle "supercar" + police chase + ramp jump.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, sparkle, dust, iris, hLines, speedLines, sweat, pow } from '../engine.mjs';
import { sky, skyline, street } from '../bg.mjs';
import { car, jeep, ramp, streetLamp, megaphone, cone } from '../props.mjs';
import { wanted, money, minimap, popup, speedo, chapterCard } from '../hud.mjs';
import { bikeRide } from '../rigs.mjs';

const ROAD = 1045, FAR = 960, BX = 820, LAUNCH = 43.4, CUT = 48;
function speed(t) {
  if (t < 31.4) return 330;
  if (t < 33) return lerp(330, 950, (t - 31.4) / 1.6);
  if (t < LAUNCH) return 950;
  return 950 * 0.25;
}
function P(t) { let p = 0; const dt = 0.02; for (let x = 0; x < t; x += dt) p += speed(x) * Math.min(dt, t - x); return p; }
const P_LAUNCH = P(LAUNCH);
const RAMP_X = P_LAUNCH + BX - 280; // world x of the ramp centre (top end reaches the bike at launch)

function tortoise(ctx, x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < 4; i++) { const a = Math.sin(t * 14 + i * 1.6) * 8; ell(ctx, -40 + i * 26 + a, -8, 12, 16); fs(ctx, '#7cb342', 4); }
  ctx.beginPath(); ctx.arc(0, -20, 60, Math.PI, 0); ctx.closePath(); fs(ctx, '#8d6e3f', 5);
  for (const dx of [-30, 0, 30]) { ctx.beginPath(); ctx.arc(dx, -40, 14, 0, 7); fs(ctx, '#b08850', 3); }
  circle(ctx, 76, -34, 22); fs(ctx, '#7cb342', 5);
  rr(ctx, 70, -44, 30, 12, 4); fs(ctx, '#111', 0);
  ctx.restore();
}

export default {
  id: 'bikechase',
  dur: 52.5,
  fadeIn: 0.5, fadeOut: 0,
  music: [[0, 11, 'chill', 0.5], [11, 15.2, 'none', 0], [15.2, 20.4, 'chill', 0.4], [20.4, LAUNCH, 'chase', 0.55], [LAUNCH, CUT, 'epic', 0.6], [CUT, 52.5, 'none', 0]],
  sfx: [
    [0, 'city', { dur: 20, vol: 0.2 }], [1.0, 'zoom'], [2.6, 'zoom'], [6.0, 'zoom'], [9.2, 'zoom'],
    [11.2, 'crickets', { dur: 4 }],
    [15.2, 'bell'], [15.7, 'bell'], [16.5, 'star'],
    [20.4, 'siren', { dur: 23, vol: 0.35 }], [21.2, 'mega'], [27.8, 'star'], [28.4, 'mega'],
    [31.4, 'whoosh'], [31.6, 'pedal', { dur: 11.5 }],
    [42.6, 'boing'], [LAUNCH, 'whoosh'], [LAUNCH + 0.2, 'choir', { dur: 4.4 }],
    [CUT + 0.1, 'skid'], [CUT + 0.4, 'siren', { dur: 4, vol: 0.2 }], [51.0, 'twinkle'],
  ],
  lines: [
    { t: 4.0, who: 'chintu', text: 'Bhai, sab humein overtake kar rahe hain.', hi: 'भाई, सब हमें ओवरटेक कर रहे हैं।', dur: 3.4 },
    { t: 7.6, who: 'bunty', text: 'Wo log jaldi mein hain. Hum... STYLE mein hain.', hi: 'वो लोग जल्दी में हैं। हम... स्टाइल में हैं।', dur: 3.6 },
    { t: 13.0, who: 'chintu', text: '...kachhua bhi?', hi: '...कछुआ भी?', dur: 2.0 },
    { t: 17.6, who: 'chintu', text: 'Bhai! Ghanti bajane pe bhi star?!', hi: 'भाई! घंटी बजाने पे भी स्टार?!', dur: 3.0 },
    { t: 21.2, who: 'police', text: 'AE CYCLE WAALE! Helmet kahan hai?!', hi: 'ए साइकिल वाले! हेलमेट कहाँ है?!', style: 'shout', dur: 3.4, mega: true },
    { t: 24.8, who: 'bunty', text: 'Pakad ke dikhao, uncle!', hi: 'पकड़ के दिखाओ, अंकल!', dur: 2.8 },
    { t: 28.4, who: 'police', text: 'Ruk ja! Abhi batata hoon!', hi: 'रुक जा! अभी बताता हूँ!', style: 'shout', dur: 2.8, mega: true },
    { t: 31.6, who: 'chintu', text: 'Bhai jaldi pedal maar!!', hi: 'भाई जल्दी पैडल मार!!', style: 'shout', dur: 2.6 },
    { t: 34.4, who: 'bunty', text: 'Mere pair ab pair nahi rahe... PANKHE ban gaye hain!', hi: 'मेरे पैर अब पैर नहीं रहे... पंखे बन गए हैं!', dur: 4.0 },
    { t: 38.6, who: 'chintu', text: 'Bhai aage RAMP!', hi: 'भाई आगे रैंप!', style: 'shout', dur: 2.0 },
    { t: 40.8, who: 'bunty', text: 'Pakad ke baith, Chintu!', hi: 'पकड़ के बैठ, चिंटू!', dur: 2.4 },
    { t: 43.8, who: 'chintu', text: 'BHAAAAI HUM UD RAHE HAIN!!', hi: 'भाईईई! हम उड़ रहे हैं!!', style: 'shout', dur: 3.8 },
    { t: 48.7, who: 'police', text: 'Arre... ye toh ud gaye!', hi: 'अरे... ये तो उड़ गए!', dur: 3.0 },
  ],
  draw(ctx, t, S) {
    if (t >= CUT) return this.drawCut(ctx, t, S);
    const camX = P(t);
    const air = t > LAUNCH;
    const at = t - LAUNCH;
    const zoom = air ? lerp(1, 0.8, ease.out(clamp(at / 1.5))) : 1;
    ctx.save();
    camera(ctx, t, { zoom, y: H / 2 - (air ? 200 * ease.out(clamp(at / 2)) : 0), shake: t > 31.4 && !air ? 3 : 0 });
    sky(ctx, t, 'day', { horizon: 660, camX });
    skyline(ctx, camX, 660, t, { farC: '#7aa6d6', midC: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'] });
    street(ctx, camX, t, { groundY: 760 });
    const sp = 900, s0 = Math.floor((camX - 600) / sp);
    for (let i = s0; i < s0 + 5; i++) streetLamp(ctx, i * sp - camX, 780, { s: 0.85 });

    // overtaking traffic (far lane)
    for (const [t0, col] of [[0.8, '#4cc9f0'], [2.4, '#f9c74f'], [5.8, '#90be6d'], [9.0, '#f15bb5']]) {
      const p = (t - t0) / 1.4;
      if (p > 0 && p < 1) car(ctx, lerp(-450, W + 450, p), FAR, { color: col, s: 0.95, wheelRot: t * 30 });
    }
    // tortoise overtakes on the sidewalk
    if (t > 10.5 && t < 16.5) tortoise(ctx, keys(t, [[10.5, -150], [13.0, 1150], [16.5, 2100]], ease.lin), 800, t, 1.35);

    // police jeep (far lane)
    let jx = keys(t, [[20.4, -600], [23, 230], [28.4, 230], [31, 470], [LAUNCH, 520]], ease.inOut);
    if (air) jx = 520 - at * 200;
    if (t > 20.4) {
      jeep(ctx, jx, FAR, { s: 1.1, t, wheelRot: t * 25 });
      ctx.save();
      ctx.beginPath(); ctx.rect(jx - 30, FAR - 112 * 1.1 - 200, 300, 200); ctx.clip();
      const yelling = (t > 21.2 && t < 24.6) || (t > 28.4 && t < 31.2);
      S.c(ctx, 'police', { x: jx + 60, y: FAR - 30, s: 0.9, legs: 'hidden', arms: yelling ? 'point' : 'hold', expr: 'angry', prop: yelling ? c => megaphone(c, 1) : null, lean: 0.25 });
      ctx.restore();
    }

    // ramp
    const rx = RAMP_X - camX;
    if (rx > -500 && rx < W + 500) ramp(ctx, rx, ROAD + 5, { s: 1.4 });

    // bike
    let by = ROAD, bxx = BX, rot = 0;
    if (!air && rx - 280 < BX && rx + 280 > BX) { const u = clamp((BX - (rx - 280)) / 560); by = ROAD - u * 224; rot = -0.38; }
    if (air) {
      bxx = BX + at * 110;
      by = ROAD - 224 - (480 * ease.out(clamp(at / 3)));
      rot = -0.38 + at * 0.06;
    }
    const fast = t > 31.4 && !air;
    const pedal = t < 31.4 ? t * 7 : t * 30;
    const stars = t > 27.8 ? 3 : t > 16.5 ? 2 : 1;
    let bArms = 'hold', bExpr = 'smug', cArms = 'hold', cExpr = 'worried';
    if (t > 4 && t < 7.6) cExpr = 'bored';
    if (t > 7.6 && t < 11.2) bExpr = 'smug';
    if (t > 11 && t < 15.2) { cExpr = 'bored'; bExpr = 'shock'; }
    if (t > 15.2 && t < 16.4) { bExpr = 'laugh'; }
    if (t > 16.5 && t < 20.4) { cExpr = 'shock'; cArms = 'flail'; bExpr = 'shock'; }
    if (t > 20.4 && t < 24.8) { cExpr = 'scared'; cArms = 'flail'; bExpr = 'worried'; }
    if (t > 24.8 && t < 27.8) { bArms = 'wave'; bExpr = 'laugh'; }
    if (t > 27.8 && t < 31.4) { bExpr = 'shock'; cExpr = 'scared'; }
    if (fast) { cArms = 'flail'; cExpr = 'scared'; bExpr = t > 34.4 && t < 38.4 ? 'worried' : 'angry'; }
    if (t > 38.6 && !air) { cExpr = 'shock'; }
    if (air) { cArms = 'flail'; cExpr = 'laugh'; bExpr = 'laugh'; bArms = 'cheer'; }
    bikeRide(ctx, S, bxx, by, { bs: 1.25, cs: 1.12, pedal, wheelRot: camX / 60, rot, buntyArms: bArms, buntyExpr: bExpr, chintuArms: cArms, chintuExpr: cExpr, buntyO: { face: t > 24.8 && t < 27.6 ? 1 : 1 } });
    if (fast) sweat(ctx, bxx + 60, by - 380, t, 1.2);
    if (t > 15.2 && t < 16.4) pow(ctx, bxx + 200, by - 330, 'TRING!', (t - 15.2) % 0.5 + 0.1, 0.7, '#4cc9f0', 2);
    if (air) { const R = rng(4); for (let i = 0; i < 8; i++) sparkle(ctx, bxx + (R() - 0.5) * 600, by - 200 + (R() - 0.5) * 500, 14 + R() * 18, Math.max(0, Math.sin(t * 4 + i * 2))); }
    ctx.restore();

    if (fast) hLines(ctx, t, 0.45, 6);
    if (air) speedLines(ctx, t, 0.3);
    // HUD
    wanted(ctx, stars, t, t > 27.8 ? 27.8 : 16.5); money(ctx, 0);
    minimap(ctx, t, { cops: t > 20.4 ? 2 : 0, scroll: camX / 20 });
    speedo(ctx, air ? 0 : clamp(speed(t) / 330 * 12, 0, 60) + Math.sin(t * 3));
  },
  drawCut(ctx, t, S) {
    const ct = t - CUT;
    sky(ctx, t, 'day', { horizon: 660 });
    skyline(ctx, 4000, 660, t, { farC: '#7aa6d6', midC: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#bdb2ff'] });
    street(ctx, 4000, t, { groundY: 760 });
    ramp(ctx, 1450, ROAD + 5, { s: 1.4 });
    cone(ctx, 1080, ROAD + 20, 1.2);
    const jx = keys(ct, [[0, 300], [0.5, 760]], ease.out);
    jeep(ctx, jx, ROAD, { s: 1.25, t, wheelRot: ct < 0.5 ? t * 20 : 0 });
    if (ct < 1.2) dust(ctx, jx - 260, ROAD, ct, 1.6, 6, '#ddd');
    ctx.save(); ctx.beginPath(); ctx.rect(jx - 30, ROAD - 140 - 240, 360, 240); ctx.clip();
    S.c(ctx, 'police', { x: jx + 70, y: ROAD - 40, s: 1.0, legs: 'hidden', arms: 'idle', expr: 'shock', lean: 0.2, look: [1, -1] });
    ctx.restore();
    // tiny bike far in the sky
    const fx = 1500 + ct * 60, fy = 260 - ct * 40;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-0.3);
    circle(ctx, -18, 0, 12); fs(ctx, '#333', 3); circle(ctx, 18, 0, 12); fs(ctx, '#333', 3);
    line(ctx, -18, 0, 18, 0, 4, '#ff4fa3'); circle(ctx, 0, -18, 10); fs(ctx, '#e63946', 3);
    ctx.restore();
    if (ct > 2.9) sparkle(ctx, fx + 10, fy - 10, 40 * Math.sin(clamp((ct - 2.9) / 0.6) * Math.PI), 1);
    wanted(ctx, 3, t); money(ctx, 0); minimap(ctx, t, { cops: 2, scroll: 10 });
  },
  post(ctx, t) {
    chapterCard(ctx, 'CHAPTER 2', 'Supercar', t - 0.6, 3.0);
    popup(ctx, 'WANTED LEVEL UP: Zyada ghanti bajayi', t - 16.6, 2.8);
    popup(ctx, 'WANTED LEVEL UP: Police ko chidhaya', t - 27.9, 2.8);
    if (t > CUT - 0.12 && t < CUT + 0.12) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 1 - Math.abs(t - CUT) / 0.12; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    iris(ctx, ease.in(clamp((t - 51.8) / 0.7)), 1500, 260);
  },
};
