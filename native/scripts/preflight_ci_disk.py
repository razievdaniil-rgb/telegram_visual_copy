"""Reserve disk space on an ephemeral macOS GitHub runner before native compilation."""
import argparse
import json
import os
from pathlib import Path
import shutil
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    assert sys.platform == 'darwin' and os.environ.get('GITHUB_ACTIONS') == 'true', 'Hosted macOS CI only'
    workspace = Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
    assert (workspace / 'native/upstream.json').is_file()
    home = Path.home().resolve(strict=True)
    sdk = home / 'Library/Android/sdk'
    minimum = 50 * 1024**3
    before = shutil.disk_usage(workspace).free
    removed = []
    if before < minimum and sdk.exists():
        assert not any(path.is_symlink() for path in [home / 'Library', sdk.parent, sdk])
        target = sdk.resolve(strict=True)
        assert target == home / 'Library/Android/sdk' and target.is_dir()
        assert not workspace.is_relative_to(target) and not target.is_relative_to(workspace)
        for variable in ['ANDROID_HOME', 'ANDROID_SDK_ROOT']:
            if os.environ.get(variable):
                assert Path(os.environ[variable]).resolve() == target, 'Unexpected Android SDK path'
        print(f'Removing unused Android SDK from this disposable iOS-only runner: {target}', flush=True)
        shutil.rmtree(target)
        removed.append(str(target))
    after = shutil.disk_usage(workspace).free
    report = dict(before_free_bytes=before, after_free_bytes=after, minimum_free_bytes=minimum,
                  removed_unused_android_sdks=removed, selected_xcode=os.environ.get('DEVELOPER_DIR'),
                  preserved=['selected Xcode and all iOS SDKs', 'all simulator runtimes', 'project sources', 'Bazel cache'])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2), flush=True)
    assert after >= minimum, 'Insufficient free space before cache restoration; refusing a predictable packaging failure'


if __name__ == '__main__':
    main()
