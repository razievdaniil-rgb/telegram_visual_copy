"""Reject a gear-mode QA capture that silently kept the default avatar."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('root', type=Path)
    args = p.parse_args()
    def crop(name):
        paths = list(args.root.rglob(name + '.png'))
        assert len(paths) == 1, (name, len(paths))
        im = Image.open(paths[0]).convert('RGB')
        scale = im.width / 428
        assert abs(im.height / scale - 926) < 2
        return im.crop(tuple(round(v * scale) for v in (340, 846, 382, 884)))
    avatar = crop('settings-icon-avatar')
    gear = crop('settings-icon-gear')
    restored = crop('settings-icon-avatar-restored')
    def error(a, b):
        return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3
    changed, restore_error = error(avatar, gear), error(avatar, restored)
    report = dict(crop_points=[340,846,382,884], avatar_to_gear_error=changed,
                  restored_avatar_error=restore_error, minimum_mode_difference=8,
                  maximum_restored_error=2.5, passed=changed >= 8 and restore_error <= 2.5,
                  scope='Seeded native settings-tab icon mode changes only, not full pixel equivalence')
    (args.root / 'settings-icons.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
