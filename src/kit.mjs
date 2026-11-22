// Scene runtime helpers.
import { drawChar } from './characters.mjs';
import { mouthFor, talking } from './dialogue.mjs';

export function makeS(scene, t) {
  const S = { t, anchors: {}, lines: scene._lines };
  S.mouth = who => mouthFor(scene._lines, who, t);
  S.talk = who => talking(scene._lines, who, t);
  S.c = (ctx, who, o = {}) => {
    const key = o.key || (typeof who === 'string' ? who : null);
    const speaking = key && S.talk(key);
    const r = drawChar(ctx, who, {
      t,
      mouth: key ? S.mouth(key) : 0,
      headBob: speaking ? Math.sin(t * 16) * 2.5 : 0,
      ...o,
    });
    if (key && !o.noAnchor) S.anchors[key] = o.anchorOffset ? [r.head[0] + o.anchorOffset[0], r.head[1] + o.anchorOffset[1]] : r.head;
    return r;
  };
  return S;
}

// stepped value with change time: ks = [[t, v], ...]
export function step(t, ks) {
  let v = ks[0][1], at = -99;
  for (const [kt, kv] of ks) if (t >= kt) { v = kv; at = kt; }
  return [v, at];
}
// value at time from piecewise-constant events
export function since(t, t0) { return t - t0; }
