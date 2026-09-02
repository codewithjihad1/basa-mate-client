"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { initStoreListeners, makeStore, type AppStore } from "@/store";

/**
 * Creates exactly one store per browser session and hands it to react-redux.
 *
 * A lazy `useState` initializer rather than a ref: the store is state the render
 * actually reads, and reading `ref.current` during render is not safe under the
 * React Compiler. The initializer runs once, so the store is never rebuilt.
 *
 * It is built here rather than at module scope so that server rendering never
 * shares one user's cache with another request.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => {
    const created = makeStore();
    initStoreListeners(created);
    return created;
  });

  return <Provider store={store}>{children}</Provider>;
}
