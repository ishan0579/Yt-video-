// Scenes: Mummy (mission failed), hospital respawn, outro + end screen.
import { W, H, clamp, lerp, ease, keys, prog, camera, rr, fs, line, txt, circle, ell, rng, dizzy, pow, starPath, vgrad, dust, sparkle, iris, fadeRect, TAU } from '../engine.mjs';
import { sky, skyline, street, room } from '../bg.mjs';
import { auto, car, chappal, streetLamp, palm } from '../props.mjs';
import { wanted, money, minimap, popup, bigCenter } from '../hud.mjs';

// ---------------- MUMMY ----------------
const GY = 880, THROW = 24.6, HIT1 = 26.4, HIT2 = 27.1, FAIL = 28.2;
function house(ctx, t) {
  rr(ctx, 1050, 300, 800, 520, 8); fs(ctx, '#ffd6a5', 6);
  ctx.beginPath(); ctx.moveTo(1010, 320); ctx.lineTo(1450, 120); ctx.lineTo(1890, 320); ctx.closePath(); fs(ctx, '#c1121f', 6);
  rr(ctx, 1130, 420, 200, 170, 8); fs(ctx, '#ffe7a0', 6); line(ctx, 1230, 420, 1230, 590, 5); line(ctx, 1130, 505, 1330, 505, 5);
  rr(ctx, 1560, 520, 170, 300, 8); fs(ctx, '#8d6e63', 6);
  rr(ctx, 1600, 230, 200, 50, 8); fs(ctx, '#fff', 4); txt(ctx, 'SWEET HOME', 1700, 256, { size: 28, font: 'Bangers', fill: '#c1121f', lw: 0 });
  // gate + plants
  for (let i = 0; i < 10; i++) line(ctx, 1000 + i * 30, 820, 1000 + i * 30, 700, 6, '#555');
  line(ctx, 990, 720, 1280, 720, 6, '#555');
  for (const px of [1100, 1820]) { rr(ctx, px - 30, 760, 60, 60, 6); fs(ctx, '#bc6c25', 5); for (let k = 0; k < 5; k++) { ell(ctx, px + (k - 2) * 14, 740 - (k % 2) * 16, 14, 26, (k - 2) * 0.3); fs(ctx, '#40916c', 4); } }
}
export const mummy = {
  id: 'mummy',
  dur: 38,
  fadeIn: 0.3, fadeOut: 1.2,
  music: [[0, 1.6, 'chase', 0.4], [2.0, FAIL, 'tense', 0.45], [FAIL, 32, 'sad', 0.6]],
  sfx: [[0, 'skid'], [1.6, 'scratch'], [10.4, 'siren', { dur: 4, vol: 0.3 }], [18.0, 'gulp'], [20.6, 'zoom'], [23.0, 'dun'], [THROW, 'whoosh'], [24.9, 'lockon'], [HIT1, 'thwack', { vol: 1.2 }], [HIT2, 'thwack', { vol: 1.2 }], [FAIL, 'fail']],
  lines: [
    { t: 3.4, who: 'mummy', text: 'CHINTU!! Raat ke 9 baje kahan ghoom raha hai?!', hi: 'चिंटू!! रात के नौ बजे कहाँ घूम रहा है?!', style: 'shout', dur: 3.6 },
    { t: 7.1, who: 'chintu', text: 'M-Mummy... main toh tuition gaya tha!', hi: 'म... मम्मी... मैं तो ट्यूशन गया था!', dur: 3.2 },
    { t: 10.5, who: 'mummy', text: 'Tuition? AUTO mein? POLICE ke saath?!', hi: 'ट्यूशन? ऑटो में? पुलिस के साथ?!', style: 'shout', dur: 3.6 },
    { t: 14.3, who: 'police', text: 'Madam, ye dono bahut bade criminal—', hi: 'मैडम, ये दोनों बहुत बड़े क्रिमिनल...', dur: 3.0 },
    { t: 17.6, who: 'police', text: '...hum toh bas jaa rahe the. Namaste ji!', hi: '...हम तो बस जा रहे थे। नमस्ते जी!', dur: 3.0 },
    { t: 21.2, who: 'bunty', text: 'Aunty ji, hum samjha sakte hain...', hi: 'आंटी जी, हम समझा सकते हैं...', dur: 2.4 },
    { t: 31.0, who: 'bunty', text: '...ye chappal heat-seeking thi kya?', hi: '...ये चप्पल हीट सीकिंग थी क्या?', dur: 3.6 },
  ],
  draw(ctx, t, S) {
    ctx.save();
    camera(ctx, t, { shake: (t > HIT1 && t < HIT1 + 0.3) || (t > HIT2 && t < HIT2 + 0.3) ? 16 : 0, zoom: t > 23 && t < THROW ? lerp(1, 1.25, ease.out(prog(23, 23.6, t))) : 1, x: t > 23 && t < THROW ? 1300 : W / 2, y: t > 23 && t < THROW ? 600 : H / 2 });
    sky(ctx, t, 'night', { horizon: 700, moonX: 600, moonY: 160 });
    skyline(ctx, 200, 700, t, { night: true, palms: false });
    street(ctx, 0, t, { groundY: 840, night: true });
    house(ctx, t);
    streetLamp(ctx, 880, 840, { s: 1, on: true });
    // police car arrives then leaves
    const px = keys(t, [[10.4, -600], [12.0, 20], [20.6, 20], [22.4, -800]], ease.inOut);
    if (t > 10.4 && t < 22.4) car(ctx, px, 1050, { police: true, s: 1.0, t, face: t > 20.6 ? -1 : 1, wheelRot: t * 10 });
    // police uncle steps out
    if (t > 12.2 && t < 20.6) {
      const ux = keys(t, [[12.2, 300], [13.4, 560], [17.4, 560], [17.9, 500]], ease.inOut);
      const shrink = t > 17.4 ? 1 - 0.18 * ease.out(prog(17.4, 17.9, t)) : 1;
      S.c(ctx, 'police', { x: ux, y: GY + 20, s: 1.25 * shrink, walk: t < 13.4 ? t * 10 : undefined, arms: t < 17.4 ? 'point' : 'up', expr: t < 17.4 ? 'angry' : 'scared', face: 1 });
    }
    // the auto
    const ax = keys(t, [[0, -300], [1.2, 330]], ease.out);
    auto(ctx, ax, 1040, { s: 1.0, wheelRot: ax / 30, tilt: t < 1.2 ? -0.05 : 0 });
    if (t < 1.8) dust(ctx, ax - 150, 1030, t - 0.6, 1.4, 3, '#776d8a');
    const fallen = t > HIT1;
    // Bunty & Chintu step out
    const out = t > 2.2;
    const hit1 = t > HIT1, hit2 = t > HIT2;
    if (out) {
      const bx = keys(t, [[2.2, 380], [3.0, 760]], ease.out), cx = keys(t, [[2.2, 420], [3.1, 930]], ease.out);
      const bRot = hit1 ? -Math.PI / 2 * ease.out(prog(HIT1, HIT1 + 0.25, t)) : 0;
      const cRot = hit2 ? Math.PI / 2 * ease.out(prog(HIT2, HIT2 + 0.25, t)) : 0;
      S.c(ctx, 'bunty', { x: bx, y: GY + (hit1 ? 10 : 0), s: 1.3, rot: bRot, arms: hit1 ? 'up' : (t > 21 && t < 23.6 ? 'shrug' : 'idle'), expr: hit1 ? 'dead' : (t > 3.4 ? 'scared' : 'laugh'), legs: hit1 ? 'stand' : undefined });
      S.c(ctx, 'chintu', { x: cx, y: GY + (hit2 ? 14 : 0), s: 1.3, rot: cRot, arms: hit2 ? 'up' : (t > 7 && t < 10.3 ? 'hold' : 'idle'), expr: hit2 ? 'dead' : (t > 3.4 ? 'scared' : 'laugh') });
      if (hit1 && t < FAIL + 6) dizzy(ctx, bx - 170, GY - 60, t, 1.0);
      if (hit2 && t < FAIL + 6) dizzy(ctx, cx + 190, GY - 50, t + 1, 1.0);
    } else {
      // still inside cheering (seen through openings)
    }
    // Mummy
    const mThrow = t > THROW - 1.0 && t < THROW + 0.3;
    S.c(ctx, 'mummy', { x: 1330, y: GY + 4, s: 1.45, face: -1, prop: t < THROW + 0.05 ? c => chappal(c, 6, 4, mThrow ? -2.2 : -0.4, 0.75) : null, arms: mThrow ? 'throw' : (t > 14.3 && t < 17.6 ? 'hips' : (t > THROW + 0.3 ? 'hips' : 'hips')), expr: t > 17.2 && t < 17.8 ? 'angry' : (t > THROW + 0.3 ? 'smug' : 'angry'), headTilt: t > 14.6 && t < 17.6 ? -0.15 : 0, look: t > 14.6 && t < 17.6 ? [-1, 0] : [0.3, 0] });
    
    // the homing chappal
    if (t > THROW && t < HIT2 + 0.6) {
      let x, y, rot;
      const bx = 760, cx = 930;
      if (t < HIT1) { const p = prog(THROW, HIT1, t); x = lerp(1330, bx + 40, p); y = GY - 320 - Math.sin(p * Math.PI) * 260 + p * 60; rot = t * 22; }
      else if (t < HIT2) { const p = prog(HIT1, HIT2, t); x = lerp(bx + 40, cx, p); y = GY - 260 - Math.sin(p * Math.PI) * 180; rot = t * 22; }
      else { const p = prog(HIT2, HIT2 + 0.6, t); x = lerp(cx, cx + 400, p); y = GY - 260 - Math.sin(p * Math.PI) * 300; rot = t * 22; }
      ctx.save(); ctx.globalAlpha = 0.5; for (let k = 1; k < 6; k++) { circle(ctx, x + k * 26, y + Math.sin(t * 30 + k) * 8, 18 - k * 2); fs(ctx, '#ddd', 0); } ctx.restore();
      chappal(ctx, x, y, rot, 1.1);
    }
    if (t > HIT1 - 0.05) pow(ctx, 800, GY - 300, 'THWACK!', t - HIT1, 0.9, '#ffd23f', 3);
    if (t > HIT2 - 0.05) pow(ctx, 990, GY - 290, 'DHISHOOM!', t - HIT2, 0.9, '#ff9f1c', 6);
    ctx.restore();
    // lock-on reticles
    if (t > 24.9 && t < HIT2) {
      for (const [x, y, t0] of [[770, GY - 230, 24.9], [940, GY - 215, 25.2]]) {
        if (t < t0) continue;
        const p = ease.out(clamp((t - t0) / 0.3)), r = lerp(180, 90, p);
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2);
        ctx.strokeStyle = '#ff2e4d'; ctx.lineWidth = 6; circle(ctx, 0, 0, r); ctx.stroke();
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); line(ctx, r - 25, 0, r + 25, 0, 6, '#ff2e4d'); }
        ctx.restore();
      }
      if (Math.floor(t * 6) % 2) txt(ctx, 'TARGET LOCKED', W / 2, 160, { size: 70, font: 'Lucky', fill: '#ff2e4d', lw: 10 });
    }
    if (t > FAIL) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = clamp((t - FAIL) / 0.4); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    wanted(ctx, 5, t); money(ctx, 50); minimap(ctx, t, { cops: t > 10.4 && t < 21 ? 1 : 0, night: true });
  },
  post(ctx, t) {
    if (t > FAIL && t < 35.5) bigCenter(ctx, 'MISSION FAILED', 'Reason: Mummy ki chappal', t - FAIL, { y: 380 });
  },
};

// ---------------- HOSPITAL ----------------
function bed(ctx, x, y) {
  rr(ctx, x - 230, y - 60, 460, 70, 10); fs(ctx, '#e9f5ff', 5);
  line(ctx, x - 220, y + 10, x - 220, y + 110, 10, '#9aa'); line(ctx, x + 220, y + 10, x + 220, y + 110, 10, '#9aa');
  rr(ctx, x - 250, y - 220, 30, 330, 8); fs(ctx, '#9ab', 5);
}
function blanket(ctx, x, y) {
  rr(ctx, x - 160, y - 110, 400, 120, 20); fs(ctx, '#90e0ef', 5);
  line(ctx, x - 150, y - 80, x + 230, y - 80, 4, '#48cae4');
}
export const hospital = {
  id: 'hospital',
  dur: 41,
  fadeIn: 1.0, fadeOut: 0,
  music: [[0, 17, 'sad', 0.3], [17, 23, 'chill', 0.25], [27, 38, 'sneaky', 0.25]],
  sfx: [[0, 'beep', { dur: 41, vol: 0.25 }], [4.5, 'kaching', { reverse: true }], [20.6, 'whoosh'], [22.4, 'bonk'], [23.0, 'door'], [27.2, 'snore', { dur: 6 }], [34.0, 'door']],
  lines: [
    { t: 7.5, who: 'chintu', text: 'Bhai... toh humne aaj kamaya kya?', hi: 'भाई... तो हमने आज कमाया क्या?', dur: 3.2 },
    { t: 11.0, who: 'bunty', text: 'Experience, Chintu. EXPERIENCE.', hi: 'एक्सपीरियंस, चिंटू। एक्सपीरियंस।', dur: 3.4 },
    { t: 17.0, who: 'bunty', text: '...Toh? Ek baar aur khelein?', hi: '...तो? एक बार और खेलें?', dur: 2.8 },
    { t: 20.0, who: 'chintu', text: 'BHAIII!!!', hi: 'भाईईई!!!', style: 'shout', dur: 2.0 },
    { t: 24.4, who: 'mummy', text: 'Kya chal raha hai yahan?', hi: 'क्या चल रहा है यहाँ?', dur: 2.6 },
    { t: 31.2, who: 'mummy', text: 'Hmm. Achhe bachche.', hi: 'हम्म। अच्छे बच्चे।', dur: 2.6 },
    { t: 35.0, who: 'bunty', text: '...kal phir chalein?', hi: '...कल फिर चलें?', fx: 'whisper', dur: 2.4, size: 36 },
    { t: 37.6, who: 'chintu', text: '...haan.', hi: '...हाँ।', fx: 'whisper', dur: 2.0, size: 34 },
  ],
  draw(ctx, t, S) {
    ctx.save(); camera(ctx, t, { x: 960, y: 590, zoom: 1.1 });
    room(ctx, { wall: '#d7eef7', floor: '#bfd7df', trim: '#7fb7c9', floorY: 820, stripes: 'rgba(255,255,255,0.18)' });
    // window (night) + curtain
    rr(ctx, 820, 120, 280, 300, 8); fs(ctx, '#1b1a4a', 7); circle(ctx, 1040, 190, 26); fs(ctx, '#fff6d6', 0); line(ctx, 960, 120, 960, 420, 6); line(ctx, 820, 270, 1100, 270, 6);
    // door
    const doorOpen = (t > 23 && t < 34.3);
    rr(ctx, 40, 320, 240, 500, 6); fs(ctx, '#3b2a20', 6);
    if (!doorOpen) { rr(ctx, 50, 330, 220, 490, 4); fs(ctx, '#e9ecef', 5); circle(ctx, 240, 590, 10); fs(ctx, '#999', 3); }
    else {
      S.c(ctx, 'mummy', { x: 170, y: 830, s: 1.3, arms: t < 31 ? 'throw' : 'hips', expr: t < 31 ? 'angry' : 'smug', prop: t < 31 ? c => chappal(c, 0, -20, -0.6, 0.8) : null });
      ctx.beginPath(); ctx.moveTo(280, 320); ctx.lineTo(390, 290); ctx.lineTo(390, 860); ctx.lineTo(280, 820); ctx.closePath(); fs(ctx, '#e9ecef', 6);
    }
    // heart monitor
    rr(ctx, 1630, 300, 160, 130, 12); fs(ctx, '#222', 6);
    ctx.save(); rr(ctx, 1642, 312, 136, 106, 6); ctx.clip(); ctx.fillStyle = '#04261a'; ctx.fillRect(1642, 312, 136, 106);
    ctx.beginPath();
    for (let x = 0; x <= 136; x += 3) { const ph = (x / 136 + t) % 1; const y = ph > 0.45 && ph < 0.55 ? (ph < 0.5 ? -40 : 30) * Math.sin((ph - 0.45) / 0.1 * Math.PI) : 0; ctx.lineTo(1642 + x, 365 + y); }
    ctx.lineWidth = 4; ctx.strokeStyle = '#4dff88'; ctx.stroke(); ctx.restore();
    line(ctx, 1710, 430, 1710, 690, 8, '#999');
    // beds
    const asleep = t > 26.8 && t < 34.8;
    bed(ctx, 640, 760); bed(ctx, 1380, 760);
    const pillowFly = t > 20.6 && t < 22.5;
    S.c(ctx, 'chintu', { x: 560, y: 770, s: 1.25, legs: 'hidden', bandage: true, arms: asleep ? 'sleep' : (t > 20 && t < 20.7 ? 'pillow' : (t > 7.5 && t < 10.7 ? 'shrug' : 'idle')), expr: asleep ? 'sleep' : (t > 20 && t < 22.5 ? 'angry' : (t > 34.8 && t > 37.6 ? 'smug' : 'sad')), rot: asleep ? -0.15 : 0 });
    blanket(ctx, 600, 790);
    S.c(ctx, 'bunty', { x: 1300, y: 770, s: 1.3, legs: 'hidden', bandage: true, face: -1, arms: asleep ? 'sleep' : (t > 11 && t < 14.4 ? 'pointUp' : (t > 17 && t < 19.8 ? 'shrug' : 'idle')), expr: asleep ? 'sleep' : (t > 22.4 && t < 24.4 ? 'dead' : (t > 11 && t < 14.4 ? 'smug' : (t > 17 ? 'laugh' : 'bored'))), rot: asleep ? 0.15 : 0, noGlasses: false });
    blanket(ctx, 1340, 790);
    if (pillowFly) { const p = prog(20.6, 22.4, t); ctx.save(); ctx.translate(lerp(600, 1300, p), 520 - Math.sin(p * Math.PI) * 160); ctx.rotate(p * 8); rr(ctx, -60, -35, 120, 70, 24); fs(ctx, '#fff', 5); ctx.restore(); }
    if (t > 22.4) pow(ctx, 1300, 480, 'POOF!', t - 22.4, 0.8, '#fff', 5);
    if (asleep) for (let i = 0; i < 3; i++) for (const zx of [620, 1360]) { const u = (t * 0.6 + i / 3 + zx) % 1; ctx.save(); ctx.globalAlpha = 1 - u; txt(ctx, 'Z', zx + u * 70, 400 - u * 150, { size: 36 + u * 30, fill: '#fff', lw: 6 }); ctx.restore(); }
    ctx.restore();
    wanted(ctx, 0, t); money(ctx, t > 4.6 ? 0 : 50, t, 4.6); minimap(ctx, t, { scroll: 0 });
  },
  post(ctx, t) {
    if (t > 0.6 && t < 4.4) {
      const p = ease.back(clamp((t - 0.6) / 0.4)), o = clamp((t - 4.0) / 0.4);
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(W / 2, 140); ctx.scale(p, p);
      rr(ctx, -470, -70, 940, 140, 20); fs(ctx, 'rgba(27,16,48,0.88)', 6, '#1dd3b0');
      txt(ctx, 'RESPAWNED: Palm Bay Hospital', 0, 4, { size: 56, fill: '#fff', lw: 0 });
      ctx.restore();
    }
    popup(ctx, 'HOSPITAL KA BILL: -₹50', t - 4.6, 2.8, '#e63946');
    iris(ctx, ease.in(clamp((t - 39.8) / 1.0)), 1300, 520);
  },
};

// ---------------- OUTRO ----------------
export const outro = {
  id: 'outro',
  dur: 36,
  fadeIn: 0.8, fadeOut: 1.5,
  music: [[0, 36, 'title', 0.6]],
  sfx: [[1.0, 'whoosh'], [13.0, 'star'], [13.3, 'star'], [13.6, 'star'], [13.9, 'star'], [14.2, 'star'], [16.0, 'click'], [16.2, 'ding'], [16.6, 'bell']],
  lines: [
    { t: 5.0, who: 'bunty', text: 'Video pasand aaya toh LIKE karo!', hi: 'वीडियो पसंद आया तो लाइक करो!', dur: 3.2 },
    { t: 8.4, who: 'chintu', text: 'Aur SUBSCRIBE karo!', hi: 'और सब्सक्राइब करो!', dur: 2.4 },
    { t: 11.0, who: 'bunty', text: 'Warna... wanted level badh jaayega!', hi: 'वरना... वांटेड लेवल बढ़ जाएगा!', dur: 3.6 },
  ],
  draw(ctx, t, S) {
    const camX = t * 60;
    sky(ctx, t, 'night', { horizon: 720, moonX: 1780, moonY: 330 });
    skyline(ctx, camX, 720, t, { night: true });
    street(ctx, camX, t, { groundY: 860, night: true });
    const end = t > 18;
    const ep = ease.inOut(clamp((t - 18) / 1.0));
    const s = lerp(1.35, 1.05, ep);
    S.c(ctx, 'bunty', { x: lerp(780, 1340, ep), y: lerp(900, 900, ep), s, arms: t < 11 ? 'wave' : (t < 14.6 ? 'point' : 'cheer'), expr: 'laugh' });
    S.c(ctx, 'chintu', { x: lerp(1120, 1620, ep), y: 900, s, face: -1, arms: t > 8.4 && t < 11 ? 'pointUp' : 'wave', expr: 'laugh' });
    // title
    const tp = ease.back(clamp((t - 0.8) / 0.6));
    if (tp > 0 && !end) {
      ctx.save(); ctx.translate(W / 2, 170); ctx.scale(tp, tp);
      txt(ctx, 'BUNTY & CHINTU WILL RETURN...', 0, 0, { size: 84, fill: '#ffd23f', lw: 14, shadow: '#000' });
      ctx.restore();
    }
    // subscribe button
    if (t > 14.6 && !end) {
      const bp = ease.back(clamp((t - 14.6) / 0.4));
      const subbed = t > 16.0;
      ctx.save(); ctx.translate(W / 2, 400); ctx.scale(bp * (t > 16 && t < 16.2 ? 0.9 : 1), bp);
      rr(ctx, -260, -60, 520, 120, 60); fs(ctx, subbed ? '#555' : '#ff0033', 7, '#fff');
      txt(ctx, subbed ? 'SUBSCRIBED' : 'SUBSCRIBE', subbed ? -20 : 0, 6, { size: 60, font: 'Lucky', fill: '#fff', lw: 0 });
      if (subbed) {
        ctx.save(); ctx.translate(200, 0); ctx.rotate(Math.sin((t - 16.6) * 20) * 0.4 * Math.max(0, 1 - (t - 16.6))); ctx.beginPath(); ctx.moveTo(-22, 18); ctx.quadraticCurveTo(-22, -26, 0, -28); ctx.quadraticCurveTo(22, -26, 22, 18); ctx.closePath(); fs(ctx, '#ffd23f', 4); circle(ctx, 0, 24, 7); fs(ctx, '#ffd23f', 3); ctx.restore();
      }
      ctx.restore();
      // cursor
      const cx = keys(t, [[14.8, 1500], [15.8, W / 2 + 60]], ease.inOut), cy = keys(t, [[14.8, 800], [15.8, 420]], ease.inOut);
      if (t < 17.5) { ctx.save(); ctx.translate(cx, cy); ctx.scale(t > 15.95 && t < 16.15 ? 0.85 : 1, t > 15.95 && t < 16.15 ? 0.85 : 1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 60); ctx.lineTo(16, 46); ctx.lineTo(28, 72); ctx.lineTo(38, 66); ctx.lineTo(26, 42); ctx.lineTo(46, 40); ctx.closePath(); fs(ctx, '#fff', 4); ctx.restore(); }
    }
    // end screen
    if (end) {
      ctx.save(); ctx.globalAlpha = ep;
      txt(ctx, 'AGLA EPISODE:', 460, 170, { size: 60, font: 'Bangers', fill: '#1dd3b0', lw: 10 });
      txt(ctx, 'Mummy se bachke!', 460, 260, { size: 76, fill: '#ffd23f', lw: 14 });
      // placeholder areas for YouTube end-screen elements
      for (const [x, y, w, h, label] of [[120, 360, 680, 382, 'AGLA VIDEO'], [880, 520, 260, 260, 'SUBSCRIBE']]) {
        ctx.save(); ctx.setLineDash([18, 12]); rr(ctx, x, y, w, h, x > 800 ? 130 : 20); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); ctx.restore();
        txt(ctx, label, x + w / 2, y + h / 2, { size: 40, font: 'Bangers', fill: 'rgba(255,255,255,0.7)', lw: 0 });
      }
      ctx.restore();
    }
    const stars = t < 13 ? 0 : Math.min(5, 1 + Math.floor((t - 13) / 0.3));
    if (!end) wanted(ctx, stars, t, 13 + (stars - 1) * 0.3);
  },
};
