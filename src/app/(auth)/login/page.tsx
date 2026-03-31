"use client";
// app/(auth)/login/page.tsx
// -------------------------------------------------
// UI only — all logic delegated to useAuth hook.
// -------------------------------------------------

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
import EmailIcon from "@mui/icons-material/EmailOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login, loading, error } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <Card className="w-full max-w-sm" elevation={2}>
      <CardContent className="p-8 flex flex-col gap-5">
        {/* Header */}
        <div className="text-center">
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue
          </Typography>
        </div>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
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
            {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
          </Button>
        </form>

        <Divider />

        <Typography variant="body2" textAlign="center" color="text.secondary">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-main font-semibold hover:underline">
            Sign up
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
