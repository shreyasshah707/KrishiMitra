export async function getWeather() {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.85&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
  );

  return res.json();
}