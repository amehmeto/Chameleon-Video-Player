# Chameleon Video Player - Tech Debt Tracker

## What It Does

A transparent video overlay player built with Electron. It allows you to watch videos (local files or streaming services) in a transparent fullscreen overlay while working in other apps. Key features:

- Transparent fullscreen video playback with adjustable opacity
- Local file support (mkv, avi, mp4)
- 25+ streaming service shortcuts (Netflix, YouTube, etc.)
- Menubar tray controls
- Keyboard shortcuts (Shift+Cmd+P for play/pause, etc.)

---

## ✅ Completed

| Item                                         | PR  | Date    |
| -------------------------------------------- | --- | ------- |
| ESLint + Prettier + Husky                    | #1  | 2026-02 |
| Electron v8 → v34 (Castlabs)                 | #2  | 2026-02 |
| Security: contextIsolation, sandbox, preload | #2  | 2026-02 |
| Remove Flash dead code                       | #2  | 2026-02 |
| Fix Widevine/DRM (Castlabs ECS)              | #2  | 2026-02 |
| Remove robotjs dependency                    | #2  | 2026-02 |
| electron-builder v25 → v26                   | -   | 2026-02 |
| menubar v8 → v9                              | #2  | 2026-02 |
| crypto-js v3 → v4                            | #2  | 2026-02 |

---

## 🔴 Remaining Tech Debt

### P1 - High Priority

| Issue                              | Notes                                       |
| ---------------------------------- | ------------------------------------------- |
| Missing `enterlicense` IPC handler | Preload whitelists it but no handler exists |
| Node.js 18 → 20+                   | Many deps now require Node 20+              |

### P2 - Code Quality

| Issue                      | Notes                                                  |
| -------------------------- | ------------------------------------------------------ |
| Split main.js (~800 lines) | Into: ipc-handlers.js, window-manager.js, shortcuts.js |
| Remove dead code           | 50+ lines of commented-out code                        |
| Add tests                  | Zero test coverage                                     |
| Clean up licensing         | Client-side validation easily bypassable               |
| Steam integration          | Code exists but non-functional                         |

### P3 - Features

| Issue     | Notes                               |
| --------- | ----------------------------------- |
| GitHub #7 | Drag-and-drop / "Open With" support |

---

## Architecture

| File          | Lines | Purpose                                       |
| ------------- | ----- | --------------------------------------------- |
| main.js       | ~800  | Main process, IPC handlers, window management |
| preload.js    | ~130  | contextBridge API for secure IPC              |
| controller.js | ~210  | UI controller for menu interactions           |
| renderer.js   | ~170  | Video rendering and media controls            |
| index.html    | 163   | Main video playback window                    |
| menu.html     | 202   | Menubar interface                             |
| mode.html     | 295   | Source selection screen                       |
| prompt.html   | 343   | Donation/validation screen                    |

---

## Notes

- For production Widevine builds, EVS signing required: `pip install castlabs-evs`
- afterSign hook removed from build config (no widevine-build.js)
