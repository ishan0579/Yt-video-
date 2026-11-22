// Scene: crash-landing into Lala Ji's pool party; becoming the DJ; the bank job offer.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, sparkle, dust, iris, pow, vgrad, TAU } from '../engine.mjs';
import { sky } from '../bg.mjs';
import { palm, wheel } from '../props.mjs';
import { wanted, money, minimap, missionBanner } from '../hud.mjs';
import { guest } from '../characters.mjs';
import { bikeRide } from '../rigs.mjs';

const DECK = 848, WATER = 935, SPLASH = 2.3, DJ = 14.2, DROP = 17.4;
const GUESTS = [[140, 1], [300, 2], [470, 3], [950, 4], [1090, 5]];

function villa(ctx, t) {
  rr(ctx, 860, 250, 1100, 520, 10); fs(ctx, '#f4efe6', 6);
  rr(ctx, 820, 225, 1180, 50, 8); fs(ctx, '#e0d8c8', 6);
  for (let i = 0; i < 4; i++) { rr(ctx, 910 + i * 255, 320, 210, 300, 6); fs(ctx, '#ffd88a', 5); line(ctx, 1015 + i * 255, 320, 1015 + i * 255, 620, 4); }
  rr(ctx, 860, 640, 1100, 30, 4); fs(ctx, '#c9bfae', 4);
}
function stringLights(ctx, t) {
  const cols = ['#ff4fa3', '#ffd23f', '#1dd3b0', '#4cc9f0', '#f77f00'];
  for (const [y0, sag, n] of [[120, 90, 18], [200, 70, 16]]) {
    ctx.beginPath(); ctx.moveTo(-20, y0); ctx.quadraticCurveTo(W / 2, y0 + sag * 2, W + 20, y0); ctx.lineWidth = 3; ctx.strokeStyle = '#1b1030'; ctx.stroke();
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = lerp(-20, W + 20, u), y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (y0 + sag * 2) + u * u * y0;
      const on = (Math.floor(t * 3) + i) % 3 !== 0;
      circle(ctx, x, y + 12, 10); fs(ctx, on ? cols[i % 5] : '#555', 3);
      if (on) { ctx.save(); ctx.globalAlpha = 0.25; circle(ctx, x, y + 12, 24); ctx.fillStyle = cols[i % 5]; ctx.fill(); ctx.restore(); }
    }
  }
}
function pool(ctx, t) {
  ctx.fillStyle = '#d8c3a0'; ctx.fillRect(-W, 760, 3 * W, H);
  for (let x = -40; x < W + 40; x += 90) line(ctx, x, 760, x - 20, DECK + 20, 3, '#c2aa82');
  rr(ctx, 230, 870, 1260, 260, 20); fs(ctx, '#ffffff', 6);
  ctx.fillStyle = vgrad(ctx, 890, H, ['#36cfe8', '#1ea5d6', '#127fb0']); rr(ctx, 255, 890, 1210, 240, 14); ctx.fill();
  ctx.save(); rr(ctx, 255, 890, 1210, 240, 14); ctx.clip();
  for (let r = 0; r < 6; r++) for (let k = 0; k < 9; k++) {
    const x = 280 + k * 140 + Math.sin(t * 1.5 + r + k) * 20, y = 905 + r * 30;
    line(ctx, x, y, x + 50, y + Math.sin(t * 2 + k) * 4, 3, 'rgba(255,255,255,0.45)');
  }
  ctx.restore();
}
function djTable(ctx, t, x, playing) {
  for (const sx of [x + 270]) { rr(ctx, sx - 60, 600, 120, 250, 10); fs(ctx, '#2b2b3a', 5); const pump = playing ? 1 + Math.abs(Math.sin(t * 8)) * 0.15 : 1; circle(ctx, sx, 680, 36 * pump); fs(ctx, '#555', 4); circle(ctx, sx, 790, 44 * pump); fs(ctx, '#555', 4); circle(ctx, sx, 790, 16); fs(ctx, '#222', 3); }
  rr(ctx, x - 190, 730, 380, 130, 10); fs(ctx, '#1b1030', 6);
  ctx.fillStyle = playing ? `hsl(${(t * 200) % 360},90%,60%)` : '#ff4fa3'; ctx.fillRect(x - 180, 800, 360, 10);
  txt(ctx, 'DJ', x, 770, { size: 40, font: 'Bangers', fill: '#ffd23f', lw: 0 });
  for (const dx of [-110, 110]) { ell(ctx, x + dx, 728, 62, 14); fs(ctx, '#333', 4); line(ctx, x + dx, 728, x + dx + Math.cos(t * 12) * 50, 728 + Math.sin(t * 12) * 10, 3, '#ff4fa3'); }
}

export default {
  id: 'pool',
  dur: 50,
  fadeIn: 0.1, fadeOut: 1.0,
  music: [[0, SPLASH + 0.05, 'party', 0.6], [15.0, 25.4, 'bellremix', 0.65], [25.4, 33.6, 'bellremix', 0.25], [36.2, 50, 'party', 0.35]],
  sfx: [
    [0, 'crowd', { dur: 2.3, vol: 0.3 }], [1.4, 'fall'], [SPLASH, 'splash', { vol: 1.3 }], [SPLASH + 0.1, 'scratch'],
    [3.0, 'crickets', { dur: 4.5 }], [4.1, 'spit'], [DJ - 0.2, 'whoosh'], [15.0, 'click'],
    [DROP, 'cheer'], [33.8, 'dun'], [42.5, 'mission'],
  ],
  lines: [
    { t: 7.0, who: 'lala', text: 'Tum log... DJ ho kya?', hi: 'तुम लोग... डीजे हो क्या?', dur: 3.0 },
    { t: 11.4, who: 'bunty', text: '...Haan! HUM hi DJ hain!', hi: '...हाँ! हम ही डीजे हैं!', dur: 2.6 },
    { t: 19.0, who: 'chintu', text: 'Bhai ye toh HIT ho gaya!', hi: 'भाई ये तो हिट हो गया!', style: 'shout', dur: 3.0 },
    { t: 22.4, who: 'bunty', text: 'Talent chhupta nahi, Chintu!', hi: 'टैलेंट छुपता नहीं, चिंटू!', dur: 2.8 },
    { t: 25.9, who: 'lala', text: 'Wah! Tum log kaam ke aadmi ho. Ek chhota sa kaam karoge?', hi: 'वाह! तुम लोग काम के आदमी हो। एक छोटा सा काम करोगे?', dur: 4.9 },
    { t: 31.0, who: 'bunty', text: 'Haan haan! Bolo!', hi: 'हाँ हाँ! बोलो!', dur: 2.0 },
    { t: 33.0, who: 'lala', text: 'Bank... lootna hai.', hi: 'बैंक... लूटना है।', dur: 3.1 },
    { t: 36.3, who: 'bunty', text: 'HAAN!', hi: 'हाँ!', style: 'shout', dur: 1.3 },
    { t: 37.7, who: 'chintu', text: 'NAHI!', hi: 'नहीं!', style: 'shout', dur: 1.2 },
    { t: 39.0, who: 'bunty', text: 'HAAN!!', hi: 'हाँ!!', style: 'shout', dur: 1.3 },
    { t: 40.4, who: 'chintu', text: '...haan.', hi: '...हाँ।', dur: 1.9, size: 34 },
  ],
  draw(ctx, t, S) {
    const zoomLala = t > 33.2 && t < 36.2;
    const shake = (t > SPLASH && t < SPLASH + 0.5 ? 20 : 0) + (t > 36.3 && t < 41 ? 4 : 0);
    ctx.save();
    camera(ctx, t, zoomLala ? { x: 1380, y: 540, zoom: lerp(1, 1.5, ease.out(clamp((t - 33.2) / 0.4))), shake } : { shake });
    sky(ctx, t, 'dusk', { horizon: 700, sunY: 600, sunR: 180, sunX: 420 });
    palm(ctx, 80, 780, { s: 1.1, t, h: 560, lean: 0.12 });
    palm(ctx, 700, 780, { s: 0.9, t, h: 520, lean: -0.1 });
    villa(ctx, t);
    stringLights(ctx, t);
    pool(ctx, t);
    const dj = t > DJ;
    const playing = t > 15.0;
    const crazy = t > DROP;
    // disco beams
    if (crazy) {
      ctx.save(); ctx.globalAlpha = 0.18;
      for (let i = 0; i < 5; i++) { const a = Math.sin(t * 1.5 + i * 1.3) * 0.5; ctx.fillStyle = ['#ff4fa3', '#4cc9f0', '#ffd23f', '#1dd3b0', '#b5179e'][i]; ctx.beginPath(); ctx.moveTo(300 + i * 330, -20); ctx.lineTo(300 + i * 330 + Math.sin(a) * 900 - 120, H); ctx.lineTo(300 + i * 330 + Math.sin(a) * 900 + 120, H); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    // guests
    const frozen = t > SPLASH && t < DROP;
    for (const [gx, seed] of GUESTS) {
      const G = guest(seed);
      const party = t < SPLASH || crazy;
      const sp = crazy ? 1.6 : 1;
      S.c(ctx, G, { x: gx, y: DECK, s: 1.0, t: t * sp + seed, arms: party ? (seed % 2 ? 'dance' : 'dance2') : (frozen && t > 15 ? 'hips' : 'idle'), expr: party ? 'laugh' : (t > 15 ? 'bored' : 'shock'), face: gx < 800 ? 1 : -1, bob: party ? -Math.abs(Math.sin((t * sp + seed) * 8)) * 18 : 0 });
    }
    // Lala Ji
    let lx = keys(t, [[4.5, 2050], [7.0, 1270], [25.4, 1270], [26.4, 1330]], ease.inOut);
    const lWalk = (t > 4.5 && t < 7) || (t > 25.4 && t < 26.4) ? t * 10 : undefined;
    let lArms = 'hips', lExpr = 'normal', lFace = -1;
    if (t > 7 && t < 10) { lArms = 'think'; lExpr = 'worried'; }
    if (t > DJ) { lFace = 1; lExpr = 'shock'; lArms = 'idle'; }
    if (crazy && t < 25.4) { lArms = 'dance2'; lExpr = 'laugh'; }
    if (t > 26.4) { lArms = 'point'; lExpr = 'smug'; }
    if (t > 33 && t < 36.2) { lArms = 'idle'; lExpr = 'smug'; }
    if (t > 42.5) { lArms = 'cheer'; lExpr = 'laugh'; }
    if (t > 4.5) S.c(ctx, 'lala', { x: lx, y: DECK + 2, s: 1.15, face: lFace, walk: lWalk, arms: lArms, expr: lExpr, bob: crazy && t < 25.4 ? -Math.abs(Math.sin(t * 9)) * 16 : 0 });

    if (!dj) {
      // falling in
      if (t > 1.4 && t < SPLASH) {
        const p = ease.in(prog(1.4, SPLASH, t));
        ell(ctx, 820, 960, 160 * p, 30 * p); ctx.fillStyle = 'rgba(0,40,80,0.3)'; ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.rect(-W, -2000, 3 * W, 2000 + WATER); ctx.clip();
        bikeRide(ctx, S, 820, lerp(-500, 1100, p), { bs: 1.0, cs: 1.0, rot: 0.6 + p, buntyArms: 'flail', chintuArms: 'flail', buntyExpr: 'shock', chintuExpr: 'scared' });
        ctx.restore();
      }
      // in the pool
      if (t > 3.0) {
        const rise = ease.out(prog(3.0, 4.0, t));
        ctx.save(); ctx.beginPath(); ctx.rect(-W, -2000, 3 * W, 2000 + WATER); ctx.clip();
        const look = t > 10 && t < 11.4 ? (t < 10.7 ? [1, 0] : [1, -0.6]) : [0.3, 0];
        S.c(ctx, 'bunty', { x: 700, y: lerp(1350, 1035, rise) + Math.sin(t * 2) * 6, s: 1.2, arms: t > 11.4 && t < 14 ? 'cheer' : 'idle', expr: t > 11.4 ? 'laugh' : (t > 10 ? 'smug' : 'bored'), wet: true, look });
        S.c(ctx, 'chintu', { x: 930, y: lerp(1350, 1040, rise) + Math.sin(t * 2 + 1) * 6, s: 1.2, face: -1, arms: 'idle', expr: t > 4 && t < 4.8 ? 'shock' : 'worried', wet: true });
        ctx.restore();
        // ripples
        for (const rx of [700, 930]) { ell(ctx, rx, WATER + 4, 110 + Math.sin(t * 3) * 10, 16); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); }
        // floating bicycle wheel
        ctx.save(); ctx.translate(1180, WATER + 10 + Math.sin(t * 2.5) * 6); ctx.scale(1, 0.35); wheel(ctx, 0, 0, 60, t * 0.4); ctx.restore();
        // Chintu spits water
        if (t > 4.1 && t < 4.9) {
          const sp = prog(4.1, 4.9, t);
          for (let i = 0; i < 10; i++) { const u = clamp(sp * 1.3 - i * 0.04); const x = 900 - u * 380, y = 830 - Math.sin(u * Math.PI) * 220 + u * 60; circle(ctx, x, y, 9); fs(ctx, '#8fe3ff', 2); }
        }
      }
      // splash
      if (t > SPLASH && t < SPLASH + 1.6) {
        const a = t - SPLASH, R = rng(12);
        for (let i = 0; i < 40; i++) {
          const ang = -Math.PI / 2 + (R() - 0.5) * 1.6, v = 600 + R() * 900;
          const x = 820 + Math.cos(ang) * v * a, y = WATER + Math.sin(ang) * v * a + 1400 * a * a;
          if (y < WATER + 20) { circle(ctx, x, y, 14 + R() * 18); fs(ctx, R() < 0.5 ? '#bff4ff' : '#ffffff', 3); }
        }
        ctx.save(); ctx.globalAlpha = clamp(1 - a); ell(ctx, 820, WATER, 260 * (0.5 + a), 60); fs(ctx, '#ffffff', 4); ctx.restore();
      }
    } else {
      // at the DJ table, dripping wet
      S.c(ctx, 'bunty', { x: 1560, y: DECK - 16, s: 1.15, arms: playing && t < 25 ? 'dance' : (t > 36.3 && t < 41 ? 'point' : 'hold'), expr: t < 15 ? 'smug' : (t < 17.4 ? 'worried' : (t > 36.3 && t < 41 ? 'angry' : 'laugh')), wet: true, face: t > 38.9 && t < 40.3 ? 1 : -1, bob: crazy && t < 25 ? -Math.abs(Math.sin(t * 8)) * 12 : 0 });
      S.c(ctx, 'chintu', { x: 1745, y: DECK - 12, s: 1.12, face: -1, arms: crazy && t < 25.4 ? 'cheer' : (t > 37.7 && t < 39 ? 'flail' : 'idle'), expr: crazy && t < 25.4 ? 'laugh' : (t > 37.7 && t < 40.4 ? 'scared' : (t > 40.4 ? 'sad' : 'worried')), wet: true, bob: crazy && t < 25.4 ? -Math.abs(Math.sin(t * 8 + 1)) * 12 : 0 });
      djTable(ctx, t, 1650, playing);
      if (playing) for (let i = 0; i < 4; i++) { const u = ((t * 0.8 + i * 0.25) % 1); txt(ctx, i % 2 ? '♪' : '♫', 1660 + Math.sin(u * 6 + i) * 120, 640 - u * 300, { size: 70, font: '"DejaVu Sans"', fill: ['#ff4fa3', '#ffd23f', '#1dd3b0', '#4cc9f0'][i], lw: 6 }); }
    }
    ctx.restore();
    if (dj && t < DJ + 0.25) { ctx.fillStyle = `rgba(255,255,255,${1 - (t - DJ) / 0.25})`; ctx.fillRect(0, 0, W, H); }
    wanted(ctx, 3, t); money(ctx, 0); minimap(ctx, t, { cops: 0, scroll: 5, night: true });
  },
  post(ctx, t) {
    missionBanner(ctx, 'MISSION 2', 'Bank of Palm Bay ko lootna hai!', t - 42.5, 4.6);
  },
};
