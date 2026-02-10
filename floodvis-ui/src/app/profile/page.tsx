"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type UserProfile = {
  name?: string;
  email?: string;
};

type LoginHistoryEntry = {
  id: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

type ActivityLogEntry = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    login: "Signed in",
    signup: "Account created",
    guardian_add: "Added guardian",
    guardian_remove: "Removed guardian",
  };
  return labels[action] || action;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [location, setLocation] = useState<string>("Unknown");
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("fv_user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    const cookies = document.cookie.split(";").map((c) => c.trim());
    const locCookie = cookies.find((c) => c.startsWith("fv_location="));
    if (locCookie) {
      setLocation(decodeURIComponent(locCookie.split("=")[1] ?? "Unknown"));
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    if (!token) {
      setHistoryError("Sign in with your account to see login history and activity.");
      return;
    }

    setLoadingHistory(true);
    setHistoryError(null);

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/me/login-history`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Failed to load login history"))
      ),
      fetch(`${API_BASE}/me/activity-log`, { headers }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Failed to load activity log"))
      ),
    ])
      .then(([logins, activities]) => {
        setLoginHistory(logins);
        setActivityLog(activities);
      })
      .catch((err) => setHistoryError(err.message || "Could not load history"))
      .finally(() => setLoadingHistory(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-sky-100 px-4 py-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="mb-1 text-lg font-semibold text-slate-900">Profile</h1>
          <p className="mb-4 text-xs text-slate-500">
            Manage your FloodVis account and see the last known location stored
            on this device.
          </p>

          <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-900">
                {profile.name || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">
                {profile.email || "Not set"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-emerald-50 p-4 text-xs text-slate-700">
            <p className="font-semibold text-emerald-700">
              Last stored location (from cookies)
            </p>
            <p>{location}</p>
            <p className="text-[10px] text-slate-500">
              This is only stored in your browser cookies and can be cleared
              from your browser settings.
            </p>
          </div>
        </div>

        {/* Login history & activity log */}
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Login history & activity
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Recent sign-ins and account actions. Sign in with your account to see
            this data.
          </p>

          {historyError && (
            <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
              {historyError}
              <Link href="/login" className="ml-1 font-semibold underline">
                Go to login
              </Link>
            </p>
          )}

          {loadingHistory && (
            <p className="text-xs text-slate-500">Loading…</p>
          )}

          {!loadingHistory && !historyError && (loginHistory.length > 0 || activityLog.length > 0) && (
            <div className="space-y-4">
              {loginHistory.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Recent logins
                  </h3>
                  <ul className="space-y-2">
                    {loginHistory.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-900">
                            {e.success ? "Successful sign-in" : "Failed sign-in"}
                          </span>
                          {e.ip && (
                            <span className="ml-2 text-slate-500">IP: {e.ip}</span>
                          )}
                        </div>
                        <span className="text-slate-500">
                          {formatDate(e.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activityLog.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">
                    Activity log
                  </h3>
                  <ul className="space-y-2">
                    {activityLog.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-900">
                            {formatAction(e.action)}
                          </span>
                          {e.details?.name && (
                            <span className="ml-2 text-slate-500">
                              ({e.details.name as string})
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500">
                          {formatDate(e.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!loadingHistory && !historyError && loginHistory.length === 0 && activityLog.length === 0 && (
            <p className="text-xs text-slate-500">
              No login history or activity yet. Sign in and use the app to see
              entries here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
