"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/family", label: "Family" },
  { href: "/emergency", label: "Emergency" },
  { href: "/guardians", label: "Guardians" },
  { href: "/profile", label: "Profile" },
];

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-sky-100 bg-white/90 px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-xs font-bold text-white">
            FV
          </div>
          <div className="text-sm font-semibold">FloodVis</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-sky-200 px-3 py-1 text-xs font-medium text-slate-700"
        >
          Menu
        </button>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl md:px-4">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-56 transform border-r border-sky-100 bg-white/95 p-4 shadow-md transition-transform duration-200 md:static md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="mb-6 hidden items-center gap-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white">
              FV
            </div>
            <div>
              <p className="text-sm font-semibold">FloodVis
            </p>
              <p className="text-[10px] text-slate-500">Flood safety companion</p>
            </div>
          </div>
  

          <nav className="space-y-1 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 ${
                    active
                      ? "bg-sky-500 text-white"
                      : "text-slate-700 hover:bg-sky-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="ml-0 flex-1 px-4 pb-8 pt-4 md:ml-0 md:pl-6 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

