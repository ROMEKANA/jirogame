# Project Guidelines

## Build And Run
- Install dependencies with `npm install`.
- This project is browser-first and uses native ES modules.
- Run by serving the workspace over HTTP and opening `index.html` (avoid `file://` because module imports may fail).
- No automated test command is configured; validate changes by manual browser testing and Firebase Realtime Database behavior.

## Architecture
- `main.js`: Application entry point and orchestration. Wires UI events to game/Firebase operations and subscribes to watchers.
- `ui.js`: DOM rendering and UI event registration. Contains role metadata and text conversion helpers.
- `game.js`: Core game logic (role assignment, winner checks, phase transition logic).
- `firebase.js`: Realtime Database access layer. Keep all DB path operations centralized here.
- `firebaseset.js`: Firebase app/database initialization.

## Conventions
- Keep user-facing text in Japanese to match the existing UI.
- Keep ES module style (`import`/`export`) and browser-compatible JavaScript.
- Follow existing naming and data shape under `/players` and `/game` in Realtime Database.
- Prefer extending existing `watch*` and `get*` patterns in `firebase.js` instead of adding direct DB calls in other files.

## Agent Gotchas
- `firebase.js` currently mixes `set` and `update`; `set(ref(db, 'game/date'), { date: inputdate })` changes the value shape from scalar to object. Preserve compatibility when editing watchers/getters.
- `game.isGameStarted()` is asynchronous internally and does not return a reliable boolean synchronously. Avoid writing new logic that assumes immediate return values.
- Firebase SDK is imported from CDN (`https://www.gstatic.com/firebasejs/10.8.0/...`) in code while `package.json` declares `firebase`. Keep this mismatch in mind before dependency or import refactors.
- `firebaseset.js` contains project credentials. Do not duplicate or log secrets in new code; prefer safer configuration patterns when refactoring.

## Key Files
- `README.md`: High-level project purpose.
- `app.txt`: Legacy notes/older implementation reference.
