// Universal Logger for School Nexus

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
    
    // Console log for terminal visibility (Safe for both environments)
    console.log(`[Debug] ${message}`, error || '');
    
    // SKIP file logging in Edge Runtime to avoid build errors
    if (process.env.NEXT_RUNTIME === 'edge') {
      return;
    }

    // Dynamic imports for Node.js/Electron context only
    // This part is skipped during Edge build if guarded properly
    // or handled by the try/catch if it's a standard Node environment
    try {
        // We use standard require ONLY in Node/Electron environments
        // If this is the browser, this block is unreachable due to the isBrowser check above
        if (typeof process !== 'undefined' && process.versions && (process.versions as any).node) {
            const fs = require('fs');
            const path = require('path');
            
            let logDir: string;
            if ((process.versions as any).electron) {
                const electron = require('electron');
                logDir = (electron.app || electron.remote.app).getPath('userData');
            } else {
                logDir = process.cwd();
            }
            
            const logPath = path.join(logDir, 'debug.log');
            
            if (!fs.existsSync(logDir)) {
              fs.mkdirSync(logDir, { recursive: true });
            }
            
            fs.appendFileSync(logPath, logMessage);
        }
    } catch (ignore) {
        // Fallback for environments where require is not defined
    }
  } catch (err) {
    // Last resort safety
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