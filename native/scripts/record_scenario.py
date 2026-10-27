#!/usr/bin/env python3
"""Bound each UI scenario and finalize its recording even when Maestro stalls."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import signal
import subprocess
import threading
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scenario")
    parser.add_argument("--timeout", type=int, default=180)
    args = parser.parse_args()
    device = os.environ["DEVICE"]
    name = Path(args.scenario).stem
    output = Path("artifacts/native-demo") / name
    output.mkdir(parents=True, exist_ok=True)
    timing = {"record_requested_utc": datetime.now(timezone.utc).isoformat(), "scenario": args.scenario}
    with (output / "recording.log").open("w") as log:
        recorder = subprocess.Popen(["xcrun", "simctl", "io", device, "recordVideo", "--codec=h264", "--force", str(output / "recording.mp4")], stdout=log, stderr=subprocess.STDOUT)
        try:
            time.sleep(2)
            timing["maestro_requested_utc"] = datetime.now(timezone.utc).isoformat()
            with (output / "maestro.log").open("w") as ui_log:
                process = subprocess.Popen(["maestro", "--device", device, "test", "--test-output-dir", str(output / "maestro"), args.scenario], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, start_new_session=True)
                def forward_output():
                    for line in process.stdout:
                        ui_log.write(line)
                        ui_log.flush()
                        print(line, end="", flush=True)
                reader = threading.Thread(target=forward_output, daemon=True)
                reader.start()
                try:
                    result = process.wait(timeout=args.timeout)
                except subprocess.TimeoutExpired:
                    print(f"{name}: UI timeout after {args.timeout}s", flush=True)
                    os.killpg(process.pid, signal.SIGTERM)
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        os.killpg(process.pid, signal.SIGKILL)
                        process.wait()
                    result = 124
                # XCTest children can outlive a successful CLI and hold its ports.
                # Only this explicitly created process group belongs to the test.
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                reader.join(timeout=5)
                time.sleep(2)
        finally:
            timing["stop_requested_utc"] = datetime.now(timezone.utc).isoformat()
            recorder.send_signal(signal.SIGINT)
            try:
                recorder.wait(timeout=20)
            except subprocess.TimeoutExpired:
                recorder.kill()
                recorder.wait()
            try:
                subprocess.run(["xcrun", "simctl", "io", device, "screenshot", str(output / "last-screen.png")], timeout=20, check=False)
            except subprocess.TimeoutExpired:
                print("Last-screen capture timed out", flush=True)
            (output / "recording-timing.json").write_text(json.dumps(timing, indent=2) + "\n")
    print((output / "maestro.log").read_text(), flush=True)
    return result


if __name__ == "__main__":
    raise SystemExit(main())
