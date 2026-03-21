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

// NextJS Cloudflare context type
declare module '@cloudflare/next-on-pages' {
  interface CloudflareInternalEnv extends CloudflareEnv {}
}

export {};
