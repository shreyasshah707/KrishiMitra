export default function Forecast() {
  const days = [
    { day: "Mon", temp: 28, icon: "☀️" },
    { day: "Tue", temp: 27, icon: "🌤️" },
    { day: "Wed", temp: 25, icon: "🌧️" },
    { day: "Thu", temp: 29, icon: "☀️" },
    { day: "Fri", temp: 30, icon: "🌤️" },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h2 className="text-xl font-bold mb-5">
        7 Day Forecast
      </h2>

      <div className="flex justify-between">
        {days.map((d) => (
          <div
            key={d.day}
            className="text-center"
          >
            <div className="text-3xl">
              {d.icon}
            </div>

            <div className="mt-2 font-medium">
              {d.day}
            </div>

            <div className="text-slate-400">
              {d.temp}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}