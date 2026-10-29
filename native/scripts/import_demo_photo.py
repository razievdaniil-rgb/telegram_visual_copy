#!/usr/bin/env python3
"""Import one synthetic photo into the dedicated QA Simulator, with bounded logs."""
import os
from pathlib import Path
import signal
import subprocess


def main():
    device = os.environ["DEVICE"]
    output = Path("artifacts/native-demo/photo-import")
    output.mkdir(parents=True, exist_ok=True)
    # A failed import must not silently turn the avatar scenario into a seed-only test.
    with (output / "import.log").open("w") as log:
        process = subprocess.Popen(
            ["xcrun", "simctl", "addmedia", device,
             str(Path("native/fixtures/upload-avatar.png").resolve())],
            stdout=log, stderr=subprocess.STDOUT, start_new_session=True,
        )
        try:
            result = process.wait(timeout=240)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            result = 124
    print((output / "import.log").read_text(), flush=True)
    if result:
        with (output / "photos.log").open("w") as log:
            subprocess.run(
                ["xcrun", "simctl", "spawn", device, "log", "show", "--last", "5m",
                 "--style", "compact", "--predicate",
                 'process == "photolibraryd" OR process == "assetsd"'],
                stdout=log, stderr=subprocess.STDOUT, timeout=40, check=False,
            )
    return result


if __name__ == "__main__":
    raise SystemExit(main())
