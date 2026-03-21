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

  try {
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error 
      ? ` | ERROR: ${error.message}${error.stack ? `\nSTACK: ${error.stack}` : ''}` 
      : error ? ` | ERROR: ${String(error)}` : '';
    
    // Console log for terminal visibility (Safe for both environments)
    console.log(`[${timestamp}] ${message}${errorMsg}`);
  } catch (err) {
    // Last resort safety
    console.error('Logging failed:', err);
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