"""Procedural audio for the episode: music cues, sound effects, babble voices.

Usage: python3 audio/synth.py build/timeline.json build/
Writes build/audio.wav (full mix) and build/audio_novoice.wav (music + sfx only, for dubbing).
Everything is synthesized from scratch (no samples) so the soundtrack is copyright-free.
"""
import json
import sys
import wave

import numpy as np
from scipy import signal

SR = 44100
RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- basics
def N(d):
    return max(1, int(round(d * SR)))


def tt(d):
    return np.arange(N(d)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def noise(d):
    return RNG.uniform(-1, 1, N(d))


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    b, a = signal.butter(order, fc / (SR / 2))
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    hi = min(hi, SR * 0.45)
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def phase_of(f, d):
    f = np.broadcast_to(np.asarray(f, dtype=float), (N(d),))
    return 2 * np.pi * np.cumsum(f) / SR


def sine(f, d):
    return np.sin(phase_of(f, d))


def saw(f, d):
    ph = phase_of(f, d) / (2 * np.pi)
    return 2 * (ph % 1.0) - 1


def square(f, d, duty=0.5):
    ph = phase_of(f, d) / (2 * np.pi)
    return np.where((ph % 1.0) < duty, 1.0, -1.0)


def tri(f, d):
    ph = phase_of(f, d) / (2 * np.pi)
    return 2 * np.abs(2 * (ph % 1.0) - 1) - 1


def expenv(d, tau):
    return np.exp(-tt(d) / tau)


def adsr(d, a=0.01, dc=0.1, s=0.7, r=0.08):
    n = N(d)
    e = np.full(n, float(s))
    na, nd, nr = N(a), N(dc), N(r)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    if na < n:
        k = min(nd, n - na)
        e[na:na + k] = np.linspace(1, s, k)
    nr = min(nr, n)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, x, t, g=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or g == 0:
        return
    j0 = max(0, -i)
    i = max(0, i)
    k = min(len(x) - j0, len(buf) - i)
    if k > 0:
        buf[i:i + k] += x[j0:j0 + k] * g


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) if len(x) else 0
    return x * (peak / m) if m > 1e-9 else x


def fade(x, a=0.01, r=0.02):
    x = x.copy()
    na, nr = min(N(a), len(x)), min(N(r), len(x))
    x[:na] *= np.linspace(0, 1, na)
    x[len(x) - nr:] *= np.linspace(1, 0, nr)
    return x


# ---------------------------------------------------------------- instruments
def kick(d=0.4, g=1.0):
    t = tt(d)
    f = 48 + 120 * np.exp(-t / 0.035)
    x = np.sin(phase_of(f, d)) * np.exp(-t / 0.17)
    x[:N(0.004)] += noise(0.004) * 0.6
    return x * g


def snare(d=0.25):
    t = tt(d)
    return bp(noise(d), 900, 7000) * np.exp(-t / 0.07) * 0.9 + sine(185, d) * np.exp(-t / 0.05) * 0.5


def hat(open_=False):
    d = 0.3 if open_ else 0.06
    return hp(noise(d), 7000) * expenv(d, 0.09 if open_ else 0.018) * 0.55


def clap():
    x = np.zeros(N(0.3))
    for k in range(3):
        place(x, bp(noise(0.02), 900, 3500) * expenv(0.02, 0.006), k * 0.011)
    place(x, bp(noise(0.25), 900, 3000) * expenv(0.25, 0.06), 0.03)
    return x


def snap():
    return hp(noise(0.05), 2000) * expenv(0.05, 0.008) * 0.9


def shaker():
    return bp(noise(0.08), 5000, 12000) * adsr(0.08, 0.02, 0.03, 0.3, 0.03) * 0.3


def bass(f, d, cut=700):
    x = saw(f, d) * 0.6 + square(f / 2, d) * 0.4
    return lp(x, cut) * adsr(d, 0.005, 0.08, 0.7, 0.03)


def pluck(f, d, bright=0.5, decay=0.996):
    """Karplus-Strong plucked string via IIR comb filter."""
    n = N(d)
    L = max(2, int(round(SR / f)))
    exc = np.zeros(n)
    m = min(L, n)
    exc[:m] = lp(RNG.uniform(-1, 1, m), 1500 + 6000 * bright)
    a = np.zeros(L + 2)
    a[0] = 1.0
    a[L] = -decay * 0.5
    a[L + 1] = -decay * 0.5
    y = signal.lfilter([1.0], a, exc)
    return fade(y, 0.001, 0.03)


def epiano(f, d):
    t = tt(d)
    x = np.sin(phase_of(f, d)) + 0.35 * np.sin(phase_of(2 * f, d)) * np.exp(-t / 0.3) + 0.12 * np.sin(phase_of(3.01 * f, d)) * np.exp(-t / 0.15)
    return x * np.exp(-t / 1.2) * (1 + 0.08 * np.sin(2 * np.pi * 5 * t)) * adsr(d, 0.004, 0.05, 1, 0.08)


def pad(notes, d, cut=1600, a=0.35):
    x = np.zeros(N(d))
    for n in notes:
        f = midi(n)
        for det in (-0.08, 0, 0.08):
            x += saw(f * 2 ** (det / 12), d)
    return lp(x / (3 * len(notes)), cut) * adsr(d, a, 0.2, 0.85, min(0.4, d / 3))


def lead(f, d, vib=5.5, cut=3200):
    t = tt(d)
    fv = f * (1 + 0.012 * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.15, 0, 1))
    return lp(square(fv, d, 0.4) * 0.6 + saw(fv, d) * 0.4, cut) * adsr(d, 0.01, 0.08, 0.7, 0.05)


def bellnote(f, d=1.0, tau=0.5):
    t = tt(d)
    x = np.zeros(N(d))
    for r, a, k in ((1, 1, 1), (2.76, 0.5, 0.6), (5.4, 0.3, 0.35), (8.93, 0.15, 0.2)):
        x += a * np.sin(phase_of(f * r, d)) * np.exp(-t / (tau * k))
    return x


def choir(notes, d, vowel=(700, 1150)):
    t = tt(d)
    x = np.zeros(N(d))
    for n in notes:
        f = midi(n)
        for det in (-0.1, 0.1):
            fv = f * 2 ** (det / 12) * (1 + 0.006 * np.sin(2 * np.pi * (5 + det * 10) * t))
            x += saw(fv, d)
    y = bp(x, vowel[0] - 150, vowel[0] + 150) + 0.6 * bp(x, vowel[1] - 200, vowel[1] + 200) + 0.15 * bp(x, 2400, 3000)
    return y * adsr(d, 0.5, 0.3, 0.9, min(0.6, d / 3))


def timpani(f=70, d=1.2):
    t = tt(d)
    return (np.sin(phase_of(f * (1 + 0.1 * np.exp(-t / 0.05)), d)) * np.exp(-t / 0.5) + lp(noise(d), 300) * np.exp(-t / 0.1) * 0.4)


def brass(notes, d):
    x = np.zeros(N(d))
    for n in notes:
        x += saw(midi(n), d)
    env = adsr(d, 0.02, 0.15, 0.7, 0.1)
    return lp(x / len(notes), 2200) * env


# ---------------------------------------------------------------- sequencer
class Seq:
    def __init__(self, bpm, bars, beats_per_bar=4):
        self.b = 60.0 / bpm
        self.len = bars * beats_per_bar * self.b
        self.buf = np.zeros(N(self.len) + N(3))
        self.bars = bars

    def add(self, x, beat, g=1.0):
        place(self.buf, x, beat * self.b, g)

    def out(self):
        # wrap the tail around for seamless looping
        n = N(self.len)
        y = self.buf[:n].copy()
        tail = self.buf[n:]
        y[:len(tail)] += tail
        return y


def drums(s, kick_beats, snare_beats, hat_step=0.5, hat_g=0.5, open_off=False, clap_=False, beats=None):
    total = s.bars * 4
    for bar in range(s.bars):
        for kb in kick_beats:
            s.add(kick(), bar * 4 + kb, 0.9)
        for sb in snare_beats:
            s.add(clap() if clap_ else snare(), bar * 4 + sb, 0.6)
    if hat_step:
        k = 0.0
        while k < total - 1e-6:
            s.add(hat(), k, hat_g * (1.0 if (k % 1) == 0 else 0.7))
            k += hat_step
    if open_off:
        for i in range(total):
            s.add(hat(True), i + 0.5, 0.35)


CHORD = {
    'Fm': [53, 56, 60], 'Db': [49, 53, 56], 'Ab': [56, 60, 63], 'Eb': [51, 55, 58],
    'C': [48, 52, 55], 'Am': [57, 60, 64], 'F': [53, 57, 60], 'G': [55, 59, 62],
    'Dm': [50, 53, 57], 'Bb': [46, 50, 53], 'A': [45, 49, 52], 'D': [50, 54, 57], 'Bm': [47, 50, 54],
    'Em': [52, 55, 59], 'E': [52, 56, 59],
    'Cmaj7': [48, 52, 55, 59], 'Am7': [45, 48, 52, 55], 'Dm7': [50, 53, 57, 60], 'G7': [43, 47, 50, 53],
}


def cue_title():
    s = Seq(112, 8)
    prog = ['Fm', 'Fm', 'Db', 'Db', 'Ab', 'Ab', 'Eb', 'Eb']
    drums(s, [0, 2, 2.5], [1, 3], 0.5, 0.35)
    for bar, ch in enumerate(prog):
        notes = CHORD[ch]
        root = notes[0] - 24
        for e in range(8):
            s.add(bass(midi(root + (12 if e % 2 else 0)), 0.25), bar * 4 + e * 0.5, 0.55)
        if bar % 2 == 0:
            s.add(pad(notes, 2 * 4 * s.b), bar * 4, 0.5)
        for k in range(16):
            n = notes[k % 3] + 12 + (12 if (k // 3) % 2 else 0)
            s.add(pluck(midi(n), 0.3, 0.7), bar * 4 + k * 0.25, 0.22)
    mel = [(0, 1.5, 72), (1.5, 0.5, 75), (2, 1, 77), (3, 1, 75), (4, 2, 72), (6, 1, 70), (7, 1, 68),
           (8, 1.5, 68), (9.5, 0.5, 70), (10, 1, 72), (11, 1, 77), (12, 3, 75), (15, 1, 72),
           (16, 1.5, 72), (17.5, 0.5, 75), (18, 1, 79), (19, 1, 80), (20, 2, 79), (22, 2, 75),
           (24, 1.5, 75), (25.5, 0.5, 74), (26, 1, 75), (27, 1, 77), (28, 4, 79)]
    for b0, dur, n in mel:
        s.add(lead(midi(n), dur * s.b * 0.95), b0, 0.3)
    return s.out()


def cue_chill():
    s = Seq(96, 8)
    prog = ['C', 'Am', 'F', 'G'] * 2
    for bar, ch in enumerate(prog):
        notes = CHORD[ch]
        s.add(kick(0.3, 0.7), bar * 4, 0.6)
        s.add(kick(0.3, 0.7), bar * 4 + 2.5, 0.4)
        s.add(snap(), bar * 4 + 1, 0.5)
        s.add(snap(), bar * 4 + 3, 0.5)
        for k in range(16):
            s.add(shaker(), bar * 4 + k * 0.25, 0.6 if k % 2 else 0.35)
        for pos in (0, 1, 1.5, 2.5, 3, 3.5):
            for j, n in enumerate(notes):
                s.add(pluck(midi(n + 12), 0.5, 0.4, 0.993), bar * 4 + pos + j * 0.02, 0.16)
        s.add(bass(midi(notes[0] - 12), 0.9, 500), bar * 4, 0.5)
        s.add(bass(midi(notes[0] - 12), 0.4, 500), bar * 4 + 2, 0.4)
    whistle = [(16, 1, 76), (17, 1, 79), (18, 2, 81), (20, 1, 79), (21, 1, 76), (22, 2, 74),
               (24, 1, 72), (25, 1, 74), (26, 2, 76), (28, 1, 74), (29, 1, 72), (30, 2, 67)]
    for b0, dur, n in whistle:
        t = tt(dur * s.b)
        x = np.sin(phase_of(midi(n) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t)), dur * s.b)) * adsr(dur * s.b, 0.04, 0.1, 0.8, 0.1)
        s.add(x, b0, 0.18)
    return s.out()


def cue_sneaky(bpm=100):
    s = Seq(bpm, 4)
    walk = [40, 43, 45, 46, 47, 46, 45, 43, 40, 43, 45, 46, 47, 50, 47, 46]
    for i, n in enumerate(walk):
        s.add(pluck(midi(n), 0.45, 0.3, 0.985), i, 0.7)
        s.add(pluck(midi(n + 12), 0.2, 0.2, 0.97), i + 0.5, 0.25)
    for bar in range(4):
        s.add(snap(), bar * 4 + 1, 0.6)
        s.add(snap(), bar * 4 + 3, 0.6)
        for k in range(8):
            s.add(hat(), bar * 4 + k * 0.5 + (0.08 if k % 2 else 0), 0.18)
    motif = [(8, 0.5, 64), (8.75, 0.5, 67), (9.5, 1.5, 70), (12, 0.5, 71), (12.75, 0.5, 70), (13.5, 0.5, 67), (14, 2, 64)]
    for b0, dur, n in motif:
        x = lp(square(midi(n), dur * s.b, 0.3), 1400) * adsr(dur * s.b, 0.03, 0.1, 0.7, 0.08)
        s.add(x, b0, 0.22)
    return s.out()


def cue_chase():
    s = Seq(150, 4)
    prog = ['Dm', 'Bb', 'C', 'A']
    drums(s, [0, 1, 2, 3], [1, 3], 0.25, 0.3)
    for bar, ch in enumerate(prog):
        notes = CHORD[ch]
        root = notes[0] - 12
        for k in range(16):
            s.add(bass(midi(root + (12 if k % 4 == 2 else 0)), 0.14, 900), bar * 4 + k * 0.25, 0.45)
        for pos in (0, 1.5, 3):
            s.add(brass([n + 12 for n in notes], 0.22), bar * 4 + pos, 0.35)
        arp = [notes[0] + 24, notes[1] + 24, notes[2] + 24, notes[1] + 24]
        for k in range(8):
            s.add(lead(midi(arp[k % 4]), 0.18, cut=4000), bar * 4 + k * 0.5, 0.12)
    return s.out()


def cue_party():
    s = Seq(124, 4)
    prog = ['Am', 'F', 'C', 'G']
    drums(s, [0, 1, 2, 3], [1, 3], 0.5, 0.25, open_off=True, clap_=True)
    for bar, ch in enumerate(prog):
        notes = CHORD[ch]
        for k in range(4):
            s.add(bass(midi(notes[0] - 24), 0.2, 600), bar * 4 + k + 0.5, 0.6)
            for n in notes:
                s.add(epiano(midi(n + 12), 0.25), bar * 4 + k + 0.5, 0.18)
        s.add(pad(notes, 4 * s.b, 1200, 0.1), bar * 4, 0.25)
    return s.out()


def cue_bellremix():
    s = Seq(128, 4)
    drums(s, [0, 1, 2, 3], [1, 3], 0.5, 0.3, clap_=True)
    pattern = [(0, 0), (0.25, 0), (1.5, 2), (1.75, 2), (2.5, 0), (3, 5), (3.25, 3)]
    for bar in range(4):
        for b0, semi in pattern:
            f = 2100 * 2 ** ((semi + (bar % 2) * 2) / 12)
            x = bellnote(f, 0.35, 0.12) * (1 + 0.5 * np.sin(2 * np.pi * 30 * tt(0.35)))
            s.add(x, bar * 4 + b0, 0.25)
        d = 4 * s.b
        t = tt(d)
        sx = saw(midi(33 + (5 if bar == 2 else 0)), d) + 0.5 * square(midi(21 + (5 if bar == 2 else 0)), d)
        lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (2 / s.b) * t)
        y = lp(sx, 280) * (1 - lfo) + lp(sx, 1400) * lfo
        s.add(y * 0.8, bar * 4, 0.55)
    return s.out()


def cue_epic():
    s = Seq(72, 4)
    prog = [('D', 62), ('A', 61), ('Bm', 62), ('G', 59)]
    for bar, (ch, top) in enumerate(prog):
        notes = CHORD[ch]
        s.add(choir([n + 12 for n in notes], 4 * s.b), bar * 4, 0.6)
        s.add(pad([n for n in notes], 4 * s.b, 2500, 0.6), bar * 4, 0.35)
        s.add(timpani(midi(notes[0] - 24)), bar * 4, 0.7)
        s.add(timpani(midi(notes[0] - 24)), bar * 4 + 2.5, 0.4)
        s.add(choir([top + 12], 4 * s.b, (500, 900)), bar * 4, 0.35)
    return s.out()


def cue_loading():
    s = Seq(90, 4)
    for bar, ch in enumerate(['Cmaj7', 'Am7', 'Dm7', 'G7']):
        notes = CHORD[ch]
        for pos in (0, 1.5, 2.5):
            for n in notes:
                s.add(epiano(midi(n + 12), 0.9), bar * 4 + pos, 0.12)
        s.add(bass(midi(notes[0] - 12), 1.2, 400), bar * 4, 0.5)
        s.add(bass(midi(notes[0] - 5), 0.5, 400), bar * 4 + 2.5, 0.35)
        s.add(lp(noise(0.2), 3000) * expenv(0.2, 0.05), bar * 4 + 1, 0.25)
        s.add(lp(noise(0.2), 3000) * expenv(0.2, 0.05), bar * 4 + 3, 0.25)
        for k in range(8):
            s.add(hat(), bar * 4 + k * 0.5 + (0.12 if k % 2 else 0), 0.12)
    return s.out()


def cue_tense():
    s = Seq(90, 2)
    d = 8 * s.b
    t = tt(d)
    s.add(lp(saw(midi(26), d) + saw(midi(26.1), d), 220) * 0.6, 0, 0.6)
    trem = (0.5 + 0.5 * np.sin(2 * np.pi * 12 * t))
    s.add(lp(saw(midi(69), d) + saw(midi(74), d), 3000) * trem * 0.25, 0, 0.35)
    for bar in range(2):
        for b in (0, 0.35, 2, 2.35):
            s.add(kick(0.3, 0.8), bar * 4 + b, 0.7 if b in (0, 2) else 0.45)
    return s.out()


def cue_sad():
    s = Seq(66, 4)
    for bar, ch in enumerate(['Am', 'F', 'C', 'E']):
        notes = CHORD[ch]
        arp = [notes[0], notes[1], notes[2], notes[1] + 12, notes[2], notes[1]]
        for k, n in enumerate(arp):
            s.add(epiano(midi(n), 1.6), bar * 4 + k * (4 / 6), 0.22)
        s.add(epiano(midi(notes[0] - 12), 3.0), bar * 4, 0.3)
    return s.out()


CUES = {
    'title': cue_title, 'chill': cue_chill, 'sneaky': cue_sneaky, 'chase': cue_chase, 'party': cue_party,
    'bellremix': cue_bellremix, 'epic': cue_epic, 'loading': cue_loading, 'tense': cue_tense, 'sad': cue_sad,
    'timelapse': lambda: cue_sneaky(168),
}
_cue_cache = {}


def cue(name):
    if name not in _cue_cache:
        x = CUES[name]()
        x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.16
        _cue_cache[name] = np.tanh(x * 1.4) / 1.4
    return _cue_cache[name]


# ---------------------------------------------------------------- sound effects
def sfx_whoosh(d=0.6):
    t = tt(d)
    env = np.sin(np.pi * t / d) ** 2
    n = noise(d)
    return (lp(n, 1200) * (1 - t / d) + bp(n, 1500, 5000) * (t / d)) * env


def sfx_boom(d=1.4):
    t = tt(d)
    return np.sin(phase_of(40 + 50 * np.exp(-t / 0.08), d)) * np.exp(-t / 0.5) + lp(noise(d), 200) * np.exp(-t / 0.3) * 0.6


def sfx_sparkle(d=1.0):
    x = np.zeros(N(d))
    for k in range(9):
        f = RNG.uniform(2200, 4200)
        place(x, np.sin(phase_of(f, 0.25)) * expenv(0.25, 0.06), k * 0.08, 0.6)
    return x


def sfx_pop():
    d = 0.09
    return np.sin(phase_of(np.linspace(380, 1100, N(d)), d)) * np.sin(np.pi * tt(d) / d)


def sfx_boing(d=0.6):
    t = tt(d)
    f = 180 + 140 * np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.25) + 60 * t
    return (np.sin(phase_of(f, d)) + 0.3 * tri(f * 2, d)) * np.exp(-t / 0.3)


def sfx_thud(d=0.35):
    t = tt(d)
    return np.sin(phase_of(90 * np.exp(-t / 0.1) + 40, d)) * np.exp(-t / 0.09) + lp(noise(d), 500) * np.exp(-t / 0.05) * 0.7


def sfx_fall(d=1.0):
    t = tt(d)
    f = 1900 * np.exp(-t / d * 1.6) * (1 + 0.01 * np.sin(2 * np.pi * 7 * t))
    return np.sin(phase_of(f, d)) * np.clip(t / 0.05, 0, 1) * 0.6


def sfx_spawn(d=1.3):
    x = np.zeros(N(d))
    for k, n in enumerate([72, 76, 79, 84, 88, 91]):
        place(x, bellnote(midi(n), 0.8, 0.25), k * 0.12, 0.35)
    t = tt(d)
    x += bp(noise(d), 3000, 9000) * (t / d) * 0.25
    return x


def sfx_mission():
    x = np.zeros(N(1.6))
    for k, n in enumerate([60, 64, 67, 72]):
        place(x, lead(midi(n + 12), 0.25), k * 0.1, 0.5)
    place(x, brass([72, 76, 79], 0.9), 0.4, 0.6)
    place(x, hp(noise(1.0), 5000) * expenv(1.0, 0.35), 0.4, 0.35)
    return x


def sfx_fail():
    x = np.zeros(N(3.2))
    for k, (n, d) in enumerate([(58, 0.55), (57, 0.55), (56, 0.55), (55, 1.5)]):
        t = tt(d)
        f = midi(n - 12) * (1 + (0.02 * np.sin(2 * np.pi * 6 * t) if d > 1 else 0))
        y = saw(f, d)
        cut = 400 + 1500 * np.sin(np.pi * np.clip(t / d, 0, 1))
        y = lp(y, 1400) * adsr(d, 0.04, 0.1, 0.8, 0.12)
        place(x, y, k * 0.55, 0.7)
    return x


def sfx_loop(fn, d):
    return fn(d)


def sfx_waves(d):
    t = tt(d)
    return lp(noise(d), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.14 * t) ** 2)


def sfx_city(d):
    t = tt(d)
    x = lp(noise(d), 400) * 0.6
    for k in np.arange(1.5, d, 4.3):
        place(x, lp(square(420, 0.25), 2000) * adsr(0.25, 0.01, 0.05, 0.8, 0.05), k, 0.12)
    return x


def sfx_siren(d):
    t = tt(d)
    f = 850 + 300 * np.sin(2 * np.pi * t / 1.4)
    return (np.sin(phase_of(f, d)) + 0.25 * np.sin(phase_of(2 * f, d))) * np.clip(t / 0.3, 0, 1)


def sfx_engine(d):
    t = tt(d)
    f = 55 + 8 * np.sin(2 * np.pi * 0.5 * t)
    return lp(saw(f, d) + 0.5 * square(f * 0.5, d), 500) * 0.8 + lp(noise(d), 200) * 0.4


def sfx_explosion(d=1.8):
    t = tt(d)
    x = lp(noise(d), 1500) * np.exp(-t / 0.5) + np.sin(phase_of(35 + 60 * np.exp(-t / 0.1), d)) * np.exp(-t / 0.6)
    cr = np.zeros(N(d))
    for k in range(40):
        place(cr, hp(noise(0.01), 3000), RNG.uniform(0.05, d * 0.7), RNG.uniform(0.1, 0.4))
    return x + cr


def sfx_heli(d):
    t = tt(d)
    chop = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) ** 3
    return lp(noise(d), 450) * chop * np.clip(t / 1.0, 0, 1) + sine(26, d) * 0.3


def sfx_skid(d=0.9):
    t = tt(d)
    f = 1400 + 200 * np.sin(2 * np.pi * 23 * t) + RNG.normal(0, 30, N(d))
    return (bp(noise(d), 1800, 4500) * 0.6 + np.sin(phase_of(f, d)) * 0.35) * np.sin(np.pi * t / d) ** 0.5


def sfx_sparks(d):
    x = np.zeros(N(d))
    for k in np.arange(0, d, 0.035):
        place(x, hp(noise(0.012), 4000), k + RNG.uniform(0, 0.02), RNG.uniform(0.1, 0.5))
    return x


def sfx_choir(d=3.0):
    return choir([62, 66, 69, 74], d)


def sfx_cheer(d=1.8):
    t = tt(d)
    x = bp(noise(d), 500, 3000) * (0.6 + 0.4 * lp(RNG.uniform(0, 1, N(d)), 8)) * np.sin(np.pi * t / d)
    for k in range(4):
        st = RNG.uniform(0.1, 0.9)
        place(x, np.sin(phase_of(np.linspace(1800, 2600, N(0.4)), 0.4)) * adsr(0.4, 0.05, 0.1, 0.7, 0.1), st, 0.15)
    return x


def sfx_scratch(d=0.45):
    t = tt(d)
    f = 300 + 900 * np.abs(np.sin(2 * np.pi * 4.5 * t))
    return (bp(noise(d), 600, 3000) * 0.5 + saw(f, d) * 0.4) * np.clip(1 - t / d, 0, 1)


def sfx_rewind(d):
    t = tt(d)
    f = 2500 + 1500 * np.sin(2 * np.pi * 9 * t) + 800 * np.sin(2 * np.pi * 2.3 * t)
    return np.sin(phase_of(f, d)) * 0.3 + bp(noise(d), 2000, 8000) * 0.3


def sfx_grunt():
    return babble_syll(130, 0.35, 'u', 0.0, -0.3, 1.0)


def sfx_push(d=0.6):
    return bp(noise(d), 300, 1500) * np.sin(np.pi * tt(d) / d)


def sfx_ding():
    return bellnote(1568, 1.4, 0.5) * 0.7


def sfx_star():
    x = np.zeros(N(0.9))
    place(x, bellnote(1760, 0.8, 0.25), 0, 0.5)
    place(x, bellnote(2637, 0.7, 0.25), 0.08, 0.5)
    return x


def sfx_slap():
    d = 0.18
    t = tt(d)
    return hp(noise(d), 1200) * np.exp(-t / 0.025) + np.sin(phase_of(160, d)) * np.exp(-t / 0.04) * 0.5


def sfx_door():
    x = sfx_thud(0.4) * 0.7
    t = tt(0.5)
    cr = lp(saw(240 + 60 * np.sin(2 * np.pi * 3 * t) + RNG.normal(0, 8, N(0.5)), 0.5), 1800) * np.sin(np.pi * t / 0.5) * 0.3
    y = np.zeros(N(0.9))
    place(y, cr, 0)
    place(y, x, 0.45)
    return y


def sfx_rev(d=1.0):
    t = tt(d)
    f = 60 + 160 * (t / d) ** 0.7
    return lp(saw(f, d) + 0.5 * square(f / 2, d), 1500) * np.clip(t / 0.05, 0, 1) * (1 - 0.3 * t / d)


def sfx_zoom(d=1.2):
    t = tt(d)
    f = np.where(t < d / 2, 260, 170) * 1.0
    f = 260 - 100 / (1 + np.exp(-(t - d / 2) * 12))
    env = 1 / (1 + ((t - d / 2) * 5) ** 2)
    return (lp(saw(f, d), 1500) * 0.6 + lp(noise(d), 2000) * 0.4) * env


def sfx_bell():
    x = np.zeros(N(0.8))
    for k in range(2):
        b = bellnote(2200, 0.45, 0.15) * (1 + 0.6 * np.sin(2 * np.pi * 32 * tt(0.45)))
        place(x, b, k * 0.16, 0.6)
    return x


def sfx_alarm(d):
    t = tt(d)
    f = np.where((t * 4) % 1 < 0.5, 1000, 700)
    return lp(square(f, d, 0.5), 3000) * 0.5


def sfx_crickets(d):
    x = np.zeros(N(d))
    k = 0.1
    while k < d - 0.2:
        for j in range(3):
            place(x, np.sin(phase_of(4600, 0.025)) * np.sin(np.pi * tt(0.025) / 0.025), k + j * 0.045, 0.35)
        k += RNG.uniform(0.5, 0.8)
    return x


def sfx_mega():
    d = 0.25
    return np.sin(phase_of(np.linspace(2200, 2900, N(d)), d)) * np.sin(np.pi * tt(d) / d) * 0.25


def sfx_pedal(d):
    t = tt(d)
    return bp(noise(d), 800, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * 0.5 + sfx_crickets_like_squeak(d)


def sfx_crickets_like_squeak(d):
    x = np.zeros(N(d))
    for k in np.arange(0, d, 0.28):
        place(x, np.sin(phase_of(np.linspace(1700, 2100, N(0.08)), 0.08)) * np.sin(np.pi * tt(0.08) / 0.08), k, 0.12)
    return x


def sfx_twinkle():
    return bellnote(3136, 0.9, 0.3) * 0.6


def sfx_crowd(d):
    t = tt(d)
    return bp(noise(d), 300, 2500) * (0.7 + 0.3 * lp(RNG.uniform(0, 1, N(d)), 4))


def sfx_splash(d=1.8):
    t = tt(d)
    x = lp(noise(d), 2500) * np.exp(-t / 0.4) + lp(noise(d), 600) * np.exp(-t / 0.15) * 0.8
    for k in range(25):
        f0 = RNG.uniform(400, 1200)
        bub = np.sin(phase_of(np.linspace(f0, f0 * 2.2, N(0.05)), 0.05)) * np.sin(np.pi * tt(0.05) / 0.05)
        place(x, bub, RNG.uniform(0.2, d - 0.1), 0.2)
    return x


def sfx_spit():
    d = 0.5
    t = tt(d)
    x = bp(noise(d), 1500, 6000) * np.exp(-t / 0.12)
    return x


def sfx_click():
    return hp(noise(0.02), 2000) * expenv(0.02, 0.003)


def sfx_dun():
    x = np.zeros(N(2.2))
    for k, (n, d) in enumerate([(50, 0.25), (49, 0.25), (46, 1.4)]):
        place(x, brass([n, n + 7, n + 12], d), k * 0.32, 0.8)
        place(x, timpani(midi(n - 12), d + 0.3), k * 0.32, 0.6)
    return x


def sfx_marker():
    d = 0.45
    t = tt(d)
    f = 2400 + 300 * np.sin(2 * np.pi * 17 * t) + RNG.normal(0, 60, N(d))
    return np.sin(phase_of(f, d)) * 0.25 * (np.sin(np.pi * t / d) > 0.2)


def sfx_tada():
    x = np.zeros(N(1.5))
    place(x, brass([60, 64, 67], 0.15), 0, 0.6)
    place(x, brass([65, 69, 72], 1.1), 0.18, 0.7)
    return x


def sfx_snap():
    d = 0.4
    t = tt(d)
    return hp(noise(d), 1500) * np.exp(-t / 0.02) + np.sin(phase_of(220 * (1 + 0.5 * np.exp(-t / 0.05)), d)) * np.exp(-t / 0.15) * 0.4


def sfx_bonk():
    d = 0.4
    t = tt(d)
    return (np.sin(phase_of(700 * np.exp(-t / 0.3), d)) + 0.5 * np.sin(phase_of(1150 * np.exp(-t / 0.3), d))) * np.exp(-t / 0.08)


def sfx_glass(d=0.9):
    x = np.zeros(N(d))
    for k in range(30):
        f = RNG.uniform(2500, 7000)
        place(x, np.sin(phase_of(f, 0.15)) * expenv(0.15, 0.03), RNG.uniform(0, d * 0.6), RNG.uniform(0.1, 0.4))
    x += hp(noise(d), 3000) * expenv(d, 0.12) * 0.6
    return x


def sfx_bang():
    d = 0.6
    t = tt(d)
    return lp(noise(d), 1200) * np.exp(-t / 0.08) + np.sin(phase_of(70, d)) * np.exp(-t / 0.15)


def sfx_yawn():
    return babble_syll(170, 1.0, 'a', -0.35, 0.0, 0.8)


def sfx_print(d=0.9):
    t = tt(d)
    return lp(square(140, d, 0.3), 2500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * 0.35


def sfx_tick(d):
    x = np.zeros(N(d))
    k, step = 0.0, 0.12
    while k < d:
        place(x, hp(noise(0.015), 3000) * expenv(0.015, 0.003), k, 0.6)
        k += step
        step = max(0.05, step * 0.985)
    return x


def sfx_stamp():
    x = sfx_thud(0.3)
    place(x, sfx_slap(), 0, 0.3)
    return x


def sfx_kaching():
    x = np.zeros(N(1.4))
    place(x, bp(noise(0.25), 2000, 8000) * expenv(0.25, 0.05), 0, 0.5)
    place(x, bellnote(2093, 1.1, 0.4), 0.12, 0.6)
    place(x, bellnote(2637, 1.0, 0.4), 0.16, 0.4)
    return x


def sfx_alarmbell(d):
    t = tt(d)
    return bellnote(1300, d, 3.0) * (0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 16 * t))) * 0.6


def sfx_gulp():
    d = 0.25
    t = tt(d)
    return np.sin(phase_of(np.linspace(380, 140, N(d)), d)) * np.sin(np.pi * t / d)


def sfx_lockon():
    x = np.zeros(N(1.3))
    for k in range(4):
        place(x, lp(square(1500 + k * 200, 0.08), 4000) * 0.4, k * 0.18)
    place(x, lp(square(2300, 0.4), 4000) * 0.4, 0.75)
    return x


def sfx_thwack():
    d = 0.4
    t = tt(d)
    return hp(noise(d), 800) * np.exp(-t / 0.04) * 1.1 + np.sin(phase_of(120 * np.exp(-t / 0.08) + 50, d)) * np.exp(-t / 0.1)


def sfx_beep(d):
    x = np.zeros(N(d))
    for k in np.arange(0.2, d, 1.0):
        place(x, np.sin(phase_of(1050, 0.13)) * adsr(0.13, 0.005, 0.02, 0.9, 0.02), k, 0.4)
    return x


def sfx_snore(d):
    x = np.zeros(N(d))
    for k in np.arange(0, d - 1.2, 2.2):
        t = tt(1.2)
        y = lp(noise(1.2), 300) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 32 * t))) * np.sin(np.pi * t / 1.2)
        place(x, y, k, 0.8)
        place(x, bp(noise(0.8), 800, 3000) * np.sin(np.pi * tt(0.8) / 0.8) * 0.3, k + 1.3)
    return x


SFX = {
    'whoosh': sfx_whoosh, 'boom': sfx_boom, 'sparkle': sfx_sparkle, 'pop': sfx_pop, 'boing': sfx_boing, 'thud': sfx_thud,
    'fall': sfx_fall, 'spawn': sfx_spawn, 'mission': sfx_mission, 'fail': sfx_fail, 'explosion': sfx_explosion,
    'skid': sfx_skid, 'choir': sfx_choir, 'cheer': sfx_cheer, 'scratch': sfx_scratch, 'grunt': sfx_grunt, 'push': sfx_push,
    'ding': sfx_ding, 'star': sfx_star, 'slap': sfx_slap, 'door': sfx_door, 'rev': sfx_rev, 'zoom': sfx_zoom, 'bell': sfx_bell,
    'mega': sfx_mega, 'twinkle': sfx_twinkle, 'splash': sfx_splash, 'spit': sfx_spit, 'click': sfx_click, 'dun': sfx_dun,
    'marker': sfx_marker, 'tada': sfx_tada, 'snap': sfx_snap, 'bonk': sfx_bonk, 'glass': sfx_glass, 'bang': sfx_bang,
    'yawn': sfx_yawn, 'print': sfx_print, 'stamp': sfx_stamp, 'kaching': sfx_kaching, 'gulp': sfx_gulp, 'lockon': sfx_lockon,
    'thwack': sfx_thwack,
}
# effects with a duration argument
SFX_D = {
    'waves': sfx_waves, 'city': sfx_city, 'siren': sfx_siren, 'engine': sfx_engine, 'heli': sfx_heli, 'sparks': sfx_sparks,
    'rewind': sfx_rewind, 'alarm': sfx_alarm, 'crickets': sfx_crickets, 'pedal': sfx_pedal, 'crowd': sfx_crowd,
    'tick': sfx_tick, 'alarmbell': sfx_alarmbell, 'beep': sfx_beep, 'snore': sfx_snore, 'choir': sfx_choir,
}
SFX_GAIN = {'siren': 0.5, 'engine': 0.5, 'city': 0.5, 'waves': 0.6, 'crowd': 0.5, 'heli': 0.6, 'explosion': 1.0, 'fail': 0.9,
            'choir': 0.6, 'alarm': 0.6, 'alarmbell': 0.6, 'crickets': 0.6, 'tick': 0.6, 'beep': 0.6, 'snore': 0.7}


# ---------------------------------------------------------------- voices
VOWELS = {'a': (800, 1250), 'e': (520, 1850), 'i': (330, 2300), 'o': (520, 900), 'u': (360, 820)}
VOICE = {
    'bunty': dict(f0=150, spread=1.8, glide=-0.08, bright=1.0),
    'chintu': dict(f0=255, spread=2.2, glide=0.04, bright=1.1),
    'dadi': dict(f0=300, spread=2.0, glide=0.0, bright=0.9, trem=0.07),
    'police': dict(f0=112, spread=1.6, glide=-0.05, bright=1.0),
    'mummy': dict(f0=240, spread=2.0, glide=-0.03, bright=1.15),
    'lala': dict(f0=96, spread=1.5, glide=-0.06, bright=0.9),
    'cashier': dict(f0=140, spread=0.4, glide=-0.02, bright=0.8),
    'nurse': dict(f0=280, spread=2.0, glide=0.02, bright=1.0),
}


def babble_syll(f0, d, vowel, glide=0.0, trem=0.0, bright=1.0):
    t = tt(d)
    f = f0 * (1 + glide * t / d) * (1 + 0.02 * np.sin(2 * np.pi * 5.5 * t)) * (1 + trem * np.sin(2 * np.pi * 9 * t))
    ph = phase_of(f, d)
    F1, F2 = VOWELS[vowel]
    out = np.zeros(N(d))
    K = int(5000 / f0)
    for k in range(1, K + 1):
        fk = k * f0
        a = np.exp(-((fk - F1) / 140) ** 2) + 0.7 * bright * np.exp(-((fk - F2) / 200) ** 2) + 0.25 * bright * np.exp(-((fk - 2700) / 300) ** 2) + 0.12 / k
        out += a * np.sin(k * ph)
    env = adsr(d, 0.012, 0.04, 0.85, min(0.035, d / 3))
    y = out * env
    return y / (np.max(np.abs(y)) + 1e-9)


def render_line(line):
    v = VOICE.get(line['voice'], VOICE['bunty'])
    shout = line['style'] == 'shout'
    text_vowels = [c for c in line['text'].lower() if c in 'aeiou'] or ['a']
    buf = np.zeros(N(line['dur'] + 0.5))
    for i, s in enumerate(line['syl']):
        semi = s['p'] * v['spread'] + s['loud'] * 2 + (3 if shout else 0)
        f0 = v['f0'] * 2 ** (semi / 12)
        vowel = text_vowels[i % len(text_vowels)]
        d = max(0.05, s['d'])
        y = babble_syll(f0, d, vowel, v['glide'], v.get('trem', 0.0), v['bright'])
        if RNG.random() < 0.55:  # consonant burst
            c = bp(noise(0.018), 2500, 7000) * expenv(0.018, 0.006)
            y[:len(c)] += c * 0.5
        place(buf, y, s['t'], 1.0)
    if shout:
        buf = np.tanh(buf * 2.0) / np.tanh(2.0)
    if line.get('mega'):
        buf = np.tanh(bp(buf, 500, 3500) * 3.0) * 0.8
    return buf * (1.15 if shout else 0.85)


# ---------------------------------------------------------------- main mix
def write_wav(path, x):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], axis=1)
    data = (st * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    tl = json.load(open(sys.argv[1]))
    out = sys.argv[2] if len(sys.argv) > 2 else 'build/'
    total = tl['total']
    n = N(total)
    music = np.zeros(n)
    sfx = np.zeros(n)
    voice = np.zeros(n)

    for m in tl['music']:
        loop = cue(m['cue'])
        d = m['to'] - m['from']
        if d <= 0.05:
            continue
        reps = int(np.ceil(N(d) / len(loop))) + 1
        seg = np.tile(loop, reps)[:N(d)]
        seg = fade(seg, 0.08, min(0.6, d / 3))
        place(music, seg, m['from'], m['vol'])

    for e in tl['sfx']:
        name = e['name']
        if name in SFX_D and e.get('dur'):
            x = SFX_D[name](e['dur'])
        elif name in SFX:
            x = SFX[name]()
        elif name in SFX_D:
            x = SFX_D[name](2.0)
        else:
            print('missing sfx', name)
            continue
        x = norm(fade(x, 0.003, 0.03), 0.8)
        if e.get('reverse'):
            x = x[::-1].copy()
        place(sfx, x, e['t'], e.get('vol', 1.0) * SFX_GAIN.get(name, 0.85) * 0.6)

    act = np.zeros(n)
    for line in tl['lines']:
        if not line['syl']:
            continue
        y = render_line(line)
        place(voice, y, line['t'], 0.55)
        a, b = int(line['t'] * SR), int((line['t'] + line['syl'][-1]['t'] + 0.3) * SR)
        act[max(0, a):min(n, b)] = 1.0
    # ducking envelope for music under dialogue
    duck = lp(act, 3, 1)
    duck = np.clip(duck, 0, 1)
    music_d = music * (1 - 0.4 * duck)

    def master(x):
        x = hp(x, 30)
        x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.13
        return np.tanh(x * 1.6) / 1.6 * 1.05

    write_wav(out + 'audio.wav', master(music_d + sfx + voice))
    write_wav(out + 'audio_novoice.wav', master(music + sfx))
    print('audio written', total, 's')


if __name__ == '__main__':
    main()
