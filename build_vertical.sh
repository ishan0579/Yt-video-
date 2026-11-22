#!/usr/bin/env bash
# Full episode in vertical 1080x1920 (for vertical lives / Shorts-style viewing). Run ./build.sh first.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p output
rm -f build/vseg_*.mp4
node -e "import('./src/scenes/index.mjs').then(m=>console.log(m.SCENES.map((s,i)=>[s.dur,i]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]).join('\n')))" \
  | xargs -P "${JOBS:-4}" -I{} node src/shorts.mjs --vscene {}
ls build/vseg_*.mp4 | sort | sed "s|^build/|file '|; s|$|'|" > build/vsegments.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i build/vsegments.txt -c copy build/vertical_video.mp4
ffmpeg -y -loglevel error -i build/vertical_video.mp4 -i build/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -shortest -movflags +faststart output/bunty_chintu_ep1_vertical.mp4
echo "done: output/bunty_chintu_ep1_vertical.mp4"
