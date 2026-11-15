'use client';

import React from 'react';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </AuthProvider>
  );
}
