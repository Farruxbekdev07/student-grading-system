// hooks/useUsers.ts
// -------------------------------------------------
// Manages fetching and updating of the users list.
// Used by: admin panel, and indirectly profile page.
//
// v2 additions:
//   updateName(uid, name) — available to admin + self
//   updateRole(uid, role) — admin only
//
// Both follow the same optimistic pattern:
//   snapshot → apply locally → persist → rollback on error
// -------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import { AppUser, UserRole } from "@/types/user";
import {
  getAllUsers,
  updateUserName,
  updateUserRole,
} from "@/services/user.service";

interface UseUsersReturn {
  users:       AppUser[];
  loading:     boolean;
  error:       string | null;
  updatingId:  string | null;  // uid currently being saved (any field)
  changeRole:  (uid: string, role: UserRole) => Promise<void>;
  changeName:  (uid: string, name: string)   => Promise<void>;
  refetch:     () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const [users,      setUsers]      = useState<AppUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Generic optimistic updater ─────────────────────────────────────────────
  // Applies a partial patch optimistically, calls the async persister,
  // and rolls back the specific fields on failure.
  const optimisticUpdate = useCallback(async (
    uid:       string,
    patch:     Partial<AppUser>,
    persister: () => Promise<void>
  ): Promise<void> => {
    const previous = users.find((u) => u.uid === uid);
    if (!previous) return;

    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...patch } : u));
    setUpdatingId(uid);
    setError(null);

    try {
      await persister();
    } catch (err) {
      // Rollback exactly the fields we changed
      setUsers((prev) =>
        prev.map((u) => u.uid === uid ? { ...u, ...previous } : u)
      );
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdatingId(null);
    }
  }, [users]);

  const changeRole = useCallback((uid: string, role: UserRole) =>
    optimisticUpdate(uid, { role }, () => updateUserRole(uid, role)),
  [optimisticUpdate]);

  const changeName = useCallback((uid: string, name: string) =>
    optimisticUpdate(uid, { name: name.trim() }, () => updateUserName(uid, name)),
  [optimisticUpdate]);

  return {
    users,
    loading,
    error,
    updatingId,
    changeRole,
    changeName,
    refetch: fetchUsers,
  };
}

