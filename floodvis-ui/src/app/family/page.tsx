"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

type Guardian = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export default function FamilyPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("fv_guardians");
    if (stored) {
      try {
        setGuardians(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <AppShell>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 pb-8">
        <header>
          <h1 className="text-lg font-semibold text-slate-900">
            Family Connection
          </h1>
          <p className="text-xs text-slate-500">
            View your Safety Circle and their current risk status.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 shadow-md">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Safety Circle Dashboard
          </h2>
          <p className="mb-2 text-[11px] text-slate-500">
            All members below are part of your Safety Circle. Risk status is
            based on the current area risk score.
          </p>

          {guardians.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No family members added yet. Add guardians under{" "}
              <span className="font-semibold">Guardian Details</span> so they
              appear here.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {guardians.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                      {g.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{g.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {g.relation} · {g.phone}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                    LOW RISK
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

