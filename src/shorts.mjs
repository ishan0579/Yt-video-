// Vertical YouTube Shorts (1080x1920) cut from the episode.
// node src/shorts.mjs [shortId] [--still t]   -> output/shorts/<id>.mp4 (video only; audio added by build_shorts.sh)
import fs from 'fs';
import { spawn } from 'child_process';
import { createCanvas } from '@napi-rs/canvas';
import { W, H, FPS, clamp, lerp, ease, rr, fs as fill, txt, wrap, vgrad, line, starPath } from './engine.mjs';
import { makeS } from './kit.mjs';
import { CHARS } from './characters.mjs';
import { SCENES } from './scenes/index.mjs';

export const SHORTS = [
  { id: 'short1_banana_robbery', scene: 'bank', segs: [[4.0, 21.0], [24.0, 26.5], [29.4, 58.6]],
    title: 'AGAR GTA 6 DESI HOTA?', sub: 'Bank robbery... BANANA se!', accent: '#ffd23f' },
  { id: 'short2_mummy_final_boss', scene: 'mummy', segs: [[0.6, 35.2]],
    title: 'AGAR GTA 6 DESI HOTA?', sub: 'Final boss: MUMMY KI CHAPPAL', accent: '#ff4fa3' },
  { id: 'short3_cycle_supercar', scene: 'bikechase', segs: [[3.8, 51.8]],
    title: 'AGAR GTA 6 DESI HOTA?', sub: 'Cycle = SUPERCAR', accent: '#1dd3b0' },
];

const VW = 1080, VH = 1920;
const CROP_W = 1200, FRAME_Y = 450, FRAME_H = Math.round(1080 * VW / CROP_W); // 972

function activeLine(scene, t) {
  let best = null;
  for (const l of scene._lines) if (t >= l.t && t <= l.t + l.dur && (!best || l.t > best.t)) best = l;
  return best;
}

function drawVertical(vctx, src, scene, t, S, st) {
  // background
  vctx.fillStyle = vgrad(vctx, 0, VH, ['#1b1030', '#3a0f5c', '#1b1030']); vctx.fillRect(0, 0, VW, VH);
  vctx.save(); vctx.globalAlpha = 0.12;
  for (let i = -6; i < 20; i++) { vctx.fillStyle = i % 2 ? '#ff4fa3' : '#4cc9f0'; vctx.beginPath(); vctx.moveTo(i * 120 + (st.lt * 40) % 240, 0); vctx.lineTo(i * 120 + 60 + (st.lt * 40) % 240, 0); vctx.lineTo(i * 120 - 400 + (st.lt * 40) % 240, VH); vctx.lineTo(i * 120 - 460 + (st.lt * 40) % 240, VH); vctx.closePath(); vctx.fill(); }
  vctx.restore();
  // camera follows the speaker (or the group)
  const al = activeLine(scene, t);
  const xs = Object.values(S.anchors).map(a => a[0]).filter(x => x > -200 && x < W + 200);
  let target = st.cx;
  if (al && S.anchors[al.who]) target = S.anchors[al.who][0];
  else if (xs.length) target = xs.reduce((a, b) => a + b, 0) / xs.length;
  target = clamp(target, CROP_W / 2, W - CROP_W / 2);
  st.cx = st.snap ? target : st.cx + (target - st.cx) * 0.06;
  st.snap = false;
  // video frame
  vctx.save();
  rr(vctx, 0, FRAME_Y, VW, FRAME_H, 0); vctx.clip();
  vctx.drawImage(src, st.cx - CROP_W / 2, 0, CROP_W, 1080, 0, FRAME_Y, VW, FRAME_H);
  vctx.restore();
  line(vctx, 0, FRAME_Y, VW, FRAME_Y, 10, st.accent); line(vctx, 0, FRAME_Y + FRAME_H, VW, FRAME_Y + FRAME_H, 10, st.accent);
  // hook title
  const pin = ease.back(clamp(st.lt / 0.45));
  vctx.save(); vctx.translate(VW / 2, 195); vctx.scale(pin, pin); vctx.rotate(-0.03);
  rr(vctx, -500, -135, 1000, 270, 36); fill(vctx, '#ffd23f', 12);
  const fit = (str, font, size, maxW) => { vctx.font = `${size}px ${font}`; const w = vctx.measureText(str).width; return w > maxW ? Math.floor(size * maxW / w) : size; };
  txt(vctx, st.title, 0, -42, { size: fit(st.title, 'Lucky', 86, 900), font: 'Lucky', fill: '#e63946', lw: 14 });
  txt(vctx, st.sub, 0, 62, { size: fit(st.sub, 'BalooX', 66, 900), font: 'BalooX', fill: '#1b1030', lw: 0 });
  vctx.restore();
  for (let i = 0; i < 5; i++) { starPath(vctx, VW / 2 - 200 + i * 100, 390, 28, 12); fill(vctx, i < Math.min(5, 1 + Math.floor(st.lt * 1.5)) ? '#ffd23f' : 'rgba(255,255,255,0.2)', 5); }
  // captions
  if (al) {
    const C = CHARS[al.who] || { name: (al.name || al.who).toUpperCase(), tag: al.tag || '#457b9d' };
    const age = t - al.t, p = ease.back(clamp(age / 0.2));
    vctx.font = '62px BalooX';
    const lines = wrap(vctx, al.text, 860);
    const y0 = FRAME_Y + FRAME_H + 62;
    vctx.save(); vctx.translate(VW / 2, y0); vctx.scale(p, p);
    vctx.font = '40px Bangers';
    const nw = vctx.measureText(C.name).width + 40;
    rr(vctx, -nw / 2, -40, nw, 56, 12); fill(vctx, C.tag, 5);
    txt(vctx, C.name, 0, -12, { size: 40, font: 'Bangers', fill: '#fff', lw: 6 });
    lines.slice(0, 2).forEach((s, i) => txt(vctx, s, 0, 60 + i * 72, { size: 62, font: 'BalooX', fill: al.style === 'shout' ? '#ffd23f' : '#fff', lw: 14 }));
    vctx.restore();
  }
  // end card
  if (st.left < 2.6) {
    const q = ease.back(clamp((2.6 - st.left) / 0.4));
    vctx.save(); vctx.translate(VW / 2, FRAME_Y + FRAME_H / 2); vctx.scale(q, q); vctx.rotate(-0.04);
    rr(vctx, -470, -130, 940, 260, 34); fill(vctx, '#e63946', 12, '#fff');
    txt(vctx, 'PURA EPISODE DEKHO', 0, -38, { size: 78, font: 'Lucky', fill: '#fff', lw: 12 });
    txt(vctx, 'channel pe! (10 min)', 0, 58, { size: 60, font: 'BalooX', fill: '#ffd23f', lw: 10 });
    vctx.restore();
  }
}

function renderSource(ctx, scene, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const S = makeS(scene, t);
  ctx.save(); scene.draw(ctx, t, S); ctx.restore();
  if (scene.post) { ctx.save(); scene.post(ctx, t, S); ctx.restore(); }
  return S;
}

export function shortDuration(sh) { return sh.segs.reduce((a, [x, y]) => a + (y - x), 0); }

async function renderShort(sh, stillT = null) {
  const scene = SCENES.find(s => s.id === sh.scene);
  const src = createCanvas(W, H), sctx = src.getContext('2d');
  const out = createCanvas(VW, VH), vctx = out.getContext('2d');
  const total = shortDuration(sh);
  const st = { cx: W / 2, snap: true, title: sh.title, sub: sh.sub, accent: sh.accent, lt: 0, left: total };
  fs.mkdirSync('output/shorts', { recursive: true });
  if (stillT != null) {
    let acc = 0;
    for (const [a, b] of sh.segs) { if (stillT < acc + (b - a)) { const t = a + (stillT - acc); st.lt = stillT; st.left = total - stillT; const S = renderSource(sctx, scene, t); drawVertical(vctx, src, scene, t, S, st); break; } acc += b - a; }
    const f = `tests/stills/${sh.id}_${stillT}.png`; fs.mkdirSync('tests/stills', { recursive: true });
    fs.writeFileSync(f, await out.encode('png')); console.log(f); return;
  }
  const file = `build/${sh.id}_video.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${VW}x${VH}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-tune', 'animation', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  let acc = 0;
  for (const [a, b] of sh.segs) {
    st.snap = true;
    const n = Math.round((b - a) * FPS);
    for (let f = 0; f < n; f++) {
      const t = a + f / FPS;
      st.lt = acc + f / FPS; st.left = total - st.lt;
      const S = renderSource(sctx, scene, t);
      drawVertical(vctx, src, scene, t, S, st);
      if (!ff.stdin.write(out.data())) await new Promise(r => ff.stdin.once('drain', r));
    }
    acc += b - a;
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`${sh.id}: ${total.toFixed(1)}s rendered`);
}

if (process.argv[1] && process.argv[1].endsWith('shorts.mjs')) {
  const id = process.argv[2];
  const si = process.argv.indexOf('--still');
  const list = id && id !== 'all' ? SHORTS.filter(s => s.id === id) : SHORTS;
  if (si > 0) { for (const t of process.argv[si + 1].split(',').map(Number)) await renderShort(list[0], t); }
  else for (const sh of list) await renderShort(sh);
  // write a manifest for the audio step
  fs.writeFileSync('build/shorts.json', JSON.stringify(SHORTS.map(s => ({ ...s, duration: shortDuration(s) })), null, 1));
}
