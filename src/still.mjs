// Render preview stills: node src/still.mjs <sceneIdx|id> t1,t2,... [outdir]
import fs from 'fs';
import { makeCanvas } from './engine.mjs';
import { renderFrame } from './render.mjs';
import { SCENES } from './scenes/index.mjs';
const key = process.argv[2];
const scene = SCENES.find((s, i) => String(i) === key || s.id === key);
const ts = (process.argv[3] || '1').split(',').map(Number);
const dir = process.argv[4] || 'tests/stills';
fs.mkdirSync(dir, { recursive: true });
const [c, ctx] = makeCanvas();
const files = [];
for (const t of ts) {
  renderFrame(ctx, scene, t);
  const f = `${dir}/${scene.id}_${t}.png`;
  fs.writeFileSync(f, await c.encode('png'));
  files.push(f);
}
console.log(files.join('\n'));
