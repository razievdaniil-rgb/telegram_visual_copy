#!/usr/bin/env python3
"""Create a fresh simulator using a device/runtime pair explicitly supported by Xcode."""
import json
import os
from pathlib import Path
import subprocess


def select_device(inventory):
    pairs = [(runtime, phone) for runtime in inventory["runtimes"]
             if runtime.get("isAvailable") and runtime["identifier"].startswith("com.apple.CoreSimulator.SimRuntime.iOS-")
             for phone in runtime["supportedDeviceTypes"] if phone["name"].startswith("iPhone")]
    if not pairs:
        raise RuntimeError("No compatible iPhone simulator runtime is installed")
    pairs.sort(key=lambda pair: tuple(int(n) for n in pair[0]["version"].split(".")), reverse=True)
    for preferred in ["iPhone 13 Pro Max", "iPhone 18 Pro"]:
        match = next((pair for pair in pairs if pair[1]["name"] == preferred), None)
        if match:
            return match
    return pairs[0]


if __name__ == "__main__":
    output = Path("artifacts/native-demo")
    runtime, phone = select_device(json.loads((output / "simulators.json").read_text()))
    udid = subprocess.check_output(["xcrun", "simctl", "create", "Native Telegram Demo", phone["identifier"], runtime["identifier"]], text=True).strip()
    (output / "device-udid.txt").write_text(udid)
    (output / "selected-device.json").write_text(json.dumps(dict(name=phone["name"], runtime=runtime["identifier"], udid=udid), indent=2))
    with open(os.environ["GITHUB_ENV"], "a") as stream:
        stream.write("DEVICE=" + udid + "\n")
    print(phone["name"], runtime["identifier"], udid)
