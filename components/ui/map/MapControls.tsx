export default function MapControls() {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-3">
      <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
        <option>NDVI</option>
        <option>Moisture</option>
        <option>Temperature</option>
      </select>

      <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm">
        <option>Last 15 Days</option>
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
      </select>
    </div>
  );
}