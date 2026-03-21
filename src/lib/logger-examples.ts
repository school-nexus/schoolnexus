// Usage examples for the logging system

import { Logger } from '@/lib/logger';

// Basic logging
Logger.debug('Debug message', { userId: 123 });
Logger.info('User logged in', { userId: 123, email: 'user@example.com' });
Logger.warn('Low disk space', { available: '2.5GB', threshold: '1GB' });
Logger.error('Database connection failed', { error: 'Connection timeout' });

// Component-specific logging
const dashboardLogger = Logger.component('Dashboard');
dashboardLogger.info('Dashboard loaded');
dashboardLogger.error('Failed to load reports', { error: 'API timeout' });

// Performance logging
const result = Logger.time('Data processing', () => {
  // Heavy computation
  return processData();
});

// Async performance logging
const asyncResult = await Logger.timeAsync('API fetch', async () => {
  return await fetch('/api/data');
});

// Function to simulate data processing
function processData() {
  // Simulate heavy computation
  return { processed: true, data: [1, 2, 3, 4, 5] };
}

// Example of how to use error boundary with logging in a React component:
/*
class ComponentWithErrorBoundary extends Component {
  render() {
    return (
      <ErrorBoundary 
        fallback={<CustomErrorComponent />}
        onError={(error, errorInfo) => {
          Logger.error('Component error', { error, errorInfo });
        }}
      >
        <MyComponent />
      </ErrorBoundary>
    );
  }
}
*/