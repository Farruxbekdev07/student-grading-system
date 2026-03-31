"use client";
// app/(auth)/register/page.tsx

import React, { useState } from "react";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { signUp, loading, error } = useAuth();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [localErr, setLocalErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr("");

    if (password !== confirm) {
      setLocalErr("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setLocalErr("Password must be at least 6 characters.");
      return;
    }

    await signUp(email, password, name);
  };

  const displayError = localErr || error;

  return (
    <Card className="w-full max-w-sm" elevation={2}>
      <CardContent className="p-8 flex flex-col gap-5">
        <div className="text-center">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join us today — it&apos;s free
          </Typography>
        </div>

        {displayError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {displayError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            autoComplete="name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Create Account"}
          </Button>
        </form>

        <Divider />

        <Typography variant="body2" textAlign="center" color="text.secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-main font-semibold hover:underline">
            Sign in
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
