#!/usr/bin/env python3
"""Check a compiled device IPA; this does not assert installation or runtime success."""
import argparse
import hashlib
import json
from pathlib import Path
import plistlib
import re
import subprocess
import tempfile
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ipa", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with zipfile.ZipFile(args.ipa) as archive, tempfile.TemporaryDirectory() as directory:
        corrupt = archive.testzip()
        if corrupt:
            raise RuntimeError(f"Corrupt ZIP entry: {corrupt}")
        infos = [name for name in archive.namelist() if re.fullmatch(r"Payload/[^/]+\.app/Info\.plist", name)]
        if len(infos) != 1:
            raise RuntimeError("Expected exactly one iPhone application")
        info = plistlib.loads(archive.read(infos[0]))
        executable = info["CFBundleExecutable"]
        if "/" in executable or "\\" in executable:
            raise RuntimeError("Invalid bundle executable")
        prefix = infos[0].removesuffix("Info.plist")
        binary = Path(directory) / "Telegram"
        binary.write_bytes(archive.read(prefix + executable))
        architectures = subprocess.check_output(["xcrun", "lipo", "-archs", str(binary)], text=True).strip()
        build_info = subprocess.check_output(["xcrun", "vtool", "-show-build", str(binary)], text=True)
        platforms = re.findall(r"^\s*platform\s+(\S+)", build_info, re.MULTILINE)
        if "arm64" not in architectures.split() or not platforms or any(value != "IOS" for value in platforms):
            raise RuntimeError(f"Not an arm64 iPhone build: {architectures}; {platforms}")
        for framework in ["TelegramCoreFramework", "TelegramUIFramework"]:
            entry = prefix + f"Frameworks/{framework}.framework/{framework}"
            if archive.getinfo(entry).file_size == 0:
                raise RuntimeError(f"Empty framework: {framework}")
        report = {
            "sha256": hashlib.file_digest(args.ipa.open("rb"), "sha256").hexdigest(),
            "size_bytes": args.ipa.stat().st_size,
            "bundle_id": info["CFBundleIdentifier"],
            "version": info.get("CFBundleShortVersionString"),
            "build": info.get("CFBundleVersion"),
            "architectures": architectures,
            "platforms": platforms,
            "requires_installation_signing": True,
            "runtime_verified": False,
            "installation_verified": False
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
