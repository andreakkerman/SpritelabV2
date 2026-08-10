// Intentional syntax failure for autonomous CI repair cost smoke test.
export const CI_REPAIR_SMOKE_TEST = ;

export const CANVAS = { width: 360, height: 440, transparent: true };
export const GROUND = 420;
export const WHOLE_IDS = ["upper_body", "left_leg", "right_leg", "pelvis_cover"];
export const SEGMENTED_IDS = ["upper_body", "left_thigh", "left_shin", "left_foot", "right_thigh", "right_shin", "right_foot", "pelvis_cover"];

const layer = (id, name, parent, bind, pivot, locked = false) => ({
  id, name, assetId: id, src: `assets/rig/${id}.png`, parent, pivot, bind,
  rotation: 0, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, visibility: true, locked
});

const allLayers = [
  layer("upper_body", "Upper body", null, { x: 180, y: 115 }, { x: 100, y: 100 }, true),
  layer("pelvis_cover", "Pelvis cover", null, { x: 180, y: 276 }, { x: 60, y: 35 }, true),
  layer("left_leg", "Left leg", null, { x: 168, y: 288 }, { x: 34, y: 18 }),
  layer("right_leg", "Right leg", null, { x: 192, y: 288 }, { x: 34, y: 18 }),
  layer("left_thigh", "Left thigh", null, { x: 168, y: 288 }, { x: 30, y: 14 }),
  layer("left_shin", "Left shin", "left_thigh", { x: 0, y: 78 }, { x: 25, y: 10 }),
  layer("left_foot", "Left foot", "left_shin", { x: 0, y: 74 }, { x: 15, y: 12 }),
  layer("right_thigh", "Right thigh", null, { x: 192, y: 288 }, { x: 30, y: 14 }),
  layer("right_shin", "Right shin", "right_thigh", { x: 0, y: 78 }, { x: 25, y: 10 }),
  layer("right_foot", "Right foot", "right_shin", { x: 0, y: 74 }, { x: 15, y: 12 })
];

const phaseAngles = [
  [-16, 18], [-9, 11], [2, 1], [13, -12], [18, -16], [11, -9], [1, 2], [-12, 13]
];
const phaseNames = [
  "Left contact", "Left support", "Right passing", "Right advance",
  "Right contact", "Right support", "Left passing", "Left advance"
];
const DEFAULT_Z = ["right_leg", "right_thigh", "right_shin", "right_foot", "left_leg", "left_thigh", "left_shin", "left_foot", "upper_body", "pelvis_cover"];

function overridesFor(index) {
  const [left, right] = phaseAngles[index];
  return {
    left_leg: { rotation: left }, right_leg: { rotation: right },
    left_thigh: { rotation: left }, right_thigh: { rotation: right },
    left_shin: { rotation: index === 1 ? 10 : index === 3 ? 16 : index === 5 ? 6 : index === 7 ? 13 : 2 },
    right_shin: { rotation: index === 1 ? 6 : index === 3 ? 13 : index === 5 ? 10 : index === 7 ? 16 : 2 },
    left_foot: { rotation: index === 0 ? -5 : index === 3 ? 8 : 0 },
    right_foot: { rotation: index === 4 ? -5 : index === 7 ? 8 : 0 }
  };
}

export function createProject() {
  return {
    version: 1, character: "sven", animation: "walk-right", rigMode: "whole",
    canvas: { ...CANVAS }, fps: 10, loop: true, groundBaseline: GROUND,
    assets: Object.fromEntries(allLayers.map(item => [item.assetId, { id: item.assetId, filename: `${item.id}.png` }])),
    layers: structuredClone(allLayers),
    frames: Array.from({ length: 8 }, (_, index) => ({
      id: String(index).padStart(2, "0"), name: phaseNames[index], duration: 100,
      transforms: overridesFor(index), zOrder: [...DEFAULT_Z]
    }))
  };
}

export function activeLayerIds(project) {
  return project.rigMode === "whole" ? WHOLE_IDS : SEGMENTED_IDS;
}

export function frameTransform(project, frameIndex, layerId) {
  const base = project.layers.find(item => item.id === layerId);
  const override = project.frames[frameIndex].transforms[layerId] || {};
  return {
    x: override.x ?? base.offsetX ?? 0, y: override.y ?? base.offsetY ?? 0,
    rotation: override.rotation ?? base.rotation ?? 0,
    scaleX: override.scaleX ?? base.scaleX ?? 1,
    scaleY: override.scaleY ?? base.scaleY ?? 1,
    visibility: override.visibility ?? base.visibility
  };
}

export function validateProject(project, assets = new Map(), requireAssets = false) {
  const errors = [];
  if (project.version !== 1) errors.push("Unsupported project version");
  if (project.canvas?.width !== 360 || project.canvas?.height !== 440 || !project.canvas.transparent) errors.push("Canvas must be transparent 360 × 440");
  if (!Array.isArray(project.frames) || project.frames.length !== 8) errors.push("Project must contain exactly eight frames");
  const ids = new Set(project.layers?.map(item => item.id));
  for (const item of project.layers || []) {
    if (item.parent && !ids.has(item.parent)) errors.push(`${item.id}: missing parent ${item.parent}`);
    const seen = new Set([item.id]); let current = item;
    while (current?.parent) { if (seen.has(current.parent)) { errors.push(`${item.id}: parent cycle`); break; } seen.add(current.parent); current = project.layers.find(layer => layer.id === current.parent); }
    if (requireAssets && item.visibility && activeLayerIds(project).includes(item.id) && !assets.has(item.assetId)) errors.push(`${item.id}: source PNG missing`);
  }
  for (const frame of project.frames || []) {
    const active = activeLayerIds(project).filter(id => project.layers.find(layer => layer.id === id)?.visibility);
    if (active.some(id => frame.zOrder.filter(value => value === id).length !== 1)) errors.push(`${frame.id}: each visible layer must occur once in z-order`);
    for (const locked of ["upper_body", "pelvis_cover"]) if (frame.transforms[locked] && Object.keys(frame.transforms[locked]).some(key => !["visibility"].includes(key))) errors.push(`${frame.id}: ${locked} transform must remain fixed`);
    for (const transform of Object.values(frame.transforms)) if ((transform.scaleX ?? 1) !== 1 || (transform.scaleY ?? 1) !== 1) errors.push(`${frame.id}: animated scaling is not allowed in this MVP`);
  }
  if (requireAssets) for (const id of ["upper_body", "pelvis_cover"]) if (!project.layers.find(layer => layer.id === id)?.locked) errors.push(`${id} must be locked before export`);
  return [...new Set(errors)];
}

export function safeImport(value) {
  if (!value || typeof value !== "object" || value.version !== 1) throw new Error("Unsupported rig JSON");
  const errors = validateProject(value);
  if (errors.length) throw new Error(errors.join("; "));
  return structuredClone(value);
}
