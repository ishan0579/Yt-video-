// Render scenes to video segments: node src/render.mjs <sceneIdx,...>
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { makeCanvas, W, H, FPS, fadeRect } from './engine.mjs';
import { drawBubbles } from './dialogue.mjs';
import { makeS } from './kit.mjs';
import { SCENES } from './scenes/index.mjs';

export function renderFrame(ctx, scene, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const S = makeS(scene, t);
  ctx.save(); scene.draw(ctx, t, S); ctx.restore();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (!scene.noBubbles) drawBubbles(ctx, scene._lines, S.anchors, t);
  if (scene.post) { ctx.save(); scene.post(ctx, t, S); ctx.restore(); }
  const fi = scene.fadeIn ?? 0.3, fo = scene.fadeOut ?? 0.3;
  if (fi > 0 && t < fi) fadeRect(ctx, 1 - t / fi);
  if (fo > 0 && t > scene.dur - fo) fadeRect(ctx, (t - (scene.dur - fo)) / fo);
}

async function renderScene(idx, outDir) {
  const scene = SCENES[idx];
  const [c, ctx] = makeCanvas();
  const out = path.join(outDir, `seg_${String(idx).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-g', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(scene.dur * FPS);
  const t0 = Date.now();
  for (let f = 0; f < n; f++) {
    renderFrame(ctx, scene, f / FPS);
    if (!ff.stdin.write(c.data())) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`scene ${idx} ${scene.id}: ${n} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && process.argv[1].endsWith('render.mjs')) {
  const ids = (process.argv[2] || SCENES.map((_, i) => i).join(',')).split(',').map(Number);
  const outDir = process.argv[3] || 'build';
  fs.mkdirSync(outDir, { recursive: true });
  for (const i of ids) await renderScene(i, outDir);
}
