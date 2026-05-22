'use client';

import { SessionProvider } from 'next-auth/react';
import FloatingAssistant from '@/components/FloatingAssistant';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <FloatingAssistant />
    </SessionProvider>
  );
}
