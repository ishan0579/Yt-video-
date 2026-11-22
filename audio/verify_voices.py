"""Verify every voice line with Sarvam speech-to-text (saaras:v3) and re-generate garbled lines.

Usage: python3 audio/verify_voices.py build/timeline.json build/
Compares the transcript of each generated line with its Devanagari script (character error rate).
Lines above the threshold are re-sampled (up to 3 fresh takes) and the best take is kept.
Writes build/voices_verify.txt.
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voices as V  # noqa: E402
import soundfile as sf  # noqa: E402

THRESH = 0.30


def norm(s):
    s = unicodedata.normalize('NFC', s)
    s = s.replace('़', '')            # nukta
    s = s.replace('ँ', 'ं')      # chandrabindu -> anusvara
    s = re.sub(r'[^ऀ-ॿ]', '', s)  # keep Devanagari only
    s = s.replace('।', '').replace('॥', '')
    s = re.sub(r'(.)\1{2,}', r'\1', s)     # stretched vowels (भाईईई)
    return s


def cer(a, b):
    a, b = norm(a), norm(b)
    if not a:
        return 0.0 if not b else 1.0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1] / len(a)


def stt(path):
    out = subprocess.run(['curl', '-sS', '--max-time', '90', '-X', 'POST', 'https://api.sarvam.ai/speech-to-text',
                          '-H', 'api-subscription-key: proxy-injected', '-F', f'file=@{path};type=audio/wav',
                          '-F', 'model=saaras:v3', '-F', 'language_code=hi-IN'], capture_output=True, text=True)
    try:
        return json.loads(out.stdout).get('transcript', '')
    except Exception:
        return ''


def main():
    tl = json.load(open(sys.argv[1]))
    out = sys.argv[2] if len(sys.argv) > 2 else 'build/'
    vj = os.path.join(out, 'voices.json')
    voices = json.load(open(vj))
    cache = os.path.join(out, 'voices', 'cache')
    report = []
    fixed = 0
    for line in tl['lines']:
        v = voices.get(line['id'])
        if not v or not line.get('hi'):
            continue
        if 'muffle' in (line.get('fx') or ''):
            report.append(f"{line['id']:<16} skip (muffled on purpose)")
            continue
        path = os.path.join(out, v['file'])
        if 'cer' in v:  # already verified (same text, same take)
            report.append(f"{line['id']:<16} CER {v['cer']:.2f}  (verified earlier)")
            continue
        tr = stt(path)
        e = cer(line['hi'], tr)
        best = (e, None)
        sv = V.SARVAM_CAST.get(line['voice'])
        if e > THRESH and sv:
            text = V.clean(line['hi'])
            for variant in (2, 3, 4):
                raw = V.sarvam_tts(text, sv['speaker'], v['speed'], cache, variant)
                cand = path + f'.take{variant}.wav'
                x, sr = V.process(raw, cand, {'semi': 0.0}, line)
                if len(x) / sr > line['slot'] + 0.05:
                    os.remove(cand)
                    continue
                tr2 = stt(cand)
                e2 = cer(line['hi'], tr2)
                if e2 < best[0]:
                    best = (e2, (cand, x, sr, tr2, variant))
                else:
                    os.remove(cand)
                if e2 <= 0.15:
                    break
            if best[1]:
                cand, x, sr, tr, variant = best[1]
                os.replace(cand, path)
                voices[line['id']].update(dur=round(len(x) / sr, 3), env=V.envelope(x, sr), variant=variant)
                fixed += 1
            for f in os.listdir(os.path.dirname(path)):
                if f.startswith(os.path.basename(path) + '.take'):
                    os.remove(os.path.join(os.path.dirname(path), f))
        voices[line['id']]['cer'] = round(best[0], 3)
        flag = ' CHECK' if best[0] > THRESH else ''
        report.append(f"{line['id']:<16} CER {best[0]:.2f}{flag}  script: {line['hi']}  |  heard: {tr}")
    json.dump(voices, open(vj, 'w'))
    open(os.path.join(out, 'voices_verify.txt'), 'w').write('\n'.join(report))
    bad = [r for r in report if 'CHECK' in r]
    print(f'verified {len(report)} lines, re-generated {fixed}, still above threshold: {len(bad)}')
    for r in bad:
        print('  ', r)


if __name__ == '__main__':
    main()
