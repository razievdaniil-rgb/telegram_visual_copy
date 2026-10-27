"""Render a readable 1x walkthrough, shortening only quiet pauses between actions.

Plan: source, app_source_sha, ranges [{start, end, title}], target_seconds.
Motion and its surrounding frames keep their original timing. No interpolation.
The raw recording remains the acceptance evidence for runtime animation timing.
"""
import argparse
import bisect
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat


def merged(intervals):
    result = []
    for start, end in sorted(intervals):
        if result and start <= result[-1][1]:
            result[-1][1] = max(result[-1][1], end)
        else:
            result.append([start, end])
    return result


def quiet_cuts(start, end, motion, keep):
    cursor = start
    cuts = []
    for left, right in merged([[start, start], *motion, [end, end]]):
        if left - cursor > keep + 0.35:
            cuts.append([cursor + keep * 0.6, left - keep * 0.4])
        cursor = max(cursor, right)
    return cuts


def kept_intervals(start, end, cuts):
    cursor = start
    result = []
    for left, right in cuts:
        if left > cursor:
            result.append([cursor, left])
        cursor = right
    if cursor < end:
        result.append([cursor, end])
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--analyze-only', action='store_true')
    args = parser.parse_args()
    assert not args.output.exists(), 'Preserve the previous deliverable; use a new name'
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    source = Path(plan['source']).resolve()
    assert plan['app_source_sha'] == Path(plan['app_source_file']).read_text().strip()
    ranges = plan['ranges']
    assert ranges and all(r['start'] < r['end'] for r in ranges)
    assert all(a['end'] <= b['start'] for a, b in zip(ranges, ranges[1:]))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_frames',
        '-show_entries', 'frame=pts_time', '-of', 'json', str(source)
    ]))
    times = [float(frame['pts_time']) for frame in probe['frames']]
    assert all(a <= b for a, b in zip(times, times[1:])), 'Nonmonotonic source PTS'
    first = max(0, bisect.bisect_right(times, ranges[0]['start']) - 1)
    last = min(len(times) - 1, bisect.bisect_left(times, ranges[-1]['end']))
    select = f"select='between(n,{first},{last})'"
    analysis = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(source),
        '-vf', select + ',scale=180:390,format=gray', '-fps_mode', 'passthrough',
        '-frames:v', str(last - first + 1), '-f', 'rawvideo', '-'
    ], stdout=subprocess.PIPE)
    motions = [[] for _ in ranges]
    previous = None
    previous_at = None
    for index in range(first, last + 1):
        data = analysis.stdout.read(180 * 390)
        assert len(data) == 180 * 390, f'Missing analysis frame {index}'
        image = Image.frombytes('L', (180, 390), data).crop((0, 23, 180, 386))
        at = times[index]
        if previous is not None:
            difference = ImageChops.difference(image, previous)
            histogram = difference.histogram()
            changed = sum(histogram[12:]) / (180 * 363)
            moving = changed > 0.00012 or ImageStat.Stat(difference).mean[0] > 0.08
            if moving:
                for section, entries in zip(ranges, motions):
                    # A long capture gap repeats a still frame; protect the onset
                    # of the next visible change without retaining the whole wait.
                    left = max(section['start'], max(previous_at, at - 0.18) - 0.2)
                    right = min(section['end'], at + 0.3)
                    if left < right:
                        entries.append([left, right])
        previous, previous_at = image, at
    analysis.stdout.close()
    assert analysis.wait() == 0

    def edit(keep):
        result = []
        for section, motion in zip(ranges, motions):
            cuts = quiet_cuts(section['start'], section['end'], motion, keep)
            intervals = kept_intervals(section['start'], section['end'], cuts)
            result.append(dict(**section, cuts=cuts, kept=intervals))
        return result

    def length(sections):
        return sum(end - start for section in sections for start, end in section['kept'])

    target = plan.get('target_seconds', 165)
    assert 120 <= target <= 180
    low, high = 0.9, 4.0
    # Adjust reading pauses, never the speed of visible motion.
    for _ in range(28):
        keep = (low + high) / 2
        if length(edit(keep)) < target:
            low = keep
        else:
            high = keep
    sections = edit((low + high) / 2)
    duration = length(sections)
    if not args.analyze_only:
        assert 120 <= duration <= 180, f'{duration:.1f}s at 1x: review ranges rather than accelerate'
    mapping = []
    chapters = []
    for chapter, section in enumerate(sections):
        begin = len(mapping) / 30
        for start, end in section['kept']:
            for tick in range(round((end - start) * 30)):
                at = min(end, start + tick / 30)
                mapping.append((max(0, bisect.bisect_right(times, at) - 1), chapter))
        chapters.append(dict(title=section['title'], start=begin, end=len(mapping) / 30))
    assert all(a[0] <= b[0] for a, b in zip(mapping, mapping[1:]))
    args.output.with_suffix('.edit.json').write_text(json.dumps(dict(
        plan=plan, sections=sections, chapters=chapters, output_frames=len(mapping),
        source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        fps=30, speed=1, interpolation=False, shortened_only_quiet_pauses=True,
        duration_seconds=len(mapping) / 30
    ), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.analyze_only:
        print(json.dumps(dict(duration_seconds=len(mapping) / 30, chapters=chapters), ensure_ascii=False, indent=2))
        return
    first, last = mapping[0][0], mapping[-1][0]
    decoder = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(source),
        '-vf', f"select='between(n,{first},{last})',scale=720:1558,format=rgb24",
        '-fps_mode', 'passthrough', '-frames:v', str(last - first + 1),
        '-f', 'rawvideo', '-'
    ], stdout=subprocess.PIPE)
    stage = args.output.with_suffix('.stage.mp4')
    encoder = subprocess.Popen([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo',
        '-pixel_format', 'rgb24', '-video_size', '720x1622', '-framerate', '30', '-i', '-',
        '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-profile:v', 'main', '-level:v', '4.0',
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(stage)
    ], stdin=subprocess.PIPE)
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)
    current = 0
    for index in range(first, last + 1):
        data = decoder.stdout.read(720 * 1558 * 3)
        assert len(data) == 720 * 1558 * 3, f'Missing render frame {index}'
        if current >= len(mapping) or mapping[current][0] != index:
            continue
        rendered_chapter = None
        while current < len(mapping) and mapping[current][0] == index:
            chapter = mapping[current][1]
            if chapter != rendered_chapter:
                canvas = Image.new('RGB', (720, 1622), '#17212b')
                canvas.paste(Image.frombytes('RGB', (720, 1558), data), (0, 64))
                ImageDraw.Draw(canvas).text((22, 19), ranges[chapter]['title'], font=font, fill='white')
                pixels = canvas.tobytes()
                rendered_chapter = chapter
            encoder.stdin.write(pixels)
            current += 1
    decoder.stdout.close()
    encoder.stdin.close()
    assert decoder.wait() == 0 and encoder.wait() == 0
    assert current == len(mapping)
    metadata = args.output.with_suffix('.ffmetadata')
    metadata.write_text(';FFMETADATA1\n' + ''.join(
        f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n"
        for c in chapters
    ), encoding='utf-8')
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(stage), '-i', str(metadata),
        '-map_metadata', '1', '-c', 'copy', '-movflags', '+faststart', str(args.output)
    ], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.output), '-f', 'null', '-'], check=True)
    output = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format',
        '-of', 'json', str(args.output)
    ]))
    stream = output['streams'][0]
    assert stream['r_frame_rate'] == '30/1' and int(stream['nb_read_frames']) == len(mapping)
    assert 120 <= float(output['format']['duration']) <= 180
    print(json.dumps(dict(duration=output['format']['duration'], frames=len(mapping),
        bytes=args.output.stat().st_size, sha256=hashlib.sha256(args.output.read_bytes()).hexdigest(),
        chapters=chapters), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
