# Bunty & Chintu: Episode 1 (animated, open-world comedy)

An original 10-minute animated comedy with Hindi voice-over, in the style of an open-world crime game: wanted stars,
minimap, mission banners, police chases, a bank "heist" and a heat-seeking chappal. Everything (characters, city, cars, HUD,
music and sound effects) is generated from code. The Hindi voice-over uses natural Indian voices from Sarvam AI
(Bulbul v4-flash). The video uses no game assets, no footage and no samples.

## Output
| File | What it is |
|---|---|
| `output/bunty_chintu_ep1_compact.mp4` | Final video (1080p, 30 fps, 10:08, Hindi voice-over) compressed to under 100 MB so it fits on GitHub |
| `output/bunty_chintu_ep1.mp4` *(not in git, 184 MB)* | Full-quality master with Hindi voice-over, music and SFX; upload this one to YouTube. Rebuild with `./build.sh` |
| `output/bunty_chintu_ep1_no_voices.mp4` *(not in git)* | Same video with music + SFX only, for dubbing with your own voice. Built by `./build.sh` |
| `output/bunty_chintu_ep1.srt` | Subtitles (speaker: line) |
| `output/thumbnail.jpg` | 1280x720 YouTube thumbnail |
| `SCRIPT.md` | Full Hindi + Hinglish dialogue with timestamps and the voice cast |
| `YOUTUBE.md` | Title ideas, description with chapters, tags, upload settings |

## Story
1. **Cold open:** chase, then freeze frame: "Soch rahe hoge yahan tak pahuncha kaise?"
2. **Title + loading screen:** stuck at 99%, so Chintu pushes the bar himself.
3. **Spawn:** Bunty spawns like a hero. Chintu spawns head-first in the sand.
4. **Gaadi Chori:** the car belongs to Dadi. She has a handbag, and the theft ends in a bicycle "supercar".
5. **Supercar:** a tortoise overtakes them, and the wanted level goes up for ringing the bell. Police chase, then a ramp jump.
6. **Pool party:** they crash into Lala Ji's pool, become the DJ, and get offered the bank job.
7. **Fast travel:** a pause-menu map, then the loading screen gets stuck again.
8. **Master Plan:** "Step 3: ???"
9. **Disguise Shopping:** five outfits at Bhola Costume Centre, ₹0 in the wallet, and a free paper bag for Chintu.
10. **The Heist:** a banana instead of a gun, token number 999, a time-lapse, then ₹50 from his own account.
11. **Breaking News:** PBN 24x7 covers the "banana dakait" with CCTV footage and a police interview.
12. **Auto Wala Stunt:** "Meter chalu hai, uncle!" Desi drift and a Bollywood bridge jump.
13. **Mission Failed:** Mummy's homing chappal.
14. **Respawn:** "Ek baar aur khelein?"
15. **Dadi ka comeback:** a street race at a red light.
16. **Outro:** like, subscribe, and an end screen with space for YouTube elements.

## Voice-over
- `audio/voices.py` reads each line's Devanagari text (`hi:` in the scene files) and voices it with **Sarvam AI Bulbul v4-flash**
  (one natural Indian voice per character, listed in `SCRIPT.md`). Lines are fitted into their timing slot: long dead-air
  pauses are trimmed first, then a fresh take is tried, and only then a gentle speed-up (max 1.2x).
- `audio/verify_voices.py` transcribes every line with Sarvam speech-to-text (saaras:v3) and re-takes any line whose
  transcript doesn't match the script, so garbled takes are replaced automatically. Verified takes are kept on rebuild.
- The Sarvam API key is not stored in the repo. In this cloud environment the network proxy injects it; elsewhere set
  `SARVAM_API_KEY`. Offline fallback: `TTS=kokoro ./build.sh` uses the open-source Kokoro-82M model (more robotic).
- Mouths are animated from the real audio envelope.

## Rebuild / edit
Requirements: Node 18+, Python 3.10+, ffmpeg.
```bash
npm install
pip install numpy scipy fonttools brotli soundfile kokoro-onnx   # kokoro only needed for the offline fallback
./build.sh               # timeline -> Hindi voices -> audio -> parallel render -> mux  (≈12 min on 4 cores)
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
