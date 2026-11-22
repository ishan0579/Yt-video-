# Bunty & Chintu: Episode 1 (animated, open-world comedy)

An original 8-minute animated Hinglish comedy in the style of an open-world crime game: wanted stars,
minimap, mission banners, police chases, a bank "heist" and a heat-seeking chappal. Everything (characters, city, cars, HUD,
music, sound effects and babble voices) is generated from code. The video uses no game assets, no footage and no
samples, so it is safe to upload.

## Output
| File | What it is |
|---|---|
| `output/bunty_chintu_ep1.mp4` | Final video, 1920x1080, 30 fps, about 8:02, with music, SFX and cartoon "babble" voices |
| `output/bunty_chintu_ep1_no_voices.mp4` | Same video with music + SFX only, for dubbing with your own voice |
| `output/bunty_chintu_ep1.srt` | Subtitles (speaker: line) |
| `output/thumbnail.jpg` | 1280x720 YouTube thumbnail |
| `SCRIPT.md` | Full dialogue with timestamps (for voice-over) |
| `YOUTUBE.md` | Title ideas, description with chapters, tags, upload settings |

## Story
1. **Cold open:** chase, then freeze frame: "Soch rahe hoge yahan tak pahuncha kaise?"
2. **Title + loading screen:** stuck at 99%, so Chintu pushes the bar himself.
3. **Spawn:** Bunty spawns like a hero. Chintu spawns head-first in the sand.
4. **Gaadi Chori:** the car belongs to Dadi. She has a handbag, and the theft ends in a bicycle "supercar".
5. **Supercar:** a tortoise overtakes them, and the wanted level goes up for ringing the bell. Police chase, then a ramp jump.
6. **Pool party:** they crash into Lala Ji's pool, become the DJ, and get offered the bank job.
7. **Master Plan:** "Step 3: ???"
8. **The Heist:** a banana instead of a gun, token number 999, a time-lapse, then ₹50 from his own account.
9. **Auto Wala Stunt:** "Meter chalu hai, uncle!" Desi drift and a Bollywood bridge jump.
10. **Mission Failed:** Mummy's homing chappal.
11. **Respawn:** "Ek baar aur khelein?"
12. **Outro:** like, subscribe, and an end screen with space for YouTube elements.

## Rebuild / edit
Requirements: Node 18+, Python 3.10+, ffmpeg.
```bash
npm install
pip install numpy scipy fonttools brotli
./build.sh               # timeline -> audio -> parallel render -> mux  (≈10 min on 4 cores)
```
- Change dialogue: edit the `lines` array in `src/scenes/s_*.mjs` (`t` = start second inside the scene).
- Preview a frame: `node src/still.mjs bank 35` (writes `tests/stills/bank_35.png`).
- Render one scene: `node src/render.mjs 8 build`.
- Regenerate the thumbnail: `node src/thumbnail.mjs output/thumbnail.png`.
- Regenerate the dubbing script: `node src/timeline.mjs && python3 audio/make_script.py`.

## Code map
- `src/engine.mjs`: canvas, easing, shapes, text, camera, effects (dust, explosions, speed lines, iris wipe)
- `src/characters.mjs`: rigged characters (Bunty, Chintu, Dadi, Police Uncle, Mummy, Lala Ji, Cashier, guests)
- `src/props.mjs`, `src/bg.mjs`: vehicles, palms, buildings, skies, streets, interiors
- `src/hud.mjs`: wanted stars, ₹ money, minimap, mission banners, popups, speedometer
- `src/dialogue.mjs`: speech bubbles + syllable timing (shared with the audio for lip sync)
- `src/scenes/`: the 13 scenes, in order in `index.mjs`
- `audio/synth.py`: procedural music cues, sound effects and babble voices
