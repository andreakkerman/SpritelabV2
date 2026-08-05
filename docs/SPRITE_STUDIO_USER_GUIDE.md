# Sprite Studio user guide

Sprite Studio is available at [`/studio/`](../studio/) while the existing Animator stays at the repository root. It is a local-first editor: PNGs remain in IndexedDB in this browser and project metadata is autosaved locally.

## Master image to reusable layers

1. Choose **Import master PNG** and select the supplied character image from Files or Photos. Use **Fit**, the mouse wheel, two-finger pinch, or the Pan tool to navigate.
2. In Artwork choose **Select**, drag a rectangle around one part, choose its role, and press **Extract cutout**. For a polygon, tap vertices with **Polygon**, close it, then extract.
3. Repeat for `upper_body`, `pelvis_cover`, `left_leg`, and `right_leg`. Extraction applies the non-destructive alpha mask, crops visible alpha with six pixels of safety padding, and preserves the crop's document position. Extracting an occupied role asks before replacing it.
4. Select layers in the canvas or Layers menu. Tap the selected Layers row again to deselect it. Move them with **Move**, place a normalized pivot with **Pivot**, or edit numeric position, pivot, rotation, and z-order. Lock finished layers. **Reset** restores extraction position.
5. For an opaque, flat edge background, try **Remove edge background** first; it flood-fills only corner-connected similar pixels into the non-destructive mask. Use Mask erase/restore to edit only the master alpha mask. Adjust the brush size in Properties. Undo treats a pointer stroke as one action. Toggle the master or select recomposition preview; move the Leg test slider from −20° through +20° to inspect seams.

## Frames and local correction

1. Switch to **Frame mode**. **Duplicate** makes a deep, independent frame snapshot; changes to its transforms and patch list do not modify the source frame.
2. Select and move a cutout or enter its frame-local X, Y, and rotation. Toggle previous/next onion skin and its opacity. Use play, previous, and next to review the loop.
3. Drag a rectangular selection around a correction area, choose **Copy region**, then **Paste in place**. The resulting transparent raster patch belongs only to the current frame and does not change the rig cutout.

## Saving, export, and Animator handoff

**Save project** explicitly stores metadata; autosave does the same after edits. Master, mask, cutouts, and patches are separate IndexedDB blobs and restore after reload in the same browser profile.

**Export ZIP** creates `assets/*.png`, fixed-size transparent `frames/frame_XX.png`, `data/project.json`, `data/rig.json`, `data/frames.json`, `reports/qa.json`, and `manifest.json`. Follow the **Animator ↗** link, open its Assets panel, and load the four PNG files from the ZIP. The Animator's legacy v1 JSON format remains unchanged; Studio v2 JSON is retained as the editable source rather than silently downgraded.

## Current scope

Patch copy/paste, numeric/pointer movement, and deletion are implemented; patch-specific alpha erasing is deferred. Frame deletion and creation are supported, while drag reorder and thumbnail raster caching are not. Project portability is through ZIP export; importing a complete Studio ZIP on another device is the next planned increment.

## Complete sprite frames and image merging

Cutouts are optional. In **Frames**, choose **Add frame** to set or replace the shared **Base image** for the animation. The base appears immediately in every frame without creating cutouts, while Move, Rotate, Scale, visibility, and Erase changes remain frame-local. Accepted Merge results and frame-local Fill corrections continue to save, reload, and export through the same fixed-canvas ZIP workflow as composed cutout frames.

Light-blue center and baseline guides are editing overlays and never appear in exported PNGs. Use **Frame actions → Show alignment guides** to toggle them.

Choose **Merge** to combine the current rendered frame (Image A) with exactly one PNG (Image B). Combined shows the result; Focus A and Focus B make the other image translucent without changing the explicit Editing selection. Move or uniformly Scale either image, Erase or Restore its non-destructive mask, and Swap order. Cancel discards the session. Merge stores one full-canvas transparent PNG as the frame result, so Fill and the existing export pipeline continue to work unchanged.
