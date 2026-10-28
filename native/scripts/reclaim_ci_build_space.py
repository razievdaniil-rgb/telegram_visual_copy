"""Free only the disposable macOS CI build tree before archiving the disk cache."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    assert os.environ.get('GITHUB_ACTIONS') == 'true' and sys.platform == 'darwin', 'macOS GitHub Actions only'
    workspace = Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
    artifacts = (workspace / 'artifacts').resolve(strict=True)
    assert artifacts.parent == workspace
    checkout = (artifacts / 'native-telegram-ios').resolve(strict=True)
    assert checkout.parent == artifacts and checkout.name == 'native-telegram-ios', 'Unexpected disposable checkout'
    package = artifacts / 'native-build/Telegram.ipa'
    assert package.is_file() and not package.is_symlink()
    assert package.resolve().parent == artifacts / 'native-build'
    cache = (Path.home() / 'telegram-bazel-cache').resolve(strict=True)
    assert not cache.is_relative_to(checkout) and not checkout.is_relative_to(cache)
    def package_digest():
        with package.open('rb') as source:
            return hashlib.file_digest(source, 'sha256').hexdigest()
    digest = package_digest()
    bazel = checkout / 'build-input/bazel-9.2.0-darwin-arm64'
    assert bazel.is_file()
    before = shutil.disk_usage(workspace).free
    subprocess.run([str(bazel), 'clean', '--expunge'], cwd=checkout, check=True)
    # This is the throwaway pinned upstream clone, not the project's checkout.
    # The IPA and diagnostics were copied out and the IPA was already uploaded.
    shutil.rmtree(checkout)
    assert cache.is_dir() and package.is_file()
    assert package_digest() == digest, 'Packaged application changed'
    print(f'Freed {shutil.disk_usage(workspace).free - before} bytes; IPA unchanged: {digest}', flush=True)


if __name__ == '__main__':
    main()
