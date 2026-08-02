export const ROLES=["upper_body","pelvis_cover","left_leg","right_leg","left_upper_leg","left_lower_leg","right_upper_leg","right_lower_leg"];
export const ROLE_LABELS={upper_body:"Upper body",pelvis_cover:"Pelvis cover",left_leg:"Left leg",right_leg:"Right leg",left_upper_leg:"Left upper leg",left_lower_leg:"Left lower leg",right_upper_leg:"Right upper leg",right_lower_leg:"Right lower leg"};
export const roleLabel=role=>ROLE_LABELS[role]||role.replaceAll("_"," ").replace(/^./,c=>c.toUpperCase());
export function defaultParentId(assets,role){const parentRole={left_lower_leg:"left_upper_leg",right_lower_leg:"right_upper_leg"}[role];return assets.find(a=>a.role===parentRole)?.id??null}
const multiply=(a,b)=>({a:a.a*b.a+a.c*b.b,b:a.b*b.a+a.d*b.b,c:a.a*b.c+a.c*b.d,d:a.b*b.c+a.d*b.d,e:a.a*b.e+a.c*b.f+a.e,f:a.b*b.e+a.d*b.f+a.f});
const translate=(x,y)=>({a:1,b:0,c:0,d:1,e:x,f:y});
const rotate=degrees=>{const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return{a:c,b:s,c:-s,d:c,e:0,f:0}};
export const transformPoint=(m,p)=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f});
/** Resolve an asset's per-frame transform. Positions remain document-space bind positions for compatibility. */
export function assetWorldTransform(assets,frame,id,rotationOffset=()=>0,stack=new Set()){
  const asset=assets.find(a=>a.id===id);if(!asset||stack.has(id))return {a:1,b:0,c:0,d:1,e:0,f:0};
  const override=frame?.assetOverrides?.[id]||{},x=override.x??asset.position.x,y=override.y??asset.position.y,px=asset.pivot.x*asset.width,py=asset.pivot.y*asset.height;
  const local=multiply(translate(x+px,y+py),multiply(rotate((override.rotation||0)+rotationOffset(asset)),translate(-asset.position.x-px,-asset.position.y-py)));
  if(!asset.parentId)return local;
  const next=new Set(stack);next.add(id);return multiply(assetWorldTransform(assets,frame,asset.parentId,rotationOffset,next),local);
}
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function createViewport(){return {scale:1,offsetX:0,offsetY:0}}
export function documentToScreen(view,p){return{x:p.x*view.scale+view.offsetX,y:p.y*view.scale+view.offsetY}}
export function screenToDocument(view,p){return{x:(p.x-view.offsetX)/view.scale,y:(p.y-view.offsetY)/view.scale}}
export function zoomAtPoint(view,screen,factor){const before=screenToDocument(view,screen);view.scale=clamp(view.scale*factor,.08,16);view.offsetX=screen.x-before.x*view.scale;view.offsetY=screen.y-before.y*view.scale;return view}
export function fitDocument(view,doc,screen,padding=28){view.scale=Math.min((screen.width-padding*2)/doc.width,(screen.height-padding*2)/doc.height);view.offsetX=(screen.width-doc.width*view.scale)/2;view.offsetY=(screen.height-doc.height*view.scale)/2;return view}
export function normalizedPivot(x,y,width,height){return{space:"asset-normalized",x:clamp(x/width,0,1),y:clamp(y/height,0,1)}}
export function rectFromPoints(a,b){return{x:Math.floor(Math.min(a.x,b.x)),y:Math.floor(Math.min(a.y,b.y)),width:Math.ceil(Math.abs(a.x-b.x)),height:Math.ceil(Math.abs(a.y-b.y))}}
export function polygonContains(points,x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(((a.y>y)!=(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
export function alphaBounds(data,width,height){let minX=width,minY=height,maxX=-1,maxY=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}return maxX<0?null:{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}}
export function paddedBounds(bounds,width,height,padding=4){const x=Math.max(0,bounds.x-padding),y=Math.max(0,bounds.y-padding),r=Math.min(width,bounds.x+bounds.width+padding),b=Math.min(height,bounds.y+bounds.height+padding);return{x,y,width:r-x,height:b-y}}
export function roleAvailable(assets,role,except=null){return !assets.some(a=>a.role===role&&a.id!==except)}
export function blankFrame(index=0){return{id:crypto.randomUUID(),name:`Frame ${index+1}`,durationMs:100,assetOverrides:{},patches:[]}}
export function duplicateFrame(frame,index){const copy=structuredClone(frame);copy.id=crypto.randomUUID();copy.name=`Frame ${index+1}`;return copy}
export function createProject(name="Untitled Sprite"){return{schemaVersion:2,project:{id:crypto.randomUUID(),name,canvas:{width:360,height:440}},master:null,rigAssets:[],frames:Array.from({length:8},(_,index)=>blankFrame(index)),fps:10,activeFrame:0}}
export function serializeProject(project){const copy=structuredClone(project);for(const a of copy.rigAssets)delete a.image;for(const f of copy.frames)for(const p of f.patches)delete p.image;return copy}
export function createManifest(project){return{schemaVersion:2,type:"spritelab-studio",name:project.project.name,canvas:project.project.canvas,roles:ROLES,frameCount:project.frames.length,fps:project.fps,entrypoints:{project:"data/project.json",rig:"data/rig.json",frames:"data/frames.json",qa:"reports/qa.json"}}}
export function qaWarnings(project){const out=[];if(!project.master)out.push("No master loaded");for(const role of ROLES)if(!project.rigAssets.some(a=>a.role===role))out.push(`Missing role: ${role}`);for(const a of project.rigAssets){if(a.empty)out.push(`Empty asset: ${a.role}`);if(a.pivot.x<0||a.pivot.x>1||a.pivot.y<0||a.pivot.y>1)out.push(`Pivot outside range: ${a.role}`);if(a.position.x+a.width<0||a.position.y+a.height<0||a.position.x>project.project.canvas.width||a.position.y>project.project.canvas.height)out.push(`Asset outside canvas: ${a.role}`);if(a.edgePixels)out.push(`Visible pixels touch crop boundary: ${a.role}`);if((a.padding??0)<2)out.push(`Possibly insufficient padding: ${a.role}`)}return [...new Set(out)]}
