# Atlas integration

SpriteLab does not modify Atlas. Integration is a manual review and upload step.

1. Export `sven-walk-right.zip` on the phone and save it to Files.
2. Inspect `qa-report.json`; do not integrate while `valid` is false.
3. In the GitHub web interface, browse to the target Atlas branch and `assets/characters/sven/walk-right`.
4. Upload exactly these right-facing frame files from the ZIP’s `frames/` directory: `sven-walk-right-00.png` through `sven-walk-right-07.png`.
5. Use `manifest.json` for frame count, FPS, looping, direction, canvas, and naming.
6. Copy the app’s Atlas snippet into the relevant runtime configuration after code review.
7. Render left-facing motion by horizontally mirroring the right-facing output at runtime. Do not create separate left-facing PNGs.

The ZIP also contains `rig/sven-walk-right.json` and all imported PNGs under `assets/`; retain it as the editable source backup.
