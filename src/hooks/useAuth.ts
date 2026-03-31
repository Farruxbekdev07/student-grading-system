// hooks/useAuth.ts
// -------------------------------------------------
// Decision: Hooks are the bridge between services
// and components. They hold no business logic —
// they dispatch actions and call the service layer.
// -------------------------------------------------

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectUser, selectRole, selectLoading, selectError, setUser, setLoading, setError, clearAuth } from "@/store/slices/authSlice";
import * as authService from "@/services/auth.service";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router   = useRouter();

  const user    = useAppSelector(selectUser);
  const role    = useAppSelector(selectRole);
  const loading = useAppSelector(selectLoading);
  const error   = useAppSelector(selectError);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const appUser = await authService.signUp(email, password, name);
        dispatch(setUser(appUser));
        router.push(authService.getDashboardPath(appUser.role));
      } catch (err: unknown) {
        dispatch(setError(err instanceof Error ? err.message : "Sign up failed"));
      }
    },
    [dispatch, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const appUser = await authService.login(email, password);
        dispatch(setUser(appUser));
        router.push(authService.getDashboardPath(appUser.role));
      } catch (err: unknown) {
        dispatch(setError(err instanceof Error ? err.message : "Login failed"));
      }
    },
    [dispatch, router]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(clearAuth());
    router.push("/login");
  }, [dispatch, router]);

  return { user, role, loading, error, signUp, login, logout };
}
