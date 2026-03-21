import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'sonner';
import { ConfirmProvider } from '@/components/providers/confirm-provider';
import StyledJsxRegistry from '@/lib/registry';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { GlobalErrorHandlers } from '@/lib/error-handlers';
import { Logger } from '@/lib/logger';
import { initializeConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'School Nexus - School Management System',
  description: 'Modern, comprehensive school management system',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize configuration, error handlers and logger
  if (typeof window !== 'undefined') {
    try {
      initializeConfig();
      GlobalErrorHandlers.initialize();
      Logger.info('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      Logger.error('Application initialization failed', { error });
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <StyledJsxRegistry>
          <ErrorBoundary>
            <AuthProvider>
              <AppProvider>
                <ConfirmProvider>
                  {children}
                  <Toaster position="top-right" richColors />
                </ConfirmProvider>
              </AppProvider>
            </AuthProvider>
          </ErrorBoundary>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}

