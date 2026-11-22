// Render a YouTube thumbnail: node src/thumbnail.mjs output/thumbnail.png
import fs from 'fs';
import { makeCanvas, W, H, txt, rr, fs as fill, starPath, burstPath, vignette } from './engine.mjs';
import { makeS } from './kit.mjs';
import { drawAutoChase } from './scenes/s_auto.mjs';
import { drawChar } from './characters.mjs';
import { SCENES } from './scenes/index.mjs';

const [c, ctx] = makeCanvas();
const scene = SCENES.find(s => s.id === 'autochase');
const S = makeS(scene, 26);
S.mouth = () => 0; S.talk = () => false;
ctx.save();
ctx.translate(W / 2, H / 2); ctx.scale(1.15, 1.15); ctx.translate(-W / 2 - 60, -H / 2 + 40);
drawAutoChase(ctx, 26, S, { worldT: 26.2, noHud: true, scared: true, shake: 0 });
ctx.restore();
ctx.fillStyle = 'rgba(20,0,40,0.25)'; ctx.fillRect(0, 0, W, H);
vignette(ctx, 0.6);
// big characters
drawChar(ctx, 'chintu', { x: 1560, y: 1300, s: 3.2, face: -1, t: 0.5, arms: 'flail', expr: 'scared', mouth: 1, blink: false });
drawChar(ctx, 'bunty', { x: 420, y: 1330, s: 3.4, t: 0.3, arms: 'point', expr: 'laugh', mouth: 0.9, blink: false, prop: c2 => {
  c2.save(); c2.rotate(-0.5); c2.beginPath(); c2.moveTo(-10, 0); c2.quadraticCurveTo(40, 30, 80, -10); c2.quadraticCurveTo(40, 10, -10, -12); c2.closePath(); fill(c2, '#ffe14d', 4); c2.restore();
} });
// headline
ctx.save(); ctx.translate(W / 2, 170); ctx.rotate(-0.04);
burstPath(ctx, 0, 0, 640, 520, 22, 9); ctx.save(); ctx.scale(1, 0.32); ctx.restore();
ctx.restore();
ctx.save(); ctx.translate(W / 2, 180); ctx.rotate(-0.04);
rr(ctx, -760, -120, 1520, 240, 30); fill(ctx, '#ffd23f', 14);
txt(ctx, 'BANANA SE DAKAITI!', 0, 10, { size: 150, fill: '#e63946', lw: 22, stroke: '#1b1030' });
ctx.restore();
for (let i = 0; i < 5; i++) { starPath(ctx, W / 2 - 300 + i * 150, 380, 62, 27); fill(ctx, '#ffd23f', 10); }
txt(ctx, 'EP 1', W - 150, H - 90, { size: 90, fill: '#fff', lw: 16 });
const out = process.argv[2] || 'output/thumbnail.png';
fs.writeFileSync(out, await c.encode('png'));
console.log(out);
