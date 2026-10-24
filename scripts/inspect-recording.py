"""Inspect a real Simulator recording; make a contact sheet without changing it.

Usage: python scripts/inspect-recording.py input.mp4 output-directory
Requires ffmpeg/ffprobe on PATH and Pillow.
"""
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

source = Path(sys.argv[1]).resolve()
target = Path(sys.argv[2]).resolve()
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
for index in range(10):
    at = min(duration - .1, duration * (index + .5) / 10)
    frame = target / f'frame-{index:02}.png'
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(at),
        '-i', str(source), '-frames:v', '1', str(frame)
    ], check=True)
    image = Image.open(frame).convert('RGB')
    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    x, y = index % 5 * width, index // 5 * (height + 28)
    sheet.paste(image, (x, y))
    draw.text((x + 8, y + height + 6), f'{at:.1f} s', fill='#111111')
sheet.save(target / 'contact-sheet.jpg', quality=92)
(target / 'probe.json').write_text(json.dumps(probe, indent=2), encoding='utf-8')
print(json.dumps({
    'duration': duration, 'width': video['width'], 'height': video['height'],
    'codec': video['codec_name'], 'bytes': source.stat().st_size,
    'contact_sheet': str(target / 'contact-sheet.jpg'),
}))
