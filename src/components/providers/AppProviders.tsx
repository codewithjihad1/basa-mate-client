"use client";

import { Toaster } from "sonner";
import { StoreProvider } from "./StoreProvider";
import { SessionProvider } from "./SessionProvider";

/** Every client-side provider, mounted once at the root layout. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <SessionProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </SessionProvider>
    </StoreProvider>
  );
}
