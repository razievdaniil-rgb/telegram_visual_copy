#!/usr/bin/env python3
"""Reproduce the native Telegram fork without vendoring gigabytes into the app repo."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

NATIVE = Path(__file__).resolve().parents[1]
ROOT = NATIVE.parent
UPSTREAM = json.loads((NATIVE / "upstream.json").read_text(encoding="utf-8"))
PATCH = NATIVE / "patches" / "0001-local-simulator.patch"
RULES_REVISION = "485016eb5b0948cc17307064e7977a6d68e94046"
RULES_PATCH = NATIVE / "vendor-patches" / "rules-apple-unsigned.patch"


def git(checkout, *arguments, check=True):
    return subprocess.run(["git", "-C", str(checkout), *arguments], check=check,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def sources():
    for source in sorted((NATIVE / "Sources" / "Core").glob("*.swift")):
        yield source, Path("submodules/TelegramCore/Sources/LocalSimulator") / source.name
    for source in sorted((NATIVE / "Sources" / "UI").glob("*.swift")):
        yield source, Path("submodules/TelegramUI/Sources/LocalSimulator") / source.name


def prepare_rules(checkout, check_only=False):
    rules = checkout / "build-system/bazel-rules/rules_apple"
    if not (rules / ".git").exists():
        return False
    revision = git(rules, "rev-parse", "HEAD").stdout.decode().strip()
    if revision != RULES_REVISION:
        raise RuntimeError("rules_apple differs from the pinned upstream submodule")
    applied = git(rules, "apply", "--reverse", "--check", str(RULES_PATCH), check=False).returncode == 0
    if not applied:
        if check_only:
            raise RuntimeError("The unsigned packaging patch is absent from rules_apple")
        git(rules, "apply", "--check", str(RULES_PATCH))
        git(rules, "apply", str(RULES_PATCH))
    return True


def prepare(checkout, check_only=False, full=False):
    checkout = checkout.resolve()
    if not checkout.exists():
        if check_only:
            raise RuntimeError("Checkout is absent; run prepare first")
        checkout.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "clone", "--filter=blob:none", "--no-checkout", UPSTREAM["repository"], str(checkout)], check=True)
        git(checkout, "config", "core.longpaths", "true")
        git(checkout, "checkout", "--detach", UPSTREAM["revision"])
    actual = git(checkout, "rev-parse", "HEAD").stdout.decode().strip()
    if actual != UPSTREAM["revision"]:
        raise RuntimeError(f"Refusing a different revision: {actual}; expected {UPSTREAM['revision']}")
    clean_patch = git(checkout, "apply", "--check", "--whitespace=nowarn", str(PATCH), check=False).returncode == 0
    applied_patch = git(checkout, "apply", "--reverse", "--check", "--whitespace=nowarn", str(PATCH), check=False).returncode == 0
    if not clean_patch and not applied_patch:
        raise RuntimeError("Upstream files differ from the pinned patch; refusing to overwrite changes")
    if check_only:
        if not applied_patch:
            raise RuntimeError("The simulator patch has not been applied")
        for source, relative in sources():
            destination = checkout / relative
            if not destination.exists() or destination.read_bytes() != source.read_bytes():
                raise RuntimeError(f"Overlay differs: {relative}")
    else:
        for source, relative in sources():
            destination = checkout / relative
            if destination.exists() and destination.read_bytes() != source.read_bytes():
                raise RuntimeError(f"Existing overlay differs: {relative}. Preserve it before preparing again.")
        if clean_patch:
            git(checkout, "apply", "--whitespace=nowarn", str(PATCH))
        for source, relative in sources():
            destination = checkout / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
        if full:
            sparse = git(checkout, "config", "--bool", "core.sparseCheckout", check=False).stdout.strip() == b"true"
            if sparse:
                git(checkout, "sparse-checkout", "disable")
            subprocess.run(["git", "-C", str(checkout), "submodule", "update", "--init", "--recursive", "--depth", "1", "--jobs", "4"], check=True)
    vendor_applied = prepare_rules(checkout, check_only=check_only)
    report = {
        "upstream": actual,
        "patch_sha256": hashlib.sha256(PATCH.read_bytes()).hexdigest(),
        "sources": {str(relative).replace("\\", "/"): hashlib.sha256(source.read_bytes()).hexdigest() for source, relative in sources()},
        "checked_out_at": str(checkout),
        "full_submodules_requested": full,
        "ios_build_verified": False,
        "unsigned_packaging_patch_applied": vendor_applied,
    }
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkout", type=Path, default=ROOT / "artifacts" / "native-telegram-ios")
    parser.add_argument("--check", action="store_true", help="Verify the already prepared checkout without writing")
    parser.add_argument("--full", action="store_true", help="Populate the full tree and recursive submodules for Xcode/Bazel")
    args = parser.parse_args()
    if args.check and args.full:
        parser.error("--check is read-only; do not combine it with --full")
    try:
        prepare(args.checkout, check_only=args.check, full=args.full)
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f"Native preparation failed: {error}", file=sys.stderr)
        if isinstance(error, subprocess.CalledProcessError) and error.stderr:
            print(error.stderr.decode(errors="replace"), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
