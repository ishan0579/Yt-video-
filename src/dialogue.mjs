// Speech bubbles + babble syllables (shared with the audio synth for lip sync).
import { OUT, W, H, clamp, lerp, ease, rr, fs, txt, wrap, rng, burstPath } from './engine.mjs';
import { CHARS } from './characters.mjs';
import nodeFs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readTime(text) { return clamp(1.1 + text.length * 0.058, 1.6, 6.5); }

// compute syllables for a line (times relative to line start)
export function syllables(line, seed) {
  const R = rng(seed);
  const words = line.text.split(/\s+/).filter(Boolean);
  const units = [];
  for (const w of words) {
    const letters = w.replace(/[^A-Za-z₹0-9]/g, '');
    const n = Math.max(1, Math.round(letters.length / 2.7));
    const loud = /!/.test(w) || (letters.length > 1 && letters === letters.toUpperCase() && /[A-Z]/.test(letters));
    for (let i = 0; i < n; i++) units.push({ loud, q: /\?/.test(w) && i === n - 1 });
    if (/[,.!?]$/.test(w)) units.push({ pause: /\.\.\.$/.test(w) ? 2 : 1 });
  }
  const nSyl = units.filter(u => !u.pause).length;
  const pauseUnits = units.filter(u => u.pause).reduce((a, u) => a + u.pause, 0);
  const window = Math.min(line.dur - 0.25, Math.max(0.5, nSyl * 0.13 + pauseUnits * 0.12));
  const step = window / (nSyl + pauseUnits * 1.2);
  const out = []; let tt = 0.05;
  for (const u of units) {
    if (u.pause) { tt += step * 1.2 * u.pause; continue; }
    out.push({ t: tt, d: step * 0.85, p: (R() * 2 - 1) + (u.q ? 1.5 : 0), loud: u.loud ? 1 : 0 });
    tt += step;
  }
  return out;
}

// Real voice-over data (from audio/voices.py), if present.
export const VOFF = 0.1; // voice starts this long after the bubble pops
let VOICES = {};
try { VOICES = JSON.parse(nodeFs.readFileSync(path.join(ROOT, 'build/voices.json'), 'utf8')); } catch (e) { VOICES = {}; }

export function lineSlots(lines, sceneDur) {
  // seconds available for the voice of each line before the next line starts
  const order = lines.map((l, i) => i).sort((a, b) => lines[a].t - lines[b].t);
  const slots = new Array(lines.length);
  order.forEach((idx, k) => {
    const l = lines[idx];
    const next = k + 1 < order.length ? lines[order[k + 1]].t : sceneDur + 0.3;
    slots[idx] = Math.max(0.6, Math.min(next - l.t - VOFF - 0.12, 7));
  });
  return slots;
}

export function prepLines(lines, seedBase = 1, sceneId = 'scene', sceneDur = 999) {
  const slots = lineSlots(lines, sceneDur);
  const out = lines.map((l, i) => {
    const L = { ...l };
    L.id = `${sceneId}:${i}`;
    L.slot = slots[i];
    L.dur = L.dur ?? readTime(L.text);
    const v = VOICES[L.id];
    if (v && !L.silent) {
      L.env = v.env;
      L.audioDur = v.dur;
      L.dur = Math.max(L.dur, v.dur + VOFF + 0.45);
      L.syl = [];
    } else {
      L.syl = L.silent ? [] : syllables(L, seedBase * 1000 + i * 17 + 3);
    }
    return L;
  });
  // don't let a speaker's bubble overlap their own next bubble
  out.forEach((L, i) => {
    const nxt = out.filter(o => o.t > L.t).sort((a, b) => a.t - b.t)[0];
    if (nxt && nxt.who === L.who) L.dur = Math.min(L.dur, nxt.t - L.t - 0.05);
    L.dur = Math.min(L.dur, sceneDur - L.t);
  });
  return out;
}

export function mouthFor(lines, who, t) {
  for (const l of lines) {
    if (l.who !== who || t < l.t || t > l.t + l.dur) continue;
    const lt = t - l.t;
    if (l.env) {
      const i = Math.floor((lt - VOFF) * 30);
      const v = i >= 0 && i < l.env.length ? l.env[i] / 100 : 0;
      if (v <= 0.05) return 0;
      const chatter = 0.6 + 0.4 * Math.abs(Math.sin(Math.PI * 4.3 * (lt - VOFF)));
      return clamp(0.12 + 0.95 * v * chatter);
    }
    for (const s of l.syl) {
      if (lt >= s.t && lt <= s.t + s.d) return Math.sin(Math.PI * (lt - s.t) / s.d) * (0.65 + 0.35 * s.loud);
    }
    return 0;
  }
  return 0;
}
export function talking(lines, who, t) {
  return lines.some(l => {
    if (l.who !== who || t < l.t || t > l.t + l.dur) return false;
    if (l.env) return t - l.t - VOFF < l.env.length / 30;
    return l.syl.length && t - l.t <= l.syl[l.syl.length - 1].t + 0.2;
  });
}

export function drawBubbles(ctx, lines, anchors, t) {
  for (const l of lines) {
    if (t < l.t || t > l.t + l.dur) continue;
    const age = t - l.t, left = l.t + l.dur - t;
    const C = CHARS[l.who] || { name: (l.name || l.who).toUpperCase(), tag: l.tag || '#555' };
    const anc = l.at || anchors[l.who];
    drawBubble(ctx, l, C, anc, age, left);
  }
}

function drawBubble(ctx, l, C, anc, age, left) {
  const shout = l.style === 'shout', think = l.style === 'think';
  const size = l.size || (shout ? 50 : 44);
  ctx.font = `${size}px BalooX`;
  const maxW = l.maxW || 640;
  const lines = wrap(ctx, l.text, maxW);
  const tw = Math.max(...lines.map(s => ctx.measureText(s).width), 160);
  const lh = size * 1.12;
  const bw = tw + 64, bh = lines.length * lh + 46;
  let bx, by, tailX, tailY;
  if (anc && !l.bottom) {
    tailX = anc[0]; tailY = anc[1] + (l.tailDy || 0);
    bx = clamp(anc[0] - bw / 2 + (l.dx || 0), 30, W - 30 - bw);
    by = anc[1] - bh - 60 + (l.dy || 0);
    if (by < 60) { by = 60; }
  } else {
    bx = W / 2 - bw / 2; by = H - bh - 70; tailX = null;
  }
  const pin = ease.back(clamp(age / 0.22)), pout = clamp(1 - left / 0.18);
  const cx = bx + bw / 2, cy = by + bh / 2;
  ctx.save();
  ctx.globalAlpha = 1 - pout;
  ctx.translate(cx, cy); const sc = lerp(0.3, 1, pin) * (shout ? 1 + Math.sin(age * 40) * 0.01 : 1); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  const fill = l.fill || (think ? '#f3f0ff' : '#ffffff');
  // tail
  if (tailX != null && !think) {
    const bxm = clamp(tailX, bx + 50, bx + bw - 50);
    const ty = Math.min(tailY - 6, by + bh + 70);
    ctx.beginPath(); ctx.moveTo(bxm - 22, by + bh - 4); ctx.lineTo(lerp(bxm, tailX, 0.7), ty); ctx.lineTo(bxm + 22, by + bh - 4); ctx.closePath();
    fs(ctx, fill, 6);
  }
  if (think && tailX != null) {
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(lerp(cx, tailX, 0.3 + i * 0.25), lerp(by + bh, tailY, 0.3 + i * 0.25), 16 - i * 4, 0, 7); fs(ctx, fill, 5); }
  }
  if (shout) { burstPath(ctx, cx, cy, bw * 0.62, bw * 0.52, 16, 3); ctx.save(); ctx.scale(1, 1); ctx.restore(); }
  if (shout) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, (bh + 40) / (bw * 0.9)); burstPath(ctx, 0, 0, bw * 0.62, bw * 0.5, 18, 5); ctx.restore();
    fs(ctx, '#fff3b0', 7);
  } else {
    rr(ctx, bx, by, bw, bh, think ? bh / 2 : 30); fs(ctx, fill, 6);
  }
  // re-cover tail joint
  if (tailX != null && !think && !shout) {
    const bxm = clamp(tailX, bx + 50, bx + bw - 50);
    ctx.fillStyle = fill; ctx.fillRect(bxm - 16, by + bh - 9, 32, 6);
  }
  lines.forEach((s, i) => txt(ctx, s, cx, by + 26 + lh / 2 + i * lh, { size, font: 'BalooX', fill: l.color || (shout ? '#d62828' : '#1b1030'), lw: 0 }));
  // name tag
  if (!l.noName) {
    ctx.font = '30px Bangers';
    const nw = ctx.measureText(C.name).width + 30;
    rr(ctx, bx + 18, by - 22, nw, 40, 10); fs(ctx, C.tag, 4);
    txt(ctx, C.name, bx + 18 + nw / 2, by - 1, { size: 30, font: 'Bangers', fill: '#fff', lw: 5 });
  }
  ctx.restore();
}
