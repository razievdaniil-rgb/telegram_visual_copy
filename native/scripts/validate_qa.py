#!/usr/bin/env python3
"""Catch unsupported coordinates before spending time booting an iPhone."""
from pathlib import Path
import re


def main():
    native = Path(__file__).resolve().parents[1]
    paths = list(native.glob("qa-*.yaml")) + [native / "demo.yaml"]
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for point in re.findall(r"point:\s*['\"]([^'\"]+)", text):
            match = re.fullmatch(r"(\d+)%,\s*(\d+)%", point)
            assert match, f"{path.name}: Maestro 2.11 requires integer percentages: {point}"
            assert all(0 <= int(value) <= 100 for value in match.groups()), point
        for flow in re.findall(r"runFlow:\s*([^\s]+\.yaml)", text):
            assert (native / flow).is_file(), flow
    print(f"PASS: coordinates and referenced flows in {len(paths)} native scenarios")


if __name__ == "__main__":
    main()
