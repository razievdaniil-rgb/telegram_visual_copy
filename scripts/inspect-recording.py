"""Inspect a real Simulator recording; make a contact sheet without changing it.

Usage: python scripts/inspect-recording.py input.mp4 output-directory
Requires ffmpeg/ffprobe on PATH and Pillow.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path)
parser.add_argument('target', type=Path)
parser.add_argument('--start', type=float, default=0)
parser.add_argument('--end', type=float)
args = parser.parse_args()
source = args.source.resolve()
target = args.target.resolve()
target.mkdir(parents=True, exist_ok=True)
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(source)
], encoding='utf-8'))
video = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')
duration = float(probe['format']['duration'])
assert duration > 5 and video['width'] > 300 and video['height'] > video['width']
width = 240
height = round(width * video['height'] / video['width'])
sheet = Image.new('RGB', (width * 5, (height + 28) * 2), '#E8EBEF')
draw = ImageDraw.Draw(sheet)
frame_probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_frames',
    '-show_entries', 'frame=pts_time', '-of', 'json', str(source)
], encoding='utf-8'))
timestamps = [(index, float(frame['pts_time'])) for index, frame in enumerate(frame_probe['frames']) if 'pts_time' in frame]
assert timestamps, 'No presentation timestamps in the recording'
end = duration if args.end is None else min(duration, args.end)
assert 0 <= args.start < end, 'Invalid inspection interval'
# Include endpoints: long device/driver startup must not hide the final screen.
selected = sorted(set(min(timestamps, key=lambda pair: abs(pair[1] - (args.start + (end - args.start) * index / 9))) for index in range(10)))
expression = '+'.join(f'eq(n\\,{index})' for index, _ in selected)
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
    '-vf', 'select=' + expression, '-fps_mode', 'passthrough', '-frames:v', str(len(selected)), '-start_number', '0', str(target / 'frame-%02d.png')
], check=True)
for index, (original_index, at) in enumerate(selected):
    frame = target / f'frame-{index:02}.png'
    image = Image.open(frame).convert('RGB')
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    x, y = index % 5 * width, index // 5 * (height + 28)
    sheet.paste(image, (x, y))
    draw.text((x + 8, y + height + 6), f'#{original_index}  {at:.3f} s', fill='#111111')
sheet.save(target / 'contact-sheet.jpg', quality=92)
(target / 'probe.json').write_text(json.dumps(probe, indent=2), encoding='utf-8')
(target / 'frame-timestamps.json').write_text(json.dumps(dict(selected=selected, frames=frame_probe['frames']), indent=2), encoding='utf-8')
print(json.dumps({
    'duration': duration, 'width': video['width'], 'height': video['height'],
    'codec': video['codec_name'], 'bytes': source.stat().st_size,
    'contact_sheet': str(target / 'contact-sheet.jpg'),
}))
