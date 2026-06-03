const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');

// Remove default menu bar
Menu.setApplicationMenu(null);
const path = require('path');
const fs = require('fs');

let mainWindow;
let userMediaDir = null;

const CONFIG_PATH = () => path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH(), 'utf-8')); } catch { return {}; }
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH(), JSON.stringify(cfg, null, 2));
}

function getMediaDir(sub) {
  const cfg = loadConfig();
  const base = userMediaDir || cfg.mediaPath || path.join(app.getPath('userData'), 'media');
  const dir = sub ? path.join(base, sub) : base;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getTypeSubdir(mediaType) {
  if (mediaType === 'video') return 'videos';
  if (mediaType === 'audio') return 'audio';
  return 'images';
}

function makeFileName(key, ext, mediaType) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${ts}_${key}${ext}`;
}

// ─── IPC: Media file operations ───

ipcMain.handle('media:save', async (_event, { key, fileName, buffer, mediaType }) => {
  const ext = path.extname(fileName) || '.bin';
  const sub = getTypeSubdir(mediaType);
  const name = makeFileName(key, ext, mediaType);
  const filePath = path.join(getMediaDir(sub), name);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return `${sub}/${name}`;
});

function findFile(key) {
  // Try exact match
  const exact = path.join(getMediaDir(), key);
  if (fs.existsSync(exact)) return exact;
  // Try matching files starting with key (UUID without ext → UUID.ext)
  const baseDir = getMediaDir();
  try {
    const files = fs.readdirSync(baseDir);
    const match = files.find(f => f.startsWith(key) || key.startsWith(path.basename(f, path.extname(f))));
    if (match) return path.join(baseDir, match);
  } catch {}
  return null;
}

ipcMain.handle('media:getPath', async (_event, key) => {
  const found = findFile(key);
  return found || null;
});

ipcMain.handle('media:delete', async (_event, key) => {
  const found = findFile(key);
  if (found) fs.unlinkSync(found);
});

ipcMain.handle('media:organize', async (_event, { oldKey, mediaType }) => {
  const oldPath = findFile(oldKey);
  if (!oldPath) return null;
  const oldName = path.basename(oldPath);
  const ext = path.extname(oldName);
  const id = path.basename(oldName, ext);
  const sub = getTypeSubdir(mediaType);
  const name = makeFileName(id, ext, mediaType);
  const newPath = path.join(getMediaDir(sub), name);
  if (oldPath !== newPath) {
    fs.copyFileSync(oldPath, newPath);
    fs.unlinkSync(oldPath);
  }
  return `${sub}/${name}`;
});

// ─── IPC: Settings ───

ipcMain.handle('settings:getAll', async () => {
  const base = userMediaDir || loadConfig().mediaPath || path.join(app.getPath('userData'), 'media');
  return { ...loadConfig(), mediaPath: base };
});

ipcMain.handle('settings:set', async (_event, { key, value }) => {
  const cfg = loadConfig();
  cfg[key] = value;
  saveConfig(cfg);
  if (key === 'mediaPath') {
    userMediaDir = value;
    if (!fs.existsSync(value)) fs.mkdirSync(value, { recursive: true });
  }
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: '选择媒体文件存储目录',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('app:getPath', async (_event, name) => {
  return app.getPath(name);
});

ipcMain.handle('media:saveBase64', async (_event, { key, base64 }) => {
  const buf = Buffer.from(base64, 'base64');
  const filePath = path.join(getMediaDir(), key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buf);
});

ipcMain.handle('shell:openPath', async (_event, dirPath) => {
  shell.openPath(dirPath);
});

ipcMain.handle('dialog:saveFile', async (_event, { defaultName, content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('media:readAsBase64', async (_event, key) => {
  const found = findFile(key);
  if (!found) return null;
  const buf = fs.readFileSync(found);
  return { data: buf.toString('base64'), name: path.basename(found), size: buf.length };
});

// ─── Window ───

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Prompt Case Library',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#F6F6F4',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
