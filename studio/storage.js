const DB="spritelab-studio-v2",STORE="blobs",KEY="spritelab-studio-project-v2";
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function putBlob(id,blob){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).put(blob,id);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
export async function getBlob(id){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function deleteBlob(id){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).delete(id);t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}
export function saveMeta(project){localStorage.setItem(KEY,JSON.stringify(project))}
export function loadMeta(){try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}}
export async function clearAll(){localStorage.removeItem(KEY);const d=await db();return new Promise(resolve=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).clear();t.oncomplete=resolve})}
