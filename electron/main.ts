import { app, BrowserWindow, ipcMain, session, protocol, net } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createServer } from 'http';
import { parse } from 'url';
import fs from 'fs';
import next from 'next';
import { setupHandlers } from '../src/db/handlers.js';
import { initializeDatabase } from '../src/db/index.js';
import { logDebug } from '../src/lib/logger.js';

// Ensure NODE_ENV is set for production builds
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = app.isPackaged ? 'production' : 'development';
}

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to determine content type
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Environment detection - more robust for production builds
const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.NODE_ENV !== 'production');
const isProduction = process.env.NODE_ENV === 'production' || app.isPackaged;

// Window references
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let nextApp: any = null;
let server: any = null;

// Next.js server configuration
const NEXT_SERVER_PORT = 3000;
const NEXT_SERVER_URL = `http://localhost:${NEXT_SERVER_PORT}`;

// Additional ports to check in case the primary port is unavailable
const FALLBACK_PORTS = [3001, 3002, 3003];

// Performance tracking
const startupMetrics = {
  startTime: Date.now(),
  windowCreated: 0,
  dbInitialized: 0,
  serverReady: 0,
  appReady: 0
};

function logDebugMain(message: string, error?: any): void {
  logDebug(message, error);
}


/**
 * Creates the main application window with optimized performance settings
 */
function createWindow(): void {
  console.log('[Main] Creating main window...');
  startupMetrics.windowCreated = Date.now() - startupMetrics.startTime;

  // Create main window with optimized settings
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
      // Performance optimizations
      backgroundThrottling: false, // Prevent throttling when window is not focused
      devTools: isDev
    },
    autoHideMenuBar: true,
    title: 'School Nexus',
    icon: path.join(__dirname, '../../public/assets/icon.png'),
    show: false, // Prevent white flash
    backgroundColor: '#1a1a2e',
    // Performance: Disable animations for faster initial render
    frame: true,
    transparent: false
  });

  // Show window immediately with loading state
  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow?.show();
    mainWindow?.focus();
    
    // Close splash screen if it exists
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  // Handle load events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Page finished loading');
    startupMetrics.appReady = Date.now() - startupMetrics.startTime;
    logStartupMetrics();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Main] Failed to load: ${validatedURL} (${errorCode}: ${errorDescription})`);
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Cleanup on close
  mainWindow.on('closed', () => {
    console.log('[Main] Main window closed');
    mainWindow = null;
  });
  
  // Additional window event handlers for debugging
  mainWindow.on('close', () => {
    console.log('[Main] Main window closing');
  });
}

/**
 * Creates optimized splash screen
 */
function createSplashScreen(): void {
  console.log('[Main] Creating splash screen...');
  
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Disable unnecessary features for splash screen
      backgroundThrottling: true
    },
    icon: path.join(__dirname, '../../public/assets/icon.png'),
    // Performance: Disable animations for splash
    show: false
  });

  splashWindow.loadURL(pathToFileURL(path.join(__dirname, '../../public/splash.html')).toString());
  
  // Show splash immediately
  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/**
 * Initialize Next.js server with performance optimizations
 * Returns the URL the server is listening on
 */
async function initializeNextServer(): Promise<string> {
  // In development mode, check if Next.js dev server is already running
  // (it might be started by the concurrent process in electron-dev script)
  if (isDev) {
    console.log(`[Main] Development mode detected, checking for existing Next.js server at ${NEXT_SERVER_URL}...`);
    
    // Check primary port first
    let activeServerUrl = await checkForActiveServer(NEXT_SERVER_URL);
    
    // If primary port isn't available, check fallback ports
    if (!activeServerUrl) {
      for (const port of FALLBACK_PORTS) {
        const url = `http://localhost:${port}`;
        activeServerUrl = await checkForActiveServer(url);
        if (activeServerUrl) {
          break;
        }
      }
    }
    
    if (activeServerUrl) {
      console.log(`[Main] Connected to existing Next.js server at ${activeServerUrl}`);
      return activeServerUrl;
    } else {
      console.log('[Main] No existing Next.js server found, proceeding with initialization...');
    }
  }
  
  // For production or when no external server exists, start our own
  const port = NEXT_SERVER_PORT;
  const startUrl = `http://localhost:${port}`;
  
  console.log(`[Main] Starting Next.js server on port ${port}...`);

  try {
    if (isProduction) {
      // In production, use Next.js programmatic API as a custom server
      console.log('[Main] Running in production mode — using Next.js custom server...');
      
      // Determine the app directory
      let appDir: string;
      if (app.isPackaged) {
        // In packaged app, try multiple possible paths
        const possiblePaths = [
          path.join(process.resourcesPath, 'app.asar'),
          path.join(process.resourcesPath, 'app'),
          path.join(__dirname, '..'),
        ];
        
        // Log all paths being checked
        for (const p of possiblePaths) {
          const hasNext = (() => { try { return fs.existsSync(path.join(p, '.next')); } catch { return false; } })();
          const hasPkg = (() => { try { return fs.existsSync(path.join(p, 'package.json')); } catch { return false; } })();
          console.log(`[Main] Checking path: ${p} (.next=${hasNext}, package.json=${hasPkg})`);
        }
        
        appDir = possiblePaths.find(p => {
          try { return fs.existsSync(path.join(p, '.next')); } 
          catch { return false; }
        }) || possiblePaths[0];
      } else {
        appDir = path.join(__dirname, '..');
      }
      
      console.log(`[Main] Selected app directory: ${appDir}`);
      console.log(`[Main] .next exists: ${fs.existsSync(path.join(appDir, '.next'))}`);
      console.log(`[Main] __dirname: ${__dirname}`);
      console.log(`[Main] resourcesPath: ${process.resourcesPath}`);
      
      // Initialize Next.js in production mode
      console.log('[Main] Calling next({ dev: false })...');
      nextApp = next({
        dev: false,
        dir: appDir,
        quiet: false,
      });

      const handle = nextApp.getRequestHandler();
      console.log('[Main] Calling nextApp.prepare()...');
      await nextApp.prepare();
      console.log('[Main] nextApp.prepare() completed successfully');
      startupMetrics.serverReady = Date.now() - startupMetrics.startTime;
      console.log(`[Main] Next.js production server prepared`);

      const startServer = () => new Promise<string>((resolve, reject) => {
        server = createServer((req, res) => {
          const parsedUrl = parse(req.url!, true);
          handle(req, res, parsedUrl).catch((err: any) => {
            console.error('Error handling request:', req.url, err);
            res.statusCode = 500;
            res.end('Internal Server Error');
          });
        });

        server.on('error', (err: any) => {
          console.error('[Main] Server error:', err);
          if (err.code === 'EADDRINUSE') {
            console.log('[Main] Port in use, assuming external server exists');
            resolve(startUrl);
          } else {
            reject(err);
          }
        });

        server.listen(port, () => {
          console.log(`[Main] Server listening on ${startUrl}`);
          resolve(startUrl);
        });
      });

      return await startServer();
    } else {
      // In development, use the standard Next.js dev server approach
      nextApp = next({
        dev: isDev,
        dir: path.join(__dirname, '../../'),
        quiet: !isDev,
        conf: {
          experimental: {
            optimizeCss: true,
            scrollRestoration: true
          },
          env: {
            NODE_ENV: isProduction ? 'production' : 'development'
          }
        }
      });

      const handle = nextApp.getRequestHandler();

      await nextApp.prepare();
      startupMetrics.serverReady = Date.now() - startupMetrics.startTime;
      console.log(`[Main] Next.js server ready on ${startUrl}`);

      const startServer = () => new Promise<string>((resolve, reject) => {
        server = createServer((req, res) => {
          const parsedUrl = parse(req.url!, true);
          handle(req, res, parsedUrl).catch((err: any) => {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('Internal Server Error');
          });
        });

        server.on('error', (err: any) => {
          console.error('[Main] Next.js Server error:', err);
          if (err.code === 'EADDRINUSE') {
            console.log('[Main] Port in use, assuming external server exists');
            resolve(startUrl);
          } else {
            reject(err);
          }
        });

        server.listen(port, () => {
          console.log(`[Main] Server listening on ${startUrl}`);
          resolve(startUrl);
        });
      });

      return await startServer();
    }

    app.on('will-quit', () => {
      if (server) {
        server.close();
      }
    });

  } catch (error) {
    console.error('[Main] Failed to prepare Next.js app:', error);
    console.error('[Main] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isProduction,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
      __dirname,
      cwd: process.cwd()
    });
    handleStartupError('Failed to initialize application server', error);
    throw error;
  }
}

/**
 * Check if a Next.js server is running at the given URL
 */
async function checkForActiveServer(url: string): Promise<string | null> {
  try {
    // Create a promise that rejects after a timeout period
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });
    
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, { method: 'HEAD' }),
      timeoutPromise
    ]) as Response;
    
    if (response && response.ok) {
      return url;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Load main window with retry logic
 */
function loadMainWindow(url: string): void {
  if (!mainWindow) return;

  const loadWithRetry = (retryCount = 0) => {
    mainWindow?.loadURL(url).catch((err) => {
      console.error(`[Main] Failed to load URL (attempt ${retryCount + 1}):`, err);
      if (retryCount < 3) {
        setTimeout(() => loadWithRetry(retryCount + 1), 1000);
      } else {
        handleStartupError('Failed to load application after multiple attempts', err);
      }
    });
  };

  loadWithRetry();
}

/**
 * Handle startup errors gracefully
 */
function handleStartupError(message: string, error?: any): void {
  const errorMsg = error instanceof Error ? error.message : String(error || 'Unknown');
  const errorStack = error instanceof Error ? error.stack : '';
  
  // Log to diagnostic log
  logDebugMain(`[Main] CRITICAL STARTUP ERROR: ${message}`, error);
  
  // Write error to specific log file as well
  try {
    const logPath = path.join(app.getPath('userData'), 'startup-error.log');
    const logContent = `[${new Date().toISOString()}]\nMessage: ${message}\nError: ${errorMsg}\nStack: ${errorStack}\n__dirname: ${__dirname}\nresourcesPath: ${process.resourcesPath}\nisPackaged: ${app.isPackaged}\nNODE_ENV: ${process.env.NODE_ENV}\n\n`;
    fs.appendFileSync(logPath, logContent);
  } catch (logErr) {
    console.error('[Main] Failed to write error log:', logErr);
  }

  
  // Escape HTML entities in error messages
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  const errorHtml = `
    <html>
      <body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;overflow:auto;">
        <div style="max-width:700px;padding:20px;">
          <h1>⚠️ Application Error</h1>
          <p>${escapeHtml(message)}</p>
          <div style="margin:15px 0;padding:12px;background:#2a2a4e;border-radius:8px;text-align:left;font-size:13px;max-height:200px;overflow:auto;">
            <strong>Error:</strong> ${escapeHtml(errorMsg)}<br><br>
            <pre style="white-space:pre-wrap;word-break:break-all;margin:0;font-size:11px;opacity:0.8;">${escapeHtml(errorStack || 'No stack trace')}</pre>
          </div>
          <p>Please restart the application.</p>
          <button onclick="window.location.reload()" style="margin-top:10px;padding:10px 20px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;">
            Restart Application
          </button>
          <div style="margin-top:20px;font-size:12px;opacity:0.7;">
            Environment: ${isDev ? 'Development' : 'Production'}<br>
            Packaged: ${app.isPackaged ? 'Yes' : 'No'}<br>
            NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
          </div>
        </div>
      </body>
    </html>
  `;
  
  mainWindow?.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
  
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  
  mainWindow?.show();
}

/**
 * Pre-initialize database in background
 */
async function initializeDatabaseAsync(): Promise<void> {
  try {
    console.log('[Main] Pre-initializing database...');
    
    // Ensure userData directory exists before initializing database
    try {
      const userDataPath = app.getPath('userData');
      const fs = await import('fs');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
        console.log(`[Main] Created userData directory: ${userDataPath}`);
      }
    } catch (dirError) {
      console.error('[Main] Error ensuring userData directory exists:', dirError);
    }
    
    await initializeDatabase();
    startupMetrics.dbInitialized = Date.now() - startupMetrics.startTime;
    console.log('[Main] Database initialized successfully');
  } catch (error) {
    console.error('[Main] Database initialization failed:', error);
    // Don't fail startup for database issues
  }
}

/**
 * Log startup performance metrics
 */
function logStartupMetrics(): void {
  if (isDev) {
    console.log('[Performance] Startup Metrics:', {
      totalStartupTime: startupMetrics.appReady,
      windowCreation: startupMetrics.windowCreated,
      databaseInit: startupMetrics.dbInitialized,
      serverReady: startupMetrics.serverReady,
      timestamp: new Date().toISOString()
    });
  }
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
function setupCSP(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob: app-data: protocol-file:",
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
function setupAppDataProtocol(): void {
  protocol.handle('app-data', async (request) => {
    try {
      const filePath = decodeURIComponent(request.url.slice('app-data://'.length));
      const fullPath = path.join(app.getPath('userData'), 'uploads', filePath);

      // Check if file exists to avoid ERR_FILE_NOT_FOUND
      if (!fs.existsSync(fullPath)) {
        console.warn('[Protocol] app-data file not found:', fullPath);
        return new Response('Not Found', { status: 404 });
      }

      return net.fetch(pathToFileURL(fullPath).toString());
    } catch (error) {
      console.error('[Protocol] Error fetching app-data:', error);
      return new Response('Not Found', { status: 404 });
    }
  });
}

/**
 * Setup the protocol-file:// protocol handler for serving local files
 */
function setupProtocolFileProtocol(): void {
  protocol.handle('protocol-file', async (request) => {
    try {
      const filePath = decodeURIComponent(request.url.slice('protocol-file://'.length));
      const resolvedPath = path.resolve(filePath);

      // Security check: only allow access to specific directories
      const allowedDirectories = [
        path.join(app.getPath('userData')),
        path.join(__dirname, '../../public'),
        path.join(app.getAppPath(), 'public'),
      ];

      const isAllowed = allowedDirectories.some(dir =>
        resolvedPath.startsWith(path.resolve(dir))
      );

      if (!isAllowed) {
        console.error('[Protocol] Access denied to path:', filePath);
        return new Response('Access Denied', { status: 403 });
      }

      // Check if file exists to avoid ERR_FILE_NOT_FOUND
      if (!fs.existsSync(resolvedPath)) {
        console.warn('[Protocol] protocol-file not found:', resolvedPath);
        return new Response('Not Found', { status: 404 });
      }

      return net.fetch(pathToFileURL(resolvedPath).toString());
    } catch (error) {
      console.error('[Protocol] Error fetching protocol-file:', error);
      return new Response('Not Found', { status: 404 });
    }
  });
}

/**
 * Initialize the application with parallel processing
 */
app.whenReady().then(async () => {
  console.log('[Main] App ready, initializing...');
  
  // Start all initialization processes in parallel
  console.log('[Main] Starting parallel initialization...');
  
  // 1. Create splash screen immediately
  createSplashScreen();
  
  // 2. Create main window immediately (hidden)
  createWindow();
  
  // 3. Start database initialization in background
  const dbInitPromise = initializeDatabaseAsync();
  
  // 4. Start Next.js server initialization
  const serverInitPromise = initializeNextServer();
  
  // 5. Setup protocols and handlers asynchronously
  setImmediate(async () => {
    try {
      // Setup custom protocols
      setupAppDataProtocol();
      setupProtocolFileProtocol();
      
      // Wait for critical initializations: BOTH database AND server must be ready
      logDebugMain('[Main] Waiting for DB and Server initialization...');
      const results = await Promise.all([dbInitPromise, serverInitPromise]);
      const startUrl = results[1] as string;
      
      logDebugMain(`[Main] Critical services initialized (DB Ready, Server on ${startUrl})`);
      
      // Setup IPC handlers AFTER DB is ready to ensure bindings are correct
      logDebugMain('[Main] Registering IPC handlers...');
      setupHandlers(ipcMain);
      logDebugMain('[Main] IPC handlers registered successfully');
      
      // Setup CSP (lower priority)
      setupCSP();
      logDebugMain('[Main] CSP configured');
      
      logDebugMain('[Main] Loading main window...');
      
      // FINALLY load the main window after everything is ready
      loadMainWindow(startUrl);
      
    } catch (error) {
      logDebugMain('[Main] Error during async initialization', error);
      handleStartupError('Initialiation failed during parallel startup', error);
    }
  });

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
    logDebugMain('[Main] All windows closed, quitting...');
    app.quit();
  }
});


// Handle app errors
app.on('render-process-gone', (_event, _webContents, details) => {
  logDebugMain(`[Main] Render process gone. Reason: ${details.reason}, ExitCode: ${details.exitCode}`);
});


app.on('child-process-gone', (_event, details) => {
  logDebugMain(`[Main] Child process gone. Type: ${details.type}, Reason: ${details.reason}`);
});


// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logDebugMain('[Main] Uncaught Exception', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logDebugMain(`[Main] Unhandled Rejection at: ${promise}`, reason);
});


// Basic IPC handler for testing
ipcMain.handle('ping', () => 'pong');

// Export for testing
export { createWindow, mainWindow };
