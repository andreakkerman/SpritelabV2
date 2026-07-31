import { activeLayerIds, frameTransform } from "./model.js";

const identity = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
const multiply = (m, n) => ({
  a: m.a*n.a + m.c*n.b, b: m.b*n.a + m.d*n.b,
  c: m.a*n.c + m.c*n.d, d: m.b*n.c + m.d*n.d,
  e: m.a*n.e + m.c*n.f + m.e, f: m.b*n.e + m.d*n.f + m.f
});
const localMatrix = (layer, transform) => {
  const angle = transform.rotation * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  return { a: cos*transform.scaleX, b: sin*transform.scaleX, c: -sin*transform.scaleY, d: cos*transform.scaleY,
    e: layer.bind.x + transform.x, f: layer.bind.y + transform.y };
};
export const point = (matrix, x, y) => ({ x: matrix.a*x+matrix.c*y+matrix.e, y: matrix.b*x+matrix.d*y+matrix.f });

export function layerMatrix(project, frameIndex, layerId, cache = new Map()) {
  if (cache.has(layerId)) return cache.get(layerId);
  const layer = project.layers.find(item => item.id === layerId);
  if (!layer) return identity();
  const parent = layer.parent ? layerMatrix(project, frameIndex, layer.parent, cache) : identity();
  const matrix = multiply(parent, localMatrix(layer, frameTransform(project, frameIndex, layerId)));
  cache.set(layerId, matrix); return matrix;
}

export function renderFrame(ctx, project, frameIndex, assets, options = {}) {
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); if (options.clear !== false) ctx.clearRect(0,0,360,440); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = options.alpha ?? 1;
  const active = new Set(activeLayerIds(project));
  const order = project.frames[frameIndex].zOrder.filter(id => active.has(id));
  const cache = new Map();
  for (const id of order) {
    const layer = project.layers.find(item => item.id === id), transform = frameTransform(project, frameIndex, id), asset = assets.get(layer.assetId);
    if (!layer || !transform.visibility) continue;
    const matrix = layerMatrix(project, frameIndex, id, cache);
    ctx.save(); ctx.setTransform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);
    if (asset?.image) ctx.drawImage(asset.image, -layer.pivot.x, -layer.pivot.y);
    else if (options.guides) drawMissing(ctx, layer);
    ctx.restore();
  }
  ctx.restore();
  if (options.guides) drawGuides(ctx, project, frameIndex, assets, options.selectedLayer);
}

function drawMissing(ctx, layer) {
  ctx.strokeStyle="#c98c55"; ctx.setLineDash([6,4]); ctx.strokeRect(-35,-18,70,90); ctx.setLineDash([]);
  ctx.fillStyle="#3b2920"; ctx.fillRect(-34,-17,68,24); ctx.fillStyle="#fff";ctx.font="600 10px system-ui";ctx.textAlign="center";ctx.fillText(`LOAD ${layer.name.toUpperCase()}`,0,-2,64);
}

function drawGuides(ctx, project, frameIndex, assets, selectedId) {
  const layer = project.layers.find(item => item.id === selectedId); if (!layer) return;
  const matrix = layerMatrix(project, frameIndex, selectedId), asset = assets.get(layer.assetId), width=asset?.width||70,height=asset?.height||90;
  const corners=[[0,0],[width,0],[width,height],[0,height]].map(([x,y])=>point(matrix,x-layer.pivot.x,y-layer.pivot.y));
  ctx.save();ctx.strokeStyle="#f2b84b";ctx.lineWidth=2;ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
  const pivot=point(matrix,0,0);ctx.fillStyle="#f2b84b";ctx.beginPath();ctx.arc(pivot.x,pivot.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#171b1c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pivot.x-10,pivot.y);ctx.lineTo(pivot.x+10,pivot.y);ctx.moveTo(pivot.x,pivot.y-10);ctx.lineTo(pivot.x,pivot.y+10);ctx.stroke();ctx.restore();
}

export function canvasToBlob(canvas) { return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("PNG encoding failed")),"image/png")); }
