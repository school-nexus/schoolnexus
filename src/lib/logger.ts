// Dynamic imports for Node.js/Electron to avoid Edge Runtime build errors
let nodePath: any = null;
let nodeFs: any = null;

/**
 * Universal Logger for School Nexus
 * - Browser: Safe console logging
 * - Main Process: Persistent file logging in userData/debug.log
 */

// Helper to determine environment
const isBrowser = typeof window !== 'undefined';

/**
 * Diagnostic logger for the main process
 */
export function logDebug(message: string, error?: unknown): void {
  if (isBrowser) {
    console.log(`[Debug] ${message}`, error || '');
    return;
  }

  // Node.js / Main Process context
  try {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error 
      ? ` | ERROR: ${error.message}${error.stack ? `\nSTACK: ${error.stack}` : ''}` 
      : error ? ` | ERROR: ${String(error)}` : '';
    const logMessage = `[${timestamp}] ${message}${errorMsg}\n`;
    
    // Console log for terminal visibility
    console.log(`[Debug] ${message}`, error || '');
    
    // Dynamic require for Node.js/Electron to avoid browser/edge side build errors
    try {
        if (!nodePath || !nodeFs) {
            // We use eval('require') to hide it from bundlers like Turbopack/Vite
            nodePath = eval('require')('path');
            nodeFs = eval('require')('fs');
        }
        
        let logDir: string;
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
            const electron = eval('require')('electron');
            logDir = electron.app.getPath('userData');
        } else {
            logDir = process.cwd();
        }
        
        const logPath = nodePath.join(logDir, 'debug.log');
        
        if (!nodeFs.existsSync(logDir)) {
          nodeFs.mkdirSync(logDir, { recursive: true });
        }
        
        nodeFs.appendFileSync(logPath, logMessage);
    } catch (requireErr) {
        // If require fails (e.g. on Edge/Browser), we just skip file logging
        // No need to log this error to avoid infinite loops
    }
  } catch (err) {
    console.error('Failed to write to debug.log:', err);
  }
}

/**
 * Logger object for backward compatibility and feature-rich logging
 */
export const Logger = {
  log: (message: string, data?: unknown) => logDebug(`[INFO] ${message}`, data),
  debug: (message: string, data?: unknown) => logDebug(`[DEBUG] ${message}`, data),
  info: (message: string, data?: unknown) => logDebug(`[INFO] ${message}`, data),
  warn: (message: string, data?: unknown) => logDebug(`[WARN] ${message}`, data),
  error: (message: string, data?: unknown) => logDebug(`[ERROR] ${message}`, data),
  
  // Component-specific logger
  component: (name: string) => ({
    debug: (message: string, data?: unknown) => logDebug(`[DEBUG][${name}] ${message}`, data),
    info: (message: string, data?: unknown) => logDebug(`[INFO][${name}] ${message}`, data),
    warn: (message: string, data?: unknown) => logDebug(`[WARN][${name}] ${message}`, data),
    error: (message: string, data?: unknown) => logDebug(`[ERROR][${name}] ${message}`, data),
  }),

  // Performance logging (Sync)
  time: <T>(label: string, fn: () => T): T => {
    const start = Date.now();
    try {
      const result = fn();
      logDebug(`[TIME] ${label}: ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      logDebug(`[TIME][ERROR] ${label} failed after ${Date.now() - start}ms`, error);
      throw error;
    }
  },

  // Performance logging (Async)
  timeAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      logDebug(`[TIME] ${label}: ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      logDebug(`[TIME][ERROR] ${label} failed after ${Date.now() - start}ms`, error);
      throw error;
    }
  }
};