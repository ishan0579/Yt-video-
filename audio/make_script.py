"""Generate SCRIPT.md (dubbing script with timestamps) from build/timeline.json."""
import json
tl = json.load(open('build/timeline.json'))
NAMES = {'bunty': 'BUNTY', 'chintu': 'CHINTU', 'dadi': 'DADI', 'police': 'POLICE UNCLE', 'heli': 'POLICE (HELICOPTER)',
         'mummy': 'MUMMY', 'lala': 'LALA JI', 'cashier': 'CASHIER', 'nurse': 'NURSE'}
TITLES = {'coldopen': 'Cold open (freeze frame)', 'title': 'Title', 'loading': 'Loading screen', 'beach': 'Spawn on the beach',
          'cartheft': 'Chapter 1: Gaadi Chori', 'bikechase': 'Chapter 2: Supercar (cycle chase)', 'pool': 'Pool party DJ',
          'plan': 'Chapter 3: Master Plan', 'bank': 'Chapter 4: The Heist', 'autochase': 'Chapter 5: Auto Wala Stunt',
          'mummy': 'Mission Failed (Mummy)', 'hospital': 'Respawn at the hospital', 'outro': 'Outro + end screen'}
fmt = lambda x: f"{int(x // 60)}:{x % 60:05.2f}"
out = ['# Bunty & Chintu: Episode 1 dubbing script', '',
       'Timestamps match `output/bunty_chintu_ep1_no_voices.mp4` (music + sound effects, no voices).',
       'Record each line starting at its timestamp. The speech bubble stays on screen for the "until" time.', '']
for sc in tl['scenes']:
    out.append(f"## {fmt(sc['start'])}: {TITLES.get(sc['id'], sc['id'])}")
    out.append('')
    lines = [l for l in tl['lines'] if sc['start'] <= l['t'] < sc['start'] + sc['dur']]
    if not lines:
        out.append('*(no dialogue: music and sound effects only)*')
        out.append('')
        continue
    out.append('| Time | Until | Character | Line |')
    out.append('|---|---|---|---|')
    for l in lines:
        if True:
            who = NAMES.get(l['who'], (l.get('name') or l['who']).upper())
            style = ' *(shouting)*' if l['style'] == 'shout' else ''
            out.append(f"| {fmt(l['t'])} | {fmt(l['t'] + l['dur'])} | {who} | {l['text']}{style} |")
    out.append('')
open('SCRIPT.md', 'w').write('\n'.join(out))
print('SCRIPT.md written')
