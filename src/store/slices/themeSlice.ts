// store/slices/themeSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleTheme(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
  },
});

export const { setThemeMode, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeMode = (state: RootState) => state.theme.mode;
