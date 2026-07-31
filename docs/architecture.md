# Architecture

SpriteLab is a static ES-module application. `src/model.js` owns the versioned rig schema and structural validation; `src/renderer.js` resolves deterministic parent-child matrices and draws to Canvas 2D; `src/storage.js` separates JSON preferences in localStorage from PNG blobs in IndexedDB; `src/app.js` connects the mobile UI, persistence, exports, and QA.

The same `renderFrame` function drives live preview and 360 × 440 PNG/ZIP output. It clears to transparent, resolves each layer’s parent transform, combines bind and frame-local values, translates to the joint, rotates, applies scale, and draws the unmodified PNG relative to its local pivot. CSS transforms are used only to zoom/pan the interactive viewport, never to generate files.

## Rig modes

- **Whole:** `upper_body`, `pelvis_cover`, `left_leg`, `right_leg`.
- **Segmented:** upper body and pelvis plus left/right thigh, shin, and foot chains.

Both use the same layer records, frame overrides, z-order, validator, renderer, and exporter. Switching mode changes the active layer set rather than rebuilding the editor.

## Data and security

Rig JSON contains stable asset IDs and filenames, never Blob URLs, base64, or binary data. Object URLs exist only for the current browser session. The complete ZIP is the portable backup because it contains both the JSON source of truth and imported PNG blobs. There are no network writes, accounts, tokens, or backend services.
