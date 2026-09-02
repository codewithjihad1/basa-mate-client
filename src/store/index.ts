import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "./api/apiSlice";
import { persistenceMiddleware } from "./persistence";
import authReducer from "./slices/authSlice";
import workspaceReducer from "./slices/workspaceSlice";
import uiReducer from "./slices/uiSlice";

// Registers every endpoint on `apiSlice` before the store is created.
import "./api/endpoints";

/**
 * A store factory rather than a module-level singleton: under the App Router the
 * module graph is shared across requests on the server, so one global store would
 * leak one user's cache into another's render. `StoreProvider` creates one per client.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      workspace: workspaceReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware, persistenceMiddleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

/** Enables `refetchOnFocus` / `refetchOnReconnect`. */
export const initStoreListeners = (store: AppStore) => setupListeners(store.dispatch);
