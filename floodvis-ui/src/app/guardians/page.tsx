"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { apiPost, apiPut, apiDelete, apiGet } from "../../lib/api";

type Guardian = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  types?: string[];
};

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelation, setEditRelation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingTypeId, setAddingTypeId] = useState<string | null>(null);

  const fetchGuardians = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, status, data } = await apiGet<Guardian[]>("/guardians");
      if (status === 401) {
        setError("Please sign in to view and manage guardians.");
        setGuardians([]);
        return;
      }
      if (!ok) {
        setError("Failed to load guardians.");
        return;
      }
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
      const { ok, status, data } = await apiPost<Guardian & { error?: string }>(
        "/guardians",
        { name, relation, phone }
      );
      if (status === 401) {
        setError("Please sign in to add guardians.");
        return;
      }
      if (!ok) {
        setError((data as { error?: string }).error || "Failed to add guardian.");
        return;
      }
      setGuardians((prev) => [...prev, data as Guardian]);
      setName("");
      setRelation("");
      setPhone("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(g: Guardian) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditRelation(g.relation);
    setEditPhone(g.phone);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName || !editRelation || !editPhone) return;
    setError(null);
    try {
      const { ok, status, data } = await apiPut<Guardian & { error?: string }>(
        `/guardians/${editingId}`,
        { name: editName, relation: editRelation, phone: editPhone }
      );
      if (status === 401) {
        setError("Please sign in to update guardians.");
        return;
      }
      if (!ok) {
        setError((data as { error?: string })?.error || "Failed to update guardian.");
        return;
      }
      setGuardians((prev) =>
        prev.map((g) => (g.id === editingId ? (data as Guardian) : g))
      );
      setEditingId(null);
    } catch {
      setError("Could not reach the server.");
    }
  }

  async function handleAddType(contactId: string, addType: string) {
    setAddingTypeId(contactId);
    setError(null);
    try {
      const { ok, status } = await apiPut(`/contacts/${contactId}`, {
        addTypes: [addType],
      });
      if (status === 401) {
        setError("Please sign in to update contacts.");
        return;
      }
      if (!ok) return;
      setGuardians((prev) =>
        prev.map((g) => {
          if (g.id !== contactId) return g;
          const types = g.types || [];
          const newTypes = types.includes(addType) ? types : [...types, addType];
          return { ...g, types: newTypes };
        })
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setAddingTypeId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const { ok, status } = await apiDelete(`/guardians/${id}`);
      if (status === 401) {
        setError("Please sign in to remove guardians.");
        return;
      }
      if (status === 404 || ok) {
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
            Add trusted family or emergency contacts who should be notified when
            you trigger an SOS alert. You can also add them to Family or Emergency from here.
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
              No guardians added yet. Add someone above or add them from{" "}
              <Link href="/family" className="font-semibold text-sky-600">Family</Link>
              {" or "}
              <Link href="/emergency" className="font-semibold text-sky-600">Emergency</Link>.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {guardians.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-3 py-2"
                >
                  {editingId === g.id ? (
                    <form onSubmit={handleEdit} className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Name"
                      />
                      <input
                        value={editRelation}
                        onChange={(e) => setEditRelation(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Relation"
                      />
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Phone"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded-full bg-sky-600 px-3 py-1.5 text-[10px] font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{g.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {g.relation} · {g.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(g)}
                            className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(g.id)}
                            disabled={deletingId === g.id}
                            className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === g.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                        {!(g.types || []).includes("family") && (
                          <button
                            type="button"
                            onClick={() => handleAddType(g.id, "family")}
                            disabled={addingTypeId === g.id}
                            className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {addingTypeId === g.id ? "…" : "+ Add to Family"}
                          </button>
                        )}
                        {!(g.types || []).includes("emergency") && (
                          <button
                            type="button"
                            onClick={() => handleAddType(g.id, "emergency")}
                            disabled={addingTypeId === g.id}
                            className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {addingTypeId === g.id ? "…" : "+ Add to Emergency"}
                          </button>
                        )}
                        {((g.types || []).includes("family") || (g.types || []).includes("emergency")) && (
                          <span className="text-[10px] text-slate-400">
                            Also in: {(g.types || []).filter((t) => t !== "guardian").join(", ")}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
