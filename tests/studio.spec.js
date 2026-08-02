const {test,expect}=require('@playwright/test');const {PNG}=require('pngjs');const JSZip=require('jszip');const fs=require('node:fs/promises');
function masterPng(){const p=new PNG({width:80,height:80});for(let y=4;y<76;y++)for(let x=4;x<76;x++){const i=(y*80+x)*4;p.data[i]=x*3;p.data[i+1]=y*3;p.data[i+2]=100;p.data[i+3]=255}return PNG.sync.write(p)}
test.beforeEach(async({context})=>{
  await context.addInitScript(async()=>{
    if(sessionStorage.getItem('studio-test-clean'))return;
    localStorage.clear();
    await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('spritelab-studio-v2');request.onsuccess=request.onblocked=()=>resolve();request.onerror=()=>reject(request.error)});
    sessionStorage.setItem('studio-test-clean','1');
  });
});
async function expectSheet(panel,trigger,open){if(open){await expect(panel).toBeInViewport();expect(await trigger.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})).toBe(true)}else await expect(panel).not.toBeInViewport();await expect(panel).toHaveAttribute('aria-hidden',String(!open));await expect(trigger).toHaveAttribute('aria-expanded',String(open))}
test('Animator and Studio routes load',async({page})=>{await page.goto('/');await expect(page.locator('#stage')).toBeVisible();await expect(page.locator('.studio-link')).toBeVisible();await page.goto('/studio/');await expect(page.locator('#canvas')).toBeVisible();await expect(page.locator('#assetMode')).toHaveClass(/active/)});
test('master to four cutouts, isolated frame, persistence, and ZIP',async({page})=>{await page.setViewportSize({width:1024,height:768});await page.goto('/studio/');await page.setInputFiles('#masterInput',{name:'master.png',mimeType:'image/png',buffer:masterPng()});await expect(page.locator('#dimensions')).toHaveText('80 × 80');const roles=['upper_body','pelvis_cover','left_leg','right_leg'],rects=[{x:4,y:4,width:72,height:20},{x:4,y:24,width:72,height:16},{x:4,y:40,width:34,height:36},{x:42,y:40,width:34,height:36}];for(let i=0;i<4;i++)await page.evaluate(async({role,rect})=>{window.SpriteStudioTest.selectRect(rect);window.SpriteStudioTest.setRole(role);await window.SpriteStudioTest.extract()},{role:roles[i],rect:rects[i]});await expect(page.locator('.asset[data-id]')).toHaveCount(4);await expectSheet(page.locator('#inspectorPanel'),page.locator('#inspectorToggle'),true);await page.locator('#inspectorClose').click();await expectSheet(page.locator('#inspectorPanel'),page.locator('#inspectorToggle'),false);await page.locator('#frameMode').click();await page.locator('#duplicate').click();const before=await page.evaluate(()=>structuredClone(window.SpriteStudioTest.project().frames[0]));await page.locator('#inspectorToggle').click();await expectSheet(page.locator('#inspectorPanel'),page.locator('#inspectorToggle'),true);await page.locator('.asset[data-id]').first().click();await page.locator('#propX').fill('17');await page.locator('#propX').dispatchEvent('change');await page.locator('#inspectorClose').click();await expectSheet(page.locator('#inspectorPanel'),page.locator('#inspectorToggle'),false);const states=await page.evaluate(()=>window.SpriteStudioTest.project().frames);expect(states[0]).toEqual(before);expect(states[1].assetOverrides).not.toEqual(before.assetOverrides);await page.locator('#timelineSettings').click();await expectSheet(page.locator('#settingsPanel'),page.locator('#timelineSettings'),true);await page.locator('#onionPrev').check();await page.locator('#settingsPanel [data-sheet-close]').click();await expectSheet(page.locator('#settingsPanel'),page.locator('#timelineSettings'),false);const activeFrame=await page.evaluate(()=>window.SpriteStudioTest.project().activeFrame);await page.locator('#play').click();await page.waitForFunction(previous=>window.SpriteStudioTest.project().activeFrame!==previous,activeFrame);await page.locator('#play').click();await expect(page.locator('#saveState')).toHaveText('Saved locally');await page.reload();await expect(page.locator('.asset[data-id]')).toHaveCount(4);await page.evaluate(()=>{window.SpriteStudioTest.setMode('frame');window.SpriteStudioTest.selectRect({x:5,y:5,width:20,height:20})});await page.locator('#timelineSettings').click();await page.locator('#copyRegion').click();await page.locator('#pastePatch').click();await page.locator('#settingsPanel [data-sheet-close]').click();await page.locator('#inspectorToggle').click();await page.locator('#patchX').fill('13');await page.locator('#patchX').dispatchEvent('change');expect(await page.evaluate(()=>{const project=window.SpriteStudioTest.project();return{active:project.activeFrame,current:project.frames[project.activeFrame].patches,otherPatchCounts:project.frames.filter((_,index)=>index!==project.activeFrame).map(frame=>frame.patches.length)}})).toMatchObject({current:[{x:13,y:5,width:20,height:20}],otherPatchCounts:[0,0,0,0,0,0,0,0]});await page.locator('#moreToggle').click();const waiting=page.waitForEvent('download');await page.locator('#export').click();const d=await waiting,zip=await JSZip.loadAsync(await fs.readFile(await d.path()));for(const name of [...roles.map(r=>`assets/${r}.png`),'frames/frame_00.png','frames/frame_01.png','data/project.json','data/rig.json','data/frames.json','reports/qa.json','manifest.json'])expect(zip.files[name]).toBeTruthy();await page.screenshot({path:'test-results/screenshots/studio-desktop.png',fullPage:true})});
test('mobile Studio has explicit panels, large controls, and no console errors',async({page})=>{const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});await page.setViewportSize({width:390,height:844});await page.goto('/studio/');await expect(page.locator('#inspectorToggle')).toBeVisible();await page.locator('#inspectorToggle').click();await expect(page.locator('#inspectorPanel')).toHaveClass(/open/);for(const button of await page.locator('button:visible').all()){const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(40)}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);expect(errors).toEqual([]);await page.screenshot({path:'test-results/screenshots/studio-mobile.png',fullPage:true})});

test('responsive Studio keeps the mobile workflow reachable at four target viewports',async({page})=>{
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  const targets=[['iphone-portrait',390,844],['iphone-landscape',844,390],['ipad-portrait',768,1024],['desktop',1280,900]];
  for(const [name,width,height] of targets){
    await page.setViewportSize({width,height});await page.goto('/studio/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    if(width<=820||height<=500){
      await expect(page.locator('body')).toHaveAttribute('data-mode','asset');await expect(page.locator('footer')).toBeHidden();
      await expect(page.locator('#inspectorPanel')).not.toHaveClass(/open/);await page.locator('#inspectorToggle').click();await expect(page.locator('#inspectorPanel')).toHaveClass(/open/);await page.locator('#inspectorClose').click();await expect(page.locator('#inspectorPanel')).not.toHaveClass(/open/);
      await page.locator('#frameMode').click();await expect(page.locator('footer')).toBeVisible();await page.locator('#assetMode').click();await expect(page.locator('footer')).toBeHidden();
    }
    await page.screenshot({path:`test-results/screenshots/studio-${name}.png`,fullPage:true});
  }
  expect(errors).toEqual([]);
});

test('mobile import onboarding and selection actions remain fully reachable',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/studio/');
  await expect(page.locator('#empty')).toContainText('Choose the character image you want to edit.');
  let chooserPromise=page.waitForEvent('filechooser');await page.locator('#empty label[for="masterInput"]').click();let chooser=await chooserPromise;await chooser.setFiles({name:'mobile-master.png',mimeType:'image/png',buffer:masterPng()});
  await expect(page.locator('#importLabel')).toHaveText('Replace master');
  chooserPromise=page.waitForEvent('filechooser');await page.locator('#importLabel').click();chooser=await chooserPromise;await chooser.setFiles({name:'replacement.png',mimeType:'image/png',buffer:masterPng()});
  await page.evaluate(()=>window.SpriteStudioTest.selectRect({x:4,y:4,width:30,height:30}));await expect(page.locator('#selectionActions')).toBeVisible();await expect(page.locator('#role')).toBeVisible();await expect(page.locator('#extract')).toBeVisible();await expect(page.locator('#cancelSelection')).toBeVisible();await expect(page.locator('#closePolygon')).toBeHidden();
  const actions=await page.locator('#selectionActions').boundingBox(),viewport=await page.locator('#viewport').boundingBox();expect(actions.y).toBeGreaterThan(viewport.y);expect(actions.y+actions.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});


test('Studio sheets share dismissal and exclusivity behavior',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/studio/');
  const more=page.locator('#morePanel'),assets=page.locator('#inspectorPanel');
  const moreToggle=page.locator('#moreToggle'),assetsToggle=page.locator('#inspectorToggle'),backdrop=page.locator('#sheetBackdrop');
  await moreToggle.click();await expectSheet(more,moreToggle,true);await expect(backdrop).toBeVisible();
  await moreToggle.click();await expectSheet(more,moreToggle,false);await expect(backdrop).toBeHidden();
  await moreToggle.click();await backdrop.click({position:{x:2,y:120}});await expectSheet(more,moreToggle,false);
  await assetsToggle.click();await expectSheet(assets,assetsToggle,true);await moreToggle.click();await expectSheet(assets,assetsToggle,false);await expectSheet(more,moreToggle,true);
  await page.locator('[data-sheet-close]').click();await expectSheet(more,moreToggle,false);
  await moreToggle.click();await page.keyboard.press('Escape');await expectSheet(more,moreToggle,false);
  await assetsToggle.click();await expectSheet(assets,assetsToggle,true);await assetsToggle.click();await expectSheet(assets,assetsToggle,false);
  await assetsToggle.click();await backdrop.click({position:{x:2,y:120}});await expectSheet(assets,assetsToggle,false);
  await page.locator('#frameMode').click();const settings=page.locator('#settingsPanel'),settingsToggle=page.locator('#timelineSettings');
  await settingsToggle.click();await expectSheet(settings,settingsToggle,true);await settingsToggle.click();await expectSheet(settings,settingsToggle,false);
  await settingsToggle.click();await backdrop.click({position:{x:2,y:120}});await expectSheet(settings,settingsToggle,false);
  await settingsToggle.click();await page.locator('#settingsPanel [data-sheet-close]').click();await expectSheet(settings,settingsToggle,false);
  await settingsToggle.click();await moreToggle.click();await expectSheet(settings,settingsToggle,false);await expectSheet(more,moreToggle,true);await page.keyboard.press('Escape');await expect(backdrop).toBeHidden();
});

test('New project cancel preserves work and confirm returns to onboarding',async({page})=>{
  await page.goto('/studio/');await page.setInputFiles('#masterInput',{name:'master.png',mimeType:'image/png',buffer:masterPng()});
  await page.locator('#moreToggle').click();await page.locator('#newProject').click();await expect(page.locator('#newProjectConfirm')).toBeVisible();await page.locator('#cancelNewProject').click();await expect(page.locator('#dimensions')).toHaveText('80 × 80');
  await page.locator('#newProject').click();await page.locator('#confirmNewProject').click();await expect(page.locator('#empty')).toBeVisible();await expect(page.locator('#dimensions')).toHaveText('No master');expect(await page.evaluate(()=>window.SpriteStudioTest.project().rigAssets)).toEqual([]);await expect(page.locator('#sheetBackdrop')).toBeHidden();
});

test('permanent navigation, contextual timeline and repeated sheet cycles stay reliable',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/studio/');
  for(let cycle=0;cycle<3;cycle++){
    await expect(page.locator('#assetMode')).toBeVisible();await expect(page.locator('#frameMode')).toBeVisible();await expect(page.locator('#moreToggle')).toBeVisible();
    await page.locator('#moreToggle').click();await expect(page.locator('#morePanel')).toHaveClass(/open/);await page.locator('#moreToggle').click();
    await page.locator('#inspectorToggle').click();await expect(page.locator('#inspectorPanel')).toHaveClass(/open/);await page.locator('#inspectorToggle').click();
    await page.locator('#frameMode').click();await expect(page.locator('footer')).toBeVisible();await expect(page.locator('#timelineSettings')).toBeVisible();await page.locator('#timelineSettings').click();await expect(page.locator('#settingsPanel')).toHaveClass(/open/);await page.locator('[data-sheet-close]').last().click();await page.locator('#assetMode').click();await expect(page.locator('footer')).toBeHidden();
  }
  expect(await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,backdrop:!document.querySelector('#sheetBackdrop').hidden,sheetOpen:document.body.classList.contains('sheet-open')}))).toEqual({overflow:false,backdrop:false,sheetOpen:false});
});

test('missing asset guides extraction and selection tools clear stale state',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/studio/');await page.setInputFiles('#masterInput',{name:'master.png',mimeType:'image/png',buffer:masterPng()});
  await page.locator('#inspectorToggle').click();await page.locator('[data-missing-role="left_leg"]').click();await expect(page.locator('#inspectorPanel')).not.toHaveClass(/open/);await expect(page.locator('#role')).toHaveValue('left_leg');await expect(page.locator('#onboardingHint')).toContainText('Select this body part');
  await page.evaluate(()=>window.SpriteStudioTest.selectRect({x:4,y:4,width:20,height:20}));await expect(page.locator('#extract')).toBeVisible();await page.locator('[data-tool="polygon"]').click();await expect(page.locator('#selectionActions')).toBeHidden();
  await page.locator('#canvas').click({position:{x:50,y:50}});await expect(page.locator('#closePolygon')).toBeVisible();await expect(page.locator('#extract')).toBeHidden();await page.locator('[data-tool="select"]').click();await expect(page.locator('#selectionActions')).toBeHidden();
});

test('mobile progressive disclosure does not overlap controls',async({page})=>{
  const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.setViewportSize({width:390,height:844});await page.goto('/studio/');
  await expect(page.locator('footer')).toBeHidden();await expect(page.locator('#framesSummary')).toBeVisible();await expect(page.locator('#inspectorToggle')).toBeVisible();
  await page.locator('#frameMode').click();await expect(page.locator('footer')).toBeVisible();await expect(page.locator('#framesSummary')).toBeHidden();
  const assets=await page.locator('#inspectorToggle').boundingBox(),timeline=await page.locator('#timeline').boundingBox();expect(assets.y+assets.height<=timeline.y||assets.y>=timeline.y+timeline.height).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);expect(errors).toEqual([]);
});
