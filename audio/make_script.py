"""Generate SCRIPT.md (dubbing script with timestamps) from build/timeline.json."""
import json
tl = json.load(open('build/timeline.json'))
NAMES = {'bunty': 'BUNTY', 'chintu': 'CHINTU', 'dadi': 'DADI', 'police': 'POLICE UNCLE', 'heli': 'POLICE (HELICOPTER)',
         'mummy': 'MUMMY', 'lala': 'LALA JI', 'cashier': 'CASHIER', 'nurse': 'NURSE', 'anchor': 'NEWS ANCHOR', 'bhola': 'BHOLA UNCLE'}
TITLES = {'coldopen': 'Cold open (freeze frame)', 'title': 'Title', 'loading': 'Loading screen', 'beach': 'Spawn on the beach',
          'cartheft': 'Chapter 1: Gaadi Chori', 'bikechase': 'Chapter 2: Supercar (cycle chase)', 'pool': 'Pool party DJ',
          'plan': 'Chapter 3: Master Plan', 'bank': 'Chapter 4: The Heist', 'autochase': 'Chapter 5: Auto Wala Stunt',
          'mummy': 'Mission Failed (Mummy)', 'hospital': 'Respawn at the hospital', 'outro': 'Outro + end screen',
          'fasttravel': 'Fast travel (map + loading)', 'costume': 'Chapter 3.5: Disguise Shopping', 'news': 'Breaking News',
          'dadipost': 'Dadi ka comeback (post-credits)'}
fmt = lambda x: f"{int(x // 60)}:{x % 60:05.2f}"
out = ['# Bunty & Chintu: Episode 1 script', '',
       'The final video uses this Hindi voice-over (Kokoro TTS). To re-dub with your own voice, use',
       '`output/bunty_chintu_ep1_no_voices.mp4` (music + sound effects only) and record each line at its timestamp.', '',
       '**Voice cast (Kokoro-82M Hindi voices, Apache-2.0):** Bunty = hm_omega · Chintu = hm_psi +2.5 semitones ·',
       'Police Uncle = hm_omega -3 · Lala Ji = hm_psi -4 · Cashier = hm_psi -1.5 (slow) · Bhola Uncle = hm_omega +1.5 ·',
       'Dadi = hf_beta +1.5 with vibrato · Mummy = hf_alpha · News Anchor = hf_beta', '']
for sc in tl['scenes']:
    out.append(f"## {fmt(sc['start'])}: {TITLES.get(sc['id'], sc['id'])}")
    out.append('')
    lines = [l for l in tl['lines'] if sc['start'] <= l['t'] < sc['start'] + sc['dur']]
    if not lines:
        out.append('*(no dialogue: music and sound effects only)*')
        out.append('')
        continue
    out.append('| Time | Character | Hindi (voice) | Hinglish (bubble) |')
    out.append('|---|---|---|---|')
    for l in lines:
        if True:
            who = NAMES.get(l['who'], (l.get('name') or l['who']).upper())
            style = ' *(shouting)*' if l['style'] == 'shout' else ''
            out.append(f"| {fmt(l['t'])} | {who} | {l.get('hi') or ''} | {l['text']}{style} |")
    out.append('')
open('SCRIPT.md', 'w').write('\n'.join(out))
print('SCRIPT.md written')
