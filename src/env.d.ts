/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
  }

  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

// OpenNext Cloudflare context type
declare module '@opennextjs/cloudflare' {
  interface CloudflareInternalEnv extends CloudflareEnv {}
}

export {};
