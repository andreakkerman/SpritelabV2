# SpriteLab V2 — Sven cut-out walk rig

SpriteLab V2 is a static, mobile-first Canvas editor for building one deterministic eight-frame Sven walk cycle from fixed transparent parts. The previous full-frame workflow exposed unavoidable visual drift between independently generated sprites. This version keeps Sven’s authoritative artwork fixed and varies only explicit leg transforms. **Image generation is not used to render final frames.**

## Use on iPhone or iPad

1. Open the GitHub Pages site at <https://andreakkerman.github.io/SpritelabV2/> in Safari.
2. Open **Assets** and load clean transparent PNGs from Files or Photos. Whole-leg mode expects `upper_body.png`, `pelvis_cover.png`, `left_leg.png`, and `right_leg.png`. Segmented mode expects the upper body and pelvis plus `left_thigh.png`, `left_shin.png`, `left_foot.png`, `right_thigh.png`, `right_shin.png`, and `right_foot.png`.
3. Use **Whole legs** to rotate each complete leg around its hip. Switch to **Segmented** when independent hip, knee, and ankle articulation is needed.
4. Select a part and drag the gold pivot to the anatomical joint. The pivot is stored in source-image pixels; bind and pose positions are output-canvas pixels.
5. Edit frames `00`–`07`. Only leg transforms animate. Upper body and pelvis cover remain locked and stable.
6. Enable onion skin to compare the previous, next, or both neighboring poses. Keep the stride modest and check the `07 → 00` closure.
7. Use **Move forward/backward** when a leg must pass behind or in front. Z-order is explicit per frame.
8. Work is automatically saved on this device using localStorage and IndexedDB where Safari permits it. Use **Download project JSON** for a portable text backup.
9. Open **Export** and choose **Export complete ZIP**. On iOS, use the Share sheet or save the ZIP to Files. Individual PNG/JSON downloads are available as a fallback.
10. In GitHub’s web interface, manually upload the ZIP’s eight files from `frames/` into the Atlas animation asset folder. SpriteLab never writes to GitHub.

## Atlas integration

Copy the exported files to `assets/characters/sven/walk-right`, retain their `sven-walk-right-00.png` through `sven-walk-right-07.png` names, and use the generated manifest/snippet. The source art faces right; mirror it horizontally at runtime for left movement. See [docs/atlas-integration.md](docs/atlas-integration.md).

## Local development

The deployed application has no npm runtime or build step:

```bash
python3 -m http.server 4173
```

Node is used only for QA:

```bash
npm ci
npm run check
npm test
```

No Sven PNG is required to deploy the generic editor. Binary layers are supplied locally by the user and never enter the pull-request diff.

## Limitations

- Asset cut-outs must be prepared outside SpriteLab; there is no automatic extraction or image-generation fallback.
- No inverse kinematics, meshes, deformation, body bob, or arm animation.
- IndexedDB durability is controlled by Safari and device storage pressure; export a ZIP regularly.
- Imported JSON deliberately contains no image data. Restore assets from the ZIP’s `assets/` directory.
- Individual multi-file downloads may require repeated Safari confirmation; ZIP export is preferred.

Further guides: [architecture](docs/architecture.md), [asset preparation](docs/asset-preparation.md), and [mobile workflow](docs/mobile-workflow.md).
