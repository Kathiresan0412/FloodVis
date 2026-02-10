const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

async function getWeather(lat, lon) {
  if (!OPENWEATHERMAP_API_KEY) {
    throw new Error("OPENWEATHERMAP_API_KEY is not configured");
  }
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new Error("Valid lat and lon are required");
  }

  const url = `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Weather API error: ${res.status}`);
  }
  return res.json();
}

module.exports = { getWeather };
