'use client';

import { AppShell } from '@/components/AppShell';
import { StoreProvider } from '@/hooks/useStore';
import { UIProvider } from '@/hooks/useUI';

export default function Page() {
  return (
    <UIProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </UIProvider>
  );
}
