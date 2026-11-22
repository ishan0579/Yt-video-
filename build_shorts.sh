#!/usr/bin/env bash
# Vertical Shorts from the episode (run ./build.sh first so build/audio.wav + timeline exist).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p output/shorts
node src/shorts.mjs all
python3 audio/shorts_audio.py
for id in $(python3 -c "import json;print(' '.join(s['id'] for s in json.load(open('build/shorts.json'))))"); do
  ffmpeg -y -loglevel error -i "build/${id}_video.mp4" -i "build/${id}_audio.wav" -map 0:v -map 1:a -c:v copy \
    -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-14:TP=-1.5:LRA=11" -shortest -movflags +faststart "output/shorts/${id}.mp4"
  echo "output/shorts/${id}.mp4"
done
