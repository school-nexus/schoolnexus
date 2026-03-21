import { EnvironmentConfig } from './environment';

// Initialize environment configuration
export function initializeConfig() {
  try {
    // Validate environment configuration
    const isValid = EnvironmentConfig.validateAll();
    
    if (!isValid) {
      throw new Error('Environment configuration validation failed');
    }

    // Log configuration summary in development
    if (EnvironmentConfig.isDevelopment()) {
      console.log('🔧 Environment Configuration:', EnvironmentConfig.getConfigSummary());
    }

    console.log(`✅ Environment configuration initialized for ${EnvironmentConfig.getEnvironment()} mode`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize environment configuration:', error);
    throw error;
  }
}

// Export configuration utilities
export { EnvironmentConfig };

// Re-export for convenience
export const config = {
  env: EnvironmentConfig.getServerEnv(),
  client: EnvironmentConfig.getClientEnv(),
  database: EnvironmentConfig.getDatabaseConfig(),
  auth: EnvironmentConfig.getAuthConfig(),
  upload: EnvironmentConfig.getFileUploadConfig(),
  rateLimit: EnvironmentConfig.getRateLimitConfig(),
  email: EnvironmentConfig.getEmailConfig(),
  isDevelopment: EnvironmentConfig.isDevelopment,
  isProduction: EnvironmentConfig.isProduction,
  isTest: EnvironmentConfig.isTest,
};