#!/usr/bin/env python3
"""Check original pattern detail and persisted palette in real Simulator screenshots."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageStat


def inspect(path, palette):
    im = Image.open(path).convert('RGB')
    scale = im.width / 428
    assert abs(im.height / scale - 926) < 2, 'Unexpected QA iPhone geometry'
    # Empty upper chat area, above the seeded messages with keyboard closed.
    crop = im.crop(tuple(round(v * scale) for v in (90, 160, 338, 270)))
    rgb = ImageStat.Stat(crop).mean
    gray = crop.convert('L')
    detail = ImageStat.Stat(ImageChops.difference(gray, gray.filter(ImageFilter.GaussianBlur(3)))).mean[0]
    color_ok = rgb[1] > rgb[2] + 8 if palette == 'green' else rgb[2] > max(rgb[0], rgb[1]) + 8
    return dict(screenshot=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                palette=palette, mean_rgb=rgb, highpass_detail=detail,
                passed=detail > 0.3 and color_ok)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('root', type=Path)
    p.add_argument('--baseline-only', action='store_true')
    p.add_argument('--output', type=Path)
    a = p.parse_args()
    cases = [('wallpaper-default-pattern', 'green')]
    if not a.baseline_only:
        cases += [('wallpaper-blue-chat', 'blue'), ('wallpaper-after-profile-edit', 'blue'),
                  ('wallpaper-blue-after-restart', 'blue'), ('wallpaper-default-after-reset', 'green')]
    records = []
    for name, color in cases:
        files = list(a.root.rglob(name + '.png'))
        assert len(files) == 1, f'Expected one recorded screenshot: {name}'
        records.append(inspect(files[0], color))
    report = dict(crop_points=[90, 160, 338, 270], minimum_detail=0.3,
                  records=records, passed=all(r['passed'] for r in records),
                  scope='Real QA screenshot pattern detail and palette only; layout/motion need frame review')
    output = a.output or a.root / 'wallpaper-frames.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
