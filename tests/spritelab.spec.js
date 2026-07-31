const { test, expect } = require("@playwright/test");
const shots = "test-results/screenshots";
async function ready(page, viewport){await page.setViewportSize(viewport);await page.goto("/");await expect(page.locator("#preview")).toBeVisible();await expect(page.locator(".frame-card")).toHaveCount(24)}
test("core animation and editing workflow",async({page})=>{
  await ready(page,{width:390,height:844});
  await expect(page.locator("#fps")).toHaveValue("15");await expect(page.locator("#variantLabel")).toContainText("24 frames");
  await page.screenshot({path:`${shots}/iphone-default.png`,fullPage:true});
  await page.locator("#playBtn").click();await expect(page.locator("#playBtn")).toHaveAttribute("aria-label","Play");
  await page.locator("#scrubber").fill("8");await expect(page.locator("#frameBadge")).toContainText("08");
  await page.locator("#fps").fill("12");await page.locator("#fps").press("Enter");await page.locator("#resetFps").click();await expect(page.locator("#fps")).toHaveValue("15");
  await page.getByRole("button",{name:"Left · mirrored"}).click();await expect(page.locator("#directionLabel")).toContainText("MIRROR");
  await page.locator("[data-tab=align]").click();await page.locator("#offsetX").fill("7");await page.locator("#offsetY").fill("-4");await page.locator("#onionPrev").check();await page.locator("#autoAlign").click();
  await page.screenshot({path:`${shots}/iphone-frame-editing.png`,fullPage:true});
  await page.locator("#toggleFrame").click();await expect(page.locator('[data-frame="8"]')).toHaveClass(/disabled/);await page.locator("#moveLeft").click();
  await page.locator("[data-tab=transition]").click();await page.locator("#repeatTransition").click();await page.screenshot({path:`${shots}/iphone-transition-focus.png`,fullPage:true});
  await page.locator("[data-tab=variants]").click();await page.locator('[data-kind="p12"]').click();await page.locator('[data-compare="duration"]').click();await page.screenshot({path:`${shots}/iphone-variant-switching.png`,fullPage:true});
});
test("persistence and exports",async({page})=>{
  await ready(page,{width:1280,height:900});await page.locator('[data-direction="left"]').click();await page.locator("#fps").fill("13");await page.locator("#fps").press("Enter");await page.reload();await expect(page.locator("#fps")).toHaveValue("13");await expect(page.locator("#directionLabel")).toContainText("MIRROR");
  await page.locator("[data-tab=diagnostics]").click();await page.screenshot({path:`${shots}/desktop-diagnostics.png`,fullPage:true});await page.screenshot({path:`${shots}/mirrored-left-preview.png`,fullPage:true});
  await page.locator("[data-tab=export]").click();for(const kind of ["project","metadata","frame","sheet"]){const download=page.waitForEvent("download");await page.locator(`[data-export="${kind}"]`).click();expect((await download).suggestedFilename()).toBeTruthy()}
  await page.locator('[data-export="snippet"]').click();await expect(page.locator("#snippet")).toContainText("runtimeMirroring");await page.screenshot({path:`${shots}/export-panel.png`,fullPage:true});
});
test("iPad comparison and alignment",async({page})=>{
  await ready(page,{width:1024,height:768});await page.locator("[data-tab=variants]").click();await expect(page.locator(".variant-card")).toHaveCount(4);await page.screenshot({path:`${shots}/ipad-side-by-side.png`,fullPage:true});await page.locator("[data-tab=align]").click();await page.screenshot({path:`${shots}/ipad-alignment-studio.png`,fullPage:true});
});
test("project import validates and restores",async({page})=>{
  await ready(page,{width:390,height:844});const project={schemaVersion:1,fps:9,order:Array.from({length:24},(_,i)=>i+1),enabled:Array(24).fill(true)};await page.setInputFiles("#importProject",{name:"project.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(project))});page.once("dialog",d=>d.accept());await expect(page.locator("#fps")).toHaveValue("9");
});
