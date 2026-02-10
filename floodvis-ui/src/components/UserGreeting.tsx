"use client";

import { useEffect, useState } from "react";

type StoredProfile = { name?: string; email?: string };

export default function UserGreeting() {
  const [profile, setProfile] = useState<StoredProfile>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("fv_user_profile");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as StoredProfile;
      queueMicrotask(() => setProfile(parsed));
    } catch {
      // ignore
    }
  }, []);

  const name = profile.name?.trim();
  // const email = profile.email?.trim();

  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium text-sky-700">
        {name ? `Hello, ${name} 👋` : "Hello, User 👋"}
      </p>
      {/* {(name || email) && (
        <p className="text-xs text-slate-500">
          {[email].filter(Boolean).join(" · ")}
        </p>
      )} */}
    </div>
  );
}
