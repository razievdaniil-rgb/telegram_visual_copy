#!/usr/bin/env python3
"""Checks the real pinned patch, source overlay and build command construction."""
import argparse
import ast
from pathlib import Path
import subprocess
import sys
import tempfile

from prepare import NATIVE, ROOT, PATCH, prepare, git


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkout", type=Path, required=True)
    args = parser.parse_args()
    checkout = args.checkout.resolve()
    prepare(checkout, check_only=True)
    # Round trip on isolated copies: never reverse the user's actual source edits.
    with tempfile.TemporaryDirectory(prefix="telegram-native-patch-") as directory:
        temp = Path(directory)
        subprocess.run(["git", "init", "--quiet", str(temp)], check=True)
        git(temp, "config", "core.autocrlf", "false")
        paths = []
        for line in PATCH.read_text(encoding="utf-8").splitlines():
            if line.startswith("+++ b/"):
                relative = Path(line[6:])
                if relative.is_absolute() or ".." in relative.parts:
                    raise RuntimeError("Unsafe path in patch")
                paths.append(relative)
                destination = temp / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(git(checkout, "show", "HEAD:" + relative.as_posix()).stdout)
        git(temp, "apply", "--check", "--whitespace=nowarn", str(PATCH))
        git(temp, "apply", "--whitespace=nowarn", str(PATCH))
        for relative in paths:
            # Compare normalized newlines: Windows git may materialize CRLF.
            assert (temp / relative).read_text(encoding="utf-8") == (checkout / relative).read_text(encoding="utf-8"), relative
        git(temp, "apply", "--reverse", "--check", str(PATCH))
        git(temp, "apply", "--reverse", str(PATCH))
        for relative in paths:
            assert (temp / relative).read_bytes() == git(checkout, "show", "HEAD:" + relative.as_posix()).stdout, relative
    for source in (NATIVE / "scripts").glob("*.py"):
        ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
    ast.parse((checkout / "build-system/Make/Make.py").read_text(encoding="utf-8"))
    for mode in ["generate-simulator", "build-simulator"]:
        subprocess.run([sys.executable, str(NATIVE / "scripts/build.py"), mode, "--checkout", str(checkout), "--print-command"], check=True)
    result = subprocess.run([sys.executable, str(NATIVE / "scripts/build.py"), "build-device", "--print-command"], capture_output=True)
    assert result.returncode != 0, "Device build must reject the dummy simulator configuration"
    print(f"PASS: {len(paths)} patched upstream files round-trip exactly; overlay and build guards verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
