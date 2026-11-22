// Costume accessories drawn in screen space around a character's head (see drawChar's headC/headR).
import { rr, circle, ell, fs, line, txt, TAU } from './engine.mjs';

export function cowboyHat(ctx, [x, y], r, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 60 * face, r / 60);
  ell(ctx, 0, -48, 110, 22, -0.05); fs(ctx, '#8d5524', 5);
  ctx.beginPath(); ctx.moveTo(-50, -55); ctx.quadraticCurveTo(-55, -120, -10, -118); ctx.quadraticCurveTo(0, -104, 10, -118); ctx.quadraticCurveTo(55, -120, 50, -55); ctx.closePath(); fs(ctx, '#a0682e', 5);
  ctx.fillStyle = '#5c3d1e'; ctx.fillRect(-50, -72, 100, 14); line(ctx, -50, -65, 50, -65, 0.1);
  ctx.restore();
}
export function bigMustache(ctx, [x, y], r, face = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 60 * face, r / 60);
  ctx.beginPath(); ctx.moveTo(24, 14);
  ctx.bezierCurveTo(0, 0, -40, 20, -46, 0); ctx.bezierCurveTo(-30, 34, 10, 26, 24, 22);
  ctx.bezierCurveTo(40, 26, 80, 34, 92, 0); ctx.bezierCurveTo(86, 20, 50, 0, 24, 14); fs(ctx, '#2b1a12', 4);
  ctx.restore();
}
export function cape(ctx, x, yFeet, s, face = 1, t = 0) {
  // behind the body; s = character scale (incl. base)
  ctx.save(); ctx.translate(x, yFeet); ctx.scale(s * face, s);
  const flutter = Math.sin(t * 6) * 10;
  ctx.beginPath(); ctx.moveTo(-30, -150); ctx.lineTo(30, -150); ctx.lineTo(10 - 40, -20 + flutter * 0.3); ctx.quadraticCurveTo(-60, -10, -95 + flutter, -30); ctx.closePath(); fs(ctx, '#d62828', 5);
  ctx.restore();
}
export function chestEmblem(ctx, x, yFeet, s, face = 1) {
  ctx.save(); ctx.translate(x + 8 * s * face, yFeet - 112 * s); ctx.scale(s, s);
  circle(ctx, 0, 0, 22); fs(ctx, '#ffd23f', 4);
  txt(ctx, 'B', 0, 3, { size: 32, font: 'Lucky', fill: '#d62828', lw: 0 });
  ctx.restore();
}
export function sehra(ctx, [x, y], r, face = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 60 * face, r / 60);
  // turban (safa)
  ctx.beginPath(); ctx.ellipse(0, -48, 66, 40, 0, Math.PI, 0); ctx.lineTo(66, -36); ctx.quadraticCurveTo(0, -18, -66, -36); ctx.closePath(); fs(ctx, '#f77f00', 5);
  for (let k = 0; k < 3; k++) line(ctx, -55 + k * 10, -50 - k * 8, 55 - k * 10, -40 - k * 10, 4, '#d62828');
  ctx.beginPath(); ctx.moveTo(40, -70); ctx.quadraticCurveTo(70, -110, 52, -120); fs(ctx, null, 5); circle(ctx, 52, -120, 8); fs(ctx, '#ffd23f', 3);
  // flower strings over the face
  for (let i = 0; i < 9; i++) {
    const sx = -40 + i * 12, sway = Math.sin(t * 3 + i) * 2;
    for (let k = 0; k < 7; k++) { circle(ctx, sx + sway, -24 + k * 12, 5); fs(ctx, k % 2 ? '#ffffff' : '#ffb3c6', 2); }
  }
  ctx.restore();
}
export function afro(ctx, [x, y], r) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 60, r / 60);
  for (let i = 0; i < 12; i++) { const a = Math.PI * 0.95 + (i / 11) * Math.PI * 1.1; circle(ctx, Math.cos(a) * 70, Math.sin(a) * 66 - 10, 36); fs(ctx, '#1b1030', 5); }
  circle(ctx, 0, -30, 70); fs(ctx, '#1b1030', 0);
  ctx.restore();
}
export function discoGlasses(ctx, [x, y], r, face = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 60 * face, r / 60);
  for (const ex of [4, 36]) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr2 = k % 2 ? 9 : 20; ctx.lineTo(ex + Math.cos(a) * rr2, -14 + Math.sin(a) * rr2); }
    ctx.closePath(); fs(ctx, `hsl(${(t * 200 + ex * 5) % 360},90%,60%)`, 4);
  }
  ctx.restore();
}
export function scissors(ctx, x, y, s = 1, open = 0.3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const sgn of [-1, 1]) { ctx.save(); ctx.rotate(sgn * open); line(ctx, 0, 0, 60, 0, 6, '#bbb'); circle(ctx, -14, sgn * 8, 10); ctx.lineWidth = 5; ctx.strokeStyle = '#e63946'; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
