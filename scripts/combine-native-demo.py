"""Join reviewed CFR chapters from the same native binary; keep final 2–3 minute limit."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('plan', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    assert not args.output.exists(), 'Preserve previous videos'
    clips, chapters, provenance = [], [], []
    total_frames = 0
    for item in plan['clips']:
        movie, edit_path = Path(item['movie']), Path(item['edit'])
        edit = json.loads(edit_path.read_text(encoding='utf-8'))
        assert edit['plan']['app_source_sha'] == plan['app_source_sha']
        assert edit['speed'] == 1 and not edit['interpolation']
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-of', 'json', str(movie)]))
        video = probe['streams'][0]
        assert video['r_frame_rate'] == '30/1' and video['width'] == 720 and video['height'] == 1622
        count = int(video['nb_read_frames'])
        assert count == edit['output_frames']
        for chapter in edit['chapters']:
            chapters.append(dict(title=chapter['title'], start=chapter['start'] + total_frames / 30, end=chapter['end'] + total_frames / 30))
        clips.append(movie.resolve())
        provenance.append(dict(movie=str(movie), edit=str(edit_path), sha256=hashlib.sha256(movie.read_bytes()).hexdigest(), raw_sha256=edit['source_sha256']))
        total_frames += count
    assert 120 <= total_frames / 30 <= 180, 'Review chapter selection; never accelerate'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    inputs = args.output.with_suffix('.concat.txt')
    inputs.write_text(''.join("file '" + str(p).replace('\\', '/').replace("'", "'\\''") + "'\n" for p in clips), encoding='utf-8')
    metadata = args.output.with_suffix('.ffmetadata')
    metadata.write_text(';FFMETADATA1\n' + ''.join(
        f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n" for c in chapters
    ), encoding='utf-8')
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-f', 'concat', '-safe', '0', '-i', str(inputs), '-i', str(metadata),
                    '-vf', 'setpts=N/(30*TB)', '-map_metadata', '1', '-map_chapters', '1', '-an', '-c:v', 'libx264',
                    '-preset', 'veryfast', '-crf', '20', '-profile:v', 'main', '-level:v', '4.0', '-pix_fmt', 'yuv420p',
                    '-r', '30', '-movflags', '+faststart', str(args.output)], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.output), '-f', 'null', '-'], check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(args.output)]))
    video = probe['streams'][0]
    assert int(video['nb_read_frames']) == total_frames
    assert video['r_frame_rate'] == video['avg_frame_rate'] == '30/1'
    assert 120 <= float(probe['format']['duration']) <= 180
    report = dict(app_source_sha=plan['app_source_sha'], duration_seconds=total_frames / 30, frames=total_frames,
                  fps=30, bytes=args.output.stat().st_size, sha256=hashlib.sha256(args.output.read_bytes()).hexdigest(),
                  full_decode_passed=True, action_speed=1, interpolation=False, chapters=chapters, clips=provenance)
    args.output.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
