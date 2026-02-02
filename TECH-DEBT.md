# Chameleon Video Player - Codebase Analysis

## What It Does

A transparent video overlay player built with Electron. It allows you to watch videos (local files or streaming services) in a transparent fullscreen overlay while working in other apps. Key features:
- Transparent fullscreen video playback with adjustable opacity
- Local file support (mkv, avi, mp4)
- 25+ streaming service shortcuts (Netflix, YouTube, etc.)
- Menubar tray controls
- Keyboard shortcuts (Shift+Cmd+P for play/pause, etc.)

---

## Architecture (2,453 lines of code)

| File          | Lines | Purpose                                       |
|---------------|-------|-----------------------------------------------|
| main.js       | 818   | Main process, IPC handlers, window management |
| controller.js | 338   | UI controller for menu interactions           |
| renderer.js   | 234   | Video rendering and media controls            |
| index.html    | 163   | Main video playback window                    |
| menu.html     | 202   | Menubar interface                             |
| mode.html     | 295   | Source selection screen                       |
| prompt.html   | 343   | Donation/validation screen                    |

---

## Open GitHub Issues

Only 1 open issue:
- #7 - "Local Files: Open With Dialog and default Application" (enhancement)
  - Request to support drag-and-drop and "Open With" functionality
  - Author willing to accept PRs or implement if there's interest

---

## Critical Maintenance Priorities

### 🔴 P0 - Security Critical

1. Electron v8.1.1 is 5+ years old - No security patches since 2020
2. `nodeIntegration: true` in all windows - Major security vulnerability
3. No context isolation or sandbox - Renderers have full Node.js access
4. Weak client-side license validation - Easily bypassable

### 🟠 P1 - High Priority

| Issue            | Current      | Should Be |
|------------------|--------------|-----------|
| Electron         | v8.1.1-wvvmp | v27+      |
| electron-builder | v22          | v26       |
| menubar          | v8           | v9        |
| crypto-js        | v3.3         | v4.2      |

### 🟡 P2 - Code Quality

- main.js is monolithic (818 lines) - Should split into modules
- 50+ lines of commented-out code - Dead code to remove
- Global variable pollution - No state management
- No tests - Zero test coverage
- robotjs dependency - Already commented out, should remove

---

## Deprecated/Broken Features

- Flash player support - Flash is dead
- Widevine DRM - Returns 404 error, hardcoded outdated version
- Steam integration - Code exists but appears non-functional

---

## Recommended Modernization Roadmap

### Phase 1 - Security (urgent)

```javascript
// Replace this (insecure):
webPreferences: { nodeIntegration: true }

// With this (secure):
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  preload: path.join(__dirname, 'preload.js')
}
```

- Upgrade Electron to v27+
- Create preload scripts for IPC
- Enable sandbox and context isolation

### Phase 2 - Refactoring

- Split main.js into: `ipc-handlers.js`, `window-manager.js`, `player-controller.js`
- Add ESLint + Prettier
- Add basic test suite

### Phase 3 - Cleanup

- Remove Flash/Widevine dead code
- Remove robotjs dependency
- Fix or remove licensing system
- Implement issue #7 (drag-and-drop support)

---

## Summary

The app has solid bones but is severely outdated. The biggest concern is security - the Electron version and configuration make it vulnerable. If you plan to maintain this, prioritize the Electron upgrade and security hardening before adding new features.
