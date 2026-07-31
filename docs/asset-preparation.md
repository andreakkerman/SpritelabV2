# Preparing Sven layer PNGs

Use the best complete Sven sprite as the visual authority. A parts sheet may explain structure but must not redesign the face, hair, head, torso, jacket, backpack, notebook, hands, proportions, or rendering style.

## Whole-leg prototype

Prepare four transparent PNGs: `upper_body.png`, `pelvis_cover.png`, `left_leg.png`, and `right_leg.png`. “Left” and “right” are anatomical—Sven’s own sides. Keep every source at native scale, remove backgrounds and shadows, and retain enough overlap beneath the pelvis cover to avoid gaps while rotating.

## Segmented mode

Prepare `upper_body.png`, `pelvis_cover.png`, `left_thigh.png`, `left_shin.png`, `left_foot.png`, `right_thigh.png`, `right_shin.png`, and `right_foot.png`. Include joint overlap at hips, knees, and ankles. Do not bake a rotation into a cropped canvas merely to make a pivot convenient.

Inspect each PNG against the checkerboard. SpriteLab reports dimensions and whether any alpha value is below 255. Opaque files can be loaded only after confirmation. The editor does not silently synthesize, extract, erase, or repair artwork.
