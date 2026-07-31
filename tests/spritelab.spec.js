const { test, expect } = require("@playwright/test");
const { PNG } = require("pngjs");
const JSZip = require("jszip");
const fs = require("node:fs/promises");

const shots = "test-results/screenshots";
function fixturePng(name) {
  const body = name === "upper_body", pelvis = name === "pelvis_cover";
  const width = body ? 120 : pelvis ? 100 : 50, height = body ? 180 : pelvis ? 60 : 120;
  const png = new PNG({ width, height });
  for (let y=2;y<height-2;y++) for (let x=2;x<width-2;x++) {
    const index=(y*width+x)*4; png.data[index]=body?190:70;png.data[index+1]=pelvis?90:130;png.data[index+2]=70;png.data[index+3]=255;
  }
  return PNG.sync.write(png);
}
async function ready(page, viewport={width:390,height:844}) {
  await page.setViewportSize(viewport); await page.goto("/");
  await expect(page.locator("#stage")).toBeVisible(); await expect(page.locator(".frame")).toHaveCount(8);
}
async function loadWholeAssets(page) {
  for (const id of ["upper_body","pelvis_cover","left_leg","right_leg"]) {
    await page.setInputFiles(`[data-asset-input="${id}"]`, { name:`${id}.png`, mimeType:"image/png", buffer:fixturePng(id) });
    await expect(page.locator("#assetStatus")).toContainText(`${["upper_body","pelvis_cover","left_leg","right_leg"].indexOf(id)+1} / 4`);
  }
}

test("iPhone rig editing, pivot, playback, and persistence", async ({ page }) => {
  await ready(page); await page.locator('[data-tab="assets"]').click(); await loadWholeAssets(page);
  await page.locator('[data-tab="pose"]').click(); await page.locator('[data-layer="left_leg"]').click();
  await page.locator("#rotation").fill("-12"); await page.locator("#x").fill("6"); await page.locator(".frame[data-frame='3']").click();
  await page.locator("#mirrorPose").click(); await page.locator("#onionToggle").click(); await page.locator("#copyFrame").click();
  const before = await page.evaluate(() => window.SpriteLabTest.project().layers.find(layer=>layer.id==="left_leg").pivot);
  await page.locator("#stage").scrollIntoViewIfNeeded();
  const box=await page.locator("#stage").boundingBox(), worldPivot=await page.evaluate(()=>window.SpriteLabTest.selectedPivot()),pivot={x:box.x+box.width*worldPivot.x/360,y:box.y+box.height*worldPivot.y/440};
  await page.mouse.move(pivot.x,pivot.y);await page.mouse.down();await page.mouse.move(pivot.x+8,pivot.y+5);await page.mouse.up();
  const after = await page.evaluate(() => window.SpriteLabTest.project().layers.find(layer=>layer.id==="left_leg").pivot);
  expect(after).not.toEqual(before);
  await page.locator("#play").click();await page.waitForTimeout(350);await page.locator("#play").click();
  await expect(page.locator("#saveState")).toContainText("Saved");await page.reload();await expect(page.locator("#assetStatus")).toContainText("4 / 4");
  await page.screenshot({path:`${shots}/iphone-rig-editor.png`,fullPage:true});
});

test("JSON, PNG, and complete ZIP exports are deterministic", async ({ page }) => {
  await ready(page,{width:1024,height:768});await page.locator('[data-tab="assets"]').click();await loadWholeAssets(page);
  await page.locator("#exportOpen").click();await expect(page.locator("#exportValidation")).toContainText("Ready");
  let waiting=page.waitForEvent("download");await page.locator("#exportCurrent").click();let download=await waiting;expect(download.suggestedFilename()).toBe("sven-walk-right-00.png");let png=PNG.sync.read(await fs.readFile(await download.path()));expect([png.width,png.height]).toEqual([360,440]);for(const [x,y] of [[0,0],[359,0],[0,439],[359,439]])expect(png.data[(y*360+x)*4+3]).toBe(0);
  waiting=page.waitForEvent("download");await page.locator("#exportRig").click();download=await waiting;const rig=JSON.parse((await fs.readFile(await download.path())).toString());expect(rig.frames).toHaveLength(8);expect(rig.layers.find(layer=>layer.id==="upper_body").locked).toBe(true);
  waiting=page.waitForEvent("download");await page.locator("#exportZip").click();download=await waiting;const zip=await JSZip.loadAsync(await fs.readFile(await download.path()));
  const names=Object.keys(zip.files);for(let i=0;i<8;i++)expect(names).toContain(`sven-walk-right/frames/sven-walk-right-${String(i).padStart(2,"0")}.png`);for(const path of ["rig/sven-walk-right.json","manifest.json","qa-report.json","README.txt","assets/upper_body.png","assets/pelvis_cover.png","assets/left_leg.png","assets/right_leg.png"])expect(names).toContain(`sven-walk-right/${path}`);
  const report=JSON.parse(await zip.file("sven-walk-right/qa-report.json").async("text"));expect(report.valid).toBe(true);expect(report.frames).toHaveLength(8);expect(report.frames.every(frame=>frame.mimeType==="image/png"&&frame.width===360&&frame.height===440)).toBe(true);
  await page.screenshot({path:`${shots}/ipad-export.png`,fullPage:true});
});

test("segmented mode exposes hierarchical leg parts and mobile controls", async ({ page }) => {
  await ready(page,{width:390,height:844});await page.locator('[data-mode="segmented"]').click();
  for(const id of ["left_thigh","left_shin","left_foot","right_thigh","right_shin","right_foot"])await expect(page.locator(`[data-layer="${id}"]`)).toBeVisible();
  const project=await page.evaluate(()=>window.SpriteLabTest.project());expect(project.layers.find(layer=>layer.id==="left_shin").parent).toBe("left_thigh");expect(project.layers.find(layer=>layer.id==="left_foot").parent).toBe("left_shin");
  await page.locator('[data-layer="left_shin"]').click();await page.locator("#rotationNumber").fill("14");await page.locator("#rotationNumber").press("Enter");await page.locator("#zUp").click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);for(const button of await page.locator("button:visible").all()){const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(40)}
  await page.screenshot({path:`${shots}/iphone-segmented-mode.png`,fullPage:true});
});

test("rig JSON round trip reproduces transforms", async ({ page }) => {
  await ready(page,{width:1280,height:900});await page.locator('[data-layer="right_leg"]').click();await page.locator("#rotationNumber").fill("17");await page.locator("#rotationNumber").press("Enter");
  const original=await page.evaluate(()=>window.SpriteLabTest.project()),hash=async()=>page.evaluate(async()=>{const bytes=new Uint8Array(await (await window.SpriteLabTest.frameBlob(0)).arrayBuffer());let value=2166136261;for(const byte of bytes)value=Math.imul(value^byte,16777619);return value>>>0}),before=await hash();await page.locator('[data-tab="project"]').click();await page.setInputFiles("#importRig",{name:"sven-walk-right.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(original))});await expect(page.locator("#saveState")).toContainText(/Saving|Saved/);expect(await page.evaluate(()=>window.SpriteLabTest.project())).toEqual(original);expect(await hash()).toBe(before);
  await page.screenshot({path:`${shots}/desktop-project.png`,fullPage:true});
});
