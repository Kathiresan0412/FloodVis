"use client";

import { useEffect, useState } from "react";

function hasStoredLocation(): boolean {
  if (typeof window === "undefined") return false;
  const match = document.cookie.match(/fv_location=([^;]+)/);
  return Boolean(match?.[1]);
}

type LocationAccessProps = {
  /** Called when lat/lon are obtained and stored; e.g. trigger a data fetch */
  onLocationUpdate?: () => void;
};

export default function LocationAccess({ onLocationUpdate }: LocationAccessProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (hasStoredLocation()) {
      const match = document.cookie.match(/fv_location=([^;]+)/);
      const coords = match ? decodeURIComponent(match[1]) : "";
      setStatus(coords ? `Lat: ${coords.split(",")[0]?.trim()}, Lon: ${coords.split(",")[1]?.trim()}` : "");
      return;
    }
    setShowPopup(true);
  }, []);

  function handleAllow() {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation is not available in this browser.");
      setShowPopup(false);
      return;
    }

    setRequesting(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
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

        console.debug("[LocationAccess] Got position", { lat, lon, coords });

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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function handleNotNow() {
    setStatus("Location not shared.");
    setShowPopup(false);
  }

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

      {/* Status strip (shown when popup is closed or after choice) */}
      {!showPopup && status && (
        <div className="mt-3 rounded-2xl bg-sky-50 p-3 text-[11px] text-slate-700">
          <p className="font-semibold text-sky-700">Location</p>
          <p className="mt-1">{status}</p>
        </div>
      )}
    </>
  );
}
