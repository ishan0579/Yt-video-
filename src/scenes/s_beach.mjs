// Scene: spawning on the beach.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, vgrad, circle, ell, rng, sparkle, dust, dizzy, iris, pow } from '../engine.mjs';
import { sky, sea, sand, umbrella } from '../bg.mjs';
import { palm } from '../props.mjs';
import { wanted, money, minimap, missionBanner } from '../hud.mjs';

const GY = 930;
export default {
  id: 'beach',
  dur: 38,
  fadeIn: 0, fadeOut: 0,
  music: [[0.3, 27.4, 'chill', 0.5], [30.2, 38, 'chill', 0.45]],
  sfx: [
    [0.2, 'waves', { dur: 37, vol: 0.25 }], [1.0, 'spawn'], [2.2, 'pop'],
    [10.3, 'fall'], [11.3, 'thud'], [11.4, 'boing'],
    [14.6, 'pop', { vol: 1.2 }], [15.25, 'thud', { vol: 0.6 }],
    [27.6, 'boom', { vol: 0.7 }], [30.3, 'mission'],
    [34.4, 'whoosh'], [35.4, 'thud'], [36.2, 'whoosh'],
  ],
  lines: [
    { t: 3.0, who: 'bunty', text: 'Aa gaya main! PALM BAY CITY!', hi: 'आ गया मैं! पाम बे सिटी!', dur: 3.4 },
    { t: 6.6, who: 'bunty', text: 'Aaj se is sheher ka DON... main hoon!', hi: 'आज से इस शहर का डॉन... मैं हूँ!', dur: 3.6 },
    { t: 11.6, who: 'chintu', text: 'Mmmph! Mmmph!!', hi: 'म्म्म! म्म्म्म!!', fx: 'muffle', dur: 2.2, at: [1250, 700] },
    { t: 15.5, who: 'chintu', text: 'Bhai... mera toh spawn hi bug ho gaya.', hi: 'भाई... मेरा तो स्पॉन ही बग हो गया।', dur: 3.4 },
    { t: 19.1, who: 'bunty', text: 'Chintu, focus! Open world hai. Kuch bhi kar sakte hain!', hi: 'चिंटू, फोकस! ओपन वर्ल्ड है। कुछ भी कर सकते हैं!', dur: 4.0 },
    { t: 23.35, who: 'chintu', text: 'Kuch bhi? Toh chalo ghar chalte hain. Mummy wait kar rahi hogi.', hi: 'कुछ भी? तो चलो घर चलते हैं। मम्मी वेट कर रही होगी।', dur: 4.3 },
    { t: 27.6, who: 'bunty', text: 'GHAR NAHI!! Pehle MISSION!', hi: 'घर नहीं!! पहले मिशन!', style: 'shout', dur: 2.6 },
    { t: 31.0, who: 'chintu', text: 'Chori?! Bhai, mummy ko pata chala toh...', hi: 'चोरी?! भाई, मम्मी को पता चला तो...', dur: 3.2 },
  ],
  draw(ctx, t, S) {
    const shout = t > 27.6 && t < 30.2;
    const zoom = shout ? lerp(1, 1.18, ease.out(clamp((t - 27.6) / 0.25))) : 1;
    ctx.save();
    camera(ctx, t, { x: shout ? 1080 : W / 2, y: shout ? 640 : H / 2, zoom, shake: shout ? 10 : 0 });
    sky(ctx, t, 'day', { horizon: 560, sunX: 1500, sunY: 140 });
    sea(ctx, t, 560, 720);
    sand(ctx, 720);
    umbrella(ctx, 260, GY + 20, 1.1);
    palm(ctx, 1780, GY + 30, { s: 1.2, t, h: 520, lean: -0.15 });
    palm(ctx, 90, GY + 60, { s: 1.0, t, h: 460, lean: 0.2 });
    // spawn beam
    const bx = 760;
    const beam = clamp((t - 1.0) / 0.4) * (1 - clamp((t - 2.8) / 0.6));
    if (beam > 0) {
      ctx.save(); ctx.globalAlpha = beam * 0.7;
      const g = ctx.createLinearGradient(bx - 130, 0, bx + 130, 0); g.addColorStop(0, 'rgba(120,255,240,0)'); g.addColorStop(0.5, 'rgba(220,255,250,1)'); g.addColorStop(1, 'rgba(120,255,240,0)');
      ctx.fillStyle = g; ctx.fillRect(bx - 130, -100, 260, GY + 100);
      ctx.restore();
      const R = rng(5);
      for (let i = 0; i < 16; i++) { const yy = GY - ((t * 400 + R() * 900) % 900); sparkle(ctx, bx + (R() - 0.5) * 200, yy, 10 + R() * 12, beam); }
      ell(ctx, bx, GY + 5, 160 * beam, 30 * beam); ctx.fillStyle = 'rgba(160,255,240,0.6)'; ctx.fill();
    }
    // --- Bunty ---
    const appear = ease.elastic(clamp((t - 2.0) / 0.8));
    let bxPos = keys(t, [[12.8, 760], [14.0, 1080], [34.4, 1080], [37.4, 2400]], ease.inOut);
    const bWalk = (t > 12.8 && t < 14.0) ? t * 10 : (t > 34.4 ? t * 16 : null);
    let bArms, bExpr = 'smug', bFace = 1;
    if (t < 6.6) { bArms = t > 3 ? 'cheer' : 'idle'; bExpr = 'laugh'; }
    else if (t < 10.3) { bArms = 'pointUp'; }
    else if (t < 12.8) { bArms = 'idle'; bExpr = 'shock'; }
    else if (t < 14.2) { bArms = undefined; bExpr = 'worried'; }
    else if (t < 15.0) { bArms = 'grab'; bExpr = 'angry'; }
    else if (t < 19.1) { bArms = 'facepalm'; bExpr = 'bored'; }
    else if (t < 23.2) { bArms = 'shrug'; bExpr = 'laugh'; }
    else if (t < 27.6) { bArms = 'hips'; bExpr = 'bored'; }
    else if (t < 30.2) { bArms = 'flail'; bExpr = 'angry'; }
    else if (t < 34.4) { bArms = 'point'; bExpr = 'smug'; }
    if (appear > 0.01) S.c(ctx, 'bunty', { x: bxPos, y: GY, s: 1.35 * appear, face: bFace, arms: bArms, expr: bExpr, walk: bWalk ?? undefined, legs: t > 34.4 ? 'run' : undefined });

    // --- Chintu ---
    const cx0 = 1250;
    if (t > 10.3 && t < 11.3) {
      const p = ease.in(prog(10.3, 11.3, t));
      ctx.save(); ctx.beginPath(); ctx.rect(-200, -2000, W + 400, GY + 2005); ctx.clip();
      S.c(ctx, 'chintu', { x: cx0, y: lerp(-500, GY - 90, p), s: 1.35, rot: Math.PI, arms: 'flail', expr: 'scared', legs: 'walk', walk: t * 30 });
      ctx.restore();
      // whistle lines
      for (let k = 0; k < 3; k++) line(ctx, cx0 - 40 + k * 40, lerp(-700, GY - 400, p), cx0 - 40 + k * 40, lerp(-900, GY - 600, p), 5, 'rgba(255,255,255,0.8)');
    } else if (t >= 11.3 && t < 14.6) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GY + 5); ctx.clip();
      S.c(ctx, 'chintu', { x: cx0, y: GY - 110, s: 1.35, rot: Math.PI, legs: 'walk', walk: t * 26, noAnchor: true });
      ctx.restore();
      ell(ctx, cx0, GY + 8, 120, 30); fs(ctx, '#eec27a', 5);
      dust(ctx, cx0, GY, t - 11.3, 1.3, 7, '#f7d9a0');
    } else if (t >= 14.6) {
      const fly = prog(14.6, 15.3, t);
      let cx = keys(t, [[14.6, cx0], [15.3, 1330], [34.4, 1330], [35.4, 1700], [36.0, 1700], [37.5, 2500]], ease.inOut);
      let cy = GY - Math.sin(fly * Math.PI) * 280;
      let rot = t < 15.3 ? lerp(Math.PI, Math.PI * 2, ease.out(fly)) : 0;
      let cArms, cExpr = 'normal', face = -1, legs, walk;
      if (t < 19) { cExpr = 'sad'; cArms = 'idle'; }
      else if (t < 23.2) { cExpr = 'worried'; }
      else if (t < 27.5) { cExpr = 'laugh'; cArms = 'cheer'; }
      else if (t < 30.2) { cExpr = 'shock'; cArms = 'up'; }
      else if (t < 34.4) { cExpr = 'worried'; cArms = 'think'; }
      if (t > 34.4) { face = 1; legs = 'run'; walk = t * 16; cExpr = 'scared'; cArms = undefined; }
      if (t > 35.4 && t < 36.0) { rot = -Math.PI / 2 * ease.out(prog(35.4, 35.55, t)); cy = GY - 30; legs = 'stand'; cArms = 'up'; cExpr = 'dead'; }
      S.c(ctx, 'chintu', { x: cx, y: cy, s: 1.35, rot, face, arms: cArms, expr: cExpr, legs, walk });
      if (t > 15.3 && t < 19) dizzy(ctx, cx, cy - 350, t, 1.2);
      if (t > 15.2 && t < 16.4) dust(ctx, cx, GY, t - 15.25, 1.2, 9, '#f7d9a0');
      if (t > 35.4 && t < 36.6) dust(ctx, 1700, GY, t - 35.4, 1.2, 4, '#f7d9a0');
    }
    if (t > 14.55 && t < 15.3) pow(ctx, cx0, GY - 80, 'POP!', t - 14.6, 0.8, '#ffd23f', 3);
    if (t > 11.25 && t < 12.2) pow(ctx, cx0 + 60, GY - 140, 'THUD!', t - 11.3, 0.9, '#ff9f1c', 8);
    ctx.restore();

    // HUD
    wanted(ctx, 0, t); money(ctx, 0); minimap(ctx, t, { scroll: 10 });
    missionBanner(ctx, 'MISSION 1', 'Ek mast gaadi chura lo!', t - 30.3, 4.4);
  },
  post(ctx, t) { iris(ctx, ease.in(clamp((t - 37.2) / 0.8)), 1700, 700); },
};
