# Sprite Studio implementation

## Baseline and approach

The existing Animator remains at the repository root. It is a small static ES-module application whose Canvas renderer, native IndexedDB blob storage, JSZip bundle, and deterministic PNG export are safe patterns to reuse. Its version-1 rig model is intentionally left intact; Studio is an additive workspace at `studio/` with a version-2 model and an export adapter rather than an architectural migration.

The baseline integrity check passed on 1 August 2026. The four baseline Playwright tests could not launch because the configured `/usr/bin/google-chrome` is absent in the container; this is an environment limitation, not an application failure.

## Delivery plan

1. Add the responsive Studio shell and a single document-space viewport supporting HiDPI, fit, pan, wheel and pinch zoom.
2. Add immutable PNG master import, IndexedDB blob persistence, mask editing, rectangle/polygon selection, padded extraction, four unique rig roles, pivots, layer manipulation, and seam QA.
3. Add isolated frame snapshots, timeline/playback/onion skin, region patches, bounded undo/redo, autosave, and reload restoration.
4. Export transparent cutouts and frames plus versioned project, rig, frame, manifest, and QA JSON in one JSZip archive; provide an Animator handoff without changing legacy project loading.
5. Cover pure geometry/model helpers and the end-to-end browser workflow, then update user and architecture documentation.

## Compatibility decision

Studio keeps image blobs out of JSON and stores them in a separate IndexedDB object store. Studio ZIP data is richer than the Animator v1 schema, so the handoff imports Studio cutout PNGs into the unchanged Animator through a dedicated “Open in Animator” action and normal Animator asset inputs. Old Animator JSON remains supported exactly as before.

## Verification record

The supplied 360 × 440 opaque-background character PNG was supplied as a session attachment and inspected as the realistic session reference; it is intentionally not committed because its licensing status is unknown. Automated extraction uses an in-memory deterministic PNG fixture instead. Pure model tests cover all geometry and isolation primitives. A direct Google Chrome package was installed as a fallback after Playwright CDN and Ubuntu Snap installation paths failed. The complete legacy Animator and Studio Playwright suite then passed locally, including master import, four-role extraction, isolated duplication, reload persistence, ZIP inspection, and screenshots.

## Optional complete-image frames

The schema-v2 project record now distinguishes Artwork master imports from a shared Frames `animationBase` reference (`id`, IndexedDB `blobId`, dimensions, and filename). Each frame owns an `animationBaseOverride` for frame-local translation, uniform scale, rotation, visibility, and erase strokes, while accepted Merge results continue to use the existing per-frame `fullImage` reference. Legacy composed frames retain their existing assets, overrides, fills, patches, and masks; normalization supplies safe defaults without a broad migration. The compositor draws the shared base in Frames before frame-local fills and cutouts when a frame has no accepted `fullImage`, preserving cutout-only projects and full-image Merge results.

Merge is an isolated two-image task session. Image A is captured from the existing deterministic frame compositor and Image B is decoded once on selection. View toggles reuse those decoded surfaces. Per-image transforms and stroke masks remain local until acceptance; Cancel therefore has no project side effects. Acceptance renders both sources into the fixed project canvas, stores the resulting transparent PNG by stable ID, and creates one normal project undo snapshot. Guides are DOM overlays positioned from document coordinates and are not part of the export canvas.

## Studio alignment baseline

Studio uses the Animator/Atlas ground convention: a 20-pixel transparent safety area below the ground-contact line. The guide baseline is therefore canvas height minus 20 pixels (`y = 420` on the standard 360 × 440 canvas). One canvas-space helper maps that coordinate through normal or Merge viewport zoom and pan; the DOM guide overlay remains outside exported pixels.
