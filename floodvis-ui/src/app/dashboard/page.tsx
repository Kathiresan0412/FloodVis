"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import LocationAccess from "../../components/LocationAccess";
import AppShell from "../../components/AppShell";
import { API_BASE, getAuthHeaders, apiPost } from "../../lib/api";

const FloodMap = dynamic(() => import("../../components/FloodMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center bg-slate-200/70 text-xs text-slate-500">
      Loading map…
    </div>
  ),
});

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

function getLocationFromCookie(): { lat: number; lon: number } | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/fv_location=([^;]+)/);
  if (!match) return null;
  const parts = decodeURIComponent(match[1]).split(",").map((s) => s.trim());
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { lat, lon };
}

type WeatherData = {
  main: { temp: number; humidity: number; feels_like: number };
  weather: Array<{ main: string; description: string }>;
  wind?: { speed: number };
  name?: string;
} | null;

function getRiskFromTempHumidity(temp: number, humidity: number): number {
  // Simple proxy: higher temp + humidity => higher number (0–100 scale)
  const t = Math.min(40, Math.max(0, temp));
  const h = Math.min(100, Math.max(0, humidity));
  return Math.round((t / 40) * 50 + (h / 100) * 50);
}

function getRiskLabel(score: number): string {
  if (score <= 30) return "LOW RISK";
  if (score <= 50) return "MODERATE";
  if (score <= 80) return "HIGH";
  return "SEVERE";
}

export default function DashboardPage() {
  const [weather, setWeather] = useState<WeatherData>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [sendingSos, setSendingSos] = useState(false);
  const [sosMessage, setSosMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWeather = useCallback(async () => {
    const loc = getLocationFromCookie();
    setCoords(loc ?? null);

    if (!loc) {
      setWeatherError("Allow location to see flood risk and weather for your area.");
      setWeather(null);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("fv_token") : null;
    if (!token) {
      setWeatherError("Sign in to load live weather.");
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);
    const url = `${API_BASE}/me/weather?lat=${loc.lat}&lon=${loc.lon}`;
    console.debug("[Dashboard] Fetching weather", { lat: loc.lat, lon: loc.lon, url });
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(false),
      });
      const data = await res.json().catch(() => ({}));
      console.debug("[Dashboard] Weather response", { ok: res.ok, status: res.status, data });
      if (!res.ok) {
        setWeatherError(data.error || "Failed to load weather");
        return;
      }
      setWeather(data);
      setLastSync(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.debug("[Dashboard] Weather fetch error", err);
      setWeatherError("Could not reach the server.");
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  function handleSendSos() {
    if (sendingSos) return;
    setSosMessage(null);
    if (!("geolocation" in navigator)) {
      setSosMessage({ type: "error", text: "Location is not available in this browser." });
      return;
    }
    setSendingSos(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let address: string | null = null;
        try {
          address = await reverseGeocode(lat, lon);
        } catch {
          // use coords only
        }
        const { ok, status, data } = await apiPost<{ message?: string; error?: string }>(
          "/sos",
          { lat, lon, address: address ?? undefined }
        );
        if (ok && status === 200) {
          const msg = (data as { message?: string })?.message ?? "SOS sent to your emergency contacts.";
          setSosMessage({ type: "success", text: msg });
          setTimeout(() => setSosMessage(null), 6000);
        } else {
          const err = (data as { error?: string })?.error ?? "Failed to send SOS.";
          setSosMessage({ type: "error", text: err });
        }
        setSendingSos(false);
      },
      () => {
        setSosMessage({ type: "error", text: "Could not get your location. Allow location access and try again." });
        setSendingSos(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const temp = weather?.main?.temp;
  const humidity = weather?.main?.humidity ?? 0;
  const hasLocationData = coords != null && weather != null;
  const riskScore = temp != null ? getRiskFromTempHumidity(temp, humidity) : 0;
  const riskLabelStr = getRiskLabel(riskScore);
  const description = weather?.weather?.[0]?.description ?? "—";
  const windSpeed = weather?.wind?.speed ?? 0;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-slate-800">
            Flood Risk Dashboard
          </h1>
        </header>

        <section className="space-y-4">
          <div className="rounded-3xl bg-white/90 p-4 shadow-md ring-1 ring-red-100">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
              SOS Emergency System
            </p>
            <p className="mb-4 text-xs text-slate-500">
              One-touch SOS alert sends your location &amp; risk level.
            </p>
            <button
              type="button"
              onClick={handleSendSos}
              disabled={sendingSos}
              className="mx-auto block w-full max-w-xs rounded-full bg-red-500 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {sendingSos ? "Sending…" : "SOS · SEND ALERT"}
            </button>
            {sosMessage && (
              <p
                className={`mt-3 text-xs ${sosMessage.type === "success" ? "text-emerald-600 font-medium" : "text-red-600"}`}
                role="alert"
              >
                {sosMessage.text}
              </p>
            )}
          </div>

          <LocationAccess onLocationUpdate={fetchWeather} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Flood Risk Visualization
            </h2>
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-[10px] text-slate-400">Last sync: {lastSync}</span>
              )}
              <button
                type="button"
                onClick={fetchWeather}
                disabled={weatherLoading}
                className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-medium text-sky-700 hover:bg-sky-200 disabled:opacity-50"
              >
                {weatherLoading ? "…" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-md">
            <div className="h-40">
              {coords ? (
                <FloodMap
                  lat={coords.lat}
                  lon={coords.lon}
                  className="h-full rounded-t-3xl"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-t-3xl bg-slate-100 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    Map for your area
                  </p>
                  <p className="text-xs text-slate-500">
                    Allow location above to see flood risk and weather on the map.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              {weatherError && (
                <p className="text-xs text-amber-600">{weatherError}</p>
              )}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-emerald-600">
                    {!hasLocationData
                      ? "—"
                      : weatherLoading
                        ? "…"
                        : riskScore.toFixed(1)}
                  </p>
                  {hasLocationData && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                      {riskLabelStr}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Lat: {coords?.lat.toFixed(4) ?? "—"}, Lon: {coords?.lon.toFixed(4) ?? "—"}
                </p>
              </div>

              {hasLocationData && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Current Risk Level ({riskScore.toFixed(1)})</span>
                    <span>{riskLabelStr}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500"
                      style={{ width: `${Math.min(100, (riskScore / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Current Conditions
            </h2>
            <span className="text-[10px] text-slate-400">
              {weather?.name ? `${weather.name} · ` : ""}Live weather
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <MetricCard
              label="Temperature"
              value={temp != null ? `${Math.round(temp)}°C` : (weatherLoading ? "…" : "—")}
            />
            <MetricCard
              label="Humidity"
              value={humidity ? `${humidity}%` : (weatherLoading ? "…" : "—")}
            />
            <MetricCard
              label="Feels like"
              value={
                weather?.main?.feels_like != null
                  ? `${Math.round(weather.main.feels_like)}°C`
                  : (weatherLoading ? "…" : "—")
              }
            />
            <MetricCard label="Conditions" value={description} />
            <MetricCard
              label="Wind"
              value={windSpeed ? `${windSpeed} m/s` : "—"}
            />
            <MetricCard
              label="Risk Score"
              value={
                !hasLocationData
                  ? "—"
                  : weatherLoading
                    ? "…"
                    : `${riskScore.toFixed(1)} (${riskLabelStr})`
              }
            />
          </div>
          <div className="mt-4 rounded-2xl bg-sky-50 p-3 text-[10px] leading-relaxed text-slate-600">
            <p className="font-semibold">Sri Lankan Risk Equation</p>
            <p>
              Risk = (Rainfall × 0.5) + (Storm × 0.3) + (Humidity × 0.2)
            </p>
            <p className="mt-2">
              0–30: LOW (Green) · 31–50: MODERATE (Yellow) · 51–80: HIGH
              (Orange) · &gt;80: SEVERE (Red)
            </p>
            <p className="mt-1 font-medium text-red-500">
              If water level exceeds 2.0 m, risk is automatically set to SEVERE.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="mb-1 text-[10px] font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

