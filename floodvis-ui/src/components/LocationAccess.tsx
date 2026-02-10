"use client";

import { useEffect, useState } from "react";

function hasStoredLocation(): boolean {
  if (typeof window === "undefined") return false;
  const match = document.cookie.match(/fv_location=([^;]+)/);
  return Boolean(match?.[1]);
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FloodVis/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

type LocationAccessProps = {
  /** Called when lat/lon are obtained and stored; e.g. trigger a data fetch */
  onLocationUpdate?: () => void;
};

export default function LocationAccess({ onLocationUpdate }: LocationAccessProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [locationName, setLocationName] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const stored = hasStoredLocation();
    const schedule = (fn: () => void) => queueMicrotask(fn);
    if (!stored) {
      schedule(() => setShowPopup(true));
      return;
    }
    const match = document.cookie.match(/fv_location=([^;]+)/);
    const coords = match ? decodeURIComponent(match[1]) : "";
    const nameMatch = document.cookie.match(/fv_location_name=([^;]+)/);
    const name = nameMatch ? decodeURIComponent(nameMatch[1]) : null;
    if (!coords) return;
    const [lat, lon] = coords.split(",").map((s) => s.trim());
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    let cancelled = false;
    schedule(() => {
      if (!cancelled) {
        setStatus(`Lat: ${lat}, Lon: ${lon}`);
        setLocationName(name || null);
      }
    });
    if (!name && !Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
      reverseGeocode(latNum, lonNum).then((n) => {
        if (cancelled) return;
        if (n) {
          setLocationName(n);
          document.cookie = `fv_location_name=${encodeURIComponent(n)}; path=/; max-age=${60 * 30}`;
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAllow() {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation is not available in this browser.");
      setShowPopup(false);
      return;
    }

    setRequesting(true);

    // maximumAge: 0 so the browser always shows its permission prompt (no cached position)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const latFixed = lat.toFixed(4);
        const lonFixed = lon.toFixed(4);
        const coords = `${latFixed}, ${lonFixed}`;

        document.cookie = `fv_location=${encodeURIComponent(
          coords,
        )}; path=/; max-age=${60 * 30}`;

        setStatus(`Lat: ${latFixed}, Lon: ${lonFixed}`);
        setShowPopup(false);
        setRequesting(false);

        const name = await reverseGeocode(lat, lon);
        if (name) {
          setLocationName(name);
          document.cookie = `fv_location_name=${encodeURIComponent(name)}; path=/; max-age=${60 * 30}`;
        }

        console.debug("[LocationAccess] Got position", { lat, lon, coords, name });

        onLocationUpdate?.();
      },
      (err) => {
        const message =
          err.code === 1
            ? "Location permission denied. Allow location in your browser to see risk for your area."
            : "Location unavailable or timed out.";
        setStatus(message);
        setShowPopup(false);
        setRequesting(false);
        console.debug("[LocationAccess] Error", { code: err.code, message: err.message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleNotNow() {
    setStatus("Location not shared.");
    setShowPopup(false);
  }

  const needsLocation =
    status === "Location not shared." ||
    status.includes("permission denied") ||
    status.includes("Location unavailable") ||
    status === "Geolocation is not available in this browser.";

  return (
    <>
      {/* Popup overlay: blurs background content */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-md"
          aria-modal="true"
          role="dialog"
          aria-labelledby="location-dialog-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
            <h2 id="location-dialog-title" className="text-base font-semibold text-slate-900">
              Allow location access
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              We use your location to show flood risk and weather for your area.
            </p>
            {requesting && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Check your browser for the location prompt — it may appear in the address bar or as a popup. Choose &quot;Allow&quot; to continue.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleNotNow}
                disabled={requesting}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleAllow}
                disabled={requesting}
                className="flex-1 rounded-full bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-70"
              >
                {requesting ? "Requesting…" : "Allow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent warning when user did not allow location */}
      {!showPopup && needsLocation && (
        <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold text-amber-800">Allow location to see flood risk</p>
          <p className="mt-1 text-xs text-amber-700">{status}</p>
          <button
            type="button"
            onClick={() => setShowPopup(true)}
            className="mt-3 w-full rounded-full bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Allow location
          </button>
        </div>
      )}

      {/* Status strip when location is allowed */}
      {!showPopup && status && !needsLocation && (
        <div className="mt-3 rounded-2xl bg-sky-50 p-3 text-[11px] text-slate-700">
          <p className="font-semibold text-sky-700">Location</p>
          {locationName && <p className="mt-1 font-medium text-slate-800">{locationName}</p>}
          <p className={locationName ? "mt-0.5 text-slate-500" : "mt-1"}>{status}</p>
        </div>
      )}
    </>
  );
}
