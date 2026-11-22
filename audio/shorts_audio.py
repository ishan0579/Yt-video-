"""Cut each Short's audio out of the episode mix (build/audio.wav) with tiny fades at the jump cuts."""
import json
import wave

import numpy as np

tl = json.load(open('build/timeline.json'))
starts = {s['id']: s['start'] for s in tl['scenes']}
w = wave.open('build/audio.wav')
sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32) / 32768
for sh in json.load(open('build/shorts.json')):
    parts = []
    for a, b in sh['segs']:
        g0, g1 = starts[sh['scene']] + a, starts[sh['scene']] + b
        seg = x[int(round(g0 * sr)):int(round(g0 * sr)) + int(round((b - a) * sr))].copy()
        f = int(0.03 * sr)
        ramp = np.linspace(0, 1, f)[:, None]
        seg[:f] *= ramp
        seg[-f:] *= ramp[::-1]
        parts.append(seg)
    y = np.concatenate(parts)
    fo = int(0.6 * sr)
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    out = wave.open(f"build/{sh['id']}_audio.wav", 'wb')
    out.setnchannels(ch); out.setsampwidth(2); out.setframerate(sr)
    out.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    out.close()
    print(sh['id'], round(len(y) / sr, 2), 's audio')
