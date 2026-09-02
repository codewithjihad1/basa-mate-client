"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { initStoreListeners, makeStore, type AppStore } from "@/store";

/**
 * Creates exactly one store per browser session and hands it to react-redux.
 *
 * The store is built in a ref rather than at module scope so that server rendering
 * never shares a cache between requests.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = makeStore();
    initStoreListeners(storeRef.current);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
