"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";

export type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  types: string[];
};

export default function FamilyPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
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

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { ok, status, data } = await apiGet<Contact[]>("/contacts?type=family");
      if (status === 401) {
        setError("Please sign in to view and manage family contacts.");
        setContacts([]);
        return;
      }
      if (!ok) {
        setError("Failed to load family contacts.");
        return;
      }
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !relation || !phone) return;
    setAdding(true);
    setError(null);
    try {
      const { ok, status, data } = await apiPost<Contact & { error?: string }>(
        "/contacts",
        { name, relation, phone, types: ["family"] }
      );
      if (status === 401) {
        setError("Please sign in to add family contacts.");
        return;
      }
      if (!ok) {
        setError((data as { error?: string })?.error || "Failed to add contact.");
        return;
      }
      setContacts((prev) => [...prev, data as Contact]);
      setName("");
      setRelation("");
      setPhone("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(c: Contact) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditRelation(c.relation);
    setEditPhone(c.phone);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName || !editRelation || !editPhone) return;
    setError(null);
    try {
      const { ok, status, data } = await apiPut<Contact & { error?: string }>(
        `/contacts/${editingId}`,
        { name: editName, relation: editRelation, phone: editPhone }
      );
      if (status === 401) {
        setError("Please sign in to update contacts.");
        return;
      }
      if (!ok) {
        setError((data as { error?: string })?.error || "Failed to update contact.");
        return;
      }
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? (data as Contact) : c))
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
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== contactId) return c;
          const types = c.types.includes(addType) ? c.types : [...c.types, addType];
          return { ...c, types };
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
      const { ok, status } = await apiPut(`/contacts/${id}`, { removeTypes: ["family"] });
      if (status === 401) {
        setError("Please sign in to remove contacts.");
        return;
      }
      if (status === 204 || ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } else {
        setError("Failed to remove contact.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 pb-8">
        <header>
          <h1 className="text-lg font-semibold text-slate-900">
            Family Connection
          </h1>
          <p className="text-xs text-slate-500">
            Add and manage family contacts. You can also add them to Emergency or Guardians so they receive SOS alerts.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Add family member
          </h2>
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
              <label className="block text-slate-700" htmlFor="f-name">Name</label>
              <input
                id="f-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="e.g. Mom"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700" htmlFor="f-relation">Relationship</label>
              <input
                id="f-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="e.g. Mother"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700" htmlFor="f-phone">Phone</label>
              <input
                id="f-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring-2"
                placeholder="+94 7X XXX XXXX"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add family member"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-md">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Family contacts
          </h2>
          {loading ? (
            <p className="text-xs text-slate-500">Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="text-xs text-slate-500">
              No family members added yet. Add someone above or add them from{" "}
              <Link href="/emergency" className="font-semibold text-sky-600">Emergency</Link>
              {" or "}
              <Link href="/guardians" className="font-semibold text-sky-600">Guardians</Link>.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-3 py-2"
                >
                  {editingId === c.id ? (
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
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                            {c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {c.relation} · {c.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === c.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                        {!c.types.includes("emergency") && (
                          <button
                            type="button"
                            onClick={() => handleAddType(c.id, "emergency")}
                            disabled={addingTypeId === c.id}
                            className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            {addingTypeId === c.id ? "…" : "+ Add to Emergency"}
                          </button>
                        )}
                        {!c.types.includes("guardian") && (
                          <button
                            type="button"
                            onClick={() => handleAddType(c.id, "guardian")}
                            disabled={addingTypeId === c.id}
                            className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                          >
                            {addingTypeId === c.id ? "…" : "+ Add to Guardians"}
                          </button>
                        )}
                        {(c.types.includes("emergency") || c.types.includes("guardian")) && (
                          <span className="text-[10px] text-slate-400">
                            Also in: {c.types.filter(t => t !== "family").join(", ")}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
