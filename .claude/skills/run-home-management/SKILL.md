---
name: run-home-management
description: Build, install, launch, and screenshot the HomeManagement React Native (Android) app on a local emulator. Use when asked to run, rebuild, start, test-launch, or screenshot the app, or to confirm a change works on the emulator.
---

HomeManagement is a React Native 0.79 app (Android; AWS Amplify Gen 2
backend under `amplify/`). It is driven end-to-end by
`.claude/skills/run-home-management/driver.sh`, a Git Bash script that
wraps `gradlew.bat`, Metro, and `adb`. Paths below are relative to the
repo root unless noted.

This was verified on Windows 11, Git Bash (the shell Claude Code's Bash
tool uses), Node 24, JDK 17 (Microsoft build), Gradle 8.13, an Android
Studio "Pixel_9_Pro" AVD.

## Prerequisites

- Android SDK with an AVD already created (this was tested against an
  AVD named `Pixel_9_Pro`; override with `AVD_NAME=<name>` if yours is
  named differently).
- `adb` and `emulator` on `PATH` (they were resolved from
  `%LOCALAPPDATA%\Android\Sdk\platform-tools` and `...\Sdk\emulator`).
- Node/npm deps already installed (`npm install`).

## Run (agent path)

```bash
cd .claude/skills/run-home-management
./driver.sh all
```

This boots the AVD if nothing is connected, builds+installs the debug
APK, starts Metro if it isn't already running, launches the app, waits
for the first bundle load, saves a screenshot to
`.claude/skills/run-home-management/screenshot.png`, and greps logcat
for crash signatures.

Individual steps (each verified standalone this session):

```bash
./driver.sh boot                 # start/wait for the AVD to finish booting
./driver.sh build                # cd android && ./gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
./driver.sh metro                # start `npx react-native start` in the background if not already up
./driver.sh launch               # adb reverse tcp:8081 tcp:8081 && adb shell am start -n com.homemanagement/.MainActivity
./driver.sh screenshot [path]    # adb exec-out screencap -p > path (default: screenshot.png next to this script)
./driver.sh logs                 # adb logcat -d -t 500 | grep -iE "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(error|Error)"
```

To confirm the app is actually in the foreground rather than just
launched:

```bash
adb shell dumpsys activity activities | grep -i "topResumedActivity\|mCurrentFocus"
# expect: .../com.homemanagement/.MainActivity ... u0 com.homemanagement/.MainActivity
```

## Run (human path)

`npm run android` / `npx react-native run-android` is the documented
path but **fails on this setup** - see Gotchas. Use `driver.sh build`
instead, then open the app icon on the emulator or run `driver.sh
launch`.

## Test

```bash
npm test          # Jest, __tests__/
npm run lint       # ESLint
npx tsc --noEmit   # type-check
```
(Standard project commands - not re-verified in this session beyond
what CLAUDE.md already documents.)

## Gotchas

- **`npx react-native run-android` fails on Windows here** with
  `'gradlew.bat' is not recognized as an internal or external command`
  - both via Git Bash and via PowerShell. The RN CLI's spawn of
  `gradlew.bat` doesn't resolve on this machine even though the file
  exists and running it directly (`cd android && ./gradlew.bat ...`)
  works fine. Always invoke `gradlew.bat` directly (that's what
  `driver.sh build` does) rather than going through the CLI's
  `run-android`.
- **Bare `gradlew.bat clean` fails** with CMake errors like
  `add_subdirectory given source ".../codegen/jni/" which is not an
  existing directory`. `clean` removes the autolinking codegen output
  while an already-configured CMake build still references it. Don't
  run `clean` standalone; `app:installDebug` on its own (no prior
  clean) works and regenerates codegen as needed via its task graph.
  A truly clean build wasn't verified this session - if you need one,
  expect to also clear `android/app/build` and `android/app/.cxx`.
- **`adb shell screencap -p /sdcard/x.png` errors out** with a
  `usage: screencap [-ahp]...` message on this setup (likely a
  multi-display quirk in the AVD). Use
  `adb exec-out screencap -p > local/path.png` instead - that's what
  `driver.sh screenshot` does.
- **First app launch shows "Loading from 10.0.2.2:8081..." for a
  while** (20-30s) - this is Metro compiling the ~12MB unminified dev
  bundle for the first time, not a hang. If a screenshot still shows
  the loading bar, wait longer rather than assuming failure;
  `curl http://localhost:8081/index.bundle?platform=android&dev=true&minify=false`
  can be used to force/warm the compile and check it succeeds
  (HTTP 200) independent of the app UI.
- **The emulator reaches the host's Metro via `10.0.2.2:8081`**
  automatically (visible in the "Loading from..." banner) - `adb
  reverse tcp:8081 tcp:8081` isn't strictly required for the emulator
  but is cheap insurance and needed for a real USB-attached device.
- **App reopens straight past login** - Amplify auth session persists
  across installs (AsyncStorage/keychain-backed), so `am start` after
  a fresh install lands on the post-login "가족 만들기 / 초대 코드로
  참여하기" (create/join family) screen, not a login screen. That's
  expected, not a bug.
- Package/activity: `com.homemanagement/.MainActivity` (from
  `android/app/build.gradle`'s `applicationId`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `'gradlew.bat' is not recognized...` from `run-android` | Use `driver.sh build` (calls `gradlew.bat` directly from `android/`) instead of `npx react-native run-android`. |
| `gradlew.bat clean` fails with CMake `add_subdirectory` errors | Don't run `clean` alone; just run `app:installDebug`. |
| `adb shell screencap ...` prints a `usage:` message and exits 1 | Use `adb exec-out screencap -p > file.png`. |
| App stuck on "Loading from 10.0.2.2:8081..." | Wait longer (first bundle compile is slow) or check `curl http://localhost:8081/status` returns `packager-status:running`. |
| `adb devices` shows nothing after starting the emulator | Boot takes a while; poll with `adb wait-for-device` then `adb shell getprop sys.boot_completed` until it prints `1` (this is what `driver.sh boot` does). |
