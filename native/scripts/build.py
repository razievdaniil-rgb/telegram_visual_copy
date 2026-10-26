#!/usr/bin/env python3
"""Use the pinned upstream build system. This script never installs or publishes."""
import argparse
import json
from pathlib import Path
import platform
import re
import shlex
import subprocess
import sys

from prepare import NATIVE, ROOT, prepare


def command_for(args):
    checkout = args.checkout.resolve()
    configuration = args.configuration.resolve()
    command = [sys.executable, "build-system/Make/Make.py", "--cacheDir=" + str(args.cache.resolve())]
    simulator = args.mode in ("generate-simulator", "build-simulator")
    signing = checkout / "build-system/fake-codesigning" if simulator else args.signing
    if not simulator and signing is None and args.mode != "generate-device":
        raise ValueError("Device builds need --signing with the matching profiles/certificates")
    if args.mode.startswith("generate"):
        command += ["generateProject", "--configurationPath=" + str(configuration), "--disableExtensions"]
        if simulator:
            command += ["--codesigningInformationPath=" + str(signing), "--disableProvisioningProfiles"]
        elif signing:
            command += ["--codesigningInformationPath=" + str(signing.resolve())]
        else:
            command += ["--xcodeManagedCodesigning"]
    else:
        command += ["build", "--configurationPath=" + str(configuration), "--codesigningInformationPath=" + str(signing.resolve()), "--buildNumber=" + str(args.build_number), "--configuration=" + ("debug_sim_arm64" if simulator else "release_arm64"), "--simulatorLocalMode", "--outputBuildArtifactsPath=" + str(args.output.resolve())]
    return command


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["generate-simulator", "generate-device", "build-simulator", "build-device"])
    parser.add_argument("--checkout", type=Path, default=ROOT / "artifacts/native-telegram-ios")
    parser.add_argument("--configuration", type=Path, default=NATIVE / "configuration.simulator.json")
    parser.add_argument("--signing", type=Path)
    parser.add_argument("--cache", type=Path, default=Path.home() / "telegram-bazel-cache")
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/native-build")
    parser.add_argument("--build-number", type=int, default=1)
    parser.add_argument("--print-command", action="store_true", help="Inspect the command on any OS; do not execute it")
    args = parser.parse_args()
    try:
        if not args.mode.endswith("simulator") and args.configuration.resolve() == (NATIVE / "configuration.simulator.json").resolve():
            raise ValueError("Use a private device configuration with your own bundle_id and team_id")
        command = command_for(args)
        print(shlex.join(command), flush=True)
        if args.print_command:
            return 0
        if platform.system() != "Darwin":
            raise RuntimeError("The iOS app requires macOS and Xcode. Only source preparation/model tests run elsewhere.")
        prepare(args.checkout, check_only=True)
        versions = json.loads((args.checkout / "versions.json").read_text())
        xcode = subprocess.check_output(["xcodebuild", "-version"], text=True)
        match = re.search(r"^Xcode (\S+)", xcode, re.MULTILINE)
        if not match or match.group(1) != versions["xcode"]:
            raise RuntimeError(f"Pinned source requires Xcode {versions['xcode']}; detected: {xcode.strip()}")
        if not (args.checkout / "third-party").is_dir():
            raise RuntimeError("Run prepare.py --full before building")
        status = subprocess.check_output(["git", "-C", str(args.checkout), "submodule", "status", "--recursive"], text=True)
        if any(line.startswith(("-", "+", "U")) for line in status.splitlines()):
            raise RuntimeError("Recursive submodules are missing or differ from the pin; run prepare.py --full")
        return subprocess.run(command, cwd=args.checkout).returncode
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Native build stopped: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
