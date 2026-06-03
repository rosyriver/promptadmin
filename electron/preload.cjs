const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  saveMedia: (key, file, mediaType) => {
    return file.arrayBuffer().then(buf => {
      const buffer = Array.from(new Uint8Array(buf));
      return ipcRenderer.invoke('media:save', { key, fileName: file.name, buffer, mediaType });
    });
  },
  getMediaPath: (key) => ipcRenderer.invoke('media:getPath', key),
  deleteMedia: (key) => ipcRenderer.invoke('media:delete', key),
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
  getUserDataPath: () => ipcRenderer.invoke('app:getPath', 'userData'),
  saveMediaFromBase64: (key, base64) => ipcRenderer.invoke('media:saveBase64', { key, base64 }),
  openFolder: (path) => ipcRenderer.invoke('shell:openPath', path),
  organizeFile: (oldKey, mediaType) => ipcRenderer.invoke('media:organize', { oldKey, mediaType }),
  readFileAsBase64: (key) => ipcRenderer.invoke('media:readAsBase64', key),
  saveFile: (defaultName, content) => ipcRenderer.invoke('dialog:saveFile', { defaultName, content }),
});
