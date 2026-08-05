export const FRAME_BASELINE_BOTTOM_PADDING=20;
export const frameBaselineY=canvas=>Math.max(0,canvas.height-FRAME_BASELINE_BOTTOM_PADDING);
export function guideGeometry(canvas,view){const x=canvas.width/2,y=frameBaselineY(canvas);return{x,y,screenX:view.offsetX+x*view.scale,screenY:view.offsetY+y*view.scale,width:canvas.width*view.scale,height:canvas.height*view.scale}}
export const ROLES=["upper_body","head","pelvis_cover","left_leg","right_leg","left_upper_leg","left_lower_leg","right_upper_leg","right_lower_leg"];
export const ROLE_LABELS={upper_body:"Upper body",head:"Head",pelvis_cover:"Pelvis cover",left_leg:"Left leg",right_leg:"Right leg",left_upper_leg:"Left upper leg",left_lower_leg:"Left lower leg",right_upper_leg:"Right upper leg",right_lower_leg:"Right lower leg"};
export const roleLabel=role=>ROLE_LABELS[role]||role.replaceAll("_"," ").replace(/^./,c=>c.toUpperCase());
export function defaultParentId(assets,role){const parentRole={head:"upper_body",left_lower_leg:"left_upper_leg",right_lower_leg:"right_upper_leg"}[role];return assets.find(a=>a.role===parentRole)?.id??null}
export const LEG_ROLES=["left_upper_leg","left_lower_leg","right_upper_leg","right_lower_leg"];
export const JOINT_SIZES={small:10,medium:16,large:22,xl:30};
export const REPAIR_SHAPES=["round","oval","capsule"];
export const legChainForRole=role=>LEG_ROLES.includes(role)?(role.startsWith("left_")?"left":"right"):null;
export function resolveLegChain(assets,role){const side=legChainForRole(role);if(!side)return null;return{side,upper:assets.find(a=>a.role===`${side}_upper_leg`)||null,lower:assets.find(a=>a.role===`${side}_lower_leg`)||null}}
export function inverseTransformPoint(m,p){const det=m.a*m.d-m.b*m.c;if(Math.abs(det)<1e-9)return null;const x=p.x-m.e,y=p.y-m.f;return{x:(m.d*x-m.c*y)/det,y:(-m.b*x+m.a*y)/det}}
export function jointLocalFromWorld(assets,frame,assetId,world){const asset=assets.find(a=>a.id===assetId),p=inverseTransformPoint(assetWorldTransform(assets,frame,assetId),world);return asset&&p?{x:p.x-asset.position.x,y:p.y-asset.position.y}:null}
export function jointWorldPosition(assets,frame,joint){const owner=assets.find(a=>a.id===joint?.assetId);return owner?transformPoint(assetWorldTransform(assets,frame,owner.id),{x:owner.position.x+joint.x,y:owner.position.y+joint.y}):null}
export function setJoint(project,assetId,local){const asset=project.rigAssets.find(a=>a.id===assetId),side=legChainForRole(asset?.role);if(!side)return null;project.joints ||= {};return project.joints[side]={assetId,x:local.x,y:local.y}}
export function upsertJointCover(project,side,color="#808080"){const joint=project.joints?.[side],chain=joint&&resolveLegChain(project.rigAssets,`${side}_upper_leg`);if(!joint||!chain?.upper||!chain?.lower)return null;project.jointCovers ||= {};return project.jointCovers[side]={side,jointAssetId:joint.assetId,offset:{x:0,y:0},size:"medium",color:color.toLowerCase(),colorMode:"automatic"}}
export function setJointCoverColor(project,side,color,automatic=false){const cover=project.jointCovers?.[side];if(cover){cover.color=color.toLowerCase();cover.colorMode=automatic?"automatic":"manual"}return cover||null}
export function resetJointCover(project,side){const cover=project.jointCovers?.[side];if(cover)cover.offset={x:0,y:0};return cover||null}
export function removeJointCover(project,side){if(!project.jointCovers?.[side])return false;delete project.jointCovers[side];return true}
export function repairsFor(project,side){project.repairs ||= {};return project.repairs[side] ||= []}
export function addRepair(project,assetId,color="#808080"){const asset=project.rigAssets.find(a=>a.id===assetId),side=legChainForRole(asset?.role);if(!side)return null;const items=repairsFor(project,side);if(items.length>=2)return null;const repair={id:crypto.randomUUID(),side,assetId,point:{x:asset.width/2,y:asset.height/2},offset:{x:0,y:0},size:"medium",shape:"round",color:color.toLowerCase(),colorMode:"automatic"};items.push(repair);return repair}
export function setRepairPoint(project,side,id,assetId,point){const repair=repairsFor(project,side).find(item=>item.id===id);if(repair)Object.assign(repair,{assetId,point:{x:point.x,y:point.y},offset:{x:0,y:0}});return repair||null}
export function setRepairColor(project,side,id,color,automatic=false){const repair=repairsFor(project,side).find(item=>item.id===id);if(repair){repair.color=color.toLowerCase();repair.colorMode=automatic?"automatic":"manual"}return repair||null}
export function repairFrameOverride(frame,id,create=false){if(!frame)return null;if(create)frame.repairOverrides||={};return frame.repairOverrides?.[id]||null}
export function setRepairFrameOffset(frame,id,x,y){frame.repairOverrides||={};return frame.repairOverrides[id]={...(frame.repairOverrides[id]||{}),x:Number.isFinite(x)?x:0,y:Number.isFinite(y)?y:0}}
export function resetRepairFrameOffset(frame,id){if(!frame?.repairOverrides)return false;const existed=id in frame.repairOverrides;delete frame.repairOverrides[id];return existed}
export function deleteRepair(project,side,id){const items=repairsFor(project,side),index=items.findIndex(item=>item.id===id);if(index<0)return false;items.splice(index,1);for(const frame of project.frames||[])delete frame.repairOverrides?.[id];return true}
export function repairWorldPosition(assets,frame,repair){const owner=assets.find(a=>a.id===repair?.assetId),override=frame?.repairOverrides?.[repair?.id]||{};if(!owner||(override.visible??true)===false)return null;return transformPoint(assetWorldTransform(assets,frame,owner.id),{x:owner.position.x+repair.point.x+repair.offset.x+(override.x||0),y:owner.position.y+repair.point.y+repair.offset.y+(override.y||0)})}
export function assetContainsWorldPoint(assets,frame,assetId,point){const asset=assets.find(a=>a.id===assetId),local=asset&&inverseTransformPoint(assetWorldTransform(assets,frame,assetId),point);return !!(asset&&local&&local.x>=asset.position.x&&local.y>=asset.position.y&&local.x<=asset.position.x+asset.width&&local.y<=asset.position.y+asset.height)}
export function repairHitTest(project,frame,point,screenScale=1,touchPixels=48){const repairs=["left","right"].flatMap(side=>(project.repairs?.[side]||[]).map(repair=>({side,repair}))).reverse();return repairs.find(({repair})=>{const world=repairWorldPosition(project.rigAssets,frame,repair);return world&&Math.hypot(point.x-world.x,point.y-world.y)<=Math.max((JOINT_SIZES[repair.size]||16),touchPixels/Math.max(screenScale,.01))/2})||null}
export function coverRenderOrder(project,frame){const legacy=["left","right"].filter(side=>project.jointCovers?.[side]).map(side=>`joint-cover:${side}`);const assets=[...project.rigAssets].sort((a,b)=>(frame?.assetOverrides?.[a.id]?.zIndex??a.zIndex)-(frame?.assetOverrides?.[b.id]?.zIndex??b.zIndex)).map(a=>a.id);return[...legacy,...assets]}
export function createFill(frame,x,y,colour="#808080",diameter=32){frame.fills||=[];const count=frame.fills.reduce((n,item)=>Math.max(n,Number(item.name?.match(/^Fill (\d+)$/)?.[1]||0)),0);const fill={id:crypto.randomUUID(),name:`Fill ${count+1}`,shape:"circle",colour:colour.toLowerCase(),opacity:1,x:x-diameter/2,y:y-diameter/2,width:diameter,height:diameter,zIndex:0,visible:true,eraseMask:[]};frame.fills.forEach(item=>item.zIndex=(item.zIndex??0)+1);frame.fills.push(fill);return fill}
export function representativeColour(samples,fallback="#808080"){const opaque=samples.filter(sample=>(sample.a??255)>=160);if(!opaque.length)return fallback;const groups=new Map();for(const sample of opaque){const key=[sample.r,sample.g,sample.b].map(value=>Math.round(value/32)).join(','),weight=(sample.a/255)/(1+(sample.distance||0));const group=groups.get(key)||{weight:0,samples:[]};group.weight+=weight;group.samples.push({...sample,weight});groups.set(key,group)}const best=[...groups.values()].sort((a,b)=>b.weight-a.weight)[0],channel=key=>{const sorted=[...best.samples].sort((a,b)=>a[key]-b[key]);let cursor=0,total=sorted.reduce((sum,item)=>sum+item.weight,0);return sorted.find(item=>(cursor+=item.weight)>=total/2)?.[key]??0};return '#'+['r','g','b'].map(key=>channel(key).toString(16).padStart(2,'0')).join('')}
export function moveFillLayer(frame,id,direction){const layers=[...(frame.fills||[])].sort((a,b)=>(a.zIndex??0)-(b.zIndex??0)),index=layers.findIndex(x=>x.id===id),target=Math.max(0,Math.min(layers.length-1,index+direction));if(index<0||index===target)return false;[layers[index],layers[target]]=[layers[target],layers[index]];layers.forEach((x,i)=>x.zIndex=i);return true}
export function moveAssetLayer(project,assetId,direction){const sorted=[...project.rigAssets].sort((a,b)=>(a.zIndex??0)-(b.zIndex??0)),index=sorted.findIndex(a=>a.id===assetId),target=Math.max(0,Math.min(sorted.length-1,index+direction));if(index<0||index===target)return false;[sorted[index],sorted[target]]=[sorted[target],sorted[index]];sorted.forEach((a,i)=>a.zIndex=i);return true}
export const createDemoWalkState=()=>({playing:true,direction:"right",speed:"normal",progress:0,travelDirection:1});
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
export const ARTWORK_DEFAULT_TOOL="navigate";
export const POLYGON_TAP_THRESHOLD=6;
export const artworkToolAfter=(action,current=ARTWORK_DEFAULT_TOOL)=>["enter","cancel","complete","create"].includes(action)?ARTWORK_DEFAULT_TOOL:current;
export const isPolygonTap=(start,end,threshold=POLYGON_TAP_THRESHOLD)=>Math.hypot(end.x-start.x,end.y-start.y)<=threshold;
export const secondPointerState=()=>({cancelUncommittedRectangle:true,navigation:true});
export function anchorDelta(assets,previous,current,id){
  const asset=assets.find(item=>item.id===id);if(!asset)return null;
  const point={x:asset.position.x+asset.pivot.x*asset.width,y:asset.position.y+asset.pivot.y*asset.height};
  const before=assetWorldTransform(assets,previous,id),after=assetWorldTransform(assets,current,id);
  return{x:transformPoint(after,point).x-transformPoint(before,point).x,y:transformPoint(after,point).y-transformPoint(before,point).y,rotation:Math.atan2(after.b,after.a)*180/Math.PI-Math.atan2(before.b,before.a)*180/Math.PI};
}
export const hasAnchorDrift=delta=>!!delta&&(Math.abs(delta.x)>1||Math.abs(delta.y)>1||Math.abs(delta.rotation)>.5);
export function copyAssetPose(previous,current,id){
  const source=previous?.assetOverrides?.[id]||{},target=current.assetOverrides[id]||{};
  current.assetOverrides[id]={...target};for(const key of ["x","y","rotation"]){if(key in source)current.assetOverrides[id][key]=source[key];else delete current.assetOverrides[id][key]}
  if(!Object.keys(current.assetOverrides[id]).length)delete current.assetOverrides[id];return current;
}
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
export function blankFrame(index=0){return{id:crypto.randomUUID(),name:`Frame ${index+1}`,durationMs:100,assetOverrides:{},repairOverrides:{},assetEraseMasks:{},fills:[],patches:[],fullImage:null,animationBaseOverride:{x:0,y:0,scale:1,rotation:0,visible:true,eraseMask:[]}}}
export function duplicateFrame(frame,index){const copy=structuredClone(frame);copy.id=crypto.randomUUID();copy.name=`Frame ${index+1}`;return copy}
export function createProject(name="Untitled Sprite"){return{schemaVersion:2,project:{id:crypto.randomUUID(),name,canvas:{width:360,height:440}},master:null,animationBase:null,rigAssets:[],frames:Array.from({length:8},(_,index)=>blankFrame(index)),fps:10,activeFrame:0,joints:{},jointCovers:{},repairs:{}}}
export function normalizeProject(project){project.animationBase??=null;project.frames||=[];for(const frame of project.frames){frame.assetOverrides||={};frame.repairOverrides||={};frame.assetEraseMasks||={};frame.fills||=[];frame.patches||=[];frame.fullImage??=null;frame.animationBaseOverride={x:0,y:0,scale:1,rotation:0,visible:true,eraseMask:[],...(frame.animationBaseOverride||{})};frame.animationBaseOverride.eraseMask||=[];for(const fill of frame.fills){fill.shape="circle";fill.opacity??=1;fill.visible??=true;fill.eraseMask||=[]}}/* Legacy repair data is intentionally ignored. */return project}
export function serializeProject(project){const copy=structuredClone(project);for(const a of copy.rigAssets)delete a.image;for(const f of copy.frames)for(const p of f.patches)delete p.image;return copy}
export function createManifest(project){return{schemaVersion:2,type:"spritelab-studio",name:project.project.name,canvas:project.project.canvas,roles:ROLES,frameCount:project.frames.length,fps:project.fps,entrypoints:{project:"data/project.json",rig:"data/rig.json",frames:"data/frames.json",qa:"reports/qa.json"}}}
export function qaWarnings(project){const out=[];if(!project.master)out.push("No master loaded");for(const role of ROLES.filter(role=>role!=="head"))if(!project.rigAssets.some(a=>a.role===role))out.push(`Missing role: ${role}`);for(const a of project.rigAssets){if(a.empty)out.push(`Empty asset: ${a.role}`);if(a.pivot.x<0||a.pivot.x>1||a.pivot.y<0||a.pivot.y>1)out.push(`Pivot outside range: ${a.role}`);if(a.position.x+a.width<0||a.position.y+a.height<0||a.position.x>project.project.canvas.width||a.position.y>project.project.canvas.height)out.push(`Asset outside canvas: ${a.role}`);if(a.edgePixels)out.push(`Visible pixels touch crop boundary: ${a.role}`);if((a.padding??0)<2)out.push(`Possibly insufficient padding: ${a.role}`)}return [...new Set(out)]}
