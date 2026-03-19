'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import { SessionProvider } from '@/components/session-provider';
import { QueryProvider } from '@/lib/query-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark">
        <ToastProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
