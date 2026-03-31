"use client";
// components/Providers.tsx
// -------------------------------------------------
// Decision: All client-side providers are composed
// here and imported once in the root layout.
// This keeps layout.tsx clean and server-compatible.
// -------------------------------------------------

import React, { useEffect, useMemo } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider } from "@emotion/react";
import { store, persistor } from "@/store";
import { buildMuiTheme } from "@/lib/muiTheme";
import { createEmotionCache } from "@/lib/emotionCache";
import { useAppSelector } from "@/store";
import { selectThemeMode } from "@/store/slices/themeSlice";
import { setUser } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store";
import { observeAuthState } from "@/services/auth.service";
import { useTheme } from "@/hooks/useTheme";

// Client-side Emotion cache (one per app)
const clientSideEmotionCache = createEmotionCache();

// ─── Inner provider: reads Redux state, applies MUI theme ────────────────────
function ThemeSync({ children }: { children: React.ReactNode }) {
  const mode  = useAppSelector(selectThemeMode);
  const theme = useMemo(() => buildMuiTheme(mode), [mode]);

  // Keep Tailwind dark class in sync
  useTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

// ─── Inner provider: observes Firebase auth state ────────────────────────────
function AuthObserver({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      dispatch(setUser(user));
    });
    return unsubscribe; // cleanup on unmount
  }, [dispatch]);

  return <>{children}</>;
}

// ─── Root providers composition ───────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ReduxProvider store={store}>
        {/* PersistGate delays render until persisted state is loaded */}
        <PersistGate loading={null} persistor={persistor}>
          <AuthObserver>
            <ThemeSync>
              {children}
            </ThemeSync>
          </AuthObserver>
        </PersistGate>
      </ReduxProvider>
    </CacheProvider>
  );
}
