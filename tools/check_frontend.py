#!/usr/bin/env python3
"""Dependency-free integrity checks for the text-only static rig editor."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
required = [
    "index.html", "styles.css", "src/app.js", "src/model.js", "src/renderer.js",
    "src/storage.js", "vendor/jszip.min.js", "docs/architecture.md",
    "docs/asset-preparation.md", "docs/mobile-workflow.md", "docs/atlas-integration.md"
]
for relative in required:
    if not (root / relative).is_file():
        raise SystemExit(f"Missing required static editor file: {relative}")

html = (root / "index.html").read_text()
for asset in re.findall(r'(?:src|href)="([^"?#]+)', html):
    if asset.startswith(("http:", "https:")):
        continue
    if asset.startswith("/"):
        raise SystemExit(f"Root-relative asset breaks the /SpriteLabV2/ Pages base path: {asset}")
    if not (root / asset).exists():
        raise SystemExit(f"Missing referenced asset: {asset}")

model = (root / "src/model.js").read_text()
renderer = (root / "src/renderer.js").read_text()
assert "Array.from({ length: 8 }" in model
assert "width: 360" in model and "height: 440" in model
assert '"upper_body"' in model and '"pelvis_cover"' in model
assert "ctx.clearRect(0,0,360,440)" in renderer
assert "canvas.toBlob" in renderer

tracked_binary_candidates = [path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in {".png", ".gif", ".webp"} and ".git" not in path.parts and "node_modules" not in path.parts and "test-results" not in path.parts]
if tracked_binary_candidates:
    raise SystemExit("Repository contains binary candidates: " + ", ".join(str(path.relative_to(root)) for path in tracked_binary_candidates))
print("Frontend integrity OK: text-only static rig editor, eight-frame model, deterministic Canvas renderer")
