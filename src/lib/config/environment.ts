import { z } from 'zod';

// Environment variable schemas
const clientEnvSchema = z.object({
  // Next.js
  NEXT_PUBLIC_APP_NAME: z.string().default('School Nexus'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('2.0.0'),
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_DESKTOP: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_LOGGING: z.string().transform(val => val === 'true').default('true'),
});

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().default('file:./dev.db'),
  
  // Authentication
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32).default('development-secret-change-in-production'),
  
  // JWT
  JWT_SECRET: z.string().min(32).default('development-jwt-secret-change-in-production'),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  
  // Security
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'), // 100 requests per window
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

// Type inference
type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

// Environment configuration class
export class EnvironmentConfig {
  private static clientEnv: ClientEnv | null = null;
  private static serverEnv: ServerEnv | null = null;

  // Get client-side environment variables
  static getClientEnv(): ClientEnv {
    if (!this.clientEnv) {
      const env = {
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_ENABLE_DESKTOP: process.env.NEXT_PUBLIC_ENABLE_DESKTOP,
        NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
        NEXT_PUBLIC_ENABLE_LOGGING: process.env.NEXT_PUBLIC_ENABLE_LOGGING,
      };
      
      const result = clientEnvSchema.safeParse(env);
      if (!result.success) {
        console.error('Client environment validation failed:', result.error.flatten());
        throw new Error('Invalid client environment configuration');
      }
      
      this.clientEnv = result.data;
    }
    
    return this.clientEnv;
  }

  // Get server-side environment variables
  static getServerEnv(): ServerEnv {
    if (!this.serverEnv) {
      const env = {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        JWT_SECRET: process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        UPLOAD_DIR: process.env.UPLOAD_DIR,
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        EMAIL_FROM: process.env.EMAIL_FROM,
      };
      
      const result = serverEnvSchema.safeParse(env);
      if (!result.success) {
        console.error('Server environment validation failed:', result.error.flatten());
        throw new Error('Invalid server environment configuration');
      }
      
      this.serverEnv = result.data;
    }
    
    return this.serverEnv;
  }

  // Check if we're in development
  static isDevelopment(): boolean {
    return this.getServerEnv().NODE_ENV === 'development';
  }

  // Check if we're in production
  static isProduction(): boolean {
    return this.getServerEnv().NODE_ENV === 'production';
  }

  // Check if we're in test mode
  static isTest(): boolean {
    return this.getServerEnv().NODE_ENV === 'test';
  }

  // Get current environment
  static getEnvironment(): 'development' | 'production' | 'test' {
    return this.getServerEnv().NODE_ENV;
  }

  // Get database configuration
  static getDatabaseConfig() {
    const serverEnv = this.getServerEnv();
    return {
      url: serverEnv.DATABASE_URL,
      enableLogging: this.isDevelopment(),
    };
  }

  // Get authentication configuration
  static getAuthConfig() {
    const serverEnv = this.getServerEnv();
    return {
      url: serverEnv.NEXTAUTH_URL,
      secret: serverEnv.NEXTAUTH_SECRET,
      jwtSecret: serverEnv.JWT_SECRET,
    };
  }

  // Get file upload configuration
  static getFileUploadConfig() {
    const serverEnv = this.getServerEnv();
    return {
      uploadDir: serverEnv.UPLOAD_DIR,
      maxFileSize: serverEnv.MAX_FILE_SIZE,
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ],
    };
  }

  // Get rate limiting configuration
  static getRateLimitConfig() {
    const serverEnv = this.getServerEnv();
    return {
      windowMs: serverEnv.RATE_LIMIT_WINDOW,
      max: serverEnv.RATE_LIMIT_MAX,
    };
  }

  // Get email configuration (if available)
  static getEmailConfig() {
    const serverEnv = this.getServerEnv();
    if (serverEnv.SMTP_HOST && serverEnv.SMTP_PORT) {
      return {
        host: serverEnv.SMTP_HOST,
        port: serverEnv.SMTP_PORT,
        auth: {
          user: serverEnv.SMTP_USER,
          pass: serverEnv.SMTP_PASS,
        },
        from: serverEnv.EMAIL_FROM || 'noreply@schoolnexus.com',
      };
    }
    return null;
  }

  // Validate all environment configurations
  static validateAll() {
    try {
      this.getClientEnv();
      this.getServerEnv();
      return true;
    } catch (error) {
      console.error('Environment validation failed:', error);
      return false;
    }
  }

  // Get configuration summary (safe for logging)
  static getConfigSummary() {
    const serverEnv = this.getServerEnv();
    const clientEnv = this.getClientEnv();
    
    return {
      environment: serverEnv.NODE_ENV,
      appName: clientEnv.NEXT_PUBLIC_APP_NAME,
      appVersion: clientEnv.NEXT_PUBLIC_APP_VERSION,
      baseUrl: clientEnv.NEXT_PUBLIC_BASE_URL,
      databaseUrl: serverEnv.DATABASE_URL ? `${serverEnv.DATABASE_URL.substring(0, 20)}...` : 'Not configured',
      authUrl: serverEnv.NEXTAUTH_URL,
      uploadDir: serverEnv.UPLOAD_DIR,
      maxFileSize: `${(serverEnv.MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      rateLimit: `${serverEnv.RATE_LIMIT_MAX} requests per ${(serverEnv.RATE_LIMIT_WINDOW / 60000).toFixed(0)} minutes`,
      emailConfigured: !!this.getEmailConfig(),
      features: {
        desktop: clientEnv.NEXT_PUBLIC_ENABLE_DESKTOP,
        analytics: clientEnv.NEXT_PUBLIC_ENABLE_ANALYTICS,
        logging: clientEnv.NEXT_PUBLIC_ENABLE_LOGGING,
      }
    };
  }
}