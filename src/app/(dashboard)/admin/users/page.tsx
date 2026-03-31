"use client";
// app/(dashboard)/admin/users/page.tsx
// -------------------------------------------------
// v2: replaced inline role-select with an Edit modal
// that lets admin update both name and role in one flow.
// Email is shown read-only with an explanatory tooltip.
//
// Protection layers (unchanged):
//   1. middleware.ts — auth-token cookie check (Edge)
//   2. RouteGuard  — allowedRoles=["admin"] (client)
// All mutations delegate to useUsers() → user.service.ts
// -------------------------------------------------

import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import SearchIcon from "@mui/icons-material/Search";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import { RouteGuard } from "@/components/RouteGuard";
import { useUsers } from "@/hooks/useUsers";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { UserRole, AppUser } from "@/types/user";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<UserRole, "error" | "secondary" | "primary"> = {
  admin:   "error",
  teacher: "secondary",
  student: "primary",
};
const ROLES: UserRole[] = ["student", "teacher", "admin"];

// ─── Edit modal state shape ───────────────────────────────────────────────────
interface EditState {
  open:   boolean;
  uid:    string;
  name:   string;
  email:  string;
  role:   UserRole;
  isSelf: boolean;
}

const EDIT_CLOSED: EditState = {
  open: false, uid: "", name: "", email: "", role: "student", isSelf: false,
};

// ─── Edit User Dialog ─────────────────────────────────────────────────────────
function EditUserDialog({
  state,
  saving,
  onNameChange,
  onRoleChange,
  onSave,
  onClose,
}: {
  state:        EditState;
  saving:       boolean;
  onNameChange: (name: string) => void;
  onRoleChange: (role: UserRole) => void;
  onSave:       () => void;
  onClose:      () => void;
}) {
  const nameEmpty = !state.name.trim();

  return (
    <Dialog
      open={state.open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit User</DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Name — editable */}
        <TextField
          label="Full name"
          value={state.name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={saving}
          required
          fullWidth
          size="small"
          error={nameEmpty}
          helperText={nameEmpty ? "Name cannot be empty." : undefined}
          autoFocus
        />

        {/* Email — read-only */}
        <Tooltip
          title="Email cannot be changed here. It is managed by Firebase Authentication and can only be updated by the account owner."
          placement="top-start"
        >
          <TextField
            label="Email"
            value={state.email}
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

        {/* Role — disabled for self */}
        <Tooltip
          title={state.isSelf ? "You cannot change your own role." : ""}
          placement="top-start"
        >
          <FormControl size="small" fullWidth disabled={saving || state.isSelf}>
            <InputLabel>Role</InputLabel>
            <Select
              value={state.role}
              label="Role"
              onChange={(e: SelectChangeEvent) =>
                onRoleChange(e.target.value as UserRole)
              }
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>
                  <Chip
                    label={r}
                    size="small"
                    color={ROLE_COLORS[r]}
                    variant="outlined"
                    sx={{ textTransform: "capitalize", mr: 1, minWidth: 64 }}
                  />
                </MenuItem>
              ))}
            </Select>
            {state.isSelf && (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, ml: 1.5 }}>
                Cannot change your own role
              </Typography>
            )}
          </FormControl>
        </Tooltip>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined" color="inherit" size="small">
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={saving || nameEmpty}
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── User table row ───────────────────────────────────────────────────────────
function UserRow({
  user,
  isSelf,
  isUpdating,
  onEdit,
}: {
  user:       AppUser;
  isSelf:     boolean;
  isUpdating: boolean;
  onEdit:     (user: AppUser) => void;
}) {
  return (
    <TableRow
      hover
      sx={{
        opacity: isUpdating ? 0.6 : 1,
        transition: "opacity 0.2s",
        ...(isSelf && { backgroundColor: "action.hover" }),
      }}
    >
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {user.name}
            {isSelf && <Chip label="you" size="small" sx={{ ml: 1, fontSize: 10 }} />}
          </Typography>
          <Typography variant="caption" color="text.secondary" className="font-mono">
            {user.uid}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{user.email}</Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={user.role}
          size="small"
          color={ROLE_COLORS[user.role]}
          variant="outlined"
          sx={{ textTransform: "capitalize", minWidth: 72 }}
        />
      </TableCell>

      <TableCell align="right">
        {isUpdating ? (
          <CircularProgress size={20} />
        ) : (
          <Tooltip title="Edit user">
            <IconButton size="small" onClick={() => onEdit(user)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
function AdminUsersPanel() {
  const currentUser = useAppSelector(selectUser);
  const {
    users, loading, error, updatingId,
    changeRole, changeName, refetch,
  } = useUsers();

  const [search, setSearch] = useState("");
  const [toast,  setToast]  = useState<string | null>(null);
  const [edit,   setEdit]   = useState<EditState>(EDIT_CLOSED);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = users.reduce(
    (acc, u) => ({ ...acc, [u.role]: (acc[u.role] ?? 0) + 1 }),
    {} as Record<UserRole, number>
  );

  const openEdit = (user: AppUser) => {
    setEdit({
      open: true, uid: user.uid, name: user.name,
      email: user.email, role: user.role,
      isSelf: user.uid === currentUser?.uid,
    });
  };

  const closeEdit = () => setEdit(EDIT_CLOSED);

  const handleSave = async () => {
    const original = users.find((u) => u.uid === edit.uid);
    if (!original) return;

    const nameChanged = edit.name.trim() !== original.name;
    const roleChanged = edit.role !== original.role && !edit.isSelf;

    if (!nameChanged && !roleChanged) { closeEdit(); return; }

    // Close modal immediately — row shows spinner (optimistic)
    const savedName = edit.name.trim();
    const savedRole = edit.role;
    const savedUid  = edit.uid;
    closeEdit();

    const ops: Promise<void>[] = [];
    if (nameChanged) ops.push(changeName(savedUid, savedName));
    if (roleChanged) ops.push(changeRole(savedUid, savedRole));
    await Promise.all(ops);

    const parts = [nameChanged && "name", roleChanged && "role"].filter(Boolean);
    setToast(`${savedName}'s ${parts.join(" and ")} updated.`);
  };

  const isSaving = edit.uid !== "" && updatingId === edit.uid;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <PeopleAltIcon color="primary" />
            <Typography variant="h5" fontWeight={700}>User Management</Typography>
          </div>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            Edit names and roles across all registered users.
          </Typography>
        </div>
        <Tooltip title="Refresh list">
          <span>
            <IconButton onClick={refetch} disabled={loading}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          {ROLES.map((r) => (
            <Chip
              key={r}
              label={`${r}: ${counts[r] ?? 0}`}
              color={ROLE_COLORS[r]}
              variant="outlined"
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
          ))}
          <Chip label={`total: ${users.length}`} variant="outlined" size="small" />
        </div>
      )}

      {error && (
        <Alert severity="error" onClose={() => {}} sx={{ borderRadius: 2 }}>{error}</Alert>
      )}

      {/* Search */}
      <TextField
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ maxWidth: 360 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Table */}
      {loading ? (
        <Box className="flex justify-center py-16"><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 12 } }}>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {search ? "No users match your search." : "No users found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <UserRow
                    key={user.uid}
                    user={user}
                    isSelf={user.uid === currentUser?.uid}
                    isUpdating={updatingId === user.uid}
                    onEdit={openEdit}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EditUserDialog
        state={edit}
        saving={isSaving}
        onNameChange={(name) => setEdit((s) => ({ ...s, name }))}
        onRoleChange={(role) => setEdit((s) => ({ ...s, role }))}
        onSave={handleSave}
        onClose={closeEdit}
      />

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

export default function AdminUsersPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AdminUsersPanel />
    </RouteGuard>
  );
}
