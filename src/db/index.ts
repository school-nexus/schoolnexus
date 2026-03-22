// Universal Database Entry Point
// This file is safe to import in Web/Edge contexts as it avoids top-level native imports.

export * from './schema';

/**
 * Note: For the Web/Cloudflare context, you should use:
 * import { getWebDb } from '@/db/index-web';
 * 
 * For the Electron context, you should use:
 * import { db } from '@/db/index-electron';
 */

export const isElectron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;
export const isEdge = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
