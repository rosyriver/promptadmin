const DB_NAME = 'prompt-library';
const DB_VERSION = 2;

// Detect Electron environment
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.saveMedia;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cases')) {
        db.createObjectStore('cases', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── cases (always IndexedDB) ───

export async function loadAllCases<T>(): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cases', 'readonly');
    const request = tx.objectStore('cases').getAll();
    request.onsuccess = () => { db.close(); resolve(request.result as T[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function saveCase<T>(c: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cases', 'readwrite');
    tx.objectStore('cases').put(c);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

export async function deleteCaseRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cases', 'readwrite');
    tx.objectStore('cases').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

// ─── files (disk in Electron, IndexedDB in browser) ───

export async function storeFile(key: string, file: File): Promise<void> {
  if (isElectron) {
    const api = (window as any).electronAPI;
    await api.saveMedia(key, file);
    return;
  }
  // Fallback: IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

export async function getFileUrl(key: string): Promise<string | null> {
  if (isElectron) {
    const api = (window as any).electronAPI;
    const filePath = await api.getMediaPath(key);
    return filePath ? `file://${filePath}` : null;
  }
  // Fallback: IndexedDB blob URL
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const request = tx.objectStore('files').get(key);
    request.onsuccess = () => {
      const file = request.result as File | undefined;
      resolve(file ? URL.createObjectURL(file) : null);
      db.close();
    };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function deleteFile(key: string): Promise<void> {
  if (isElectron) {
    const api = (window as any).electronAPI;
    await api.deleteMedia(key);
    return;
  }
  // Fallback: IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}
