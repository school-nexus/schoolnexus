import { Logger } from './logger';

// Global error handlers
export class GlobalErrorHandlers {
  static initialize() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      Logger.error('Uncaught JavaScript Error', {
        message: event.error?.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      Logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
        url: window.location.href
      });
    });

    // Handle fetch errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        if (!response.ok) {
          Logger.warn('HTTP Request Failed', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            method: args[1]?.method || 'GET'
          });
        }
        return response;
      } catch (error) {
        Logger.error('Fetch Error', {
          url: args[0],
          error: error instanceof Error ? error.message : 'Unknown error',
          method: args[1]?.method || 'GET'
        });
        throw error;
      }
    };
  }
}