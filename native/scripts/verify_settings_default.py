#!/usr/bin/env python3
"""Inspect the compiled Swift settings-tab default in an unstripped device IPA.

This checks the real TelegramCore Mach-O constant, not just the source manifest.
It does not verify signing or execution on a physical iPhone.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile


SYMBOL = "_$s12TelegramCore24SimulatorUIConfigurationO24defaultSettingsTabAvatarSbvpZ"


def inspect(ipa):
    with zipfile.ZipFile(ipa) as archive:
        entry = "Payload/Telegram.app/Frameworks/TelegramCoreFramework.framework/TelegramCoreFramework"
        binary = archive.read(entry)
    magic, cpu, _, _, count, _, _, _ = struct.unpack_from("<8I", binary)
    assert magic == 0xFEEDFACF and cpu == 0x100000C, "Expected thin arm64 Mach-O"
    offset, sections, symtab = 32, [], None
    for _ in range(count):
        command, size = struct.unpack_from("<II", binary, offset)
        assert size >= 8 and offset + size <= len(binary), "Invalid load command"
        if command == 2:
            symtab = struct.unpack_from("<4I", binary, offset + 8)
        if command == 0x19:
            section_count = struct.unpack_from("<I", binary, offset + 64)[0]
            assert 72 + 80 * section_count <= size
            for index in range(section_count):
                item = offset + 72 + 80 * index
                name, segment, address, length, file_offset, _, _, _, flags, _, _, _ = struct.unpack_from("<16s16sQQ8I", binary, item)
                sections.append(dict(name=name.split(b"\0")[0].decode(), segment=segment.split(b"\0")[0].decode(),
                                     address=address, size=length, offset=file_offset, kind=flags & 255))
        offset += size
    assert symtab is not None, "No symbol table: this verifier requires an unstripped build"
    symbol_offset, symbol_count, string_offset, string_size = symtab
    assert symbol_offset + symbol_count * 16 <= len(binary)
    assert string_offset + string_size <= len(binary)
    strings = binary[string_offset:string_offset + string_size]
    matches = []
    for index in range(symbol_count):
        name_index, kind, section_index, _, address = struct.unpack_from("<IBBHQ", binary, symbol_offset + index * 16)
        # Ignore debug/STAB records and undefined symbols with the same spelling.
        if kind & 0xE0 or kind & 0x0E != 0x0E or not section_index:
            continue
        end = strings.find(b"\0", name_index)
        if strings[name_index:end] != SYMBOL.encode():
            continue
        assert section_index <= len(sections)
        section = sections[section_index - 1]
        assert section["kind"] != 1, "Expected file-backed constant"
        relative = address - section["address"]
        assert 0 <= relative < section["size"]
        location = section["offset"] + relative
        assert location < len(binary)
        value = binary[location]
        assert value in (0, 1), "Invalid Swift Bool storage"
        matches.append(dict(symbol=SYMBOL, section=section["name"], segment=section["segment"],
                            file_offset=location, value=value))
    assert matches and len({item["value"] for item in matches}) == 1, "Missing or inconsistent settings constant"
    return dict(framework=entry, framework_sha256=hashlib.sha256(binary).hexdigest(),
                default_settings_tab="avatar" if matches[0]["value"] else "gear", matches=matches,
                verification="Compiled constant only; does not verify device signing or runtime")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ipa", type=Path)
    parser.add_argument("--expected", required=True, choices=("gear", "avatar"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = inspect(args.ipa)
    report["expected"] = args.expected
    report["passed"] = report["default_settings_tab"] == args.expected
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
