#!/usr/bin/env python3
"""Detect the observed short-list disappearance using actual native screenshots.

Only for the seeded iPhone 13 Pro Max QA flow, before it changes profiles.
Compare avatar pixels below the fixed header; ignore clocks, tab selection,
names and unread counters. A successful AX assertion alone misses occlusion.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


def avatar_strip(path):
    image = Image.open(path).convert('RGB')
    scale = image.width / 428
    assert abs(image.height / scale - 926) < 2, 'Unexpected QA device geometry'
    return image.crop(tuple(round(value * scale) for value in (12, 145, 77, 295)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--targets', type=Path, nargs='+')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()

    def find(name):
        files = list(args.root.rglob(name + '.png'))
        assert len(files) == 1, f'Expected one recorded {name} screenshot, got {len(files)}'
        return files[0]

    baseline_path = args.baseline or find('menu-collapsed')
    targets = args.targets or [find(name) for name in (
        'menu-recollapsed-before-search', 'menu-search-closed', 'menu-work-folder', 'menu-restored')]
    baseline = avatar_strip(baseline_path)
    assert max(ImageStat.Stat(baseline).stddev) > 30, 'Blank baseline cannot verify avatars'
    records = []
    for path in targets:
        image = avatar_strip(path)
        assert image.size == baseline.size, 'Inconsistent screenshot scale'
        error = sum(ImageStat.Stat(ImageChops.difference(baseline, image)).mean) / 3
        records.append(dict(screenshot=str(path), mean_absolute_error=error, passed=error <= 10))
    report = dict(baseline=str(baseline_path), crop_points=[12, 145, 77, 295],
                  maximum_mean_error=10, comparisons=records, passed=all(item['passed'] for item in records),
                  scope='Seeded avatar geometry only; full visual review remains required')
    output = args.output or args.root / 'menu-geometry.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
