#!/usr/bin/env python3
"""Verify original layout/animation implementations, independently of UI tests."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

FILES = [
    "submodules/Display/Source/Font.swift",
    "submodules/Display/Source/Navigation/NavigationController.swift",
    "submodules/TabBarUI/Sources/TabBarController.swift",
    "submodules/TelegramUI/Sources/ChatController.swift",
    "submodules/TelegramUI/Components/ChatTitleView/Sources/ChatTitleView.swift",
    "submodules/TelegramUI/Components/Chat/ChatMessageTextBubbleContentNode/Sources/ChatMessageTextBubbleContentNode.swift",
    "submodules/TelegramUI/Components/Chat/ChatMessageBubbleItemNode/Sources/ChatMessageBubbleItemNode.swift",
    "submodules/TelegramUI/Components/Chat/ChatMessageDateAndStatusNode/Sources/ChatMessageDateAndStatusNode.swift",
    "submodules/TelegramUI/Components/Chat/ChatTextInputPanelNode/Sources/ChatTextInputPanelNode.swift",
    "submodules/TelegramUI/Components/PeerInfo/PeerInfoScreen/Sources/PeerInfoScreen.swift",
    "submodules/TelegramPresentationData/Sources/PresentationTheme.swift",
    "submodules/TelegramPresentationData/Sources/DefaultDayPresentationTheme.swift",
]

CONFIGURATION_FILES = [
    "submodules/ChatListUI/Sources/ChatListController.swift",
    "submodules/ChatListUI/Sources/ChatListControllerNode.swift",
    "submodules/ChatListUI/Sources/ChatListContainerItemNode.swift",
    "submodules/ChatListUI/Sources/ChatListSearchListPaneNode.swift",
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkout", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    pin = json.loads((Path(__file__).resolve().parents[1] / "upstream.json").read_text())["revision"]
    actual = subprocess.check_output(["git", "-C", str(args.checkout), "rev-parse", "HEAD"], text=True).strip()
    assert actual == pin, "Wrong upstream revision"
    records = []
    for relative in FILES:
        original = subprocess.check_output(["git", "-C", str(args.checkout), "show", f"{pin}:{relative}"]).replace(b"\r\n", b"\n")
        current = (args.checkout / relative).read_bytes().replace(b"\r\n", b"\n")
        records.append(dict(path=relative, sha256=hashlib.sha256(current).hexdigest(), matches_upstream=current == original))
    configured = []
    for relative in CONFIGURATION_FILES:
        current = (args.checkout / relative).read_bytes().replace(b"\r\n", b"\n")
        original = subprocess.check_output(["git", "-C", str(args.checkout), "show", f"{pin}:{relative}"]).replace(b"\r\n", b"\n")
        configured.append(dict(path=relative, sha256=hashlib.sha256(current).hexdigest(), matches_upstream=current == original,
                               reason="Local header/search configuration, matching list scroll bounds and unsupported-story guards; exact patch checked by test_preparation.py"))
    report = dict(upstream=pin, verification="source identity only; configured controllers separately reported; not a pixel or runtime animation comparison", files=records, configured_files=configured)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    assert all(item["matches_upstream"] for item in records), "Original UI implementation changed"
    print(f"PASS: {len(records)} original layout, font and animation source files unchanged")


if __name__ == "__main__":
    main()
