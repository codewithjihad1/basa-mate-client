import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BasaId, CycleId } from "@/types/api";

/**
 * Which basa and billing cycle the UI is currently scoped to.
 *
 * Only the basa id is persisted (see `persistence.ts`) — an id is not a credential,
 * and the role that goes with it is always re-read from the server. The active cycle
 * is derived per basa and reset whenever the basa changes, so cycle-scoped screens
 * can never render one basa's cycle against another's data.
 */
interface WorkspaceState {
  activeBasaId: BasaId | null;
  activeCycleId: CycleId | null;
  /** True until we've resolved the persisted basa against the user's memberships. */
  hydrated: boolean;
}

const initialState: WorkspaceState = {
  activeBasaId: null,
  activeCycleId: null,
  hydrated: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setActiveBasa(state, action: PayloadAction<BasaId | null>) {
      if (state.activeBasaId !== action.payload) {
        state.activeCycleId = null;
      }
      state.activeBasaId = action.payload;
      state.hydrated = true;
    },
    setActiveCycle(state, action: PayloadAction<CycleId | null>) {
      state.activeCycleId = action.payload;
    },
    markHydrated(state) {
      state.hydrated = true;
    },
    resetWorkspace: () => initialState,
  },
});

export const { setActiveBasa, setActiveCycle, markHydrated, resetWorkspace } =
  workspaceSlice.actions;
export default workspaceSlice.reducer;
