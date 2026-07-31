#!/usr/bin/env python3
"""Deterministic QA and derived-asset pipeline for Atlas' Sven walk cycle."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "inputs/sven/walk/atlas-original"
OUT = ROOT / "outputs"
FPS = 15
EXPECTED = [f"frame-{n:02}.png" for n in range(1, 25)]


def load_frames() -> list[Image.Image]:
    found = sorted(p.name for p in SOURCE.glob("frame-*.png"))
    if found != EXPECTED:
        raise SystemExit(f"Expected exactly {EXPECTED}; found {found}")
    frames = [Image.open(SOURCE / name).convert("RGBA") for name in EXPECTED]
    if any(im.size != (360, 440) for im in frames):
        raise SystemExit("Every source frame must be 360x440")
    if any(Image.open(SOURCE / name).mode != "RGBA" for name in EXPECTED):
        raise SystemExit("Every source frame must be RGBA")
    return frames


def metric(im: Image.Image, number: int) -> dict:
    a = np.asarray(im, dtype=np.uint8)
    alpha = a[:, :, 3]
    mask = alpha > 0
    ys, xs = np.nonzero(mask)
    weights = alpha[ys, xs].astype(np.float64)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    return {
        "frame": number, "filename": EXPECTED[number - 1], "width": im.width, "height": im.height,
        "mode": "RGBA", "alpha": True, "alphaBounds": {"x": x0, "y": y0, "width": x1-x0+1, "height": y1-y0+1},
        "lowestVisiblePixel": y1, "baseline": y1,
        "visualCenter": {"x": round(float(np.average(xs, weights=weights)), 3), "y": round(float(np.average(ys, weights=weights)), 3)},
        "silhouetteArea": int(mask.sum()), "alphaMass": int(alpha.sum()),
        "sha256": hashlib.sha256((SOURCE / EXPECTED[number - 1]).read_bytes()).hexdigest(),
    }


def transition(a: Image.Image, b: Image.Image, am: dict, bm: dict, first: int, second: int) -> dict:
    aa, bb = np.asarray(a, dtype=np.int16), np.asarray(b, dtype=np.int16)
    ma, mb = aa[:, :, 3] > 0, bb[:, :, 3] > 0
    union, inter = np.logical_or(ma, mb).sum(), np.logical_and(ma, mb).sum()
    difference = float(np.abs(aa - bb).mean() / 255)
    similarity = float(inter / union) if union else 1.0
    return {
        "from": first, "to": second,
        "horizontalCenterMovement": round(bm["visualCenter"]["x"] - am["visualCenter"]["x"], 3),
        "verticalCenterMovement": round(bm["visualCenter"]["y"] - am["visualCenter"]["y"], 3),
        "baselineMovement": bm["baseline"] - am["baseline"],
        "silhouetteAreaChange": bm["silhouetteArea"] - am["silhouetteArea"],
        "silhouetteAreaChangePercent": round(100 * (bm["silhouetteArea"] / am["silhouetteArea"] - 1), 3),
        "frameSimilarity": round(similarity, 5), "pixelDifference": round(difference, 5),
    }


def proposals(metrics: list[dict], transitions: list[dict]) -> tuple[list[int], list[int]]:
    # Greedy farthest-point sampling combines temporal coverage and pose metrics. Contact/extrema seeds
    # protect biomechanically useful poses; the remaining slots maximize normalized feature distance.
    features = np.array([[m["visualCenter"]["x"], m["visualCenter"]["y"], m["baseline"],
                          m["silhouetteArea"], m["alphaBounds"]["width"], m["alphaBounds"]["height"]]
                         for m in metrics], dtype=float)
    features = (features - features.mean(0)) / np.maximum(features.std(0), 1e-9)
    contacts = sorted(range(24), key=lambda i: (-metrics[i]["baseline"], i))[:4]
    extrema = {int(np.argmin(features[:, c])) for c in range(features.shape[1])} | {int(np.argmax(features[:, c])) for c in range(features.shape[1])}
    seeds = sorted(set(contacts) | extrema)

    def choose(count: int) -> list[int]:
        selected = []
        for i in seeds:
            if len(selected) < count and all(abs(i-j) > 1 for j in selected): selected.append(i)
        while len(selected) < count:
            best = max((i for i in range(24) if i not in selected), key=lambda i: (
                min(np.linalg.norm(features[i]-features[j]) + 0.18*min((i-j)%24,(j-i)%24) for j in selected), -i))
            selected.append(best)
        return sorted(i+1 for i in selected)
    return choose(12), choose(8)


def checker(size: tuple[int, int], tile=12) -> Image.Image:
    yy, xx = np.indices((size[1], size[0])); grid = ((xx//tile + yy//tile) % 2) * 24 + 218
    return Image.fromarray(np.dstack([grid, grid, grid]).astype(np.uint8)).convert("RGBA")


def animation(frames: list[Image.Image], indexes: list[int], path: Path) -> None:
    rendered=[]
    for i in indexes:
        bg=checker((180,220),10); sprite=frames[i-1].resize((180,220), Image.Resampling.NEAREST); bg.alpha_composite(sprite); rendered.append(bg.convert("P", palette=Image.Palette.ADAPTIVE, colors=128))
    rendered[0].save(path, save_all=True, append_images=rendered[1:], duration=round(1000/FPS), loop=0, optimize=True, disposal=2)


def outputs(frames: list[Image.Image], analysis: dict) -> None:
    (OUT/"analysis").mkdir(parents=True, exist_ok=True); (OUT/"previews").mkdir(parents=True, exist_ok=True)
    (OUT/"analysis/sven-walk-analysis.json").write_text(json.dumps(analysis, indent=2)+"\n")
    m, t = analysis["frames"], analysis["transitions"]
    suspicious=[x for x in t if x["suspicious"]]
    suspicious_text = ", ".join(f"{x['from']}→{x['to']}" for x in suspicious) or "none"
    duplicates_text = ", ".join(f"{x['from']}→{x['to']}" for x in analysis["nearDuplicates"]) or "none"
    report=f"""# Sven walk analysis

Generated deterministically from the 24 immutable Atlas PNGs.

## Source

- Canvas: **360 × 440 RGBA**
- Playback: **15 FPS**, looping; **1.6 seconds**
- Alpha: present in all frames

## Measured findings

- Visual-center X range: **{min(x['visualCenter']['x'] for x in m):.2f}–{max(x['visualCenter']['x'] for x in m):.2f}px**.
- Visual-center Y range: **{min(x['visualCenter']['y'] for x in m):.2f}–{max(x['visualCenter']['y'] for x in m):.2f}px**.
- Lowest visible pixel/baseline range: **{min(x['baseline'] for x in m)}–{max(x['baseline'] for x in m)}px**.
- Silhouette area range: **{min(x['silhouetteArea'] for x in m):,}–{max(x['silhouetteArea'] for x in m):,} pixels**.
- Loop 24→1: center Δ **({t[-1]['horizontalCenterMovement']:+.2f}, {t[-1]['verticalCenterMovement']:+.2f})px**, baseline Δ **{t[-1]['baselineMovement']:+d}px**, similarity **{t[-1]['frameSimilarity']:.3f}**.
- Suspicious transitions: **{suspicious_text}**.
- Near duplicates: **{duplicates_text}**.
- Likely contacts (lowest visible extent and local stability): **{', '.join(map(str, analysis['likelyContactFrames']))}**.

## Proposals

- 12 frames: **{', '.join(map(str, analysis['proposals']['12']))}**
- 8 frames: **{', '.join(map(str, analysis['proposals']['8']))}**

Selections use temporal separation plus contact, silhouette, visual-center and baseline extrema; they are not simple interval decimation. Fewer frames are comparison hypotheses, not presumed improvements.
"""
    (OUT/"analysis/sven-walk-analysis.md").write_text(report)
    sheet=checker((6*180,4*230),10); draw=ImageDraw.Draw(sheet)
    for i,im in enumerate(frames):
        x=(i%6)*180; y=(i//6)*230; sheet.alpha_composite(im.resize((180,220),Image.Resampling.NEAREST),(x,y)); draw.text((x+7,y+5),f"{i+1:02}",fill=(18,23,28,255),stroke_width=2,stroke_fill=(255,255,255,220))
    sheet.convert("RGB").save(OUT/"analysis/sven-walk-contact-sheet.webp",quality=82,method=6)
    animation(frames,list(range(1,25)),OUT/"previews/sven-walk-24.gif")
    animation(frames,analysis["proposals"]["12"],OUT/"previews/sven-walk-12.gif")
    animation(frames,analysis["proposals"]["8"],OUT/"previews/sven-walk-8.gif")


def main() -> None:
    parser=argparse.ArgumentParser(); parser.add_argument("--check",action="store_true"); args=parser.parse_args()
    frames=load_frames(); metrics=[metric(im,i+1) for i,im in enumerate(frames)]
    trans=[transition(frames[i],frames[(i+1)%24],metrics[i],metrics[(i+1)%24],i+1,(i+1)%24+1) for i in range(24)]
    dx=np.array([abs(x["horizontalCenterMovement"]) for x in trans]); dy=np.array([abs(x["verticalCenterMovement"]) for x in trans]); da=np.array([abs(x["silhouetteAreaChangePercent"]) for x in trans])
    for i,x in enumerate(trans): x["suspicious"] = bool(dx[i] > dx.mean()+1.5*dx.std() or dy[i] > dy.mean()+1.5*dy.std() or da[i] > da.mean()+1.5*da.std())
    p12,p8=proposals(metrics,trans)
    contacts=sorted(range(24),key=lambda i:(-metrics[i]["baseline"],abs(trans[i-1]["baselineMovement"]),i))[:4]
    analysis={"schemaVersion":1,"source":{"repository":"https://github.com/andreakkerman/atlas","commit":"7be9f991aad0deda5b1b873c39bda3ba155ee01d","path":"assets/characters/sven/walk-right","frameCount":24,"fps":15,"loop":True,"cycleDurationSeconds":1.6,"sourceDirection":"right","runtimeMirroring":True},"frames":metrics,"transitions":trans,"nearDuplicates":[x for x in trans if x["frameSimilarity"]>=0.9],"likelyContactFrames":sorted(i+1 for i in contacts),"proposals":{"12":p12,"8":p8}}
    if not args.check: outputs(frames,analysis)
    print(f"Validated 24 RGBA frames; proposals: 12={p12}, 8={p8}")

if __name__ == "__main__": main()
