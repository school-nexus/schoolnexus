// Register tsx to allow requiring TypeScript files
require('tsx/cjs');

const { app, BrowserWindow, ipcMain, session, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { setupHandlers } = require('../src/db/handlers');
const { seed } = require('../src/db/seed');

// Environment detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Window reference
let mainWindow = null;

/**
 * Creates the main application window with proper security settings
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: !isDev,
            sandbox: false,
        },
        autoHideMenuBar: true,
        title: 'School Nexus Academy',
        show: false,
        backgroundColor: '#1a1a2e',
    });

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        console.log('[Main] Window ready to show');
        mainWindow.show();
        mainWindow.focus();
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    console.log(`[Main] Loading URL: ${startUrl}`);
    console.log(`[Main] Environment: ${isDev ? 'development' : 'production'}`);

    mainWindow.loadURL(startUrl).catch((err) => {
        console.error('[Main] Failed to load URL:', err);
    });

    // Handle load events
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Main] Failed to load: ${validatedURL} (${errorCode}: ${errorDescription})`);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Main] Page finished loading');
    });

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // Cleanup on close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * Register custom protocols before app is ready
 */
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app-data',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
        },
    },
]);

/**
 * Configure Content Security Policy headers
 */
function setupCSP() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob: app-data:",
            "connect-src 'self' http://localhost:* ws://localhost:*",
            "frame-src 'self'",
            "worker-src 'self' blob:",
        ].join('; ');

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp],
            },
        });
    });
}

/**
 * Setup the app-data:// protocol handler for serving user files
 */
function setupAppDataProtocol() {
    protocol.handle('app-data', (request) => {
        try {
            const filePath = decodeURIComponent(request.url.slice('app-data://'.length));
            const fullPath = path.join(app.getPath('userData'), 'uploads', filePath);

            console.log(`[Protocol] Serving file: ${fullPath}`);
            return net.fetch(pathToFileURL(fullPath).toString());
        } catch (error) {
            console.error('[Protocol] Error fetching app-data:', error);
            return new Response('Not Found', { status: 404 });
        }
    });
}

/**
 * Initialize the application
 */
app.whenReady().then(async () => {
    console.log('[Main] App ready, initializing...');

    // Seed the database
    try {
        await seed();
        console.log('[Main] Database seeded successfully');
    } catch (error) {
        console.error('[Main] Failed to seed database:', error);
    }

    // Setup security
    setupCSP();

    // Setup custom protocol
    setupAppDataProtocol();

    // Setup IPC handlers for database operations
    setupHandlers(ipcMain);
    console.log('[Main] IPC handlers registered');

    // Create the main window
    createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        console.log('[Main] All windows closed, quitting...');
        app.quit();
    }
});

// Handle app errors
app.on('render-process-gone', (_event, _webContents, details) => {
    console.error('[Main] Render process gone:', details.reason);
});

app.on('child-process-gone', (_event, details) => {
    console.error('[Main] Child process gone:', details.type, details.reason);
});

// Basic IPC handler for testing
ipcMain.handle('ping', () => 'pong');
