# Next.js Firebase Starter — Production Architecture

A production-ready, scalable starter built with **Next.js 14 App Router**, **TypeScript**, **Firebase**, **MUI**, **Tailwind CSS**, and **Redux Toolkit**.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/               # Route group — no navbar
│   │   ├── layout.tsx        # Centered auth layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/          # Route group — with navbar
│   │   ├── layout.tsx        # Dashboard layout with Navbar
│   │   ├── admin/page.tsx
│   │   ├── teacher/page.tsx
│   │   └── student/page.tsx
│   ├── layout.tsx            # Root layout (Server Component)
│   └── page.tsx              # Redirects to /login
│
├── components/
│   ├── layout/
│   │   └── Navbar.tsx        # Top navigation bar
│   ├── Providers.tsx         # All client providers composed here
│   └── RouteGuard.tsx        # Client-side role protection
│
├── hooks/
│   ├── useAuth.ts            # Auth actions + state
│   └── useTheme.ts           # Theme toggle + Tailwind sync
│
├── lib/
│   ├── firebase.ts           # Firebase singleton initialization
│   ├── muiTheme.ts           # MUI theme factory (dark/light)
│   └── emotionCache.ts       # Emotion SSR cache
│
├── middleware.ts             # Edge middleware — auth cookie check
│
├── services/
│   └── auth.service.ts       # ALL Firebase logic lives here
│
├── store/
│   ├── index.ts              # Redux store + persist config
│   └── slices/
│       ├── authSlice.ts      # user, loading, error
│       └── themeSlice.ts     # dark/light mode
│
├── styles/
│   └── globals.css           # Tailwind layers
│
└── types/
    └── user.ts               # AppUser, FirestoreUser, UserRole
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd nextjs-firebase-starter
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database**
5. Copy your config values

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Fill in your Firebase values
```

### 4. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 5. Run

```bash
npm run dev
```

---

## 🏗️ Architecture Decisions

| Decision | Rationale |
|---|---|
| **Service layer** | `auth.service.ts` owns all Firebase calls. Components never import Firebase directly — this makes the codebase testable and backend-agnostic. |
| **Redux for auth + theme** | Avoids prop drilling across deep component trees. Theme persist uses `redux-persist` (localStorage). Auth does NOT persist — Firebase's `onAuthStateChanged` rehydrates it fresh each session. |
| **Route groups `(auth)` and `(dashboard)`** | Isolates layouts without affecting URLs. Auth pages get a clean centered layout; dashboard pages share the Navbar. |
| **Middleware + RouteGuard** | Two-layer protection: middleware (Edge) blocks unauthenticated requests server-side using a cookie; RouteGuard (client) enforces role-based access after React hydration. |
| **`suppressHydrationWarning` on `<html>`** | The Tailwind `dark` class is applied client-side after Redux rehydrates the theme. This single-line fix prevents the expected SSR/CSR mismatch warning. |
| **Emotion cache with `prepend: true`** | MUI styles are inserted before Tailwind, so utility classes can override component styles without `!important`. |
| **Tailwind `preflight: false`** | MUI's `CssBaseline` handles CSS resets. Running both would cause double-reset conflicts. |
| **`getDashboardPath()` in service layer** | Centralised role→route mapping means changing a path requires editing one place, not hunting through components. |

---

## 🔐 Role System

| Role | Default Dashboard | Who assigns it |
|---|---|---|
| `student` | `/student` | Auto-assigned on sign-up |
| `teacher` | `/teacher` | Admin via Firestore |
| `admin` | `/admin` | Manual Firestore edit |

To promote a user to `teacher` or `admin`, update their Firestore document:

```
users/{uid} → role: "teacher"
```

---

## 🎨 Theming

- Toggle dark/light via the Navbar icon button
- Preference persists in `localStorage` via redux-persist
- MUI theme and Tailwind `dark` class stay in sync via `useTheme` hook
- To change brand colours: edit `src/lib/muiTheme.ts` and `tailwind.config.ts` (both reference the same Indigo/Pink palette)

---

## 🧩 Extending

**Add a new protected page:**
```tsx
// app/(dashboard)/reports/page.tsx
"use client";
import { RouteGuard } from "@/components/RouteGuard";

export default function ReportsPage() {
  return (
    <RouteGuard allowedRoles={["admin", "teacher"]}>
      {/* your UI */}
    </RouteGuard>
  );
}
```

**Add a new Firestore service:**
```ts
// services/courses.service.ts
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function fetchCourses() {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `next` 14 | App Router, Server Components, Edge middleware |
| `firebase` 10 | Auth + Firestore |
| `@mui/material` 5 | Component library |
| `@emotion/cache` | MUI SSR — no hydration flicker |
| `tailwindcss` 3 | Utility-first styling |
| `@reduxjs/toolkit` | State management |
| `redux-persist` | Persist theme preference |
| `js-cookie` | Set auth cookie for middleware |
