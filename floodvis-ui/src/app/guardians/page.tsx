"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Guardian = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("fv_token");
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGuardians = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/guardians`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        setError("Please sign in to view and manage guardians.");
        setGuardians([]);
        return;
      }
      if (!res.ok) {
        setError("Failed to load guardians.");
        return;
      }
      const data = await res.json();
      setGuardians(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !relation || !phone) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/guardians`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, relation, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Please sign in to add guardians.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Failed to add guardian.");
        return;
      }
      setGuardians((prev) => [...prev, data]);
      setName("");
      setRelation("");
      setPhone("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/guardians/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        setError("Please sign in to remove guardians.");
        return;
      }
      if (res.status === 404 || res.ok) {
        setGuardians((prev) => prev.filter((g) => g.id !== id));
      } else {
        setError("Failed to remove guardian.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl space-y-4 pb-8">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">
            Guardian details
          </h1>
          <p className="mb-4 text-xs text-slate-500">
            Add trusted family members or guardians who should be notified when
            you trigger an SOS alert.
          </p>

          {error && (
            <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
              {error}
              <Link href="/login" className="ml-1 font-semibold underline">
                Sign in
              </Link>
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block text-slate-700" htmlFor="g-name">
                Name
              </label>
              <input
                id="g-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="Mom"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700" htmlFor="g-relation">
                Relationship
              </label>
              <input
                id="g-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="Mother"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700" htmlFor="g-phone">
                Phone number
              </label>
              <input
                id="g-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="+94 7X XXX XXXX"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="mt-2 w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add guardian"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-md">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Safety circle
          </h2>
          {loading ? (
            <p className="text-xs text-slate-500">Loading guardians…</p>
          ) : guardians.length === 0 ? (
            <p className="text-xs text-slate-500">
              No guardians added yet. Add at least one contact so that alerts
              can be directed to your family.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {guardians.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{g.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {g.relation} · {g.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    {deletingId === g.id ? "…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
