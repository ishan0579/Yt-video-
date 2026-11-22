"""Hindi voice-over generation.

Default provider: Sarvam AI Bulbul v4-flash (natural Indian voices; API key injected by the network proxy).
Fallback (TTS=kokoro): Kokoro-82M (Apache-2.0) via kokoro-onnx.

Usage: python3 audio/voices.py build/timeline.json build/
Reads every dialogue line (Devanagari `hi` text), synthesizes it with the character's voice,
processes it (pitch/formant, megaphone, muffle...), fits it into the line's time slot, and writes:
  build/voices/<id>.wav   (44.1 kHz mono, processed)
  build/voices.json       {id: {file, dur, env, speed}} - env = mouth-open envelope at 30 fps (0-100)
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, 'assets/tts/kokoro-v1.0.onnx')
VOICEBIN = os.path.join(ROOT, 'assets/tts/voices-v1.0.bin')

# Kokoro Hindi voices: hm_omega, hm_psi (male), hf_alpha, hf_beta (female).
# Each character gets a distinct timbre via base voice + speed + pitch/formant shift.
CAST = {
    'bunty':   dict(v='hm_omega', speed=1.06, semi=0.0),
    'chintu':  dict(v='hm_psi',   speed=1.08, semi=2.5, formant='shifted'),
    'police':  dict(v='hm_omega', speed=0.98, semi=-3.0, formant='shifted'),
    'lala':    dict(v='hm_psi',   speed=0.92, semi=-4.0, formant='shifted'),
    'cashier': dict(v='hm_psi',   speed=0.90, semi=-1.5, formant='preserved'),
    'bhola':   dict(v='hm_omega', speed=0.97, semi=1.5, formant='shifted'),
    'dadi':    dict(v='hf_beta',  speed=0.92, semi=1.5, formant='shifted', vibrato=True),
    'mummy':   dict(v='hf_alpha', speed=1.04, semi=0.0),
    'anchor':  dict(v='hf_beta',  speed=1.04, semi=-0.5, formant='preserved'),
}
# Sarvam Bulbul v4-flash cast (natural human voices, no pitch shifting needed)
SARVAM_CAST = {
    'bunty':   dict(speaker='rehan_hi_social', pace=1.05),
    'chintu':  dict(speaker='advait_hi_character', pace=1.05),
    'police':  dict(speaker='mahesh_hi_documentary', pace=1.0),
    'lala':    dict(speaker='mukul_hi_suspense', pace=0.95),
    'cashier': dict(speaker='rahul_hi_conversational', pace=0.88),
    'bhola':   dict(speaker='ashok_hi_character', pace=1.08),
    'dadi':    dict(speaker='roopa_hi_narration', pace=0.92),
    'mummy':   dict(speaker='sarika_hi_conversation', pace=1.02),
    'anchor':  dict(speaker='simran_hi_news_breaking', pace=1.02),
}
PROVIDER = os.environ.get('TTS', 'sarvam')
SR_OUT = 44100


def sarvam_tts(text, speaker, pace, cache_dir, variant=0):
    import base64
    import urllib.request
    key = hashlib.sha1((f'sarvam|v4|{text}|{speaker}|{pace:.3f}' + (f'|v{variant}' if variant else '')).encode()).hexdigest()[:16]
    path = os.path.join(cache_dir, 'sv_' + key + '.wav')
    if not os.path.exists(path):
        body = {'text': text, 'target_language_code': 'hi-IN', 'model': 'bulbul:v4-flash', 'speaker': speaker,
                'pace': round(float(pace), 3), 'speech_sample_rate': 44100}
        req = urllib.request.Request('https://api.sarvam.ai/text-to-speech', data=json.dumps(body).encode(),
                                     headers={'Content-Type': 'application/json', 'api-subscription-key': os.environ.get('SARVAM_API_KEY', 'proxy-injected')})
        for attempt in range(4):
            try:
                d = json.load(urllib.request.urlopen(req, timeout=120))
                break
            except Exception as e:
                if attempt == 3:
                    raise
                import time
                time.sleep(2 + attempt * 3)
        with open(path, 'wb') as f:
            f.write(base64.b64decode(d['audios'][0]))
    return path
FPS = 30
MAX_SPEED = 1.38


def clean(text):
    t = text.replace('—', ',').replace('–', ',')
    t = re.sub(r'!{2,}', '!', t)
    t = re.sub(r'\?!+', '?', t)
    t = re.sub(r'\.{3,}', '…', t)
    return t.strip()


_kokoro = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(MODEL, VOICEBIN)
    return _kokoro


def tts(text, voice, speed, cache_dir):
    key = hashlib.sha1(f'{text}|{voice}|{speed:.3f}'.encode()).hexdigest()[:16]
    path = os.path.join(cache_dir, key + '.wav')
    if not os.path.exists(path):
        audio, sr = kokoro().create(text, voice=voice, speed=float(speed), lang='hi')
        sf.write(path, audio, sr)
    return path


def trim(x, sr, thr=0.012, pad=0.04):
    a = np.abs(x)
    idx = np.where(a > thr * max(1e-6, a.max()))[0]
    if len(idx) == 0:
        return x
    i0 = max(0, idx[0] - int(pad * sr))
    i1 = min(len(x), idx[-1] + int(pad * 2 * sr))
    return x[i0:i1]


def process(raw_path, out_path, cfg, line):
    filters = ['highpass=f=75']
    semi = cfg.get('semi', 0.0)
    if abs(semi) > 0.01:
        filters.append(f"rubberband=pitch={2 ** (semi / 12):.5f}:formant={cfg.get('formant', 'preserved')}:transients=smooth")
    if cfg.get('vibrato'):
        filters.append('vibrato=f=5.5:d=0.10')
    fx = line.get('fx') or ''
    if line.get('mega'):
        filters += ['highpass=f=450', 'lowpass=f=3400', 'volume=2.2', 'alimiter=limit=0.6', 'aecho=0.8:0.4:35:0.25']
    if 'muffle' in fx:
        filters += ['lowpass=f=650', 'volume=1.4']
    if 'whisper' in fx:
        filters += ['highpass=f=200', 'volume=0.7']
    if line.get('style') == 'shout':
        filters += ['acompressor=threshold=-24dB:ratio=5:attack=3:release=60:makeup=2']
    else:
        filters += ['acompressor=threshold=-22dB:ratio=3:attack=5:release=80:makeup=1.5']
    filters.append(f'aresample={SR_OUT}')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw_path, '-af', ','.join(filters), '-ac', '1', out_path], check=True)
    x, sr = sf.read(out_path)
    x = trim(x, sr)
    x = squeeze_pauses(x, sr)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    target = 0.11 if line.get('style') == 'shout' else 0.085
    if 'whisper' in fx:
        target *= 0.7
    x = np.clip(x * (target / rms), -0.98, 0.98)
    sf.write(out_path, x, sr)
    return x, sr


def squeeze_pauses(x, sr, max_pause=0.42, keep=0.34):
    """Shorten unnaturally long internal pauses (keeps dramatic '...' beats but removes dead air)."""
    hop = int(0.01 * sr)
    n = len(x) // hop
    if n < 10:
        return x
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    quiet = rms < 0.02 * rms.max()
    out, i, last = [], 0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.01 > max_pause and i > 0 and j < n:
                cut0 = i * hop + int(keep / 2 * sr)
                cut1 = j * hop - int(keep / 2 * sr)
                out.append(x[last:cut0])
                last = cut1
            i = j
        else:
            i += 1
    out.append(x[last:])
    return np.concatenate(out)


def envelope(x, sr):
    hop = sr // FPS
    n = int(np.ceil(len(x) / hop))
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if len(x[i * hop:(i + 1) * hop]) else 0 for i in range(n)])
    ref = np.percentile(e, 98) + 1e-9
    e = np.clip(e / ref, 0, 1)
    # emphasise syllable modulation: subtract a slow baseline so the mouth closes between syllables
    k = 5
    base = np.convolve(e, np.ones(k) / k, mode='same')
    e = np.clip(e - 0.55 * base + 0.25 * e, 0, 1)
    e = e / (e.max() + 1e-9)
    e[e < 0.1] = 0
    return [int(round(v * 100)) for v in e]


def main():
    tl = json.load(open(sys.argv[1]))
    out = sys.argv[2] if len(sys.argv) > 2 else 'build/'
    vdir = os.path.join(out, 'voices')
    cache = os.path.join(vdir, 'cache')
    os.makedirs(cache, exist_ok=True)
    result = {}
    report = []
    prev = {}
    try:
        prev = json.load(open(os.path.join(out, 'voices.json')))
    except Exception:
        pass
    for line in tl['lines']:
        if not line.get('hi'):
            continue
        sv = SARVAM_CAST.get(line['voice']) if PROVIDER == 'sarvam' else None
        cfg = {'semi': 0.0} if sv else CAST.get(line['voice'])
        if not cfg:
            print('no voice for', line['voice'])
            continue
        text = clean(line['hi'])
        slot = line['slot']
        speed = sv['pace'] if sv else cfg['speed']
        outp = os.path.join(vdir, line['id'].replace(':', '_') + '.wav')
        # try: base pace, a fresh re-sample at base pace, then gently faster (natural speech, max 1.2x)
        plan = [(speed, 0), (speed, 1)]
        tkey = hashlib.sha1(f"{text}|{(sv or {}).get('speaker', '')}|{slot:.2f}".encode()).hexdigest()[:12]
        pv = prev.get(line['id'], {})
        if sv and pv.get('key') == tkey and 'variant' in pv:
            plan = [(pv['speed'], pv['variant'])]  # keep the take chosen by verify_voices.py
        best = None
        for k, (pace, variant) in enumerate(plan):
            raw = sarvam_tts(text, sv['speaker'], pace, cache, variant) if sv else tts(text, cfg['v'], pace, cache)
            x, sr = process(raw, outp + f'.cand{k}.wav', cfg, line)
            dur = len(x) / sr
            if best is None or (best[2] > slot and dur < best[2]) or (dur <= slot and best[2] > slot):
                best = (x, sr, dur, pace)
            if dur <= slot:
                break
            if k == len(plan) - 1 and pace < 1.2 and sv:
                plan.append((min(1.2, pace * (dur / slot) * 1.04), 0))
        x, sr, dur, speed = best
        variant_used = [v for (p_, v) in plan if abs(p_ - speed) < 1e-9][0] if sv else 0
        sf.write(outp, x, sr)
        for f in os.listdir(vdir):
            if f.startswith(os.path.basename(outp) + '.cand'):
                os.remove(os.path.join(vdir, f))
        result[line['id']] = dict(file=os.path.relpath(outp, out), dur=round(dur, 3), speed=speed, env=envelope(x, sr), key=tkey, variant=variant_used)
        if pv.get('key') == tkey and 'cer' in pv and pv.get('variant') == variant_used:
            result[line['id']]['cer'] = pv['cer']
        flag = ' OVER' if dur > slot + 0.01 else ''
        report.append(f"{line['id']:<16} {line['voice']:<8} {(sv or {}).get('speaker', cfg.get('v', '')):<24} {dur:5.2f}s / slot {slot:5.2f}s  speed {speed:.2f}{flag}  {line['text'][:50]}")
    json.dump(result, open(os.path.join(out, 'voices.json'), 'w'))
    open(os.path.join(out, 'voices_report.txt'), 'w').write('\n'.join(report))
    over = [r for r in report if 'OVER' in r]
    print(f'voices: {len(result)} lines, {len(over)} over their slot')
    for r in over:
        print('  ', r)


if __name__ == '__main__':
    main()
