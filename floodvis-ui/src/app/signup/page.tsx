"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sign up failed.");
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
      router.push("/profile");
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
          Create FloodVis Account
        </h1>
        <p className="mb-6 text-center text-xs text-slate-500">
          Set up your profile to keep your family informed during floods.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-700" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
              placeholder="User Name"
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
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
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-sky-600 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

