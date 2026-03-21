# Environment Configuration Guide

## Overview

School Nexus uses a comprehensive environment configuration system with validation and type safety.

## Environment Files

### Development
Create `.env.local` for local development:
```env
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-min-32-characters"
JWT_SECRET="your-jwt-secret-key-here-min-32-characters"

# App
NODE_ENV="development"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Feature Flags
NEXT_PUBLIC_ENABLE_DESKTOP="false"
NEXT_PUBLIC_ENABLE_ANALYTICS="false"
NEXT_PUBLIC_ENABLE_LOGGING="true"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX="100"

# Email (Optional)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
# EMAIL_FROM="noreply@schoolnexus.com"
```

### Production
Create `.env.production` for production:
```env
# Database
DATABASE_URL="file:./prod.db"

# Next.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-key-here-min-32-characters"
JWT_SECRET="your-production-jwt-secret-here-min-32-characters"

# App
NODE_ENV="production"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"

# Feature Flags
NEXT_PUBLIC_ENABLE_DESKTOP="true"
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_LOGGING="true"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"
RATE_LIMIT_MAX="50"

# Email
SMTP_HOST="your-smtp-host.com"
SMTP_PORT="587"
SMTP_USER="your-production-email@domain.com"
SMTP_PASS="your-production-password"
EMAIL_FROM="noreply@schoolnexus.com"
```

## Configuration Access

### Server-side Configuration
```typescript
import { config } from '@/lib/config';

// Database configuration
const dbConfig = config.database;

// Authentication configuration
const authConfig = config.auth;

// File upload configuration
const uploadConfig = config.upload;

// Rate limiting configuration
const rateLimitConfig = config.rateLimit;

// Email configuration (if available)
const emailConfig = config.email;
```

### Client-side Configuration
```typescript
import { config } from '@/lib/config';

// Client environment variables
const clientConfig = config.client;

// Check environment
if (config.isDevelopment()) {
  console.log('Running in development mode');
}

if (config.isProduction()) {
  console.log('Running in production mode');
}
```

## Configuration Validation

The system automatically validates all environment variables at startup:

```typescript
// This runs automatically in the application layout
import { initializeConfig } from '@/lib/config';

try {
  initializeConfig();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error);
}
```

## Environment-specific Features

### Development Mode
- Detailed logging enabled
- Debug information shown
- Relaxed rate limits
- Enhanced error messages

### Production Mode
- Minimal logging
- Strict rate limits
- Security-focused configuration
- Optimized performance

### Test Mode
- Mock services
- Test database
- Disabled external integrations
- Fast configuration validation

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong secrets** (minimum 32 characters)
3. **Rotate secrets** regularly
4. **Use different secrets** for different environments
5. **Validate all inputs** before processing
6. **Log security events** appropriately

## Troubleshooting

### Common Issues

1. **Validation Errors**: Check that all required variables are set
2. **Type Errors**: Ensure variables match expected types
3. **Permission Issues**: Verify file paths and directory permissions
4. **Network Issues**: Check SMTP and database connectivity

### Debugging Configuration

```typescript
// Get detailed configuration summary
console.log(EnvironmentConfig.getConfigSummary());

// Check specific configuration sections
console.log('Database:', config.database);
console.log('Auth:', config.auth);
console.log('Upload:', config.upload);
```

## Advanced Configuration

### Custom Environment Variables
Add to the schema in `src/lib/config/environment.ts`:

```typescript
const serverEnvSchema = z.object({
  // ... existing variables
  CUSTOM_VARIABLE: z.string().optional().default('default-value'),
});
```

### Environment-specific Logic
```typescript
import { EnvironmentConfig } from '@/lib/config';

if (EnvironmentConfig.isDevelopment()) {
  // Development-specific logic
} else if (EnvironmentConfig.isProduction()) {
  // Production-specific logic
}
```

This configuration system ensures type safety, validation, and proper environment management across all deployment scenarios.