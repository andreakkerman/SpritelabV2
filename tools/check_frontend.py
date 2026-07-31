#!/usr/bin/env python3
"""Dependency-free static integrity checks for the deployed SpriteLab bundle."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
html=(root/"index.html").read_text()
for asset in re.findall(r'(?:src|href)="([^"?#]+)',html):
    if asset.startswith(("http:","https:")):
        continue
    if not (root/asset).exists():
        raise SystemExit(f"Missing referenced asset: {asset}")
frames=sorted((root/"inputs/sven/walk/atlas-original").glob("frame-*.png"))
assert len(frames)==24, f"Expected 24 source frames, got {len(frames)}"
assert "inputs/sven/walk/atlas-original" in (root/"app.js").read_text()
assert not list((root/"inputs/sven/walk").glob("*left*")), "Separate left-facing artwork is forbidden"
print("Frontend integrity OK: static bundle, 24 source frames, no left-facing derivatives")
