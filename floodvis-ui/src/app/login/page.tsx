"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      if (data.token) {
        localStorage.setItem("fv_token", data.token);
      }
      if (data.user) {
        localStorage.setItem(
          "fv_user_profile",
          JSON.stringify({
            name: data.user.name,
            email: data.user.email,
          })
        );
      }
      document.cookie = `fv_user=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push("/");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-sky-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-900">
          FloodVis Login
        </h1>
        <p className="mb-6 text-center text-xs text-slate-500">
          Sign in to access your dashboard and family safety tools.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
              placeholder="user@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-semibold text-sky-600 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
