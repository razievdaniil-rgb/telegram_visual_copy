"""Assemble a chaptered demonstration from independent native QA recordings."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont


def run(*args):
    subprocess.run(list(map(str, args)), check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--work-dir', type=Path, default=Path('artifacts/native-feature-demo'))
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    work = args.work_dir
    work.mkdir(parents=True, exist_ok=True)
    reports = []
    source_shas = set()
    for name, folder, flow, ranges, speed, label in plan:
        root = Path('artifacts') / ('native-qa-' + folder)
        source_shas.add((root / 'app-source-sha.txt').read_text().strip())
        output = work / (name + '.mp4')
        if not output.exists():
            timestamps = root / ('inspection' if folder == 'suite7' else 'feature-inspection') / 'frame-timestamps.json'
            run(sys.executable, 'scripts/create-video-preview.py', root / flow / 'recording.mp4',
                timestamps, output, '--ranges', *ranges, '--max-idle', '.8', '--speed', speed, '--label', label)
        report = json.loads(output.with_suffix('.json').read_text(encoding='utf-8'))
        assert report['label'] == label and report['speed'] == speed
        assert report['ranges_seconds'] == [list(map(float, item.split(':'))) for item in ranges]
        assert hashlib.sha256(output.read_bytes()).hexdigest() == report['sha256']
        reports.append(report)
    assert len(source_shas) == 1, 'Do not mix different app revisions'
    intro = Image.new('RGB', (720, 1638), '#161b22')
    draw = ImageDraw.Draw(intro)
    title = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 42)
    body = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 25)
    draw.multiline_text((42, 475), 'Демонстрация функций\nприложения', font=title, fill='white', spacing=18)
    draw.multiline_text((42, 680), 'Нативное приложение • iOS Simulator\n\nМонтаж независимых тестовых запусков\nОжидания между действиями сокращены\n[x2] — ускоренное заполнение форм', font=body, fill='#cbd5e1', spacing=14)
    intro.save(work / 'intro.png')
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', work / 'intro.png',
        '-t', '3', '-r', '30', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-profile:v', 'main', '-level:v', '4.0', '-preset', 'veryfast', '-crf', '22', work / '00-intro.mp4')
    files = ['00-intro.mp4'] + [item[0] + '.mp4' for item in plan]
    (work / 'concat.txt').write_text(''.join("file '" + name + "'\n" for name in files), encoding='utf-8')
    chapters = [{'title': 'О демонстрации', 'start': 0.0, 'end': 3.0}]
    at = 3.0
    for item, report in zip(plan, reports):
        end = at + report['output_frames'] / 30
        chapters.append({'title': item[5], 'start': at, 'end': end})
        at = end
    metadata = ';FFMETADATA1\ntitle=Демонстрация функций нативного приложения\n'
    for chapter in chapters:
        metadata += f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(chapter['start'] * 1000)}\nEND={round(chapter['end'] * 1000)}\ntitle={chapter['title']}\n"
    (work / 'chapters.ffmeta').write_text(metadata, encoding='utf-8')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i',
        work / 'concat.txt', '-f', 'ffmetadata', '-i', work / 'chapters.ffmeta', '-map', '0:v:0',
        '-map_metadata', '1', '-map_chapters', '1', '-c:v', 'copy', '-movflags', '+faststart', args.output)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                                               '-show_chapters', '-of', 'json', str(args.output)]))
    video = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')
    assert video['avg_frame_rate'] == '30/1'
    expected = 90 + sum(report['output_frames'] for report in reports)
    assert int(video['nb_frames']) == expected
    assert abs(float(probe['format']['duration']) - expected / 30) < .05
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', args.output, '-map', '0:v:0', '-f', 'null', '-')
    report = {'application_source': source_shas.pop(), 'duration_seconds': expected / 30,
              'bytes': args.output.stat().st_size, 'frames': expected, 'fps': 30,
              'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(), 'chapters': chapters,
              'segments': reports, 'edited_demonstration_not_raw_animation_evidence': True,
              'full_decode_verified': True}
    args.output.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: report[key] for key in ['duration_seconds', 'bytes', 'frames', 'sha256']}, indent=2))


if __name__ == '__main__':
    main()
