#!/usr/bin/env bash
# Full pipeline: timeline -> audio -> parallel scene render -> concat -> mux.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build output
node src/timeline.mjs
python3 audio/synth.py build/timeline.json build/
# render scenes in parallel (longest first)
node -e "import('./src/scenes/index.mjs').then(m=>console.log(m.SCENES.map((s,i)=>[s.dur,i]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]).join('\n')))" \
  | xargs -P "${JOBS:-4}" -I{} node src/render.mjs {} build
ls build/seg_*.mp4 | sort | sed "s|^build/|file '|; s|$|'|" > build/segments.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i build/segments.txt -c copy build/video.mp4
ffmpeg -y -loglevel error -i build/video.mp4 -i build/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -af "loudnorm=I=-14:TP=-1.5:LRA=11" -shortest -movflags +faststart output/bunty_chintu_ep1.mp4
ffmpeg -y -loglevel error -i build/video.mp4 -i build/audio_novoice.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -af "loudnorm=I=-14:TP=-1.5:LRA=11" -shortest -movflags +faststart output/bunty_chintu_ep1_no_voices.mp4
cp build/subtitles.srt output/bunty_chintu_ep1.srt
echo "done: output/bunty_chintu_ep1.mp4"
