# Sven walk analysis

Generated deterministically from the 24 immutable Atlas PNGs.

## Source

- Canvas: **360 × 440 RGBA**
- Playback: **15 FPS**, looping; **1.6 seconds**
- Alpha: present in all frames

## Measured findings

- Visual-center X range: **166.99–179.44px**.
- Visual-center Y range: **249.09–262.11px**.
- Lowest visible pixel/baseline range: **417–422px**.
- Silhouette area range: **28,452–32,755 pixels**.
- Loop 24→1: center Δ **(+1.80, -0.42)px**, baseline Δ **+1px**, similarity **0.857**.
- Suspicious transitions: **3→4, 4→5, 11→12, 13→14, 21→22, 22→23**.
- Near duplicates: **10→11**.
- Likely contacts (lowest visible extent and local stability): **1, 7, 13, 20**.

## Proposals

- 12 frames: **1, 3, 4, 5, 6, 11, 12, 13, 14, 17, 20, 22**
- 8 frames: **1, 3, 4, 6, 11, 13, 17, 20**

Selections use temporal separation plus contact, silhouette, visual-center and baseline extrema; they are not simple interval decimation. Fewer frames are comparison hypotheses, not presumed improvements.
