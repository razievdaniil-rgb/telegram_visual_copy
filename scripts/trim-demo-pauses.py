"""Remove reviewed still intervals from the CFR demo without speeding actions up."""
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
    source = Path(plan['source'])
    assert not args.output.exists(), 'Preserve earlier versions'
    assert hashlib.sha256(source.read_bytes()).hexdigest() == plan['source_sha256']
    cuts = [(round(a * 30), round(b * 30)) for a, b in plan['cuts']]
    assert all(a < b for a, b in cuts)
    assert all(a[1] <= b[0] for a, b in zip(cuts, cuts[1:]))
    def remap(at):
        return at - sum(max(0, min(at, b / 30) - a / 30) for a, b in cuts)
    chapters = [dict(title=c['title'], start=remap(c['start']), end=remap(c['end'])) for c in plan['chapters']]
    metadata = args.output.with_suffix('.ffmetadata')
    metadata.write_text(';FFMETADATA1\n' + ''.join(
        f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n" for c in chapters
    ), encoding='utf-8')
    exclude = '+'.join(f'gte(n,{a})*lt(n,{b})' for a, b in cuts)
    subprocess.run([
        'ffmpeg', '-v', 'error', '-nostdin', '-i', str(source), '-i', str(metadata),
        '-vf', f"select='not({exclude})',setpts=N/(30*TB)", '-map_metadata', '1', '-map_chapters', '1',
        '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-profile:v', 'main',
        '-level:v', '4.0', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', str(args.output)
    ], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.output), '-f', 'null', '-'], check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(args.output)]))
    video = probe['streams'][0]
    frames = int(video['nb_read_frames'])
    assert frames == plan['source_frames'] - sum(b - a for a, b in cuts)
    assert video['r_frame_rate'] == video['avg_frame_rate'] == '30/1'
    assert 120 <= float(probe['format']['duration']) <= 180
    result = dict(plan=plan, duration_seconds=frames / 30, frames=frames, fps=30,
                  bytes=args.output.stat().st_size, sha256=hashlib.sha256(args.output.read_bytes()).hexdigest(),
                  chapters=chapters, full_decode_passed=True, action_speed=1)
    args.output.with_suffix('.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
