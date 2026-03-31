// store/slices/authSlice.ts
// -------------------------------------------------
// Decision: Auth state is stored in Redux (not Context)
// so any component tree level can read it without
// prop drilling. redux-persist rehydrates it from
// localStorage after page refresh.
// -------------------------------------------------

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppUser } from "@/types/user";

interface AuthState {
  user: AppUser | null;
  loading: boolean; // true while observeAuthState is running
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true, // start true; set false once observer fires
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    clearAuth(state) {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
import type { RootState } from "@/store";
export const selectUser    = (state: RootState) => state.auth.user;
export const selectRole    = (state: RootState) => state.auth.user?.role ?? null;
export const selectLoading = (state: RootState) => state.auth.loading;
export const selectError   = (state: RootState) => state.auth.error;
