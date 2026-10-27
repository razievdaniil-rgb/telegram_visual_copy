"""Make a short CFR overview from actual simulator frames and their original PTS.

Idle holds are shortened; optional --speed is explicitly recorded for edited demos.
This edited preview is not the raw evidence used to accept animation timing.
"""
import argparse
import bisect
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('timestamps', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--ranges', nargs='+', required=True)
    parser.add_argument('--max-idle', type=float, default=1.2)
    parser.add_argument('--speed', type=float, default=1.0)
    parser.add_argument('--label')
    args = parser.parse_args()
    assert args.max_idle > 0 and args.speed > 0
    ranges = [tuple(map(float, item.split(':'))) for item in args.ranges]
    frames = json.loads(args.timestamps.read_text(encoding='utf-8'))['frames']
    assert all('pts_time' in item for item in frames)
    selected = []
    sections = []
    for begin, end in ranges:
        section = [(index, float(item['pts_time'])) for index, item in enumerate(frames)
                   if begin <= float(item['pts_time']) <= end]
        assert section and all(b[1] >= a[1] for a, b in zip(section, section[1:]))
        sections.append(section)
        selected.extend(section)
    assert len(set(index for index, _ in selected)) == len(selected)
    assert selected == sorted(selected)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    work = args.output.parent / (args.output.stem + '-frames')
    work.mkdir(exist_ok=True)
    assert not list(work.glob('*.png')), 'Use a fresh output name for this preview'
    expression = '+'.join(f'between(n\\,{section[0][0]}\\,{section[-1][0]})' for section in sections)
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(args.source),
        '-vf', 'select=' + expression + ',scale=720:1558,settb=1/30,setpts=N',
        '-enc_time_base', '1:30', '-fps_mode', 'passthrough', '-frames:v', str(len(selected)),
        str(work / '%05d.png'),
    ], check=True)
    paths = sorted(work.glob('*.png'))
    assert len(paths) == len(selected), (len(paths), len(selected))
    starts = []
    duration = 0.0
    shortened_idle = 0.0
    boundaries = []
    for section in sections:
        boundaries.append(duration)
        for i, (_, at) in enumerate(section):
            starts.append(duration)
            if i + 1 < len(section):
                original = section[i + 1][1] - at
                hold = min(original, args.max_idle)
                shortened_idle += original - hold
            else:
                hold = 1.2
            duration += max(hold, 1 / 600) / args.speed
    band = 80 if args.label else 0
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 25) if args.label else None
    encoder = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
        '-pixel_format', 'rgb24', '-video_size', f'720x{1558 + band}', '-framerate', '30', '-i', '-',
        '-an', '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '4.0',
        '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '22',
        '-movflags', '+faststart', str(args.output),
    ], stdin=subprocess.PIPE)
    previous = -1
    pixels = None
    count = round(duration * 30)
    try:
        for tick in range(count):
            index = max(0, bisect.bisect_right(starts, tick / 30) - 1)
            if index != previous:
                with Image.open(paths[index]) as source_image:
                    picture = source_image.convert('RGB')
                if band:
                    canvas = Image.new('RGB', (720, 1558 + band), '#161b22')
                    canvas.paste(picture, (0, band))
                    ImageDraw.Draw(canvas).text((22, 24), args.label, font=font, fill='white')
                    picture = canvas
                pixels = picture.tobytes()
                previous = index
            encoder.stdin.write(pixels)
    finally:
        encoder.stdin.close()
    assert encoder.wait() == 0
    report = {
        'source': str(args.source), 'source_sha256': hashlib.sha256(args.source.read_bytes()).hexdigest(),
        'output': str(args.output), 'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'ranges_seconds': ranges, 'source_frames': len(selected), 'output_frames': count,
        'fps': 30, 'duration_seconds': count / 30, 'bytes': args.output.stat().st_size,
        'shortened_idle_seconds': shortened_idle, 'section_starts_seconds': boundaries,
        'moving_sections_sped_up': args.speed != 1.0, 'speed': args.speed,
        'label': args.label, 'max_idle_seconds': args.max_idle,
        'edited_overview_not_raw_animation_evidence': True,
    }
    args.output.with_suffix('.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
