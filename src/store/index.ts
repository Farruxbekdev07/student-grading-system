// store/index.ts
// -------------------------------------------------
// Decision: redux-persist is used only for themeSlice
// (so dark/light preference survives refresh).
// authSlice is NOT persisted — we rely on Firebase's
// own auth state observer (observeAuthState) to
// rehydrate, keeping tokens fresh automatically.
// -------------------------------------------------

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import {
  persistStore,
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from "redux-persist";

import authReducer  from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";

// ─── Persist config for theme only ───────────────────────────────────────────
// We use a lazy import so this only runs on the client (storage is browser-only)
let storage: typeof import("redux-persist/lib/storage").default;

if (typeof window !== "undefined") {
  storage = require("redux-persist/lib/storage").default;
} else {
  // Minimal no-op storage for SSR
  storage = {
    getItem:    async () => null,
    setItem:    async () => {},
    removeItem: async () => {},
  } as typeof storage;
}

const themePersistConfig = {
  key: "theme",
  storage,
  whitelist: ["mode"],
};

const rootReducer = combineReducers({
  auth:  authReducer,
  theme: persistReducer(themePersistConfig, themeReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Required when using redux-persist
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// ─── Types ────────────────────────────────────────────────────────────────────
export type RootState    = ReturnType<typeof store.getState>;
export type AppDispatch  = typeof store.dispatch;

// ─── Typed hooks (use these instead of raw useSelector/useDispatch) ───────────
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
