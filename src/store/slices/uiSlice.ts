import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Ephemeral chrome state: the mobile drawer and the desktop sidebar collapse. */
interface UiState {
  mobileNavOpen: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UiState = {
  mobileNavOpen: false,
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setMobileNavOpen, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
