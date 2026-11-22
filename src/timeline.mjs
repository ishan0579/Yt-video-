// Export the global timeline (scene offsets, dialogue + syllables, sfx, music) and SRT subtitles.
import fs from 'fs';
import { SCENES } from './scenes/index.mjs';

const out = { sr: 44100, scenes: [], lines: [], sfx: [], music: [] };
let start = 0;
for (const s of SCENES) {
  out.scenes.push({ id: s.id, start, dur: s.dur });
  for (const l of s._lines) {
    if (l.t >= s.dur) continue;
    out.lines.push({ t: start + l.t, dur: Math.min(l.dur, s.dur - l.t), who: l.who, voice: l.voice || l.who, text: l.text, style: l.style || 'normal', mega: !!l.mega, syl: l.syl, name: l.name });
  }
  for (const [t, name, o = {}] of s.sfx || []) if (t < s.dur) out.sfx.push({ t: start + t, name, ...o, dur: o.dur != null ? Math.min(o.dur, s.dur - t) : undefined });
  for (const [a, b, cue, vol] of s.music || []) if (cue !== 'none') out.music.push({ from: start + a, to: start + Math.min(b, s.dur), cue, vol, sceneStart: start });
  start += s.dur;
}
out.total = start;
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/timeline.json', JSON.stringify(out, null, 1));

// SRT (speaker: text)
const NAMES = { bunty: 'Bunty', chintu: 'Chintu', dadi: 'Dadi', police: 'Police Uncle', heli: 'Police (Helicopter)', mummy: 'Mummy', lala: 'Lala Ji', cashier: 'Cashier', nurse: 'Nurse' };
const ts = x => { const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = Math.floor(x % 60), ms = Math.round((x % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
const srt = out.lines.map((l, i) => `${i + 1}\n${ts(l.t)} --> ${ts(l.t + l.dur)}\n${NAMES[l.who] || l.name || l.who}: ${l.text}\n`).join('\n');
fs.writeFileSync('build/subtitles.srt', srt);
console.log(`timeline: ${out.total}s, ${out.lines.length} lines, ${out.sfx.length} sfx, ${out.music.length} music segments`);
