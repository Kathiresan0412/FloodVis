"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

type Guardian = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export default function EmergencyPage() {
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
            SOS & Emergency Contacts
          </h1>
          <p className="text-xs text-slate-600">
            Trigger an SOS alert and see who will be notified from your Safety
            Circle.
          </p>
        </header>

        <section className="rounded-3xl bg-white/90 p-5 shadow-md ring-1 ring-red-100">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
            SOS Emergency System
          </p>
          <p className="mb-4 text-xs text-slate-600">
            When you press SOS, your current location and risk level are sent
            to your configured guardians.
          </p>
          <button className="mx-auto block w-full max-w-xs rounded-full bg-red-500 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-600">
            SOS · SEND ALERT
          </button>
          <p className="mt-3 text-[10px] text-slate-500">
            Make sure location access is enabled on the dashboard so your last
            known coordinates can be attached.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-md">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Emergency contacts
          </h2>
          {guardians.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No emergency contacts set. Add guardians in{" "}
              <span className="font-semibold">Guardian Details</span> so we know
              who to notify.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {guardians.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{g.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {g.relation} · {g.phone}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-red-500">
                    Will receive SOS
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

