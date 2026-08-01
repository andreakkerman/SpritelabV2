#!/usr/bin/env python3
"""Dependency-free integrity checks for the text-only static rig editor."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
required = [
    "index.html", "favicon.svg", "styles.css", "src/app.js", "src/model.js", "src/renderer.js",
    "src/storage.js", "studio/index.html", "studio/app.js", "studio/model.js", "studio/storage.js", "studio/studio.css", "vendor/jszip.min.js", "docs/architecture.md",
    "docs/asset-preparation.md", "docs/mobile-workflow.md", "docs/atlas-integration.md"
]
for relative in required:
    if not (root / relative).is_file():
        raise SystemExit(f"Missing required static editor file: {relative}")

for html_path in (root / "index.html", root / "studio/index.html"):
    html = html_path.read_text()
    for asset in re.findall(r'(?:src|href)="([^"?#]+)', html):
        if asset.startswith(("http:", "https:")):
            continue
        target = (html_path.parent / asset).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            raise SystemExit(f"Referenced asset escapes repository: {html_path}: {asset}")
        if not target.exists():
            raise SystemExit(f"Missing referenced asset: {html_path}: {asset}")

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
