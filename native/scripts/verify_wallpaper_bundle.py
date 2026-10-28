#!/usr/bin/env python3
"""Verify offline wallpaper resources inside the compiled IPA, without running it."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import struct
import xml.etree.ElementTree as ET
import zipfile


def inspect(ipa):
    resources = Path(__file__).resolve().parents[1] / "Resources"
    records = []
    with zipfile.ZipFile(ipa) as archive:
        for name in ("SimulatorDefaultPattern.tgv", "SimulatorDefaultPatternPreview.png"):
            entry = "Payload/Telegram.app/" + name
            data = archive.read(entry)
            expected = (resources / name).read_bytes()
            record = dict(entry=entry, bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
            if name.endswith(".tgv"):
                if data != expected:
                    raise ValueError(f"Bundled vector differs from source: {name}")
                svg = gzip.decompress(data)
                if not 0 < len(svg) < 2 * 1024 * 1024:
                    raise ValueError("Pattern exceeds the native SVG decoder limit")
                root = ET.fromstring(svg)
                if root.tag.rsplit("}", 1)[-1] != "svg":
                    raise ValueError("Expected SVG pattern")
                record.update(decoded_bytes=len(svg), viewbox=root.attrib.get("viewBox"))
            else:
                def dimensions(png):
                    if not png.startswith(b"\x89PNG\r\n\x1a\n"):
                        raise ValueError("Expected PNG preview")
                    offset = 8
                    while offset + 12 <= len(png):
                        size, tag = struct.unpack_from(">I4s", png, offset)
                        if offset + size + 12 > len(png):
                            raise ValueError("Truncated PNG")
                        if tag == b"IHDR" and size == 13:
                            return struct.unpack_from(">II", png, offset + 8)
                        offset += size + 12
                    raise ValueError("Missing PNG image header")
                if dimensions(data) != dimensions(expected):
                    raise ValueError("Wrong preview dimensions")
                # Xcode pngcrush converts .png to CgBI. The original .resource
                # remains byte-identical, while the compiled copy needs UI QA.
                original = "Payload/Telegram.app/5789658100176783156-m.resource"
                if archive.read(original) != expected:
                    raise ValueError("Original preview resource differs from source")
                record.update(dimensions=dimensions(data),
                              xcode_png_optimized=data != expected,
                              original_resource=original,
                              original_resource_sha256=hashlib.sha256(expected).hexdigest())
            records.append(record)
    return dict(resources=records, passed=True,
                scope="Exact vector/original preview and compiled PNG dimensions; native rendering and persistence require UI QA")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ipa", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = inspect(args.ipa)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
