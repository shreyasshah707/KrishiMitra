export default function SoilHealth() {
  const nutrients = [
    { name: "Nitrogen", value: 68 },
    { name: "Phosphorus", value: 82 },
    { name: "Potassium", value: 74 },
    { name: "Organic Carbon", value: 45 },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <h2 className="text-xl font-bold mb-5">
        Soil Health
      </h2>

      <div className="space-y-4">
        {nutrients.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between mb-1">
              <span>{item.name}</span>
              <span>{item.value}%</span>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}