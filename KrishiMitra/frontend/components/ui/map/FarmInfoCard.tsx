export default function FarmInfoCard() {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 w-52">
      <h3 className="font-semibold text-white">
        Your Farm
      </h3>

      <p className="text-slate-400 text-sm mt-1">
        12.4 Acres
      </p>

      <div className="mt-3">
        <p className="text-green-400 font-medium">
          Soybean
        </p>

        <p className="text-xs text-slate-400">
          Suitability 87%
        </p>
      </div>
    </div>
  );
}