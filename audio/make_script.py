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
       'The final video uses this Hindi voice-over, generated with Sarvam AI Bulbul v4-flash natural voices and checked',
       'line by line with speech-to-text. To re-dub with your own voice, use `output/bunty_chintu_ep1_no_voices.mp4`',
       '(music + sound effects only) and record each line at its timestamp.', '',
       '**Voice cast (Sarvam Bulbul v4-flash):** Bunty = rehan_hi_social · Chintu = advait_hi_character ·',
       'Police Uncle = mahesh_hi_documentary · Lala Ji = mukul_hi_suspense · Cashier = rahul_hi_conversational ·',
       'Bhola Uncle = ashok_hi_character · Dadi = roopa_hi_narration · Mummy = sarika_hi_conversation ·',
       'News Anchor = simran_hi_news_breaking', '']
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
