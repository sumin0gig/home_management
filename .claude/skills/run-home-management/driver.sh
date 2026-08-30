#!/usr/bin/env bash
# Driver for building, installing, launching, and screenshotting the
# HomeManagement React Native (Android) app on a local emulator/device.
# Run via Git Bash (the same shell Claude Code's Bash tool uses on Windows).
#
# Usage:
#   ./driver.sh all                 # full flow: boot -> build -> metro -> launch -> screenshot -> logs
#   ./driver.sh boot                # start/wait for the AVD
#   ./driver.sh build                # gradlew installDebug
#   ./driver.sh metro                # start Metro bundler if not already running
#   ./driver.sh launch               # adb reverse + am start
#   ./driver.sh screenshot [path]    # adb screencap -> png (default: ./screenshot.png next to this script)
#   ./driver.sh logs                 # grep logcat for crash signatures
#
# Paths are resolved relative to the repo root (two levels up from this
# script: <repo>/.claude/skills/run-home-management/driver.sh).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
AVD_NAME="${AVD_NAME:-Pixel_9_Pro}"
PACKAGE="com.homemanagement"
ACTIVITY=".MainActivity"
METRO_LOG="${TMPDIR:-/tmp}/home_management_metro.log"

boot_emulator() {
  if adb devices | grep -q "device$"; then
    echo "device already connected"
    return
  fi
  echo "booting AVD $AVD_NAME..."
  nohup emulator -avd "$AVD_NAME" -no-snapshot-load >/dev/null 2>&1 &
  disown
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 2
  done
  echo "boot complete"
}

build_install() {
  cd "$ROOT/android"
  # Do NOT run `./gradlew.bat clean` on its own here - see Gotchas in SKILL.md.
  ./gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
}

start_metro() {
  if curl -s http://localhost:8081/status 2>/dev/null | grep -q "packager-status:running"; then
    echo "metro already running"
    return
  fi
  cd "$ROOT"
  nohup npx react-native start > "$METRO_LOG" 2>&1 &
  disown
  for _ in $(seq 1 30); do
    curl -s http://localhost:8081/status 2>/dev/null | grep -q "packager-status:running" && break
    sleep 1
  done
}

launch() {
  adb reverse tcp:8081 tcp:8081
  adb shell am start -n "$PACKAGE/$ACTIVITY"
}

screenshot() {
  local out="${1:-$SCRIPT_DIR/screenshot.png}"
  # `adb shell screencap -p /sdcard/x.png && adb pull ...` errors out with a
  # usage message on this setup - use exec-out instead (see Gotchas).
  adb exec-out screencap -p > "$out"
  echo "saved $out"
}

check_crash() {
  adb logcat -d -t 500 | grep -iE "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(error|Error)" || echo "no crash signatures found"
}

cmd="${1:-all}"
case "$cmd" in
  boot) boot_emulator ;;
  build) build_install ;;
  metro) start_metro ;;
  launch) launch ;;
  screenshot) screenshot "${2:-}" ;;
  logs) check_crash ;;
  all)
    boot_emulator
    build_install
    start_metro
    launch
    # First bundle load is slow (~12MB unminified dev bundle) - give it
    # real time before checking. See Gotchas.
    sleep 25
    screenshot
    check_crash
    ;;
  *)
    echo "usage: driver.sh {boot|build|metro|launch|screenshot [path]|logs|all}" >&2
    exit 1
    ;;
esac
