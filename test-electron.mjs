import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Next.js build
  const nextBuildPath = path.join(__dirname, '.next', 'static');
  console.log('Loading from:', nextBuildPath);
  
  // Try to load index.html from the static directory
  const indexPath = path.join(nextBuildPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    // Fallback to a simple HTML page
    mainWindow.loadURL('data:text/html,<h1>Next.js build not found</h1><p>Looking for: ' + indexPath + '</p>');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});