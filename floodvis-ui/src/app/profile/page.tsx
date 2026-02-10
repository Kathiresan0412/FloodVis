"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import { apiGet } from "../../lib/api";

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

type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type LocationHistoryEntry = {
  id: string;
  lat: number;
  lon: number;
  name: string | null;
  createdAt: string;
};

type LocationHistoryResponse = {
  items: LocationHistoryEntry[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    login: "Signed in",
    signup: "Account created",
    guardian_add: "Added guardian",
    guardian_update: "Updated guardian",
    guardian_remove: "Removed guardian",
    contact_add: "Added contact",
    contact_update: "Updated contact",
    contact_remove: "Removed contact",
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

/** Parse user agent and return a short device/platform name (e.g. "Macintosh", "Windows", "iPhone"). */
function getDeviceName(userAgent: string | null): string {
  if (!userAgent || !userAgent.trim()) return "Unknown device";
  const match = userAgent.match(/\(([^)]+)\)/);
  if (!match) return "Unknown device";
  const platform = match[1].split(";")[0].trim();
  const friendly: Record<string, string> = {
    Macintosh: "Mac",
    Windows: "Windows",
    "Windows NT": "Windows",
    iPhone: "iPhone",
    iPad: "iPad",
    Linux: "Linux",
    "X11": "Linux",
  };
  return friendly[platform] ?? platform;
}

const PAGE_SIZE = 10;

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [location, setLocation] = useState<string>("Unknown");
  const [locationHistory, setLocationHistory] = useState<LocationHistoryEntry[]>([]);
  const [locationHistoryPage, setLocationHistoryPage] = useState(1);
  const [locationHistoryTotal, setLocationHistoryTotal] = useState(0);
  const [locationHistoryHasMore, setLocationHistoryHasMore] = useState(false);
  const [locationHistoryLoading, setLocationHistoryLoading] = useState(false);

  const [loginItems, setLoginItems] = useState<LoginHistoryEntry[]>([]);
  const [loginPage, setLoginPage] = useState(1);
  const [loginTotal, setLoginTotal] = useState(0);
  const [loginHasMore, setLoginHasMore] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [activityItems, setActivityItems] = useState<ActivityLogEntry[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("fv_user_profile");
    let parsed: UserProfile = {};
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    const cookies = document.cookie.split(";").map((c) => c.trim());
    const locCookie = cookies.find((c) => c.startsWith("fv_location="));
    const loc = locCookie ? decodeURIComponent(locCookie.split("=")[1] ?? "Unknown") : null;

    queueMicrotask(() => {
      if (Object.keys(parsed).length > 0) setProfile(parsed);
      if (loc != null) setLocation(loc);
    });
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    const msg = !token ? "Sign in with your account to see login history and activity." : null;
    queueMicrotask(() => {
      setHistoryError(msg);
    });
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    if (!token) return;

    const run = () => {
      setLoadingLogin(true);
      apiGet<PaginatedResponse<LoginHistoryEntry>>(
      `/me/login-history?page=${loginPage}&pageSize=${PAGE_SIZE}`
    )
      .then(({ ok, data }) => {
        if (!ok || !data) throw new Error("Failed to load login history");
        setLoginItems(data.items);
        setLoginTotal(data.total);
        setLoginHasMore(data.hasMore);
      })
      .catch(() => setHistoryError("Could not load login history"))
      .finally(() => setLoadingLogin(false));
    };
    queueMicrotask(run);
  }, [loginPage]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    if (!token) return;

    const run = () => {
      setLoadingActivity(true);
      apiGet<PaginatedResponse<ActivityLogEntry>>(
      `/me/activity-log?page=${activityPage}&pageSize=${PAGE_SIZE}`
    )
      .then(({ ok, data }) => {
        if (!ok || !data) throw new Error("Failed to load activity log");
        setActivityItems(data.items);
        setActivityTotal(data.total);
        setActivityHasMore(data.hasMore);
      })
      .catch(() => setHistoryError("Could not load activity log"))
      .finally(() => setLoadingActivity(false));
    };
    queueMicrotask(run);
  }, [activityPage]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    if (!token) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLocationHistoryLoading(true);
    });

    apiGet<LocationHistoryResponse>(
      `/me/location-history?page=${locationHistoryPage}&pageSize=10`
    )
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data && "items" in data) {
          setLocationHistory(data.items);
          setLocationHistoryTotal(data.total);
          setLocationHistoryHasMore(data.hasMore);
        } else {
          setLocationHistory([]);
          setLocationHistoryTotal(0);
          setLocationHistoryHasMore(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationHistory([]);
          setLocationHistoryTotal(0);
          setLocationHistoryHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLocationHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locationHistoryPage]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              Location (last 7 days)
            </p>
            <p className="text-[10px] text-slate-500">
              Stored when you allow location on the dashboard; recent entries below.
            </p>
            {locationHistoryLoading ? (
              <p className="mt-2 text-slate-500">Loading…</p>
            ) : locationHistory.length > 0 ? (
              <>
                <ul className="mt-3 space-y-2">
                  {locationHistory.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2"
                    >
                      <a
                        href={`https://www.google.com/maps?q=${e.lat},${e.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 underline decoration-emerald-500/50 underline-offset-2 hover:text-emerald-700 hover:decoration-emerald-600"
                      >
                        {e.name ?? `${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`}
                      </a>
                      <span className="text-slate-500">
                        {formatDate(e.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
                {locationHistoryTotal > 0 && (
                  <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-3">
                    <p className="text-[10px] text-slate-500">
                      Page {locationHistoryPage} · {locationHistoryTotal} total
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={locationHistoryPage <= 1}
                        onClick={() => setLocationHistoryPage((p) => Math.max(1, p - 1))}
                        className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-emerald-700 shadow-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-100"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={!locationHistoryHasMore}
                        onClick={() => setLocationHistoryPage((p) => p + 1)}
                        className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-emerald-700 shadow-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-emerald-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-slate-500">
                No location history yet. Allow location on the dashboard to see entries here.
              </p>
            )}
            <p className="mt-2 text-[10px] text-slate-500">
              Current device location (cookie): {location}
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

          {(loadingLogin || loadingActivity) && !loginItems?.length && !activityItems.length && (
            <p className="text-xs text-slate-500">Loading…</p>
          )}

          {!historyError && (
            <div className="space-y-6">
              {/* Login history */}
              <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Login history
                  </h3>
                  {loginTotal > 0 && (
                    <span className="text-[10px] text-slate-500">
                      {loginTotal} total
                    </span>
                  )}
                </div>
                {loadingLogin && !loginItems.length ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">Loading…</p>
                ) : loginItems.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">
                    No login history yet.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-200/80">
                      {loginItems.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors hover:bg-white/60"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`inline-flex h-2 w-2 shrink-0 rounded-full ${
                                e.success ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              aria-hidden
                            />
                            <span className="font-medium text-slate-900">
                              {e.success ? "Successful sign-in" : "Failed sign-in"}
                            </span>
                            {e.userAgent && (
                              <span className="hidden truncate text-slate-500 sm:inline">
                                · {getDeviceName(e.userAgent)}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-slate-500 tabular-nums">
                            {formatDate(e.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {loginTotal > PAGE_SIZE && (
                      <div className="flex items-center justify-between border-t border-slate-200/80 bg-white px-4 py-2">
                        <span className="text-[10px] text-slate-500">
                          Page {loginPage} of {Math.ceil(loginTotal / PAGE_SIZE) || 1}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={loginPage <= 1 || loadingLogin}
                            onClick={() => setLoginPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={!loginHasMore || loadingLogin}
                            onClick={() => setLoginPage((p) => p + 1)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Activity log */}
              <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Activity log
                  </h3>
                  {activityTotal > 0 && (
                    <span className="text-[10px] text-slate-500">
                      {activityTotal} total
                    </span>
                  )}
                </div>
                {loadingActivity && !activityItems.length ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">Loading…</p>
                ) : activityItems.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">
                    No activity yet.
                  </p>
                ) : (
                  <>
                    <ul className="divide-y divide-slate-200/80">
                      {activityItems.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors hover:bg-white/60"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {formatAction(e.action)}
                            </span>
                            {e.details?.name != null && (
                              <span className="truncate text-slate-500">
                                ({String(e.details.name)})
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 text-slate-500 tabular-nums">
                            {formatDate(e.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {activityTotal > PAGE_SIZE && (
                      <div className="flex items-center justify-between border-t border-slate-200/80 bg-white px-4 py-2">
                        <span className="text-[10px] text-slate-500">
                          Page {activityPage} of {Math.ceil(activityTotal / PAGE_SIZE) || 1}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={activityPage <= 1 || loadingActivity}
                            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={!activityHasMore || loadingActivity}
                            onClick={() => setActivityPage((p) => p + 1)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
        </div>
      </div>
    </AppShell>
  );
}
