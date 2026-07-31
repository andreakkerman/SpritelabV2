# Atlas source record

- Repository: https://github.com/andreakkerman/atlas
- Commit: `7be9f991aad0deda5b1b873c39bda3ba155ee01d`
- Original path: `assets/characters/sven/walk-right`
- Imported files: `frame-01.png` through `frame-24.png`
- Frame count: 24
- Dimensions and alpha format: 360 × 440 pixels, PNG RGBA with alpha transparency
- Runtime: 15 FPS, looping (1.6-second cycle)
- Source direction: right-facing
- Runtime mirroring: Atlas creates left-facing movement by horizontally mirroring these same right-facing frames; no left-facing source PNGs exist here.
- Import date: 2026-07-31

When installed, these files are treated as immutable source inputs. Run
`bash tools/setup_atlas_assets.sh` to retrieve byte-authentic copies at the pinned
commit. The downloaded PNGs are intentionally excluded from Git; tooling writes
derived files only beneath `outputs/`.
