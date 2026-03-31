"use client";
// app/(dashboard)/profile/page.tsx
// -------------------------------------------------
// Self-edit profile page — accessible to all roles.
// Allows the user to update their own name only.
// Email and role are shown read-only:
//   - email: Firebase Auth limitation (see tooltip)
//   - role:  can only be changed by an admin
//
// Uses updateUserName from user.service.ts directly
// (not useUsers — that hook fetches all users, which
// is admin-only. This page only touches the current
// user's own document, which Firestore rules permit.)
// -------------------------------------------------

import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import SaveIcon from "@mui/icons-material/Save";
import { RouteGuard } from "@/components/RouteGuard";
import { useAppSelector, useAppDispatch } from "@/store";
import { selectUser, setUser } from "@/store/slices/authSlice";
import { updateUserName } from "@/services/user.service";

// Role chip colours (same mapping as admin panel)
const ROLE_COLORS = {
  admin:   "error",
  teacher: "secondary",
  student: "primary",
} as const;

// ─── Profile form ─────────────────────────────────────────────────────────────
function ProfilePanel() {
  const dispatch = useAppDispatch();
  const user     = useAppSelector(selectUser);

  // Local form state — initialised from Redux, editable locally
  const [name,    setName]    = useState(user?.name ?? "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<string | null>(null);

  // Keep local form in sync if Redux user changes (e.g. after admin edit)
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const isDirty    = name.trim() !== (user?.name ?? "");
  const nameEmpty  = !name.trim();
  const canSave    = isDirty && !nameEmpty && !saving;

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    setError(null);

    try {
      await updateUserName(user.uid, name);

      // Update Redux authSlice so the Navbar and all other consumers
      // reflect the new name without a page reload
      dispatch(setUser({ ...user, name: name.trim() }));
      setToast("Name updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name.");
      // Restore previous name on failure
      setName(user.name);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex flex-col gap-6 max-w-lg">

      {/* Header */}
      <div className="flex items-center gap-3">
        <PersonIcon color="primary" />
        <div>
          <Typography variant="h5" fontWeight={700}>My Profile</Typography>
          <Typography variant="body2" color="text.secondary">
            Update your display name.
          </Typography>
        </div>
      </div>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent className="p-6 flex flex-col gap-5">

          {/* Avatar + role badge */}
          <div className="flex items-center gap-4">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <Typography variant="h6" fontWeight={600}>{user.name}</Typography>
              <Chip
                label={user.role}
                size="small"
                color={ROLE_COLORS[user.role]}
                variant="outlined"
                sx={{ textTransform: "capitalize", mt: 0.5 }}
              />
            </div>
          </div>

          <Divider />

          {/* Name — editable */}
          <TextField
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            required
            fullWidth
            size="small"
            error={nameEmpty}
            helperText={nameEmpty ? "Name cannot be empty." : "This is how your name appears across the platform."}
          />

          {/* Email — read-only */}
          <Tooltip
            title="Email cannot be changed from this page. It is managed by Firebase Authentication."
            placement="top-start"
          >
            <TextField
              label="Email"
              value={user.email}
              disabled
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <LockIcon fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
              helperText="Read-only — managed by Firebase Auth"
            />
          </Tooltip>

          {/* Role — read-only with explanation */}
          <Tooltip
            title="Your role can only be changed by an administrator."
            placement="top-start"
          >
            <TextField
              label="Role"
              value={user.role}
              disabled
              fullWidth
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <LockIcon fontSize="small" color="disabled" />
                  </InputAdornment>
                ),
              }}
              helperText="Read-only — assigned by your administrator"
              sx={{ "& input": { textTransform: "capitalize" } }}
            />
          </Tooltip>

          {/* Error */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              variant="contained"
              disabled={!canSave}
              onClick={handleSave}
              startIcon={
                saving
                  ? <CircularProgress size={14} color="inherit" />
                  : <SaveIcon />
              }
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Success toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
}

// All roles can access their own profile — no role restriction needed
export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfilePanel />
    </RouteGuard>
  );
}
