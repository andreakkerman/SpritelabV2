const DB_NAME = "spritelab-rig-assets", STORE = "assets", PROJECT_KEY = "spritelab-rig-project-v1";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}

export async function storeAsset(record) {
  const db = await openDatabase();
  return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
}
export async function loadAssets() {
  try { const db=await openDatabase(); return await new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}); }
  catch { return []; }
}
export async function clearAssets() {
  try { const db=await openDatabase(); await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}); } catch {}
}
export function saveProject(project) { try { localStorage.setItem(PROJECT_KEY, JSON.stringify(project)); return true; } catch { return false; } }
export function loadProject() { try { return JSON.parse(localStorage.getItem(PROJECT_KEY)); } catch { return null; } }
export function clearProjectStorage() { try { localStorage.removeItem(PROJECT_KEY); } catch {} }
